import { supabase } from '../../../lib/supabaseClient';
import { getStore } from '../../../lib/storeAccess';
import { reportService } from '../../reports/api/reportService';
import { accountMappingService } from './accountMapping';
import { inventoryService } from '../../inventory/api/inventoryService';
import { fixedAssetService } from './fixedAssetService';
import { fiscalService } from './fiscalService';

export interface AuditIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}

export interface AuditReport {
  score: number;
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  issues: AuditIssue[];
  checkedAt: string;
}

export const accountingAuditService = {
  async runAudit(): Promise<AuditReport> {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) throw new Error("No active company");

    const issues: AuditIssue[] = [];
    let score = 100;

    // 1. Check Trial Balance (System Wide)
    const { data: balances } = await reportService.getAccountBalances();
    const totalDebit = balances?.reduce((sum, b) => sum + (b.total_debit || 0), 0) || 0;
    const totalCredit = balances?.reduce((sum, b) => sum + (b.total_credit || 0), 0) || 0;
    const diff = Math.abs(totalDebit - totalCredit);
    
    // Floating point tolerance
    const isBalanced = diff < 0.1; 

    if (!isBalanced) {
      score -= 40;
      issues.push({
        id: 'trial-balance',
        severity: 'critical',
        title: 'ميزان المراجعة غير متوازن',
        description: `يوجد فرق قدره ${diff.toFixed(2)} بين المدين والدائن في النظام. هذا يشير إلى خلل في القيود.`,
        actionLabel: 'عرض ميزان المراجعة',
        actionPath: '/reports'
      });
    }

    // 2. Check Critical Settings Mapping (Using DB Source of Truth)
    const mapping = await accountMappingService.getCompanyAccountMap(companyId);
    
    const criticalMappings: {key: keyof typeof mapping, label: string}[] = [
      { key: 'defaultRevenueAccountId', label: 'حساب المبيعات (Revenue)' },
      { key: 'accountsReceivableId', label: 'حساب الذمم المدينة (AR)' },
      { key: 'inventoryAccountId', label: 'حساب المخزون (Asset)' },
      { key: 'cogsAccountId', label: 'حساب تكلفة البضاعة (COGS)' },
      { key: 'cashAccountId', label: 'حساب الصندوق/النقد' }
    ];

    let missingMapCount = 0;
    if (mapping) {
        criticalMappings.forEach(map => {
          if (!mapping[map.key]) {
            missingMapCount++;
            issues.push({
              id: `missing-map-${map.key}`,
              severity: 'warning',
              title: `إعداد محاسبي مفقود: ${map.label}`,
              description: 'لم يتم ربط هذا الحساب الافتراضي. قد تفشل العمليات الآلية (مثل الفواتير) في إنشاء القيود.',
              actionLabel: 'إعدادات الربط',
              actionPath: '/settings'
            });
          }
        });
    } else {
        score -= 20;
        issues.push({
            id: 'no-mapping',
            severity: 'critical',
            title: 'لم يتم تكوين إعدادات المحاسبة',
            description: 'جدول ربط الحسابات فارغ تماماً.',
            actionLabel: 'إعدادات المحاسبة',
            actionPath: '/settings'
        });
    }
    
    if (missingMapCount > 0) score -= (missingMapCount * 5);

    // 3. Check Negative Inventory (Accounting Impact)
    const { data: inventory } = await inventoryService.getInventoryLevels();
    const negativeStockItems = inventory?.filter((i: any) => i.quantity < 0) || [];
    
    if (negativeStockItems.length > 0) {
      score -= 10;
      issues.push({
        id: 'negative-stock',
        severity: 'warning',
        title: 'مخزون بالسالب',
        description: `تم رصد ${negativeStockItems.length} منتجات برصيد سالب. هذا يؤثر على دقة تقييم المخزون وتكلفة البضاعة المباعة.`,
        actionLabel: 'إدارة المخزون',
        actionPath: '/inventory'
      });
    }

    // 4. Check Unbalanced Journal Entries (Individual Validity)
    // We fetch recent entries and check equality
    const { data: unbalancedEntries } = await supabase
      .from('journal_entries')
      .select('id, description, total_debit, total_credit') 
      .neq('total_debit', 0) // Basic filter
      .order('created_at', { ascending: false })
      .limit(50);

    // Since Supabase .neq comparison on columns isn't straightforward in standard client without RPC/filter logic sometimes,
    // we do the math in JS for the fetched batch to be safe.
    const actuallyUnbalanced = (unbalancedEntries || []).filter((e: any) => Math.abs(e.total_debit - e.total_credit) > 0.01);
    
    if (actuallyUnbalanced.length > 0) {
        score -= (actuallyUnbalanced.length * 10);
        issues.push({
            id: 'unbalanced-journal',
            severity: 'critical',
            title: 'قيود يومية غير متوازنة',
            description: `تم العثور على ${actuallyUnbalanced.length} قيود غير متوازنة في آخر 50 عملية.`,
            actionLabel: 'القيود اليومية',
            actionPath: '/accounting'
        });
    }

    // 5. Check Fiscal Year Setup
    const { data: fiscalYears } = await fiscalService.getFiscalYears();
    const currentYear = new Date().getFullYear();
    const hasCurrentFiscalYear = fiscalYears.some(y => 
        new Date(y.startDate).getFullYear() === currentYear || 
        new Date(y.endDate).getFullYear() === currentYear
    );

    if (!hasCurrentFiscalYear) {
        score -= 10;
        issues.push({
            id: 'no-fiscal-year',
            severity: 'warning',
            title: 'لم يتم تحديد السنة المالية الحالية',
            description: `يرجى إنشاء سنة مالية للعام ${currentYear} لضمان تنظيم الفترات وإمكانية الإقفال السليم.`,
            actionLabel: 'السنوات المالية',
            actionPath: '/accounting'
        });
    }

    // 6. Check Pending Depreciation (Fixed Assets)
    const { data: assets } = await fixedAssetService.getAssets();
    const activeAssets = assets.filter(a => a.status === 'active');
    
    if (activeAssets.length > 0) {
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0,0,0,0);
        
        const pendingDepreciation = activeAssets.filter(a => {
            if (!a.lastDepreciationDate) return true; // Never depreciated
            return new Date(a.lastDepreciationDate) < currentMonthStart;
        });

        if (pendingDepreciation.length > 0) {
            score -= 5;
            issues.push({
                id: 'pending-depreciation',
                severity: 'info',
                title: 'استحقاق إهلاك الأصول',
                description: `يوجد ${pendingDepreciation.length} أصول لم يتم تسجيل إهلاكها لهذا الشهر بعد.`,
                actionLabel: 'الأصول الثابتة',
                actionPath: '/accounting'
            });
        }
    }

    return {
      score: Math.max(0, score),
      isBalanced,
      totalDebit,
      totalCredit,
      issues,
      checkedAt: new Date().toISOString()
    };
  }
};
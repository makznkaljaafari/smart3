
import { supabase } from '../../../lib/supabaseClient';
import { getStore } from '../../../lib/storeAccess';

export interface AuditIssue {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    actionLabel?: string;
    actionPath?: string;
}

export interface AuditResult {
    score: number;
    isBalanced: boolean;
    totalDebit: number;
    totalCredit: number;
    issues: AuditIssue[];
}

export const accountingAuditService = {
  async runAudit(): Promise<AuditResult> {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) throw new Error("No active company");
    
    let score = 100;
    const issues: AuditIssue[] = [];

    // 1. Check Trial Balance Balance
    const { data: tb, error: tbError } = await supabase.rpc('get_trial_balance', { p_company_id: companyId, p_as_of: new Date().toISOString() });
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    if (!tbError && tb) {
        tb.forEach((row: any) => {
            totalDebit += Number(row.total_debit || 0);
            totalCredit += Number(row.total_credit || 0);
        });

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            score -= 30;
            issues.push({
                id: 'unbalanced-tb',
                severity: 'critical',
                title: 'ميزان المراجعة غير متوازن',
                description: `إجمالي المدين (${totalDebit}) لا يساوي إجمالي الدائن (${totalCredit}).`,
                actionLabel: 'مراجعة القيود',
                actionPath: '/accounting'
            });
        }
    }

    // 2. Check Unmapped Settings
    const { data: mapping } = await supabase.rpc('get_company_account_map', { p_company_id: companyId });
    if (mapping) {
        const missingKeys = Object.entries(mapping).filter(([k, v]) => !v).map(([k]) => k);
        if (missingKeys.length > 0) {
            score -= (missingKeys.length * 5);
            issues.push({
                id: 'missing-mapping',
                severity: 'warning',
                title: 'إعدادات الحسابات غير مكتملة',
                description: `يوجد ${missingKeys.length} حسابات افتراضية غير مربوطة. هذا قد يسبب فشل في الفواتير الآلية.`,
                actionLabel: 'الإعدادات',
                actionPath: '/settings'
            });
        }
    }

    // 3. Check Pending Stocktakes
    const { count: pendingStocktakes } = await supabase.from('stocktakes').select('id', { count: 'exact' }).eq('company_id', companyId).eq('status', 'in_progress');
    if (pendingStocktakes && pendingStocktakes > 0) {
        score -= 10;
        issues.push({
            id: 'pending-stocktake',
            severity: 'info',
            title: 'عمليات جرد معلقة',
            description: `لديك ${pendingStocktakes} عملية جرد قيد التنفيذ.`,
            actionLabel: 'المخزون',
            actionPath: '/inventory'
        });
    }
    
    // 4. Check Unbalanced Journal Entries (Individual)
    const { data: recentEntries } = await supabase.from('journal_entries').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50);
    const actuallyUnbalanced = (recentEntries || []).filter((e: any) => Math.abs(e.total_debit - e.total_credit) > 0.01);
    
    if (actuallyUnbalanced.length > 0) {
        score -= (actuallyUnbalanced.length * 10);
        issues.push({
            id: 'unbalanced-journal',
            // Fix: ensure severity is typed correctly as a literal
            severity: 'critical' as const,
            title: 'قيود يومية غير متوازنة',
            description: `تم العثور على ${actuallyUnbalanced.length} قيود غير متوازنة في آخر 50 عملية.`,
            actionLabel: 'القيود اليومية',
            actionPath: '/accounting'
        });
    }
    
    // 5. Check Fiscal Year
    const { data: openYears } = await supabase.from('fiscal_years').select('id').eq('company_id', companyId).eq('status', 'open');
    if (!openYears || openYears.length === 0) {
         score -= 20;
         issues.push({
            id: 'no-fiscal-year',
            severity: 'warning',
            title: 'لا توجد سنة مالية مفتوحة',
            description: 'يجب فتح سنة مالية جديدة لتسجيل العمليات.',
            actionLabel: 'السنوات المالية',
            actionPath: '/accounting'
        });
    }

    return {
        score: Math.max(0, Math.round(score)),
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
        totalDebit,
        totalCredit,
        issues
    };
  }
};


import React, { useState, useMemo, useCallback } from 'react';
import { Customer } from '../types';
import { X, Send, FileText, Wallet, Brain, Loader, User } from 'lucide-react';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { getStatusInfo, getRiskInfo, formatCurrency } from '../lib/utils';
import { useZustandStore } from '../../../store/useStore';
import { eventBus } from '../../../lib/events';
import { HoloButton } from '../../../components/ui/HoloButton';
import { LangCode, AppTheme } from '../../../types';
import { translations } from '../../../lib/i18n';
import { analyzeCustomerRisk } from '../../../services/aiService';
import { marked } from 'marked';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../../../services/salesService';
import { debtService } from '../../../services/debtService';
import { CustomerContactInfo } from './details/CustomerContactInfo';

export const CustomerDetailsModal: React.FC<{ customer: Customer | null; onClose: () => void; theme: AppTheme; lang: 'ar' | 'en' }> = ({ customer, onClose, theme, lang }) => {
  const { modalRef, headerRef, position, size, handleDragStart } = useDraggableAndResizable({ initialSize: { width: 900, height: 750 }, minSize: { width: 600, height: 500 }});
  const { addToast } = useZustandStore();
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'details' | 'sales' | 'debts'>('details');
  
  const [riskAnalysis, setRiskAnalysis] = useState<{ score: number; summary: string; analysis: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: salesData, isLoading: salesLoading } = useQuery({
      queryKey: ['customerSales', customer?.id],
      queryFn: async () => {
          const { data: allSales } = await salesService.getSalesPaginated({ pageSize: 1000 });
          return allSales.filter(s => s.customerId === customer?.id);
      },
      enabled: !!customer?.id
  });

  const { data: debtsData, isLoading: debtsLoading } = useQuery({
      queryKey: ['customerDebts', customer?.id],
      queryFn: async () => {
          const { data } = await debtService.getDebtsPaginated({ pageSize: 1000 });
          return data.filter(d => d.customerId === customer?.id);
      },
      enabled: !!customer?.id
  });

  const customerSales = useMemo(() => (salesData || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [salesData]);
  const customerDebts = useMemo(() => (debtsData || []).sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()), [debtsData]);

  const handleAnalyzeRisk = useCallback(async () => {
    if (!customer) return;
    setIsAnalyzing(true);
    setRiskAnalysis(null);

    const debtHistory = customerDebts.map(d => ({
        amount: d.amount,
        status: d.status,
        dueDate: d.dueDate,
        paidAmount: d.paidAmount
    }));

    const analysisResult = await analyzeCustomerRisk({
        totalDebt: customer.totalDebt,
        remainingDebt: customer.remainingDebt,
        debtHistory: debtHistory,
    }, lang);

    if (analysisResult) {
        setRiskAnalysis(analysisResult);
    } else {
        addToast({ message: 'Failed to generate AI risk analysis.', type: 'error' });
    }

    setIsAnalyzing(false);
  }, [customer, customerDebts, lang, addToast]);

  if (!customer) return null;

  const status = getStatusInfo(customer.status);
  const risk = getRiskInfo(customer.riskLevel);
  
  const tabs = [
      { id: 'details', label: t.customerInfo || 'التفاصيل', icon: User, count: 0 },
      { id: 'sales', label: t.sales || 'المبيعات', icon: FileText, count: customerSales.length },
      { id: 'debts', label: t.debts || 'الديون', icon: Wallet, count: customerDebts.length },
  ];
  
  const handleSendStatement = () => {
    eventBus.publish({
        id: crypto.randomUUID(),
        type: 'ACCOUNT_STATEMENT_SEND',
        payload: { recipientName: customer.name, recipientEmail: customer.email, balance: formatCurrency(customer.remainingDebt, customer.currency) },
        at: new Date().toISOString(),
        lang: lang as LangCode,
    });
    addToast({ message: `تم إرسال كشف الحساب إلى ${customer.name}`, type: 'success'});
  };

  const isDark = theme.startsWith('dark');
  const cardBg = isDark ? 'bg-gray-800/40 border-white/5' : 'bg-slate-50 border-slate-200';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" onMouseDown={onClose}>
      <div 
        ref={modalRef}
        style={{
            '--modal-x': `${position.x}px`,
            '--modal-y': `${position.y}px`,
            '--modal-width': `${size.width}px`,
            '--modal-height': `${size.height}px`,
        } as React.CSSProperties}
        className={`fixed inset-0 lg:inset-auto lg:left-[var(--modal-x)] lg:top-[var(--modal-y)] lg:w-[var(--modal-width)] h-full lg:h-auto lg:max-h-[90vh] rounded-none lg:rounded-2xl w-full flex flex-col overflow-hidden border-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isDark ? 'bg-gray-900 border-cyan-500/30' : 'bg-white border-slate-200'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header 
          ref={headerRef}
          onMouseDown={handleDragStart}
          className={`p-5 border-b flex justify-between items-start cursor-move ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}
        >
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex-shrink-0 border border-white/20">
                    {customer.avatar ? <img src={customer.avatar} alt={customer.name} className="w-full h-full object-cover rounded-2xl" /> : customer.name[0]}
                </div>
                <div>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{customer.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`${status.className} px-2 py-0.5 text-xs`}>{status.label}</span>
                        <span className={`${risk.className} px-2 py-0.5 text-xs`}>{t.risks}: {risk.label}</span>
                    </div>
                </div>
            </div>
             <div className="flex items-center gap-2">
                <HoloButton variant="secondary" icon={Send} onClick={handleSendStatement} className="!text-xs !py-2">إرسال كشف حساب</HoloButton>
                <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-200 text-slate-500'}`}><X className="w-6 h-6" /></button>
            </div>
        </header>

         <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-gray-400 hover:text-white'}`}>
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                    {tab.count > 0 && <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded-full text-gray-300">{tab.count}</span>}
                </button>
            ))}
        </div>
        
        <main className="overflow-y-auto flex-1 p-6 space-y-6">
          {activeTab === 'details' && (
              <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-xl border ${cardBg}`}>
                          <p className="text-xs text-gray-500 mb-1">إجمالي المبيعات</p>
                          <p className="text-xl font-bold text-green-400">{formatCurrency(customer.totalSalesValue || 0, customer.currency)}</p>
                      </div>
                      <div className={`p-4 rounded-xl border ${cardBg}`}>
                          <p className="text-xs text-gray-500 mb-1">المدفوع</p>
                          <p className="text-xl font-bold text-cyan-400">{formatCurrency(customer.paidAmount, customer.currency)}</p>
                      </div>
                      <div className={`p-4 rounded-xl border ${cardBg}`}>
                          <p className="text-xs text-gray-500 mb-1">الرصيد المستحق</p>
                          <p className="text-xl font-bold text-orange-400">{formatCurrency(customer.remainingDebt, customer.currency)}</p>
                      </div>
                  </div>

                  <CustomerContactInfo customer={customer} />

                  {/* AI Risk Analysis */}
                   <div className={`p-5 rounded-xl border ${isDark ? 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold flex items-center gap-2 text-purple-400"><Brain size={18}/> تحليل المخاطر الذكي</h4>
                          <HoloButton variant="secondary" onClick={handleAnalyzeRisk} disabled={isAnalyzing} className="!py-1 !px-3 !text-xs">
                              {isAnalyzing ? <Loader size={14} className="animate-spin" /> : 'تحديث التحليل'}
                          </HoloButton>
                      </div>
                      {riskAnalysis ? (
                          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                              <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-400">نقاط الثقة</span>
                                  <span className={`text-2xl font-bold ${riskAnalysis.score > 70 ? 'text-green-400' : riskAnalysis.score > 40 ? 'text-yellow-400' : 'text-red-400'}`}>{riskAnalysis.score}/100</span>
                              </div>
                              <p className="text-sm font-medium text-gray-300">{riskAnalysis.summary}</p>
                              <div className="text-xs text-gray-400 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(riskAnalysis.analysis) as string }} />
                          </div>
                      ) : (
                          <p className="text-sm text-gray-500 text-center italic">اضغط تحديث للحصول على تحليل AI لسلوك سداد العميل.</p>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'sales' && (
               <div className="space-y-3">
                  {salesLoading ? <div className="flex justify-center p-4"><Loader className="animate-spin" /></div> :
                   customerSales.length > 0 ? customerSales.map(sale => (
                      <div key={sale.id} className={`p-4 rounded-lg border flex justify-between items-center ${cardBg}`}>
                          <div>
                              <p className="font-bold flex items-center gap-2 text-white">#{sale.invoiceNumber} <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sale.status === 'paid' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-orange-500/30 text-orange-400 bg-orange-500/10'}`}>{sale.status}</span></p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(sale.date).toLocaleDateString(lang)}</p>
                          </div>
                          <div className="text-right">
                              <p className="font-mono font-bold text-cyan-400">{formatCurrency(sale.total, sale.currency || 'SAR')}</p>
                              {sale.remainingAmount > 0 && <p className="text-xs text-orange-400">متبقي: {formatCurrency(sale.remainingAmount, sale.currency || 'SAR')}</p>}
                          </div>
                      </div>
                  )) : <p className="text-center text-gray-500 py-8">لا توجد مبيعات مسجلة.</p>}
               </div>
          )}

           {activeTab === 'debts' && (
               <div className="space-y-3">
                  {debtsLoading ? <div className="flex justify-center p-4"><Loader className="animate-spin" /></div> :
                   customerDebts.length > 0 ? customerDebts.map(debt => (
                      <div key={debt.id} className={`p-4 rounded-lg border flex justify-between items-center ${cardBg}`}>
                          <div>
                              <p className="font-bold text-white">{debt.description || 'دين عام'}</p>
                              <p className="text-xs text-gray-500 mt-1">استحقاق: {new Date(debt.dueDate).toLocaleDateString(lang)}</p>
                          </div>
                          <div className="text-right">
                              <p className="font-mono font-bold text-red-400">{formatCurrency(debt.remainingAmount, debt.currency)}</p>
                              <p className="text-xs text-gray-500">من أصل: {formatCurrency(debt.amount, debt.currency)}</p>
                          </div>
                      </div>
                  )) : <p className="text-center text-gray-500 py-8">لا توجد ديون مسجلة.</p>}
               </div>
          )}
        </main>
        
        <div onMouseDown={handleDragStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 transition-colors hidden lg:block" title="Resize">
          <svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg>
        </div>
      </div>
    </div>
  );
};

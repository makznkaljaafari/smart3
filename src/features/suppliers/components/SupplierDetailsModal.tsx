
import React, { useState, useMemo } from 'react';
import { Supplier, PurchaseInvoice, PurchaseReturn, LangCode } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Edit2, Phone, Mail, DollarSign, Truck, TrendingDown, Info, Send, CreditCard, MapPin } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { formatCurrency } from '../../expenses/lib/utils';
import { PaymentOutModal } from '../../payments/components/PaymentOutModal';
import { PaymentOutDetails } from '../../payments/types';
import { purchaseService } from '../../../services/purchaseService';
import { expenseService } from '../../../services/expenseService';
import { eventBus } from '../../../lib/events';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface SupplierDetailsModalProps {
  supplier: Supplier;
  onClose: () => void;
  onEdit: (supplier: Supplier) => void;
}

export const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({ supplier, onClose, onEdit }) => {
    const { theme, lang, settings, addToast, currentCompany } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
        addToast: state.addToast,
        currentCompany: state.currentCompany
    }));
    const t = translations[lang];
    const queryClient = useQueryClient();
    
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 900, height: 750 }, minSize: { width: 600, height: 500 }});
    const [activeTab, setActiveTab] = useState<'purchases' | 'returns' | 'expenses' | 'notes'>('purchases');
    const [payingPurchase, setPayingPurchase] = useState<PurchaseInvoice | null>(null);

    // Fetch Data
    const { data: purchasesData } = useQuery({
        queryKey: ['supplierPurchases', supplier.id],
        queryFn: async () => {
            const { data } = await purchaseService.getPurchases();
            return data.filter(p => p.supplierId === supplier.id || p.supplierName === supplier.name);
        },
        enabled: !!supplier.id
    });

    const { data: returnsData } = useQuery({
        queryKey: ['supplierReturns', supplier.id],
        queryFn: async () => {
            const { data } = await purchaseService.getPurchaseReturns();
            return data.filter(pr => pr.supplierName === supplier.name);
        },
        enabled: !!supplier.id
    });

    const { data: expensesData } = useQuery({
        queryKey: ['supplierExpenses', supplier.id],
        queryFn: async () => {
            const { data } = await expenseService.getExpenses();
            return data.filter(e => e.supplierId === supplier.id);
        },
        enabled: !!supplier.id
    });

    const supplierPurchases = useMemo(() => (purchasesData || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [purchasesData]);
    const supplierReturns = useMemo(() => (returnsData || []).sort((a,b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime()), [returnsData]);
    const supplierExpenses = useMemo(() => (expensesData || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [expensesData]);


    const tabs = [
        { id: 'purchases', label: t.purchases, icon: Truck, count: supplierPurchases.length },
        { id: 'expenses', label: t.expenses, icon: CreditCard, count: supplierExpenses.length },
        { id: 'returns', label: 'المرتجعات', icon: TrendingDown, count: supplierReturns.length },
        { id: 'notes', label: t.notes, icon: Info, count: supplier.notes ? 1 : 0 },
    ];

    const handleSendStatement = () => {
        eventBus.publish({
            id: crypto.randomUUID(),
            type: 'ACCOUNT_STATEMENT_SEND',
            payload: { recipientName: supplier.name, recipientEmail: supplier.email, balance: formatCurrency(supplier.outstandingBalance, supplier.currency) },
            at: new Date().toISOString(),
            lang: lang as LangCode,
        });
        addToast({ message: `تم إرسال كشف الحساب إلى ${supplier.name}`, type: 'success'});
    };
    
    const handlePayClick = (purchase: PurchaseInvoice) => {
        setPayingPurchase(purchase);
    };

    const handleClosePaymentModal = () => {
        setPayingPurchase(null);
    };
    
    const handleSavePayment = async (paymentDetails: PaymentOutDetails) => {
        if (!payingPurchase) return;
        
        const { error } = await purchaseService.recordPayment(payingPurchase.id, paymentDetails);

        if (error) {
            addToast({ message: error.message, type: 'error' });
            return;
        }

        addToast({ message: 'تم تسجيل الدفعة بنجاح.', type: 'success' });
        
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['supplierPurchases', supplier.id] });
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        queryClient.invalidateQueries({ queryKey: ['supplierStats'] });
        queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
        
        handleClosePaymentModal();
    };
    
    const isDark = theme === 'dark';
    const cardBg = isDark ? 'bg-gray-800/40 border-white/5' : 'bg-slate-50 border-slate-200';

    return (
      <>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border-2 ${isDark ? 'bg-gray-900 border-cyan-500/30' : 'bg-white border-slate-200'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-5 border-b flex justify-between items-start cursor-move ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)] flex-shrink-0 border border-white/20">
                            {supplier.name[0]}
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{supplier.name}</h2>
                             <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm opacity-70">
                                {supplier.phone && <span className="flex items-center gap-1"><Phone size={12}/> {supplier.phone}</span>}
                                {supplier.address && <span className="flex items-center gap-1"><MapPin size={12}/> {supplier.address}</span>}
                            </div>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <HoloButton icon={Send} variant="secondary" onClick={handleSendStatement} className="!text-xs !py-2">كشف حساب</HoloButton>
                        <button onClick={() => onEdit(supplier)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-200 text-slate-500'}`}><Edit2 size={20} /></button>
                        <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20} /></button>
                    </div>
                </div>

                <div className={`grid grid-cols-2 gap-4 p-6 border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900/50 border-white/5' : 'bg-white border-slate-200'}`}>
                        <p className="text-sm text-gray-500 mb-1">{t.totalPurchasesValue}</p>
                        <p className="text-2xl font-bold text-green-400 font-mono">{formatCurrency(supplier.totalPurchasesValue, supplier.currency)}</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900/50 border-white/5' : 'bg-white border-slate-200'}`}>
                        <p className="text-sm text-gray-500 mb-1">{t.outstandingBalance}</p>
                        <p className="text-2xl font-bold text-orange-400 font-mono">{formatCurrency(supplier.outstandingBalance, supplier.currency)}</p>
                    </div>
                </div>

                <div className={`border-b flex items-stretch ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-gray-400 hover:text-white'}`}>
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                            {tab.count > 0 && <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded-full text-gray-300">{tab.count}</span>}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {activeTab === 'purchases' && (
                        supplierPurchases.length > 0 ? (
                            <div className="space-y-3">
                            {supplierPurchases.map((p) => (
                                <div key={p.id} className={`p-4 rounded-xl border flex justify-between items-center ${cardBg}`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                             <p className="font-bold text-white">#{p.invoiceNumber}</p>
                                             <span className={`text-[10px] px-2 py-0.5 rounded-full border ${p.remainingAmount > 0 ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                                                 {p.remainingAmount > 0 ? 'متبقي' : 'مدفوع'}
                                             </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{formatDate(p.date)}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-mono font-bold text-cyan-400">{formatCurrency(p.total, settings.baseCurrency)}</p>
                                            {p.remainingAmount > 0 && <p className="text-xs text-orange-400 font-mono">متبقي: {formatCurrency(p.remainingAmount, settings.baseCurrency)}</p>}
                                        </div>
                                        {p.remainingAmount > 0 && (
                                            <button onClick={() => handlePayClick(p)} className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 border border-green-500/30"><DollarSign size={16}/></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            </div>
                        ) : <div className="flex flex-col items-center justify-center py-12 text-gray-500"><Truck size={48} className="mb-4 opacity-20"/><p>لا توجد فواتير شراء مسجلة.</p></div>
                    )}
                     {activeTab === 'expenses' && (
                        supplierExpenses.length > 0 ? (
                            <div className="space-y-3">
                                {supplierExpenses.map((e) => (
                                    <div key={e.id} className={`p-4 rounded-xl border flex justify-between items-center ${cardBg}`}>
                                         <div>
                                            <p className="font-bold text-white">{e.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">{formatDate(e.date)}</p>
                                        </div>
                                        <p className="font-mono font-bold text-white">{formatCurrency(e.amount, e.currency)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : <div className="flex flex-col items-center justify-center py-12 text-gray-500"><CreditCard size={48} className="mb-4 opacity-20"/><p>لا توجد مصروفات مرتبطة.</p></div>
                    )}
                    {activeTab === 'returns' && (
                        supplierReturns.length > 0 ? (
                            <div className="space-y-3">
                                {supplierReturns.map((pr) => (
                                    <div key={pr.id} className={`p-4 rounded-xl border flex justify-between items-center ${cardBg}`}>
                                        <div>
                                            <p className="font-bold text-white">مرتجع شراء</p>
                                            <p className="text-xs text-gray-500 mt-1">{formatDate(pr.returnDate)}</p>
                                        </div>
                                        <p className="font-mono font-bold text-red-400">-{formatCurrency(pr.totalReturnValue, settings.baseCurrency)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : <div className="flex flex-col items-center justify-center py-12 text-gray-500"><TrendingDown size={48} className="mb-4 opacity-20"/><p>لا توجد مرتجعات.</p></div>
                    )}
                     {activeTab === 'notes' && (
                        <div className={`p-6 rounded-xl border min-h-[200px] ${cardBg}`}>
                            <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">{supplier.notes || 'لا توجد ملاحظات مسجلة.'}</p>
                        </div>
                    )}
                </div>

                 <div onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 transition-colors hidden lg:block" title="Resize">
                    <svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg>
                </div>
            </div>
        </div>
        {payingPurchase && (
            <PaymentOutModal
                payable={{
                    id: payingPurchase.id,
                    type: 'purchase',
                    description: `فاتورة شراء #${payingPurchase.invoiceNumber}`,
                    remainingAmount: payingPurchase.remainingAmount,
                    currency: settings.baseCurrency,
                }}
                onClose={handleClosePaymentModal}
                onSave={handleSavePayment}
            />
        )}
      </>
    );
};

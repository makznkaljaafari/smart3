
import React, { useState, useMemo } from 'react';
import { SalesInvoice, CurrencyCode } from '../../../types';
import { PaymentMethod } from '../../debts/types';
import { X, Save } from 'lucide-react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { useZustandStore } from '../../../store/useStore';
import { Toggle } from '../../../components/ui/Toggle';
import { translations, currencyLabels } from '../../../lib/i18n';
import { formatCurrency } from '../../expenses/lib/utils';

interface PaymentInDetails {
    amount: number;
    currency: CurrencyCode;
    date: string;
    method: PaymentMethod;
    notes: string;
    depositAccountId: string; // The asset account receiving money
    sendReceipt?: boolean;
}

interface PaymentInModalProps {
  invoice: SalesInvoice;
  onClose: () => void;
  onSave: (paymentDetails: PaymentInDetails) => Promise<void>;
}

export const PaymentInModal: React.FC<PaymentInModalProps> = ({ invoice, onClose, onSave }) => {
    const { theme, lang, accounts, settings } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        accounts: state.accounts,
        settings: state.settings,
    }));
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart } = useDraggableAndResizable({ initialSize: { width: 600, height: 650 }});
    const [isSaving, setIsSaving] = useState(false);

    // Filter and Group Accounts (Assets for receiving money)
    const { connectedAccounts, otherAssetAccounts } = useMemo(() => {
        const assets = accounts.filter(a => a.type === 'asset' && !a.isPlaceholder);
        const connectedNames = new Set(settings.integrations.bankConnections?.map(c => c.bankName) || []);
        
        const connected = assets.filter(a => connectedNames.has(a.name) || a.name.includes('بنك') || a.name.includes('Bank') || a.name.includes('صراف'));
        const others = assets.filter(a => !connected.includes(a));
        
        return { connectedAccounts: connected, otherAssetAccounts: others };
    }, [accounts, settings.integrations.bankConnections]);

    const [formData, setFormData] = useState<Omit<PaymentInDetails, 'sendReceipt'>>({
        amount: invoice.remainingAmount,
        currency: invoice.currency || settings.baseCurrency, 
        date: new Date().toISOString().split('T')[0],
        method: 'cash',
        notes: '',
        // Default to first cash/bank account found
        depositAccountId: connectedAccounts.length > 0 ? connectedAccounts[0].id : (otherAssetAccounts.find(a => a.name.toLowerCase().includes('cash') || a.name.includes('نقد'))?.id || otherAssetAccounts[0]?.id || ''),
    });
    const [sendReceipt, setSendReceipt] = useState(false);

    const handleChange = (field: keyof Omit<PaymentInDetails, 'sendReceipt'>, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (isSaving || !formData.depositAccountId || formData.amount <= 0) {
            return;
        }
        if (formData.amount > invoice.remainingAmount && formData.currency === invoice.currency) {
             if (!confirm(lang === 'ar' ? 'المبلغ المدخل أكبر من المبلغ المتبقي. هل أنت متأكد؟' : 'Amount exceeds remaining balance. Are you sure?')) {
                 return;
             }
        }

        setIsSaving(true);
        try {
            await onSave({ ...formData, sendReceipt });
        } finally {
            setIsSaving(false);
        }
    };

    const formInputClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;
    const labelClasses = `block text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`;

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-2xl font-bold">{lang === 'ar' ? 'تسجيل دفعة (مبيعات)' : 'Record Payment (Sales)'}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                        <p className="text-sm text-cyan-400">{t.invoiceNumber}: {invoice.invoiceNumber}</p>
                        <p className="font-semibold text-white">{invoice.customerName}</p>
                        <div className="flex justify-between mt-2">
                             <span className="text-sm text-gray-400">{t.total}: {formatCurrency(invoice.total, invoice.currency)}</span>
                             <span className="text-lg font-bold text-green-400">{t.remainingAmount}: {formatCurrency(invoice.remainingAmount, invoice.currency)}</span>
                        </div>
                    </div>
                    
                    <div>
                        <label className={labelClasses}>{t.amountPaid}</label>
                        <input 
                            type="number" 
                            value={formData.amount} 
                            onChange={e => handleChange('amount', parseFloat(e.target.value))} 
                            className={formInputClasses} 
                            // max={invoice.remainingAmount} // Removed max constraint to allow different currencies/overpayment if needed
                        />
                    </div>
                    
                     <div>
                        <label className={labelClasses}>{t.currency || 'العملة'}</label>
                        <select value={formData.currency} onChange={(e) => handleChange('currency', e.target.value as CurrencyCode)} className={formInputClasses}>
                            {settings.enabledCurrencies.map(c => {
                                const label = currencyLabels[c] ? currencyLabels[c][lang] : c;
                                return <option key={c} value={c}>{label} ({c})</option>;
                            })}
                        </select>
                    </div>

                    <div>
                        <label className={labelClasses}>{t.date}</label>
                        <input type="date" value={formData.date} onChange={e => handleChange('date', e.target.value)} className={formInputClasses} />
                    </div>
                    
                    <div>
                        <label className={labelClasses}>{t.paymentMethod}</label>
                        <select value={formData.method} onChange={e => handleChange('method', e.target.value)} className={formInputClasses}>
                            <option value="cash">{lang === 'ar' ? 'نقد' : 'Cash'}</option>
                            <option value="bank_transfer">{lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                            <option value="cheque">{lang === 'ar' ? 'شيك' : 'Cheque'}</option>
                            <option value="credit_card">{lang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</option>
                            <option value="exchange">{lang === 'ar' ? 'صرافة' : 'Exchange'}</option>
                            <option value="other">{lang === 'ar' ? 'أخرى' : 'Other'}</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className={labelClasses}>{lang === 'ar' ? 'إيداع في حساب' : 'Deposit to Account'}</label>
                        <select value={formData.depositAccountId} onChange={e => handleChange('depositAccountId', e.target.value)} className={formInputClasses}>
                            <option value="">{t.selectAnAccount}</option>
                            {connectedAccounts.length > 0 && (
                                <optgroup label={lang === 'ar' ? 'البنوك المرتبطة' : 'Connected Banks'}>
                                    {connectedAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </optgroup>
                            )}
                            <optgroup label={lang === 'ar' ? 'أصول أخرى' : 'Other Assets'}>
                                {otherAssetAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </optgroup>
                        </select>
                    </div>
                    
                    <div>
                        <label className={labelClasses}>{t.notes}</label>
                        <textarea value={formData.notes} onChange={e => handleChange('notes', e.target.value)} className={formInputClasses} rows={2} />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <label className="block text-sm font-medium text-gray-300">{lang === 'ar' ? 'إرسال إيصال للعميل' : 'Send receipt to customer'}</label>
                      <Toggle checked={sendReceipt} onChange={setSendReceipt} />
                    </div>
                </div>
                <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'} flex justify-end gap-3`}>
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-800">{t.cancel}</button>
                    <HoloButton variant="success" icon={Save} onClick={handleSubmit} disabled={isSaving}>{isSaving ? t.saving : t.save}</HoloButton>
                </div>
            </div>
        </div>
    );
};


import React, { useState, useMemo } from 'react';
import { CurrencyCode, Account } from '../../../types';
import { PaymentOutDetails } from '../types';
import { X, Save } from 'lucide-react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { useZustandStore } from '../../../store/useStore';
import { Toggle } from '../../../components/ui/Toggle';
import { translations } from '../../../lib/i18n';
import { formatCurrency } from '../../expenses/lib/utils';
import { PaymentMethod } from '../../debts/types';

export interface Payable {
    id: string;
    type: 'expense' | 'purchase';
    description: string;
    remainingAmount: number;
    currency: CurrencyCode;
}

interface PaymentOutModalProps {
  payable: Payable;
  onClose: () => void;
  onSave: (paymentDetails: PaymentOutDetails) => Promise<void>;
}

export const PaymentOutModal: React.FC<PaymentOutModalProps> = ({ payable, onClose, onSave }) => {
    const { theme, lang, accounts, settings } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        accounts: state.accounts,
        settings: state.settings,
    }));
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 600, height: 650 }});
    const [isSaving, setIsSaving] = useState(false);

    // Filter and Group Accounts
    const { connectedAccounts, otherAssetAccounts } = useMemo(() => {
        const assets = accounts.filter(a => a.type === 'asset' && !a.isPlaceholder);
        const connectedNames = new Set(settings.integrations.bankConnections?.map(c => c.bankName) || []);
        
        const connected = assets.filter(a => connectedNames.has(a.name) || a.name.includes('بنك') || a.name.includes('Bank') || a.name.includes('صراف'));
        const others = assets.filter(a => !connected.includes(a));
        
        return { connectedAccounts: connected, otherAssetAccounts: others };
    }, [accounts, settings.integrations.bankConnections]);

    const [formData, setFormData] = useState<Omit<PaymentOutDetails, 'sendReceipt'>>({
        amount: payable.remainingAmount,
        currency: payable.currency,
        date: new Date().toISOString().split('T')[0],
        method: 'cash',
        notes: '',
        // Default to first connected bank if available
        paymentAccountId: connectedAccounts.length > 0 ? connectedAccounts[0].id : (otherAssetAccounts.find(a => a.name.toLowerCase().includes('cash'))?.id || otherAssetAccounts[0]?.id || ''),
    });
    const [sendReceipt, setSendReceipt] = useState(false);

    const handleChange = (field: keyof Omit<PaymentOutDetails, 'sendReceipt'>, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (isSaving || !formData.paymentAccountId || formData.amount <= 0) {
            // Add validation feedback
            return;
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
                    <h3 className="text-2xl font-bold">تسديد دفعة</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-400">{payable.type === 'expense' ? 'المصروف' : 'فاتورة الشراء'}</p>
                        <p className="font-semibold text-white">{payable.description}</p>
                        <p className="text-lg font-bold text-orange-400 mt-2">{formatCurrency(payable.remainingAmount, payable.currency)}</p>
                    </div>
                    <div><label className={labelClasses}>مبلغ الدفعة</label><input type="number" value={formData.amount} onChange={e => handleChange('amount', parseFloat(e.target.value))} className={formInputClasses} /></div>
                    <div><label className={labelClasses}>تاريخ الدفع</label><input type="date" value={formData.date} onChange={e => handleChange('date', e.target.value)} className={formInputClasses} /></div>
                    <div>
                        <label className={labelClasses}>طريقة الدفع</label>
                        <select value={formData.method} onChange={e => handleChange('method', e.target.value as PaymentMethod)} className={formInputClasses}>
                            <option value="cash">نقداً</option>
                            <option value="bank_transfer">تحويل بنكي</option>
                            <option value="cheque">شيك</option>
                            <option value="credit_card">بطاقة ائتمان</option>
                            <option value="exchange">صرافة</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClasses}>الدفع من حساب (دائن)</label>
                        <select value={formData.paymentAccountId} onChange={e => handleChange('paymentAccountId', e.target.value)} className={formInputClasses}>
                            <option value="">اختر حساب...</option>
                            {connectedAccounts.length > 0 && (
                                <optgroup label="البنوك والصرافات المرتبطة">
                                    {connectedAccounts.map(acc => <option key={acc.id} value={acc.id}>🏦 {acc.name}</option>)}
                                </optgroup>
                            )}
                            <optgroup label="حسابات أخرى">
                                {otherAssetAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </optgroup>
                        </select>
                    </div>
                    <div><label className={labelClasses}>ملاحظات</label><textarea value={formData.notes} onChange={e => handleChange('notes', e.target.value)} className={formInputClasses} rows={2} /></div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <label className="block text-sm font-medium text-gray-300">إرسال إيصال للمورد</label>
                      <Toggle checked={sendReceipt} onChange={setSendReceipt} />
                    </div>
                </div>
                <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'} flex justify-end gap-3`}>
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-800">إلغاء</button>
                    <HoloButton variant="success" icon={Save} onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'جاري الحفظ...' : 'حفظ الدفعة'}</HoloButton>
                </div>
            </div>
        </div>
    );
};

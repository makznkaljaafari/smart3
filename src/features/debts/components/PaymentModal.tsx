
import React, { useState, useMemo } from 'react';
import { Debt, Payment, PaymentMethod, CurrencyCode, ExchangeRate, Account, DebtPaymentDetails, Toast } from '../../../types';
import { X, Save, TrendingUp, BookCopy, Building2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { Toggle } from '../../../components/ui/Toggle';
import { currencyLabels, translations } from '../../../lib/i18n';
import { getLatestRate } from '../../../lib/currency';
import { useZustandStore } from '../../../store/useStore';

interface PaymentModalProps {
  debt: Debt;
  onClose: () => void;
  onSave: (debtId: string, paymentData: DebtPaymentDetails) => Promise<void>;
  exchangeRates: ExchangeRate[];
  enabledCurrencies: CurrencyCode[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ debt, onClose, onSave, exchangeRates, enabledCurrencies }) => {
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
    initialSize: { width: 768, height: 700 },
    minSize: { width: 500, height: 500 }
  });
  const accounts = useZustandStore(state => state.accounts);
  const settings = useZustandStore(state => state.settings);
  const addToast = useZustandStore(state => state.addToast);
  const lang = useZustandStore(state => state.lang);
  const t = translations[lang];

  // Filter and Group Accounts
  const { connectedAccounts, otherAssetAccounts } = useMemo(() => {
    const assets = accounts.filter(a => a.type === 'asset' && !a.isPlaceholder);
    const connectedNames = new Set(settings.integrations.bankConnections?.map(c => c.bankName) || []);
    
    const connected = assets.filter(a => connectedNames.has(a.name) || a.name.includes('بنك') || a.name.includes('Bank') || a.name.includes('صراف'));
    const others = assets.filter(a => !connected.includes(a));
    
    return { connectedAccounts: connected, otherAssetAccounts: others };
  }, [accounts, settings.integrations.bankConnections]);


  const [formData, setFormData] = useState({
    amount: debt.remainingAmount,
    currency: debt.currency,
    date: new Date().toISOString().split('T')[0],
    method: 'cash' as PaymentMethod,
    notes: '',
    receiptNumber: '',
    // Default to first connected account if available, else cash
    depositAccountId: connectedAccounts.length > 0 ? connectedAccounts[0].id : (otherAssetAccounts.find(a => a.accountNumber === '1111')?.id || otherAssetAccounts[0]?.id || '') 
  });
  const [sendReceipt, setSendReceipt] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const convertedValue = useMemo(() => {
    if (formData.currency === debt.currency) return null;
    const rateInfo = getLatestRate(formData.currency, debt.currency, exchangeRates);
    if (!rateInfo) return { amount: null, rate: null };
    return {
        amount: formData.amount * rateInfo.rate,
        rate: rateInfo.rate
    };
  }, [formData.amount, formData.currency, debt.currency, exchangeRates]);


  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.amount || formData.amount < 0) newErrors.amount = 'المبلغ مطلوب';
    if (!formData.depositAccountId) newErrors.depositAccountId = 'حساب الإيداع مطلوب';
    
    let amountInDebtCurrency = formData.amount;
    if (convertedValue && convertedValue.amount !== null) {
      amountInDebtCurrency = convertedValue.amount;
    }

    if (amountInDebtCurrency > debt.remainingAmount && formData.currency === debt.currency) {
      // Allow overpayment, but could add a warning here if needed.
    }
    
    if (!formData.date) newErrors.date = 'تاريخ الدفع مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(debt.id, { ...formData, amount: Number(formData.amount), sendReceipt });
      onClose();
    } catch (error: any) {
      console.error("Failed to save payment:", error);
      const errorMessage = error?.message || error?.details || t.unexpectedError || 'An unexpected error occurred.';
      addToast({ message: `${t.failedToSavePayment || 'Failed to save payment'}: ${errorMessage}`, type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  const inputClass = (field: keyof typeof formData) =>
    `w-full px-4 py-2.5 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white ${
      errors[field] ? 'border-red-500/50' : 'border-gray-700'
    }`;

  return (
    <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
      <div 
        ref={modalRef}
        style={{
            '--modal-x': `${position.x}px`,
            '--modal-y': `${position.y}px`,
            '--modal-width': `${size.width}px`,
            '--modal-height': `${size.height}px`,
        } as React.CSSProperties}
        className="fixed inset-0 md:inset-auto md:left-[var(--modal-x)] md:top-[var(--modal-y)] md:w-[var(--modal-width)] md:h-[var(--modal-height)] bg-gray-900 rounded-none md:rounded-2xl flex flex-col border-2 border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.3)]" 
        onMouseDown={e => e.stopPropagation()}
      >
        <div 
          ref={headerRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="bg-gray-800 text-white p-6 border-b border-green-500/30 cursor-move"
        >
          <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold mb-1">تسجيل دفعة جديدة</h2><p className="text-green-200">{debt.customerName}</p></div><button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-6 h-6" /></button></div>
        </div>
        <div className="p-6 bg-gray-800 border-b border-green-500/30">
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-sm text-gray-400">المبلغ الكلي</p><p className="font-bold text-white">{formatCurrency(debt.amount, debt.currency)}</p></div>
            <div><p className="text-sm text-gray-400">المدفوع</p><p className="font-bold text-green-400">{formatCurrency(debt.paidAmount, debt.currency)}</p></div>
            <div><p className="text-sm text-gray-400">المتبقي</p><p className="font-bold text-red-400">{formatCurrency(debt.remainingAmount, debt.currency)}</p></div>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">مبلغ الدفعة *</label>
              <input type="number" value={formData.amount} onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)} className={inputClass('amount')} />
              {errors.amount && <p className="mt-1 text-sm text-red-400">{errors.amount}</p>}
            </div>
             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">العملة *</label>
              <select value={formData.currency} onChange={(e) => handleChange('currency', e.target.value as CurrencyCode)} className={inputClass('currency')}>
                {enabledCurrencies.map(c => <option key={c} value={c}>{currencyLabels[c]['ar']} ({c})</option>)}
              </select>
            </div>
          </div>

          {convertedValue && (
            <div className="p-3 bg-cyan-950 border border-cyan-500/30 rounded-lg text-sm flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                {convertedValue.amount !== null ? (
                    <div>
                        <span className="text-gray-300">يعادل تقريبًا: </span>
                        <span className="font-bold text-white">{formatCurrency(convertedValue.amount, debt.currency)}</span>
                        <span className="text-xs text-gray-400 font-mono"> (1 {formData.currency} ≈ {convertedValue.rate?.toFixed(4)} {debt.currency})</span>
                    </div>
                ) : (
                    <span className="text-yellow-400">لا يوجد سعر صرف متاح لهذه العملة.</span>
                )}
            </div>
          )}

          <div><label className="block text-sm font-medium text-gray-300 mb-2">تاريخ الدفع *</label><input type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} className={inputClass('date')} />{errors.date && <p className="mt-1 text-sm text-red-400">{errors.date}</p>}</div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">طريقة الدفع</label>
            <select value={formData.method} onChange={(e) => handleChange('method', e.target.value as PaymentMethod)} className={inputClass('method')}>
                <option value="cash">نقداً</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
                <option value="card">بطاقة</option>
                <option value="exchange">صرافة</option>
                <option value="other">أخرى</option>
            </select>
          </div>
          
           <div className="pt-4 border-t border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><BookCopy size={16} /> إيداع في حساب (مدين) *</label>
                <select value={formData.depositAccountId} onChange={(e) => handleChange('depositAccountId', e.target.value)} className={inputClass('depositAccountId')}>
                    <option value="">اختر حساب الإيداع</option>
                    {connectedAccounts.length > 0 && (
                        <optgroup label="البنوك والصرافات المرتبطة">
                            {connectedAccounts.map(acc => <option key={acc.id} value={acc.id}>🏦 {acc.name}</option>)}
                        </optgroup>
                    )}
                    <optgroup label="حسابات أخرى">
                        {otherAssetAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </optgroup>
                </select>
                {errors.depositAccountId && <p className="mt-1 text-sm text-red-400">{errors.depositAccountId}</p>}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <label className="block text-sm font-medium text-gray-300">إرسال إيصال للعميل</label>
              <Toggle checked={sendReceipt} onChange={setSendReceipt} />
            </div>

        </form>
        <div className="mt-auto border-t border-green-500/30 p-4">
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-700 font-semibold transition-colors">إلغاء</button>
            <HoloButton variant="success" icon={Save} onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'جاري الحفظ...' : 'حفظ الدفعة'}
            </HoloButton>
          </div>
        </div>
         <div 
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-green-400 transition-colors hidden md:block"
          title="Resize"
        >
          <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0V16H0L16 0Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  );
};
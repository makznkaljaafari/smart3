
import React from 'react';
import { useZustandStore } from '../../../../store/useStore';
import { translations } from '../../../../lib/i18n';
import { HoloButton } from '../../../../components/ui/HoloButton';
import { Textarea } from '../../../../components/ui/Textarea';
import { Label } from '../../../../components/ui/Label';
import { Select } from '../../../../components/ui/Select';
import { Input } from '../../../../components/ui/Input';
import { formatCurrency } from '../../../../lib/formatters';
import { PaymentMethod, Account, CurrencyCode } from '../../../../types';
import { Receipt, Wallet, Landmark, CreditCard, ArrowRightLeft, Save, Loader } from 'lucide-react';

interface InvoiceFooterProps {
    invoiceType: 'cash' | 'credit';
    notes: string;
    setNotes: (val: string) => void;
    amountPaid: number;
    setAmountPaid: (val: number) => void;
    paymentMethod: PaymentMethod;
    setPaymentMethod: (method: PaymentMethod) => void;
    depositAccountId: string;
    setDepositAccountId: (id: string) => void;
    accountGroups: { cash: Account[], bank: Account[], exchange: Account[], other: Account[] };
    calculations: { subtotal: number, total: number, remainingAmount: number };
    currency: CurrencyCode;
    discount: number;
    setDiscount: (val: number) => void;
    tax: number;
    setTax: (val: number) => void;
    isSaving: boolean;
    onSave: () => void;
    sendInvoice: boolean;
    setSendInvoice: (val: boolean) => void;
}

export const InvoiceFooter: React.FC<InvoiceFooterProps> = ({
    invoiceType,
    notes, setNotes,
    amountPaid, setAmountPaid,
    paymentMethod, setPaymentMethod,
    depositAccountId, setDepositAccountId,
    accountGroups,
    calculations,
    currency,
    discount, setDiscount,
    tax, setTax,
    isSaving, onSave
}) => {
    const { theme, lang } = useZustandStore();
    const t = translations[lang];
    
    const summaryLabelClasses = theme === 'dark' ? 'text-gray-400' : 'text-slate-500';
    
    const paymentMethodsConfig = [
        { id: 'cash', label: 'نقداً', icon: Wallet, color: 'text-emerald-500', activeBg: 'bg-emerald-500/10 border-emerald-500' },
        { id: 'bank_transfer', label: 'تحويل', icon: Landmark, color: 'text-blue-500', activeBg: 'bg-blue-500/10 border-blue-500' },
        { id: 'credit_card', label: 'بطاقة', icon: CreditCard, color: 'text-purple-500', activeBg: 'bg-purple-500/10 border-purple-500' },
        { id: 'cheque', label: 'شيك', icon: Receipt, color: 'text-yellow-500', activeBg: 'bg-yellow-500/10 border-yellow-500' },
        { id: 'exchange', label: 'صرافة', icon: ArrowRightLeft, color: 'text-orange-500', activeBg: 'bg-orange-500/10 border-orange-500' },
    ];

    return (
        <>
        <div className="mt-8 flex flex-col md:flex-row gap-8 items-start">
            <div className="space-y-4 flex-1 w-full">
                <div>
                    <Label>{t.notes}</Label>
                    <Textarea rows={3} placeholder="ملاحظات إضافية..." value={notes} onChange={e => setNotes(e.target.value)} className="text-sm" />
                </div>
                
                 {/* Enhanced Payment Details Card */}
                 {(invoiceType === 'cash' || amountPaid > 0) && (
                    <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800/40 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200 shadow-sm'}`}>
                         <div className={`px-4 py-3 border-b flex items-center gap-2 ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-100/50 border-emerald-200'}`}>
                            <Receipt size={18} className="text-emerald-500" />
                            <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800'}`}>استلام المبلغ (قبض)</h4>
                         </div>
                         
                        <div className="p-4 space-y-4">
                            <div>
                                <Label className="text-xs text-gray-500 mb-2 block">{t.paymentMethod}</Label>
                                <div className="grid grid-cols-5 gap-2">
                                    {paymentMethodsConfig.map((method) => (
                                        <button 
                                            key={method.id} 
                                            type="button" 
                                            onClick={() => setPaymentMethod(method.id as PaymentMethod)} 
                                            className={`flex flex-col items-center justify-center py-3 px-1 rounded-lg border transition-all duration-200 ${
                                                paymentMethod === method.id 
                                                ? `${method.activeBg} ${theme === 'dark' ? 'bg-opacity-20' : 'bg-opacity-10'} border-${method.color.split('-')[1]}-500` 
                                                : `border-transparent ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200'}`
                                            }`}
                                        >
                                            <method.icon size={20} className={`mb-1.5 ${paymentMethod === method.id ? method.color : 'text-gray-400'}`} />
                                            <span className={`text-[10px] font-bold whitespace-nowrap ${paymentMethod === method.id ? method.color : 'text-gray-500'}`}>{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <Label className="text-xs text-gray-500 mb-1 block">إيداع في حساب</Label>
                                <div className="relative">
                                    <Select value={depositAccountId} onChange={e => setDepositAccountId(e.target.value)} className={`!text-sm !py-2 !pl-9 ${theme === 'dark' ? '!bg-gray-900' : '!bg-white'}`}>
                                        {accountGroups.cash.length === 0 && accountGroups.bank.length === 0 && <option value="">لا توجد حسابات</option>}
                                        {Object.entries(accountGroups).map(([key, group]) => {
                                            const accounts = group as Account[];
                                            return accounts.length > 0 && (
                                                <optgroup key={key} label={key}>
                                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                                </optgroup>
                                            );
                                        })}
                                    </Select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <Wallet size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                 )}
            </div>
            
            <div className={`w-full md:w-96 shrink-0 p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-800/30 border border-gray-700' : 'bg-white border border-slate-200 shadow-sm'}`}>
                <h4 className="font-bold mb-4 text-sm border-b border-dashed border-gray-500 pb-2 opacity-70">{t.invoiceSummary}</h4>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center"><span className={summaryLabelClasses}>{t.subtotal}</span><span className="font-mono font-semibold">{formatCurrency(calculations.subtotal, currency)}</span></div>
                    <div className="flex justify-between items-center">
                        <span className={summaryLabelClasses}>{t.discount}</span>
                        <div className="flex items-center w-24">
                            <Input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="text-center !p-1 !h-7 text-xs" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className={summaryLabelClasses}>{t.tax}</span>
                        <div className="flex items-center w-24">
                            <Input type="number" value={tax} onChange={e => setTax(Number(e.target.value))} className="text-center !p-1 !h-7 text-xs" />
                        </div>
                    </div>
                    
                    <div className={`border-t my-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>

                    <div className="flex justify-between items-center">
                        <span className="font-bold text-base">{t.grandTotal}</span>
                        <span className="font-mono text-xl font-bold text-cyan-500">{formatCurrency(calculations.total, currency)}</span>
                    </div>
                </div>
                
                 {invoiceType === 'credit' && (
                    <div className={`mt-4 pt-4 border-t border-dashed ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'} space-y-3`}>
                         <div className="flex justify-between items-center">
                             <span className="text-sm font-medium">{t.amountPaid}</span>
                             <Input type="number" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} className="w-32 text-center !p-1 font-mono text-green-500 font-bold" />
                         </div>
                         <div className={`flex justify-between items-center`}>
                            <span className="text-sm font-medium">{t.remainingAmount}</span>
                            <span className="font-mono font-bold text-orange-500">{formatCurrency(calculations.remainingAmount, currency)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className={`flex justify-between items-center pt-6 mt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
             <div />
            <HoloButton variant="success" icon={isSaving ? Loader : Save} onClick={onSave} disabled={isSaving} className="px-6">
                {isSaving ? 'جاري الحفظ...' : t.saveAndPrint}
            </HoloButton>
        </div>
        </>
    );
};

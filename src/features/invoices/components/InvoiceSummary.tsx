import React from 'react';
import { useZustandStore } from '../../../store/useStore';
import { PaymentMethod } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { formatCurrency } from '../../../lib/formatters';

interface InvoiceSummaryProps {
    subtotal: number;
    discount: number;
    onDiscountChange: (value: number) => void;
    tax: number;
    onTaxChange: (value: number) => void;
    total: number;
    amountPaid: number;
    onAmountPaidChange: (value: number) => void;
    paymentMethod: PaymentMethod;
    onPaymentMethodChange: (value: PaymentMethod) => void;
    remainingAmount: number;
    invoiceType: 'cash' | 'credit';
    t: Record<string, string>;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
    subtotal, discount, onDiscountChange, tax, onTaxChange, total,
    amountPaid, onAmountPaidChange, paymentMethod, onPaymentMethodChange,
    remainingAmount, invoiceType, t
}) => {
    const { theme, settings } = useZustandStore();
    
    const summaryLabelClasses = theme === 'dark' ? 'text-gray-400' : 'text-slate-500';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-slate-50'}`}>
                <h4 className="font-semibold mb-3">{t.invoiceSummary}</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center"><span className={summaryLabelClasses}>{t.subtotal}</span><span className="font-mono">{formatCurrency(subtotal, settings.baseCurrency)}</span></div>
                    <div className="flex justify-between items-center"><span className={summaryLabelClasses}>{t.discount}</span><Input type="number" value={discount} onChange={e => onDiscountChange(Number(e.target.value))} className="w-24 text-center !p-1" /></div>
                    <div className="flex justify-between items-center"><span className={summaryLabelClasses}>{t.tax}</span><Input type="number" value={tax} onChange={e => onTaxChange(Number(e.target.value))} className="w-24 text-center !p-1" /></div>
                    <div className={`flex justify-between items-center text-lg font-bold border-t pt-2 ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}><span>{t.grandTotal}</span><span className="font-mono text-cyan-400">{formatCurrency(total, settings.baseCurrency)}</span></div>
                </div>
            </div>
            
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-slate-50'}`}>
                <h4 className="font-semibold mb-3">{t.paymentDetails}</h4>
                <div className="space-y-3">
                    {invoiceType === 'credit' && (
                        <div>
                            <label className="text-sm">{t.amountPaid}</label>
                            <Input type="number" value={amountPaid} onChange={e => onAmountPaidChange(Number(e.target.value))} />
                        </div>
                    )}
                    <div>
                        <label className="text-sm">{t.paymentMethod}</label>
                        <Select value={paymentMethod} onChange={e => onPaymentMethodChange(e.target.value as PaymentMethod)}>
                            <option value="cash">نقداً</option>
                            <option value="card">بطاقة</option>
                            <option value="bank_transfer">تحويل بنكي</option>
                        </Select>
                    </div>
                    {invoiceType === 'credit' && (
                         <div className={`flex justify-between items-center text-lg font-bold border-t pt-2 ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                            <span>{t.remainingAmount}</span>
                            <span className="font-mono text-orange-400">{formatCurrency(remainingAmount, settings.baseCurrency)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
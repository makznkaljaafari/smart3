
import React from 'react';
import { CurrencyCode, ExchangeRate, AppTheme } from '../../../types';
import { Customer } from '../types';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { convertCurrency } from '../../../lib/currency';
import { getStatusInfo, getRiskInfo, formatCurrency } from '../lib/utils';

interface CustomerRowProps {
    customer: Customer;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    theme: AppTheme;
    lang: 'ar' | 'en';
    baseCurrency: CurrencyCode;
    exchangeRates: ExchangeRate[];
    isSelected: boolean;
    onSelect: () => void;
}

export const CustomerRow: React.FC<CustomerRowProps> = React.memo(({ customer, onView, onEdit, onDelete, theme, lang, baseCurrency, exchangeRates, isSelected, onSelect }) => {
    const status = getStatusInfo(customer.status);
    const risk = getRiskInfo(customer.riskLevel);
    const convertedRemaining = customer.currency !== baseCurrency
        ? convertCurrency(customer.remainingDebt, customer.currency as CurrencyCode, baseCurrency, exchangeRates)
        : null;

    const isDark = theme !== 'light';

    return (
        <tr className={`${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50'} ${isSelected ? (isDark ? 'bg-cyan-900/50' : 'bg-cyan-50') : ''}`}>
             <td className="p-4 whitespace-nowrap text-center" data-label="">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="w-4 h-4 rounded text-cyan-500 bg-gray-800 border-gray-600 focus:ring-cyan-600 focus:ring-offset-gray-900 cursor-pointer"
                />
            </td>
            <td className="p-4 whitespace-nowrap" data-label="العميل">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{customer.name[0]}</div>
                    <div>
                        <div className="font-semibold">{customer.name}</div>
                        <div className="text-xs text-slate-400">{customer.phone}</div>
                    </div>
                </div>
            </td>
            <td className="p-4 whitespace-nowrap" data-label="الحالة"><span className={status.className}>{status.label}</span></td>
            <td className="p-4 whitespace-nowrap" data-label="المخاطر"><span className={risk.className}>{risk.label}</span></td>
            <td className="p-4 whitespace-nowrap font-mono" data-label="الدين المتبقي">
                <div className="text-orange-500">{formatCurrency(customer.remainingDebt, customer.currency)}</div>
                {convertedRemaining !== null && <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>~{formatCurrency(convertedRemaining, baseCurrency)}</div>}
            </td>
            <td className="p-4 whitespace-nowrap text-right" data-label="إجراءات">
                <div className="relative inline-block">
                    <button onClick={onView} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-200'}`}><Eye size={18} /></button>
                    <button onClick={onEdit} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-200'}`}><Edit2 size={18} /></button>
                    <button onClick={onDelete} className={`p-2 rounded-lg text-red-500 hover:bg-red-500/10`}><Trash2 size={18} /></button>
                </div>
            </td>
        </tr>
    );
});


import React, { useState } from 'react';
import { CurrencyCode, ExchangeRate, AppTheme } from '../../../types';
import { Customer } from '../types';
import { Edit2, Trash2, Eye, Phone, Mail, Calendar, DollarSign, MoreVertical, Check } from 'lucide-react';
import { convertCurrency } from '../../../lib/currency';
import { getStatusInfo, getRiskInfo, formatCurrency, formatDate } from '../lib/utils';

interface CustomerCardProps {
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

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onView, onEdit, onDelete, theme, lang, baseCurrency, exchangeRates, isSelected, onSelect }) => {
  const [showMenu, setShowMenu] = useState(false);
  const status = getStatusInfo(customer.status);
  const risk = getRiskInfo(customer.riskLevel);
  const isDark = theme !== 'light';
  const textColor = isDark ? 'text-slate-300' : 'text-slate-600';

  const convert = (amount: number, from: string) => {
    if (from === baseCurrency) return null;
    return convertCurrency(amount, from as CurrencyCode, baseCurrency, exchangeRates);
  };
  
  const convertedTotal = convert(customer.totalDebt, customer.currency);
  const convertedRemaining = convert(customer.remainingDebt, customer.currency);
  const convertedPaid = convert(customer.paidAmount, customer.currency);

  const FinancialField: React.FC<{label: string, value: number, convertedValue: number | null, colorClass?: string}> = ({ label, value, convertedValue, colorClass }) => (
    <div>
        <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs mb-1`}>{label}</p>
        <p className={`font-semibold ${colorClass || (isDark ? 'text-white' : 'text-slate-800')}`}>{formatCurrency(value, customer.currency)}</p>
        {convertedValue !== null && <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>~{formatCurrency(convertedValue, baseCurrency)}</p>}
    </div>
  );

  return (
    <div className={`p-4 rounded-xl relative ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-slate-200 shadow-sm'} transition-all duration-300 ${isSelected ? 'border-cyan-500' : 'hover:border-cyan-500/50'}`}>
       <div className="absolute top-3 right-3 z-10" onClick={e => {e.stopPropagation(); onSelect()}}>
        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-cyan-500 border-cyan-400' : 'bg-gray-700/50 border-gray-500 hover:border-cyan-500'}`}>
            {isSelected && <Check size={16} className="text-white" />}
        </div>
      </div>
      <div onClick={onView} className="cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              {customer.name[0]}
            </div>
            <div>
              <h4 className={`${isDark ? 'text-white' : 'text-slate-800'} font-semibold text-lg`}>{customer.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={status.className}>{status.label}</span>
                <span className={risk.className}>مخاطر: {risk.label}</span>
              </div>
            </div>
          </div>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowMenu(!showMenu)} onBlur={() => setTimeout(() => setShowMenu(false), 100)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'} transition-colors`}>
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className={`absolute ${lang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-48 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} shadow-xl z-10`}>
                <button onClick={onView} className={`w-full px-4 py-2 text-right ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-100 text-slate-700'} flex items-center gap-2 rounded-t-lg`}><Eye size={16} /> عرض التفاصيل</button>
                <button onClick={onEdit} className={`w-full px-4 py-2 text-right ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-100 text-slate-700'} flex items-center gap-2`}><Edit2 size={16} /> تعديل</button>
                <button onClick={onDelete} className={`w-full px-4 py-2 text-right hover:bg-red-500/10 text-red-500 flex items-center gap-2 rounded-b-lg`}><Trash2 size={16} /> حذف</button>
              </div>
            )}
          </div>
        </div>
        <div className={`space-y-1 mb-3 text-sm ${textColor}`}>
          {customer.phone && (<div className="flex items-center gap-2"><Phone size={16} className="text-cyan-400" /><span>{customer.phone}</span></div>)}
          {customer.email && (<div className="flex items-center gap-2"><Mail size={16} className="text-cyan-400" /><span>{customer.email}</span></div>)}
        </div>
        <div className={`grid grid-cols-2 gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-slate-50 border-slate-200'}`}>
          <FinancialField label="إجمالي الدين" value={customer.totalDebt} convertedValue={convertedTotal} />
          <FinancialField label="المبلغ المتبقي" value={customer.remainingDebt} convertedValue={convertedRemaining} colorClass="text-orange-500" />
          <FinancialField label="المدفوع" value={customer.paidAmount} convertedValue={convertedPaid} colorClass="text-green-500" />
          <div><p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs mb-1`}>عدد المعاملات</p><p className={`${isDark ? 'text-purple-400' : 'text-purple-600'} font-semibold`}>{customer.totalTransactions}</p></div>
        </div>
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-slate-200'} flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className="flex items-center gap-1"><Calendar size={14} /> تسجيل: {formatDate(customer.createdAt)}</span>
          {customer.lastTransaction && <span className="flex items-center gap-1"><DollarSign size={14} /> آخر معاملة: {formatDate(customer.lastTransaction)}</span>}
        </div>
      </div>
    </div>
  );
};

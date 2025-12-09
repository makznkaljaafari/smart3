
import React from 'react';
import { Expense } from '../../../types';
import { AppTheme } from '../../../types';
import { getStatusLabel, getPriorityLabel, formatCurrency, formatShortDate, CATEGORY_CONFIG, getStatusClass, getPriorityClass } from '../lib/utils';
import { Eye, Edit2, Trash2, Paperclip, RefreshCw, DollarSign } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';
import { convertCurrency } from '../../../lib/currency';

interface ExpenseRowProps {
  expense: Expense;
  onViewDetails: (e: Expense) => void;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
  onPay: (e: Expense) => void;
  theme: AppTheme;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = React.memo(({ expense, onViewDetails, onEdit, onDelete, onPay, theme }) => {
  const settings = useZustandStore(state => state.settings);
  const isDark = theme.startsWith('dark');
  const categoryConfig = CATEGORY_CONFIG[expense.category];
  const CategoryIcon = categoryConfig.icon;
  
  const isPayable = expense.status === 'pending' || expense.status === 'approved';
  const convertedAmount = expense.currency !== settings.baseCurrency
    ? convertCurrency(expense.amount, expense.currency, settings.baseCurrency, settings.exchangeRates)
    : null;
  
  const rowClasses = `border-b transition-colors ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-slate-200 hover:bg-slate-50'}`;
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <tr className={rowClasses}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
            <CategoryIcon size={18} />
          </div>
          <div>
            <div className={`font-semibold flex items-center gap-2 ${textPrimary}`}>
              {expense.isRecurringTemplate && <RefreshCw size={12} className="text-cyan-400" />}
              {expense.title}
            </div>
            <div className={`text-xs flex items-center gap-2 ${textSecondary}`}>
                {categoryConfig.label}
                {expense.attachments && expense.attachments.length > 0 && <Paperclip size={10} />}
            </div>
          </div>
        </div>
      </td>
      <td className="p-4 text-right">
        <div className={`font-mono font-bold ${textPrimary}`}>{formatCurrency(expense.amount, expense.currency)}</div>
        {convertedAmount !== null && (
          <div className="text-[10px] text-gray-500 font-mono">≈ {formatCurrency(convertedAmount, settings.baseCurrency)}</div>
        )}
      </td>
      <td className={`p-4 text-right text-sm ${textSecondary}`}>{formatShortDate(expense.date)}</td>
      <td className="p-4 text-center"><span className={getStatusClass(expense.status)}>{getStatusLabel(expense.status)}</span></td>
      <td className="p-4 text-center"><span className={getPriorityClass(expense.priority)}>{getPriorityLabel(expense.priority)}</span></td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-2">
            {isPayable && (
                 <button onClick={() => onPay(expense)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors" title="تسديد"><DollarSign size={16} /></button>
            )}
            <button onClick={() => onViewDetails(expense)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}><Eye size={16} /></button>
            <button onClick={() => onEdit(expense)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
            <button onClick={() => onDelete(expense.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
});

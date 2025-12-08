import React, { useState } from 'react';
import { Expense } from '../../../types';
import { getStatusLabel, getPriorityLabel, formatCurrency, formatShortDate, CATEGORY_CONFIG } from '../lib/utils';
import { Eye, Edit2, Trash2, MoreVertical, Paperclip, RefreshCw, DollarSign, Building } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';
import { convertCurrency } from '../../../lib/currency';

interface ExpenseCardProps {
  expense: Expense;
  onViewDetails: (e: Expense) => void;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
  onPay: (e: Expense) => void;
  theme: 'light' | 'dark';
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onViewDetails, onEdit, onDelete, onPay, theme }) => {
  const [showMenu, setShowMenu] = useState(false);
  const settings = useZustandStore(state => state.settings);
  const isDark = theme === 'dark';
  const isPayable = expense.status === 'pending' || expense.status === 'approved';

  const categoryConfig = CATEGORY_CONFIG[expense.category];
  const CategoryIcon = categoryConfig.icon;

  const convertedAmount = expense.currency !== settings.baseCurrency
    ? convertCurrency(expense.amount, expense.currency, settings.baseCurrency, settings.exchangeRates)
    : null;

  // Styles
  const cardBg = isDark ? 'bg-gray-900/60 backdrop-blur-md' : 'bg-white';
  const borderColor = isDark ? 'border-gray-800' : 'border-slate-200';
  const hoverEffect = isDark ? 'hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'hover:shadow-lg';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className={`group relative p-0 rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${cardBg} ${borderColor} ${hoverEffect}`}>
      
      {/* Top "Receipt" Edge (Visual CSS Trick) */}
      <div className={`h-1 w-full ${isDark ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-purple-400 to-pink-400'}`} />

      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-3">
             <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-gray-800 text-purple-400' : 'bg-purple-50 text-purple-600'} shadow-inner`}>
                    <CategoryIcon size={20} />
                </div>
                <div>
                    <h3 className={`font-bold text-base line-clamp-1 flex items-center gap-2 ${textColor}`}>
                        {expense.isRecurringTemplate && <RefreshCw size={12} className="text-cyan-400" />}
                        {expense.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        {categoryConfig.label}
                    </span>
                </div>
             </div>
             
             <div className="relative">
                <button 
                    onClick={() => setShowMenu(!showMenu)} 
                    onBlur={() => setTimeout(() => setShowMenu(false), 200)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                    <MoreVertical size={18} />
                </button>
                {showMenu && (
                    <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-2xl z-20 border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                        <button onClick={() => onViewDetails(expense)} className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-right hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-50 text-slate-700'}`}><Eye size={16} /> عرض</button>
                        <button onClick={() => onEdit(expense)} className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-right hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-50 text-slate-700'}`}><Edit2 size={16} /> تعديل</button>
                        <button onClick={() => onDelete(expense.id)} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-right text-red-500 hover:bg-red-500/10"><Trash2 size={16} /> حذف</button>
                    </div>
                )}
            </div>
        </div>
        
        <div className="mt-4 mb-2">
            <p className={`text-2xl font-mono font-bold ${textColor}`}>{formatCurrency(expense.amount, expense.currency)}</p>
            {convertedAmount !== null && <p className="text-xs text-gray-500 font-mono">≈ {formatCurrency(convertedAmount, settings.baseCurrency)}</p>}
        </div>
        
        {expense.vendor && (
            <div className={`flex items-center gap-2 text-sm mt-3 ${subTextColor}`}>
                <Building size={14} /> 
                <span className="truncate">{expense.vendor}</span>
            </div>
        )}
      </div>

      <div className={`px-5 py-3 border-t flex justify-between items-center bg-opacity-30 ${isDark ? 'bg-black/20 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
         <div className="flex items-center gap-2 text-xs text-gray-500">
             <span>{formatShortDate(expense.date)}</span>
             {expense.attachments && expense.attachments.length > 0 && <Paperclip size={12} className="text-purple-400" />}
         </div>
         
         {isPayable ? (
             <button 
                onClick={() => onPay(expense)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${isDark ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
             >
                 <DollarSign size={12} /> تسديد
             </button>
         ) : (
             <span className={`text-xs font-bold px-2 py-1 rounded ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                 {getStatusLabel(expense.status)}
             </span>
         )}
      </div>
    </div>
  );
};

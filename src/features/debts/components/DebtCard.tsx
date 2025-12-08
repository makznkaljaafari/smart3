import React, { useState } from 'react';
import {
  Phone,
  AlertTriangle,
  Eye,
  Edit2,
  Trash2,
  DollarSign,
  MoreVertical,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Debt } from '../types';
import { getStatusLabel, formatCurrency, formatShortDate, isOverdue } from '../lib/utils';
import { useZustandStore } from '../../../store/useStore';
import { convertCurrency } from '../../../lib/currency';

interface DebtCardProps {
  debt: Debt;
  onViewDetails: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
  onAddPayment: (debt: Debt) => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  onViewDetails,
  onEdit,
  onDelete,
  onAddPayment
}) => {
  const { baseCurrency, exchangeRates, theme } = useZustandStore(state => ({
    baseCurrency: state.settings.baseCurrency,
    exchangeRates: state.settings.exchangeRates,
    theme: state.theme
  }));

  const [showMenu, setShowMenu] = useState(false);
  const isDark = theme === 'dark';

  const paymentPercentage = debt.amount > 0 ? (debt.paidAmount / debt.amount) * 100 : 0;
  const overdue = isOverdue(debt.dueDate, debt.status);
  const isPaid = debt.status === 'paid';

  const convertedRemaining = debt.currency !== baseCurrency
    ? convertCurrency(debt.remainingAmount, debt.currency, baseCurrency, exchangeRates)
    : null;

  // Sci-Fi styling based on status
  let glowColor = 'rgba(6, 182, 212, 0.2)'; // Default Cyan
  let borderColor = isDark ? 'border-gray-800' : 'border-slate-200';
  
  if (overdue) {
      glowColor = 'rgba(239, 68, 68, 0.3)'; // Red for overdue
      borderColor = isDark ? 'border-red-900/30' : 'border-red-200';
  } else if (isPaid) {
      glowColor = 'rgba(34, 197, 94, 0.2)'; // Green for paid
      borderColor = isDark ? 'border-green-900/30' : 'border-green-200';
  }

  return (
    <div 
        className={`relative group p-5 rounded-2xl border transition-all duration-300 flex flex-col h-full overflow-hidden ${isDark ? 'bg-gray-900/80' : 'bg-white shadow-sm hover:shadow-xl'}`}
        style={{ borderColor: isDark ? undefined : undefined, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'transparent'}` }}
    >
        {/* Glow Effect */}
        <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)` }}
        />
        
        {/* Overdue/Status Indicator Line */}
        <div className={`absolute top-0 left-0 w-1 h-full ${overdue ? 'bg-red-500 shadow-[0_0_10px_red]' : (isPaid ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-cyan-500')}`} />

        <div className="relative z-10 flex justify-between items-start mb-4 pl-3">
            <div>
                <h3 className={`font-bold text-lg truncate ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-slate-900'} transition-colors`}>{debt.customerName}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${
                        overdue 
                            ? 'text-red-400 border-red-500/30 bg-red-500/10' 
                            : (isPaid ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10')
                    }`}>
                        {overdue ? <AlertTriangle size={10} /> : (isPaid ? <CheckCircle2 size={10} /> : <Clock size={10} />)}
                        {getStatusLabel(debt.status)}
                    </span>
                    {debt.customerPhone && (
                        <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Phone size={10} /> {debt.customerPhone}
                        </span>
                    )}
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
                        <button onClick={() => onViewDetails(debt)} className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-right hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-50 text-slate-700'}`}><Eye size={16} /> عرض</button>
                        <button onClick={() => onEdit(debt)} className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-right hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-50 text-slate-700'}`}><Edit2 size={16} /> تعديل</button>
                        <button onClick={() => onDelete(debt.id)} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-right text-red-500 hover:bg-red-500/10"><Trash2 size={16} /> حذف</button>
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-end pl-3">
            <div className="mb-1 flex justify-between items-end">
                 <div>
                    <p className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>المتبقي</p>
                    <p className={`text-2xl font-mono font-bold ${overdue ? 'text-red-400' : (isDark ? 'text-white' : 'text-slate-900')}`}>
                        {formatCurrency(debt.remainingAmount, debt.currency)}
                    </p>
                    {convertedRemaining !== null && (
                        <p className="text-xs text-gray-500 font-mono">≈ {formatCurrency(convertedRemaining, baseCurrency)}</p>
                    )}
                 </div>
                 {debt.amount > 0 && (
                     <div className="text-right">
                         <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{Math.round(paymentPercentage)}%</p>
                     </div>
                 )}
            </div>

            {/* Progress Bar */}
            <div className={`w-full h-1.5 rounded-full mb-4 overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-slate-200'}`}>
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                        overdue ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_#06b6d4]'
                    }`}
                    style={{ width: `${paymentPercentage}%` }} 
                />
            </div>

            <div className={`pt-3 border-t flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                 <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Calendar size={12} />
                    <span>{formatShortDate(debt.dueDate)}</span>
                 </div>
                 
                 {!isPaid && (
                    <button 
                        onClick={() => onAddPayment(debt)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                        ${isDark 
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                        <DollarSign size={12} />
                        سداد
                    </button>
                 )}
            </div>
        </div>
    </div>
  );
};


import React from 'react';
import { Debt } from '../types';
import { getStatusIcon, getStatusLabel, formatCurrency, formatShortDate, getStatusClass } from '../lib/utils';
import { Eye, Edit2, Trash2, DollarSign } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';

interface DebtRowProps {
  debt: Debt;
  onViewDetails: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
  onAddPayment: (debt: Debt) => void;
}

export const DebtRow: React.FC<DebtRowProps> = React.memo(({ debt, onViewDetails, onEdit, onDelete, onAddPayment }) => {
    const { theme } = useZustandStore();
    const isDark = theme === 'dark';
    const StatusIcon = getStatusIcon(debt.status);

    const rowClasses = `border-b transition-colors ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-slate-200 hover:bg-slate-50'}`;
    const textPrimary = isDark ? 'text-white' : 'text-slate-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-slate-500';

    return (
        <tr className={rowClasses}>
            <td className="p-4">
                <div className={`font-semibold ${textPrimary}`}>{debt.customerName}</div>
                <div className={`text-xs ${textSecondary}`}>{debt.customerPhone}</div>
            </td>
            <td className="p-4 font-mono text-right font-bold text-red-400">
                {formatCurrency(debt.remainingAmount, debt.currency)}
            </td>
            <td className={`p-4 text-right ${textSecondary} font-mono text-sm`}>
                {formatShortDate(debt.dueDate)}
            </td>
            <td className="p-4 text-center">
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClass(debt.status)}`}>
                    <StatusIcon size={12} />
                    {getStatusLabel(debt.status)}
                 </span>
            </td>
            <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                    {debt.status !== 'paid' && (
                        <button onClick={() => onAddPayment(debt)} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="إضافة دفعة"><DollarSign size={16} /></button>
                    )}
                    <button onClick={() => onViewDetails(debt)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`} title="عرض التفاصيل"><Eye size={16} /></button>
                    <button onClick={() => onEdit(debt)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="تعديل"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(debt.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="حذف"><Trash2 size={16} /></button>
                </div>
            </td>
        </tr>
    );
});

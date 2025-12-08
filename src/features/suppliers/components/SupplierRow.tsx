
import React from 'react';
import { Supplier } from '../types';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';
import { formatCurrency } from '../../../lib/formatters';

interface SupplierRowProps {
    supplier: Supplier;
    onViewDetails: (s: Supplier) => void;
    onEdit: (s: Supplier) => void;
    onDelete: (id: string) => void;
    isDark: boolean;
}

export const SupplierRow: React.FC<SupplierRowProps> = React.memo(({ supplier, onViewDetails, onEdit, onDelete, isDark }) => {
  return (
    <tr className={`border-b transition-colors ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-slate-200 hover:bg-slate-50'}`}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {supplier.name[0]}
          </div>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{supplier.name}</span>
        </div>
      </td>
      <td className={`p-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{supplier.contactPerson || '-'}</td>
      <td className={`p-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`} dir="ltr">{supplier.phone}</td>
      <td className="p-4 text-right font-mono text-green-500 font-medium">
        {formatCurrency(supplier.totalPurchasesValue, supplier.currency)}
      </td>
      <td className="p-4 text-right font-mono text-orange-500 font-bold">
        {formatCurrency(supplier.outstandingBalance, supplier.currency)}
      </td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => onViewDetails(supplier)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}><Eye size={16} /></button>
          <button onClick={() => onEdit(supplier)} className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
          <button onClick={() => onDelete(supplier.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
});


import React, { useState } from 'react';
import { Supplier } from '../types';
import { Edit2, Trash2, Phone, Mail, Building, MoreVertical, Eye } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';
import { formatCurrency } from '../../../lib/formatters';
import { AppTheme } from '../../../types';

interface SupplierCardProps {
    supplier: Supplier;
    onEdit: () => void;
    onDelete: () => void;
    onViewDetails: () => void;
    theme: AppTheme;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onEdit, onDelete, theme, onViewDetails }) => {
  const { lang } = useZustandStore(state => ({ lang: state.lang }));
  const [showMenu, setShowMenu] = useState(false);
  const isDark = !theme.startsWith('light');
  const textColor = isDark ? 'text-slate-300' : 'text-slate-600';
  
  return (
    <div className={`rounded-xl transition-all duration-300 border flex flex-col h-full ${isDark ? 'bg-gray-900 border-gray-700 hover:border-cyan-500/50' : 'bg-white border-slate-200 shadow-sm hover:border-cyan-400 hover:shadow-lg'}`}>
      <div className="p-4 flex-1 cursor-pointer" onClick={onViewDetails}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-base shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              {supplier.name[0]}
            </div>
            <div>
              <h4 className={`${isDark ? 'text-white' : 'text-slate-800'} font-semibold text-lg`}>{supplier.name}</h4>
              {supplier.contactPerson && <p className={`text-sm ${textColor}`}>{supplier.contactPerson}</p>}
            </div>
          </div>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowMenu(!showMenu)} onBlur={() => setTimeout(() => setShowMenu(false), 100)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'} transition-colors`}>
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className={`absolute ${lang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-40 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} shadow-xl z-10`}>
                <button onClick={onViewDetails} className={`w-full px-4 py-2 text-right ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-100 text-slate-700'} flex items-center gap-2 rounded-t-lg`}><Eye size={16} /> عرض التفاصيل</button>
                <button onClick={onEdit} className={`w-full px-4 py-2 text-right ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-100 text-slate-700'} flex items-center gap-2`}><Edit2 size={16} /> تعديل</button>
                <button onClick={onDelete} className={`w-full px-4 py-2 text-right hover:bg-red-500/10 text-red-500 flex items-center gap-2 rounded-b-lg`}><Trash2 size={16} /> حذف</button>
              </div>
            )}
          </div>
        </div>
        <div className={`space-y-1 mb-3 text-sm ${textColor}`}>
          {supplier.phone && (<div className="flex items-center gap-2"><Phone size={16} className="text-cyan-400" /><span>{supplier.phone}</span></div>)}
          {supplier.email && (<div className="flex items-center gap-2"><Mail size={16} className="text-cyan-400" /><span>{supplier.email}</span></div>)}
        </div>
        <div className={`grid grid-cols-2 gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-slate-50 border-slate-200'}`}>
          <div>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs mb-1`}>إجمالي المشتريات</p>
              <p className={`font-semibold text-green-500`}>{formatCurrency(supplier.totalPurchasesValue, supplier.currency)}</p>
          </div>
          <div>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs mb-1`}>الرصيد المستحق</p>
              <p className={`font-semibold text-orange-500`}>{formatCurrency(supplier.outstandingBalance, supplier.currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

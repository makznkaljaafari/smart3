
import React from 'react';
import { Warehouse, AppTheme } from '../../../types';
import { Edit2, Trash2, MapPin } from 'lucide-react';

interface WarehouseCardProps {
  warehouse: Warehouse;
  theme: AppTheme;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}

export const WarehouseCard: React.FC<WarehouseCardProps> = ({ warehouse, theme, onEdit, onDelete, onViewDetails }) => {
  const isDark = !theme.startsWith('light');
  const cardClasses = isDark ? 'bg-gray-900 border-gray-700/50 hover:border-cyan-500/50' : 'bg-white border-gray-200 shadow-sm hover:shadow-lg';
  const textClasses = { main: isDark ? 'text-white' : 'text-gray-900', sub: isDark ? 'text-gray-400' : 'text-gray-600' };

  return (
    <div className={`rounded-xl transition-all duration-300 border flex flex-col h-full ${cardClasses}`}>
      <div 
        className="p-4 flex-1 cursor-pointer"
        onClick={onViewDetails}
      >
        <h3 className={`font-bold text-lg ${textClasses.main}`}>{warehouse.name}</h3>
        {warehouse.location && (
          <p className={`text-sm flex items-center gap-2 mt-1 ${textClasses.sub}`}>
            <MapPin size={14} /> {warehouse.location}
          </p>
        )}
      </div>
      <div className={`p-3 border-t flex justify-end gap-2 ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className={`p-2 rounded-lg text-blue-500 ${isDark ? 'hover:bg-blue-500/10' : 'hover:bg-blue-100'}`} title="تعديل"><Edit2 size={18} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={`p-2 rounded-lg text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-100'}`} title="حذف"><Trash2 size={18} /></button>
      </div>
    </div>
  );
};

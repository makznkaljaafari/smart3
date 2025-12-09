
import React, { useState } from 'react';
import { Vehicle } from '../types';
import { AppTheme } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { Edit2, Trash2, MapPin, Car, History } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  theme: AppTheme;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, theme, onEdit, onDelete, onViewDetails }) => {
  const isDark = theme.startsWith('dark');
  const cardClasses = isDark ? 'bg-gray-900 border-gray-700/50 hover:border-cyan-500/50' : 'bg-white border-gray-200 shadow-sm hover:shadow-lg';
  const textClasses = { main: isDark ? 'text-white' : 'text-gray-900', sub: isDark ? 'text-gray-400' : 'text-gray-600' };

  return (
    <div className={`rounded-xl transition-all duration-300 border flex flex-col h-full ${cardClasses}`}>
      <div 
        className="p-4 flex-1 cursor-pointer"
        onClick={onViewDetails}
      >
        <div className="flex justify-between items-start">
            <div>
                <h3 className={`font-bold text-lg ${textClasses.main}`}>{vehicle.make} {vehicle.model}</h3>
                <p className={`text-sm ${textClasses.sub}`}>{vehicle.year} • {vehicle.color}</p>
            </div>
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 text-cyan-400' : 'bg-slate-100 text-slate-600'}`}>
                <Car size={20} />
            </div>
        </div>
        
        <div className="mt-4 space-y-2">
             <div className={`flex justify-between text-sm ${isDark ? 'bg-gray-800/50' : 'bg-slate-50'} p-2 rounded`}>
                <span className="text-gray-500">اللوحة</span>
                <span className="font-mono font-bold">{vehicle.plateNumber || '-'}</span>
             </div>
             <div className={`flex justify-between text-sm ${isDark ? 'bg-gray-800/50' : 'bg-slate-50'} p-2 rounded`}>
                <span className="text-gray-500">الممشى</span>
                <span className="font-mono font-bold text-orange-400">{vehicle.currentMileage ? vehicle.currentMileage.toLocaleString() : '-'}</span>
             </div>
        </div>
        
        {vehicle.customerName && (
            <div className="mt-3 pt-3 border-t border-dashed border-gray-700 text-xs text-gray-500">
                المالك: <span className={textClasses.main}>{vehicle.customerName}</span>
            </div>
        )}
      </div>

      <div className={`p-3 border-t flex justify-between items-center gap-2 ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
         <button 
            onClick={(e) => { e.stopPropagation(); onViewDetails(); }} 
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg ${isDark ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'}`}
         >
             <History size={14} /> السجل
         </button>
         
         <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className={`p-2 rounded-lg text-blue-500 ${isDark ? 'hover:bg-blue-500/10' : 'hover:bg-blue-100'}`} title="تعديل"><Edit2 size={18} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={`p-2 rounded-lg text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-100'}`} title="حذف"><Trash2 size={18} /></button>
         </div>
      </div>
    </div>
  );
};

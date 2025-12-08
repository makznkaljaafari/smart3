
import React from 'react';
import { Expense } from '../../../types';
import { 
    getStatusIcon, getStatusLabel, getPriorityLabel, 
    formatCurrency, formatDate, CATEGORY_CONFIG 
} from '../lib/utils';
import {
  X, DollarSign, Edit2, Info, Calendar, Building, Clock,
  Phone, Mail, CalendarDays
} from 'lucide-react';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';

interface ExpenseDetailsModalProps {
  expense: Expense;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  theme: 'light' | 'dark';
  t: Record<string, string>;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({ expense, onClose, onEdit, theme, t }) => {
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
    initialSize: { width: 1024, height: 800 },
    minSize: { width: 700, height: 600 }
  });

  const StatusIcon = getStatusIcon(expense.status);
  const categoryConfig = CATEGORY_CONFIG[expense.category];
  const CategoryIcon = categoryConfig.icon;
  const modalBg = theme === 'dark' ? `bg-gray-900 border-2 border-purple-500/50 shadow-[var(--accent-shadow)]` : 'bg-white border shadow-2xl';
  const headerBg = theme === 'dark' ? 'bg-transparent' : 'bg-slate-100';
  const sectionHeaderColor = theme === 'dark' ? 'text-purple-400' : 'text-purple-600';
  const detailBoxBg = theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50 border border-slate-200';
  
  const DetailItem: React.FC<{icon: React.ElementType, label: string, value?: string | React.ReactNode, fullWidth?: boolean}> = ({icon: Icon, label, value, fullWidth}) => {
    if (!value) return null;
    return (
      <div className={`${fullWidth ? 'md:col-span-2' : ''} flex items-start gap-3`}>
        <Icon className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'} mt-0.5`} />
        <div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>{label}</p>
          <div className={`text-base font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>{value}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
      <div 
        ref={modalRef}
        style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
        className={`fixed rounded-2xl w-full flex flex-col ${modalBg}`} 
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div 
          ref={headerRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={`p-6 border-b cursor-move ${theme === 'dark' ? 'border-purple-800/50' : 'border-slate-200'} ${headerBg}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'}`}><CategoryIcon className={`w-6 h-6 ${sectionHeaderColor}`} /></div>
              <div>
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{expense.title}</h2>
                <p className={`${theme === 'dark' ? 'text-purple-200' : 'text-slate-600'} text-sm mt-1`}>{categoryConfig.label}</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`}><X className="w-6 h-6" /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-800 border border-white/20"><StatusIcon className="w-4 h-4" />{getStatusLabel(expense.status)}</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-800 border border-white/20">{getPriorityLabel(expense.priority)}</span>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-between`}>
            <div><p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'} mb-2`}>{t.amount}</p><p className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(expense.amount, expense.currency)}</p></div>
            <div className={`${sectionHeaderColor} ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'} p-4 rounded-xl`}><DollarSign className="w-8 h-8" /></div>
          </div>
          <div className={`p-4 rounded-xl ${detailBoxBg}`}><DetailItem icon={Info} label={t.description} value={expense.description} /></div>
          
          {expense.vendor && <section>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${sectionHeaderColor}`}><Building/> {t.vendorInfo}</h3>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl ${detailBoxBg}`}>
              <DetailItem icon={Building} label="اسم المورد" value={expense.vendor} />
              <DetailItem icon={Phone} label="رقم الهاتف" value={expense.vendorPhone} />
              <DetailItem icon={Mail} label="البريد الإلكتروني" value={expense.vendorEmail} />
            </div>
          </section>}

          <section>
             <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${sectionHeaderColor}`}><Calendar/> {t.dates}</h3>
             <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl ${detailBoxBg}`}>
                <DetailItem icon={Calendar} label={t.date} value={formatDate(expense.date)} />
                <DetailItem icon={CalendarDays} label="تاريخ الإنشاء" value={formatDate(expense.createdDate)} />
                <DetailItem icon={Clock} label="آخر تحديث" value={formatDate(expense.updatedDate)} />
             </div>
          </section>
        </div>
        
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-purple-800/50' : 'border-slate-200'} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-lg font-semibold ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'}`}>{t.close}</button>
          <HoloButton variant="secondary" icon={Edit2} onClick={() => { onEdit(expense); onClose(); }}>{t.editExpense}</HoloButton>
        </div>
        
        <div 
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-slate-500 hover:text-cyan-400 transition-colors"
          title="Resize"
        >
          <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0V16H0L16 0Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

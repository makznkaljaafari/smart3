
import React from 'react';
import { Expense } from '../types';
import { AppTheme } from '../../../types';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Loader } from 'lucide-react';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { useExpenseForm } from '../hooks/useExpenseForm';
import { ExpenseBasicInfo } from './form/ExpenseBasicInfo';
import { ExpenseStatusPayment } from './form/ExpenseStatusPayment';
import { ExpenseAccounting } from './form/ExpenseAccounting';
import { ExpenseAttachments } from './form/ExpenseAttachments';

interface ExpenseFormModalProps {
  expense?: Expense;
  onClose: () => void;
  onSave: (expense: Partial<Expense>) => Promise<void>;
  t: Record<string, string>;
  theme: AppTheme;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ expense, onClose, onSave, t, theme }) => {
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
    initialSize: { width: 1024, height: 850 },
    minSize: { width: 700, height: 600 }
  });
  
  const isDark = theme.startsWith('dark');

  const {
      formData,
      errors,
      isSaving,
      isDragging,
      setIsDragging,
      uploadingFiles,
      isSuggestingCategory,
      isSuggestingAccounts,
      handleChange,
      handleSuggestAccounts,
      handleSubmit,
      handleFileChange,
      removeAttachment,
      accounts,
  } = useExpenseForm({ expense, onSave, onClose });

  const isEdit = !!expense;
  const formInputClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onMouseDown={onClose}>
      <div
        ref={modalRef}
        style={{
            '--modal-x': `${position.x}px`,
            '--modal-y': `${position.y}px`,
            '--modal-width': `${size.width}px`,
            '--modal-height': `${size.height}px`,
        } as React.CSSProperties}
        className={`fixed inset-0 md:inset-auto md:left-[var(--modal-x)] md:top-[var(--modal-y)] md:w-[var(--modal-width)] md:h-[var(--modal-height)] rounded-none md:rounded-2xl shadow-2xl flex flex-col ${isDark ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-slate-50 border'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div ref={headerRef} onMouseDown={handleDragStart} onTouchStart={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
          <h3 className="text-2xl font-bold">{isEdit ? t.editExpense : t.addNewExpense}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={24} /></button>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="overflow-y-auto flex-1 p-6 space-y-8">
            <ExpenseBasicInfo 
                formData={formData} 
                errors={errors} 
                onChange={handleChange} 
                isSuggestingCategory={isSuggestingCategory}
                formInputClasses={formInputClasses}
            />

            <ExpenseStatusPayment 
                formData={formData} 
                onChange={handleChange} 
                formInputClasses={formInputClasses}
            />

            <ExpenseAccounting 
                formData={formData} 
                onChange={handleChange}
                onSuggestAccounts={handleSuggestAccounts}
                isSuggestingAccounts={isSuggestingAccounts}
                accounts={accounts}
                formInputClasses={formInputClasses}
            />

            <ExpenseAttachments 
                attachments={formData.attachments}
                uploadingFiles={uploadingFiles}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                onFileChange={handleFileChange}
                onRemoveAttachment={removeAttachment}
            />
        </form>

        <div className={`flex justify-end gap-3 p-4 border-t mt-auto ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-semibold ${isDark ? 'bg-gray-800' : 'bg-slate-200'}`}>{t.cancel}</button>
          <HoloButton variant="success" icon={isSaving ? Loader : Save} onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? t.saving : (isEdit ? t.saveChanges : t.saveExpense)}
          </HoloButton>
        </div>
        
        <div onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 hidden md:block">
            <svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg>
        </div>
      </div>
    </div>
  );
};

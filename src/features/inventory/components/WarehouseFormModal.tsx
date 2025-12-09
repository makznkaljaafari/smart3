
import React, { useState } from 'react';
import { Warehouse } from '../../../types';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { X, Save, Loader } from 'lucide-react';

interface WarehouseFormModalProps {
  warehouse?: Warehouse | null;
  onClose: () => void;
  onSave: (warehouse: Partial<Warehouse>) => Promise<void>;
}

export const WarehouseFormModal: React.FC<WarehouseFormModalProps> = ({ warehouse, onClose, onSave }) => {
  const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
  const t = translations[lang];
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 500, height: 400 } });
  const isEdit = !!warehouse;

  const [formData, setFormData] = useState<Partial<Warehouse>>(warehouse || { name: '', location: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof Warehouse, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'اسم المستودع مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const formInputClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${theme.startsWith('dark') ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;
  const labelClasses = `block text-sm mb-2 ${theme.startsWith('dark') ? 'text-gray-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
      <div
        ref={modalRef}
        style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
        className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme.startsWith('dark') ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme.startsWith('dark') ? 'border-gray-700' : 'border-slate-200'}`}>
          <h3 className="text-2xl font-bold">{isEdit ? t.editWarehouse : t.addWarehouse}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={24} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className={labelClasses}>{t.warehouseName} *</label>
            <input type="text" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className={formInputClasses}/>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className={labelClasses}>{t.warehouseLocation}</label>
            <input type="text" value={formData.location || ''} onChange={e => handleChange('location', e.target.value)} className={formInputClasses}/>
          </div>
        </form>
        <div className={`flex justify-end gap-3 p-4 border-t ${theme.startsWith('dark') ? 'border-gray-700' : 'border-slate-200'}`}>
            <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-semibold ${theme.startsWith('dark') ? 'bg-gray-800' : 'bg-slate-200'}`}>{t.cancel}</button>
            <HoloButton variant="success" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              <span>{isSaving ? 'جاري الحفظ...' : t.save}</span>
            </HoloButton>
        </div>
        <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400"><svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg></div>
      </div>
    </div>
  );
};

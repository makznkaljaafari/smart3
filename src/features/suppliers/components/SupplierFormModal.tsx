
import React, { useState } from 'react';
import { Supplier } from '../types';
import { AppTheme } from '../../../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, User, FileText } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Label } from '../../../components/ui/Label';

interface SupplierFormModalProps { 
    supplier: Supplier | null; 
    onClose: () => void; 
    onSave: (supplier: Partial<Supplier>) => Promise<void>; 
    theme: AppTheme;
    t: Record<string, string>;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ supplier, onClose, onSave, theme, t }) => {
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 768, height: 700 }, minSize: { width: 500, height: 600 }});
    const [formData, setFormData] = useState<Partial<Supplier>>(supplier || { name: '', phone: '', currency: 'SAR', contactPerson: '', email: '', address: '', notes: '' });
    const isEdit = !!supplier;
    const [isSaving, setIsSaving] = useState(false);
    const isDark = !theme.startsWith('light');
    
    const handleSubmit = async () => {
        if (isSaving || !formData.name || !formData.phone) return;
        setIsSaving(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Failed to save supplier", error);
        } finally {
            setIsSaving(false);
        }
    };

    const sectionTitleClasses = `text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`;
    
    return (
      <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
        <div 
          ref={modalRef}
          style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
          className={`fixed rounded-2xl shadow-2xl w-full flex flex-col ${isDark ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div 
            ref={headerRef}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className={`p-6 border-b flex items-center justify-between cursor-move ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{isEdit ? t.editSupplier : t.addSupplier}</h3>
            <button onClick={onClose} aria-label="Close" className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-slate-200'} transition-colors`}><X size={24} /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="overflow-y-auto flex-1 p-6 space-y-6">
            <section>
              <h4 className={sectionTitleClasses}><User className="text-cyan-400" /> {t.basicInfo}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>{t.supplierName} *</Label><Input type="text" required placeholder="أدخل اسم المورد" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div><Label>{t.contactPerson}</Label><Input type="text" placeholder="اسم الشخص المسؤول" value={formData.contactPerson || ''} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} /></div>
                <div><Label>{t.phone} *</Label><Input type="tel" required placeholder="+966xxxxxxxxx" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div><Label>{t.email}</Label><Input type="email" placeholder="example@email.com" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>{t.address}</Label><Input type="text" placeholder="المدينة، الحي، الشارع" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
              </div>
            </section>
            
            <section>
              <h4 className={sectionTitleClasses}><FileText className="text-cyan-400" /> {t.notes}</h4>
              <div><Textarea placeholder="أضف أي ملاحظات هنا..." value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="resize-none" /></div>
            </section>
          </form>
          <div className={`flex justify-end gap-3 p-4 border-t ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
            <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-slate-200'} font-semibold`}>{t.cancel}</button>
            <HoloButton variant="success" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'جاري الحفظ...' : (isEdit ? t.saveChanges : t.addSupplier)}
            </HoloButton>
          </div>
          <div 
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 transition-colors"
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

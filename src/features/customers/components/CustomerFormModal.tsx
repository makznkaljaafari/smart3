
import React, { useState } from 'react';
import { Customer, CustomerStatus, RiskLevel } from '../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, User, Settings, FileText } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Label } from '../../../components/ui/Label';


export const CustomerFormModal: React.FC<{ customer: Customer | null; onClose: () => void; onSave: (customer: Partial<Customer>) => Promise<void>; theme: 'light' | 'dark' }> = ({ customer, onClose, onSave, theme }) => {
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 896, height: 750 }, minSize: { width: 600, height: 500 }});
    const [formData, setFormData] = useState<Partial<Customer>>(customer || { name: '', phone: '', email: '', address: '', nationalId: '', company: '', notes: '', status: 'active', riskLevel: 'low', currency: 'SAR' });
    const isEdit = !!customer;
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSubmit = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Failed to save customer", error);
        } finally {
            setIsSaving(false);
        }
    };

    const sectionTitleClasses = `text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`;
    
    return (
      <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
        <div 
          ref={modalRef}
          style={{
            '--modal-x': `${position.x}px`,
            '--modal-y': `${position.y}px`,
            '--modal-width': `${size.width}px`,
            '--modal-height': `${size.height}px`,
          } as React.CSSProperties}
          className={`fixed inset-0 md:inset-auto md:left-[var(--modal-x)] md:top-[var(--modal-y)] md:w-[var(--modal-width)] md:h-[var(--modal-height)] rounded-none md:rounded-2xl shadow-2xl w-full flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div 
            ref={headerRef}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{isEdit ? 'تعديل العميل' : 'إضافة عميل جديد'}</h3>
            <button onClick={onClose} aria-label="Close" className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-slate-200'} transition-colors`}><X size={24} /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="overflow-y-auto flex-1 p-6 space-y-6">
            <section>
              <h4 className={sectionTitleClasses}><User className="text-cyan-400" /> المعلومات الأساسية</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>الاسم الكامل *</Label><Input type="text" required placeholder="أدخل اسم العميل" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div><Label>رقم الجوال *</Label><Input type="tel" required placeholder="+966xxxxxxxxx" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div><Label>البريد الإلكتروني</Label><Input type="email" placeholder="example@email.com" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div><Label>رقم الهوية</Label><Input type="text" placeholder="1234567890" value={formData.nationalId || ''} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>العنوان</Label><Input type="text" placeholder="المدينة، الحي، الشارع" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                <div><Label>الشركة</Label><Input type="text" placeholder="اسم الشركة" value={formData.company || ''} onChange={(e) => setFormData({ ...formData, company: e.target.value })} /></div>
              </div>
            </section>
            
            <section>
              <h4 className={sectionTitleClasses}><Settings className="text-cyan-400" /> الإعدادات والمالية</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>الحالة</Label><Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}><option value="active">نشط</option><option value="inactive">غير نشط</option><option value="blocked">محظور</option></Select></div>
                <div><Label>المخاطر</Label><Select value={formData.riskLevel} onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as RiskLevel })}><option value="low">منخفض</option><option value="medium">متوسط</option><option value="high">مرتفع</option></Select></div>
                <div><Label>العملة</Label><Select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}><option value="SAR">ريال سعودي (SAR)</option><option value="YER">ريال يمني (YER)</option><option value="OMR">ريال عماني (OMR)</option><option value="USD">دولار أمريكي (USD)</option></Select></div>
              </div>
            </section>
            
            <section>
              <h4 className={sectionTitleClasses}><FileText className="text-cyan-400" /> ملاحظات</h4>
              <div><Textarea placeholder="أضف أي ملاحظات هنا..." value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="resize-none" /></div>
            </section>
          </form>
          <div className={`flex justify-end gap-3 p-4 border-t mt-auto ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
            <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'} font-semibold`}>إلغاء</button>
            <HoloButton variant="success" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'جاري الحفظ...' : (isEdit ? 'حفظ التغييرات' : 'إضافة العميل')}
            </HoloButton>
          </div>
          <div 
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 transition-colors hidden md:block"
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

import React, { useState, useRef } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { X, Save, Upload, Loader, User, Phone, Image } from 'lucide-react';
import { SettingsState } from '../../../types';
import { storageService } from '../../../services/storageService';

interface InvoiceHeaderModalProps {
    initialData: SettingsState['profile'];
    onClose: () => void;
    onSave: (data: Partial<SettingsState['profile']>) => Promise<void>;
}

export const InvoiceHeaderModal: React.FC<InvoiceHeaderModalProps> = ({ initialData, onClose, onSave }) => {
    const { theme, lang, addToast } = useZustandStore();
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
        initialSize: { width: 500, height: 500 },
    });

    const [formData, setFormData] = useState(initialData);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const { publicUrl, error } = await storageService.uploadAttachment(file);
        setIsUploading(false);

        if (error) {
            addToast({ message: `Failed to upload logo: ${error.message}`, type: 'error'});
        } else if (publicUrl) {
            handleChange('avatar', publicUrl);
            addToast({ message: 'تم رفع الشعار بنجاح', type: 'success'});
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };
    
    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className="p-4 border-b border-gray-700 cursor-move flex justify-between items-center">
                    <h3 className="text-lg font-bold">تعديل بيانات الملف الشخصي (للفاتورة)</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-32 h-32 rounded-lg bg-gray-800 flex items-center justify-center">
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                            ) : (
                                <Image size={48} className="text-gray-500"/>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                        <HoloButton variant="secondary" icon={isUploading ? Loader : Upload} onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            {isUploading ? 'جاري الرفع...' : 'رفع الشعار'}
                        </HoloButton>
                    </div>
                    <div>
                        <Label>الاسم (يظهر في الفاتورة)</Label>
                        <Input icon={User} value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                    </div>
                    <div>
                        <Label>رقم الهاتف (يظهر في الفاتورة)</Label>
                        <Input icon={Phone} value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
                    </div>
                </div>
                 <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800">{t.cancel}</button>
                    <HoloButton variant="success" icon={isSaving ? Loader : Save} onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'جاري الحفظ...' : t.save}
                    </HoloButton>
                </div>
            </div>
        </div>
    );
};

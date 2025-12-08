import React, { useState } from 'react';
import { Note, NoteCategory, NotePriority, NoteStatus } from '../../../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { CATEGORY_CONFIG, NOTE_COLORS } from '../lib/utils';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Pin, Star, Lock, Briefcase } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';

interface NoteFormModalProps {
  note?: Note;
  theme: 'light' | 'dark';
  t: Record<string, string>;
  onClose: () => void;
  onSave: (note: Partial<Note>) => Promise<void>;
}

export const NoteFormModal: React.FC<NoteFormModalProps> = ({ note, theme, t, onClose, onSave }) => {
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 896, height: 800 }});
  const { projects, lang } = useZustandStore(state => ({
    projects: state.projects,
    lang: state.lang
  }));
  const isEdit = !!note;
  
  const [formData, setFormData] = useState<Partial<Note>>(note || {
    title: '', content: '', category: 'general', priority: 'medium', status: 'active',
    tags: [], isPinned: false, isFavorite: false, isPrivate: false, author: 'أحمد المدير', color: undefined
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof Note, value: any) => {
    setFormData(p => ({ ...p, [field]: value }));
    if(errors[field]) setErrors(p => ({...p, [field]: ''}));
  };

  const handleTagAction = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags?.includes(tagInput.trim())) {
        handleChange('tags', [...(formData.tags || []), tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => handleChange('tags', formData.tags?.filter(t => t !== tag));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = 'عنوان الملاحظة مطلوب';
    if (!formData.content?.trim()) newErrors.content = 'محتوى الملاحظة مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validate() || isSaving) return;
    setIsSaving(true);
    try {
      const finalData = {
        ...formData,
        updatedDate: new Date().toISOString(),
        hasReminder: !!formData.reminderDate,
      };
      await onSave(finalData);
    } catch (error) {
        console.error("Failed to save note", error);
    } finally {
        setIsSaving(false);
    }
  };
  
  const formInputClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;
  const labelClasses = `block text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`;
  
  return (
    <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
      <div
        ref={modalRef}
        style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
        className={`fixed rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div ref={headerRef} onMouseDown={handleDragStart} onTouchStart={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'}`}>
          <h3 className="text-2xl font-bold">{isEdit ? t.editNote : t.addNote}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={24} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <input type="text" placeholder={t.noteTitle} value={formData.title} onChange={e => handleChange('title', e.target.value)} className={`${formInputClasses} text-lg font-bold`} />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          <textarea placeholder={t.content} value={formData.content} onChange={e => handleChange('content', e.target.value)} rows={8} className={`${formInputClasses} min-h-[150px]`} />
          {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
          
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className={labelClasses}>{t.category}</label><select value={formData.category} onChange={e => handleChange('category', e.target.value as NoteCategory)} className={formInputClasses}>{Object.entries(CATEGORY_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div><label className={labelClasses}>{t.priority}</label><select value={formData.priority} onChange={e => handleChange('priority', e.target.value as NotePriority)} className={formInputClasses}><option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option><option value="urgent">عاجلة</option></select></div>
            <div><label className={labelClasses}>{t.status}</label><select value={formData.status} onChange={e => handleChange('status', e.target.value as NoteStatus)} className={formInputClasses}><option value="active">نشط</option><option value="draft">مسودة</option><option value="completed">مكتمل</option><option value="archived">مؤرشف</option></select></div>
          </div>
          
          <div>
            <label className={labelClasses}>{t.projectLink || 'ربط بمشروع'}</label>
            <div className="relative">
                <Briefcase size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${lang === 'ar' ? 'right-3' : 'left-3'}`} />
                <select value={formData.linkedProject || ''} onChange={e => handleChange('linkedProject', e.target.value || undefined)} className={`${formInputClasses} appearance-none ${lang === 'ar' ? 'pr-10' : 'pl-10'}`}>
                    <option value="">-- {t.none || 'لا يوجد'} --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
          </div>


          <div className="grid md:grid-cols-2 gap-4">
              <div>
                  <label className={labelClasses}>{t.dueDate}</label>
                  <input type="date" value={formData.dueDate?.split('T')[0] || ''} onChange={e => handleChange('dueDate', e.target.value)} className={formInputClasses}/>
              </div>
              <div>
                  <label className={labelClasses}>{t.reminderDate}</label>
                  <input type="datetime-local" value={formData.reminderDate || ''} onChange={e => handleChange('reminderDate', e.target.value)} className={formInputClasses}/>
              </div>
          </div>
          
          <div>
            <label className={labelClasses}>{t.tags}</label>
            <div className="flex flex-wrap gap-2 items-center">
              {formData.tags?.map(tag => <div key={tag} className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-200'}`}><span>{tag}</span><button onClick={() => removeTag(tag)}><X size={14}/></button></div>)}
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagAction} placeholder={t.addTag} className={`${formInputClasses} flex-1 min-w-[150px]`} />
            </div>
          </div>

          <div>
            <label className={labelClasses}>{t.options}</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isPinned} onChange={e => handleChange('isPinned', e.target.checked)} className="w-4 h-4" /> <Pin size={16}/> {t.pin}</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isFavorite} onChange={e => handleChange('isFavorite', e.target.checked)} className="w-4 h-4" /> <Star size={16}/> {t.favorites}</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isPrivate} onChange={e => handleChange('isPrivate', e.target.checked)} className="w-4 h-4" /> <Lock size={16}/> {t.private}</label>
            </div>
          </div>
          <div>
             <label className={labelClasses}>{t.color}</label>
             <div className="flex gap-3 items-center">
                {NOTE_COLORS.map(c => <button key={c.name} type="button" onClick={() => handleChange('color', c.value)} className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === c.value ? 'border-cyan-400 scale-110' : 'border-transparent'}`} style={{backgroundColor: c.value}} title={c.label}/>)}
             </div>
          </div>
        </div>

        <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-semibold ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'}`}>{t.cancel}</button>
          <HoloButton variant="success" icon={Save} onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'جاري الحفظ...' : (isEdit ? t.saveChanges : t.addNote)}</HoloButton>
        </div>
        <div 
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 transition-colors"
          title="Resize"
        >
          <svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg>
        </div>
      </div>
    </div>
  );
};
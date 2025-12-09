
import React from 'react';
import { Note } from '../../../types';
import { AppTheme } from '../../../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { CATEGORY_CONFIG, formatDate } from '../lib/utils';
import { X, Pin, Star, Lock, Calendar, Clock, Edit2, Hash, FileText } from 'lucide-react';
import { HoloButton } from '../../../components/ui/HoloButton';

interface NoteDetailsModalProps {
  note: Note;
  theme: AppTheme;
  lang: 'ar' | 'en';
  t: Record<string, string>;
  onClose: () => void;
  onEdit: (note: Note) => void;
}

export const NoteDetailsModal: React.FC<NoteDetailsModalProps> = ({ note, theme, lang, t, onClose, onEdit }) => {
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 768, height: 700 }});
  const categoryConfig = CATEGORY_CONFIG[note.category];
  const isDark = !theme.startsWith('light');

  return (
    <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
      <div 
        ref={modalRef}
        style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
        className={`fixed rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden ${isDark ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div 
          ref={headerRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={`p-6 border-b flex items-start justify-between cursor-move ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${categoryConfig.bgColor}`}><categoryConfig.icon className={`w-6 h-6 ${categoryConfig.color}`} /></div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{note.title}</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{categoryConfig.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="font-bold mb-2 flex items-center gap-2"><FileText size={18} className="text-cyan-400"/> {t.content}</h3>
            <div className={`p-4 rounded-lg whitespace-pre-wrap ${isDark ? 'bg-gray-800' : 'bg-slate-50'}`}>{note.content}</div>
          </section>
          
          <div className={`p-4 rounded-lg grid grid-cols-2 lg:grid-cols-4 gap-4 ${isDark ? 'bg-gray-800' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400"/><div><p className="text-xs">تاريخ الإنشاء</p><p>{formatDate(note.createdDate)}</p></div></div>
            <div className="flex items-center gap-2"><Clock size={16} className="text-gray-400"/><div><p className="text-xs">آخر تحديث</p><p>{formatDate(note.updatedDate)}</p></div></div>
            {note.dueDate && <div className="flex items-center gap-2"><Calendar size={16} className="text-red-400"/><div><p className="text-xs">الاستحقاق</p><p>{formatDate(note.dueDate)}</p></div></div>}
          </div>

          {note.tags.length > 0 && (
            <section>
              <h3 className="font-bold mb-2 flex items-center gap-2"><Hash size={18} className="text-cyan-400"/> {t.tags}</h3>
              <div className="flex flex-wrap gap-2">
                {note.tags.map(tag => <span key={tag} className={`px-3 py-1 text-sm rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>#{tag}</span>)}
              </div>
            </section>
          )}

          <div className="flex items-center gap-4">
            {note.isPinned && <div className="flex items-center gap-2"><Pin size={16} className="text-cyan-400"/><span>{t.pinned}</span></div>}
            {note.isFavorite && <div className="flex items-center gap-2"><Star size={16} className="text-yellow-400"/><span>{t.favorites}</span></div>}
            {note.isPrivate && <div className="flex items-center gap-2"><Lock size={16} className="text-gray-400"/><span>{t.private}</span></div>}
          </div>
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-slate-200'} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-lg font-semibold ${isDark ? 'bg-gray-800' : 'bg-slate-200'}`}>{t.close}</button>
          <HoloButton variant="secondary" icon={Edit2} onClick={() => { onEdit(note); onClose(); }}>{t.editNote}</HoloButton>
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

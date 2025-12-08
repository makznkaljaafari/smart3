import React from 'react';
import { Note } from '../../../types';
import { getPriorityLabel, getStatusLabel, formatShortDate, CATEGORY_CONFIG, getPriorityClass, getStatusClass } from '../lib/utils';
import { Pin, Star, Lock, Calendar, Clock, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  theme: 'light' | 'dark';
  lang: 'ar' | 'en';
  onView: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, key: 'isPinned' | 'isFavorite') => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, theme, lang, onView, onEdit, onDelete, onToggle }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const categoryConfig = CATEGORY_CONFIG[note.category];
  const CategoryIcon = categoryConfig.icon;

  const cardClasses = `bg-[rgb(var(--bg-secondary-rgb))] border-[rgb(var(--border-primary-rgb))] hover:border-[var(--accent-border-50)]`;
    
  const noteColorStyle = theme === 'dark' 
    ? { backgroundColor: note.color || undefined, borderColor: note.color ? `${note.color.slice(0, 7)}` : undefined }
    : { backgroundColor: note.color ? note.color.replace('33', '80') : undefined };

  return (
    <div 
      className={`p-4 rounded-xl border transition-all duration-300 flex flex-col h-full cursor-pointer ${cardClasses}`}
      style={noteColorStyle}
      onClick={() => onView(note)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`p-1.5 rounded-lg ${categoryConfig.bgColor}`}><CategoryIcon className={`w-4 h-4 ${categoryConfig.color}`} /></div>
          <h3 className={`font-bold truncate text-[rgb(var(--text-primary-rgb))]`}>{note.title}</h3>
        </div>
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button onClick={() => setMenuOpen(!menuOpen)} onBlur={() => setTimeout(() => setMenuOpen(false), 200)} className="p-2 rounded-full hover:bg-[rgb(var(--bg-interactive-rgb))]"><MoreVertical size={18} /></button>
          {menuOpen && (
            <div className={`absolute ${lang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-40 rounded-lg shadow-xl z-10 border bg-[rgb(var(--bg-secondary-rgb))] border-[rgb(var(--border-primary-rgb))]`}>
              <button onClick={() => onEdit(note)} className="w-full flex items-center gap-2 px-4 py-2 text-right rounded-t-lg hover:bg-[rgb(var(--bg-tertiary-rgb))]"><Edit2 size={16} /> تعديل</button>
              <button onClick={() => onDelete(note.id)} className="w-full flex items-center gap-2 px-4 py-2 text-right text-red-500 hover:bg-red-500/10 rounded-b-lg"><Trash2 size={16} /> حذف</button>
            </div>
          )}
        </div>
      </div>
      <p className={`text-sm flex-1 mb-3 whitespace-pre-wrap line-clamp-3 text-[rgb(var(--text-secondary-rgb))]`}>{note.content}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={getPriorityClass(note.priority)}>{getPriorityLabel(note.priority)}</span>
        <span className={getStatusClass(note.status)}>{getStatusLabel(note.status)}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {note.tags.slice(0,3).map(tag => <span key={tag} className={`px-2 py-0.5 rounded text-xs bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-secondary-rgb))]`}>#{tag}</span>)}
        {note.tags.length > 3 && <span className="px-2 py-0.5 rounded text-xs bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-muted-rgb))]">+{note.tags.length - 3}</span>}
      </div>

      <div className={`mt-auto pt-3 border-t flex justify-between items-center text-xs border-[rgb(var(--border-primary-rgb))] text-[rgb(var(--text-muted-rgb))]`}>
        <div className="flex items-center gap-2">
          {note.dueDate && <span className={`flex items-center gap-1 ${new Date(note.dueDate) < new Date() && note.status !== 'completed' ? 'text-red-400' : ''}`}><Calendar size={14}/>{formatShortDate(note.dueDate)}</span>}
          <span className="flex items-center gap-1"><Clock size={14}/>{formatShortDate(note.updatedDate)}</span>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {note.isPrivate && <span title="خاصة"><Lock size={14} /></span>}
          <button onClick={() => onToggle(note.id, 'isFavorite')} className={note.isFavorite ? 'text-yellow-400' : ''}><Star size={14} className={note.isFavorite ? 'fill-current' : ''} /></button>
          <button onClick={() => onToggle(note.id, 'isPinned')} className={note.isPinned ? 'text-cyan-400' : ''}><Pin size={14} className={note.isPinned ? 'fill-current' : ''} /></button>
        </div>
      </div>
    </div>
  );
};
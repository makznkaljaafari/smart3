
import React from 'react';
import { Note } from '../../../types';
import { AppTheme } from '../../../types';
import { getPriorityLabel, getStatusLabel, formatShortDate, CATEGORY_CONFIG, getPriorityClass, getStatusClass } from '../lib/utils';
import { Pin, Star, Edit2, Trash2, Eye, SortAsc, SortDesc } from 'lucide-react';

interface NoteTableProps {
  notes: Note[];
  theme: AppTheme;
  lang: 'ar' | 'en';
  sort: { field: string; order: 'asc' | 'desc' };
  onSort: (field: string) => void;
  onView: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, key: 'isPinned' | 'isFavorite') => void;
}

export const NoteTable: React.FC<NoteTableProps> = ({ notes, theme, lang, sort, onSort, onView, onEdit, onDelete, onToggle }) => {
  const SortIcon = sort.order === 'asc' ? SortAsc : SortDesc;
  const isDark = !theme.startsWith('light');
  
  const headerClasses = `p-4 font-semibold cursor-pointer hover:bg-[rgb(var(--bg-tertiary-rgb))]`;
  
  return (
    <div className={`rounded-lg overflow-x-auto border border-[rgb(var(--border-primary-rgb))] bg-[rgb(var(--bg-secondary-rgb))]`}>
      <table className="w-full text-sm text-left responsive-table">
        <thead className={`bg-[rgb(var(--bg-tertiary-rgb))]`}>
          <tr>
            <th className="p-4"></th>
            <th onClick={() => onSort('title')} className={headerClasses}><div className="flex items-center gap-2">العنوان {sort.field === 'title' && <SortIcon size={16}/>}</div></th>
            <th onClick={() => onSort('category')} className={headerClasses}><div className="flex items-center gap-2">التصنيف {sort.field === 'category' && <SortIcon size={16}/>}</div></th>
            <th onClick={() => onSort('priority')} className={headerClasses}><div className="flex items-center gap-2">الأولوية {sort.field === 'priority' && <SortIcon size={16}/>}</div></th>
            <th className="p-4 font-semibold">الحالة</th>
            <th onClick={() => onSort('date')} className={headerClasses}><div className="flex items-center gap-2">آخر تحديث {sort.field === 'date' && <SortIcon size={16}/>}</div></th>
            <th className="p-4 font-semibold text-right">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {notes.map(note => {
            const categoryConfig = CATEGORY_CONFIG[note.category];
            const CategoryIcon = categoryConfig.icon;
            const noteColorStyle = isDark 
                ? { backgroundColor: note.color || undefined }
                : { backgroundColor: note.color ? note.color.replace('33', '80') : undefined };

            return (
              <tr key={note.id} className={`border-b border-[rgb(var(--border-primary-rgb))] hover:bg-[rgb(var(--bg-tertiary-rgb))]`} style={noteColorStyle}>
                <td className="p-4" onClick={e => e.stopPropagation()} data-label="">
                  <div className="flex gap-2">
                    <button onClick={() => onToggle(note.id, 'isPinned')} className={note.isPinned ? 'text-cyan-400' : ''}><Pin size={16} className={note.isPinned ? 'fill-current' : ''} /></button>
                    <button onClick={() => onToggle(note.id, 'isFavorite')} className={note.isFavorite ? 'text-yellow-400' : ''}><Star size={16} className={note.isFavorite ? 'fill-current' : ''} /></button>
                  </div>
                </td>
                <td className="p-4 cursor-pointer" onClick={() => onView(note)} data-label="العنوان">
                    <div className="font-semibold">{note.title}</div>
                    <div className={`text-xs text-[rgb(var(--text-muted-rgb))]`}>{note.content.substring(0, 40)}...</div>
                </td>
                <td className="p-4 cursor-pointer" onClick={() => onView(note)} data-label="التصنيف"><div className="flex items-center gap-2"><div className={`p-1.5 rounded ${categoryConfig.bgColor}`}><CategoryIcon className={`w-4 h-4 ${categoryConfig.color}`} /></div><span>{categoryConfig.label}</span></div></td>
                <td className="p-4 cursor-pointer" onClick={() => onView(note)} data-label="الأولوية"><span className={getPriorityClass(note.priority)}>{getPriorityLabel(note.priority)}</span></td>
                <td className="p-4 cursor-pointer" onClick={() => onView(note)} data-label="الحالة"><span className={getStatusClass(note.status)}>{getStatusLabel(note.status)}</span></td>
                <td className="p-4 cursor-pointer" onClick={() => onView(note)} data-label="آخر تحديث">{formatShortDate(note.updatedDate)}</td>
                <td className="p-4 text-right" onClick={e => e.stopPropagation()} data-label="إجراءات">
                  <button onClick={() => onView(note)} className={`p-2 rounded-lg hover:bg-[rgb(var(--bg-interactive-rgb))]`}><Eye size={18} /></button>
                  <button onClick={() => onEdit(note)} className={`p-2 rounded-lg hover:bg-[rgb(var(--bg-interactive-rgb))]`}><Edit2 size={18} /></button>
                  <button onClick={() => onDelete(note.id)} className={`p-2 rounded-lg text-red-500 hover:bg-red-500/10`}><Trash2 size={18} /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};


import React from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { SciFiCard } from '../../components/ui/SciFiCard';
import { HoloButton } from '../../components/ui/HoloButton';
import { NoteCard } from './components/NoteCard';
import { NoteTable } from './components/NoteTable';
import { NoteDetailsModal } from './components/NoteDetailsModal';
import { NoteFormModal } from './components/NoteFormModal';
import { useNotesData } from './hooks/useNotesData';
import { CATEGORY_CONFIG } from './lib/utils';
import {
  Plus, Search, FilterX, LayoutGrid, List, FileText,
  Pin, Bell, AlertCircle, Filter, ServerCrash
} from 'lucide-react';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const NotesView: React.FC = () => {
  const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
  const t = translations[lang];

  const {
    stats,
    viewMode,
    setViewMode,
    sort,
    handleSort,
    filters,
    setFilters,
    showAdvancedFilters,
    setShowAdvancedFilters,
    filteredNotes,
    selectedNote,
    showDetailsModal,
    showFormModal,
    editingNote,
    notesLoading,
    notesError,
    handleSave,
    handleDelete,
    handleToggle,
    handleViewDetails,
    handleEdit,
    handleOpenForm,
    handleCloseModals,
    deletingNoteId,
    isDeleting,
    confirmDelete,
    cancelDelete,
  } = useNotesData();

  const formControlClasses = `px-4 py-2.5 rounded-lg border focus:outline-none transition-colors bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))]`;
  
  const renderContent = () => {
    if (notesLoading) {
      return <LoadingState message={lang === 'ar' ? 'جاري تحميل الملاحظات...' : 'Loading notes...'} />;
    }
    
    if (notesError) {
      return (
        <EmptyState 
            icon={ServerCrash} 
            title={t.unexpectedError || "Error"} 
            description={notesError} 
            variant="error" 
        />
      );
    }

    if (filteredNotes.length > 0) {
      const gridView = (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map(n => <NoteCard key={n.id} note={n} theme={theme} lang={lang} onEdit={handleEdit} onDelete={handleDelete} onView={handleViewDetails} onToggle={handleToggle} />)}
          </div>
      );
      const listView = <NoteTable notes={filteredNotes} theme={theme} lang={lang} sort={sort} onSort={handleSort} onEdit={handleEdit} onDelete={handleDelete} onView={handleViewDetails} onToggle={handleToggle} />;

      return (
        <>
          <div className="block lg:hidden">
              {gridView}
          </div>
          <div className="hidden lg:block">
              {viewMode === 'grid' ? gridView : listView}
          </div>
          <p className="text-center text-sm mt-4 text-gray-500">{t.showing} {filteredNotes.length} {t.ofTotal} {stats.total} {t.note}</p>
        </>
      );
    }
    
    return (
        <EmptyState 
            icon={FileText} 
            title={filters.searchQuery ? t.noNotesFound : t.noNotesYet} 
            description={filters.searchQuery ? '' : t.addFirstNote}
            actionLabel={!filters.searchQuery ? t.addNote : undefined}
            onAction={!filters.searchQuery ? handleOpenForm : undefined}
        />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold text-[rgb(var(--text-primary-rgb))]`}>{t.manageNotes}</h1>
          <p className={`text-[rgb(var(--text-secondary-rgb))]`}>{t.organizeNotes}</p>
        </div>
        <HoloButton icon={Plus} variant="primary" onClick={handleOpenForm}>{t.addNote}</HoloButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SciFiCard theme={theme} title={t.totalNotes} value={`${stats.total} (${stats.active} ${t.active})`} icon={FileText} color="cyan" />
        <SciFiCard theme={theme} title={t.pinned} value={`${stats.pinned} (${stats.favorites} ${t.favorites})`} icon={Pin} color="purple" />
        <SciFiCard theme={theme} title={t.upcomingReminders} value={stats.reminders.toString()} icon={Bell} color="green" />
        <SciFiCard theme={theme} title={t.overdue} value={stats.overdue.toString()} icon={AlertCircle} color="orange" />
      </div>
      
      <div className={`p-4 rounded-2xl border bg-[rgb(var(--bg-secondary-rgb))] border-[rgb(var(--border-primary-rgb))] shadow-sm`}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative"><Search className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} /><input type="text" value={filters.searchQuery} onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))} placeholder={t.searchNotes} className={`${formControlClasses} w-full ${lang === 'ar' ? 'pr-10' : 'pl-10'}`} /></div>
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value as any }))} className={formControlClasses}><option value="all">{t.allCategories}</option>{Object.entries(CATEGORY_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value as any }))} className={formControlClasses}><option value="all">{t.allStatuses}</option>{['active', 'draft', 'completed', 'archived'].map(s => <option key={s} value={s}>{t[s] || s}</option>)}</select>
          <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`${formControlClasses} flex items-center gap-2`}><Filter size={18} /> {t.advancedFilters}</button>
          <button onClick={() => setFilters({ category: 'all', status: 'all', searchQuery: '', dateFrom: '', dateTo: '' })} className={formControlClasses} title={t.clearFilters}><FilterX size={18} /></button>
          <div className={`rounded-lg p-1 hidden lg:flex items-center gap-1 bg-[rgb(var(--bg-tertiary-rgb))]`}>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-[var(--accent-bg-20)] text-[var(--accent-400)]' : 'text-[rgb(var(--text-muted-rgb))] hover:bg-[rgb(var(--bg-interactive-rgb))]'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-[var(--accent-bg-20)] text-[var(--accent-400)]' : 'text-[rgb(var(--text-muted-rgb))] hover:bg-[rgb(var(--bg-interactive-rgb))]'}`}><List size={20} /></button>
          </div>
        </div>
         {showAdvancedFilters && (
          <div className={`mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-3 border-[rgb(var(--border-primary-rgb))]`}>
            <div><label className="text-xs text-[rgb(var(--text-muted-rgb))]">{t.dateFrom}</label><input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({...f, dateFrom: e.target.value}))} className={`${formControlClasses} w-full`} /></div>
            <div><label className="text-xs text-[rgb(var(--text-muted-rgb))]">{t.dateTo}</label><input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({...f, dateTo: e.target.value}))} className={`${formControlClasses} w-full`} /></div>
          </div>
        )}
      </div>
      
      {renderContent()}
      
      {showDetailsModal && selectedNote && <NoteDetailsModal note={selectedNote} theme={theme} lang={lang} t={t} onClose={handleCloseModals} onEdit={handleEdit} />}
      {showFormModal && <NoteFormModal note={editingNote || undefined} theme={theme} t={t} onClose={handleCloseModals} onSave={handleSave} />}
      
      <ConfirmationModal
        isOpen={!!deletingNoteId}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title={t.areYouSureDeleteNote}
        message={t.deleteConfirmationMessageNote}
        confirmText={t.confirmDelete}
        isConfirming={isDeleting}
      />
    </div>
  );
};

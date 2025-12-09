import React, { useEffect } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { HoloButton } from '../../components/ui/HoloButton';
import { ExpenseCard } from './components/ExpenseCard';
import { ExpenseRow } from './components/ExpenseRow';
import { ExpenseDetailsModal } from './components/ExpenseDetailsModal';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import {
  Plus, Search, Filter, Download, Upload, FilterX,
  LayoutGrid, List, ChevronLeft, ChevronRight,
  BarChart3, Tag, Copy
} from 'lucide-react';
import { CATEGORY_CONFIG, getStatusLabel, getPriorityLabel } from './lib/utils';
import { useExpenseData } from './hooks/useExpenseData';
import { ExpenseStatus, ExpensePriority } from './types';
import { SciFiCard } from '../../components/ui/SciFiCard';
import { formatCurrency } from './lib/utils';
import { eventBus } from '../../lib/events';
import { AppTheme } from '../../types';

export const ExpensesView: React.FC = () => {
  const { theme, lang, currency } = useZustandStore(state => ({
    theme: state.theme,
    lang: state.lang,
    currency: state.settings.baseCurrency
  }));
  const t = translations[lang];

  const {
    stats,
    filters,
    setFilters,
    showAdvancedFilters,
    setShowAdvancedFilters,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    paginatedExpenses,
    filteredExpenses,
    totalPages,
    selectedExpense,
    showDetailsModal,
    showFormModal,
    editingExpense,
    handleViewDetails,
    handleEdit,
    handleDelete,
    handleSave,
    handleExport,
    handleImport,
    clearFilters,
    handleOpenForm,
    handleCloseForm,
    handleCloseDetails,
  } = useExpenseData();
  
  useEffect(() => {
    const unsubscribe = eventBus.subscribe((e) => {
      if (e.type === 'SHOW_ADD_EXPENSE_MODAL') {
        handleOpenForm();
      }
    });
    return unsubscribe;
  }, [handleOpenForm]);

  const formControlClasses = `px-4 py-2.5 rounded-lg border focus:outline-none transition-colors bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))]`;
  const allExpenseStatuses: ExpenseStatus[] = ['pending', 'approved', 'paid', 'rejected', 'cancelled'];
  const allExpensePriorities: ExpensePriority[] = ['low', 'medium', 'high', 'urgent'];

  const handlePay = () => {
      // Placeholder for payment logic
      alert("Not implemented yet in this view");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-2">
            <HoloButton icon={Plus} variant="primary" onClick={handleOpenForm}>{t.addExpense}</HoloButton>
            <HoloButton icon={Upload} variant="secondary" className="relative"><input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>{t.importExpenses}</HoloButton>
            <HoloButton icon={Download} variant="secondary" onClick={handleExport}>{t.exportExpenses}</HoloButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SciFiCard theme={theme as AppTheme} title={t.totalExpensesThisMonth} value={formatCurrency(stats.totalThisMonth, currency)} icon={BarChart3} color="cyan" />
        <SciFiCard theme={theme as AppTheme} title={t.mostSpentCategory} value={stats.mostSpentCategory} icon={Tag} color="purple" />
        <SciFiCard theme={theme as AppTheme} title={t.totalEntries} value={stats.totalEntries.toString()} icon={Copy} color="green" />
      </div>

      <div className={`p-4 rounded-2xl border bg-[rgb(var(--bg-secondary-rgb))] border-[rgb(var(--border-primary-rgb))] shadow-sm`}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative"><Search className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} /><input type="text" value={filters.searchQuery} onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))} placeholder={t.searchExpenses} className={`${formControlClasses} w-full ${lang === 'ar' ? 'pr-10' : 'pl-10'}`} /></div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`${formControlClasses} flex items-center gap-2`}><Filter size={18} /> {t.advancedFilters}</button>
            <button onClick={clearFilters} className={formControlClasses}><FilterX size={18} /></button>
            <div className={`rounded-lg p-1 hidden lg:flex items-center gap-1 bg-[rgb(var(--bg-tertiary-rgb))]`}>
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-[var(--accent-bg-20)] text-[var(--accent-400)]' : 'text-[rgb(var(--text-muted-rgb))] hover:bg-[rgb(var(--bg-interactive-rgb))]'}`}><LayoutGrid size={20} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-[var(--accent-bg-20)] text-[var(--accent-400)]' : 'text-[rgb(var(--text-muted-rgb))] hover:bg-[rgb(var(--bg-interactive-rgb))]'}`}><List size={20} /></button>
            </div>
          </div>
        </div>
        {showAdvancedFilters && <div className={`mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 border-[rgb(var(--border-primary-rgb))]`}>
            <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value as any }))} className={formControlClasses}><option value="all">{t.allCategories}</option>{Object.entries(CATEGORY_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value as any }))} className={formControlClasses}><option value="all">{t.allStatuses}</option>{allExpenseStatuses.map(s => <option key={s} value={s}>{getStatusLabel(s as ExpenseStatus)}</option>)}</select>
            <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value as any }))} className={formControlClasses}><option value="all">{t.allPriorities}</option>{allExpensePriorities.map(p => <option key={p} value={p}>{getPriorityLabel(p as ExpensePriority)}</option>)}</select>
            <input type="date" value={filters.dateFrom || ''} onChange={e => setFilters(f => ({...f, dateFrom: e.target.value}))} className={formControlClasses} placeholder={t.dateFrom} />
            <input type="date" value={filters.dateTo || ''} onChange={e => setFilters(f => ({...f, dateTo: e.target.value}))} className={formControlClasses} placeholder={t.dateTo} />
        </div>}
      </div>
      
      {paginatedExpenses.length > 0 ? (
        <>
          <div className="block lg:hidden">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedExpenses.map(e => <ExpenseCard key={e.id} expense={e} theme={theme as AppTheme} onEdit={() => handleEdit(e)} onDelete={() => handleDelete(e.id)} onViewDetails={() => handleViewDetails(e)} onPay={handlePay} />)}
            </div>
          </div>
          <div className="hidden lg:block">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paginatedExpenses.map(e => <ExpenseCard key={e.id} expense={e} theme={theme as AppTheme} onEdit={() => handleEdit(e)} onDelete={() => handleDelete(e.id)} onViewDetails={() => handleViewDetails(e)} onPay={handlePay} />)}
              </div>
            ) : (
              <div className={`rounded-lg overflow-x-auto border border-[rgb(var(--border-primary-rgb))] bg-[rgb(var(--bg-secondary-rgb))]`}>
                <table className="w-full text-sm">
                  <thead className={`bg-[rgb(var(--bg-tertiary-rgb))]`}><tr className="text-left">{['المصروف', 'المبلغ', 'التاريخ', 'الحالة', 'الأولوية', 'إجراءات'].map(h => <th key={h} className="p-4 font-semibold">{h}</th>)}</tr></thead>
                  <tbody>{paginatedExpenses.map(e => <ExpenseRow key={e.id} expense={e} theme={theme as AppTheme} onEdit={() => handleEdit(e)} onDelete={() => handleDelete(e.id)} onViewDetails={() => handleViewDetails(e)} onPay={handlePay} />)}</tbody>
                </table>
              </div>
            )}
          </div>
          <div className={`flex items-center justify-between pt-4 mt-4 border-t border-[rgb(var(--border-primary-rgb))] text-[rgb(var(--text-secondary-rgb))]`}>
            <span className="text-sm">{lang === 'ar' ? `عرض ${paginatedExpenses.length} من ${filteredExpenses.length} مصروف` : `Showing ${paginatedExpenses.length} of ${filteredExpenses.length} expenses`}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={20} /></button>
              <span>{t.page} {currentPage} {t.of} {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={20} /></button>
            </div>
          </div>
        </>
      ) : (
        <div className={`text-center p-12 rounded-2xl border-2 border-dashed border-[rgb(var(--border-primary-rgb))] bg-[rgb(var(--bg-secondary-rgb))]`}>
          <Tag size={48} className="mx-auto text-[rgb(var(--text-muted-rgb))] mb-4" />
          <h3 className={`font-semibold text-lg mb-2 text-[rgb(var(--text-primary-rgb))]`}>{filters.searchQuery ? t.noExpensesFound : t.noExpensesYet}</h3>
          <p className="text-[rgb(var(--text-muted-rgb))] mb-6">{filters.searchQuery ? '' : t.addFirstExpense}</p>
          {!filters.searchQuery && <HoloButton variant="primary" icon={Plus} onClick={handleOpenForm}>{t.addExpense}</HoloButton>}
        </div>
      )}

      {showDetailsModal && selectedExpense && <ExpenseDetailsModal t={t} theme={theme as AppTheme} expense={selectedExpense} onClose={handleCloseDetails} onEdit={handleEdit} />}
      {showFormModal && <ExpenseFormModal t={t} theme={theme as AppTheme} expense={editingExpense || undefined} onClose={handleCloseForm} onSave={handleSave} />}
    </div>
  );
};
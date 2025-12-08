
import React from 'react';
import { ServerCrash, Inbox, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';

export interface DataTableColumn {
  header: React.ReactNode;
  className?: string;
  width?: string;
  sortable?: boolean;
  field?: string; // Field key for sorting
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn[];
  renderRow: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyIcon?: React.ElementType;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    showingText?: string;
  };
  selection?: {
    selectedCount: number;
    onSelectAll: (checked: boolean) => void;
    isAllSelected: boolean;
  };
  sorting?: {
    sortBy: string;
    sortDir: 'asc' | 'desc';
    onSort: (field: string) => void;
  };
  actions?: React.ReactNode;
  responsive?: boolean;
}

const DataTableInner = <T extends { id: string }>({
  data = [],
  columns,
  renderRow,
  isLoading = false,
  error = null,
  emptyMessage,
  emptyIcon: EmptyIcon = Inbox,
  pagination,
  selection,
  sorting,
  actions,
  responsive = true,
}: DataTableProps<T>) => {
  const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
  const t = translations[lang];
  const isDark = theme === 'dark';

  // Enhanced visual styles
  const tableHeaderClasses = `p-4 text-sm font-bold sticky top-0 z-10 backdrop-blur-md transition-colors duration-300 select-none ${
      isDark 
        ? 'bg-slate-900/90 text-slate-300 border-b border-slate-700 shadow-sm' 
        : 'bg-white/95 text-slate-700 border-b border-slate-200 shadow-sm'
  }`;
  
  const containerClasses = `rounded-xl overflow-hidden border shadow-inner transition-all duration-300 ${
      isDark ? 'border-gray-800 bg-gray-900/50' : 'border-slate-200 bg-white'
  }`;

  if (isLoading) {
    return <LoadingState message={t.loading || "Loading..."} />;
  }

  if (error) {
    return (
      <EmptyState 
        icon={ServerCrash} 
        title={t.unexpectedError || 'Error'} 
        description={error} 
        variant="error"
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
        {actions && <div className="flex justify-end">{actions}</div>}
        <EmptyState 
            icon={EmptyIcon as any} 
            title={emptyMessage || t.noItemsFound} 
            description=""
            className="py-16"
        />
      </div>
    );
  }

  return (
    <>
      {(selection || actions) && (
        <div className="flex items-center justify-between mb-4 px-1 min-h-[40px] animate-in fade-in slide-in-from-bottom-2">
          {selection ? (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${selection.selectedCount > 0 ? (isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700') : 'border-transparent opacity-0'}`}>
                 <span className="text-sm font-medium">{selection.selectedCount} {t.selected}</span>
              </div>
          ) : <div />}
          <div className="flex gap-2">{actions}</div>
        </div>
      )}

      <div className={containerClasses}>
        <table className={`w-full text-sm border-collapse ${responsive ? 'responsive-table' : ''}`}>
          <thead>
            <tr>
              {selection && (
                <th className={`${tableHeaderClasses} w-12 text-center`}>
                  <div className="flex items-center justify-center">
                    <input 
                        type="checkbox" 
                        onChange={(e) => selection.onSelectAll(e.target.checked)} 
                        className={`w-4 h-4 rounded cursor-pointer transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600 focus:ring-offset-gray-900' : 'border-gray-300 text-cyan-600 focus:ring-cyan-500'}`}
                        checked={selection.isAllSelected}
                    />
                  </div>
                </th>
              )}
              {columns.map((col, idx) => (
                <th 
                    key={idx} 
                    className={`${tableHeaderClasses} ${col.className || ''} ${col.sortable ? 'cursor-pointer hover:bg-white/5 transition-colors group' : ''}`} 
                    style={{ width: col.width }}
                    onClick={() => col.sortable && col.field && sorting?.onSort(col.field)}
                >
                  <div className={`flex items-center gap-1.5 ${col.className?.includes('text-right') ? 'justify-end' : (col.className?.includes('text-center') ? 'justify-center' : 'justify-start')}`}>
                      {col.header}
                      {col.sortable && sorting && (
                          <span className={`text-xs transition-opacity duration-200 ${sorting.sortBy === col.field ? 'opacity-100' : 'opacity-30 group-hover:opacity-70'}`}>
                              {sorting.sortBy === col.field ? (
                                  sorting.sortDir === 'asc' ? <ArrowUp size={14} className="text-cyan-500"/> : <ArrowDown size={14} className="text-cyan-500"/>
                              ) : (
                                  <ChevronsUpDown size={14} />
                              )}
                          </span>
                      )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/10 dark:divide-white/5">
            {data.map((item, index) => renderRow(item, index))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className={`flex flex-col sm:flex-row items-center justify-between pt-4 mt-4 border-t transition-colors duration-300 gap-4 ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
          <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {pagination.showingText}
          </span>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))} 
              disabled={pagination.currentPage === 1} 
              className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'hover:bg-white/10 hover:text-white bg-gray-800' : 'hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200'}`}
              aria-label="Previous Page"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className={`flex items-center px-4 py-1.5 rounded-lg font-mono font-bold text-sm ${isDark ? 'bg-gray-800 text-cyan-400' : 'bg-slate-100 text-slate-700'}`}>
                <span>{pagination.currentPage}</span>
                <span className="mx-2 opacity-50">/</span>
                <span className="opacity-70">{pagination.totalPages}</span>
            </div>

            <button 
              onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))} 
              disabled={pagination.currentPage === pagination.totalPages} 
              className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'hover:bg-white/10 hover:text-white bg-gray-800' : 'hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200'}`}
              aria-label="Next Page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;

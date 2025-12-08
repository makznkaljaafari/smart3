
import React, { useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Download, Upload, LayoutGrid, List, AlertCircle, DollarSign, Trash2, Users, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { HoloButton } from '../../components/ui/HoloButton';
import { useZustandStore } from '../../store/useStore';
import { SciFiCard } from '../../components/ui/SciFiCard';
import { translations } from '../../lib/i18n';
import { CustomerCard } from './components/CustomerCard';
import { CustomerRow } from './components/CustomerRow';
import { CustomerDetailsModal } from './components/CustomerDetailsModal';
import { CustomerFormModal } from './components/CustomerFormModal';
import { formatCurrency } from './lib/utils';
import { useCustomerData } from './hooks/useCustomerData';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { BulkActionBar } from '../../components/common/BulkActionBar';
import { eventBus } from '../../lib/events';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { DataTable, DataTableColumn } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Customer } from './types';
import { AppTheme } from '../../types';

export const CustomersView: React.FC = () => {
  const { theme, lang, settings } = useZustandStore(state => ({
    theme: state.theme,
    lang: state.lang,
    settings: state.settings
  }));
  const t = translations[lang];
  const isDark = theme !== 'light';

  const {
    stats,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    riskFilter, setRiskFilter,
    selectedCustomer, showDetailsModal, showFormModal,
    editingCustomer, viewMode, setViewMode,
    currentPage, setCurrentPage,
    paginatedCustomers, filteredCustomers, totalPages,
    customersLoading, customersError,
    handleViewCustomer, handleEditCustomer, handleDeleteCustomer,
    handleSaveCustomer, handleExport, handleImport,
    handleOpenForm, handleCloseModals,
    deletingCustomerId, isDeleting, confirmDeleteCustomer, cancelDeleteCustomer,
    selectedIds, handleSelect, handleSelectAll, isAllSelected,
    handleDeleteSelected, isBulkDeleteConfirmOpen, confirmBulkDelete, cancelBulkDelete,
    clearSelection
  } = useCustomerData();

  useEffect(() => {
    const unsubscribe = eventBus.subscribe((e) => {
      if (e.type === 'SHOW_ADD_CUSTOMER_MODAL') handleOpenForm();
    });
    return unsubscribe;
  }, [handleOpenForm]);

  const formControlClasses = `px-4 py-2.5 rounded-lg border focus:outline-none transition-colors ${isDark ? 'bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))]' : 'bg-white text-slate-800 border-slate-300'}`;
  const bulkActions = [{ label: t.deleteSelected, icon: Trash2, onClick: handleDeleteSelected, variant: 'danger' as const }];

  const columns: DataTableColumn[] = useMemo(() => [
      { header: t.customer, className: 'text-right' },
      { header: t.status, className: 'text-center' },
      { header: t.risks, className: 'text-center' },
      { header: t.remainingAmount, className: 'text-right font-mono' },
      { header: t.actions, className: 'text-center' },
  ], [t]);

  const renderContent = () => {
    if (customersLoading) return <LoadingState message={lang === 'ar' ? 'جاري تحميل العملاء...' : 'Loading customers...'} />;

    if (customersError) {
        return <EmptyState icon={AlertCircle} title="Error" description={typeof customersError === 'string' ? customersError : 'Unknown error'} variant="error" />;
    }
    
    if (paginatedCustomers.length > 0) {
      return (
        <>
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedCustomers.map((c) => (
                        <CustomerCard 
                            key={c.id} 
                            customer={c} 
                            theme={theme} 
                            lang={lang} 
                            baseCurrency={settings.baseCurrency} 
                            exchangeRates={settings.exchangeRates} 
                            onView={() => handleViewCustomer(c)} 
                            onEdit={() => handleEditCustomer(c)} 
                            onDelete={() => handleDeleteCustomer(c.id)} 
                            isSelected={selectedIds.has(c.id)} 
                            onSelect={() => handleSelect(c.id)} 
                        />
                    ))}
                </div>
            ) : (
                <DataTable<Customer>
                    data={paginatedCustomers}
                    columns={columns}
                    selection={{
                        selectedCount: selectedIds.size,
                        isAllSelected: isAllSelected,
                        onSelectAll: handleSelectAll
                    }}
                    renderRow={(c, i) => (
                        <CustomerRow 
                            key={c.id} 
                            customer={c} 
                            theme={theme} 
                            lang={lang} 
                            baseCurrency={settings.baseCurrency} 
                            exchangeRates={settings.exchangeRates} 
                            onView={() => handleViewCustomer(c)} 
                            onEdit={() => handleEditCustomer(c)} 
                            onDelete={() => handleDeleteCustomer(c.id)} 
                            isSelected={selectedIds.has(c.id)} 
                            onSelect={() => handleSelect(c.id)} 
                        />
                    )}
                />
            )}
            
            {/* Pagination Controls */}
            <div className={`flex items-center justify-between pt-4 mt-4 border-t ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                    {lang === 'ar' ? `عرض ${paginatedCustomers.length} من ${stats.total} عميل` : `Showing ${paginatedCustomers.length} of ${stats.total} customers`}
                </span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                        disabled={currentPage === 1} 
                        className={`p-2 rounded-lg disabled:opacity-50 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-200'}`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="px-2 font-bold">{currentPage} / {totalPages}</span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                        disabled={currentPage === totalPages} 
                        className={`p-2 rounded-lg disabled:opacity-50 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-200'}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </>
      );
    }
    
    return (
        <EmptyState 
            icon={Users} 
            title={searchTerm ? t.noCustomersFound : t.noCustomersYet} 
            description={searchTerm ? 'حاول تعديل معايير البحث أو مسح الفلاتر.' : t.addFirstCustomer} 
            actionLabel={!searchTerm ? t.addCustomer : undefined} 
            onAction={!searchTerm ? handleOpenForm : undefined} 
        />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SciFiCard theme={theme as AppTheme} title="إجمالي العملاء" value={stats.total.toString()} icon={Users} color="cyan" />
        <SciFiCard theme={theme as AppTheme} title="العملاء النشطون" value={stats.active.toString()} icon={User} color="green" />
        <SciFiCard theme={theme as AppTheme} title="عملاء عالي المخاطر" value={stats.highRisk.toString()} icon={AlertCircle} color="orange" />
        <SciFiCard theme={theme as AppTheme} title="إجمالي الديون" value={formatCurrency(stats.totalDebt, settings.baseCurrency)} icon={DollarSign} color="purple" />
      </div>

      <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row gap-4 justify-between items-center ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <HoloButton icon={Plus} variant="primary" onClick={handleOpenForm}>{t.addCustomer}</HoloButton>
            <HoloButton icon={Download} variant="secondary" onClick={handleExport}>{t.export}</HoloButton>
            <HoloButton icon={Upload} variant="secondary" className="relative"><input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer"/>{t.import}</HoloButton>
          </div>
          
        <div className="flex items-center gap-3 w-full lg:w-auto flex-1 justify-end">
            <div className={`rounded-lg p-1 flex items-center gap-1 ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-gray-400' : 'text-slate-500')}`}><LayoutGrid size={20} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-gray-400' : 'text-slate-500')}`}><List size={20} /></button>
            </div>
            <div className="relative flex-1 max-w-md">
                <Input 
                    icon={Search} 
                    placeholder={t.search} 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm font-medium opacity-70"><Filter size={16} /><span>تصفية:</span></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className={formControlClasses}>
            <option value="all">{t.allStatuses}</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="blocked">محظور</option>
        </select>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as any)} className={formControlClasses}>
            <option value="all">{t.risks}</option>
            <option value="low">منخفض</option>
            <option value="medium">متوسط</option>
            <option value="high">مرتفع</option>
        </select>
        {(statusFilter !== 'all' || riskFilter !== 'all' || searchTerm) && (
            <button onClick={() => { setStatusFilter('all'); setRiskFilter('all'); setSearchTerm(''); }} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm transition-colors">
                {t.clearFilters}
            </button>
        )}
      </div>
      
      {renderContent()}

      {showDetailsModal && (<CustomerDetailsModal theme={theme} lang={lang} customer={selectedCustomer} onClose={handleCloseModals} />)}
      {showFormModal && (<CustomerFormModal theme={theme} customer={editingCustomer} onClose={handleCloseModals} onSave={handleSaveCustomer} />)}
      
      <ConfirmationModal isOpen={!!deletingCustomerId} onClose={cancelDeleteCustomer} onConfirm={confirmDeleteCustomer} title={t.areYouSureDeleteCustomer} message={t.deleteConfirmationMessageCustomer} confirmText={t.confirmDelete} isConfirming={isDeleting} />
      <ConfirmationModal isOpen={isBulkDeleteConfirmOpen} onClose={cancelBulkDelete} onConfirm={confirmBulkDelete} title={t.areYouSureDeleteSelected} message={t.deleteSelectedConfirmationMessage.replace('{count}', selectedIds.size.toString())} confirmText={t.confirmDelete} isConfirming={isDeleting} />
      <BulkActionBar count={selectedIds.size} actions={bulkActions} onClear={clearSelection} />
    </div>
  );
};

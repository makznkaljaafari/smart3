
import React, { useEffect, useMemo, useCallback } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { DebtDetailsModal } from './components/DebtDetailsModal';
import { DebtFormModal } from './components/DebtFormModal';
import { PaymentModal } from './components/PaymentModal';
import { SciFiCard } from '../../components/ui/SciFiCard';
import { HoloButton } from '../../components/ui/HoloButton';
import { useDebtData } from './hooks/useDebtData';
import { Plus, Search, FilterX, CheckCircle, AlertCircle, AlertTriangle, Wallet } from 'lucide-react';
import { formatCurrency } from './lib/utils';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { DebtRow } from './components/DebtRow';
import { eventBus } from '../../lib/events';
import { DataTable, DataTableColumn } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Debt } from './types';

export const DebtsView: React.FC = () => {
  const { theme, lang, currency, settings } = useZustandStore(state => ({
    theme: state.theme,
    lang: state.lang,
    currency: state.settings.baseCurrency,
    settings: state.settings
  }));
  const { exchangeRates, enabledCurrencies } = settings;
  const t = translations[lang];
  const isDark = theme === 'dark';

  const {
    stats, filters, setFilters, filteredDebts, selectedDebt, showDetailsModal, showFormModal, showPaymentModal, editingDebt,
    debtsLoading, debtsError, handleSaveDebt, handleDeleteDebt, handleAddPayment, handleViewDetails, handleEdit,
    handleAddPaymentClick, handleOpenForm, handleCloseModals, clearFilters, deletingDebtId, isDeleting,
    confirmDeleteDebt, cancelDeleteDebt, totalPages, currentPage, setCurrentPage
  } = useDebtData();

  useEffect(() => {
    const unsubscribe = eventBus.subscribe((e) => {
      if (e.type === 'SHOW_ADD_DEBT_MODAL') handleOpenForm();
    });
    return unsubscribe;
  }, [handleOpenForm]);
  
  const numberFormatter = new Intl.NumberFormat('en-US');
  const selectClasses = `w-full md:w-auto px-4 py-3 rounded-lg border focus:outline-none transition-colors ${isDark ? 'bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))]' : 'bg-white text-slate-800 border-slate-300'}`;

  const columns: DataTableColumn[] = useMemo(() => [
      { header: t.customer, className: 'text-right' },
      { header: t.remainingAmount, className: 'text-right' },
      { header: t.dueDate, className: 'text-right' },
      { header: t.status, className: 'text-center' },
      { header: t.actions, className: 'text-center' },
  ], [t]);

  const renderRow = useCallback((d: Debt, i: number) => (
      <DebtRow 
          key={d.id} 
          debt={d} 
          onViewDetails={handleViewDetails} 
          onEdit={handleEdit} 
          onDelete={handleDeleteDebt} 
          onAddPayment={handleAddPaymentClick} 
      />
  ), [handleViewDetails, handleEdit, handleDeleteDebt, handleAddPaymentClick]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SciFiCard theme={theme} title={t.totalDebts} value={`${numberFormatter.format(stats.totalAmount)} ${currency}`} icon={Wallet} color="cyan" />
        <SciFiCard theme={theme} title={t.totalRemaining} value={`${numberFormatter.format(stats.totalRemaining)} ${currency}`} icon={AlertCircle} color="orange" />
        <SciFiCard theme={theme} title={t.paidThisMonth} value={`${numberFormatter.format(stats.totalPaid)} ${currency}`} icon={CheckCircle} color="green" />
        <SciFiCard theme={theme} title={t.overdueDebts} value={`${stats.overdueDebts} (${formatCurrency(stats.overdueAmount, currency)})`} icon={AlertTriangle} color="purple" />
      </div>

      <div className={`p-4 rounded-2xl border bg-[rgb(var(--bg-secondary-rgb))] border-[rgb(var(--border-primary-rgb))] shadow-sm`}>
        <div className="flex flex-col md:flex-row gap-4">
          <HoloButton icon={Plus} variant="primary" onClick={handleOpenForm}>{t.addDebt}</HoloButton>
          <div className="flex-1 relative">
             <Input 
                icon={Search} 
                placeholder={t.searchDebts} 
                value={filters.searchQuery} 
                onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))} 
            />
          </div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value as any }))} className={selectClasses}><option value="all">{t.allStatuses}</option><option value="pending">قيد الانتظار</option><option value="partial">مدفوع جزئياً</option><option value="paid">مدفوع بالكامل</option><option value="overdue">متأخر</option><option value="cancelled">ملغي</option></select>
          <button onClick={clearFilters} className={`p-3 rounded-lg border ${isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-slate-300 text-slate-500 hover:bg-slate-100'}`} title={t.clearFilters}><FilterX size={20} /></button>
        </div>
      </div>

      <DataTable<Debt>
        data={filteredDebts}
        columns={columns}
        renderRow={renderRow}
        isLoading={debtsLoading}
        error={debtsError}
        emptyMessage={filters.searchQuery ? t.noDebtsFound : t.noDebtsYet}
        emptyIcon={Wallet}
        pagination={{
            currentPage,
            totalPages,
            totalCount: 0, // Hook doesn't return total count yet, simplistic pagination
            onPageChange: setCurrentPage,
            showingText: `Page ${currentPage} of ${totalPages}`
        }}
      />

      {showDetailsModal && selectedDebt && <DebtDetailsModal debt={selectedDebt} onClose={handleCloseModals} onEdit={handleEdit} onAddPayment={handleAddPaymentClick} />}
      {showFormModal && <DebtFormModal debt={editingDebt || undefined} onClose={handleCloseModals} onSave={handleSaveDebt} />}
      {showPaymentModal && selectedDebt && <PaymentModal debt={selectedDebt} onClose={handleCloseModals} onSave={handleAddPayment} exchangeRates={exchangeRates} enabledCurrencies={enabledCurrencies} />}
      <ConfirmationModal isOpen={!!deletingDebtId} onClose={cancelDeleteDebt} onConfirm={confirmDeleteDebt} title={t.areYouSureDeleteDebt} message={t.deleteConfirmationMessageDebt} confirmText={t.confirmDelete} isConfirming={isDeleting} />
    </div>
  );
};


import React, { useCallback, useMemo } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { SciFiCard } from '../../components/ui/SciFiCard';
import { HoloButton } from '../../components/ui/HoloButton';
import { useSupplierData } from './hooks/useSupplierData';
import { SupplierCard } from './components/SupplierCard';
import { SupplierFormModal } from './components/SupplierFormModal';
import { Plus, Search, Building, Truck, Wallet } from 'lucide-react';
import { SupplierDetailsModal } from './components/SupplierDetailsModal';
import { DataTable, DataTableColumn } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { SupplierRow } from './components/SupplierRow';

const formatCurrency = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);

export const SuppliersView: React.FC = () => {
  const { theme, lang, settings } = useZustandStore(state => ({ theme: state.theme, lang: state.lang, settings: state.settings }));
  const t = translations[lang];
  const isDark = theme === 'dark';

  const {
    stats, searchTerm, setSearchTerm, filteredSuppliers, showFormModal, editingSupplier, suppliersLoading, suppliersError,
    showDetailsModal, selectedSupplier, handleEditSupplier, handleDeleteSupplier, handleSaveSupplier,
    handleOpenForm, handleCloseModals, handleViewDetails, currentPage, setCurrentPage, totalPages
  } = useSupplierData();

  // Columns configuration
  const columns: DataTableColumn[] = useMemo(() => [
    { header: t.supplierName, className: 'text-right' },
    { header: t.contactPerson, className: 'text-right' },
    { header: t.phone, className: 'text-right' },
    { header: t.totalPurchasesValue, className: 'text-right' },
    { header: t.outstandingBalance, className: 'text-right' },
    { header: t.actions, className: 'text-center' },
  ], [t]);

  // Use useCallback to prevent recreating the function on every render
  const renderRow = useCallback((s: any, index: number) => (
    <SupplierRow
      key={s.id}
      supplier={s}
      onViewDetails={handleViewDetails}
      onEdit={handleEditSupplier}
      onDelete={handleDeleteSupplier}
      isDark={isDark}
    />
  ), [handleViewDetails, handleEditSupplier, handleDeleteSupplier, isDark]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SciFiCard theme={theme} title={t.totalSuppliers} value={stats.totalCount.toString()} icon={Building} color="cyan" />
        <SciFiCard theme={theme} title={t.totalPurchasesValue} value={formatCurrency(stats.totalPurchases, settings.baseCurrency)} icon={Truck} color="green" />
        <SciFiCard theme={theme} title={t.outstandingBalance} value={formatCurrency(stats.totalBalance, settings.baseCurrency)} icon={Wallet} color="orange" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="w-full md:w-96">
             <Input 
                icon={Search} 
                placeholder={t.searchSuppliers} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
             />
         </div>
         <HoloButton icon={Plus} variant="primary" onClick={handleOpenForm}>{t.addSupplier}</HoloButton>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <DataTable
          data={filteredSuppliers}
          columns={columns}
          renderRow={renderRow}
          isLoading={suppliersLoading}
          error={suppliersError}
          emptyMessage={searchTerm ? t.noItemsFound : t.noSuppliersYet}
          emptyIcon={Building}
          pagination={{
            currentPage,
            totalPages,
            totalCount: stats.totalCount,
            onPageChange: setCurrentPage,
            showingText: lang === 'ar' ? `عرض ${filteredSuppliers.length} من ${stats.totalCount}` : `Showing ${filteredSuppliers.length} of ${stats.totalCount}`
          }}
        />
      </div>

      {/* Mobile Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {filteredSuppliers.map(s => (
           <SupplierCard 
             key={s.id} 
             supplier={s} 
             theme={theme} 
             onViewDetails={() => handleViewDetails(s)} 
             onEdit={() => handleEditSupplier(s)} 
             onDelete={() => handleDeleteSupplier(s.id)} 
           />
        ))}
      </div>

      {showFormModal && <SupplierFormModal theme={theme} t={t} supplier={editingSupplier} onClose={handleCloseModals} onSave={handleSaveSupplier} />}
      {showDetailsModal && selectedSupplier && <SupplierDetailsModal supplier={selectedSupplier} onClose={handleCloseModals} onEdit={handleEditSupplier} />}
    </div>
  );
};

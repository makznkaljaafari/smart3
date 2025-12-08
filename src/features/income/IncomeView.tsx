
import React from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { SciFiCard } from '../../components/ui/SciFiCard';
import { HoloButton } from '../../components/ui/HoloButton';
import { Plus, Search, FilterX, BarChart3, Tag, Copy, FileText, Loader, ServerCrash } from 'lucide-react';
import { IncomeCard } from './components/IncomeCard';
import { IncomeFormModal } from './components/IncomeFormModal';
import { IncomeCategory } from '../../types';
import { useIncomeData } from './hooks/useIncomeData';
import { AppTheme } from '../../types';

const INCOME_CATEGORY_CONFIG: Record<IncomeCategory, { label: string; icon: React.ElementType }> = {
  product_sales: { label: 'مبيعات منتجات', icon: Tag },
  service_fees: { label: 'رسوم خدمات', icon: BarChart3 },
  consulting: { label: 'استشارات', icon: BarChart3 },
  rentals: { label: 'إيجارات', icon: BarChart3 },
  refunds: { label: 'استردادات', icon: BarChart3 },
  other: { label: 'أخرى', icon: BarChart3 },
};

const formatCurrency = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

export const IncomeView: React.FC = () => {
  const { theme, lang, currency } = useZustandStore(s => ({ theme: s.theme, lang: s.lang, currency: s.settings.baseCurrency }));
  const t = translations[lang];

  const {
      stats,
      filters,
      setFilters,
      filteredIncome,
      showFormModal,
      editingIncome,
      isLoading,
      error,
      handleSave,
      handleDelete,
      handleEdit,
      handleOpenForm,
      handleCloseForm,
  } = useIncomeData();

  const formControlClasses = `px-4 py-2.5 rounded-lg border focus:outline-none transition-colors bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))]`;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-12">
          <Loader className="w-12 h-12 animate-spin text-cyan-400" />
        </div>
      );
    }

    if (error) {
        return (
            <div className={`text-center p-12 rounded-2xl border-2 border-dashed border-red-500/50 bg-red-500/10`}>
                <ServerCrash className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-red-300 mb-2">Failed to load income data</h3>
                <p className="text-red-400">{error}</p>
            </div>
        );
    }
    
    if (filteredIncome.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIncome.map(i => <IncomeCard key={i.id} income={i} theme={theme as AppTheme} onEdit={handleEdit} onDelete={handleDelete} onViewDetails={()=>{}} />)}
        </div>
      );
    }

    return (
      <div className={`text-center p-12 rounded-2xl border-2 border-dashed border-[rgb(var(--border-primary-rgb))] bg-[rgb(var(--bg-secondary-rgb))]`}>
        <FileText size={48} className="mx-auto text-[rgb(var(--text-muted-rgb))] mb-4" />
        <h3 className="font-semibold text-lg mb-2 text-[rgb(var(--text-primary-rgb))]">لا توجد إيرادات</h3>
        <p className="text-[rgb(var(--text-muted-rgb))] mb-6">ابدأ بإضافة أول إيراد لك.</p>
        <HoloButton variant="primary" icon={Plus} onClick={handleOpenForm}>{t.add || 'إضافة إيراد'}</HoloButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SciFiCard theme={theme as AppTheme} title="إجمالي إيرادات الشهر" value={formatCurrency(stats.totalThisMonth, currency)} icon={BarChart3} color="green" />
        <SciFiCard theme={theme as AppTheme} title="أعلى مصدر دخل" value={stats.highestSource} icon={Tag} color="purple" />
        <SciFiCard theme={theme as AppTheme} title="إجمالي السجلات" value={stats.totalEntries.toString()} icon={Copy} color="cyan" />
      </div>

      <div className={`p-4 rounded-2xl border bg-[rgb(var(--bg-secondary-rgb))] border-[rgb(var(--border-primary-rgb))]`}>
        <div className="flex flex-col md:flex-row gap-3">
          <HoloButton icon={Plus} variant="primary" onClick={handleOpenForm}>{t.add || 'إضافة إيراد'}</HoloButton>
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={filters.searchQuery} onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))} placeholder={t.searchIncome || 'بحث...'} className={`${formControlClasses} w-full pl-10`} /></div>
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value as any }))} className={formControlClasses}><option value="all">{t.allCategories}</option>{Object.entries(INCOME_CATEGORY_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select>
          <button onClick={() => setFilters({ category: 'all', searchQuery: '' })} className={formControlClasses}><FilterX size={18} /></button>
        </div>
      </div>
      
      {renderContent()}

      {showFormModal && <IncomeFormModal theme={theme as AppTheme} t={t} income={editingIncome || undefined} onClose={handleCloseForm} onSave={handleSave} />}
    </div>
  );
};

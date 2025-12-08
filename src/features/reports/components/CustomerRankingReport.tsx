
import React, { useState, useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { ReportContainer } from './ReportContainer';
import { formatCurrency } from '../../expenses/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '../../../services/customerService';
import { Loader } from 'lucide-react';

type SortBy = 'remainingDebt' | 'paidAmount';

export const CustomerRankingReport: React.FC = () => {
  const { theme, lang, currency, currentCompany } = useZustandStore(state => ({
    theme: state.theme,
    lang: state.lang,
    currency: state.settings.baseCurrency,
    currentCompany: state.currentCompany,
  }));
  const t = translations[lang];

  const [sortBy, setSortBy] = useState<SortBy>('remainingDebt');
  const [limit, setLimit] = useState(10);

  const { data: customersData, isLoading } = useQuery({
      queryKey: ['customers', 'ranking', currentCompany?.id],
      queryFn: () => customerService.getCustomers(), // Gets 1000 max
      enabled: !!currentCompany?.id,
  });

  const customers = customersData?.data || [];

  const rankedData = useMemo(() => {
    return [...customers]
      .sort((a, b) => b[sortBy] - a[sortBy])
      .slice(0, limit);
  }, [customers, sortBy, limit]);

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = [t.rank, t.customer, t.phone, sortBy === 'remainingDebt' ? t.remainingAmount : t.totalPaid, t.totalTransactions];
    csvContent += headers.join(',') + '\n';
    
    rankedData.forEach((customer, index) => {
      const row = [
        index + 1,
        `"${customer.name}"`,
        customer.phone,
        customer[sortBy],
        customer.totalTransactions
      ];
      csvContent += row.join(',') + '\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customer_ranking_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => window.print();

  const selectClasses = `px-3 py-1.5 rounded-lg border focus:outline-none bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))]`;

  const filters = (
    <>
      <div className="flex items-center gap-2">
        <label className="text-sm">{t.rankBy}:</label>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className={selectClasses}>
          <option value="remainingDebt">{t.highestDebt}</option>
          <option value="paidAmount">{t.highestPaid}</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm">{t.limitTo}:</label>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} className={selectClasses}>
          <option value={5}>5 {t.topCustomers}</option>
          <option value={10}>10 {t.topCustomers}</option>
          <option value={20}>20 {t.topCustomers}</option>
        </select>
      </div>
    </>
  );

  if (isLoading) {
      return <div className="flex justify-center p-12"><Loader className="animate-spin text-cyan-400" /></div>;
  }

  return (
    <ReportContainer
      title={t.customerRankingReport}
      filters={filters}
      onPrint={handlePrint}
      onExport={handleExport}
    >
      {rankedData.length === 0 ? (
        <p className="text-center py-8">{t.noDataForReport}</p>
      ) : (
        <div className={`rounded-lg overflow-x-auto border border-[rgb(var(--border-primary-rgb))]`}>
          <table className="w-full text-sm responsive-table">
            <thead className={`bg-[rgb(var(--bg-tertiary-rgb))]`}>
              <tr className="text-right">
                <th className="p-3 font-semibold">{t.rank}</th>
                <th className="p-3 font-semibold">{t.customer}</th>
                <th className="p-3 font-semibold">{t.phone}</th>
                <th className="p-3 font-semibold">{sortBy === 'remainingDebt' ? t.remainingAmount : t.totalPaid}</th>
                <th className="p-3 font-semibold">{t.totalTransactions}</th>
              </tr>
            </thead>
            <tbody>
              {rankedData.map((customer, index) => (
                <tr key={customer.id} className={`border-t border-[rgb(var(--border-primary-rgb))]`}>
                  <td className="p-3 text-center w-12" data-label={t.rank}>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold ${index < 3 ? 'bg-[var(--accent-bg-20)] text-[var(--accent-300)]' : 'bg-[rgb(var(--bg-interactive-rgb))]'}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-3 font-semibold" data-label={t.customer}>{customer.name}</td>
                  <td className="p-3" data-label={t.phone}>{customer.phone}</td>
                  <td className="p-3 font-mono font-bold text-lg" style={{ color: sortBy === 'remainingDebt' ? 'rgb(var(--status-danger-rgb))' : 'rgb(var(--status-success-rgb))' }} data-label={sortBy === 'remainingDebt' ? t.remainingAmount : t.totalPaid}>
                    {formatCurrency(customer[sortBy], customer.currency)}
                  </td>
                  <td className="p-3 font-mono" data-label={t.totalTransactions}>{customer.totalTransactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportContainer>
  );
};

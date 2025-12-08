
import React, { useState, useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { formatCurrency } from '../../expenses/lib/utils';
import { ReportContainer } from './ReportContainer';
import { BarChart } from './BarChart';
import { useQuery } from '@tanstack/react-query';
import { debtService } from '../../../services/debtService';
import { customerService } from '../../../services/customerService';
import { Loader } from 'lucide-react';

const BUCKETS = {
  current: { label: 'current', min: -Infinity, max: 0, color: '#10b981' },
  '1-30': { label: 'overdue_1_30', min: 1, max: 30, color: '#f59e0b' },
  '31-60': { label: 'overdue_31_60', min: 31, max: 60, color: '#f97316' },
  '61-90': { label: 'overdue_61_90', min: 61, max: 90, color: '#ef4444' },
  '90+': { label: 'overdue_90_plus', min: 91, max: Infinity, color: '#dc2626' },
};

export const DebtAgingReport: React.FC = () => {
  const { theme, lang, currency, currentCompany } = useZustandStore(state => ({
    theme: state.theme,
    lang: state.lang,
    currency: state.settings.baseCurrency,
    currentCompany: state.currentCompany,
  }));
  const t = translations[lang];

  const [customerFilter, setCustomerFilter] = useState('all');

  // Fetch Debts
  const { data: debtsData, isLoading: debtsLoading } = useQuery({
      queryKey: ['debts', 'all', currentCompany?.id],
      queryFn: () => debtService.getDebts(),
      enabled: !!currentCompany?.id,
  });

  // Fetch Customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
      queryKey: ['customers', 'all', currentCompany?.id],
      queryFn: () => customerService.getCustomers(),
      enabled: !!currentCompany?.id,
  });

  const debts = debtsData?.data || [];
  const customers = customersData?.data || [];
  const isLoading = debtsLoading || customersLoading;

  const getDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due >= today) return 0;
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const processedDebts = useMemo(() => {
    const activeDebts = debts.filter(d => 
        (d.status === 'pending' || d.status === 'partial' || d.status === 'overdue') &&
        (customerFilter === 'all' || d.customerId === customerFilter)
    );
    
    return activeDebts.map(d => {
        const daysOverdue = getDaysOverdue(d.dueDate);
        const bucket = Object.keys(BUCKETS).find(key => {
            const b = BUCKETS[key as keyof typeof BUCKETS];
            return daysOverdue >= b.min && daysOverdue <= b.max;
        }) || 'current';
        return { ...d, daysOverdue, bucket };
    });
  }, [debts, customerFilter]);
  
  const reportData = useMemo(() => {
     const byBucket = processedDebts.reduce((acc, debt) => {
        const bucket = acc[debt.bucket] || { total: 0, count: 0 };
        bucket.total += debt.remainingAmount;
        bucket.count += 1;
        acc[debt.bucket] = bucket;
        return acc;
     }, {} as Record<string, {total: number, count: number}>);

     return Object.entries(BUCKETS).map(([key, bucketInfo]) => ({
        label: t[bucketInfo.label] || bucketInfo.label,
        value: byBucket[key]?.total || 0,
        count: byBucket[key]?.count || 0,
        color: bucketInfo.color
     }));

  }, [processedDebts, t]);

  const handleExport = () => {
    let csv = `${t.customer},${t.remainingAmount},${t.dueDate},${t.daysOverdue}\n`;
    processedDebts.forEach(d => {
        csv += `"${d.customerName}",${d.remainingAmount},${d.dueDate},${d.daysOverdue}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'debt_aging_report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };
  
  const handlePrint = () => window.print();

  const filters = (
    <div className="flex items-center gap-2">
      <label className="text-sm">{t.customer}:</label>
      <select 
        value={customerFilter} 
        onChange={e => setCustomerFilter(e.target.value)}
        className={`px-3 py-1.5 rounded-lg border focus:outline-none bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))]`}
      >
        <option value="all">{t.allCustomers}</option>
        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );

  if (isLoading) {
      return <div className="flex justify-center p-12"><Loader className="animate-spin text-cyan-400" /></div>;
  }

  return (
    <ReportContainer 
      title={t.debtAgingReport}
      filters={filters}
      onPrint={handlePrint}
      onExport={handleExport}
    >
        {processedDebts.length === 0 ? (
        <p className="text-center py-8">{t.noDataForReport}</p>
      ) : (
        <div className="space-y-8">
            <div>
                <h3 className={`font-bold text-lg mb-4 text-[rgb(var(--text-primary-rgb))]`}>{t.debtDistributionByAge}</h3>
                <div className={`p-6 rounded-xl bg-[rgb(var(--bg-tertiary-rgb))]`}>
                    <BarChart data={reportData} theme={theme} />
                </div>
            </div>
            <div>
                <h3 className={`font-bold text-lg mb-4 text-[rgb(var(--text-primary-rgb))]`}>{t.debts}</h3>
                 <div className={`rounded-lg overflow-x-auto border border-[rgb(var(--border-primary-rgb))]`}>
                    <table className="w-full text-sm responsive-table">
                         <thead className={`bg-[rgb(var(--bg-tertiary-rgb))]`}>
                             <tr>
                                <th className="p-3 text-right font-semibold">{t.customer}</th>
                                <th className="p-3 text-right font-semibold">{t.remainingAmount}</th>
                                <th className="p-3 text-right font-semibold">{t.dueDate}</th>
                                <th className="p-3 text-right font-semibold">{t.daysOverdue}</th>
                             </tr>
                         </thead>
                         <tbody>
                            {processedDebts.map(d => (
                                <tr key={d.id} className={`border-t border-[rgb(var(--border-primary-rgb))] ${d.daysOverdue > 0 ? 'bg-red-500/10' : ''}`}>
                                    <td className="p-3 text-right" data-label={t.customer}>{d.customerName}</td>
                                    <td className="p-3 text-right font-mono" data-label={t.remainingAmount}>{formatCurrency(d.remainingAmount, d.currency)}</td>
                                    <td className="p-3 text-right" data-label={t.dueDate}>{d.dueDate}</td>
                                    <td className="p-3 text-right font-bold" style={{color: BUCKETS[d.bucket as keyof typeof BUCKETS]?.color}} data-label={t.daysOverdue}>{d.daysOverdue}</td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                 </div>
            </div>
        </div>
      )}
    </ReportContainer>
  )
};

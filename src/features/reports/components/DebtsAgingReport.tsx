
import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../expenses/lib/utils';
import { useZustandStore } from '../../../store/useStore';
import { Loader, Search } from 'lucide-react';
import { translations } from '../../../lib/i18n';
import { ReportContainer } from './ReportContainer';
import { BarChart } from './BarChart';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../../services/reportService';

export const DebtsAgingReport: React.FC = () => {
  const { theme, lang, currentCompany, settings } = useZustandStore();
  const t = translations[lang];
  const [search, setSearch] = useState('');

  const { data: reportRows, isLoading, error } = useQuery({
    queryKey: ['debtsAging', currentCompany?.id],
    queryFn: reportService.getDebtsAging,
    enabled: !!currentCompany?.id,
  });

  const filteredData = useMemo(() => {
    if (!reportRows?.data) return [];
    return reportRows.data.filter(row => {
      return row.customer_name.toLowerCase().includes(search.toLowerCase());
    });
  }, [reportRows, search]);

  // Aggregate data for the chart
  const chartData = useMemo(() => {
    const totals = {
      notDue: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      over90: 0
    };

    filteredData.forEach(row => {
      totals.notDue += row.not_due || 0;
      totals.days30 += row.bucket_0_30 || 0;
      totals.days60 += row.bucket_31_60 || 0;
      totals.days90 += row.bucket_61_90 || 0;
      totals.over90 += row.bucket_90_plus || 0;
    });

    return [
      { label: t.current || 'Current', value: totals.notDue, color: '#10b981' },
      { label: '1-30 Days', value: totals.days30, color: '#facc15' },
      { label: '31-60 Days', value: totals.days60, color: '#fb923c' },
      { label: '61-90 Days', value: totals.days90, color: '#f87171' },
      { label: '+90 Days', value: totals.over90, color: '#dc2626' },
    ];
  }, [filteredData, t]);

  const handleExport = () => {
    let csv = `Customer,Total Outstanding,Current,1-30,31-60,61-90,+90\n`;
    filteredData.forEach(row => {
        csv += `"${row.customer_name}",${row.total_outstanding},${row.not_due},${row.bucket_0_30},${row.bucket_31_60},${row.bucket_61_90},${row.bucket_90_plus}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'debts_aging_report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handlePrint = () => window.print();

  if (isLoading) return <div className="flex justify-center p-12"><Loader className="animate-spin text-cyan-400" /></div>;
  if (error) return <div className="text-center text-red-400 p-8">Error loading report: {(error as Error).message}</div>;

  const filters = (
    <div className="flex flex-wrap gap-3 w-full md:w-auto">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder={t.searchCustomer} 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-slate-300'}`}
          />
        </div>
    </div>
  );

  const thClasses = `p-3 text-xs font-bold uppercase tracking-wider text-left ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-600'}`;
  const tdClasses = `p-3 text-sm border-b ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'}`;

  const getAmountStyle = (amount: number, severity: 'normal' | 'warn-low' | 'warn-med' | 'warn-high' | 'critical') => {
      if (!amount || amount === 0) return 'text-gray-500 opacity-30';
      switch(severity) {
          case 'normal': return 'text-green-500 font-medium';
          case 'warn-low': return 'text-yellow-500 font-medium';
          case 'warn-med': return 'text-orange-400 font-medium';
          case 'warn-high': return 'text-orange-600 font-bold';
          case 'critical': return 'text-red-500 font-bold';
      }
  };

  return (
    <ReportContainer 
        title={t.debtAgingReport} 
        filters={filters}
        onExport={handleExport}
        onPrint={handlePrint}
    >
      <div className="space-y-8">
        {filteredData.length > 0 && (
            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-900/40 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-4 text-lg">Overview</h3>
                <BarChart data={chartData} theme={theme} />
            </div>
        )}

        <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr>
                  <th className={thClasses}>{t.customer}</th>
                  <th className={`${thClasses} text-right`}>{t.totalRemaining}</th>
                  <th className={`${thClasses} text-right`}>{t.current}</th>
                  <th className={`${thClasses} text-right`}>1-30</th>
                  <th className={`${thClasses} text-right`}>31-60</th>
                  <th className={`${thClasses} text-right`}>61-90</th>
                  <th className={`${thClasses} text-right`}>90+</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(row => (
                  <tr key={row.customer_id} className={`transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <td className={tdClasses}>
                      <div className="font-bold">{row.customer_name}</div>
                    </td>
                    <td className={`${tdClasses} text-right font-mono font-bold text-lg`}>
                      {formatCurrency(row.total_outstanding, settings.baseCurrency)}
                    </td>
                    <td className={`${tdClasses} text-right font-mono ${getAmountStyle(row.not_due, 'normal')}`}>
                      {formatCurrency(row.not_due, settings.baseCurrency)}
                    </td>
                    <td className={`${tdClasses} text-right font-mono ${getAmountStyle(row.bucket_0_30, 'warn-low')}`}>
                      {formatCurrency(row.bucket_0_30, settings.baseCurrency)}
                    </td>
                    <td className={`${tdClasses} text-right font-mono ${getAmountStyle(row.bucket_31_60, 'warn-med')}`}>
                      {formatCurrency(row.bucket_31_60, settings.baseCurrency)}
                    </td>
                    <td className={`${tdClasses} text-right font-mono ${getAmountStyle(row.bucket_61_90, 'warn-high')}`}>
                      {formatCurrency(row.bucket_61_90, settings.baseCurrency)}
                    </td>
                    <td className={`${tdClasses} text-right font-mono ${getAmountStyle(row.bucket_90_plus, 'critical')}`}>
                      {formatCurrency(row.bucket_90_plus, settings.baseCurrency)}
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center opacity-50">{t.noDataForReport}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ReportContainer>
  );
};

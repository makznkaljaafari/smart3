
import React, { useState, useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { CATEGORY_CONFIG, formatCurrency } from '../../expenses/lib/utils';
import { ReportContainer } from './ReportContainer';
import { PieChart } from './PieChart';
import { useQuery } from '@tanstack/react-query';
import { expenseService } from '../../../services/expenseService';
import { Loader, ServerCrash } from 'lucide-react';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#3b82f6', '#f59e0b', '#6366f1'];

export const ExpenseSummaryReport: React.FC = () => {
  const { theme, lang, currency, currentCompany } = useZustandStore(state => ({
    theme: state.theme,
    lang: state.lang,
    currency: state.settings.baseCurrency,
    currentCompany: state.currentCompany,
  }));
  const t = translations[lang];

  const [dateRange, setDateRange] = useState('allTime');

  // Calculate start date based on range
  const startDate = useMemo(() => {
      if (dateRange === 'allTime') return undefined;
      const now = new Date();
      if (dateRange === 'thisMonth') {
          return new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateRange === 'last30days') {
          const d = new Date();
          d.setDate(now.getDate() - 30);
          return d;
      }
      return undefined;
  }, [dateRange]);

  // Fetch data specifically for report
  const { data: reportRawData, isLoading, isError } = useQuery({
      queryKey: ['expenseReport', currentCompany?.id, dateRange],
      queryFn: () => expenseService.getExpensesReportData(startDate),
      enabled: !!currentCompany?.id,
  });

  const reportData = useMemo(() => {
    const expenses = reportRawData?.data || [];
    
    const byCategory = expenses.reduce((acc: any, expense: any) => {
      acc[expense.category] = acc[expense.category] || { total: 0, count: 0 };
      acc[expense.category].total += expense.amount;
      acc[expense.category].count += 1;
      return acc;
    }, {} as Record<string, { total: number, count: number }>);
    
    return (Object.entries(byCategory) as [string, { total: number, count: number }][])
      .map(([category, data]) => ({ category, total: data.total, count: data.count }))
      .sort((a, b) => b.total - a.total);
  }, [reportRawData]);

  const chartData = reportData.map((item, index) => ({
    label: CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]?.label || item.category,
    value: item.total,
    color: COLORS[index % COLORS.length]
  }));
  
  const totalAmount = reportData.reduce((sum, item) => sum + item.total, 0);
  const totalCount = reportData.reduce((sum, item) => sum + item.count, 0);

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Category,Total Amount,Transactions\n";
    reportData.forEach(row => {
        const label = CATEGORY_CONFIG[row.category as keyof typeof CATEGORY_CONFIG]?.label || row.category;
        csvContent += `${label},${row.total},${row.count}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expense_summary_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handlePrint = () => window.print();

  const filters = (
    <div className="flex items-center gap-2">
      <label className="text-sm">{t.dateRange}:</label>
      <select 
        value={dateRange} 
        onChange={e => setDateRange(e.target.value)}
        className={`px-3 py-1.5 rounded-lg border focus:outline-none bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))]`}
      >
        <option value="allTime">{t.allTime}</option>
        <option value="thisMonth">{t.thisMonth}</option>
        <option value="last30days">{t.last30days}</option>
      </select>
    </div>
  );
  
  return (
    <ReportContainer 
      title={t.expenseSummary}
      filters={filters}
      onPrint={handlePrint}
      onExport={handleExport}
    >
      {isLoading ? (
         <div className="flex justify-center items-center p-12"><Loader className="w-12 h-12 animate-spin text-cyan-400" /></div>
      ) : isError ? (
         <div className="p-8 text-center text-red-400"><ServerCrash className="mx-auto mb-2" /> Failed to load report data.</div>
      ) : reportData.length === 0 ? (
        <p className="text-center py-8">{t.noDataForReport}</p>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className={`font-bold text-lg mb-4 text-[rgb(var(--text-primary-rgb))]`}>{t.expenseDistribution}</h3>
            <div className={`p-6 rounded-xl bg-[rgb(var(--bg-tertiary-rgb))]`}>
              <PieChart data={chartData} theme={theme} size={300} />
            </div>
          </div>
          <div>
            <h3 className={`font-bold text-lg mb-4 text-[rgb(var(--text-primary-rgb))]`}>{t.category}</h3>
            <div className={`rounded-lg overflow-x-auto border border-[rgb(var(--border-primary-rgb))]`}>
              <table className="w-full text-sm responsive-table">
                <thead className={`bg-[rgb(var(--bg-tertiary-rgb))]`}>
                  <tr className="text-left">
                    <th className="p-3 font-semibold">{t.category}</th>
                    <th className="p-3 font-semibold text-right">{t.totalAmount}</th>
                    <th className="p-3 font-semibold text-right">{t.transactions}</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={row.category} className={`border-t border-[rgb(var(--border-primary-rgb))]`}>
                      <td className="p-3 flex items-center gap-2" data-label={t.category}>
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {CATEGORY_CONFIG[row.category as keyof typeof CATEGORY_CONFIG]?.label || row.category}
                      </td>
                      <td className="p-3 text-right font-mono" data-label={t.totalAmount}>{formatCurrency(row.total, currency)}</td>
                      <td className="p-3 text-right font-mono" data-label={t.transactions}>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
                 <tfoot className={`font-bold bg-[rgb(var(--bg-tertiary-rgb))]`}>
                    <tr className={`border-t-2 border-[rgb(var(--border-secondary-rgb))]`}>
                        <td className="p-3" data-label="">Total</td>
                        <td className="p-3 text-right font-mono" data-label={t.totalAmount}>{formatCurrency(totalAmount, currency)}</td>
                        <td className="p-3 text-right font-mono" data-label={t.transactions}>{totalCount}</td>
                    </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </ReportContainer>
  );
};

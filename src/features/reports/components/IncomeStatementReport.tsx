
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../../services/reportService';
import { formatCurrency } from '../../expenses/lib/utils';
import { useZustandStore } from '../../../store/useStore';
import { Loader, TrendingUp, TrendingDown } from 'lucide-react';
import { translations } from '../../../lib/i18n';
import { IncomeStatementRow } from '../types';
import { ReportContainer } from './ReportContainer';

export const IncomeStatementReport: React.FC = () => {
  const { theme, settings, lang, currentCompany } = useZustandStore();
  const t = translations[lang];

  const { data: result, isLoading, error } = useQuery({
      queryKey: ['incomeStatement', currentCompany?.id],
      queryFn: reportService.getIncomeStatement,
      enabled: !!currentCompany?.id
  });

  const reportRows = result?.data || [];

  const { revenue, expenses, totals } = useMemo(() => {
    const revenue = reportRows.filter(r => r.account_type === 'revenue');
    const expenses = reportRows.filter(r => r.account_type === 'expense');
    
    const totalRevenue = revenue.reduce((sum, r) => sum + (r.net_amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, r) => sum + (r.net_amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    return { revenue, expenses, totals: { totalRevenue, totalExpenses, netProfit } };
  }, [reportRows]);

  const handleExport = () => {
    let csv = `${t.accountNumber},${t.accountName},${t.category},${t.amount}\n`;
    [...revenue, ...expenses].forEach(row => {
        csv += `${row.account_number},"${row.account_name}",${row.account_type},${row.net_amount}\n`;
    });
    csv += `,,Total Revenue,${totals.totalRevenue}\n`;
    csv += `,,Total Expenses,${totals.totalExpenses}\n`;
    csv += `,,Net Profit,${totals.netProfit}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'income_statement.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };
  
  const handlePrint = () => window.print();

  if (isLoading) return <div className="flex justify-center p-12"><Loader className="animate-spin text-cyan-400" /></div>;
  if (error) return <div className="text-center text-red-400 p-8">Error loading report: {(error as Error).message}</div>;

  const SectionTable = ({ title, rows, total, colorClass }: { title: string, rows: IncomeStatementRow[], total: number, colorClass: string }) => (
      <div className={`rounded-xl border mb-8 ${theme === 'dark' ? 'border-gray-700 bg-gray-900/30' : 'border-slate-200 bg-white'}`}>
        <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-700' : 'border-slate-100'}`}>
            <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
            <span className={`font-mono font-bold text-lg ${colorClass}`}>{formatCurrency(total, settings.baseCurrency)}</span>
        </div>
        <table className="w-full text-sm">
            <tbody>
                {rows.map(row => (
                    <tr key={row.account_id} className={`border-b last:border-0 ${theme === 'dark' ? 'border-gray-800' : 'border-slate-100'}`}>
                        <td className="p-3 pl-6">
                             <div className="font-medium">{row.account_name}</div>
                             <div className="text-xs opacity-50">{row.account_number}</div>
                        </td>
                        <td className="p-3 text-right font-mono">{formatCurrency(row.net_amount, row.currency)}</td>
                    </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={2} className="p-4 text-center text-gray-500 text-xs italic">No records</td></tr>}
            </tbody>
        </table>
      </div>
  );

  const isProfit = totals.netProfit >= 0;

  return (
    <ReportContainer 
        title={t.profitAndLoss}
        onExport={handleExport}
        onPrint={handlePrint}
    >
        <div className={`p-6 rounded-2xl border mb-8 flex flex-col md:flex-row items-center justify-between gap-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
             <div className="text-center md:text-left">
                 <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-1">{t.netProfit}</p>
                 <p className={`text-4xl font-black font-mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                     {formatCurrency(totals.netProfit, settings.baseCurrency)}
                 </p>
             </div>
             <div className="flex gap-8">
                 <div className="text-center">
                     <div className="flex items-center gap-2 justify-center mb-1 text-emerald-500">
                         <TrendingUp size={16} /> <span className="text-xs font-bold uppercase">{t.totalIncome}</span>
                     </div>
                     <p className="font-mono font-bold">{formatCurrency(totals.totalRevenue, settings.baseCurrency)}</p>
                 </div>
                 <div className="w-px bg-gray-600 h-10 self-center opacity-20"></div>
                 <div className="text-center">
                     <div className="flex items-center gap-2 justify-center mb-1 text-orange-500">
                         <TrendingDown size={16} /> <span className="text-xs font-bold uppercase">{t.totalExpenses}</span>
                     </div>
                     <p className="font-mono font-bold">{formatCurrency(totals.totalExpenses, settings.baseCurrency)}</p>
                 </div>
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionTable 
                title={t.incomeBreakdown || "Revenue"} 
                rows={revenue} 
                total={totals.totalRevenue} 
                colorClass="text-emerald-400" 
            />
            <SectionTable 
                title={t.expenseBreakdown || "Expenses"} 
                rows={expenses} 
                total={totals.totalExpenses} 
                colorClass="text-orange-400" 
            />
        </div>
    </ReportContainer>
  );
};

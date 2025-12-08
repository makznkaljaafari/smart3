
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../../services/reportService';
import { formatCurrency } from '../../expenses/lib/utils';
import { useZustandStore } from '../../../store/useStore';
import { Loader } from 'lucide-react';
import { translations } from '../../../lib/i18n';
import { ReportContainer } from './ReportContainer';

export const AccountBalancesReport: React.FC = () => {
  const { theme, settings, lang, currentCompany } = useZustandStore();
  const t = translations[lang];
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: result, isLoading, error } = useQuery({
      queryKey: ['accountBalances', currentCompany?.id],
      queryFn: reportService.getAccountBalances,
      enabled: !!currentCompany?.id
  });

  const reportRows = result?.data || [];

  const filteredData = useMemo(() => {
    if (!reportRows) return [];
    if (typeFilter === 'all') return reportRows;
    return reportRows.filter(row => row.account_type === typeFilter);
  }, [reportRows, typeFilter]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => ({
        debit: acc.debit + (curr.total_debit || 0),
        credit: acc.credit + (curr.total_credit || 0),
        balance: acc.balance + (curr.balance || 0)
    }), { debit: 0, credit: 0, balance: 0 });
  }, [filteredData]);

  const handleExport = () => {
    let csv = `${t.accountNumber},${t.accountName},${t.category},${t.debit},${t.credit},${t.balance}\n`;
    filteredData.forEach(row => {
        csv += `${row.account_number},"${row.account_name}",${row.account_type},${row.total_debit},${row.total_credit},${row.balance}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'account_balances.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };
  
  const handlePrint = () => window.print();

  const filters = (
    <div className="flex items-center gap-2">
        <select 
            value={typeFilter} 
            onChange={e => setTypeFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-slate-300'}`}
        >
            <option value="all">{t.allCategories || 'All Types'}</option>
            <option value="asset">{t.assets}</option>
            <option value="liability">{t.liabilities}</option>
            <option value="equity">{t.equity}</option>
            <option value="revenue">{t.income}</option>
            <option value="expense">{t.expenses}</option>
        </select>
    </div>
  );

  if (isLoading) return <div className="flex justify-center p-12"><Loader className="animate-spin text-cyan-400" /></div>;
  if (error) return <div className="text-center text-red-400 p-8">Error loading report: {(error as Error).message}</div>;

  const thClasses = `p-3 text-xs font-bold uppercase tracking-wider text-left sticky top-0 z-10 ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-slate-100 text-slate-600'}`;
  const tdClasses = `p-3 text-sm border-b ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'}`;

  return (
    <ReportContainer 
        title={t.trialBalance} 
        filters={filters}
        onExport={handleExport}
        onPrint={handlePrint}
    >
      <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr>
                <th className={thClasses}>{t.accountNumber}</th>
                <th className={thClasses}>{t.accountName}</th>
                <th className={thClasses}>{t.category}</th>
                <th className={`${thClasses} text-right`}>{t.debit}</th>
                <th className={`${thClasses} text-right`}>{t.credit}</th>
                <th className={`${thClasses} text-right`}>{t.balance} (Final)</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(row => {
                const zeroBalance = row.balance === 0 && row.total_debit === 0 && row.total_credit === 0;
                return (
                <tr key={row.account_id} className={`transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'} ${zeroBalance ? 'opacity-50' : ''}`}>
                  <td className={`${tdClasses} font-mono text-xs opacity-70`}>{row.account_number}</td>
                  <td className={`${tdClasses} font-medium`}>{row.account_name}</td>
                  <td className={tdClasses}><span className={`text-[10px] px-2 py-0.5 rounded uppercase bg-gray-500/10 border border-gray-500/20`}>{row.account_type}</span></td>
                  <td className={`${tdClasses} text-right font-mono text-emerald-500/80`}>
                    {row.total_debit !== 0 ? formatCurrency(row.total_debit, row.currency) : '-'}
                  </td>
                  <td className={`${tdClasses} text-right font-mono text-orange-500/80`}>
                     {row.total_credit !== 0 ? formatCurrency(row.total_credit, row.currency) : '-'}
                  </td>
                   <td className={`${tdClasses} text-right font-mono font-bold flex justify-end items-center gap-2`}>
                     <span>{formatCurrency(Math.abs(row.balance), row.currency)} {row.balance < 0 ? 'Cr' : 'Dr'}</span>
                  </td>
                </tr>
              )})}
            </tbody>
            <tfoot className={`font-bold ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-900'}`}>
                 <tr>
                    <td colSpan={3} className="p-4 text-center uppercase tracking-wider">{t.totals}</td>
                    <td className={`p-4 text-right font-mono`}>{formatCurrency(totals.debit, settings.baseCurrency)}</td>
                    <td className={`p-4 text-right font-mono`}>{formatCurrency(totals.credit, settings.baseCurrency)}</td>
                    <td className="p-4 text-right font-mono">{formatCurrency(totals.balance, settings.baseCurrency)}</td>
                 </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </ReportContainer>
  );
};

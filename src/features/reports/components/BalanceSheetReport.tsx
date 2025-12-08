
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../../services/reportService';
import { formatCurrency } from '../../expenses/lib/utils';
import { useZustandStore } from '../../../store/useStore';
import { Loader, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { translations } from '../../../lib/i18n';
import { BalanceSheetRow } from '../types';
import { ReportContainer } from './ReportContainer';

export const BalanceSheetReport: React.FC = () => {
  const { theme, settings, lang, currentCompany } = useZustandStore();
  const t = translations[lang];

  const { data: result, isLoading, error } = useQuery({
      queryKey: ['balanceSheet', currentCompany?.id],
      queryFn: reportService.getBalanceSheet,
      enabled: !!currentCompany?.id
  });

  const reportRows = result?.data || [];

  const { assets, liabilities, equity, totals } = useMemo(() => {
    const assets = reportRows.filter(r => r.account_type === 'asset');
    const liabilities = reportRows.filter(r => r.account_type === 'liability');
    const equity = reportRows.filter(r => r.account_type === 'equity');
    
    const totalAssets = assets.reduce((sum, r) => sum + (r.balance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, r) => sum + (r.balance || 0), 0);
    const totalEquity = equity.reduce((sum, r) => sum + (r.balance || 0), 0);

    return { 
        assets, liabilities, equity, 
        totals: { totalAssets, totalLiabilities, totalEquity } 
    };
  }, [reportRows]);
  
  const balanceDiff = totals.totalAssets - (totals.totalLiabilities + totals.totalEquity);
  // Note: Balance sheet math: Assets = Liabilities + Equity.
  // However, the View vw_balance_sheet usually returns positive numbers for debit balance assets and credit balance liabilities/equity.
  // Checking if Assets - (Liabilities + Equity) is roughly 0.
  const isBalanced = Math.abs(balanceDiff) < 1.0;

  const handleExport = () => {
    let csv = `${t.accountNumber},${t.accountName},${t.category},${t.balance}\n`;
    [...assets, ...liabilities, ...equity].forEach(row => {
        csv += `${row.account_number},"${row.account_name}",${row.account_type},${row.balance}\n`;
    });
    csv += `,,Total Assets,${totals.totalAssets}\n`;
    csv += `,,Total Liabilities,${totals.totalLiabilities}\n`;
    csv += `,,Total Equity,${totals.totalEquity}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'balance_sheet.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };
  
  const handlePrint = () => window.print();

  if (isLoading) return <div className="flex justify-center p-12"><Loader className="animate-spin text-cyan-400" /></div>;
  if (error) return <div className="text-center text-red-400 p-8">Error loading report: {(error as Error).message}</div>;

  const SectionTable = ({ title, rows, total, colorClass }: { title: string, rows: BalanceSheetRow[], total: number, colorClass: string }) => (
      <div className={`rounded-xl border mb-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-900/30' : 'border-slate-200 bg-white'}`}>
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
                        <td className="p-3 text-right font-mono">{formatCurrency(row.balance, row.currency)}</td>
                    </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={2} className="p-4 text-center text-gray-500 text-xs italic">No records</td></tr>}
            </tbody>
        </table>
      </div>
  );

  return (
    <ReportContainer 
        title={t.balanceSheet}
        onExport={handleExport}
        onPrint={handlePrint}
    >
        <div className={`p-6 rounded-xl border flex flex-col items-center text-center gap-4 shadow-sm mb-8 ${isBalanced ? (theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200') : (theme === 'dark' ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200')}`}>
            <div className={`p-3 rounded-full ${isBalanced ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {isBalanced ? <CheckCircle size={32}/> : <AlertTriangle size={32}/>} 
            </div>
            <div>
                <h4 className={`font-bold text-2xl mb-1 ${isBalanced ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800') : (theme === 'dark' ? 'text-red-400' : 'text-red-800')}`}>
                    {isBalanced ? 'الميزانية متوازنة' : 'الميزانية غير متوازنة!'}
                </h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                    {isBalanced 
                        ? 'المعادلة المحاسبية صحيحة: الأصول = الخصوم + حقوق الملكية' 
                        : 'يوجد فرق في الميزانية. يرجى مراجعة القيود اليومية.'}
                </p>
            </div>
            
             {!isBalanced && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                    <Info size={14}/>
                    <span>الفرق: {formatCurrency(balanceDiff, settings.baseCurrency)}</span>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
                 <div className={`p-4 rounded-lg text-center border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">{t.totalAssets}</span>
                    <div className="text-2xl font-mono font-bold text-emerald-500 mt-1">{formatCurrency(totals.totalAssets, settings.baseCurrency)}</div>
                 </div>
                 <SectionTable 
                    title={t.assets} 
                    rows={assets} 
                    total={totals.totalAssets} 
                    colorClass="text-emerald-400" 
                />
            </div>
            
            <div className="flex flex-col gap-6">
                 <div className={`p-4 rounded-lg text-center border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">{t.totalLiabilitiesAndEquity}</span>
                    <div className="text-2xl font-mono font-bold text-orange-500 mt-1">{formatCurrency(totals.totalLiabilities + totals.totalEquity, settings.baseCurrency)}</div>
                 </div>
                <SectionTable 
                    title={t.liabilities} 
                    rows={liabilities} 
                    total={totals.totalLiabilities} 
                    colorClass="text-orange-400" 
                />
                <SectionTable 
                    title={t.equity} 
                    rows={equity} 
                    total={totals.totalEquity} 
                    colorClass="text-purple-400" 
                />
            </div>
        </div>
    </ReportContainer>
  );
};


import React, { useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { ReportContainer } from './ReportContainer';
import { formatCurrency } from '../../expenses/lib/utils';
import { Account } from '../../../types';
import { Scale, CheckCircle, AlertTriangle } from 'lucide-react';

export const TrialBalanceReport: React.FC = () => {
    const { accounts, theme, lang, currency } = useZustandStore(state => ({
        accounts: state.accounts,
        theme: state.theme,
        lang: state.lang,
        currency: state.settings.baseCurrency,
    }));
    const t = translations[lang];
    const isDark = theme === 'dark';

    const reportData = useMemo(() => {
        // Filter and sort accounts
        return accounts
            .filter(acc => !acc.isPlaceholder && acc.balance !== 0)
            .sort((a,b) => a.accountNumber.localeCompare(b.accountNumber));
    }, [accounts]);

    const totals = useMemo(() => {
        let totalDebits = 0;
        let totalCredits = 0;
        const naturalDebitAccounts: Account['type'][] = ['asset', 'expense'];

        reportData.forEach(acc => {
            const isNaturalDebit = naturalDebitAccounts.includes(acc.type);
            if (isNaturalDebit) {
                totalDebits += acc.balance; 
            } else {
                totalCredits += acc.balance;
            }
        });
        return { totalDebits, totalCredits };
    }, [reportData]);

    const isBalanced = Math.abs(totals.totalDebits - totals.totalCredits) < 0.01;

    const headerClasses = `p-4 text-sm font-bold text-white sticky top-0 z-10 ${isDark ? 'bg-gray-800' : 'bg-slate-800'}`;
    const rowClasses = `border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`;

    return (
        <ReportContainer title={t.trialBalance}>
            <div className="space-y-6">
                
                {/* Summary Header */}
                <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-6 ${isDark ? 'bg-gray-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isBalanced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            <Scale size={32} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.totals}</h3>
                            <p className={`flex items-center gap-1.5 text-sm font-medium ${isBalanced ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isBalanced ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
                                {isBalanced ? 'الحسابات متوازنة' : 'يوجد فرق في الميزان!'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-8 text-right">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">{t.totalDebits}</p>
                            <p className={`text-2xl font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatCurrency(totals.totalDebits, currency)}</p>
                        </div>
                        <div className="w-px bg-gray-700 h-12 self-center hidden md:block"></div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">{t.totalCredits}</p>
                            <p className={`text-2xl font-mono font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{formatCurrency(totals.totalCredits, currency)}</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full text-sm responsive-table">
                            <thead>
                                <tr className="text-right">
                                    <th className={`${headerClasses} w-32 text-center`}>{t.accountNumber}</th>
                                    <th className={headerClasses}>{t.accountName}</th>
                                    <th className={`${headerClasses} text-right w-40`}>{t.debit}</th>
                                    <th className={`${headerClasses} text-right w-40`}>{t.credit}</th>
                                </tr>
                            </thead>
                            <tbody className={isDark ? 'bg-gray-900/20' : 'bg-white'}>
                                {reportData.map((acc, index) => {
                                    const naturalDebitAccounts: Account['type'][] = ['asset', 'expense'];
                                    const isNaturalDebit = naturalDebitAccounts.includes(acc.type);
                                    let debit = 0;
                                    let credit = 0;

                                    if (isNaturalDebit) {
                                        debit = acc.balance;
                                    } else {
                                        credit = acc.balance;
                                    }
                                    
                                    // Account Type Badges
                                    const typeBadgeClass = {
                                        asset: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                                        liability: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                                        equity: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                                        revenue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                                        expense: 'text-red-400 bg-red-500/10 border-red-500/20',
                                    }[acc.type] || 'text-gray-400';

                                    return (
                                        <tr key={acc.id} className={rowClasses}>
                                            <td className="p-4 text-center">
                                                <span className={`font-mono text-xs px-2 py-1 rounded border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-slate-100 border-slate-300 text-slate-700'}`}>
                                                    {acc.accountNumber}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{acc.name}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeBadgeClass} uppercase`}>{acc.type}</span>
                                                </div>
                                            </td>
                                            <td className={`p-4 text-right font-mono ${debit > 0 ? (isDark ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold') : 'text-gray-600 opacity-30'}`}>
                                                {debit > 0 ? formatCurrency(debit, currency) : '-'}
                                            </td>
                                            <td className={`p-4 text-right font-mono ${credit > 0 ? (isDark ? 'text-orange-400 font-bold' : 'text-orange-700 font-bold') : 'text-gray-600 opacity-30'}`}>
                                                {credit > 0 ? formatCurrency(credit, currency) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className={`font-bold ${isDark ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-900'}`}>
                                <tr className="border-t-2 border-gray-600">
                                    <td className="p-4 text-center" colSpan={2}>{t.totals}</td>
                                    <td className="p-4 text-right font-mono text-emerald-400">{formatCurrency(totals.totalDebits, currency)}</td>
                                    <td className="p-4 text-right font-mono text-orange-400">{formatCurrency(totals.totalCredits, currency)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </ReportContainer>
    );
};

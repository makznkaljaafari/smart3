
import React, { useState, useMemo, useCallback } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Account, JournalEntryLine } from '../../../types';
import { useAccountData } from '../hooks/useAccountData';
import { useJournalEntryData } from '../hooks/useJournalEntryData';
import { formatCurrency, formatDate } from '../lib/utils';
import { Filter, Calendar, Hash, Search, ArrowRight } from 'lucide-react';

export const GeneralLedgerView: React.FC = () => {
    const { theme, lang, settings } = useZustandStore(state => ({ 
        theme: state.theme, 
        lang: state.lang,
        settings: state.settings,
    }));
    const t = translations[lang];
    const isDark = theme === 'dark';

    const { accounts, isLoading: accountsLoading } = useAccountData();
    // Explicitly use 'all' mode to fetch full history for running balance calculations
    const { journalEntries, isLoading: entriesLoading } = useJournalEntryData({ mode: 'all' });

    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    const transactionData = useMemo(() => {
        if (!selectedAccountId) return null;

        const selectedAccount = accounts.find(a => a.id === selectedAccountId);
        if (!selectedAccount) return null;

        const relevantTransactions: (JournalEntryLine & { date: string; description: string, entryId: string })[] = [];
        journalEntries.forEach(entry => {
            entry.lines.forEach(line => {
                if (line.accountId === selectedAccountId) {
                    relevantTransactions.push({ 
                        ...line, 
                        date: entry.date, 
                        description: entry.description,
                        entryId: entry.id
                    });
                }
            });
        });

        // Sort chronological for balance calc
        relevantTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Filter by search term if needed (display filter only)
        const filteredTransactions = searchTerm 
            ? relevantTransactions.filter(tx => tx.description.toLowerCase().includes(searchTerm.toLowerCase()))
            : relevantTransactions;

        let runningBalance = 0;
        const naturalDebitAccounts: Account['type'][] = ['asset', 'expense'];
        const isNaturalDebit = naturalDebitAccounts.includes(selectedAccount.type);

        const transactionsWithBalance = filteredTransactions.map(tx => {
            if (isNaturalDebit) {
                runningBalance += tx.debit - tx.credit;
            } else {
                runningBalance += tx.credit - tx.debit;
            }
            return { ...tx, balance: runningBalance };
        });
        
        // Sort reverse chronological for display if desired, but standard GL is usually chronological.
        // We keep chronological for running balance sense.

        return {
            account: selectedAccount,
            transactions: transactionsWithBalance,
            finalBalance: runningBalance
        };
    }, [selectedAccountId, accounts, journalEntries, searchTerm]);
    
    const formControlClasses = `w-full md:w-auto px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-slate-300 text-slate-800'}`;

    return (
        <div className={`p-6 rounded-2xl border shadow-lg transition-all ${isDark ? 'bg-gray-800/40 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200'}`}>
            
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
                <div>
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <Hash className="text-cyan-500" />
                        {t.generalLedger}
                    </h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>عرض وتحليل حركات الحسابات التفصيلية</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                     {selectedAccountId && (
                        <div className="relative">
                            <Search className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'right-3' : 'left-3'} text-gray-500`} size={16} />
                            <input 
                                type="text" 
                                placeholder="بحث في الوصف..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`${formControlClasses} ${lang === 'ar' ? 'pr-9' : 'pl-9'}`}
                            />
                        </div>
                    )}
                    <select 
                        value={selectedAccountId} 
                        onChange={e => setSelectedAccountId(e.target.value)}
                        className={`${formControlClasses} min-w-[250px] font-medium`}
                        disabled={accountsLoading}
                    >
                        <option value="">{t.selectAnAccount}</option>
                        {accounts.filter(a => !a.isPlaceholder).map(account => (
                            <option key={account.id} value={account.id}>
                                {account.accountNumber} - {account.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            {/* Content Area */}
            {entriesLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                </div>
            ) : transactionData ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Account Summary Card */}
                    <div className={`p-5 rounded-xl border flex justify-between items-center ${isDark ? 'bg-gradient-to-r from-gray-900 to-gray-800 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                            <p className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{transactionData.account.accountNumber}</p>
                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{transactionData.account.name}</h2>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>الرصيد الحالي</p>
                            <p className={`text-3xl font-mono font-bold ${transactionData.finalBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {formatCurrency(transactionData.finalBalance, transactionData.account.currency)}
                            </p>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    {transactionData.transactions.length > 0 ? (
                        <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <div className="overflow-x-auto max-h-[600px]">
                                <table className="w-full text-sm">
                                    <thead className={`sticky top-0 z-10 ${isDark ? 'bg-gray-900 text-gray-400' : 'bg-slate-100 text-slate-600'}`}>
                                        <tr>
                                            <th className="p-4 text-right font-semibold">{t.date}</th>
                                            <th className="p-4 text-right font-semibold">{t.description}</th>
                                            <th className="p-4 text-right font-semibold">{t.debit}</th>
                                            <th className="p-4 text-right font-semibold">{t.credit}</th>
                                            <th className="p-4 text-right font-semibold">{t.runningBalance}</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-200'}`}>
                                        {transactionData.transactions.map((tx, index) => (
                                            <tr key={`${tx.entryId}-${index}`} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                                <td className="p-4 whitespace-nowrap font-mono text-xs opacity-70">{formatDate(tx.date)}</td>
                                                <td className={`p-4 font-medium ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>{tx.description}</td>
                                                <td className={`p-4 text-right font-mono ${tx.debit > 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'opacity-20'}`}>
                                                    {tx.debit > 0 ? formatCurrency(tx.debit, transactionData.account.currency) : '-'}
                                                </td>
                                                <td className={`p-4 text-right font-mono ${tx.credit > 0 ? (isDark ? 'text-orange-400' : 'text-orange-600') : 'opacity-20'}`}>
                                                    {tx.credit > 0 ? formatCurrency(tx.credit, transactionData.account.currency) : '-'}
                                                </td>
                                                <td className={`p-4 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {formatCurrency(tx.balance, transactionData.account.currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className={`text-center py-16 rounded-xl border border-dashed ${isDark ? 'border-gray-700 text-gray-500' : 'border-slate-300 text-slate-400'}`}>
                            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">{t.noTransactionsFound}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className={`flex flex-col items-center justify-center py-24 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-800 bg-gray-900/20' : 'border-slate-200 bg-slate-50'}`}>
                    <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}>
                        <ArrowRight size={32} className={lang === 'ar' ? 'rotate-180' : ''} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>ابدأ باختيار حساب</h3>
                    <p className={`text-center max-w-md ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                        اختر حساباً من القائمة أعلاه لعرض جميع القيود المحاسبية وتتبع الرصيد الجاري.
                    </p>
                </div>
            )}
        </div>
    );
};


import React, { useState } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { JournalEntry, Toast } from '../../../types';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Plus, ServerCrash, CheckCircle, Scale, Hash, User, Search, ChevronLeft, ChevronRight, FilterX } from 'lucide-react';
import { JournalEntryFormModal } from './JournalEntryFormModal';
import { useJournalEntryData } from '../hooks/useJournalEntryData';
import { formatCurrency, formatDate } from '../lib/utils';
import { LoadingState } from '../../../components/common/LoadingState';
import { EmptyState } from '../../../components/common/EmptyState';

const JournalEntryCard: React.FC<{ entry: JournalEntry, theme: string, t: any }> = ({ entry, theme, t }) => {
    const isDark = theme.startsWith('dark');
    const isBalanced = Math.abs(entry.lines.reduce((s,l) => s + l.debit, 0) - entry.lines.reduce((s,l) => s + l.credit, 0)) < 0.01;

    return (
        <div className={`p-4 rounded-xl border mb-4 transition-all ${isDark ? 'bg-gray-900/40 border-gray-700 hover:border-cyan-500/30' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-3 pb-3 border-b border-gray-700/50">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs opacity-50">#{entry.id.slice(0,8)}</span>
                        <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{entry.description}</h4>
                        {isBalanced && <CheckCircle size={14} className="text-green-500" />}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><CalendarIcon /> {formatDate(entry.date)}</span>
                        {entry.createdBy && <span className="flex items-center gap-1"><User size={12}/> {entry.createdBy}</span>}
                        {entry.referenceType && <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300">{entry.referenceType}</span>}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className={`text-left ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <th className="pb-2 font-medium">الحساب</th>
                            <th className="pb-2 text-right font-medium">مدين</th>
                            <th className="pb-2 text-right font-medium">دائن</th>
                            <th className="pb-2 font-medium pl-4">ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                        {entry.lines.map(line => (
                            <tr key={line.id}>
                                <td className="py-2">
                                    <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>{line.accountId}</span> 
                                </td>
                                <td className={`py-2 text-right font-mono ${line.debit > 0 ? 'text-emerald-500' : 'opacity-20'}`}>
                                    {line.debit > 0 ? formatCurrency(line.debit, 'SAR') : '-'}
                                </td>
                                <td className={`py-2 text-right font-mono ${line.credit > 0 ? 'text-orange-500' : 'opacity-20'}`}>
                                    {line.credit > 0 ? formatCurrency(line.credit, 'SAR') : '-'}
                                </td>
                                <td className="py-2 pl-4 text-gray-500 truncate max-w-[200px]">{line.note}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);

export const JournalEntriesView: React.FC = () => {
    const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
    const t = translations[lang];
    const isDark = theme.startsWith('dark');

    const {
        journalEntries,
        isLoading,
        error,
        saveJournalEntry,
        currentPage,
        setCurrentPage,
        totalPages,
        filters,
        setFilters
    } = useJournalEntryData({ mode: 'paginated' });

    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleSave = async (entryData: Omit<JournalEntry, 'id' | 'company_id'>) => {
        await saveJournalEntry(entryData);
        setIsFormOpen(false);
    };

    const formControlClasses = `px-4 py-2 rounded-lg border focus:outline-none transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-300'}`;

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.journalEntries}</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>عرض وإدارة القيود اليومية.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                     <HoloButton icon={Plus} onClick={() => setIsFormOpen(true)}>{t.addEntry || 'Add Entry'}</HoloButton>
                </div>
            </div>

            {/* Filters */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-slate-200'}`}>
                <div className="relative flex-1 w-full">
                    <Search className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'right-3' : 'left-3'} text-gray-500`} size={16} />
                    <input 
                        type="text" 
                        placeholder={t.search || 'Search description...'}
                        value={filters.search}
                        onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                        className={`${formControlClasses} w-full ${lang === 'ar' ? 'pr-9' : 'pl-9'}`}
                    />
                </div>
                <input type="date" value={filters.dateFrom} onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} className={formControlClasses} />
                <input type="date" value={filters.dateTo} onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} className={formControlClasses} />
                 {(filters.search || filters.dateFrom || filters.dateTo) && (
                    <button onClick={() => setFilters({ search: '', dateFrom: '', dateTo: '', referenceType: 'all' })} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                        <FilterX size={20} />
                    </button>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <LoadingState />
            ) : error ? (
                <EmptyState icon={ServerCrash} title="Error" description={error} variant="error" />
            ) : journalEntries.length === 0 ? (
                <EmptyState icon={Scale} title={t.noEntries || 'No Journal Entries'} description="Create your first manual journal entry or generate one from invoices." actionLabel={t.addEntry} onAction={() => setIsFormOpen(true)} />
            ) : (
                <div className="space-y-4">
                    {journalEntries.map(entry => (
                        <JournalEntryCard key={entry.id} entry={entry} theme={theme} t={t} />
                    ))}
                    
                    {/* Pagination */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                        <span className="text-sm text-gray-500">{t.page} {currentPage} {t.of} {totalPages}</span>
                        <div className="flex gap-2">
                             <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-gray-800 disabled:opacity-50"><ChevronLeft size={20}/></button>
                             <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-gray-800 disabled:opacity-50"><ChevronRight size={20}/></button>
                        </div>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <JournalEntryFormModal
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

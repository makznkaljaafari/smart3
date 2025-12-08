
import React, { useState, useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { JournalEntry, JournalEntryLine } from '../../../types';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { X, Save, Plus, Trash2, Sparkles, Loader } from 'lucide-react';
import { suggestJournalEntryFromDescription } from '../../../services/aiService';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

interface JournalEntryFormModalProps {
    onClose: () => void;
    onSave: (entry: Omit<JournalEntry, 'id' | 'company_id'>) => void;
}

export const JournalEntryFormModal: React.FC<JournalEntryFormModalProps> = ({ onClose, onSave }) => {
    const { theme, lang, accounts, settings } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        accounts: state.accounts,
        settings: state.settings,
    }));
    const t = translations[lang];

    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 800, height: 800 }});
    
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [lines, setLines] = useState<Partial<JournalEntryLine>[]>([
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 }
    ]);
    const [error, setError] = useState('');

    const [aiPrompt, setAiPrompt] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);

    const selectableAccounts = accounts.filter(a => !a.isPlaceholder);

    const handleSuggest = async () => {
        if (!aiPrompt.trim()) return;
        setIsSuggesting(true);
        setError('');
        try {
            const result = await suggestJournalEntryFromDescription(aiPrompt, selectableAccounts, lang);
            if (result && result.description && result.lines.length > 0) {
                setDescription(result.description);
                setLines(result.lines);
            } else {
                setError('فشل الذكاء الاصطناعي في اقتراح قيد. حاول وصف العملية بشكل أوضح.');
            }
        } catch (e) {
            setError('حدث خطأ أثناء الاتصال بمساعد الذكاء الاصطناعي.');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleLineChange = (index: number, field: keyof JournalEntryLine, value: any) => {
        const newLines = [...lines];
        const line = { ...newLines[index] };
        
        if (field === 'debit') {
            line.debit = parseFloat(value) || 0;
            if (line.debit > 0) line.credit = 0;
        } else if (field === 'credit') {
            line.credit = parseFloat(value) || 0;
            if (line.credit > 0) line.debit = 0;
        } else {
            (line as any)[field] = value;
        }
        
        newLines[index] = line;
        setLines(newLines);
        setError('');
    };

    const addLine = () => setLines([...lines, { accountId: '', debit: 0, credit: 0 }]);
    const removeLine = (index: number) => setLines(lines.filter((_, i) => i !== index));

    const { totalDebits, totalCredits } = useMemo(() => {
        return lines.reduce(
            (totals, line) => ({
                totalDebits: totals.totalDebits + (line.debit || 0),
                totalCredits: totals.totalCredits + (line.credit || 0),
            }),
            { totalDebits: 0, totalCredits: 0 }
        );
    }, [lines]);

    const handleSubmit = () => {
        if (lines.length < 2 || lines.some(l => !l.accountId)) {
            setError(t.entryMustNotBeEmpty);
            return;
        }
        if (Math.abs(totalDebits - totalCredits) > 0.001 || totalDebits === 0) {
            setError(t.debitsAndCreditsMustBalance);
            return;
        }
        
        const finalLines = lines
            .filter(l => l.accountId && (l.debit || l.credit))
            .map(l => ({ ...l, id: `JEL-${Date.now()}-${Math.random()}` } as JournalEntryLine));

        onSave({
            date,
            description,
            lines: finalLines,
            createdBy: settings.profile.name,
        });
    };

    const formInputClasses = `w-full rounded-lg p-2 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;
    const labelClasses = `block text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`;

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` } as React.CSSProperties}
                className={`fixed rounded-2xl shadow-2xl w-full grid grid-rows-[auto_1fr_auto] overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} onTouchStart={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-2xl font-bold">{t.journalEntryFormTitle}</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={24} /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="overflow-y-auto p-6 space-y-4 min-h-0">
                    <div>
                        <label className={labelClasses}>
                            <span className="flex items-center gap-2">
                                <Sparkles size={16} className="text-purple-400" />
                                {'اقتراح بالذكاء الاصطناعي'}
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="مثال: دفعت فاتورة الكهرباء 500 ريال من حساب البنك"
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                className={`${formInputClasses} flex-1`}
                                disabled={isSuggesting}
                            />
                            <HoloButton variant="secondary" onClick={handleSuggest} disabled={isSuggesting || !aiPrompt.trim()}>
                                {isSuggesting ? <Loader size={18} className="animate-spin" /> : 'اقتراح'}
                            </HoloButton>
                        </div>
                    </div>

                    <div className={`my-4 border-t border-dashed ${theme === 'dark' ? 'border-gray-700' : 'border-slate-300'}`} />

                    <div className="grid md:grid-cols-5 gap-4">
                        <div className="md:col-span-2"><label className={labelClasses}>{t.date}</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className={formInputClasses}/></div>
                        <div className="md:col-span-3"><label className={labelClasses}>{t.description}</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} className={formInputClasses}/></div>
                    </div>
                    <div className="space-y-2">
                        {lines.map((line, index) => (
                            <div key={index} className={`grid grid-cols-12 gap-2 items-center p-2 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-100'}`}>
                                <div className="col-span-6">
                                    <label className="text-xs">{t.account}</label>
                                    <select value={line.accountId} onChange={e => handleLineChange(index, 'accountId', e.target.value)} className={formInputClasses}>
                                        <option value="">{t.selectAnAccount}</option>
                                        {selectableAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs">{t.debit}</label>
                                    <input type="number" value={line.debit || ''} onChange={e => handleLineChange(index, 'debit', e.target.value)} className={`${formInputClasses} text-right`} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs">{t.credit}</label>
                                    <input type="number" value={line.credit || ''} onChange={e => handleLineChange(index, 'credit', e.target.value)} className={`${formInputClasses} text-right`} />
                                </div>
                                <div className="col-span-2 pt-5 flex justify-end">
                                    {lines.length > 2 && <button onClick={() => removeLine(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 size={16}/></button>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <HoloButton variant="secondary" icon={Plus} onClick={addLine}>{t.addLine}</HoloButton>
                </form>
                <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <div className="font-bold text-lg">{t.totals}</div>
                        <div className="flex gap-4 font-mono text-lg">
                            <div className="text-right"><div>{formatCurrency(totalDebits)}</div><div className="text-xs">{t.totalDebits}</div></div>
                            <div className="text-right"><div>{formatCurrency(totalCredits)}</div><div className="text-xs">{t.totalCredits}</div></div>
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-center mb-2">{error}</p>}
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-semibold ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'}`}>{t.cancel}</button>
                        <HoloButton variant="success" icon={Save} onClick={handleSubmit}>{t.save}</HoloButton>
                    </div>
                </div>
                <div onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400"><svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg></div>
            </div>
        </div>
    );
};
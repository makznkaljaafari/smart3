import React, { useState, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Brain, Loader } from 'lucide-react';
import { ExpenseCategory } from '../../../types';
import { CATEGORY_CONFIG } from '../../expenses/lib/utils';

interface BudgetSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (budgets: Record<ExpenseCategory, number>) => void;
    suggestions: Record<ExpenseCategory, number> | null;
    isLoading: boolean;
    currency: string;
}

export const BudgetSuggestionModal: React.FC<BudgetSuggestionModalProps> = ({ isOpen, onClose, onApply, suggestions, isLoading, currency }) => {
    const { theme, lang } = useZustandStore();
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 700, height: 600 } });

    const [localBudgets, setLocalBudgets] = useState<Record<ExpenseCategory, number> | null>(suggestions);

    useEffect(() => {
        setLocalBudgets(suggestions);
    }, [suggestions]);

    const handleBudgetChange = (category: ExpenseCategory, amount: string) => {
        setLocalBudgets(prev => ({
            ...(prev || {}),
            [category]: parseFloat(amount) || 0
        } as Record<ExpenseCategory, number>));
    };

    const handleApply = () => {
        if (localBudgets) {
            onApply(localBudgets);
        }
    };
    
    if (!isOpen) return null;
    
    const formInputClasses = `w-full rounded-lg p-2 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-purple-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-xl font-bold flex items-center gap-2"><Brain className="text-purple-400" /> {t.suggestedBudgets}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader size={40} className="animate-spin text-purple-400" />
                            <p>{t.analyzingExpenses}</p>
                        </div>
                    ) : localBudgets ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(localBudgets).map(([category, amount]) => {
                                const categoryKey = category as ExpenseCategory;
                                const config = CATEGORY_CONFIG[categoryKey];
                                if (!config) return null;
                                const Icon = config.icon;
                                return (
                                    <div key={categoryKey} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon size={18} className={config.color.replace('600', '400')} />
                                            <label className="font-semibold">{config.label}</label>
                                        </div>
                                        <div className="relative">
                                            <span className={`absolute inset-y-0 ${lang === 'ar' ? 'right-3' : 'left-3'} flex items-center text-gray-400`}>{currency}</span>
                                            <input
                                                type="number"
                                                value={localBudgets[categoryKey]}
                                                onChange={(e) => handleBudgetChange(categoryKey, e.target.value)}
                                                className={`${formInputClasses} ${lang === 'ar' ? 'pr-12' : 'pl-12'}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center h-full flex items-center justify-center">{t.noSuggestionsAvailable}</div>
                    )}
                </div>
                <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <button type="button" onClick={onClose} className={`px-6 py-2 rounded-xl font-semibold ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'}`}>{t.cancel}</button>
                    <HoloButton variant="success" icon={Save} onClick={handleApply} disabled={!localBudgets}>
                        {t.applyBudgets}
                    </HoloButton>
                </div>
                 <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-purple-400">
                    <svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg>
                </div>
            </div>
        </div>
    );
};
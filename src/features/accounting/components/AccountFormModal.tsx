import React, { useState, useEffect, useRef } from 'react';
// FIX: Replace 'useStore' with 'useZustandStore'
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Account, AccountType, CurrencyCode } from '../../../types';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { X, Save, Sparkles, Loader } from 'lucide-react';
import { suggestAccountType } from '../../../services/aiService';

interface AccountFormModalProps {
    accountToEdit: Account | null;
    onClose: () => void;
    onSave: (account: Partial<Account>) => void;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({ accountToEdit, onClose, onSave }) => {
    // FIX: Use 'useZustandStore' with a selector.
    const { theme, lang, accounts, settings } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        accounts: state.accounts,
        settings: state.settings,
    }));
    const { baseCurrency, enabledCurrencies } = settings;
    const t = translations[lang];

    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 600, height: 650 }});
    const isEdit = !!accountToEdit;

    const [formData, setFormData] = useState<Partial<Account>>(
        accountToEdit || {
            accountNumber: '',
            name: '',
            type: 'asset',
            parentId: null,
            isPlaceholder: false,
            currency: baseCurrency,
        }
    );
    const [isSuggestingType, setIsSuggestingType] = useState(false);
    const suggestionTimeoutRef = useRef<number | null>(null);

    const handleNameChange = (newName: string) => {
        setFormData(prev => ({ ...prev, name: newName }));
        
        if (suggestionTimeoutRef.current) {
            clearTimeout(suggestionTimeoutRef.current);
        }

        if (newName.trim().length > 3 && !isEdit) { // Only suggest on new accounts
            setIsSuggestingType(true);
            suggestionTimeoutRef.current = window.setTimeout(async () => {
                const suggestedType = await suggestAccountType(newName);
                if (suggestedType) {
                    setFormData(prev => ({ ...prev, type: suggestedType }));
                }
                setIsSuggestingType(false);
            }, 1000); // 1-second debounce
        }
    };
    
    useEffect(() => {
        return () => {
            if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current);
            }
        };
    }, []);

    const handleSubmit = () => {
        // Basic validation
        if (!formData.accountNumber || !formData.name) {
            alert('Account Number and Name are required.');
            return;
        }
        onSave(formData);
    };

    const formInputClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 bg-white text-slate-800 border-slate-300`;
    const labelClasses = `block text-sm mb-2 text-slate-700`;
    const placeholderAccounts = accounts.filter(a => a.isPlaceholder);
    const accountTypes: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense'];

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
                className={`fixed rounded-2xl shadow-2xl w-full grid grid-rows-[auto_1fr_auto] overflow-hidden bg-white border`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} onTouchStart={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move border-slate-200`}>
                    <h3 className={`text-2xl font-bold text-slate-900`}>{isEdit ? t.editAccount : t.addAccount}</h3>
                    <button onClick={onClose} className={`p-2 rounded-lg text-slate-500 hover:bg-slate-200`}><X size={24} /></button>
                </div>
                <div className="overflow-y-auto p-6 space-y-6 min-h-0">
                    <h4 className={`text-lg font-bold text-slate-900`}>{t.accountFormTitle}</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>{t.accountNumber} *</label>
                            <input type="text" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className={formInputClasses}/>
                        </div>
                        <div className="col-span-2">
                            <label className={labelClasses}>{t.accountName} *</label>
                            <input type="text" value={formData.name} onChange={e => handleNameChange(e.target.value)} className={formInputClasses}/>
                        </div>
                        <div>
                            <label className={labelClasses}>{t.accountType}</label>
                            <div className="relative">
                                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as AccountType})} className={`${formInputClasses} appearance-none pr-10`}>
                                    {accountTypes.map(type => <option key={type} value={type}>{t[type] || type}</option>)}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    {isSuggestingType ? <Loader size={16} className="animate-spin text-gray-400" /> : <Sparkles size={16} className="text-purple-400" />}
                                </div>
                            </div>
                        </div>
                         <div>
                            <label className={labelClasses}>{t.currency}</label>
                            <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as CurrencyCode})} className={formInputClasses}>
                                {enabledCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className={labelClasses}>{t.parentAccount}</label>
                            <select value={formData.parentId || ''} onChange={e => setFormData({...formData, parentId: e.target.value || null})} className={formInputClasses}>
                                <option value="">-- {lang === 'ar' ? 'بدون' : 'None'} --</option>
                                {placeholderAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                        <input id="isPlaceholder" type="checkbox" checked={formData.isPlaceholder} onChange={e => setFormData({...formData, isPlaceholder: e.target.checked})} className="w-4 h-4 rounded text-cyan-600 bg-slate-100 border-slate-300 focus:ring-cyan-500" />
                        <label htmlFor="isPlaceholder" className={`${labelClasses} mb-0`}>{t.isPlaceholder}</label>
                    </div>
                </div>
                <div className={`flex justify-end gap-3 p-4 border-t border-slate-200`}>
                    <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-semibold bg-slate-200`}>{t.cancel}</button>
                    <HoloButton variant="success" icon={Save} onClick={handleSubmit}>{t.save}</HoloButton>
                </div>
                <div onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-slate-500 hover:text-cyan-400"><svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg></div>
            </div>
        </div>
    );
};

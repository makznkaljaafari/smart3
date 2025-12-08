
import React, { useMemo } from 'react';
import { Expense, RecurrenceType } from '../../types';
import { Account } from '../../../../types';
import { translations } from '../../../../lib/i18n';
import { useZustandStore } from '../../../../store/useStore';
import { Label } from '../../../../components/ui/Label';
import { Select } from '../../../../components/ui/Select';
import { Toggle } from '../../../../components/ui/Toggle';
import { BookCopy, Zap, Sparkles, Loader } from 'lucide-react';

interface ExpenseAccountingProps {
    formData: Partial<Expense>;
    onChange: (field: keyof Expense, value: any) => void;
    onSuggestAccounts: () => void;
    isSuggestingAccounts: boolean;
    accounts: Account[];
    formInputClasses: string;
}

export const ExpenseAccounting: React.FC<ExpenseAccountingProps> = ({ 
    formData, onChange, onSuggestAccounts, isSuggestingAccounts, accounts, formInputClasses 
}) => {
    const { lang, theme, settings } = useZustandStore();
    const t = translations[lang];

    // Filter Accounts
    const expenseAccounts = useMemo(() => accounts.filter(a => a.type === 'expense' && !a.isPlaceholder), [accounts]);
    
    const { connectedAccounts, otherAssetAccounts } = useMemo(() => {
        const assets = accounts.filter(a => a.type === 'asset' && !a.isPlaceholder);
        const connectedNames = new Set(settings.integrations.bankConnections?.map(c => c.bankName) || []);
        
        const connected = assets.filter(a => connectedNames.has(a.name) || a.name.includes('بنك') || a.name.includes('Bank') || a.name.includes('صراف'));
        const others = assets.filter(a => !connected.includes(a));
        
        return { connectedAccounts: connected, otherAssetAccounts: others };
    }, [accounts, settings.integrations.bankConnections]);

    return (
        <>
            <section>
                <h4 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                    <Zap className="text-cyan-400" size={20} /> الأتمتة
                </h4>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
                    <div className="flex items-center justify-between">
                        <Label className="mb-0">إنشاء مصروف متكرر تلقائيًا من هذا القالب</Label>
                        <Toggle
                            checked={formData.isRecurringTemplate || false}
                            onChange={value => onChange('isRecurringTemplate', value)}
                        />
                    </div>
                    {formData.isRecurringTemplate && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <Label>{t.recurrence}</Label>
                            <Select
                                value={formData.recurrence || 'none'}
                                onChange={e => onChange('recurrence', e.target.value as RecurrenceType)}
                            >
                                <option value="none" disabled>{t.none}</option>
                                <option value="daily">{t.daily}</option>
                                <option value="weekly">{t.weekly}</option>
                                <option value="monthly">{t.monthly}</option>
                                <option value="yearly">{t.yearly}</option>
                            </Select>
                        </div>
                    )}
                </div>
            </section>

            <section>
                <h4 className="text-lg font-bold mb-4 text-white flex items-center justify-between">
                    <span className="flex items-center gap-2"><BookCopy className="text-cyan-400" size={20} /> {t.accountingLink}</span>
                    <button 
                        type="button" 
                        onClick={onSuggestAccounts} 
                        disabled={isSuggestingAccounts || !formData.title} 
                        className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                    >
                        {isSuggestingAccounts ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isSuggestingAccounts ? t.suggesting : t.suggestAccounts}
                    </button>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>{t.expenseAccountDebit}</Label>
                        <Select 
                            value={formData.expenseAccountId || ''} 
                            onChange={e => onChange('expenseAccountId', e.target.value)}
                        >
                            <option value="">{t.selectAnAccount}</option>
                            {expenseAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label>{t.paymentAccountCredit}</Label>
                        <Select 
                            value={formData.paymentAccountId || ''} 
                            onChange={e => onChange('paymentAccountId', e.target.value)}
                        >
                            <option value="">{t.selectAnAccount}</option>
                            {connectedAccounts.length > 0 && (
                                <optgroup label="البنوك والصرافات المرتبطة">
                                    {connectedAccounts.map(acc => <option key={acc.id} value={acc.id}>🏦 {acc.name}</option>)}
                                </optgroup>
                            )}
                            <optgroup label="حسابات أخرى">
                                {otherAssetAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </optgroup>
                        </Select>
                    </div>
                </div>
            </section>
        </>
    );
};

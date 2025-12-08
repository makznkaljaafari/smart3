
import React, { useState, useMemo, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Account, ReconciliationTransaction } from '../types';
import { reconciliationService } from '../../../services/accounting/reconciliationService';
import { HoloButton } from '../../../components/ui/HoloButton';
import { CheckCircle, RefreshCw, Save, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { LoadingState } from '../../../components/common/LoadingState';

export const BankReconciliationView: React.FC = () => {
    const { theme, lang, accounts, settings, addToast } = useZustandStore();
    const t = translations[lang];
    const isDark = theme === 'dark';

    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
    const [statementBalance, setStatementBalance] = useState<number>(0);
    
    const [transactions, setTransactions] = useState<ReconciliationTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Filter for Bank/Cash accounts
    const bankAccounts = useMemo(() => accounts.filter(a => (a.type === 'asset') && (a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('cash') || a.name.includes('بنك') || a.name.includes('نقد'))), [accounts]);

    const handleFetch = async () => {
        if (!selectedAccountId) return;
        setIsLoading(true);
        const { data, error } = await reconciliationService.getUnreconciledTransactions(selectedAccountId, statementDate);
        if (error) {
            addToast({ message: 'فشل تحميل المعاملات', type: 'error' });
        } else {
            setTransactions(data);
        }
        setIsLoading(false);
    };

    const handleToggleCleared = (id: string) => {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, isCleared: !t.isCleared } : t));
    };

    // Calculations
    const clearedBalance = useMemo(() => transactions.filter(t => t.isCleared).reduce((sum, t) => sum + t.amount, 0), [transactions]);
    // Beginning Balance (Mocked for now, in real app needs to fetch last reconciliation balance)
    const beginningBalance = 0; 
    const adjustedRegisterBalance = beginningBalance + clearedBalance;
    const difference = statementBalance - adjustedRegisterBalance;

    const isBalanced = Math.abs(difference) < 0.01;

    const handleSave = () => {
        if (!isBalanced) {
            if(!confirm('يوجد فرق في المطابقة. هل تريد الحفظ على أي حال؟ (سيبقى الفرق معلقاً)')) return;
        }
        // Save logic would go here
        addToast({ message: 'تم حفظ التسوية بنجاح (محاكاة)', type: 'success' });
        setIsSaved(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header / Config */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><RefreshCw className="text-cyan-400"/> تسوية بنكية</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <Label>الحساب البنكي</Label>
                        <Select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}>
                            <option value="">-- اختر حساب --</option>
                            {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label>تاريخ كشف الحساب</Label>
                        <Input type="date" value={statementDate} onChange={e => setStatementDate(e.target.value)} />
                    </div>
                    <div>
                        <Label>الرصيد النهائي في الكشف</Label>
                        <Input type="number" value={statementBalance} onChange={e => setStatementBalance(parseFloat(e.target.value))} />
                    </div>
                    <div>
                        <HoloButton variant="primary" onClick={handleFetch} disabled={!selectedAccountId} className="w-full justify-center">
                            بدء المطابقة
                        </HoloButton>
                    </div>
                </div>
            </div>

            {isLoading ? <LoadingState /> : transactions.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Transactions List */}
                    <div className={`lg:col-span-2 rounded-xl border overflow-hidden ${isDark ? 'bg-gray-900/30 border-gray-700' : 'bg-white border-slate-200'}`}>
                        <div className={`p-4 border-b font-bold ${isDark ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-50'}`}>
                            المعاملات غير المسواة
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className={`sticky top-0 ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
                                    <tr>
                                        <th className="p-3 text-center w-16">مؤكد?</th>
                                        <th className="p-3 text-right">التاريخ</th>
                                        <th className="p-3 text-right">الوصف</th>
                                        <th className="p-3 text-right">المبلغ</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-slate-200'}`}>
                                    {transactions.map(tx => (
                                        <tr key={tx.id} onClick={() => handleToggleCleared(tx.id)} className={`cursor-pointer transition-colors ${tx.isCleared ? (isDark ? 'bg-green-900/20' : 'bg-green-50') : ''} ${isDark ? 'hover:bg-gray-800' : 'hover:bg-slate-50'}`}>
                                            <td className="p-3 text-center">
                                                <div className={`w-5 h-5 rounded border mx-auto flex items-center justify-center ${tx.isCleared ? 'bg-green-500 border-green-500 text-white' : 'border-gray-400'}`}>
                                                    {tx.isCleared && <CheckCircle size={14} />}
                                                </div>
                                            </td>
                                            <td className="p-3">{new Date(tx.date).toLocaleDateString(lang)}</td>
                                            <td className="p-3">{tx.description}</td>
                                            <td className={`p-3 font-mono font-bold ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {formatCurrency(tx.amount, settings.baseCurrency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <div className="space-y-4">
                        <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <h4 className="font-bold mb-4 text-lg">ملخص التسوية</h4>
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">رصيد كشف البنك</span>
                                    <span className="font-mono font-bold">{formatCurrency(statementBalance, settings.baseCurrency)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">(-) الرصيد المطابق</span>
                                    <span className="font-mono font-bold text-blue-400">{formatCurrency(adjustedRegisterBalance, settings.baseCurrency)}</span>
                                </div>
                                <div className="border-t border-gray-600 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">الفرق</span>
                                    <span className={`font-mono font-black text-xl ${isBalanced ? 'text-green-500' : 'text-red-500'}`}>
                                        {formatCurrency(difference, settings.baseCurrency)}
                                    </span>
                                </div>
                            </div>

                            {!isBalanced && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-2 text-red-400 text-xs">
                                    <AlertTriangle className="shrink-0" size={16} />
                                    <p>يوجد فرق. تأكد من إدخال جميع المعاملات البنكية (رسوم، فوائد) أو التحقق من الرصيد الافتتاحي.</p>
                                </div>
                            )}

                            <div className="mt-6">
                                <HoloButton 
                                    variant={isBalanced ? 'success' : 'secondary'} 
                                    className="w-full justify-center"
                                    onClick={handleSave}
                                    disabled={isSaved}
                                >
                                    {isSaved ? 'تم الحفظ' : (isBalanced ? 'إتمام التسوية' : 'حفظ مسودة')}
                                </HoloButton>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 opacity-50">
                    اختر حساباً للبدء
                </div>
            )}
        </div>
    );
};

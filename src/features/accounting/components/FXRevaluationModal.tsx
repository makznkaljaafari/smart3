
import React, { useState, useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Globe, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { reconciliationService } from '../../../services/accounting/reconciliationService';
import { formatCurrency } from '../lib/utils';

interface FXRevaluationModalProps {
    onClose: () => void;
}

export const FXRevaluationModal: React.FC<FXRevaluationModalProps> = ({ onClose }) => {
    const { theme, lang, accounts, settings, addToast } = useZustandStore();
    const t = translations[lang];
    const isDark = theme === 'dark';
    const { modalRef, headerRef, position, size, handleDragStart } = useDraggableAndResizable({ initialSize: { width: 600, height: 600 } });

    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [newRate, setNewRate] = useState<string>('');
    const [calculation, setCalculation] = useState<any>(null);
    const [gainLossAccountId, setGainLossAccountId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Foreign Currency Accounts Only
    const foreignAccounts = useMemo(() => accounts.filter(a => a.currency !== settings.baseCurrency && !a.isPlaceholder), [accounts, settings.baseCurrency]);
    
    // Expense/Revenue Accounts for Gain/Loss
    const plAccounts = useMemo(() => accounts.filter(a => (a.type === 'revenue' || a.type === 'expense') && !a.isPlaceholder), [accounts]);

    const handleCalculate = async () => {
        if (!selectedAccountId || !newRate) return;
        const rate = parseFloat(newRate);
        if (isNaN(rate)) return;

        try {
            const result = await reconciliationService.calculateFXRevaluation(selectedAccountId, rate);
            setCalculation(result);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!calculation || !gainLossAccountId) return;
        setIsSaving(true);
        await reconciliationService.postRevaluation(selectedAccountId, calculation.diff, gainLossAccountId);
        addToast({ message: 'تم ترحيل قيد فروقات العملة بنجاح.', type: 'success' });
        onClose();
        setIsSaving(false);
    };

    const formControlClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div ref={modalRef} style={{ ...position, ...size }} className={`fixed rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 ${isDark ? 'bg-gray-900 border-blue-500/50' : 'bg-white border-blue-200'}`} onMouseDown={e => e.stopPropagation()}>
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Globe className="text-blue-400" /> إعادة تقييم العملات
                    </h3>
                    <button onClick={onClose}><X /></button>
                </div>

                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>الحساب (عملة أجنبية)</Label>
                            <Select value={selectedAccountId} onChange={e => { setSelectedAccountId(e.target.value); setCalculation(null); }} className={formControlClasses}>
                                <option value="">-- اختر حساب --</option>
                                {foreignAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                            </Select>
                        </div>
                        <div>
                            <Label>سعر الصرف الجديد (إلى {settings.baseCurrency})</Label>
                            <Input 
                                type="number" 
                                value={newRate} 
                                onChange={e => setNewRate(e.target.value)} 
                                onBlur={handleCalculate}
                                className={formControlClasses} 
                                placeholder={`Ex: 3.75`}
                            />
                        </div>
                    </div>

                    {calculation && (
                        <div className={`p-5 rounded-xl border space-y-3 animate-in fade-in slide-in-from-bottom-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
                            <h4 className="font-bold text-sm text-gray-500 border-b border-gray-600 pb-2 mb-2">نتيجة التقييم</h4>
                            
                            <div className="flex justify-between text-sm">
                                <span>الرصيد الأجنبي الحالي:</span>
                                <span className="font-mono">{formatCurrency(calculation.foreignBalance, calculation.account.currency)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>القيمة الدفترية الحالية ({settings.baseCurrency}):</span>
                                <span className="font-mono">{formatCurrency(calculation.bookBalanceBase, settings.baseCurrency)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>القيمة الجديدة ({settings.baseCurrency}):</span>
                                <span className="font-mono font-bold">{formatCurrency(calculation.targetBaseBalance, settings.baseCurrency)}</span>
                            </div>
                            
                            <div className="border-t border-dashed border-gray-600 my-2"></div>
                            
                            <div className="flex justify-between items-center">
                                <span className="font-bold">الفرق (أرباح/خسائر غير محققة)</span>
                                <div className={`flex items-center gap-2 font-mono font-black text-lg ${calculation.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {calculation.diff >= 0 ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                                    {formatCurrency(Math.abs(calculation.diff), settings.baseCurrency)}
                                </div>
                            </div>
                        </div>
                    )}

                    {calculation && (
                        <div>
                             <Label>حساب ترحيل الفروقات (Gain/Loss Account)</Label>
                             <Select value={gainLossAccountId} onChange={e => setGainLossAccountId(e.target.value)} className={formControlClasses}>
                                <option value="">-- اختر حساب --</option>
                                {plAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">عادةً حساب "أرباح وخسائر فروقات عملة".</p>
                        </div>
                    )}
                </div>

                <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg">{t.cancel}</button>
                    <HoloButton variant="primary" icon={Save} onClick={handleSave} disabled={!calculation || !gainLossAccountId || isSaving}>
                        {isSaving ? 'جاري الترحيل...' : 'ترحيل القيد'}
                    </HoloButton>
                </div>
            </div>
        </div>
    );
};

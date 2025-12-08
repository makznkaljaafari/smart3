
import React, { useState, useMemo, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { FileText, ArrowRight, TrendingUp, TrendingDown, Scale, Calendar, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { taxService } from '../../../services/accounting/taxService';
import { journalService } from '../../../services/accounting/journalService';
import { LoadingState } from '../../../components/common/LoadingState';
import { TaxSummary } from '../types';

export const TaxReturnView: React.FC = () => {
    const { theme, lang, settings, accounts, addToast } = useZustandStore();
    const t = translations[lang];
    const isDark = theme === 'dark';
    
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [summary, setSummary] = useState<TaxSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Set defaults to current quarter
    useEffect(() => {
        const now = new Date();
        const quarter = Math.floor((now.getMonth() + 3) / 3);
        const start = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        const end = new Date(now.getFullYear(), quarter * 3, 0);
        setDateFrom(start.toISOString().split('T')[0]);
        setDateTo(end.toISOString().split('T')[0]);
    }, []);

    const handleCalculate = async () => {
        if(!dateFrom || !dateTo) return;
        setIsLoading(true);
        const { data } = await taxService.getTaxSummary(dateFrom, dateTo);
        setSummary(data);
        setIsLoading(false);
    };

    const handleFileReturn = async () => {
        const taxAccount = settings.accounting.taxPayableAccountId;
        const bankAccount = settings.accounting.bankAccountId; // Using bank account from settings for payment
        
        if (!taxAccount) {
            addToast({ message: 'الرجاء تحديد حساب الضريبة في الإعدادات أولاً.', type: 'error' });
            return;
        }
        if (!bankAccount && (summary?.netTaxPayable || 0) !== 0) {
             addToast({ message: 'الرجاء تحديد حساب البنك في الإعدادات لدفع/استلام الضريبة.', type: 'error' });
             return;
        }

        if(!summary) return;
        if(!confirm('هل أنت متأكد من تقديم الإقرار؟ سيتم إنشاء قيد محاسبي لتسوية حسابات الضريبة.')) return;

        setIsSubmitting(true);
        try {
            await journalService.createTaxReturnEntry({
                taxPayableAccountId: taxAccount,
                bankAccountId: bankAccount!,
                outputTax: summary.totalOutputTax,
                inputTax: summary.totalInputTax,
                netPayable: summary.netTaxPayable,
                period: `${dateFrom} to ${dateTo}`
            });
            addToast({ message: 'تم تقديم الإقرار وترحيل القيود بنجاح.', type: 'success' });
            setSummary(null); // Reset
        } catch (e: any) {
            addToast({ message: e.message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const inputClass = `p-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-300'}`;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Filters */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="text-purple-400"/> الإقرار الضريبي (VAT)</h3>
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm mb-1 opacity-70">من تاريخ</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 opacity-70">إلى تاريخ</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputClass} />
                    </div>
                    <HoloButton variant="primary" onClick={handleCalculate} disabled={isLoading}>
                        حساب الضريبة
                    </HoloButton>
                </div>
            </div>

            {isLoading ? <LoadingState /> : summary ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Output Tax Card */}
                    <div className={`p-6 rounded-2xl border relative overflow-hidden ${isDark ? 'bg-gray-800 border-green-500/20' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-full bg-green-500/10 text-green-500"><TrendingUp /></div>
                            <div>
                                <h4 className="font-bold">ضريبة المخرجات</h4>
                                <p className="text-xs opacity-60">على المبيعات</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>إجمالي المبيعات:</span>
                                <span className="font-mono">{formatCurrency(summary.totalSalesTaxable, settings.baseCurrency)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-green-500 pt-2 border-t border-dashed border-gray-600">
                                <span>الضريبة المستحقة:</span>
                                <span className="font-mono">{formatCurrency(summary.totalOutputTax, settings.baseCurrency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Input Tax Card */}
                    <div className={`p-6 rounded-2xl border relative overflow-hidden ${isDark ? 'bg-gray-800 border-orange-500/20' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-full bg-orange-500/10 text-orange-500"><TrendingDown /></div>
                            <div>
                                <h4 className="font-bold">ضريبة المدخلات</h4>
                                <p className="text-xs opacity-60">على المشتريات</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>إجمالي المشتريات:</span>
                                <span className="font-mono">{formatCurrency(summary.totalPurchasesTaxable, settings.baseCurrency)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-orange-500 pt-2 border-t border-dashed border-gray-600">
                                <span>الضريبة المستردة:</span>
                                <span className="font-mono">{formatCurrency(summary.totalInputTax, settings.baseCurrency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Payable Card */}
                    <div className={`p-6 rounded-2xl border relative overflow-hidden flex flex-col justify-between ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-cyan-500/30' : 'bg-white border-slate-200 shadow-lg'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-500"><Scale /></div>
                            <div>
                                <h4 className="font-bold">صافي الضريبة</h4>
                                <p className="text-xs opacity-60">المبلغ المستحق للدفع/الاسترداد</p>
                            </div>
                        </div>
                        
                        <div className="text-center py-4">
                            <span className={`text-4xl font-black font-mono ${summary.netTaxPayable > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {formatCurrency(Math.abs(summary.netTaxPayable), settings.baseCurrency)}
                            </span>
                            <p className="text-sm mt-2 font-bold">
                                {summary.netTaxPayable > 0 ? 'مستحق للدفع للهيئة' : 'رصيد مسترد (دائن)'}
                            </p>
                        </div>

                        <HoloButton variant={summary.netTaxPayable > 0 ? 'danger' : 'success'} onClick={handleFileReturn} disabled={isSubmitting} className="w-full justify-center">
                            <CheckCircle size={18} className="mr-2"/> تقديم الإقرار وتسوية القيد
                        </HoloButton>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 opacity-50 border-2 border-dashed border-gray-700 rounded-xl">
                    <Calendar size={48} className="mx-auto mb-4"/>
                    <p>اختر الفترة واضغط على "حساب الضريبة" لعرض التقرير.</p>
                </div>
            )}
        </div>
    );
};

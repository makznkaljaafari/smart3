
import React, { useState, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { FiscalYear } from '../types';
import { fiscalService } from '../../../services/accounting/fiscalService';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Plus, Lock, CheckCircle, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { CloseYearModal } from './CloseYearModal';
import { LoadingState } from '../../../components/common/LoadingState';

export const FiscalYearsView: React.FC = () => {
    const { theme, lang, settings } = useZustandStore();
    const t = translations[lang];
    const isDark = theme === 'dark';

    const [years, setYears] = useState<FiscalYear[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);

    useEffect(() => {
        const loadYears = async () => {
            setIsLoading(true);
            const { data } = await fiscalService.getFiscalYears();
            setYears(data);
            setIsLoading(false);
        };
        loadYears();
    }, []);

    const handleCloseYearClick = (year: FiscalYear) => {
        setSelectedYear(year);
        setShowCloseModal(true);
    };
    
    const handleLockYear = async (year: FiscalYear) => {
        if (confirm('هل أنت متأكد من قفل هذه الفترة؟ لن يمكن إضافة أو تعديل أي قيود في هذا التاريخ.')) {
            await fiscalService.lockPeriod(year.id);
            setYears(prev => prev.map(y => y.id === year.id ? { ...y, status: 'locked' } : y));
        }
    };

    if (isLoading) return <LoadingState />;

    const getStatusBadge = (status: FiscalYear['status']) => {
        switch(status) {
            case 'open': return <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> مفتوحة</span>;
            case 'locked': return <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold border border-orange-500/20 flex items-center gap-1"><Lock size={10}/> مقفلة مؤقتاً</span>;
            case 'closed': return <span className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-500 text-xs font-bold border border-gray-500/20 flex items-center gap-1"><CheckCircle size={10}/> مغلقة نهائياً</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>السنوات المالية</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>إدارة الفترات المحاسبية وإقفال السنوات.</p>
                </div>
                <HoloButton variant="primary" icon={Plus}>سنة مالية جديدة</HoloButton>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {years.map(year => {
                    const isCurrent = new Date() >= new Date(year.startDate) && new Date() <= new Date(year.endDate);
                    const progress = Math.min(100, Math.max(0, (new Date().getTime() - new Date(year.startDate).getTime()) / (new Date(year.endDate).getTime() - new Date(year.startDate).getTime()) * 100));

                    return (
                        <div key={year.id} className={`p-5 rounded-xl border transition-all ${isDark ? 'bg-gray-900/40 border-gray-700 hover:border-cyan-500/30' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{year.name}</h4>
                                        {getStatusBadge(year.status)}
                                        {isCurrent && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">السنة الحالية</span>}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><Calendar size={14}/> {year.startDate}</span>
                                        <ArrowRight size={14} />
                                        <span className="flex items-center gap-1"><Calendar size={14}/> {year.endDate}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto">
                                    {year.status === 'open' && (
                                        <>
                                            <HoloButton variant="secondary" icon={Lock} onClick={() => handleLockYear(year)} className="!py-1.5 !px-3 !text-xs">قفل الفترة</HoloButton>
                                            <HoloButton variant="danger" icon={CheckCircle} onClick={() => handleCloseYearClick(year)} className="!py-1.5 !px-3 !text-xs">إقفال السنة</HoloButton>
                                        </>
                                    )}
                                    {year.status === 'closed' && (
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">صافي الدخل المرحّل</p>
                                            <p className="font-mono font-bold text-green-500">{formatCurrency(year.netIncome || 0, settings.baseCurrency)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timeline Progress */}
                            {year.status === 'open' && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>التقدم الزمني</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Guidance Box */}
            <div className={`p-4 rounded-lg border flex gap-3 ${isDark ? 'bg-blue-900/10 border-blue-500/20 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                <AlertTriangle className="shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-bold mb-1">لماذا الإقفال السنوي مهم؟</p>
                    <p className="opacity-80">عملية إقفال السنة تقوم بنقل صافي الربح أو الخسارة من حسابات قائمة الدخل (الإيرادات والمصروفات) إلى حساب الأرباح المبقاة في الميزانية العمومية، مما يصفر حسابات الدخل استعداداً للسنة الجديدة.</p>
                </div>
            </div>

            {showCloseModal && selectedYear && (
                <CloseYearModal 
                    year={selectedYear} 
                    onClose={() => setShowCloseModal(false)} 
                    onSuccess={() => {
                        setYears(prev => prev.map(y => y.id === selectedYear.id ? { ...y, status: 'closed' } : y));
                        setShowCloseModal(false);
                    }}
                />
            )}
        </div>
    );
};

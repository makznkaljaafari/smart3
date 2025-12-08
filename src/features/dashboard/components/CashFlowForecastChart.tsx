
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { AlertTriangle, TrendingUp, Sparkles, Brain } from 'lucide-react';
import { formatCurrency } from '../../expenses/lib/utils';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useQuery } from '@tanstack/react-query';
import { expenseService } from '../../../services/expenseService';
import { incomeService } from '../../../services/incomeService';

export interface ForecastData {
    month: string;
    amount: number;
}

export interface ForecastResult {
    incomeForecast: ForecastData[];
    expenseForecast: ForecastData[];
    analysis: string;
}

export const getMonthShortName = (date: Date, lang: 'ar' | 'en') => {
    return date.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });
}

interface CashFlowForecastChartProps {
    forecastResult: ForecastResult | null;
    isLoading: boolean;
    error: string | null;
    onGenerate?: () => void;
}

export const CashFlowForecastChart: React.FC<CashFlowForecastChartProps> = ({ forecastResult, isLoading, error, onGenerate }) => {
    const { lang, settings, theme, currentCompany } = useZustandStore(state => ({
        lang: state.lang,
        settings: state.settings,
        theme: state.theme,
        currentCompany: state.currentCompany
    }));
    const t = translations[lang];
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(700);
    
    // Date Range for Stats (Current Year)
    const currentYearStart = useMemo(() => {
        const d = new Date();
        d.setMonth(0, 1); // Jan 1st of current year
        return d.toISOString().split('T')[0];
    }, []);

     useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setWidth(containerRef.current.offsetWidth);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { data: expenseStats } = useQuery({
        queryKey: ['expenseStats', currentCompany?.id, currentYearStart],
        queryFn: () => expenseService.getExpenseStats(currentYearStart),
        enabled: !!currentCompany?.id,
    });

    const { data: incomeStats } = useQuery({
        queryKey: ['incomeStats', currentCompany?.id, currentYearStart],
        queryFn: () => incomeService.getIncomeStats(currentYearStart),
        enabled: !!currentCompany?.id,
    });

    const historicalData = useMemo(() => {
        const data: { month: string; income: number; expenses: number }[] = [];
        const now = new Date();
        const income = incomeStats?.data || [];
        const expenses = expenseStats?.data || [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();
            
            const incomeTotal = income
                .filter((item: any) => { const d = new Date(item.date); return d.getMonth() === month && d.getFullYear() === year; })
                .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

            const expenseTotal = expenses
                .filter((item: any) => { const d = new Date(item.date); return d.getMonth() === month && d.getFullYear() === year; })
                .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
            
            data.push({ month: getMonthShortName(date, lang), income: incomeTotal, expenses: expenseTotal });
        }
        return data;
    }, [incomeStats, expenseStats, lang]);

    const allData = useMemo(() => {
        const forecastIncome = forecastResult?.incomeForecast || [];
        const forecastExpenses = forecastResult?.expenseForecast || [];
        const forecastMonths = forecastIncome.map(d => d.month);
        
        const combinedForecast = forecastMonths.map((month, i) => ({
            month,
            income: forecastIncome[i]?.amount || 0,
            expenses: forecastExpenses[i]?.amount || 0,
        }));

        return [...historicalData, ...combinedForecast];
    }, [historicalData, forecastResult]);

    const maxValue = Math.max(...allData.flatMap(d => [d.income, d.expenses]), 0) * 1.2 || 10000;
    const chartHeight = 200;

    const pointsToPath = (points: [number, number][]) => points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p[0]},${p[1]}`).join(' ');
    
    const getPoints = (dataKey: 'income' | 'expenses') => allData.map((d, i) => [ (i / (allData.length - 1)) * width, chartHeight - (d[dataKey] / maxValue) * chartHeight ] as [number, number]);
    const getNetPoints = () => allData.map((d, i) => [ (i / (allData.length - 1)) * width, chartHeight - ((d.income - d.expenses) / maxValue) * chartHeight ] as [number, number]);

    const historicalPoints = (dataKey: 'income'|'expenses') => getPoints(dataKey).slice(0, historicalData.length);
    const forecastPoints = (dataKey: 'income'|'expenses') => [ historicalPoints(dataKey)[historicalPoints(dataKey).length - 1], ...getPoints(dataKey).slice(historicalData.length) ];
    
    if (isLoading) {
        return <div className={`h-64 rounded-md animate-pulse w-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-200'}`}></div>;
    }
    if (error) {
        return <div className="flex items-center gap-2 text-red-400"><AlertTriangle size={18} /> <span>{error}</span></div>;
    }

    if (!forecastResult) {
        return (
            <div className="text-center py-8">
                <p className="mb-4">{lang === 'ar' ? 'احصل على توقعات للتدفق النقدي للأشهر الثلاثة القادمة بناءً على بياناتك التاريخية.' : 'Get a cash flow forecast for the next 3 months based on your historical data.'}</p>
                <HoloButton icon={Brain} onClick={onGenerate}>
                    {lang === 'ar' ? 'إنشاء التوقعات' : 'Generate Forecast'}
                </HoloButton>
            </div>
        )
    }
    
    return (
        <div className="space-y-4" ref={containerRef}>
             <div className="w-full overflow-x-auto">
                <svg width={width} height={chartHeight + 30} viewBox={`0 0 ${width} ${chartHeight + 30}`}>
                    <defs>
                        <linearGradient id="net-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent-500)" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="var(--accent-500)" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                    {[0, 0.5, 1].map(v => <line key={v} x1="0" y1={chartHeight * v} x2={width} y2={chartHeight * v} stroke={theme === 'dark' ? '#374151' : '#e2e8f0'} strokeWidth="1" />)}
                    
                    {/* Net Cash Flow Area */}
                    <path d={`${pointsToPath(getNetPoints())} L ${width},${chartHeight} L 0,${chartHeight} Z`} fill="url(#net-fill)" />

                    <path d={pointsToPath(historicalPoints('income'))} stroke="#10b981" strokeWidth="2.5" fill="none" />
                    <path d={pointsToPath(forecastPoints('income'))} stroke="#10b981" strokeWidth="2.5" fill="none" strokeDasharray="4,4" />
                    
                    <path d={pointsToPath(historicalPoints('expenses'))} stroke="#f97316" strokeWidth="2.5" fill="none" />
                    <path d={pointsToPath(forecastPoints('expenses'))} stroke="#f97316" strokeWidth="2.5" fill="none" strokeDasharray="4,4" />

                    <path d={pointsToPath(getNetPoints())} stroke="var(--accent-400)" strokeWidth="3" fill="none" />

                    {allData.map((d, i) => <text key={i} x={(i / (allData.length - 1)) * width} y={chartHeight + 20} textAnchor="middle" fontSize="12" fill={theme === 'dark' ? '#9ca3af' : '#475569'}>{d.month}</text>)}
                </svg>
            </div>
             <div className="flex justify-center flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-4 h-1 rounded-full bg-green-500"/> <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}>{t.revenueForecast}</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-1 rounded-full bg-orange-500"/> <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}>{t.expensesForecast}</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-1 rounded-full bg-[var(--accent-400)]"/> <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}>{t.netCashFlow}</span></div>
            </div>
            {forecastResult?.analysis && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${theme === 'dark' ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`}>
                    <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h5 className={`font-semibold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-800'}`}>{t.analysis}</h5>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>{forecastResult.analysis}</p>
                    </div>
                </div>
            )}
        </div>
    );
};


import React, { useState, useEffect, useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { incomeService } from '../../../services/incomeService';
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';

interface ForecastData {
    month: string;
    amount: number;
}

interface ForecastResult {
    forecast: ForecastData[];
    analysis: string;
}

const getMonthShortName = (date: Date, lang: 'ar' | 'en') => {
    return date.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });
}

export const RevenueForecastChart: React.FC = () => {
    const { lang, settings, theme, currentCompany } = useZustandStore(state => ({
        lang: state.lang,
        settings: state.settings,
        theme: state.theme,
        currentCompany: state.currentCompany,
    }));
    const { baseCurrency } = settings;
    const t = translations[lang];

    const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(true);
    const [aiError, setAiError] = useState<string | null>(null);

    // Limit to last 12 months
    const twelveMonthsAgo = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 12);
        return d;
    }, []);

    // Fetch historical data from server
    const { data: incomeReportData } = useQuery({
        queryKey: ['incomeReport', currentCompany?.id, twelveMonthsAgo.toISOString()],
        queryFn: () => incomeService.getIncomeReportData(twelveMonthsAgo),
        enabled: !!currentCompany?.id,
    });

    const incomeList = incomeReportData?.data || [];

    // Prepare historical chart data
    const historicalChartData = useMemo(() => {
        const data: { month: string; amount: number }[] = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();
            
            const amount = incomeList
                .filter((item: any) => {
                    const itemDate = new Date(item.date);
                    return itemDate.getMonth() === month && itemDate.getFullYear() === year;
                })
                .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

            data.push({
                month: getMonthShortName(date, lang),
                amount
            });
        }
        return data;
    }, [incomeList, lang]);

    useEffect(() => {
        const generateForecast = async () => {
            if (incomeList.length === 0) {
                setIsAiLoading(false);
                return;
            }
            
            setIsAiLoading(true);
            setAiError(null);

            try {
                const prompt = `You are a financial forecasting expert. Based on the following historical monthly income data for a business, please provide a forecast for the next 3 months.

                The response MUST be a valid JSON object with the following structure:
                {
                  "forecast": [
                    { "month": "MonthName1", "amount": 12345 },
                    { "month": "MonthName2", "amount": 12345 },
                    { "month": "MonthName3", "amount": 12345 }
                  ],
                  "analysis": "A brief, one-sentence analysis of the trend in ${lang === 'ar' ? 'Arabic' : 'English'}."
                }
                
                Do not include any other text or markdown formatting in your response. The month names in the forecast should be the short names for the next 3 months following the last historical month, in ${lang === 'ar' ? 'Arabic' : 'English'}.
                
                Historical Data (in ${baseCurrency}):
                ${JSON.stringify(historicalChartData)}
                `;

                const responseText = await callAIProxy(prompt, {
                    responseMimeType: "application/json",
                });

                if (responseText) {
                    const jsonStr = cleanJsonString(responseText);
                    const result = JSON.parse(jsonStr) as ForecastResult;
                    setForecastResult(result);
                } else {
                    setAiError(t.forecastError || 'Failed to generate forecast.');
                }

            } catch (e: any) {
                console.error("Error generating forecast:", e);
                setAiError(t.forecastError);
            } finally {
                setIsAiLoading(false);
            }
        };

        generateForecast();
    }, [historicalChartData, lang, baseCurrency, t]);


    const allData = [...historicalChartData, ...(forecastResult?.forecast || [])];
    const maxValue = Math.max(...allData.map(d => d.amount), 0) * 1.2;

    const chartHeight = 200;
    const chartWidth = 600; // Fixed width for simplicity

    const pointsToPath = (points: [number, number][]) => {
        return points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p[0]},${p[1]}`).join(' ');
    };

    const historicalPoints: [number, number][] = historicalChartData.map((d, i) => [
        (i / (allData.length - 1)) * chartWidth,
        chartHeight - (d.amount / maxValue) * chartHeight
    ]);

    const forecastPoints: [number, number][] = [
        historicalPoints[historicalPoints.length - 1], // Start from last historical point
        ...(forecastResult?.forecast || []).map((d, i) => [
            ((historicalChartData.length - 1 + i + 1) / (allData.length - 1)) * chartWidth,
            chartHeight - (d.amount / maxValue) * chartHeight
        ] as [number, number])
    ];

    if (isAiLoading && incomeList.length > 0) {
        return (
            <div className="space-y-4">
                <div className={`h-6 rounded-md animate-pulse w-3/4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-200'}`}></div>
                <div className={`h-52 rounded-md animate-pulse w-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-200'}`}></div>
                <div className={`h-4 rounded-md animate-pulse w-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-200'}`}></div>
            </div>
        );
    }

    if (aiError) {
        return (
            <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle size={18} /> <span>{aiError}</span>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <h4 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.revenueForecast}</h4>
             <div className="w-full overflow-x-auto">
                <svg width="100%" height={chartHeight + 30} viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}>
                    {/* Grid lines */}
                    {[0, 0.5, 1].map(v => (
                        <line key={v} x1="0" y1={chartHeight * v} x2={chartWidth} y2={chartHeight * v} stroke={theme === 'dark' ? '#374151' : '#e2e8f0'} strokeWidth="1" />
                    ))}
                    
                    {/* Historical Path */}
                    {historicalPoints.length > 0 && (
                         <path d={pointsToPath(historicalPoints)} stroke="#06b6d4" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    
                    {/* Forecast Path */}
                    {forecastPoints.length > 1 && (
                        <path d={pointsToPath(forecastPoints)} stroke="#a855f7" strokeWidth="3" fill="none" strokeDasharray="5,5" strokeLinecap="round" strokeLinejoin="round" />
                    )}

                     {/* X-axis labels */}
                    {allData.map((d, i) => (
                        <text key={i} x={(i / (allData.length - 1)) * chartWidth} y={chartHeight + 20} textAnchor="middle" fontSize="12" fill={theme === 'dark' ? '#9ca3af' : '#475569'}>
                            {d.month}
                        </text>
                    ))}
                </svg>
            </div>
             <div className="flex justify-center items-center gap-6 text-sm">
                <div className="flex items-center gap-2"><span className="w-4 h-1 rounded-full bg-cyan-500"/> <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}>{t.historical}</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-1 border-t-2 border-dashed border-purple-500"/> <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}>{t.forecasted}</span></div>
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

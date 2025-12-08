import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { formatCurrency } from '../../expenses/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { expenseService } from '../../../services/expenseService';
import { incomeService } from '../../../services/incomeService';

interface ChartData {
  month: string;
  income: number;
  expenses: number;
}

const getMonthShortName = (date: Date, lang: 'ar' | 'en') => {
    return date.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });
}

export const IncomeExpenseChart: React.FC = () => {
    const { theme, lang, settings, currentCompany } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
        currentCompany: state.currentCompany
    }));
    const t = translations[lang];
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(700);

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    // Limit data fetching to last 6 months to improve performance
    const sixMonthsAgo = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        return d.toISOString().split('T')[0];
    }, []);

    // Fetch Data
    const { data: expenseStats } = useQuery({
        queryKey: ['expenseStats', currentCompany?.id, sixMonthsAgo],
        queryFn: () => expenseService.getExpenseStats(sixMonthsAgo),
        enabled: !!currentCompany?.id,
    });

    const { data: incomeStats } = useQuery({
        queryKey: ['incomeStats', currentCompany?.id, sixMonthsAgo],
        queryFn: () => incomeService.getIncomeStats(sixMonthsAgo),
        enabled: !!currentCompany?.id,
    });

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setWidth(containerRef.current.offsetWidth);
            }
        };
        handleResize(); // Initial measurement
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const chartData: ChartData[] = useMemo(() => {
        const data: ChartData[] = [];
        const now = new Date();
        const income = incomeStats?.data || [];
        const expenses = expenseStats?.data || [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();
            
            const monthlyIncome = income
                .filter((item: any) => { const itemDate = new Date(item.date); return itemDate.getMonth() === month && itemDate.getFullYear() === year; })
                .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
            
            const monthlyExpenses = expenses
                .filter((item: any) => { const itemDate = new Date(item.date); return itemDate.getMonth() === month && itemDate.getFullYear() === year; })
                .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

            data.push({
                month: getMonthShortName(date, lang),
                income: monthlyIncome,
                expenses: monthlyExpenses,
            });
        }
        return data;
    }, [incomeStats, expenseStats, lang]);

    const maxValue = useMemo(() => {
        const maxVal = Math.max(...chartData.flatMap(d => [d.income, d.expenses]));
        return maxVal === 0 ? 1000 : Math.ceil(maxVal / 1000) * 1000 * 1.1; // Round up and add 10% padding
    }, [chartData]);
    
    const chartHeight = 250;
    const yPadding = 20;
    const xPadding = 40;

    const getCoords = (data: ChartData[], key: 'income' | 'expenses', width: number) => {
        return data.map((d, i) => ({
            x: xPadding + (i / (data.length - 1)) * (width - xPadding * 2),
            y: chartHeight - yPadding - (d[key] / maxValue) * (chartHeight - yPadding * 2)
        }));
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const svgRect = svgRef.current.getBoundingClientRect();
        const svgWidth = svgRect.width;
        const x = e.clientX - svgRect.left;

        const index = Math.round(((x - xPadding) / (svgWidth - xPadding * 2)) * (chartData.length - 1));

        if (index >= 0 && index < chartData.length) {
            setHoveredIndex(index);
            setTooltipPos({ x: e.clientX, y: e.clientY });
        } else {
            setHoveredIndex(null);
        }
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
    };

    const SvgContent = ({ width }: { width: number }) => {
        const incomePoints = getCoords(chartData, 'income', width);
        const expensePoints = getCoords(chartData, 'expenses', width);

        const createPath = (points: {x:number, y:number}[]) => points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`).join(' ');
        
        const createAreaPath = (points: {x:number, y:number}[]) => {
            if (points.length === 0) return '';
            const path = createPath(points);
            return `${path} L ${points[points.length-1].x},${chartHeight - yPadding} L ${points[0].x},${chartHeight - yPadding} Z`;
        };
        
        const yAxisLabels = [0, maxValue / 2, maxValue];

        return (
            <svg ref={svgRef} width="100%" height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <defs>
                    <linearGradient id="income-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="expense-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
                    </linearGradient>
                </defs>

                {yAxisLabels.map(label => {
                    const y = chartHeight - yPadding - (label / maxValue) * (chartHeight - yPadding * 2);
                    return (
                        <g key={label}>
                            <line x1={xPadding} y1={y} x2={width - xPadding} y2={y} stroke={theme === 'dark' ? '#374151' : '#e2e8f0'} strokeWidth="1" />
                            <text x={xPadding - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{`${Math.round(label / 1000)}k`}</text>
                        </g>
                    )
                })}

                {chartData.map((d, i) => (
                    <text key={i} x={incomePoints[i].x} y={chartHeight - yPadding + 15} textAnchor="middle" fontSize="10" fill="#9ca3af">{d.month}</text>
                ))}

                <path d={createAreaPath(expensePoints)} fill="url(#expense-gradient)" />
                <path d={createAreaPath(incomePoints)} fill="url(#income-gradient)" />
                <path d={createPath(expensePoints)} stroke="#f97316" strokeWidth="2.5" fill="none" />
                <path d={createPath(incomePoints)} stroke="#22c55e" strokeWidth="2.5" fill="none" />
                
                {hoveredIndex !== null && (
                    <g>
                        <line x1={incomePoints[hoveredIndex].x} y1={0} x2={incomePoints[hoveredIndex].x} y2={chartHeight - yPadding} stroke={theme === 'dark' ? '#475569' : '#cbd5e1'} strokeWidth="1" strokeDasharray="3,3" />
                        <circle cx={incomePoints[hoveredIndex].x} cy={incomePoints[hoveredIndex].y} r="4" fill="#22c55e" stroke="rgb(var(--bg-secondary-rgb))" strokeWidth="2" />
                        <circle cx={expensePoints[hoveredIndex].x} cy={expensePoints[hoveredIndex].y} r="4" fill="#f97316" stroke="rgb(var(--bg-secondary-rgb))" strokeWidth="2" />
                    </g>
                )}
            </svg>
        );
    };

    const axisLabelStyle = theme === 'dark' ? 'text-gray-400' : 'text-slate-500';

    return (
        <div className="w-full relative">
            {hoveredIndex !== null && (
                <div 
                    className={`fixed p-2 rounded-lg shadow-lg z-20 pointer-events-none transition-opacity duration-200 ${theme === 'dark' ? 'text-white bg-gray-900/80 border border-gray-700' : 'text-slate-800 bg-white/80 border border-slate-200'}`}
                    style={{ left: `${tooltipPos.x + 15}px`, top: `${tooltipPos.y + 15}px` }}
                >
                    <div className="text-sm">
                        <p className="font-bold mb-1">{chartData[hoveredIndex].month}</p>
                        <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"/>{t.income}: {formatCurrency(chartData[hoveredIndex].income, settings.baseCurrency)}</p>
                        <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"/>{t.expenses}: {formatCurrency(chartData[hoveredIndex].expenses, settings.baseCurrency)}</p>
                    </div>
                </div>
            )}
            
            <div ref={containerRef} className="w-full h-64">
                {width > 0 && <SvgContent width={width} />}
            </div>

            <div className="flex justify-center items-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"/> <span className={axisLabelStyle}>{t.income}</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"/> <span className={axisLabelStyle}>{t.expenses}</span></div>
            </div>
        </div>
    );
};
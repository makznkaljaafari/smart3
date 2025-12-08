import React from 'react';
import { BarChart } from './BarChart';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { AppTheme } from '../../../types';

interface ProfitAndLossChartProps {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
}

export const ProfitAndLossChart: React.FC<ProfitAndLossChartProps> = ({ totalIncome, totalExpenses, netProfit }) => {
    const { theme, lang } = useZustandStore();
    const t = translations[lang];

    const chartData = [
        { label: t.totalIncome, value: totalIncome, color: '#10b981' },
        { label: t.totalExpenses, value: totalExpenses, color: '#f97316' },
        { label: netProfit >= 0 ? t.netProfit : t.netLoss, value: Math.abs(netProfit), color: netProfit >= 0 ? '#06b6d4' : '#ef4444' }
    ];

    return <BarChart data={chartData} theme={theme as AppTheme} />;
};

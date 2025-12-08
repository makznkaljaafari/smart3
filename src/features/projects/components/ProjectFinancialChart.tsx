import React, { useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Income, Expense } from '../../../types';
import { BarChart } from '../../reports/components/BarChart';

interface ProjectFinancialChartProps {
    income: Income[];
    expenses: Expense[];
}

const getMonthShortName = (date: Date, lang: 'ar' | 'en') => {
    return date.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });
}

export const ProjectFinancialChart: React.FC<ProjectFinancialChartProps> = ({ income, expenses }) => {
    const { theme, lang } = useZustandStore();
    const t = translations[lang];

    const monthlyData = useMemo(() => {
        const data: { [key: string]: { income: number, expenses: number } } = {};
        const allTransactions = [...income, ...expenses];

        if (allTransactions.length === 0) return [];
        
        allTransactions.forEach(tx => {
            const date = new Date(tx.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!data[monthKey]) {
                data[monthKey] = { income: 0, expenses: 0 };
            }
        });

        income.forEach(i => {
            const date = new Date(i.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (data[monthKey]) data[monthKey].income += i.amount;
        });

        expenses.forEach(e => {
            const date = new Date(e.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
             if (data[monthKey]) data[monthKey].expenses += e.amount;
        });
        
        return Object.entries(data)
            .sort(([keyA], [keyB]) => new Date(keyA).getTime() - new Date(keyB).getTime())
            .slice(-12) // Get last 12 months
            .map(([key, value]) => ({
                month: getMonthShortName(new Date(key), lang),
                ...value,
                net: value.income - value.expenses,
            }));

    }, [income, expenses, lang]);

    if (monthlyData.length === 0) {
        return <p className="text-center text-gray-500 py-8">لا توجد بيانات مالية لعرض الرسم البياني.</p>;
    }
    
    // This is a simplified chart and doesn't show grouped bars yet.
    // It will show net profit per month.
    const chartData = monthlyData.map(d => ({
        label: d.month,
        value: d.net,
        color: d.net >= 0 ? '#10b981' : '#ef4444'
    }));


    return (
        <div>
            <BarChart data={chartData} theme={theme} />
            <p className="text-xs text-center text-gray-400 mt-2">
                يعرض الرسم البياني صافي الربح الشهري (الإيرادات - المصروفات)
            </p>
        </div>
    );
};

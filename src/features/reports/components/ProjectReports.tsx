
import React, { useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { ReportContainer } from './ReportContainer';
import { formatCurrency } from '../../expenses/lib/utils';
import { BarChart } from './BarChart';
import { SectionBox } from '../../../components/ui/SectionBox';
import { useQuery } from '@tanstack/react-query';
import { expenseService } from '../../../services/expenseService';
import { incomeService } from '../../../services/incomeService';
import { Loader, ServerCrash } from 'lucide-react';

const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f97316', '#ec4899'];

export const ProjectReports: React.FC = () => {
    const { projects, theme, lang, settings, currentCompany } = useZustandStore(state => ({
        projects: state.projects,
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
        currentCompany: state.currentCompany
    }));
    const t = translations[lang];
    const { baseCurrency } = settings;

    const { data: expenseStats, isLoading: expensesLoading } = useQuery({
        queryKey: ['expenseStats', currentCompany?.id],
        queryFn: () => expenseService.getExpenseStats(),
        enabled: !!currentCompany?.id,
    });

    const { data: incomeStats, isLoading: incomeLoading } = useQuery({
        queryKey: ['incomeStats', currentCompany?.id],
        queryFn: () => incomeService.getIncomeStats(),
        enabled: !!currentCompany?.id,
    });
    
    const expenses = expenseStats?.data || [];
    const income = incomeStats?.data || [];

    const projectsWithFinancials = useMemo(() => {
        return projects.map(project => {
            const projectExpenses = expenses.filter((e: any) => e.projectId === project.id).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
            const projectIncome = income.filter((i: any) => i.projectId === project.id).reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
            const netProfit = projectIncome - projectExpenses;
            const profitMargin = projectIncome > 0 ? (netProfit / projectIncome) * 100 : 0;
            return {
                ...project,
                totalIncome: projectIncome,
                totalExpenses: projectExpenses,
                netProfit,
                profitMargin,
            };
        }).sort((a, b) => b.netProfit - a.netProfit);
    }, [projects, expenses, income]);

    const chartData = useMemo(() => {
        return projectsWithFinancials
            .slice(0, 5) // Top 5
            .map((p, index) => ({
                label: p.name,
                value: p.netProfit,
                color: CHART_COLORS[index % CHART_COLORS.length],
            }));
    }, [projectsWithFinancials]);

    const tableHeaderClasses = `p-3 text-sm font-semibold sticky top-0 z-10 ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`;
    const cellClasses = `p-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'}`;
    
    if (expensesLoading || incomeLoading) {
        return <div className="flex justify-center p-12"><Loader className="animate-spin text-cyan-400" /></div>;
    }

    return (
        <ReportContainer title={t.projectReports}>
            <div className="space-y-8">
                <SectionBox title={t.topProfitableProjects} theme={theme}>
                    <BarChart data={chartData} theme={theme} />
                </SectionBox>
                <SectionBox title={t.projectComparison} theme={theme}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm responsive-table">
                            <thead>
                                <tr>
                                    <th className={`${tableHeaderClasses} text-right`}>{t.project}</th>
                                    <th className={`${tableHeaderClasses} text-right`}>{t.budget}</th>
                                    <th className={`${tableHeaderClasses} text-right`}>{t.totalIncome}</th>
                                    <th className={`${tableHeaderClasses} text-right`}>{t.totalExpenses}</th>
                                    <th className={`${tableHeaderClasses} text-right`}>{t.netProfit}</th>
                                    <th className={`${tableHeaderClasses} text-right`}>{t.profitMargin}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectsWithFinancials.map(p => (
                                    <tr key={p.id}>
                                        <td className={`${cellClasses} font-semibold`} data-label={t.project}>{p.name}</td>
                                        <td className={`${cellClasses} font-mono`} data-label={t.budget}>{formatCurrency(p.budget || 0, baseCurrency)}</td>
                                        <td className={`${cellClasses} font-mono text-green-400`} data-label={t.totalIncome}>{formatCurrency(p.totalIncome, baseCurrency)}</td>
                                        <td className={`${cellClasses} font-mono text-orange-400`} data-label={t.totalExpenses}>{formatCurrency(p.totalExpenses, baseCurrency)}</td>
                                        <td className={`${cellClasses} font-mono font-bold ${p.netProfit >= 0 ? 'text-cyan-400' : 'text-red-400'}`} data-label={t.netProfit}>{formatCurrency(p.netProfit, baseCurrency)}</td>
                                        <td className={`${cellClasses} font-mono font-bold ${p.profitMargin >= 0 ? 'text-cyan-400' : 'text-red-400'}`} data-label={t.profitMargin}>{p.profitMargin.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </SectionBox>
            </div>
        </ReportContainer>
    );
};

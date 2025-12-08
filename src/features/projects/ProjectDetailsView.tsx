
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { SciFiCard } from '../../components/ui/SciFiCard';
import { SectionBox } from '../../components/ui/SectionBox';
import { HoloButton } from '../../components/ui/HoloButton';
import { formatCurrency } from '../expenses/lib/utils';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, CreditCard, BookOpen, Brain, Loader } from 'lucide-react';
import { ProjectFinancialChart } from './components/ProjectFinancialChart';
import { ProjectAIAnalysisModal } from './components/ProjectAIAnalysisModal';
import { ROUTES } from '../../constants/routes';
import { useQuery } from '@tanstack/react-query';
import { expenseService } from '../../services/expenseService';
import { incomeService } from '../../services/incomeService';
import { noteService } from '../../services/noteService';

type ProjectDetailTab = 'expenses' | 'income' | 'notes';

export const ProjectDetailsView: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { theme, lang, settings, projects } = useZustandStore();
    const t = translations[lang];

    const [activeTab, setActiveTab] = useState<ProjectDetailTab>('expenses');
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

    const projectRef = projects.find(p => p.id === projectId);

    // Fetch Expenses for this project
    const { data: expensesData, isLoading: expensesLoading } = useQuery({
        queryKey: ['projectExpenses', projectId],
        queryFn: async () => {
             // We might need a specific service method for this to be efficient, 
             // or filter client-side if we fetch all (not ideal for huge data).
             // Assuming we update getExpensesPaginated to support projectId or just filter post-fetch for now
             // since the service API in this codebase only exposes paginated or stats.
             // For now, let's assume we fetch all (legacy method) and filter.
             const { data } = await expenseService.getExpenses();
             return data.filter(e => e.projectId === projectId);
        },
        enabled: !!projectId
    });

    // Fetch Income for this project
    const { data: incomeData, isLoading: incomeLoading } = useQuery({
        queryKey: ['projectIncome', projectId],
        queryFn: async () => {
             const { data } = await incomeService.getIncome();
             return data.filter(i => i.projectId === projectId);
        },
        enabled: !!projectId
    });
    
    // Fetch Notes for this project
     const { data: notesData } = useQuery({
        queryKey: ['projectNotes', projectId],
        queryFn: async () => {
             const { data } = await noteService.getNotes();
             return data.filter(n => n.linkedProject === projectId);
        },
        enabled: !!projectId
    });

    const project = useMemo(() => {
        if (!projectRef) return null;
        const projectExpenses = expensesData || [];
        const projectIncome = incomeData || [];
        const totalExpenses = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = projectIncome.reduce((sum, i) => sum + i.amount, 0);
        return {
            ...projectRef,
            totalExpenses,
            totalIncome,
            netProfit: totalIncome - totalExpenses,
            expenses: projectExpenses,
            income: projectIncome,
        };
    }, [projectRef, expensesData, incomeData]);

    if (!project) {
        return <SectionBox title="Error" theme={theme}><p>Project not found.</p></SectionBox>;
    }
    
    if (expensesLoading || incomeLoading) {
        return <div className="flex justify-center p-12"><Loader className="animate-spin text-cyan-400"/></div>;
    }
    
    const isProfitable = project.netProfit >= 0;
    const projectNotes = notesData || [];

    const tabs = [
        { id: 'expenses', label: t.expenses, icon: CreditCard, count: project.expenses.length },
        { id: 'income', label: t.income, icon: TrendingUp, count: project.income.length },
        { id: 'notes', label: t.notes, icon: BookOpen, count: projectNotes.length },
    ];
    
    const renderTabContent = () => {
        const tableHeaderClasses = `p-2 text-sm font-semibold sticky top-0 z-10 ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`;
        switch(activeTab) {
            case 'expenses':
                if (project.expenses.length === 0) return <p className="p-4 text-center text-gray-500">لا توجد مصروفات لهذا المشروع.</p>;
                return (
                    <table className="w-full text-sm">
                        <thead><tr><th className={tableHeaderClasses}>Date</th><th className={tableHeaderClasses}>Title</th><th className={tableHeaderClasses}>Amount</th></tr></thead>
                        <tbody>{project.expenses.map(e => <tr key={e.id}><td className="p-2 border-t border-gray-800">{e.date}</td><td className="p-2 border-t border-gray-800">{e.title}</td><td className="p-2 border-t border-gray-800 font-mono">{formatCurrency(e.amount, e.currency)}</td></tr>)}</tbody>
                    </table>
                );
            case 'income':
                 if (project.income.length === 0) return <p className="p-4 text-center text-gray-500">لا توجد إيرادات لهذا المشروع.</p>;
                return (
                    <table className="w-full text-sm">
                        <thead><tr><th className={tableHeaderClasses}>Date</th><th className={tableHeaderClasses}>Title</th><th className={tableHeaderClasses}>Amount</th></tr></thead>
                        <tbody>{project.income.map(i => <tr key={i.id}><td className="p-2 border-t border-gray-800">{i.date}</td><td className="p-2 border-t border-gray-800">{i.title}</td><td className="p-2 border-t border-gray-800 font-mono">{formatCurrency(i.amount, i.currency)}</td></tr>)}</tbody>
                    </table>
                );
            case 'notes':
                 if (projectNotes.length === 0) return <p className="p-4 text-center text-gray-500">لا توجد ملاحظات لهذا المشروع.</p>;
                return (
                    <div className="space-y-2">{projectNotes.map(n => <div key={n.id} className="p-3 bg-gray-800 rounded-lg"><h4>{n.title}</h4><p className="text-xs text-gray-400">{n.content.substring(0, 100)}...</p></div>)}</div>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <HoloButton variant="secondary" icon={ArrowLeft} onClick={() => navigate(ROUTES.PROJECTS)}>{t.back}</HoloButton>
                <div className="text-right">
                     <h1 className="text-2xl font-bold">{project.name}</h1>
                     <p className="text-gray-400">{project.clientName || 'مشروع داخلي'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SciFiCard theme={theme} title={t.budget} value={project.budget ? formatCurrency(project.budget, settings.baseCurrency) : 'N/A'} icon={DollarSign} color="purple" />
                <SciFiCard theme={theme} title={t.totalIncome} value={formatCurrency(project.totalIncome, settings.baseCurrency)} icon={TrendingUp} color="green" />
                <SciFiCard theme={theme} title={t.totalExpenses} value={formatCurrency(project.totalExpenses, settings.baseCurrency)} icon={TrendingDown} color="orange" />
                <SciFiCard theme={theme} title={t.netProfit} value={formatCurrency(project.netProfit, settings.baseCurrency)} icon={isProfitable ? TrendingUp : TrendingDown} color={isProfitable ? "cyan" : "red"} />
            </div>
            
            <SectionBox title={t.monthlyFinancialFlow} theme={theme}>
                <ProjectFinancialChart income={project.income} expenses={project.expenses} />
            </SectionBox>

             <SectionBox title={t.projectDetails} theme={theme}>
                <div className="flex justify-between items-start mb-4">
                    <div className={`hidden md:flex border-b ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'} items-stretch gap-2`}>
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as ProjectDetailTab)} className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
                                <tab.icon size={16} />
                                <span>{tab.label}</span>
                                {tab.count > 0 && <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded-full">{tab.count}</span>}
                            </button>
                        ))}
                    </div>
                    <HoloButton icon={Brain} variant="secondary" onClick={() => setIsAnalysisModalOpen(true)}>
                        {t.aiAnalysis}
                    </HoloButton>
                </div>
                 <div className="max-h-96 overflow-y-auto">
                    {renderTabContent()}
                </div>
            </SectionBox>

            {isAnalysisModalOpen && (
                <ProjectAIAnalysisModal
                    project={project}
                    onClose={() => setIsAnalysisModalOpen(false)}
                />
            )}
        </div>
    );
};

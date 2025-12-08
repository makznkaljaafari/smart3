
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { SciFiCard } from '../../components/ui/SciFiCard';
import { HoloButton } from '../../components/ui/HoloButton';
import { Plus, Briefcase, Loader, ServerCrash } from 'lucide-react';
import { Project, Toast, ProjectStatus } from '../../types';
import { projectService } from '../../services/projectService';
import { expenseService } from '../../services/expenseService';
import { incomeService } from '../../services/incomeService';
import { ProjectCard } from './components/ProjectCard';
import { ProjectFormModal } from './components/ProjectFormModal';
import { formatCurrency } from '../expenses/lib/utils';
import { useQuery } from '@tanstack/react-query';

export const ProjectsView: React.FC = () => {
    const { theme, lang, settings, authUser, projects, projectsLoading, projectsError } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
        authUser: state.authUser,
        projects: state.projects,
        projectsLoading: state.projectsLoading,
        projectsError: state.projectsError,
    }));
    const { fetchProjects, currentCompany } = useZustandStore.getState();
    const t = translations[lang];
    const navigate = useNavigate();

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    // Fetch all expenses and income to calculate project profitability
    // Note: For large datasets, this should be done via a dedicated backend view/RPC
    const { data: expensesData } = useQuery({
        queryKey: ['allExpensesForProjects', currentCompany?.id],
        queryFn: async () => {
            const { data } = await expenseService.getExpenses();
            return data;
        },
        enabled: !!currentCompany?.id
    });

    const { data: incomeData } = useQuery({
        queryKey: ['allIncomeForProjects', currentCompany?.id],
        queryFn: async () => {
            const { data } = await incomeService.getIncome();
            return data;
        },
        enabled: !!currentCompany?.id
    });

    const handleOpenForm = (project: Project | null = null) => {
        setEditingProject(project);
        setShowFormModal(true);
    };

    const handleCloseForm = () => {
        setEditingProject(null);
        setShowFormModal(false);
    };

    const handleViewProject = (projectId: string) => {
        navigate(`/projects/${projectId}`);
    };

    const handleSaveProject = async (data: Partial<Project>) => {
        if (!authUser) { addToast('Not authenticated', 'error'); return; }
        const isNew = !editingProject;
        const { error } = await projectService.saveProject(data, isNew);
        if (error) {
            addToast(error.message, 'error');
            throw error;
        }
        await fetchProjects();
        addToast(t.projectSavedSuccess, 'success');
        handleCloseForm();
    };
    
    const handleDeleteProject = async (id: string) => {
        if (confirm(t.areYouSureDeleteProject)) {
            const { error } = await projectService.deleteProject(id);
            if (error) { addToast(error.message, 'error'); return; }
            await fetchProjects();
            addToast(t.projectDeletedSuccess, 'info');
        }
    };
    
    const projectsWithCalculations = useMemo(() => {
        const expenses = expensesData || [];
        const income = incomeData || [];
        return projects.map(project => {
            const projectExpenses = expenses.filter((e: any) => e.projectId === project.id).reduce((sum: number, e: any) => sum + e.amount, 0);
            const projectIncome = income.filter((i: any) => i.projectId === project.id).reduce((sum: number, i: any) => sum + i.amount, 0);
            return {
                ...project,
                totalExpenses: projectExpenses,
                totalIncome: projectIncome,
                netProfit: projectIncome - projectExpenses
            };
        });
    }, [projects, expensesData, incomeData]);

    const filteredProjects = useMemo(() => {
        if (statusFilter === 'all') {
            return projectsWithCalculations;
        }
        return projectsWithCalculations.filter(p => p.status === statusFilter);
    }, [projectsWithCalculations, statusFilter]);

    const stats = useMemo(() => {
        const active = projectsWithCalculations.filter(p => p.status === 'in_progress');
        const completed = projectsWithCalculations.filter(p => p.status === 'completed');
        return {
            activeCount: active.length,
            completedCount: completed.length,
            totalBudget: active.reduce((sum: number, p: any) => sum + (p.budget || 0), 0),
            overallProfit: completed.reduce((sum: number, p: any) => sum + p.netProfit, 0),
        };
    }, [projectsWithCalculations]);

    const renderContent = () => {
        if (projectsLoading) {
            return <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>;
        }
        if (projectsError) {
            return <div className="p-8 text-center text-red-400"><ServerCrash className="mx-auto mb-2" /> Error: {projectsError}</div>;
        }
        if (filteredProjects.length === 0) {
            return (
                <div className={`p-12 text-center rounded-lg border-2 border-dashed border-[rgb(var(--border-primary-rgb))]`}>
                    <Briefcase size={48} className="mx-auto text-gray-500 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{statusFilter === 'all' ? t.noProjectsYet : 'لا توجد مشاريع تطابق الفلتر'}</h3>
                    {statusFilter === 'all' && <p className="text-gray-400 mb-6">{t.addFirstProject}</p>}
                    <HoloButton icon={Plus} onClick={() => handleOpenForm()}>{t.addProject}</HoloButton>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(p => (
                    <ProjectCard 
                        key={p.id}
                        project={p}
                        onView={() => handleViewProject(p.id)}
                        onEdit={() => handleOpenForm(p)}
                        onDelete={() => handleDeleteProject(p.id)}
                    />
                ))}
            </div>
        );
    };
    
    const formControlClasses = `px-4 py-2.5 rounded-lg border focus:outline-none transition-colors bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))]`;
    const statuses: ProjectStatus[] = ['planning', 'in_progress', 'completed', 'on_hold', 'cancelled'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-2xl font-bold">{t.projects}</h1>
                    <p className="text-gray-400">تتبع ربحية وأداء مشاريعك.</p>
                </div>
                <HoloButton icon={Plus} variant="primary" onClick={() => handleOpenForm()}>{t.addProject}</HoloButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SciFiCard theme={theme} title={t.activeProjects} value={stats.activeCount.toString()} icon={Briefcase} color="cyan" />
                <SciFiCard theme={theme} title={t.completedProjects} value={stats.completedCount.toString()} icon={Briefcase} color="green" />
                <SciFiCard theme={theme} title={t.totalBudget} value={formatCurrency(stats.totalBudget, settings.baseCurrency)} icon={Briefcase} color="purple" />
                <SciFiCard theme={theme} title={t.overallProfitability} value={formatCurrency(stats.overallProfit, settings.baseCurrency)} icon={Briefcase} color="orange" />
            </div>
            
            <div className={`p-4 rounded-2xl border bg-[rgb(var(--bg-secondary-rgb))] border-[rgb(var(--border-primary-rgb))] shadow-sm`}>
                <div className="flex items-center gap-4">
                    <label className="font-semibold">{t.status}:</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={formControlClasses}>
                        <option value="all">{t.allStatuses}</option>
                        {statuses.map(s => <option key={s} value={s}>{t[s] || s}</option>)}
                    </select>
                </div>
            </div>

            {renderContent()}

            {showFormModal && (
                <ProjectFormModal
                    project={editingProject}
                    onClose={handleCloseForm}
                    onSave={handleSaveProject}
                />
            )}
        </div>
    );
};

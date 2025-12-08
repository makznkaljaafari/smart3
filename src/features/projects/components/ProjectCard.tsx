
import React, { useMemo, useState } from 'react';
import { Project } from '../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { formatCurrency } from '../../expenses/lib/utils';
import { Edit2, Trash2, TrendingUp, TrendingDown, DollarSign, User, Calendar, MoreVertical, Eye } from 'lucide-react';

const getStatusInfo = (status: Project['status'], t: Record<string, string>) => {
    const config = {
        planning: { label: t.planning, className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
        in_progress: { label: t.in_progress, className: 'text-green-400 bg-green-500/10 border-green-500/20' },
        completed: { label: t.completed, className: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
        on_hold: { label: t.on_hold, className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
        cancelled: { label: t.cancelled, className: 'text-red-400 bg-red-500/10 border-red-500/20' },
        needs_review: { label: t.needs_review || 'Needs Review', className: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    };
    return config[status] || config.in_progress;
}

interface ProjectCardProps {
    project: Project;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onView, onEdit, onDelete }) => {
    const { theme, lang, settings } = useZustandStore();
    const t = translations[lang];
    const statusInfo = getStatusInfo(project.status, t);
    const [showMenu, setShowMenu] = useState(false);
    const isDark = theme === 'dark';

    const isProfitable = project.netProfit >= 0;

    const timelineProgress = useMemo(() => {
        if (!project.startDate || !project.endDate || project.status === 'completed') {
            return project.status === 'completed' ? 100 : 0;
        }
        const start = new Date(project.startDate).getTime();
        const end = new Date(project.endDate).getTime();
        const now = new Date().getTime();
        
        if (now < start) return 0;
        if (now > end) return 100;
        
        const totalDuration = end - start;
        if (totalDuration <= 0) return 100;

        const elapsed = now - start;
        return (elapsed / totalDuration) * 100;
    }, [project.startDate, project.endDate, project.status]);


    return (
        <div 
            className={`group relative rounded-2xl border transition-all duration-500 flex flex-col h-full overflow-hidden ${isDark ? 'bg-gray-900/80 border-gray-800 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'bg-white border-slate-200 shadow-sm hover:shadow-xl'}`}
        >
             {/* Hover Glow Background */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${isDark ? 'bg-gradient-to-br from-cyan-500/5 to-purple-500/5' : 'bg-gradient-to-br from-cyan-50/50 to-purple-50/50'}`} />

            <div className="relative z-10 p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div onClick={onView} className="cursor-pointer flex-1">
                        <h3 className={`font-bold text-xl mb-1 ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-slate-900 group-hover:text-cyan-600'} transition-colors`}>{project.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${statusInfo.className}`}>{statusInfo.label}</span>
                            {project.clientName && <span className="text-xs text-gray-500 flex items-center gap-1"><User size={10}/> {project.clientName}</span>}
                        </div>
                    </div>
                    
                     <div className="relative">
                        <button 
                            onClick={() => setShowMenu(!showMenu)} 
                            onBlur={() => setTimeout(() => setShowMenu(false), 200)}
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
                        >
                            <MoreVertical size={18} />
                        </button>
                        {showMenu && (
                            <div className={`absolute right-0 mt-2 w-36 rounded-xl shadow-2xl z-20 border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                                <button onClick={onView} className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-right hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-50 text-slate-700'}`}><Eye size={16} /> عرض</button>
                                <button onClick={onEdit} className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-right hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-50 text-slate-700'}`}><Edit2 size={16} /> تعديل</button>
                                <button onClick={onDelete} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-right text-red-500 hover:bg-red-500/10"><Trash2 size={16} /> حذف</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 flex-1">
                    {project.budget !== undefined && project.budget > 0 && (
                        <div>
                            <div className="flex justify-between text-xs mb-1.5 text-gray-400 font-medium">
                                <span>{t.budget}</span>
                                <span>{Math.round((project.totalExpenses / project.budget) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                                    style={{ width: `${Math.min((project.totalExpenses / project.budget) * 100, 100)}%`}}
                                />
                            </div>
                            <p className="text-right text-[10px] text-gray-500 mt-1 font-mono">{formatCurrency(project.budget, settings.baseCurrency)}</p>
                        </div>
                    )}

                    {project.startDate && project.endDate && (
                        <div>
                            <div className="flex justify-between text-xs mb-1.5 text-gray-400 font-medium">
                                <span className="flex items-center gap-1"><Calendar size={12}/> الجدول الزمني</span>
                                <span>{Math.round(timelineProgress)}%</span>
                            </div>
                            <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                                    style={{ width: `${timelineProgress}%`}}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className={`grid grid-cols-3 gap-2 text-center pt-4 mt-4 border-t ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t.totalIncome}</p>
                        <p className="font-mono font-bold text-sm text-green-400">{formatCurrency(project.totalIncome, settings.baseCurrency)}</p>
                    </div>
                     <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t.totalExpenses}</p>
                        <p className="font-mono font-bold text-sm text-orange-400">{formatCurrency(project.totalExpenses, settings.baseCurrency)}</p>
                    </div>
                     <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t.netProfit}</p>
                        <p className={`font-mono font-bold text-sm ${isProfitable ? 'text-cyan-400' : 'text-red-400'}`}>{formatCurrency(project.netProfit, settings.baseCurrency)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

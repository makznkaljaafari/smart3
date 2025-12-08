
import React from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { ShoppingBag, CreditCard, Workflow, Bot, Rocket, Clock, Search } from 'lucide-react';

export const IntegrationRoadmap: React.FC = () => {
    const { theme, lang } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
    }));
    const t = translations[lang];

    const milestones = [
        {
            id: 'webhooks',
            title: t.advancedWebhooks,
            description: t.advancedWebhooksDesc,
            date: t.q2_2025,
            status: 'in_progress',
            icon: Workflow,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/30'
        },
        {
            id: 'ecommerce',
            title: t.localEcommerce,
            description: t.localEcommerceDesc,
            date: t.q3_2025,
            status: 'planned',
            icon: ShoppingBag,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/30'
        },
        {
            id: 'payment',
            title: t.paymentGateways,
            description: t.paymentGatewaysDesc,
            date: t.q3_2025,
            status: 'planned',
            icon: CreditCard,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            border: 'border-green-500/30'
        },
        {
            id: 'agents',
            title: t.autonomousAgents,
            description: t.autonomousAgentsDesc,
            date: t.q4_2025,
            status: 'research',
            icon: Bot,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/30'
        }
    ];

    const getStatusBadge = (status: string) => {
        const config = {
            in_progress: { label: t.status_in_progress, icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500/20' },
            planned: { label: t.status_planned, icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20' },
            research: { label: t.status_research, icon: Search, color: 'text-pink-400', bg: 'bg-pink-500/20' }
        }[status] || { label: status, icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20' };

        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
                <Icon size={12} />
                {config.label}
            </span>
        );
    };

    return (
        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-gray-700' : 'bg-white border-slate-200'}`}>
            <div className="mb-6">
                <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.roadmap}</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>{t.roadmapDescription}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {milestones.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div 
                            key={item.id} 
                            className={`p-5 rounded-xl border transition-all duration-300 hover:shadow-lg flex flex-col h-full
                                ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-50'}
                                ${item.border}
                            `}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-lg ${item.bg} ${item.color}`}>
                                    <Icon size={24} />
                                </div>
                                {getStatusBadge(item.status)}
                            </div>
                            
                            <h4 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                {item.title}
                            </h4>
                            
                            <p className={`text-sm mb-4 flex-1 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                                {item.description}
                            </p>
                            
                            <div className={`pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'} flex items-center text-xs font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                <Clock size={14} className="mr-2 ml-1" />
                                {item.date}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

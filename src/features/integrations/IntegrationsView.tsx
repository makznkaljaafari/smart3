
import React, { useState, useEffect, useRef } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { Zap, Sliders, ListChecks, Save, Map, Activity, Webhook } from 'lucide-react';
import { AutomationRules } from './components/AutomationRules';
import { IntegrationConnections } from './components/IntegrationConnections';
import { ActivityLog } from './components/ActivityLog';
import { IntegrationRoadmap } from './components/IntegrationRoadmap';
import { WebhooksManager } from './components/WebhooksManager';
import { SettingsState, AppTheme } from '../../types';
import { profileService } from '../../services/profileService';
import { HoloButton } from '../../components/ui/HoloButton';

type IntegrationTab = 'rules' | 'connections' | 'webhooks' | 'log' | 'roadmap';

export const IntegrationsView: React.FC = () => {
    const { theme, lang, settings, authUser, addToast, setSettings, currentCompany } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
        authUser: state.authUser,
        addToast: state.addToast,
        setSettings: state.setSettings,
        currentCompany: state.currentCompany,
    }));
    const t = translations[lang];
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState<IntegrationTab>('connections');
    const [localSettings, setLocalSettings] = useState<SettingsState>(settings);
    const prevCompanyIdRef = useRef(currentCompany?.id);

    useEffect(() => {
        if (currentCompany?.id !== prevCompanyIdRef.current) {
            setLocalSettings(settings);
            prevCompanyIdRef.current = currentCompany?.id;
        }
    }, [currentCompany?.id, settings]);

    const handleSave = async () => {
        if (!authUser) {
            addToast({ message: 'User not authenticated', type: 'error' });
            return;
        }
        
        const { error } = await profileService.updateProfileAndSettings(localSettings);

        if (error) {
            addToast({ message: error.message, type: 'error' });
            return;
        }

        setSettings(localSettings);
        addToast({ message: t.successSaved, type: 'success' });
    };


    const tabs: { id: IntegrationTab; label: string; icon: React.ElementType }[] = [
        { id: 'connections', label: t.connections, icon: Zap },
        { id: 'webhooks', label: t.webhooks || 'Webhooks', icon: Webhook },
        { id: 'rules', label: t.automationRules, icon: Sliders },
        { id: 'log', label: t.activityLog, icon: ListChecks },
        { id: 'roadmap', label: t.roadmap, icon: Map },
    ];
    
    const renderContent = () => {
        const commonProps = { localSettings, setLocalSettings, t, theme: theme as AppTheme, lang };
        switch(activeTab) {
            case 'rules': return <AutomationRules {...commonProps} />;
            case 'connections': return <IntegrationConnections {...commonProps} />;
            case 'webhooks': return <WebhooksManager {...commonProps} />;
            case 'log': return <ActivityLog />;
            case 'roadmap': return <IntegrationRoadmap />;
            default: return null;
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <Activity className="text-cyan-400" /> {t.integrations}
                    </h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-slate-600'}`}>إدارة الربط الخارجي وقواعد الأتمتة.</p>
                </div>
                
                 {(activeTab !== 'log' && activeTab !== 'roadmap') && (
                    <HoloButton icon={Save} variant="success" onClick={handleSave} className="shadow-lg shadow-green-500/20">
                        {t.saveChanges}
                    </HoloButton>
                )}
            </div>

            <div className={`p-1 rounded-xl flex overflow-x-auto ${isDark ? 'bg-gray-900/50 border border-white/10' : 'bg-slate-100 border border-slate-200'}`}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                ${isActive 
                                    ? (isDark ? 'bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'bg-white text-cyan-700 shadow-sm') 
                                    : (isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50')
                                }`}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    )
                })}
            </div>
            
            <div className="min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderContent()}
            </div>
        </div>
    );
};

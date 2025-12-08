import React from 'react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Zap } from 'lucide-react';

interface IntegrationCardProps {
    title: string;
    description: string;
    iconUrl: string;
    isConnected: boolean;
    onManageClick: () => void;
    theme: 'light' | 'dark';
    t: Record<string, string>;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({ title, description, iconUrl, isConnected, onManageClick, theme, t }) => {
    const cardClasses = theme === 'dark'
        ? 'bg-gray-900/50 border-gray-700/50 hover:border-cyan-500/50'
        : 'bg-white border-slate-200 shadow-sm hover:border-cyan-400 hover:shadow-lg';

    return (
        <div className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col ${cardClasses}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <img src={iconUrl} alt={`${title} logo`} className="w-12 h-12" />
                    <div>
                        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                        <div className={`flex items-center gap-2 mt-1 text-xs font-medium ${isConnected ? 'text-green-500' : 'text-yellow-500'}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            {isConnected ? t.connected : t.notConfigured}
                        </div>
                    </div>
                </div>
            </div>
            <p className={`text-sm flex-1 mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>{description}</p>
            <HoloButton variant={isConnected ? 'secondary' : 'primary'} icon={Zap} onClick={onManageClick}>
                {isConnected ? t.manage : t.configure}
            </HoloButton>
        </div>
    );
};

import React from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { Toggle } from '../../../components/ui/Toggle';
import { SettingsState, DashboardCardConfig, DashboardCardColor } from '../../../types';
import { cardMetaData } from '../../dashboard/lib/dashboardUtils';

interface DashboardSettingsProps {
  localSettings: SettingsState;
  setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  t: Record<string, string>;
  theme: 'light' | 'dark';
}

const accentColors: DashboardCardColor[] = ['primary', 'cyan', 'purple', 'green', 'orange', 'red', 'yellow'];
const colorMap: Record<DashboardCardColor, string> = {
    primary: 'from-[var(--accent-from)] to-[var(--accent-to)]',
    cyan: 'from-cyan-400 to-blue-500',
    purple: 'from-purple-400 to-pink-500',
    green: 'from-green-400 to-emerald-500',
    orange: 'from-orange-400 to-red-500',
    red: 'from-red-400 to-rose-500',
    yellow: 'from-yellow-400 to-amber-500'
};

export const DashboardSettings: React.FC<DashboardSettingsProps> = ({ localSettings, setLocalSettings, t, theme }) => {

    const handleCardChange = (id: DashboardCardConfig['id'], key: keyof DashboardCardConfig, value: any) => {
        setLocalSettings(prev => {
            const newCards = prev.dashboardCards.map(card => 
                card.id === id ? { ...card, [key]: value } : card
            );
            return { ...prev, dashboardCards: newCards };
        });
    };

    return (
        <SectionBox title={t.dashboardCards} theme={theme}>
            <p className={`text-xs mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                {t.dashboardSettingsDescription}
            </p>
            <div className="space-y-4">
                {localSettings.dashboardCards.map(card => {
                    const meta = cardMetaData[card.id];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                        <div key={card.id} className={`p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
                            <div className="flex items-center gap-3">
                                <Icon size={24} className={theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'} />
                                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t[card.id]}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    {accentColors.map(color => (
                                        <button 
                                            key={color}
                                            onClick={() => handleCardChange(card.id, 'color', color)}
                                            className={`w-6 h-6 rounded-full bg-gradient-to-br transition-all duration-200 ${colorMap[color]} ${card.color === color ? 'ring-2 ring-offset-2 ring-white ' + (theme === 'dark' ? 'ring-offset-gray-800' : 'ring-offset-slate-100') : 'hover:scale-110'}`}
                                            aria-label={`Set color to ${color}`}
                                        />
                                    ))}
                                </div>
                                <Toggle 
                                    checked={card.visible}
                                    onChange={(checked) => handleCardChange(card.id, 'visible', checked)}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </SectionBox>
    );
};
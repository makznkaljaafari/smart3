
import React, { useState } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Toggle } from '../../../components/ui/Toggle';
import { HoloButton } from '../../../components/ui/HoloButton';
import { ScheduledReport, SettingsState, AppTheme } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';

const reportTypeLabels: Record<ScheduledReport['reportType'], string> = {
  expenseSummary: 'ملخص المصروفات',
  debtAging: 'تقرير أعمار الديون',
  customerRanking: 'تقرير تصنيف العملاء',
};

interface AutomationRulesProps {
  localSettings: SettingsState;
  setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  t: Record<string, string>;
  theme: AppTheme;
  lang: 'ar' | 'en';
}

export const AutomationRules: React.FC<AutomationRulesProps> = ({ localSettings, setLocalSettings, t, theme, lang }) => {
    const isDark = theme.startsWith('dark');
    const [newSchedule, setNewSchedule] = useState({
        reportType: 'expenseSummary' as ScheduledReport['reportType'],
        frequency: 'weekly' as ScheduledReport['frequency'],
        channels: ['whatsapp'] as ('whatsapp' | 'telegram' | 'email')[],
    });

    const handleAddSchedule = () => {
        const schedule: ScheduledReport = { id: `sch-${Date.now()}`, ...newSchedule };
        setLocalSettings(prev => ({ ...prev, scheduledReports: [...(prev.scheduledReports || []), schedule] }));
    };
    
    const handleDeleteSchedule = (id: string) => {
        setLocalSettings(prev => ({ ...prev, scheduledReports: (prev.scheduledReports || []).filter(s => s.id !== id) }));
    };

    const handleChannelChange = (channel: 'whatsapp' | 'telegram' | 'email') => {
        setNewSchedule(prev => ({
            ...prev,
            channels: prev.channels.includes(channel)
                ? prev.channels.filter(c => c !== channel)
                : [...prev.channels, channel]
        }));
    };

    const formControlClasses = `w-full rounded-lg p-2 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;

    return (
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-gray-700' : 'bg-white border-slate-200'}`}>
            <div className="space-y-8">
                <div>
                    <h3 className="font-semibold mb-2 text-lg">{t.smartAlerts}</h3>
                    <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t.manageSmartAlerts}</p>
                    <div className={`p-4 rounded-lg flex flex-wrap items-center justify-between ${isDark ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
                        <div className="flex-1 min-w-[250px]">
                            <p className="font-medium">{t.overdueDebtAlert}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t.notifyWhenDebtIsOverdueBy}
                                <input 
                                type="number" 
                                value={localSettings.smartAlerts.overdueDebt.days} 
                                onChange={e => setLocalSettings(p => ({...p, smartAlerts: {...p.smartAlerts, overdueDebt: {...p.smartAlerts.overdueDebt, days: Number(e.target.value)} }}))}
                                className="w-16 mx-1 p-1 text-center bg-transparent border-b"
                                /> 
                                {t.days}.
                            </p>
                        </div>
                        <Toggle 
                            checked={localSettings.smartAlerts.overdueDebt.enabled} 
                            onChange={v => setLocalSettings(p => ({...p, smartAlerts: {...p.smartAlerts, overdueDebt: {...p.smartAlerts.overdueDebt, enabled: v}}}))}
                        />
                    </div>
                </div>

                <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="font-semibold mb-2 text-lg">{t.scheduledReports}</h3>
                    <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t.manageScheduledReports}</p>
                    <div className="space-y-2">
                        {(localSettings.scheduledReports || []).map(schedule => (
                            <div key={schedule.id} className={`p-3 rounded-lg flex items-center justify-between ${isDark ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
                                <div>
                                <p className="font-medium">{reportTypeLabels[schedule.reportType]}</p>
                                <p className="text-xs text-gray-400">{t[schedule.frequency]} to {schedule.channels.join(', ')}</p>
                                </div>
                                <button onClick={() => handleDeleteSchedule(schedule.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                    <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                        <h4 className="font-semibold text-sm mb-2">{t.addSchedule}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select value={newSchedule.reportType} onChange={e => setNewSchedule(p => ({...p, reportType: e.target.value as any}))} className={formControlClasses}>
                                <option value="expenseSummary">{t.expenseSummary}</option>
                                <option value="debtAging">{t.debtAgingReport}</option>
                                <option value="customerRanking">{t.customerRankingReport}</option>
                            </select>
                            <select value={newSchedule.frequency} onChange={e => setNewSchedule(p => ({...p, frequency: e.target.value as any}))} className={formControlClasses}>
                                <option value="daily">{t.daily}</option>
                                <option value="weekly">{t.weekly}</option>
                                <option value="monthly">{t.monthly}</option>
                            </select>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={newSchedule.channels.includes('whatsapp')} onChange={() => handleChannelChange('whatsapp')}/>{t.whatsapp}</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={newSchedule.channels.includes('telegram')} onChange={() => handleChannelChange('telegram')}/>{t.telegram}</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={newSchedule.channels.includes('email')} onChange={() => handleChannelChange('email')}/>{t.email}</label>
                            </div>
                        </div>
                        <div className="mt-3">
                            <HoloButton variant="primary" icon={Plus} onClick={handleAddSchedule}>{t.addSchedule}</HoloButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

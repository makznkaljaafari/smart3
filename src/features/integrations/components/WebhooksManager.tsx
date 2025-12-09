
import React, { useState } from 'react';
import { SettingsState, WebhookConfig, AppTheme } from '../../../types';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Plus, Webhook, Trash2, Edit2, Zap, Activity, CheckCircle, XCircle } from 'lucide-react';
import { WebhookFormModal } from './WebhookFormModal';
import { Toggle } from '../../../components/ui/Toggle';
import { useZustandStore } from '../../../store/useStore';

interface WebhooksManagerProps {
    localSettings: SettingsState;
    setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
    t: Record<string, string>;
    theme: AppTheme;
    lang: 'ar' | 'en';
}

export const WebhooksManager: React.FC<WebhooksManagerProps> = ({ localSettings, setLocalSettings, t, theme, lang }) => {
    const { addToast } = useZustandStore();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);

    const isDark = !theme.startsWith('light');

    const handleSaveWebhook = (webhook: WebhookConfig) => {
        const currentWebhooks = localSettings.integrations.webhooks || [];
        let updatedWebhooks;
        
        if (editingWebhook) {
            updatedWebhooks = currentWebhooks.map(w => w.id === webhook.id ? webhook : w);
        } else {
            updatedWebhooks = [...currentWebhooks, webhook];
        }

        setLocalSettings(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                webhooks: updatedWebhooks
            }
        }));
        
        setIsFormOpen(false);
        setEditingWebhook(null);
    };

    const handleDeleteWebhook = (id: string) => {
        if(confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الـ Webhook؟' : 'Are you sure you want to delete this webhook?')) {
            setLocalSettings(prev => ({
                ...prev,
                integrations: {
                    ...prev.integrations,
                    webhooks: (prev.integrations.webhooks || []).filter(w => w.id !== id)
                }
            }));
        }
    };

    const handleToggleActive = (id: string, active: boolean) => {
        setLocalSettings(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                webhooks: (prev.integrations.webhooks || []).map(w => w.id === id ? { ...w, active } : w)
            }
        }));
    };

    const handleTestWebhook = async (webhook: WebhookConfig) => {
        setTestingId(webhook.id);
        try {
            // Simulator
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // In a real scenario, this would call a backend endpoint that fires a test POST
            // For now, we simulate a successful ping if URL is valid
            if (webhook.url.startsWith('http')) {
                addToast({ message: t.testSuccess || 'Test event sent successfully (200 OK)', type: 'success' });
            } else {
                throw new Error('Invalid URL');
            }
        } catch (e) {
            addToast({ message: t.testFailed || 'Failed to connect to endpoint', type: 'error' });
        } finally {
            setTestingId(null);
        }
    };

    const webhooks = localSettings.integrations.webhooks || [];

    return (
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-gray-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-semibold mb-1 text-lg flex items-center gap-2">
                        <Webhook className="text-pink-500" />
                        {t.manageWebhooks || 'Manage Webhooks'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        {t.webhooksDescription || 'Send real-time data to external systems when events occur.'}
                    </p>
                </div>
                <HoloButton icon={Plus} onClick={() => { setEditingWebhook(null); setIsFormOpen(true); }}>
                    {t.addWebhook || 'Add Webhook'}
                </HoloButton>
            </div>

            {webhooks.length === 0 ? (
                <div className={`text-center p-12 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800/20' : 'border-slate-300 bg-slate-50'}`}>
                    <Activity className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} size={48} />
                    <p className="text-gray-500 mb-4">{t.noWebhooksYet || 'No webhooks configured yet.'}</p>
                    <button 
                        onClick={() => { setEditingWebhook(null); setIsFormOpen(true); }}
                        className="text-cyan-500 hover:underline text-sm"
                    >
                        {t.createYourFirstWebhook || 'Create your first webhook'}
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {webhooks.map(webhook => (
                        <div key={webhook.id} className={`p-4 rounded-xl border transition-all ${isDark ? 'bg-gray-800/40 border-gray-700 hover:border-pink-500/30' : 'bg-slate-50 border-slate-200 hover:border-pink-300'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 overflow-hidden">
                                    <div className={`p-2 rounded-lg mt-1 ${webhook.active ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                        {webhook.active ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{webhook.name}</h4>
                                        <p className="text-xs font-mono text-gray-500 truncate mb-2">{webhook.url}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {webhook.events.slice(0, 3).map(event => (
                                                <span key={event} className={`text-[10px] px-2 py-0.5 rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-slate-300 text-slate-600'}`}>
                                                    {event}
                                                </span>
                                            ))}
                                            {webhook.events.length > 3 && (
                                                <span className="text-[10px] text-gray-500">+{webhook.events.length - 3} more</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Toggle 
                                        checked={webhook.active} 
                                        onChange={(v) => handleToggleActive(webhook.id, v)}
                                    />
                                    <div className="w-px h-6 bg-gray-700 mx-1"></div>
                                    <button 
                                        onClick={() => handleTestWebhook(webhook)} 
                                        disabled={testingId === webhook.id}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-yellow-500/10 text-yellow-500' : 'hover:bg-yellow-100 text-yellow-600'} ${testingId === webhook.id ? 'animate-pulse' : ''}`}
                                        title={t.testConnection}
                                    >
                                        <Zap size={16} />
                                    </button>
                                    <button 
                                        onClick={() => { setEditingWebhook(webhook); setIsFormOpen(true); }}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-cyan-500/10 text-cyan-400' : 'hover:bg-cyan-100 text-cyan-600'}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteWebhook(webhook.id)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isFormOpen && (
                <WebhookFormModal 
                    webhook={editingWebhook}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSaveWebhook}
                    t={t}
                    theme={theme}
                    lang={lang}
                />
            )}
        </div>
    );
};

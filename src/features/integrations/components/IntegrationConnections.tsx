
import React, { useState } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Toggle } from '../../../components/ui/Toggle';
import { HoloButton } from '../../../components/ui/HoloButton';
import { AppEvent, BankConnection, SettingsState, CurrencyCode } from '../../../types';
import { accountService } from '../../../services/accountService';
import { notifyAll } from '../../../lib/events';
import { Zap, AlertTriangle, Save, Landmark, Trash2, X, Building2, ArrowRightLeft, Wallet, Plus, PlusCircle, Copy, Bot } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { IntegrationModal } from './IntegrationModal';

// Safe environment variable accessor
const getEnvVar = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env[key];
  } catch (e) {
    return '';
  }
};

interface IntegrationConnectionsProps {
  localSettings: SettingsState;
  setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  t: Record<string, string>;
  theme: 'light' | 'dark';
  lang: 'ar' | 'en';
}

export const IntegrationConnections: React.FC<IntegrationConnectionsProps> = ({ localSettings, setLocalSettings, t, theme, lang }) => {
    const { addToast, fetchAccounts, settings } = useZustandStore(state => ({
        addToast: state.addToast,
        fetchAccounts: state.fetchAccounts,
        settings: state.settings
    }));

    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
    const [integrationType, setIntegrationType] = useState<'whatsapp' | 'telegram'>('telegram');
    const [selectedInstitution, setSelectedInstitution] = useState<{name: string, type: string} | null>(null);
    
    // Manual Account Form State
    const [isCustom, setIsCustom] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customType, setCustomType] = useState<'bank' | 'exchange'>('bank');
    const [accountNumber, setAccountNumber] = useState('');
    const [currency, setCurrency] = useState<CurrencyCode>(settings.baseCurrency);
    const [openingBalance, setOpeningBalance] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Calculate Edge Function URL
    const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || '';
    const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    const webhookUrl = projectId ? `https://${projectId}.functions.supabase.co/telegram-bot` : 'Unavailable (Check VITE_SUPABASE_URL)';

    const handleTest = async (integSettings?: any) => {
        const settingsToUse = integSettings ? { ...localSettings, integrations: { ...localSettings.integrations, ...integSettings } } : localSettings;
        const testEvent: AppEvent = {
            id: crypto.randomUUID(),
            type: 'SMART_ALERT',
            payload: { message: lang === 'ar' ? 'رسالة اختبار من Smart Finance AI' : 'Test message from Smart Finance AI', recipientEmail: settingsToUse.integrations.smtp?.from || 'test@example.com' },
            at: new Date().toISOString(),
            lang: lang,
        };
        await notifyAll(testEvent, settingsToUse);
        addToast({ message: t.testSent, type: 'info' });
    };
    
    const handleOpenBankModal = (institution?: {name: string, type: string}) => {
        if (institution) {
            setSelectedInstitution(institution);
            setIsCustom(false);
        } else {
            setSelectedInstitution({ name: 'Custom', type: 'bank' });
            setIsCustom(true);
            setCustomName('');
            setCustomType('bank');
        }
        setAccountNumber('');
        setCurrency(settings.baseCurrency);
        setOpeningBalance('');
        setIsBankModalOpen(true);
    };

    const handleOpenIntegrationModal = (type: 'whatsapp' | 'telegram') => {
        setIntegrationType(type);
        setIsIntegrationModalOpen(true);
    }

    const handleSaveIntegration = (type: 'whatsapp' | 'telegram', data: any) => {
        setLocalSettings(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                ...data
            }
        }));
        setIsIntegrationModalOpen(false);
        addToast({ message: `${type} settings updated locally. Save changes to persist.`, type: 'success' });
    }

    const handleCreateManualAccount = async () => {
        if (!selectedInstitution) return;
        
        const finalName = isCustom ? customName : selectedInstitution.name;

        if (!finalName.trim()) {
            addToast({message: lang === 'ar' ? 'اسم الجهة مطلوب' : 'Institution name is required', type: 'error'});
            return;
        }

        if (!accountNumber) {
            addToast({message: lang === 'ar' ? 'رقم الحساب مطلوب' : 'Account number is required', type: 'error'});
            return;
        }

        setIsSaving(true);
        try {
            const accountName = `${finalName} - ${accountNumber}`;
            const { error } = await accountService.saveAccount({
                name: accountName,
                accountNumber: accountNumber,
                type: 'asset',
                currency: currency,
                balance: parseFloat(openingBalance) || 0,
                isPlaceholder: false,
            }, true);

            if (error) throw error;

            const newConnection: BankConnection = {
                id: `conn_${Date.now()}`,
                bankName: accountName,
                last4: accountNumber.slice(-4),
                status: 'active',
                lastSync: new Date().toISOString(),
            };

            setLocalSettings(prev => ({
                ...prev,
                integrations: {
                    ...prev.integrations,
                    bankConnections: [...(prev.integrations.bankConnections || []), newConnection]
                }
            }));

            await fetchAccounts();
            
            addToast({ message: lang === 'ar' ? 'تم فتح الحساب بنجاح وإضافته للأصول.' : 'Account opened and added to Assets.', type: 'success' });
            setIsBankModalOpen(false);
            setSelectedInstitution(null);

        } catch (e: any) {
            console.error(e);
            addToast({ message: e.message || 'Failed to create account', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveBank = (id: string) => {
        if (confirm(lang === 'ar' ? 'هل أنت متأكد من إزالة هذا الحساب من القائمة؟' : 'Remove this connection?')) {
            setLocalSettings(prev => ({
                ...prev,
                integrations: {
                    ...prev.integrations,
                    bankConnections: (prev.integrations.bankConnections || []).filter(c => c.id !== id)
                }
            }));
            addToast({ message: t.connectionRemoved, type: 'info' });
        }
    };
    
    const copyWebhook = () => {
        navigator.clipboard.writeText(webhookUrl);
        addToast({ message: 'Webhook URL copied!', type: 'success' });
    }
    
    const alertClasses = theme === 'dark' ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' : 'bg-amber-100 border-amber-300 text-amber-800';
    const inputClasses = `w-full rounded-lg border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 px-3 py-3 ${theme === 'dark' ? 'bg-[rgb(var(--bg-tertiary-rgb))] text-[rgb(var(--text-primary-rgb))] border-[rgb(var(--border-primary-rgb))] placeholder:[rgb(var(--text-muted-rgb))] disabled:opacity-50' : 'bg-white text-slate-800 border-slate-300 placeholder:text-slate-400 disabled:bg-slate-100'}`;
    const labelClasses = `block text-sm mb-2 ${theme === 'dark' ? 'text-[rgb(var(--text-secondary-rgb))]' : 'text-slate-700'}`;
    
    const financialInstitutions = [
        { name: 'Al-Kuraimi Bank (بنك الكريمي)', type: 'bank' },
        { name: 'CAC Bank (كاك بنك)', type: 'bank' },
        { name: 'Tadhamon Bank (بنك التضامن)', type: 'bank' },
        { name: 'Yemen Kuwait Bank (بنك اليمن والكويت)', type: 'bank' },
    ];

    return (
        <>
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-gray-700' : 'bg-white border-slate-200'}`}>
                <div className="space-y-8 divide-y divide-gray-700">
                    
                    {/* Bots Configuration Section */}
                    <div>
                         <h3 className="font-semibold mb-4 text-lg flex items-center gap-2"><Bot className="text-purple-400"/> {lang === 'ar' ? 'المساعد الذكي (Bots)' : 'Smart Bots'}</h3>
                         
                         <div className="grid md:grid-cols-2 gap-6">
                             {/* Telegram Card */}
                             <div className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
                                 <div className="flex justify-between items-start mb-4">
                                     <h4 className="font-bold flex items-center gap-2"><Zap className="text-blue-400" size={18}/> Telegram Bot</h4>
                                     <HoloButton variant="secondary" onClick={() => handleOpenIntegrationModal('telegram')} className="!py-1.5 !px-3 !text-xs">{t.configure}</HoloButton>
                                 </div>
                                 
                                 <div className="space-y-4">
                                     <div className="p-3 rounded bg-black/20 border border-gray-600/50 text-xs font-mono break-all">
                                         <p className="text-gray-500 mb-1">Webhook URL (Set this in BotFather):</p>
                                         <div className="flex items-center gap-2">
                                             <span className="text-cyan-400 flex-1">{webhookUrl}</span>
                                             <button onClick={copyWebhook} className="p-1 hover:bg-white/10 rounded"><Copy size={12}/></button>
                                         </div>
                                     </div>
                                     
                                     <div className="flex items-center justify-between">
                                         <span className="text-sm text-gray-400">{t.active}</span>
                                         <Toggle checked={localSettings.notifications.telegram} onChange={(v) => setLocalSettings((p) => ({ ...p, notifications: { ...p.notifications, telegram: v } }))} />
                                     </div>
                                 </div>
                             </div>

                             {/* WhatsApp Card */}
                             <div className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
                                 <div className="flex justify-between items-start mb-4">
                                     <h4 className="font-bold flex items-center gap-2"><Zap className="text-green-400" size={18}/> WhatsApp (Meta)</h4>
                                     <HoloButton variant="secondary" onClick={() => handleOpenIntegrationModal('whatsapp')} className="!py-1.5 !px-3 !text-xs">{t.configure}</HoloButton>
                                 </div>
                                  <div className="space-y-4">
                                      <p className="text-xs text-gray-500">Requires Meta Developer Account & WhatsApp Business API.</p>
                                      <div className="flex items-center justify-between">
                                         <span className="text-sm text-gray-400">{t.active}</span>
                                         <Toggle checked={localSettings.notifications.whatsapp} onChange={(v) => setLocalSettings((p) => ({ ...p, notifications: { ...p.notifications, whatsapp: v } }))} />
                                     </div>
                                  </div>
                             </div>
                         </div>
                    </div>

                    {/* Bank Connections */}
                    <div className="pt-8">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-semibold mb-1 text-lg">{lang === 'ar' ? 'الحسابات البنكية' : 'Banks & Exchange'}</h3>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                                    {lang === 'ar' ? 'إدارة حساباتك في البنوك وشركات الصرافة.' : 'Manage your accounts with banks and exchange companies.'}
                                </p>
                            </div>
                            <HoloButton icon={Landmark} onClick={() => { setIsBankModalOpen(true); setSelectedInstitution(null); }}>
                                {lang === 'ar' ? 'حساب جديد' : 'Add Account'}
                            </HoloButton>
                        </div>
                        
                        <div className="space-y-3">
                            {(localSettings.integrations.bankConnections || []).map(conn => (
                                <div key={conn.id} className={`p-3 rounded-lg flex items-center justify-between gap-4 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                            <Wallet size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{conn.bankName}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">#{conn.last4}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveBank(conn.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 size={16}/></button>
                                </div>
                            ))}
                            {(localSettings.integrations.bankConnections || []).length === 0 && (
                                <div className={`text-center p-6 rounded-lg border-2 border-dashed ${theme === 'dark' ? 'border-gray-700 text-gray-500' : 'border-slate-300 text-slate-400'}`}>
                                    {lang === 'ar' ? 'لم يتم إضافة أي حسابات بنكية بعد.' : 'No bank accounts added yet.'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI & SMTP Keys */}
                    <div className="pt-8">
                        <h3 className="font-semibold mb-4 text-lg">{t.integrationsKeys}</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div><label htmlFor="openai-key" className={labelClasses}>{t.openaiApiKey}</label><input id="openai-key" type="password" placeholder="sk-..." value={localSettings.integrations.ai?.openaiApiKey || ''} onChange={(e) => setLocalSettings(p => ({ ...p, integrations: { ...p.integrations, ai: { ...(p.integrations.ai || {}), openaiApiKey: e.target.value } } }))} className={inputClasses} /></div>
                            <div><label htmlFor="gemini-key" className={labelClasses}>{t.geminiApiKey}</label><input id="gemini-key" type="text" disabled placeholder={t.geminiConfiguredViaEnv} className={inputClasses} /></div>
                        </div>
                        
                        <div className="mt-6">
                             <h4 className="font-medium mb-2 text-sm text-gray-400">Email (SMTP)</h4>
                             <div className="grid md:grid-cols-2 gap-4">
                                <div><label className={labelClasses}>{t.smtpHost}</label><input value={localSettings.integrations.smtp?.host || ''} onChange={(e) => setLocalSettings(p => ({ ...p, integrations: { ...p.integrations, smtp: { ...(p.integrations.smtp || {}), host: e.target.value } } }))} className={inputClasses} /></div>
                                <div><label className={labelClasses}>{t.smtpUser}</label><input value={localSettings.integrations.smtp?.user || ''} onChange={(e) => setLocalSettings(p => ({ ...p, integrations: { ...p.integrations, smtp: { ...(p.integrations.smtp || {}), user: e.target.value } } }))} className={inputClasses} /></div>
                            </div>
                        </div>

                         <div className={`mt-6 p-3 rounded-lg border text-xs flex gap-2 ${alertClasses}`}>
                            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                            <span><strong>{lang === 'ar' ? 'ملاحظة أمان:' : 'Security Note:'}</strong>{' '}{lang === 'ar' ? 'تخزين المفاتيح هنا مناسب للتطوير فقط.' : 'Storing keys here is for development only.'}</span>
                        </div>
                    </div>
                </div>
            </div>
             
             {/* Bank Modal */}
             {isBankModalOpen && (
                <div className="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center p-4" onMouseDown={() => setIsBankModalOpen(false)}>
                    <div className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white'}`} onMouseDown={e => e.stopPropagation()}>
                        
                        {!selectedInstitution ? (
                            <>
                                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                                    <h3 className="text-xl font-bold">{lang === 'ar' ? 'اختر البنك أو شركة الصرافة' : t.selectYourBank}</h3>
                                    <button onClick={() => setIsBankModalOpen(false)}><X/></button>
                                </div>
                                <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                                    <button onClick={() => handleOpenBankModal()} className={`w-full p-4 text-left rounded-xl flex items-center justify-between transition-all group border-2 border-dashed ${theme === 'dark' ? 'bg-gray-800/50 border-cyan-500/50 hover:bg-gray-800' : 'bg-slate-50 border-cyan-300 hover:bg-slate-100'}`}>
                                         <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}><PlusCircle size={20} /></div>
                                            <div><span className="font-medium block">{lang === 'ar' ? 'إضافة بنك/صراف آخر' : 'Add Custom Institution'}</span></div>
                                        </div>
                                        <ArrowRightLeft size={16} className={`group-hover:text-cyan-400 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`} />
                                    </button>
                                    {financialInstitutions.map((inst, idx) => (
                                        <button key={idx} onClick={() => handleOpenBankModal(inst)} className={`w-full p-4 text-left rounded-xl flex items-center justify-between transition-all group ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-slate-50 hover:bg-slate-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${inst.type === 'bank' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>{inst.type === 'bank' ? <Building2 size={20} /> : <ArrowRightLeft size={20} />}</div>
                                                <span className="font-medium">{inst.name}</span>
                                            </div>
                                            <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                                    <h3 className="text-xl font-bold">{lang === 'ar' ? 'إدخال بيانات الحساب' : 'Enter Account Details'}</h3>
                                    <button onClick={() => setSelectedInstitution(null)} className="text-sm text-gray-400 hover:text-white">{lang === 'ar' ? 'رجوع' : 'Back'}</button>
                                </div>
                                <div className="space-y-4 flex-1 overflow-y-auto">
                                    {isCustom && (
                                         <>
                                            <div><Label>{lang === 'ar' ? 'اسم الجهة' : 'Institution Name'}</Label><Input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Ex: Elite Exchange" autoFocus/></div>
                                            <div><Label>{lang === 'ar' ? 'النوع' : 'Type'}</Label><Select value={customType} onChange={e => setCustomType(e.target.value as any)}><option value="bank">Bank</option><option value="exchange">Exchange</option></Select></div>
                                         </>
                                    )}
                                    <div><Label>{lang === 'ar' ? 'رقم الحساب' : 'Account Number'}</Label><Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="123456789" autoFocus={!isCustom}/></div>
                                    <div><Label>{t.currency}</Label><Select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)}>{settings.enabledCurrencies.map(c => <option key={c} value={c}>{c}</option>)}</Select></div>
                                    <div><Label>{lang === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Balance'}</Label><Input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} placeholder="0.00"/></div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end gap-3">
                                    <button onClick={() => setSelectedInstitution(null)} className="px-4 py-2 rounded-lg">{t.cancel}</button>
                                    <HoloButton icon={Save} variant="success" onClick={handleCreateManualAccount} disabled={isSaving}>{isSaving ? t.saving : (lang === 'ar' ? 'فتح الحساب' : 'Create Account')}</HoloButton>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            {/* Integration Modal (Telegram/WhatsApp) */}
            {isIntegrationModalOpen && (
                <IntegrationModal 
                    integrationType={integrationType}
                    isOpen={isIntegrationModalOpen}
                    onClose={() => setIsIntegrationModalOpen(false)}
                    onSave={handleSaveIntegration}
                    onTest={(data) => handleTest(data)}
                    initialData={localSettings.integrations}
                    theme={theme}
                    t={t}
                />
            )}
        </>
    );
};

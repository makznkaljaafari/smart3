import React from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { Toggle } from '../../../components/ui/Toggle';
import { HoloButton } from '../../../components/ui/HoloButton';
import { SettingsState, AppEvent } from '../../../types';
import { notifyAll } from '../../../lib/events';
import { Zap, AlertTriangle } from 'lucide-react';

interface IntegrationsSettingsProps {
  localSettings: SettingsState;
  setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  t: Record<string, string>;
  lang: 'ar' | 'en';
  theme: 'light' | 'dark';
}

export const IntegrationsSettings: React.FC<IntegrationsSettingsProps> = ({ localSettings, setLocalSettings, t, lang, theme }) => {
  const inputClasses = theme === 'dark'
    ? 'bg-gray-800 text-white border-gray-700 placeholder:text-gray-500'
    : 'bg-slate-50 text-slate-900 border-slate-300 placeholder:text-slate-400';
  
  const alertClasses = theme === 'dark'
    ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
    : 'bg-amber-100 border-amber-300 text-amber-800';
  
  const labelClasses = `block text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`;


  return (
    <>
      <SectionBox title={t.notifyChannels} theme={theme}>
        <div className="space-y-4">
          <div className="flex items-center justify-between"><span className={theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}>{t.whatsapp}</span><Toggle checked={localSettings.notifications.whatsapp} onChange={(v) => setLocalSettings((p) => ({ ...p, notifications: { ...p.notifications, whatsapp: v } }))} /></div>
          <div className="flex items-center justify-between"><span className={theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}>{t.telegram}</span><Toggle checked={localSettings.notifications.telegram} onChange={(v) => setLocalSettings((p) => ({ ...p, notifications: { ...p.notifications, telegram: v } }))} /></div>
        </div>
      </SectionBox>
      <div className="mt-6">
        <SectionBox title={t.integrationsKeys} theme={theme}>
          <div className="grid md:grid-cols-2 gap-4">
            <input aria-label="WhatsApp Webhook URL" placeholder="WHATSAPP_WEBHOOK_URL" value={localSettings.integrations.whatsappWebhookUrl || ''} onChange={(e) => setLocalSettings((p) => ({ ...p, integrations: { ...p.integrations, whatsappWebhookUrl: e.target.value } }))} className={`w-full rounded-lg p-2 border focus:ring-cyan-500 focus:border-cyan-500 ${inputClasses}`} />
            <input aria-label="WhatsApp API Key" placeholder="WHATSAPP_API_KEY" value={localSettings.integrations.whatsappApiKey || ''} onChange={(e) => setLocalSettings((p) => ({ ...p, integrations: { ...p.integrations, whatsappApiKey: e.target.value } }))} className={`w-full rounded-lg p-2 border focus:ring-cyan-500 focus:border-cyan-500 ${inputClasses}`} />
            <input aria-label="Telegram Bot Token" placeholder="TELEGRAM_BOT_TOKEN" value={localSettings.integrations.telegramBotToken || ''} onChange={(e) => setLocalSettings((p) => ({ ...p, integrations: { ...p.integrations, telegramBotToken: e.target.value } }))} className={`w-full rounded-lg p-2 border focus:ring-cyan-500 focus:border-cyan-500 ${inputClasses}`} />
            <input aria-label="Telegram Chat ID" placeholder="TELEGRAM_CHAT_ID" value={localSettings.integrations.telegramChatId || ''} onChange={(e) => setLocalSettings((p) => ({ ...p, integrations: { ...p.integrations, telegramChatId: e.target.value } }))} className={`w-full rounded-lg p-2 border focus:ring-cyan-500 focus:border-cyan-500 ${inputClasses}`} />
          </div>
          <div className={`mt-4 p-3 rounded-lg border text-xs flex gap-2 ${alertClasses}`}>
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>{lang === 'ar' ? 'ملاحظة أمان:' : 'Security Note:'}</strong>
              {' '}
              {lang === 'ar' ? 'تخزين المفاتيح هنا مناسب للتطوير فقط. في البيئة الإنتاجية، استخدم خادمًا وسيطًا (backend) لإدارة المفاتيح بأمان.' : 'Storing keys here is for development only. In production, use a secure backend proxy to manage secrets.'}
            </span>
          </div>
          <div className="mt-4">
            <HoloButton 
              icon={Zap} 
              variant="secondary" 
              onClick={async () => { 
                const e: AppEvent = { id: crypto.randomUUID(), type: 'DEBT_CREATED', payload: { customer: 'Demo', amount: 100, currency: 'SAR', dueDate: '2025-12-01' }, at: new Date().toISOString(), lang: lang }; 
                await notifyAll(e, localSettings); 
                alert('Test notifications sent (check webhook / Telegram).'); 
              }}>
                {t.sendDemo}
            </HoloButton>
          </div>
        </SectionBox>
      </div>
      <div className="mt-6">
        <SectionBox title={t.aiIntegrations} theme={theme}>
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="openai-key" className={labelClasses}>{t.openaiApiKey}</label>
                    <input
                        id="openai-key"
                        type="password"
                        placeholder="sk-..."
                        value={localSettings.integrations.ai?.openaiApiKey || ''}
                        onChange={(e) => setLocalSettings(p => ({ ...p, integrations: { ...p.integrations, ai: { ...(p.integrations.ai || {}), openaiApiKey: e.target.value } } }))}
                        className={`w-full rounded-lg p-2 border focus:ring-cyan-500 focus:border-cyan-500 ${inputClasses}`}
                    />
                </div>
                <div>
                    <label htmlFor="deepseek-key" className={labelClasses}>{t.deepseekApiKey}</label>
                    <input
                        id="deepseek-key"
                        type="password"
                        placeholder="sk-..."
                        value={localSettings.integrations.ai?.deepseekApiKey || ''}
                        onChange={(e) => setLocalSettings(p => ({ ...p, integrations: { ...p.integrations, ai: { ...(p.integrations.ai || {}), deepseekApiKey: e.target.value } } }))}
                        className={`w-full rounded-lg p-2 border focus:ring-cyan-500 focus:border-cyan-500 ${inputClasses}`}
                    />
                </div>
                <div>
                    <label htmlFor="gemini-key" className={labelClasses}>{t.geminiApiKey}</label>
                    <input
                        id="gemini-key"
                        type="text"
                        disabled
                        placeholder={t.geminiConfiguredViaEnv}
                        className={`w-full rounded-lg p-2 border focus:ring-cyan-500 focus:border-cyan-500 ${inputClasses} disabled:opacity-60 cursor-not-allowed`}
                    />
                </div>
            </div>
        </SectionBox>
      </div>
    </>
  );
};
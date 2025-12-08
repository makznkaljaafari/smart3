import React, { useState } from 'react';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { SettingsState } from '../../../types';
import { X, Save, Zap } from 'lucide-react';

interface IntegrationModalProps {
    integrationType: 'whatsapp' | 'telegram';
    isOpen: boolean;
    onClose: () => void;
    onSave: (type: 'whatsapp' | 'telegram', data: Partial<SettingsState['integrations']>) => void;
    onTest: (settings: SettingsState['integrations']) => Promise<void>;
    initialData: SettingsState['integrations'];
    theme: 'light' | 'dark';
    t: Record<string, string>;
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({
    integrationType, isOpen, onClose, onSave, onTest, initialData, theme, t
}) => {
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
        initialSize: { width: 640, height: 550 },
        minSize: { width: 450, height: 400 },
    });
    
    const [formData, setFormData] = useState(initialData);

    const handleSave = () => {
        let dataToSave: Partial<SettingsState['integrations']> = {};
        if (integrationType === 'whatsapp') {
            dataToSave = { 
                whatsappWebhookUrl: formData.whatsappWebhookUrl,
                whatsappApiKey: formData.whatsappApiKey
            };
        } else {
            dataToSave = {
                telegramBotToken: formData.telegramBotToken,
                telegramChatId: formData.telegramChatId
            };
        }
        onSave(integrationType, dataToSave);
    };
    
    const formInputClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;
    const labelClasses = `block text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
                className={`fixed rounded-2xl shadow-2xl w-full flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div
                    ref={headerRef}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'}`}
                >
                    <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.configure} {t[integrationType]}</h3>
                    <button onClick={onClose} className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-slate-200'} transition-colors`}><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <h4 className="text-lg font-semibold">{t.connectionDetails}</h4>
                    {integrationType === 'whatsapp' && (
                        <div className="space-y-4">
                            <div>
                                <label className={labelClasses}>{t.webhookUrl} *</label>
                                <input type="url" value={formData.whatsappWebhookUrl || ''} onChange={(e) => setFormData(p => ({...p, whatsappWebhookUrl: e.target.value}))} className={formInputClasses} placeholder="https://your-webhook-provider.com/..." />
                            </div>
                            <div>
                                <label className={labelClasses}>{t.apiKey}</label>
                                <input type="password" value={formData.whatsappApiKey || ''} onChange={(e) => setFormData(p => ({...p, whatsappApiKey: e.target.value}))} className={formInputClasses} placeholder="••••••••••••••••" />
                            </div>
                        </div>
                    )}
                    {integrationType === 'telegram' && (
                        <div className="space-y-4">
                            <div>
                                <label className={labelClasses}>{t.botToken} *</label>
                                <input type="password" value={formData.telegramBotToken || ''} onChange={(e) => setFormData(p => ({...p, telegramBotToken: e.target.value}))} className={formInputClasses} placeholder="123456:ABC-DEF1234..." />
                            </div>
                             <div>
                                <label className={labelClasses}>{t.chatId} *</label>
                                <input type="text" value={formData.telegramChatId || ''} onChange={(e) => setFormData(p => ({...p, telegramChatId: e.target.value}))} className={formInputClasses} placeholder="-100123456789" />
                            </div>
                        </div>
                    )}
                </div>

                <div className={`flex justify-between items-center gap-3 p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <HoloButton variant="secondary" icon={Zap} onClick={() => onTest(formData)}>{t.testConnection}</HoloButton>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-semibold ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'}`}>{t.cancel}</button>
                        <HoloButton variant="success" icon={Save} onClick={handleSave}>{t.saveChanges}</HoloButton>
                    </div>
                </div>
                 <div 
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                    className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 transition-colors"
                    title="Resize"
                 >
                    <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 0V16H0L16 0Z" fill="currentColor"/>
                    </svg>
                </div>
            </div>
        </div>
    );
};
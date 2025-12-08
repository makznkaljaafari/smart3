
import React, { useState } from 'react';
import { WebhookConfig, AppEventType } from '../../../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Globe, Key, Tag } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Toggle } from '../../../components/ui/Toggle';

interface WebhookFormModalProps {
    webhook: WebhookConfig | null;
    onClose: () => void;
    onSave: (webhook: WebhookConfig) => void;
    t: Record<string, string>;
    theme: 'light' | 'dark';
    lang: 'ar' | 'en';
}

const AVAILABLE_EVENTS: { id: AppEventType, label: string }[] = [
    { id: 'DEBT_CREATED', label: 'Debt Created' },
    { id: 'EXPENSE_CREATED', label: 'Expense Created' },
    { id: 'INCOME_CREATED', label: 'Income Created' },
    { id: 'CUSTOMER_CREATED', label: 'Customer Created' },
    { id: 'SALES_INVOICE_SEND', label: 'Sales Invoice Sent' },
    { id: 'LOW_STOCK_ALERT', label: 'Low Stock Alert' },
];

export const WebhookFormModal: React.FC<WebhookFormModalProps> = ({ webhook, onClose, onSave, t, theme, lang }) => {
    const isDark = theme === 'dark';
    const { modalRef, headerRef, position, size, handleDragStart } = useDraggableAndResizable({ initialSize: { width: 600, height: 650 } });

    const [formData, setFormData] = useState<WebhookConfig>(webhook || {
        id: crypto.randomUUID(),
        name: '',
        url: '',
        events: [],
        active: true,
        secret: '',
        headers: []
    });

    const [error, setError] = useState('');

    const handleToggleEvent = (eventId: AppEventType) => {
        setFormData(prev => {
            const events = prev.events.includes(eventId)
                ? prev.events.filter(e => e !== eventId)
                : [...prev.events, eventId];
            return { ...prev, events };
        });
    };

    const handleSave = () => {
        if (!formData.name || !formData.url) {
            setError(lang === 'ar' ? 'يرجى ملء الاسم والرابط.' : 'Name and URL are required.');
            return;
        }
        if (formData.events.length === 0) {
            setError(lang === 'ar' ? 'يرجى اختيار حدث واحد على الأقل.' : 'Select at least one event.');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/75 z-[60]" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 ${isDark ? 'bg-gray-900 border-pink-500/30' : 'bg-white border-pink-200'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Globe className="text-pink-500" />
                        {webhook ? (lang === 'ar' ? 'تعديل Webhook' : 'Edit Webhook') : (lang === 'ar' ? 'إضافة Webhook' : 'Add Webhook')}
                    </h3>
                    <button onClick={onClose}><X /></button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {error && <div className="p-3 rounded bg-red-500/10 text-red-400 text-sm">{error}</div>}
                    
                    <div>
                        <Label>{t.name || 'Name'}</Label>
                        <Input 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder="e.g. Zapier - New Expense"
                            autoFocus
                        />
                    </div>

                    <div>
                        <Label>Endpoint URL</Label>
                        <Input 
                            value={formData.url} 
                            onChange={e => setFormData({...formData, url: e.target.value})} 
                            placeholder="https://hooks.zapier.com/..."
                            dir="ltr"
                            className="font-mono text-sm"
                        />
                    </div>

                    <div>
                        <Label className="flex items-center gap-2"><Key size={14} /> Secret Key (Optional)</Label>
                        <Input 
                            value={formData.secret || ''} 
                            onChange={e => setFormData({...formData, secret: e.target.value})} 
                            placeholder="Signing Secret"
                            type="password"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used to sign the payload (HMAC-SHA256).</p>
                    </div>

                    <div>
                        <Label className="flex items-center gap-2 mb-3"><Tag size={14} /> Trigger Events</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {AVAILABLE_EVENTS.map(event => (
                                <div 
                                    key={event.id}
                                    onClick={() => handleToggleEvent(event.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                                        formData.events.includes(event.id) 
                                        ? (isDark ? 'bg-pink-500/20 border-pink-500/50 text-white' : 'bg-pink-50 border-pink-300 text-pink-900') 
                                        : (isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-slate-50 border-slate-200 text-gray-600 hover:bg-slate-100')
                                    }`}
                                >
                                    <span className="text-sm font-medium">{event.label}</span>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.events.includes(event.id) ? 'bg-pink-500 border-pink-500' : 'border-gray-500'}`}>
                                        {formData.events.includes(event.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700">
                        <Label className="mb-0">Active</Label>
                        <Toggle checked={formData.active} onChange={v => setFormData({...formData, active: v})} />
                    </div>
                </div>

                <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg">{t.cancel}</button>
                    <HoloButton variant="primary" icon={Save} onClick={handleSave}>
                        {t.save || 'Save'}
                    </HoloButton>
                </div>
            </div>
        </div>
    );
};

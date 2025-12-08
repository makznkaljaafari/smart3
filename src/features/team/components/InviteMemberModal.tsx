
import React, { useState } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Loader, Send } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Label } from '../../../components/ui/Label';
import { teamService } from '../../../services/teamService';
import { UserCompanyRole } from '../types';

interface InviteMemberModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ onClose, onSuccess }) => {
    const { theme, lang, addToast } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        addToast: state.addToast,
    }));
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 500, height: 480 }});
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserCompanyRole['role']>('employee');
    const [isSaving, setIsSaving] = useState(false);

    const handleInvite = async () => {
        if (!email.trim() || !password.trim()) {
            addToast({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان.', type: 'error' });
            return;
        }
        if (isSaving) return;

        setIsSaving(true);
        try {
            const { data, error: rpcError } = await teamService.inviteMember(email, role, password);
            
            if (rpcError) {
                addToast({ message: `An unexpected error occurred: ${rpcError.message}`, type: 'error' });
                return;
            }

            if (data && (data as any).error) {
                addToast({ message: `Failed to send invitation: ${(data as any).error}`, type: 'error' });
                return;
            }
            
            addToast({ message: t.invitationSent.replace('{email}', email), type: 'success' });
            onSuccess();

        } catch (e: any) {
            addToast({ message: `An unexpected error occurred: ${e.message || 'Unknown error'}`, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{
                    '--modal-x': `${position.x}px`,
                    '--modal-y': `${position.y}px`,
                    '--modal-width': `${size.width}px`,
                    '--modal-height': `${size.height}px`,
                } as React.CSSProperties}
                className={`fixed inset-0 md:inset-auto md:left-[var(--modal-x)] md:top-[var(--modal-y)] md:w-[var(--modal-width)] md:h-[var(--modal-height)] rounded-none md:rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} onTouchStart={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-xl font-bold">{t.inviteMember}</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={24}/></button>
                </div>
                
                <div className="flex-1 p-6 space-y-4">
                    <div>
                        <Label>{t.email}</Label>
                        <Input
                            type="email"
                            placeholder="member@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <Label>{t.password}</Label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>{t.role}</Label>
                        <Select value={role} onChange={e => setRole(e.target.value as UserCompanyRole['role'])}>
                            <option value="employee">{t.employee}</option>
                            <option value="manager">{t.manager}</option>
                            <option value="admin">{t.admin}</option>
                        </Select>
                    </div>
                </div>
                <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-semibold ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'}`}>{t.cancel}</button>
                    <HoloButton variant="primary" onClick={handleInvite} disabled={isSaving}>
                        {isSaving ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                        <span>{isSaving ? 'جاري الإرسال...' : t.sendInvite}</span>
                    </HoloButton>
                </div>

                 <div onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 hidden md:block" title="Resize"><svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg></div>
            </div>
        </div>
    );
};

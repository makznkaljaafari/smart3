
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Loader } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '../../../services/customerService';

interface ProjectFormModalProps {
    project: Project | null;
    onClose: () => void;
    onSave: (data: Partial<Project>) => Promise<void>;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ project, onClose, onSave }) => {
    const { theme, lang, currentCompany } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        currentCompany: state.currentCompany
    }));
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
        initialSize: { width: 600, height: 650 }
    });
    const isEdit = !!project;

    const [formData, setFormData] = useState<Partial<Project>>(project || {
        name: '',
        status: 'planning',
        budget: 0,
    });
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Customers for Dropdown
    const { data: customersData } = useQuery({
        queryKey: ['customers', currentCompany?.id],
        queryFn: () => customerService.getCustomersPaginated({ pageSize: 100 }), // Get top 100 or implement search
        enabled: !!currentCompany?.id
    });
    const customers = customersData?.data || [];

    const handleChange = (field: keyof Project, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleClientChange = (clientId: string) => {
        const client = customers.find(c => c.id === clientId);
        setFormData(prev => ({ ...prev, clientId, clientName: client?.name }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            // Add error handling
            return;
        }
        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    const statuses: ProjectStatus[] = ['planning', 'in_progress', 'completed', 'on_hold', 'cancelled', 'needs_review'];

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className="p-4 border-b border-gray-700 cursor-move flex justify-between items-center">
                    <h3 className="text-lg font-bold">{isEdit ? t.editProject : t.addProject}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <div>
                        <Label>{t.projectName} *</Label>
                        <Input value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
                    </div>
                    <div>
                        <Label>{t.description}</Label>
                        <Textarea value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>{t.projectStatus}</Label>
                            <Select value={formData.status} onChange={e => handleChange('status', e.target.value as ProjectStatus)}>
                                {statuses.map(s => <option key={s} value={s}>{t[s] || s}</option>)}
                            </Select>
                        </div>
                         <div>
                            <Label>{t.customer}</Label>
                            <Select value={formData.clientId || ''} onChange={e => handleClientChange(e.target.value)}>
                                <option value="">-- {t.none} --</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Select>
                        </div>
                         <div>
                            <Label>{t.startDate}</Label>
                            <Input type="date" value={formData.startDate || ''} onChange={e => handleChange('startDate', e.target.value)} />
                        </div>
                        <div>
                            <Label>{t.endDate}</Label>
                            <Input type="date" value={formData.endDate || ''} onChange={e => handleChange('endDate', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                            <Label>{t.budget}</Label>
                            <Input type="number" value={formData.budget || ''} onChange={e => handleChange('budget', parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800">{t.cancel}</button>
                    <HoloButton icon={isSaving ? Loader : Save} variant="success" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? 'جاري الحفظ...' : t.save}
                    </HoloButton>
                </div>
                <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400"><svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg></div>
            </div>
        </div>
    );
};

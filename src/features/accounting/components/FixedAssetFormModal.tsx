
import React, { useState, useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { FixedAsset, Account } from '../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Loader, Building } from 'lucide-react';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';

interface FixedAssetFormModalProps {
    asset?: FixedAsset | null;
    onClose: () => void;
    onSave: (asset: Partial<FixedAsset>) => Promise<void>;
}

export const FixedAssetFormModal: React.FC<FixedAssetFormModalProps> = ({ asset, onClose, onSave }) => {
    const { theme, lang, accounts, settings } = useZustandStore();
    const t = translations[lang];
    const isDark = theme === 'dark';
    const { modalRef, headerRef, position, size, handleDragStart } = useDraggableAndResizable({ initialSize: { width: 800, height: 750 } });
    const isEdit = !!asset;

    const [formData, setFormData] = useState<Partial<FixedAsset>>(asset || {
        name: '',
        assetNumber: `AST-${Date.now().toString().slice(-6)}`,
        purchaseDate: new Date().toISOString().split('T')[0],
        cost: 0,
        salvageValue: 0,
        usefulLifeMonths: 60, // 5 years default
        depreciationMethod: 'straight_line',
        status: 'active'
    });
    const [isSaving, setIsSaving] = useState(false);

    // Filter accounts for selection
    const assetAccounts = useMemo(() => accounts.filter(a => a.type === 'asset' && !a.isPlaceholder), [accounts]);
    const expenseAccounts = useMemo(() => accounts.filter(a => a.type === 'expense' && !a.isPlaceholder), [accounts]);
    // Accumulated Depreciation is usually a contra-asset (negative asset), but in our simple type system it might be asset or liability depending on user setup.
    // We show asset and liability accounts.
    const contraAccounts = useMemo(() => accounts.filter(a => (a.type === 'asset' || a.type === 'liability') && !a.isPlaceholder), [accounts]);

    const handleChange = (field: keyof FixedAsset, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.assetAccountId || !formData.depreciationExpenseAccountId) {
            alert('Please fill required fields');
            return;
        }
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const formControlClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 ${isDark ? 'bg-gray-900 border-cyan-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-xl font-bold">{isEdit ? 'تعديل أصل' : 'إضافة أصل جديد'}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    {/* Basic Info */}
                    <section>
                        <h4 className="font-bold mb-3 text-cyan-400 border-b border-gray-700 pb-1">معلومات الأصل</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>اسم الأصل *</Label><Input value={formData.name} onChange={e => handleChange('name', e.target.value)} className={formControlClasses}/></div>
                            <div><Label>رقم الأصل (Tag ID)</Label><Input value={formData.assetNumber} onChange={e => handleChange('assetNumber', e.target.value)} className={formControlClasses}/></div>
                            <div><Label>تاريخ الشراء</Label><Input type="date" value={formData.purchaseDate} onChange={e => handleChange('purchaseDate', e.target.value)} className={formControlClasses}/></div>
                            <div><Label>الحالة</Label>
                                <Select value={formData.status} onChange={e => handleChange('status', e.target.value)} className={formControlClasses}>
                                    <option value="active">نشط</option>
                                    <option value="sold">مباع</option>
                                    <option value="disposed">مستهلك/تالف</option>
                                </Select>
                            </div>
                        </div>
                    </section>

                    {/* Valuation */}
                    <section>
                        <h4 className="font-bold mb-3 text-green-400 border-b border-gray-700 pb-1">التقييم والإهلاك</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><Label>تلفة الشراء *</Label><Input type="number" value={formData.cost} onChange={e => handleChange('cost', parseFloat(e.target.value))} className={formControlClasses}/></div>
                            <div><Label>قيمة الخردة (Salvage) *</Label><Input type="number" value={formData.salvageValue} onChange={e => handleChange('salvageValue', parseFloat(e.target.value))} className={formControlClasses}/></div>
                            <div><Label>العمر الافتراضي (شهر) *</Label><Input type="number" value={formData.usefulLifeMonths} onChange={e => handleChange('usefulLifeMonths', parseInt(e.target.value))} className={formControlClasses}/></div>
                        </div>
                    </section>

                    {/* Accounting Mapping */}
                    <section>
                        <h4 className="font-bold mb-3 text-orange-400 border-b border-gray-700 pb-1 flex items-center gap-2"><Building size={16}/> التوجيه المحاسبي</h4>
                        <div className="space-y-4">
                            <div>
                                <Label>حساب الأصل (Asset Account) *</Label>
                                <Select value={formData.assetAccountId || ''} onChange={e => handleChange('assetAccountId', e.target.value)} className={formControlClasses}>
                                    <option value="">-- اختر حساب --</option>
                                    {assetAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.accountNumber})</option>)}
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">الحساب الذي تظهر فيه قيمة الأصل في الميزانية.</p>
                            </div>
                            <div>
                                <Label>حساب مصروف الإهلاك (Expense Account) *</Label>
                                <Select value={formData.depreciationExpenseAccountId || ''} onChange={e => handleChange('depreciationExpenseAccountId', e.target.value)} className={formControlClasses}>
                                    <option value="">-- اختر حساب --</option>
                                    {expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.accountNumber})</option>)}
                                </Select>
                            </div>
                             <div>
                                <Label>حساب مجمع الإهلاك (Accumulated Depr.) *</Label>
                                <Select value={formData.accumulatedDepreciationAccountId || ''} onChange={e => handleChange('accumulatedDepreciationAccountId', e.target.value)} className={formControlClasses}>
                                    <option value="">-- اختر حساب --</option>
                                    {contraAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.accountNumber})</option>)}
                                </Select>
                            </div>
                        </div>
                    </section>
                </div>

                <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 text-white">{t.cancel}</button>
                    <HoloButton variant="success" icon={isSaving ? Loader : Save} onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? 'جاري الحفظ...' : 'حفظ الأصل'}
                    </HoloButton>
                </div>
            </div>
        </div>
    );
};

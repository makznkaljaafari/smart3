
import React, { useState, useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { Income, IncomeCategory, CurrencyCode, IncomeStatus } from '../types';
import { RecurrenceType } from '../../expenses/types';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { X, Save, BookCopy, Sparkles, Loader, BarChart3, Tag, Zap, Briefcase } from 'lucide-react';
import { Toggle } from '../../../components/ui/Toggle';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { CustomerSupplierSearch } from '../../invoices/components/CustomerSupplierSearch';
import { currencyLabels } from '../../../lib/i18n';
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';

const INCOME_CATEGORY_CONFIG: Record<IncomeCategory, { label: string; icon: React.ElementType }> = {
    product_sales: { label: 'مبيعات منتجات', icon: Tag },
    service_fees: { label: 'رسوم خدمات', icon: BarChart3 },
    consulting: { label: 'استشارات', icon: BarChart3 },
    rentals: { label: 'إيجارات', icon: BarChart3 },
    refunds: { label: 'استردادات', icon: BarChart3 },
    other: { label: 'أخرى', icon: BarChart3 },
};

export const IncomeFormModal: React.FC<{ income?: Income; onClose: () => void; onSave: (data: Partial<Income>) => Promise<void>; t: any; theme: 'dark' | 'light' }> = ({ income, onClose, onSave, t, theme }) => {
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 896, height: 800 } });
    const { accounts, lang, projects, settings } = useZustandStore(state => ({
        accounts: state.accounts,
        lang: state.lang,
        projects: state.projects,
        settings: state.settings,
    }));
    const isEdit = !!income;
    const [formData, setFormData] = useState<Partial<Income>>(income || { 
        title: '', 
        amount: 0, 
        currency: settings.baseCurrency, 
        date: new Date().toISOString().split('T')[0], 
        category: 'product_sales', 
        source: '', 
        status: 'received',
        recurrence: 'none', 
        isRecurringTemplate: false 
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSuggestingAccounts, setIsSuggestingAccounts] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (field: keyof Income, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({...prev, [field]: ''}));
    };

    const getAccountSuggestions = async () => {
      if (!formData.title?.trim()) return;
      setIsSuggestingAccounts(true);
      try {
        const revenueAccounts = accounts.filter(a => a.type === 'revenue' && !a.isPlaceholder).map(a => ({ id: a.id, name: a.name }));
        const assetAccounts = accounts.filter(a => a.type === 'asset' && !a.isPlaceholder).map(a => ({ id: a.id, name: a.name }));
        
        const prompt = `Given the income title "${formData.title}", suggest the most appropriate income account and deposit account from the provided lists.
        
        Available Income Accounts:
        ${JSON.stringify(revenueAccounts)}
        
        Available Deposit Accounts:
        ${JSON.stringify(assetAccounts)}
        
        Respond with a single, valid JSON object in the format: {"incomeAccountId": "ID_HERE", "depositAccountId": "ID_HERE"}.`;

        const text = await callAIProxy(prompt, { responseMimeType: "application/json" });
        
        if (text) {
             const result = JSON.parse(cleanJsonString(text));
            if (result.incomeAccountId) {
              handleChange('incomeAccountId', result.incomeAccountId);
            }
            if (result.depositAccountId) {
              handleChange('depositAccountId', result.depositAccountId);
            }
        }
      } catch (e) {
        console.error("Account suggestion failed:", e);
      } finally {
        setIsSuggestingAccounts(false);
      }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title?.trim()) newErrors.title = 'العنوان مطلوب';
        if (!formData.amount || formData.amount <= 0) newErrors.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
        if (!formData.date) newErrors.date = 'التاريخ مطلوب';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (validate() && !isSaving) {
            setIsSaving(true);
            try {
                await onSave(formData);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const formInputClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;
    const labelClasses = `block text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`;
    
    const revenueAccounts = accounts.filter(a => a.type === 'revenue' && !a.isPlaceholder);
    
    const { connectedAccounts, otherAssetAccounts } = useMemo(() => {
        const assets = accounts.filter(a => a.type === 'asset' && !a.isPlaceholder);
        const connectedNames = new Set(settings.integrations.bankConnections?.map(c => c.bankName) || []);
        
        const connected = assets.filter(a => connectedNames.has(a.name) || a.name.includes('بنك') || a.name.includes('Bank') || a.name.includes('صراف'));
        const others = assets.filter(a => !connected.includes(a));
        
        return { connectedAccounts: connected, otherAssetAccounts: others };
    }, [accounts, settings.integrations.bankConnections]);


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onMouseDown={onClose}>
            <div ref={modalRef} style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }} className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-slate-50 border'}`} onMouseDown={e => e.stopPropagation()}>
                <div ref={headerRef} onMouseDown={handleDragStart} onTouchStart={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-2xl font-bold">{isEdit ? 'تعديل إيراد' : 'إضافة إيراد جديد'}</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={24} /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div><label className={labelClasses}>العنوان *</label><input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} className={formInputClasses}/>{errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}</div>
                        
                        <div>
                            <Label>العميل (اختياري)</Label>
                            <CustomerSupplierSearch 
                                type="customer" 
                                t={t}
                                initialName={formData.customerName}
                                onSelect={(customer) => {
                                    handleChange('customerId', customer?.id);
                                    handleChange('customerName', customer?.name);
                                    if(customer && !formData.source) handleChange('source', customer.name);
                                }}
                            />
                        </div>

                        <div><label className={labelClasses}>المصدر (نص حر)</label><input type="text" value={formData.source || ''} onChange={e => handleChange('source', e.target.value)} className={formInputClasses}/></div>
                        <div><label className={labelClasses}>المبلغ *</label><input type="number" value={formData.amount} onChange={e => handleChange('amount', parseFloat(e.target.value))} className={formInputClasses}/>{errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}</div>
                        
                        <div>
                            <label className={labelClasses}>العملة</label>
                            <select value={formData.currency} onChange={e => handleChange('currency', e.target.value as CurrencyCode)} className={formInputClasses}>
                                {settings.enabledCurrencies.map(c => {
                                   const label = currencyLabels[c] ? currencyLabels[c][lang] : c;
                                   return <option key={c} value={c}>{label} ({c})</option>;
                                })}
                            </select>
                        </div>

                        <div><label className={labelClasses}>التاريخ *</label><input type="date" value={formData.date?.split('T')[0]} onChange={e => handleChange('date', e.target.value)} className={formInputClasses}/>{errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}</div>
                        <div><label className={labelClasses}>الفئة</label><select value={formData.category} onChange={e => handleChange('category', e.target.value as IncomeCategory)} className={formInputClasses}>{Object.entries(INCOME_CATEGORY_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
                        
                        <div>
                            <label className={labelClasses}>الحالة</label>
                            <select value={formData.status} onChange={e => handleChange('status', e.target.value as IncomeStatus)} className={formInputClasses}>
                                <option value="received">مقبوض (Received)</option>
                                <option value="pending">قيد الانتظار (Pending)</option>
                                <option value="draft">مسودة (Draft)</option>
                                <option value="cancelled">ملغي (Cancelled)</option>
                            </select>
                        </div>

                        <div className="md:col-span-2"><label className={labelClasses}>رقم الفاتورة/الإيصال</label><input type="text" value={formData.invoiceNumber || ''} onChange={e => handleChange('invoiceNumber', e.target.value)} className={formInputClasses}/></div>
                    </div>
                    
                     <section>
                        <h4 className="text-lg font-bold mb-4 text-white flex items-center gap-2"><Briefcase className="text-cyan-400" /> {t.project}</h4>
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
                            <Label>ربط الإيراد بمشروع</Label>
                            <Select
                                value={formData.projectId || ''}
                                onChange={e => handleChange('projectId', e.target.value || undefined)}
                            >
                                <option value="">-- {t.none} --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </Select>
                        </div>
                    </section>
                    
                     <section>
                        <h4 className="text-lg font-bold mb-4 text-white flex items-center gap-2"><Zap className="text-cyan-400" /> الأتمتة</h4>
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
                            <div className="flex items-center justify-between">
                                <Label className="mb-0">إنشاء إيراد متكرر تلقائيًا من هذا القالب</Label>
                                <Toggle
                                    checked={formData.isRecurringTemplate || false}
                                    onChange={value => handleChange('isRecurringTemplate', value)}
                                />
                            </div>
                            {formData.isRecurringTemplate && (
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <Label>{t.recurrence}</Label>
                                    <Select
                                        value={formData.recurrence || 'none'}
                                        onChange={e => handleChange('recurrence', e.target.value as RecurrenceType)}
                                    >
                                        <option value="none" disabled>{t.none}</option>
                                        <option value="daily">{t.daily}</option>
                                        <option value="weekly">{t.weekly}</option>
                                        <option value="monthly">{t.monthly}</option>
                                        <option value="yearly">{t.yearly}</option>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </section>

                     <section>
                        <h4 className="text-lg font-bold mb-4 text-white flex items-center justify-between">
                          <span className="flex items-center gap-2"><BookCopy className="text-cyan-400" /> {t.accountingLink}</span>
                           <button type="button" onClick={getAccountSuggestions} disabled={isSuggestingAccounts || !formData.title} className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50">
                            {isSuggestingAccounts ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isSuggestingAccounts ? t.suggesting : t.suggestAccounts}
                          </button>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>{t.incomeAccountCredit}</label>
                                <select value={formData.incomeAccountId || ''} onChange={e => handleChange('incomeAccountId', e.target.value)} className={formInputClasses}>
                                    <option value="">{t.selectAnAccount}</option>
                                    {revenueAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>{t.depositAccountDebit}</label>
                                <select value={formData.depositAccountId || ''} onChange={e => handleChange('depositAccountId', e.target.value)} className={formInputClasses}>
                                    <option value="">{t.selectAnAccount}</option>
                                    {connectedAccounts.length > 0 && (
                                        <optgroup label="البنوك والصرافات المرتبطة">
                                            {connectedAccounts.map(acc => <option key={acc.id} value={acc.id}>🏦 {acc.name}</option>)}
                                        </optgroup>
                                    )}
                                    <optgroup label="حسابات أخرى">
                                        {otherAssetAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                    </section>
                    <div><label className={labelClasses}>ملاحظات</label><textarea value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} rows={3} className={formInputClasses} /></div>
                </div>
                <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-semibold ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'}`}>{t.cancel}</button>
                    <HoloButton variant="success" icon={isSaving ? Loader : Save} onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (isEdit ? t.saveChanges : 'إضافة الإيراد')}
                    </HoloButton>
                </div>
                <div onMouseDown={handleDragStart} onTouchStart={handleDragStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400"><svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg></div>
            </div>
        </div>
    );
};

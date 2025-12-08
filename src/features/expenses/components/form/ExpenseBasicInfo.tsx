
import React from 'react';
import { Expense, ExpenseCategory, CurrencyCode } from '../../types';
import { translations } from '../../../../lib/i18n';
import { useZustandStore } from '../../../../store/useStore';
import { CATEGORY_CONFIG } from '../../lib/utils';
import { CustomerSupplierSearch } from '../../../invoices/components/CustomerSupplierSearch';
import { Label } from '../../../../components/ui/Label';
import { Input } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import { Select } from '../../../../components/ui/Select';
import { Loader, Sparkles } from 'lucide-react';

interface ExpenseBasicInfoProps {
    formData: Partial<Expense>;
    errors: Record<string, string>;
    onChange: (field: keyof Expense, value: any) => void;
    isSuggestingCategory: boolean;
    formInputClasses: string;
}

export const ExpenseBasicInfo: React.FC<ExpenseBasicInfoProps> = ({ 
    formData, errors, onChange, isSuggestingCategory, formInputClasses 
}) => {
    const { lang } = useZustandStore();
    const t = translations[lang];

    return (
        <section>
            <h4 className="text-lg font-bold mb-4 text-white">{t.basicInfo}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>{t.expenseTitle} *</Label>
                    <Input 
                        type="text" 
                        value={formData.title || ''} 
                        onChange={e => onChange('title', e.target.value)} 
                        className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>
                <div>
                    <Label>{t.expenseCategory}</Label>
                    <div className="relative">
                        <Select 
                            value={formData.category || 'parts'} 
                            onChange={e => onChange('category', e.target.value as ExpenseCategory)}
                        >
                            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
                        </Select>
                        {isSuggestingCategory ? (
                            <Loader size={16} className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-purple-400" />
                        ) : (
                            <Sparkles size={16} className="absolute right-8 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                        )}
                    </div>
                </div>
                <div>
                    <Label>{t.expenseAmount} *</Label>
                    <Input 
                        type="number" 
                        value={formData.amount || ''} 
                        onChange={e => onChange('amount', parseFloat(e.target.value))} 
                        className={errors.amount ? 'border-red-500' : ''}
                    />
                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                </div>
                <div>
                    <Label>{t.currency}</Label>
                    <Select 
                        value={formData.currency} 
                        onChange={e => onChange('currency', e.target.value as CurrencyCode)}
                    >
                        <option value="SAR">SAR</option>
                        <option value="USD">USD</option>
                        <option value="YER">YER</option>
                    </Select>
                </div>
                <div>
                    <Label>{t.expenseDate} *</Label>
                    <Input 
                        type="date" 
                        value={formData.date?.split('T')[0] || ''} 
                        onChange={e => onChange('date', e.target.value)}
                        className={errors.date ? 'border-red-500' : ''}
                    />
                    {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                </div>
                <div>
                    <Label>{t.supplierName}</Label>
                    <CustomerSupplierSearch
                        type="supplier"
                        onSelect={(supplier) => {
                            onChange('supplierId', supplier?.id);
                            onChange('supplierName', supplier?.name);
                        }}
                        initialName={formData.supplierName}
                        t={t}
                    />
                </div>
            </div>
            <div className="mt-4">
                <Label>{t.expenseDescription}</Label>
                <Textarea 
                    value={formData.description || ''} 
                    onChange={e => onChange('description', e.target.value)} 
                    rows={2} 
                />
            </div>
        </section>
    );
};

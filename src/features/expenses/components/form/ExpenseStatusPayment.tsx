
import React from 'react';
import { Expense, ExpenseStatus, ExpensePriority, PaymentMethod } from '../../types';
import { translations } from '../../../../lib/i18n';
import { useZustandStore } from '../../../../store/useStore';
import { Label } from '../../../../components/ui/Label';
import { Select } from '../../../../components/ui/Select';
import { Briefcase } from 'lucide-react';

interface ExpenseStatusPaymentProps {
    formData: Partial<Expense>;
    onChange: (field: keyof Expense, value: any) => void;
    formInputClasses: string;
}

export const ExpenseStatusPayment: React.FC<ExpenseStatusPaymentProps> = ({ 
    formData, onChange, formInputClasses 
}) => {
    const { lang, projects, theme } = useZustandStore();
    const t = translations[lang];

    return (
        <>
            <section>
                <h4 className="text-lg font-bold mb-4 text-white">{t.statusAndPayment}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>{t.status}</Label>
                        <Select value={formData.status} onChange={e => onChange('status', e.target.value as ExpenseStatus)}>
                            {['pending', 'approved', 'paid', 'rejected', 'cancelled'].map(s => (
                                <option key={s} value={s}>{t[s]}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label>{t.priority}</Label>
                        <Select value={formData.priority} onChange={e => onChange('priority', e.target.value as ExpensePriority)}>
                            {['low', 'medium', 'high', 'urgent'].map(p => (
                                <option key={p} value={p}>{t[p]}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label>{t.paymentMethod}</Label>
                        <Select value={formData.paymentMethod || 'cash'} onChange={e => onChange('paymentMethod', e.target.value as PaymentMethod)}>
                            <option value="cash">نقداً</option>
                            <option value="credit_card">بطاقة</option>
                            <option value="cheque">شيك</option>
                            <option value="bank_transfer">تحويل بنكي</option>
                            <option value="exchange">صرافة</option>
                            <option value="credit">آجل</option>
                        </Select>
                    </div>
                </div>
            </section>

            <section>
                <h4 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                    <Briefcase className="text-cyan-400" size={20} /> {t.project}
                </h4>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
                    <Label>ربط المصروف بمشروع</Label>
                    <Select
                        value={formData.projectId || ''}
                        onChange={e => onChange('projectId', e.target.value || undefined)}
                    >
                        <option value="">-- {t.none} --</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </Select>
                </div>
            </section>
        </>
    );
};

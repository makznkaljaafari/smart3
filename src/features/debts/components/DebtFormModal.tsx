
import React, { useState, useEffect } from 'react';
import { Debt, CurrencyCode, Customer } from '../../../types';
import { X, Save, User, DollarSign, FileText } from 'lucide-react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { useZustandStore } from '../../../store/useStore';
import { currencyLabels } from '../../../lib/i18n';
import { customerService } from '../../../services/customerService';
import { useQuery } from '@tanstack/react-query';

interface DebtFormModalProps {
  debt?: Debt;
  onClose: () => void;
  onSave: (debt: Partial<Debt>) => Promise<void>;
}

export const DebtFormModal: React.FC<DebtFormModalProps> = ({ debt, onClose, onSave }) => {
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
    initialSize: { width: 896, height: 720 },
    minSize: { width: 600, height: 500 }
  });
  const isEdit = !!debt;
  const { settings, lang, currentCompany } = useZustandStore(state => ({ 
    settings: state.settings,
    lang: state.lang,
    currentCompany: state.currentCompany
  }));
  
  const [formData, setFormData] = useState<Partial<Debt>>({
    ...debt,
    currency: debt?.currency || settings.baseCurrency,
    createdDate: debt?.createdDate || new Date().toISOString().split('T')[0],
    status: debt?.status || 'pending',
    payments: debt?.payments || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (debt?.customerName) {
      setCustomerSearch(debt.customerName);
    }
  }, [debt]);

  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const { data: customerResults } = useQuery({
      queryKey: ['customerSearch', debouncedSearch, currentCompany?.id],
      queryFn: async () => {
          if (!debouncedSearch) return [];
          const res = await customerService.getCustomersPaginated({ search: debouncedSearch, pageSize: 5 });
          return res.data;
      },
      enabled: !!currentCompany?.id && debouncedSearch.length > 0 && isDropdownOpen
  });

  const filteredCustomers = customerResults || [];

  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerCompany: customer.company
    }));
    setCustomerSearch(customer.name);
    setIsDropdownOpen(false);
    if (errors.customerId) setErrors(prev => ({ ...prev, customerId: '' }));
  };
  
  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearch(e.target.value);
    setIsDropdownOpen(true);
    if (formData.customerId && e.target.value !== formData.customerName) {
        setFormData(prev => ({
            ...prev,
            customerId: undefined,
            customerName: '',
            customerPhone: '',
            customerEmail: '',
            customerCompany: ''
        }));
    }
  };


  const handleChange = (field: keyof Debt, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'amount' || field === 'paidAmount') {
        const amount = field === 'amount' ? Number(value) : (updated.amount || 0);
        const paidAmount = field === 'paidAmount' ? Number(value) : (updated.paidAmount || 0);
        updated.remainingAmount = amount - paidAmount;
        if (paidAmount === 0) updated.status = 'pending';
        else if (paidAmount >= amount) updated.status = 'paid';
        else updated.status = 'partial';
      }
      return updated;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerId) newErrors.customerId = 'يجب اختيار العميل';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'المبلغ مطلوب وأكبر من صفر';
    if (!formData.dueDate) newErrors.dueDate = 'تاريخ الاستحقاق مطلوب';
    if (!formData.description?.trim()) newErrors.description = 'وصف الدين مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSaving) return;
    setIsSaving(true);
    try {
      await onSave({
        id: debt?.id,
        ...formData,
      });
      onClose();
    } catch (error: any) {
      console.error("Failed to save debt:", error.message || error);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = (field: keyof Debt | 'customerId') =>
    `w-full px-4 py-2.5 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white ${
      errors[field] ? 'border-red-500/50' : 'border-gray-700'
    }`;
    
  const labelClass = "block text-sm font-medium text-gray-300 mb-2";

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
        className="fixed inset-0 lg:inset-auto lg:left-[var(--modal-x)] lg:top-[var(--modal-y)] lg:w-[var(--modal-width)] lg:h-[var(--modal-height)] bg-gray-900 rounded-none lg:rounded-2xl flex flex-col border-2 border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.3)]" 
        onMouseDown={e => e.stopPropagation()}
      >
        <div 
          ref={headerRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="bg-gray-800 text-white p-6 border-b border-cyan-500/30 cursor-move"
        >
          <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{isEdit ? 'تعديل دين' : 'إضافة دين جديد'}</h2><button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-6 h-6" /></button></div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="overflow-y-auto flex-1 p-6 space-y-6">
          <section>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><User className="w-5 h-5 text-cyan-400" /> معلومات العميل</h3>
            <div>
              <label className={labelClass}>العميل *</label>
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={handleCustomerSearchChange}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  className={inputClass('customerId')}
                  placeholder="ابحث عن عميل..."
                />
                {isDropdownOpen && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.map((c: any) => (
                        <div key={c.id} onMouseDown={() => handleCustomerSelect(c)} className="p-3 hover:bg-gray-700 cursor-pointer">
                          <p className="font-semibold text-white">{c.name}</p>
                          <p className="text-sm text-gray-400">{c.phone}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {errors.customerId && <p className="mt-1 text-sm text-red-400">{errors.customerId}</p>}
            </div>
          </section>
          
          <section>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-cyan-400" /> المعلومات المالية</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>المبلغ الكلي *</label>
                <input type="number" value={formData.amount || ''} onChange={(e) => handleChange('amount', parseFloat(e.target.value))} className={inputClass('amount')} min="0"/>
                {errors.amount && <p className="mt-1 text-sm text-red-400">{errors.amount}</p>}
              </div>
              <div>
                <label className={labelClass}>العملة *</label>
                <select value={formData.currency} onChange={(e) => handleChange('currency', e.target.value as CurrencyCode)} className={inputClass('currency')}>
                  {settings.enabledCurrencies.map(c => {
                       const label = currencyLabels[c] ? currencyLabels[c][lang] : c;
                       return <option key={c} value={c}>{label} ({c})</option>;
                  })}
                </select>
              </div>
              <div>
                <label className={labelClass}>المدفوع</label>
                <input type="number" value={formData.paidAmount || ''} onChange={(e) => handleChange('paidAmount', parseFloat(e.target.value))} className={inputClass('paidAmount')} min="0"/>
              </div>
              <div>
                <label className={labelClass}>المتبقي</label>
                <input type="number" value={formData.remainingAmount || 0} className="w-full px-4 py-2.5 border border-gray-700 rounded-lg bg-gray-800" readOnly />
              </div>
            </div>
          </section>

          <section><h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" /> تفاصيل الدين</h3><div className="grid md:grid-cols-2 gap-4"><div><label className={labelClass}>تاريخ الاستحقاق *</label><input type="date" value={formData.dueDate || ''} onChange={(e) => handleChange('dueDate', e.target.value)} className={inputClass('dueDate')}/>{errors.dueDate && <p className="mt-1 text-sm text-red-400">{errors.dueDate}</p>}</div><div><label className={labelClass}>رقم الفاتورة (اختياري)</label><input type="text" value={formData.invoiceNumber || ''} onChange={(e) => handleChange('invoiceNumber', e.target.value)} className={inputClass('invoiceNumber')}/></div><div className="md:col-span-2"><label className={labelClass}>الوصف *</label><input type="text" value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} className={inputClass('description')}/>{errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}</div><div className="md:col-span-2"><label className={labelClass}>ملاحظات</label><textarea value={formData.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} rows={3} className={inputClass('notes')}/></div></div></section>
        </form>
        <div className="mt-auto border-t border-cyan-500/30 p-4">
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-700 font-semibold transition-colors">إلغاء</button>
            <HoloButton variant="success" icon={Save} onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'جاري الحفظ...' : (isEdit ? 'حفظ التغييرات' : 'إضافة الدين')}</HoloButton>
          </div>
        </div>
         <div 
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 transition-colors hidden md:block"
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

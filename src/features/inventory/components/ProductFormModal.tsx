
import React, { useState, useCallback } from 'react';
import { Product, CurrencyCode } from '../../../types';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { useZustandStore } from '../../../store/useStore';
import { X, Save, Sparkles, Loader, Brain, Plus } from 'lucide-react';
import { translations } from '../../../lib/i18n';
import { suggestProductDetails } from '../../../services/aiService';

interface ProductFormModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, onClose, onSave }) => {
  const { theme, lang, settings, addToast } = useZustandStore(state => ({
      theme: state.theme,
      lang: state.lang,
      settings: state.settings,
      addToast: state.addToast,
  }));
  const t = translations[lang];
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 900, height: 800 } });
  const isEdit = !!product;
  const isDark = theme.startsWith('dark');

  const [formData, setFormData] = useState<Partial<Product>>(product || {
    name: '', 
    nameAr: '',
    nameEn: '',
    sku: '', 
    currency: settings.baseCurrency, 
    costPrice: 0, 
    sellingPrice: 0, 
    category: '',
    itemNumber: '',
    manufacturer: '',
    size: '',
    compatibleVehicles: [],
    alternativePartNumbers: [],
    imageUrl: '',
    specifications: '',
    serialNumber: `SN-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`
  });
  
  // Helper state for array inputs (comma separated)
  const [vehiclesInput, setVehiclesInput] = useState(formData.compatibleVehicles?.join(', ') || '');
  const [altNumbersInput, setAltNumbersInput] = useState(formData.alternativePartNumbers?.join(', ') || '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleChange = useCallback((field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors]);

  const handleSuggestDetails = useCallback(async () => {
    if (!formData.name?.trim()) return;
    setIsSuggesting(true);
    
    try {
        const result = await suggestProductDetails(formData.name);
        if (result) {
            if (result.description) handleChange('description', result.description);
            if (result.categoryId) handleChange('category', result.categoryId);
            addToast({ message: 'تم استلام الاقتراحات بنجاح.', type: 'success' });
        } else {
            addToast({ message: t.aiSuggestionFailed || 'Failed to get suggestion.', type: 'error' });
        }
    } catch (e) {
        console.error("Error fetching suggestions:", e);
        addToast({ message: 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي.', type: 'error' });
    } finally {
        setIsSuggesting(false);
    }
  }, [formData.name, handleChange, addToast, t]);


  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'اسم المادة مطلوب';
    if (isEdit && !formData.sku?.trim()) newErrors.sku = 'كود المادة (SKU) مطلوب';
    if (!formData.sellingPrice || formData.sellingPrice <= 0) newErrors.sellingPrice = 'سعر البيع مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSaving) return;
    setIsSaving(true);
    try {
        // Process array inputs
        const processedData = {
            ...formData,
            compatibleVehicles: vehiclesInput.split(',').map(s => s.trim()).filter(Boolean),
            alternativePartNumbers: altNumbersInput.split(',').map(s => s.trim()).filter(Boolean),
        };
        await onSave(processedData);
    } finally {
      setIsSaving(false);
    }
  };

  const formInputClasses = `w-full rounded-lg p-3 border focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${isDark ? 'bg-gray-800 text-white border-gray-700 disabled:opacity-50 placeholder-gray-500' : 'bg-white text-slate-800 border-slate-300 disabled:bg-slate-100 placeholder-slate-400'}`;
  const labelClasses = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        ref={modalRef}
        style={{
            '--modal-x': `${position.x}px`,
            '--modal-y': `${position.y}px`,
            '--modal-width': `${size.width}px`,
            '--modal-height': `${size.height}px`,
        } as React.CSSProperties}
        className={`fixed inset-0 lg:inset-auto lg:left-[var(--modal-x)] lg:top-[var(--modal-y)] lg:w-[var(--modal-width)] lg:h-[var(--modal-height)] rounded-none lg:rounded-2xl shadow-2xl flex flex-col animate-modal-enter border-2 ${isDark ? 'bg-gray-900 border-cyan-500/30' : 'bg-white border-slate-200'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${isDark ? 'border-gray-700 bg-gray-800/80' : 'border-slate-200 bg-slate-50'}`}>
          <h3 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isEdit ? <span className="text-cyan-400"><Sparkles size={24}/></span> : <span className="text-green-400"><Plus size={24}/></span>}
              {isEdit ? t.editItem : t.addItem}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20 transition-colors"><X size={24} /></button>
        </div>
        
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="overflow-y-auto flex-1 p-6 space-y-6">
            
          {/* Main Info */}
          <div className={`p-5 rounded-xl border ${isDark ? 'bg-gray-800/30 border-white/5' : 'bg-slate-50/50 border-slate-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label className={labelClasses}>{t.name} (الاسم الرئيسي) *</label>
                    <input type="text" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className={`${formInputClasses} text-lg font-bold`} autoFocus />
                    {errors.name && <p className="text-red-500 text-xs mt-1 animate-pulse">{errors.name}</p>}
                </div>
                <div className="flex items-end">
                    <HoloButton 
                        type="button" 
                        variant="secondary" 
                        onClick={handleSuggestDetails} 
                        disabled={isSuggesting || !formData.name?.trim()} 
                        className={`w-full justify-center !py-3 transition-all ${isSuggesting ? 'border-purple-500 text-purple-400' : ''}`}
                    >
                        {isSuggesting ? <Loader size={18} className="animate-spin" /> : <Brain size={18} className={isSuggesting ? "" : "text-purple-400"} />}
                        {isSuggesting ? t.suggesting : t.suggestDetails}
                    </HoloButton>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 <div>
                     <label className={labelClasses}>الاسم بالعربي</label>
                     <input type="text" value={formData.nameAr || ''} onChange={e => handleChange('nameAr', e.target.value)} className={formInputClasses} placeholder="مثال: فحمات فرامل أمامية" />
                 </div>
                 <div>
                     <label className={labelClasses}>الاسم بالإنجليزية</label>
                     <input type="text" value={formData.nameEn || ''} onChange={e => handleChange('nameEn', e.target.value)} className={formInputClasses} placeholder="Ex: Front Brake Pads" />
                 </div>
              </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className={labelClasses}>{t.sku} *</label><input type="text" value={formData.sku || ''} onChange={e => handleChange('sku', e.target.value)} className={`${formInputClasses} font-mono`} disabled={!isEdit} placeholder={!isEdit ? t.autoGenerated : ''}/>{errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}</div>
            <div><label className={labelClasses}>{t.itemNumber}</label><input type="text" value={formData.itemNumber || ''} onChange={e => handleChange('itemNumber', e.target.value)} className={formInputClasses}/></div>
            <div><label className={labelClasses}>{t.manufacturer}</label><input type="text" value={formData.manufacturer || ''} onChange={e => handleChange('manufacturer', e.target.value)} className={formInputClasses}/></div>
            <div><label className={labelClasses}>{t.size}</label><input type="text" value={formData.size || ''} onChange={e => handleChange('size', e.target.value)} className={formInputClasses}/></div>
          </div>

          {/* Automotive Specifics */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-cyan-900/10 border-cyan-500/20' : 'bg-blue-50 border-blue-100'}`}>
              <h4 className={`font-bold mb-3 text-sm uppercase flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                  <Sparkles size={14}/> بيانات السيارات
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className={labelClasses}>السيارات المتوافقة (افصل بفاصلة)</label>
                      <input type="text" value={vehiclesInput || ''} onChange={e => setVehiclesInput(e.target.value)} className={formInputClasses} placeholder="Toyota Camry 2020, Honda Accord..." />
                  </div>
                  <div>
                      <label className={labelClasses}>أرقام بديلة (Cross Ref)</label>
                      <input type="text" value={altNumbersInput || ''} onChange={e => setAltNumbersInput(e.target.value)} className={formInputClasses} placeholder="123-ABC, 456-DEF..." />
                  </div>
              </div>
          </div>

          <div>
             <label className={labelClasses}>رابط الصورة (URL)</label>
             <input type="text" value={formData.imageUrl || ''} onChange={e => handleChange('imageUrl', e.target.value)} className={formInputClasses} placeholder="https://example.com/image.jpg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className={labelClasses}>{t.description}</label>
                <textarea value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} rows={3} className={`${formInputClasses} resize-none`} />
             </div>
             <div>
                <label className={labelClasses}>{t.specifications}</label>
                <textarea value={formData.specifications || ''} onChange={e => handleChange('specifications', e.target.value)} rows={3} className={`${formInputClasses} resize-none`} />
             </div>
          </div>

          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-dashed ${isDark ? 'border-gray-600' : 'border-slate-300'}`}>
            <div><label className={labelClasses}>{t.costPrice}</label><input type="number" value={formData.costPrice || ''} onChange={e => handleChange('costPrice', parseFloat(e.target.value))} className={formInputClasses}/></div>
            <div>
                <label className={labelClasses}>{t.sellingPrice} *</label>
                <input 
                    type="number" 
                    value={formData.sellingPrice || ''} 
                    onChange={e => handleChange('sellingPrice', parseFloat(e.target.value))} 
                    className={`${formInputClasses} border-green-500/50 focus:border-green-500 text-green-500 font-bold`}
                />
                {errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{errors.sellingPrice}</p>}
            </div>
            <div><label className={labelClasses}>{t.currency}</label><select value={formData.currency} onChange={e => handleChange('currency', e.target.value as CurrencyCode)} className={formInputClasses}>{settings.enabledCurrencies.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className={labelClasses}>{t.reorderPoint}</label><input type="number" value={formData.reorderPoint || ''} onChange={e => handleChange('reorderPoint', parseInt(e.target.value))} className={formInputClasses}/></div>
          </div>
        </form>
        
        <div className={`flex justify-end gap-3 p-4 border-t ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
            <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-semibold transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>{t.cancel}</button>
            <HoloButton variant="success" icon={isSaving ? Loader : Save} onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'جاري الحفظ...' : t.save}
            </HoloButton>
        </div>
        
        <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 hidden lg:block p-1">
            <svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg>
        </div>
      </div>
    </div>
  );
};

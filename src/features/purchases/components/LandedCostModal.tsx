
import React, { useState } from 'react';
import { PurchaseInvoice } from '../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Loader, DollarSign, Calculator } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { inventoryService } from '../../../services/inventoryService';

interface LandedCostModalProps {
    invoice: PurchaseInvoice;
    onClose: () => void;
    onSuccess: () => void;
}

export const LandedCostModal: React.FC<LandedCostModalProps> = ({ invoice, onClose, onSuccess }) => {
    const { theme, lang, addToast } = useZustandStore();
    const t = translations[lang];
    const isDark = theme === 'dark';
    const { modalRef, headerRef, position, size, handleDragStart } = useDraggableAndResizable({ initialSize: { width: 500, height: 500 } });

    const [amount, setAmount] = useState('');
    const [allocationMethod, setAllocationMethod] = useState<'value' | 'quantity'>('value');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        const costAmount = parseFloat(amount);
        if (isNaN(costAmount) || costAmount <= 0) {
            addToast({ message: 'الرجاء إدخال مبلغ صحيح', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            // Assuming service has distributeLandedCost method
            await inventoryService.distributeLandedCost(invoice.id, costAmount, allocationMethod);
            addToast({ message: 'تم توزيع التكاليف بنجاح', type: 'success' });
            onSuccess();
            onClose();
        } catch (e: any) {
            addToast({ message: e.message || 'فشل توزيع التكاليف', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 z-[70]" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 ${isDark ? 'bg-gray-900 border-purple-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${isDark ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-50'}`}>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Calculator className="text-purple-400" /> توزيع تكاليف إضافية
                    </h3>
                    <button onClick={onClose}><X /></button>
                </div>
                
                <div className="flex-1 p-6 space-y-6">
                    <div className={`p-4 rounded-lg text-sm ${isDark ? 'bg-purple-500/10 text-purple-200' : 'bg-purple-50 text-purple-800'}`}>
                        سيتم إضافة هذه التكلفة (مثل الشحن أو الجمارك) إلى تكلفة المنتجات في المخزون، مما يرفع دقة حساب الأرباح.
                    </div>

                    <div>
                        <Label>مبلغ التكلفة الإضافية</Label>
                        <Input 
                            type="number" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            placeholder="0.00" 
                            icon={DollarSign}
                            autoFocus
                        />
                    </div>

                    <div>
                        <Label>طريقة التوزيع</Label>
                        <Select value={allocationMethod} onChange={e => setAllocationMethod(e.target.value as any)}>
                            <option value="value">حسب القيمة (Weighted by Value)</option>
                            <option value="quantity">حسب الكمية (Weighted by Qty)</option>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                            {allocationMethod === 'value' 
                                ? 'يتم تحميل العناصر الأغلى نسبة أكبر من التكلفة.' 
                                : 'يتم تقسيم التكلفة بالتساوي على عدد القطع.'}
                        </p>
                    </div>
                </div>

                <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 text-white">إلغاء</button>
                    <HoloButton variant="primary" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? <Loader className="animate-spin" /> : 'توزيع التكلفة'}
                    </HoloButton>
                </div>
            </div>
        </div>
    );
};

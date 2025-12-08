
import React, { useState, useMemo } from 'react';
import { Product, Warehouse, Toast } from '../../../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Loader } from 'lucide-react';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';

interface QuickStockAdjustModalProps {
    product: Product;
    onClose: () => void;
    onSave: (warehouseId: string, newQuantity: number, adjustmentAccountId?: string) => Promise<void>;
}

export const QuickStockAdjustModal: React.FC<QuickStockAdjustModalProps> = ({ product, onClose, onSave }) => {
    const { theme, lang, warehouses, inventoryLevels, accounts, settings } = useZustandStore();
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 500, height: 550 } });

    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || '');
    const [newQuantity, setNewQuantity] = useState('');
    const [adjustmentAccountId, setAdjustmentAccountId] = useState(settings.accounting.defaultInventoryAdjustmentAccountId || '');
    const [isSaving, setIsSaving] = useState(false);

    const currentQuantity = useMemo(() => {
        if (!selectedWarehouseId) return 0;
        return inventoryLevels.find(l => l.productId === product.id && l.warehouseId === selectedWarehouseId)?.quantity || 0;
    }, [selectedWarehouseId, product.id, inventoryLevels]);
    
    // Filter accounts for adjustments (Expenses or COGS)
    const adjustmentAccounts = useMemo(() => {
        return accounts.filter(a => (a.type === 'expense' || a.type === 'revenue') && !a.isPlaceholder);
    }, [accounts]);

    const handleSubmit = async () => {
        if (!selectedWarehouseId || newQuantity === '' || isSaving) return;
        const quantity = parseInt(newQuantity, 10);
        if (isNaN(quantity) || quantity < 0) return;

        setIsSaving(true);
        try {
            await onSave(selectedWarehouseId, quantity, adjustmentAccountId);
        } finally {
            setIsSaving(false);
        }
    };

    const formInputClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;
    const labelClasses = `block text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`;

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div ref={modalRef} style={{...position, ...size}} className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`} onMouseDown={e => e.stopPropagation()}>
                <div ref={headerRef} onMouseDown={handleDragStart} className="p-4 border-b border-gray-700 cursor-move flex justify-between items-center">
                    <h3 className="text-lg font-bold">{t.quickAdjustStock}</h3>
                    <button onClick={onClose}><X/></button>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-400">{t.item}</p>
                        <p className="font-semibold text-white">{product.name}</p>
                    </div>
                    <div>
                        <Label>{t.selectWarehouse}</Label>
                        <Select value={selectedWarehouseId} onChange={e => setSelectedWarehouseId(e.target.value)} className="!py-2">
                            <option value="">{t.selectAnAccount}</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </Select>
                    </div>
                    {selectedWarehouseId && (
                        <div>
                            <Label>{t.currentQuantityIn} {warehouses.find(w=>w.id === selectedWarehouseId)?.name}</Label>
                            <Input type="text" value={currentQuantity} readOnly disabled className="!py-2" />
                        </div>
                    )}
                    <div>
                        <Label>{t.newQuantity}</Label>
                        <Input type="number" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} disabled={!selectedWarehouseId} autoFocus className="!py-2" />
                    </div>
                    
                    <div>
                        <Label>سبب التعديل (حساب المصروف/الإيراد)</Label>
                        <Select value={adjustmentAccountId} onChange={e => setAdjustmentAccountId(e.target.value)} className="!py-2">
                            <option value="">-- اختر حساب --</option>
                            {adjustmentAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">سيتم إنشاء قيد يومية لتسوية الفرق في المخزون.</p>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800">{t.cancel}</button>
                    <HoloButton icon={isSaving ? Loader : Save} variant="success" onClick={handleSubmit} disabled={isSaving || !selectedWarehouseId || newQuantity === ''}>
                        {isSaving ? 'جاري الحفظ...' : t.save}
                    </HoloButton>
                </div>
            </div>
        </div>
    );
};

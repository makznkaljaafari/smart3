import React, { useState } from 'react';
import { WarehouseStockItem } from '../../../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save } from 'lucide-react';

interface StockAdjustmentModalProps {
    item: WarehouseStockItem;
    warehouseId: string;
    onClose: () => void;
    onSave: (newQuantity: number) => Promise<void>;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ item, warehouseId, onClose, onSave }) => {
    const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
        initialSize: { width: 450, height: 400 },
        minSize: { width: 400, height: 350 }
    });

    const [newQuantity, setNewQuantity] = useState<string>(item.quantity.toString());
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        const quantity = parseInt(newQuantity, 10);
        if (isNaN(quantity) || quantity < 0) {
            // Can show an error message
            return;
        }
        setIsSaving(true);
        await onSave(quantity);
        setIsSaving(false);
    };

    const formInputClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;
    const labelClasses = `block text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`;

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
                className={`fixed rounded-2xl shadow-2xl w-full flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-xl font-bold">{t.adjustStock}</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-400">{t.name}</p>
                        <p className="font-semibold text-white">{item.name}</p>
                    </div>
                     <div>
                        <label className={labelClasses}>{t.currentQuantity}</label>
                        <input type="text" value={item.quantity} readOnly className={`${formInputClasses} opacity-70`} />
                    </div>
                    <div>
                        <label className={labelClasses}>{t.newQuantity} *</label>
                        <input
                            type="number"
                            value={newQuantity}
                            onChange={e => setNewQuantity(e.target.value)}
                            className={formInputClasses}
                            autoFocus
                        />
                    </div>
                </div>
                <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-semibold ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'}`}>{t.cancel}</button>
                    <HoloButton variant="success" icon={Save} onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? 'جاري الحفظ...' : t.save}
                    </HoloButton>
                </div>
                <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400"><svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg></div>
            </div>
        </div>
    );
};
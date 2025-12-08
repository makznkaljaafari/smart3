
import React, { useState, useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Play } from 'lucide-react';
import { Toggle } from '../../../components/ui/Toggle';
import { Label } from '../../../components/ui/Label';

interface StocktakeInitiationModalProps {
    onClose: () => void;
    onInitiate: (warehouseId: string, isBlind: boolean) => Promise<void>;
}

export const StocktakeInitiationModal: React.FC<StocktakeInitiationModalProps> = ({ onClose, onInitiate }) => {
    const { theme, lang, warehouses } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        warehouses: state.warehouses,
    }));
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 500, height: 400 } });

    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [isBlind, setIsBlind] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const isStartDisabled = useMemo(() => {
        return isSaving || !selectedWarehouseId;
    }, [isSaving, selectedWarehouseId]);

    const handleSubmit = async () => {
        if (isStartDisabled) return;
        setIsSaving(true);
        try {
            await onInitiate(selectedWarehouseId, isBlind);
        } finally {
            setIsSaving(false);
        }
    };

    const formInputClasses = `w-full rounded-lg p-3 border focus:outline-none transition-colors focus:ring-2 focus:ring-cyan-500 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-xl font-bold">{t.initiateStocktake}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <div>
                        <Label>{t.selectWarehouseToStocktake}</Label>
                        <select value={selectedWarehouseId} onChange={e => setSelectedWarehouseId(e.target.value)} className={formInputClasses}>
                            <option value="">{t.selectAnAccount}</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center justify-between mt-4 p-3 bg-gray-800/50 rounded-lg">
                        <div>
                            <label className="font-semibold">{t.blindStocktake}</label>
                            <p className="text-xs text-gray-400">{t.blindStocktakeDescription}</p>
                        </div>
                        <Toggle checked={isBlind} onChange={setIsBlind} />
                    </div>
                </div>
                <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg">{t.cancel}</button>
                    <HoloButton icon={Play} variant="primary" onClick={handleSubmit} disabled={isStartDisabled}>
                        {isSaving ? 'جاري البدء...' : t.startStocktake}
                    </HoloButton>
                </div>
                 <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400"><svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg></div>
            </div>
        </div>
    );
};
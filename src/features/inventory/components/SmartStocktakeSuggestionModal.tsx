
import React, { useState, useEffect } from 'react';
import { Product, Toast, StocktakeType } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Play, Loader, ServerCrash, Warehouse as WarehouseIcon } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { Label } from '../../../components/ui/Label';

interface SmartStocktakeSuggestionModalProps {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    suggestions: Product[] | null;
    onClose: () => void;
    onStartStocktake: (warehouseId: string, isBlind: boolean) => Promise<void>;
}

export const SmartStocktakeSuggestionModal: React.FC<SmartStocktakeSuggestionModalProps> = ({
    isOpen, isLoading, error, suggestions, onClose, onStartStocktake
}) => {
    const { theme, lang, warehouses } = useZustandStore();
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 600, height: 500 } });

    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    const handleStart = async () => {
        if (!selectedWarehouseId || !suggestions) return;
        setIsSaving(true);
        try {
            await onStartStocktake(selectedWarehouseId, false);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-purple-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-xl font-bold">{t.smartStocktakeSuggestion}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader size={40} className="animate-spin text-purple-400" />
                            <p>{t.generatingSuggestions}</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-red-400">
                            <ServerCrash size={40} />
                            <p>{t.errorGeneratingResponse}</p>
                            <p className="text-xs text-gray-500">{error}</p>
                        </div>
                    ) : suggestions && suggestions.length > 0 ? (
                        <>
                            <p>{t.aiAnalysisSuggestsCounting}</p>
                            <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-800/50 rounded-lg">
                                {suggestions.map(p => (
                                    <div key={p.id} className="p-2 bg-gray-800 rounded">
                                        <p className="font-semibold">{p.name}</p>
                                        <p className="text-xs text-gray-400">{p.sku}</p>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <Label>{t.selectWarehouseToStocktake}</Label>
                                <Select value={selectedWarehouseId} onChange={e => setSelectedWarehouseId(e.target.value)}>
                                    <option value="">{t.selectAnAccount}</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </Select>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            {t.noSuggestions}
                        </div>
                    )}
                </div>
                <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg">{t.cancel}</button>
                    {suggestions && suggestions.length > 0 && (
                        <HoloButton 
                            icon={isSaving ? Loader : Play} 
                            variant="primary" 
                            onClick={handleStart} 
                            disabled={!selectedWarehouseId || isSaving}
                        >
                            {t.startStocktake}
                        </HoloButton>
                    )}
                </div>
                 <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400"><svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg></div>
            </div>
        </div>
    );
};
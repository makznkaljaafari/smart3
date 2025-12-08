
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Stocktake } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, CheckCircle, Loader, Search, Eye, EyeOff, ArrowUp, ArrowDown, ScanLine, Plus, Minus } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface StocktakeCountingModalProps {
    stocktake: Stocktake;
    onClose: () => void;
    onSaveProgress: (stocktakeId: string, items: { product_id: string, counted_quantity: number | null }[]) => Promise<void>;
    onComplete: (stocktakeId: string) => Promise<void>;
}

type SortField = 'name' | 'sku' | 'expected' | 'counted' | 'diff';

export const StocktakeCountingModal: React.FC<StocktakeCountingModalProps> = ({ stocktake, onClose, onSaveProgress, onComplete }) => {
    const { theme, lang, settings } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
    }));
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 1024, height: window.innerHeight * 0.9 } });
    const isDark = theme === 'dark';

    const [items, setItems] = useState(stocktake.items || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showExpected, setShowExpected] = useState(!stocktake.isBlind);
    const [sort, setSort] = useState<{ field: SortField, order: 'asc' | 'desc' }>({ field: 'name', order: 'asc' });
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const itemInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());


    useEffect(() => {
        setItems(stocktake.items || []);
    }, [stocktake]);
    
    const handleCountChange = (productId: string, value: string) => {
        const newItems = items.map(item =>
            item.productId === productId ? { ...item, countedQuantity: value === '' ? null : parseInt(value, 10) } : item
        );
        setItems(newItems);
    };

    const handleQuickAdd = (productId: string, amount: number) => {
        const newItems = items.map(item => {
            if (item.productId === productId) {
                const currentCount = item.countedQuantity || 0;
                return { ...item, countedQuantity: Math.max(0, currentCount + amount) };
            }
            return item;
        });
        setItems(newItems);
    };

    const handleScan = (sku: string) => {
        setIsScannerOpen(false);
        setSearchTerm(sku);
        setTimeout(() => {
            const product = items.find(item => item.product?.sku === sku)?.product;
            if (product) {
                const inputEl = itemInputRefs.current.get(product.id);
                if (inputEl) {
                    inputEl.focus();
                    inputEl.select();
                    inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 100);
    };
    
    const handleSort = (field: SortField) => {
        setSort(current => {
            if (current.field === field) {
                return { ...current, order: current.order === 'asc' ? 'desc' : 'asc' };
            }
            return { field, order: 'asc' };
        });
    };

    const sortedAndFilteredItems = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();

        return items
            .filter(item =>
                item.product?.name.toLowerCase().includes(lowerSearch) ||
                item.product?.sku.toLowerCase().includes(lowerSearch)
            )
            .sort((a, b) => {
                const aVal = a.product;
                const bVal = b.product;
                if (!aVal || !bVal) return 0;
                
                let comparison = 0;
                switch (sort.field) {
                    case 'name': 
                        comparison = aVal.name.localeCompare(bVal.name); 
                        break;
                    case 'sku': 
                        comparison = aVal.sku.localeCompare(bVal.sku); 
                        break;
                    case 'expected': 
                        comparison = a.expectedQuantity - b.expectedQuantity; 
                        break;
                    case 'counted': 
                        comparison = (a.countedQuantity ?? -Infinity) - (b.countedQuantity ?? -Infinity); 
                        break;
                    case 'diff': {
                        const diffA = (a.countedQuantity ?? a.expectedQuantity) - a.expectedQuantity;
                        const diffB = (b.countedQuantity ?? b.expectedQuantity) - b.expectedQuantity;
                        comparison = diffA - diffB;
                        break;
                    }
                }
                
                return sort.order === 'asc' ? comparison : -comparison;
            });
    }, [items, searchTerm, sort]);


    const stats = useMemo(() => {
        const counted = items.filter(i => i.countedQuantity !== null).length;
        const discrepancies = items.filter(i => i.countedQuantity !== null && i.countedQuantity !== i.expectedQuantity).length;
        return { counted, discrepancies };
    }, [items]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const itemsToUpdate = items.map(i => ({ product_id: i.productId, counted_quantity: i.countedQuantity }));
            await onSaveProgress(stocktake.id, itemsToUpdate);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleComplete = async () => {
        if (confirm(t.areYouSureCompleteStocktake)) {
            setIsSaving(true);
            try {
                const itemsToUpdate = items.map(i => ({ product_id: i.productId, counted_quantity: i.countedQuantity }));
                await onSaveProgress(stocktake.id, itemsToUpdate);
                await onComplete(stocktake.id);
            } catch (e) {
                console.error("Failed to complete stocktake:", e);
            } finally {
                setIsSaving(false);
            }
        }
    };
    
    return (
        <>
            <div className="fixed inset-0 bg-black/90 z-50 backdrop-blur-md" onMouseDown={onClose}>
                <div ref={modalRef} style={{ ...position, ...size }} className={`fixed rounded-2xl shadow-2xl flex flex-col ${isDark ? 'bg-gray-900 border-2 border-purple-500/30' : 'bg-white border border-slate-200'}`} onMouseDown={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div ref={headerRef} onMouseDown={handleDragStart} className={`p-5 border-b flex justify-between items-center cursor-move ${isDark ? 'border-white/10 bg-gray-800/50' : 'border-slate-200 bg-slate-50'}`}>
                        <div>
                            <h3 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                <span className="w-3 h-8 bg-purple-500 rounded-full block"></span>
                                {t.stocktakeCounting}
                            </h3>
                            <p className="text-cyan-400 text-sm mt-1 font-medium px-1">{stocktake.warehouseName} - {new Date(stocktake.stocktakeDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="flex gap-4 text-sm">
                                <div className="text-center px-4 py-1 rounded-lg bg-gray-800/50 border border-gray-700">
                                    <p className="text-gray-400 text-xs uppercase">{t.itemsCounted}</p>
                                    <p className="font-bold text-green-400 text-lg">{stats.counted} <span className="text-gray-500 text-xs">/ {items.length}</span></p>
                                </div>
                                <div className="text-center px-4 py-1 rounded-lg bg-gray-800/50 border border-gray-700">
                                    <p className="text-gray-400 text-xs uppercase">{t.itemsWithDiscrepancy}</p>
                                    <p className="font-bold text-red-400 text-lg">{stats.discrepancies}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}><X size={24}/></button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className={`p-4 border-b grid grid-cols-1 md:grid-cols-12 gap-4 items-center ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                        <div className="md:col-span-8 relative">
                            <Input icon={Search} type="text" placeholder={t.searchItems} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!py-3 !text-lg !pl-12" />
                        </div>
                        <div className="md:col-span-4 flex gap-2 justify-end">
                             <HoloButton onClick={() => setIsScannerOpen(true)} variant="secondary" className="!py-3 !px-4 w-full justify-center"><ScanLine size={20} className="mr-2"/> {t.scanItem}</HoloButton>
                            {stocktake.isBlind && (
                                <button onClick={() => setShowExpected(s => !s)} className={`p-3 rounded-xl transition-colors ${isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:text-slate-900'}`} title={t.showExpectedQuantities}>
                                    {showExpected ? <EyeOff size={24} /> : <Eye size={24} />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {sortedAndFilteredItems.map((item) => {
                            const diff = item.countedQuantity !== null ? item.countedQuantity - item.expectedQuantity : 0;
                            const isCounted = item.countedQuantity !== null;
                            
                            return (
                                <div 
                                    key={item.productId} 
                                    className={`p-4 rounded-xl border transition-all ${
                                        isDark 
                                        ? `bg-gray-800/40 border-gray-700 hover:border-gray-500 ${isCounted ? (diff !== 0 ? 'border-red-500/50 bg-red-900/10' : 'border-green-500/50 bg-green-900/10') : ''}` 
                                        : `bg-white border-slate-200 ${isCounted ? (diff !== 0 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50') : ''}`
                                    }`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Product Info */}
                                        <div className="flex-1">
                                            <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.product?.name}</h4>
                                            <p className="text-sm font-mono text-gray-500">{item.product?.sku}</p>
                                        </div>

                                        {/* Expected (if visible) */}
                                        {showExpected && (
                                            <div className="text-center px-4 border-l border-gray-700/50">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t.expected}</p>
                                                <p className={`font-mono font-bold text-xl ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{item.expectedQuantity}</p>
                                            </div>
                                        )}

                                        {/* Counter Input */}
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleQuickAdd(item.productId, -1)} className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}><Minus size={18}/></button>
                                            
                                            <div className="w-32">
                                                <input 
                                                    ref={el => { if (el) itemInputRefs.current.set(item.productId, el); }}
                                                    type="number" 
                                                    value={item.countedQuantity ?? ''} 
                                                    onChange={e=>handleCountChange(item.productId, e.target.value)} 
                                                    placeholder="-"
                                                    className={`w-full text-center font-mono text-2xl font-bold bg-transparent border-b-2 focus:outline-none py-1 ${
                                                        isCounted 
                                                        ? (diff !== 0 ? 'text-red-400 border-red-500' : 'text-green-400 border-green-500')
                                                        : (isDark ? 'text-gray-400 border-gray-600 focus:border-cyan-500 focus:text-cyan-400' : 'text-slate-400 border-slate-300 focus:border-cyan-500 focus:text-cyan-600')
                                                    }`}
                                                />
                                            </div>

                                            <button onClick={() => handleQuickAdd(item.productId, 1)} className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}><Plus size={18}/></button>
                                        </div>

                                        {/* Diff Indicator */}
                                        <div className="w-24 text-center">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t.difference}</p>
                                            <p className={`font-mono font-bold text-xl ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                                                {diff > 0 ? `+${diff}` : diff}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className={`p-5 border-t flex justify-between items-center ${isDark ? 'border-white/10 bg-gray-800/50' : 'border-slate-200 bg-slate-50'}`}>
                         <div className="text-sm text-gray-500">
                            {isSaving ? 'جاري حفظ البيانات...' : 'يتم حفظ التغييرات عند الضغط على "حفظ التقدم"'}
                        </div>
                        <div className="flex gap-4">
                            <HoloButton variant="secondary" icon={Save} onClick={handleSave} disabled={isSaving || stocktake.status === 'completed'} className="px-6">
                                {t.saveProgress}
                            </HoloButton>
                            <HoloButton variant="success" icon={isSaving ? Loader : CheckCircle} onClick={handleComplete} disabled={isSaving || stocktake.status === 'completed'} className="px-8 py-3 text-lg">
                                {t.completeStocktake}
                            </HoloButton>
                        </div>
                    </div>
                    
                     <div onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20 text-gray-500 hover:text-purple-400 transition-colors" title="Resize">
                        <svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg>
                    </div>
                </div>
            </div>
            {isScannerOpen && (
                <BarcodeScannerModal
                    onClose={() => setIsScannerOpen(false)}
                    onScan={handleScan}
                />
            )}
        </>
    );
};

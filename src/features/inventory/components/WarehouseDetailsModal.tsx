import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Warehouse, WarehouseStockItem, Toast } from '../../../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { inventoryService } from '../../../services/inventoryService';
import { X, Search, Edit, Loader, ServerCrash, Package } from 'lucide-react';
import { StockAdjustmentModal } from './StockAdjustmentModal';

interface WarehouseDetailsModalProps {
    warehouse: Warehouse;
    onClose: () => void;
}

export const WarehouseDetailsModal: React.FC<WarehouseDetailsModalProps> = ({ warehouse, onClose }) => {
    const { theme, lang, authUser, settings } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        authUser: state.authUser,
        settings: state.settings,
    }));
    const { tables: tableSettings } = settings.appearance;
    const t = translations[lang];
    const addToast = useZustandStore(state => state.addToast);

    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
        initialSize: { width: 800, height: 700 },
        minSize: { width: 600, height: 500 }
    });

    const [stockItems, setStockItems] = useState<WarehouseStockItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustingItem, setAdjustingItem] = useState<WarehouseStockItem | null>(null);

    const fetchContents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const { data, error } = await inventoryService.getWarehouseContents(warehouse.id);
        if (error) {
            setError(error.message);
        } else {
            setStockItems(data || []);
        }
        setIsLoading(false);
    }, [warehouse.id]);

    useEffect(() => {
        fetchContents();
    }, [fetchContents]);
    
    const handleAdjustClick = (item: WarehouseStockItem) => {
        setAdjustingItem(item);
        setShowAdjustModal(true);
    };

    const handleSaveAdjustment = async (newQuantity: number) => {
        if (!adjustingItem || !authUser) return;
        
        const { error } = await inventoryService.adjustStockLevel(adjustingItem.id, warehouse.id, newQuantity);
        if (error) {
            addToast({message: error.message, type: 'error'});
        } else {
            addToast({message: t.stockAdjustedSuccess, type: 'success'});
            setShowAdjustModal(false);
            setAdjustingItem(null);
            fetchContents(); // Refetch data
        }
    };
    
    const filteredItems = useMemo(() => {
        return stockItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stockItems, searchTerm]);
    
    const headerClasses = useMemo(() => {
        let base = `p-3 text-sm sticky top-0 z-10 transition-colors border ${theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-b border-slate-300'}`;
        if (tableSettings.headerStyle === 'bold') {
            base += ' font-bold';
        } else {
            base += ' font-semibold';
        }
        if (tableSettings.headerStyle === 'accent') {
            base += theme === 'dark' ? ' !bg-[var(--accent-bg-20)] !text-[var(--accent-300)]' : ' !bg-cyan-100 !text-cyan-800';
        }
        return base;
    }, [theme, tableSettings.headerStyle]);

    const getRowClass = useCallback((isOdd: boolean) => {
        let base = `transition-colors ${theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-slate-100'}`;
        if (tableSettings.theme === 'striped' && isOdd) {
            base += theme === 'dark' ? ' bg-white/5' : ' bg-slate-50';
        }
        return base;
    }, [theme, tableSettings.theme]);

    const fontSizeClass = useMemo(() => {
        switch (tableSettings.fontSize) {
            case 'small': return 'text-xs';
            case 'large': return 'text-base';
            default: return 'text-sm';
        }
    }, [tableSettings.fontSize]);

    const cellClasses = `p-3 border ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`;

    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center items-center p-8"><Loader className="animate-spin" /></div>;
        if (error) return <div className="p-8 text-center text-red-400"><ServerCrash className="mx-auto mb-2" /> Error: {error}</div>;
        if (filteredItems.length === 0) return <div className="p-8 text-center text-gray-400"><Package className="mx-auto mb-2" />{searchTerm ? t.noItemsFound : t.noItemsInWarehouse}</div>;

        return (
            <table className={`w-full border-collapse ${fontSizeClass}`}>
                <thead className="sticky top-0 z-10">
                    <tr>
                        <th className={`${headerClasses} text-right`}>{t.sku}</th>
                        <th className={`${headerClasses} text-right`}>{t.name}</th>
                        <th className={`${headerClasses} text-right`}>{t.quantity}</th>
                        <th className={`${headerClasses} text-center`}>{t.actions}</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map((item, index) => (
                        <tr key={item.id} className={getRowClass(index % 2 !== 0)}>
                            <td className={`${cellClasses} font-mono`}>{item.sku}</td>
                            <td className={`${cellClasses} font-semibold`}>{item.name}</td>
                            <td className={`${cellClasses} font-mono text-lg`}>{item.quantity}</td>
                            <td className={`${cellClasses} text-center`}>
                                <button onClick={() => handleAdjustClick(item)} className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/10"><Edit size={16}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
                <div
                    ref={modalRef}
                    style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
                    className={`fixed rounded-2xl shadow-2xl w-full flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                        <div>
                            <h3 className="text-2xl font-bold">{t.warehouseDetails}</h3>
                            <p className="text-cyan-400">{warehouse.name}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={24} /></button>
                    </div>
                    <div className="p-4 border-b border-gray-700">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t.searchItems}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`w-full rounded-lg p-2 pl-10 border ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-slate-100 border-slate-300'}`}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {renderContent()}
                    </div>
                    <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400"><svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg></div>
                </div>
            </div>
            {showAdjustModal && adjustingItem && (
                <StockAdjustmentModal 
                    item={adjustingItem}
                    warehouseId={warehouse.id}
                    onClose={() => setShowAdjustModal(false)}
                    onSave={handleSaveAdjustment}
                />
            )}
        </>
    );
};
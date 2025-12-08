
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Edit2, Trash2, SlidersHorizontal, Eye } from 'lucide-react';
import { useResizableColumns } from '../../../hooks/useResizableColumns';
import { StockStatusIndicator } from './StockStatusIndicator';
import { formatCurrency } from '../../../lib/formatters';

interface ProductDataTableProps {
    products: Product[];
    stockTotals: Record<string, number>;
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
    onQuickAdjust: (product: Product) => void;
    onView: (product: Product) => void;
}

export const ProductDataTable: React.FC<ProductDataTableProps> = React.memo(({ products = [], stockTotals, onEdit, onDelete, onQuickAdjust, onView }) => {
    const { theme, settings } = useZustandStore(state => ({
        theme: state.theme,
        settings: state.settings,
    }));
    const t = translations[settings.profile.locale];
    const isRTL = settings.profile.locale === 'ar';
    const isDark = theme === 'dark';
    const { tables: tableSettings, density } = settings.appearance;

    const columns = useMemo(() => [
        { key: 'sku', label: t.sku, width: 120 },
        { key: 'name', label: t.name, width: 250 },
        { key: 'itemNumber', label: t.itemNumber, width: 120 },
        { key: 'manufacturer', label: t.manufacturer, width: 150 },
        { key: 'quantity', label: t.quantity, width: 100 },
        { key: 'costPrice', label: t.costPrice, width: 120 },
        { key: 'sellingPrice', label: t.sellingPrice, width: 120 },
        { key: 'actions', label: t.actions, width: 140 },
    ], [t]);

    const [columnWidths, handleMouseDown] = useResizableColumns(
        columns.map(c => ({ key: c.key, initialWidth: c.width })),
        isRTL
    );

    const [activeCell, setActiveCell] = useState<[number, number] | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    const fontSizeClass = useMemo(() => {
        switch (tableSettings.fontSize) {
            case 'small': return 'text-xs';
            case 'large': return 'text-base';
            default: return 'text-sm';
        }
    }, [tableSettings.fontSize]);

    // Consistent Header Styling with DataTable.tsx
    const headerClasses = `p-4 text-sm font-bold sticky top-0 z-10 backdrop-blur-md ${
      isDark 
        ? 'bg-slate-900/80 text-slate-300 border-b border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
        : 'bg-white/90 text-slate-700 border-b border-slate-200 shadow-sm'
    }`;

    const cellPaddingClass = useMemo(() => {
        return density === 'compact' ? 'p-2' : 'p-3';
    }, [density]);
    
    const getRowClass = useCallback((isOdd: boolean) => {
        let base = `transition-colors border-b ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-slate-200 hover:bg-slate-50'}`;
        if (tableSettings.theme === 'striped' && isOdd) {
            base += isDark ? ' bg-white/5' : ' bg-slate-50';
        }
        return base;
    }, [isDark, tableSettings.theme]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activeCell) return;
            let [row, col] = activeCell;
            
            switch(e.key) {
                case 'ArrowUp': row = Math.max(0, row - 1); break;
                case 'ArrowDown': row = Math.min(products.length - 1, row + 1); break;
                case 'ArrowLeft': col = isRTL ? Math.min(columns.length - 2, col + 1) : Math.max(0, col - 1); break;
                case 'ArrowRight': col = isRTL ? Math.max(0, col - 1) : Math.min(columns.length - 2, col + 1); break;
                default: return;
            }
            e.preventDefault();
            setActiveCell([row, col]);
            document.getElementById(`cell-${row}-${col}`)?.focus();
        };

        const tableEl = tableRef.current;
        tableEl?.addEventListener('keydown', handleKeyDown);
        return () => tableEl?.removeEventListener('keydown', handleKeyDown);
    }, [activeCell, products.length, columns.length, isRTL]);

    const cellClasses = `whitespace-nowrap overflow-hidden text-ellipsis ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

    return (
        <div 
            ref={tableRef} 
            tabIndex={-1} 
            className={`w-full overflow-auto border rounded-xl focus:outline-none ${fontSizeClass} ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-slate-200 bg-white'}`}
        >
            <table className="border-collapse w-full" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                    {columns.map(col => <col key={col.key} style={{ width: `${columnWidths[col.key]}px` }} />)}
                </colgroup>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className={`${headerClasses} relative group text-right`}>
                                {col.label}
                                <div 
                                    onMouseDown={(e) => handleMouseDown(col.key, e)}
                                    className={`absolute top-0 h-full w-2 cursor-col-resize group-hover:bg-cyan-500/30 ${isRTL ? 'left-0' : 'right-0'}`}
                                />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, rowIndex) => (
                        <tr key={product.id} className={getRowClass(rowIndex % 2 !== 0)}>
                            {columns.map((col, colIndex) => {
                                const isActive = activeCell?.[0] === rowIndex && activeCell?.[1] === colIndex;
                                
                                if (col.key === 'actions') {
                                    return (
                                        <td key={col.key} className={`${cellClasses} ${cellPaddingClass} text-center`}>
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => onView(product)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-green-400 hover:bg-green-500/10' : 'text-green-600 hover:bg-green-100'}`} title={t.viewDetails}><Eye size={16}/></button>
                                                <button onClick={() => onQuickAdjust(product)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-yellow-600 hover:bg-yellow-100'}`} title={t.quickAdjustStock}><SlidersHorizontal size={16}/></button>
                                                <button onClick={() => onEdit(product)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-cyan-600 hover:bg-cyan-100'}`}><Edit2 size={16}/></button>
                                                <button onClick={() => onDelete(product.id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-100'}`}><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    );
                                }
                                
                                const cellValue = (product as any)[col.key] || '';
                                let specificCellClasses = 'text-right';
                                if (col.key === 'quantity') {
                                    specificCellClasses = 'text-center font-mono font-bold';
                                } else if (col.key === 'costPrice' || col.key === 'sellingPrice') {
                                    specificCellClasses = 'text-right font-mono';
                                }

                                return (
                                    <td 
                                        key={col.key} 
                                        id={`cell-${rowIndex}-${colIndex}`}
                                        tabIndex={0}
                                        onClick={() => setActiveCell([rowIndex, colIndex])}
                                        className={`${cellClasses} ${cellPaddingClass} ${specificCellClasses} focus:outline-none ${isActive ? 'ring-2 ring-inset ring-cyan-400 bg-cyan-500/10' : ''}`}
                                    >
                                        {col.key === 'name' ? (
                                            <div>
                                                <div className={isDark ? 'font-semibold text-slate-100' : 'font-semibold text-slate-900'}>{product.name}</div>
                                                <StockStatusIndicator quantity={stockTotals[product.id] || 0} reorderPoint={product.reorderPoint} />
                                            </div>
                                        ) : (col.key === 'costPrice' || col.key === 'sellingPrice') ? (
                                            <span className={col.key === 'sellingPrice' ? (isDark ? 'text-green-400' : 'text-green-600') : ''}>
                                                {formatCurrency(cellValue, product.currency)}
                                            </span>
                                        ) : col.key === 'quantity' ? (
                                            <span className={stockTotals[product.id] === 0 ? 'text-red-500' : ''}>{stockTotals[product.id] || 0}</span>
                                        ) : (
                                            cellValue
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

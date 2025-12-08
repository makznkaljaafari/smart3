
import React, { useRef, useEffect, useCallback } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { SalesInvoiceItem, CurrencyCode } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Trash2, Search, Plus, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';

interface LocalInvoiceItem extends SalesInvoiceItem {
    warehouseId: string;
}

interface InvoiceItemsTableProps {
    items: LocalInvoiceItem[];
    onItemChange: (productId: string, field: 'quantity' | 'unitPrice' | 'warehouseId', value: any) => void;
    onRemoveItem: (productId: string) => void;
    onOpenProductModal: () => void;
    stockWarnings: Record<string, string>;
    t: Record<string, string>;
    invoiceType: 'sales' | 'purchase';
    currency?: CurrencyCode;
    showWarehouseColumn?: boolean;
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({ 
    items, onItemChange, onRemoveItem, onOpenProductModal, 
    stockWarnings, t, invoiceType, currency, showWarehouseColumn = true 
}) => {
    const { theme, warehouses, settings, lang } = useZustandStore();
    const isDark = theme !== 'light';
    const displayCurrency = currency || settings.baseCurrency;
    const isRTL = lang === 'ar';
    
    // Navigation Logic
    const inputRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());

    const getColumns = useCallback(() => {
        const cols = [];
        if (showWarehouseColumn) cols.push('warehouseId');
        cols.push('quantity');
        cols.push('unitPrice');
        return cols;
    }, [showWarehouseColumn]);

    const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colKey: string) => {
        const columns = getColumns();
        const colIndex = columns.indexOf(colKey);
        
        let nextRow = rowIndex;
        let nextCol = colIndex;

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            nextRow = Math.max(0, rowIndex - 1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            nextRow = Math.min(items.length - 1, rowIndex + 1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (rowIndex === items.length - 1) {
                onOpenProductModal();
                return;
            }
            nextRow = Math.min(items.length - 1, rowIndex + 1);
        } else if (e.key === 'ArrowRight') {
            // In RTL, Right Arrow moves backward (index - 1)
            // In LTR, Right Arrow moves forward (index + 1)
            if (isRTL) {
                if (colIndex > 0) {
                    e.preventDefault();
                    nextCol = colIndex - 1;
                }
            } else {
                if (colIndex < columns.length - 1) {
                    e.preventDefault();
                    nextCol = colIndex + 1;
                }
            }
        } else if (e.key === 'ArrowLeft') {
            // In RTL, Left Arrow moves forward (index + 1)
            // In LTR, Left Arrow moves backward (index - 1)
            if (isRTL) {
                if (colIndex < columns.length - 1) {
                    e.preventDefault();
                    nextCol = colIndex + 1;
                }
            } else {
                 if (colIndex > 0) {
                    e.preventDefault();
                    nextCol = colIndex - 1;
                }
            }
        }

        if (nextRow !== rowIndex || nextCol !== colIndex) {
            const nextColKey = columns[nextCol];
            const nextInput = inputRefs.current.get(`${nextRow}-${nextColKey}`);
            if (nextInput) {
                nextInput.focus();
                if (nextInput instanceof HTMLInputElement) {
                    nextInput.select();
                }
            }
        }
    };

    const registerRef = (el: HTMLInputElement | HTMLSelectElement | null, rowIndex: number, colKey: string) => {
        if (el) {
            inputRefs.current.set(`${rowIndex}-${colKey}`, el);
        } else {
            inputRefs.current.delete(`${rowIndex}-${colKey}`);
        }
    };

    // Styling Variables
    const borderColor = isDark ? 'border-white/10' : 'border-slate-200';
    const headerBg = isDark ? 'bg-black/30 backdrop-blur-md' : 'bg-slate-100';
    const headerText = isDark ? 'text-cyan-400' : 'text-slate-600';
    const rowBg = isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-slate-50';
    const inputClasses = `w-full h-full bg-transparent text-center font-mono outline-none transition-all focus:bg-cyan-500/10 focus:shadow-[inset_0_0_0_2px_rgba(6,182,212,0.5)] ${isDark ? 'text-white placeholder:text-gray-600' : 'text-slate-900 placeholder:text-slate-400'}`;

    return (
        <div className="mt-6 relative">
            {/* Table Container with Glass effect */}
            <div className={`rounded-xl overflow-hidden border ${borderColor} ${isDark ? 'bg-gray-900/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.2)]' : 'shadow-sm'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[300px] md:min-w-[700px] border-collapse responsive-table">
                        <thead>
                            <tr className={headerBg}>
                                <th className={`p-4 text-xs font-bold uppercase tracking-wider border-b ${borderColor} ${headerText} w-12 text-center`}>#</th>
                                <th className={`p-4 text-xs font-bold uppercase tracking-wider border-b ${borderColor} ${headerText} text-right`}>{t.product}</th>
                                {showWarehouseColumn && <th className={`p-4 text-xs font-bold uppercase tracking-wider border-b ${borderColor} ${headerText} w-40 text-right`}>المستودع</th>}
                                <th className={`p-4 text-xs font-bold uppercase tracking-wider border-b ${borderColor} ${headerText} w-28 text-center`}>{t.quantity}</th>
                                <th className={`p-4 text-xs font-bold uppercase tracking-wider border-b ${borderColor} ${headerText} w-32 text-center`}>{invoiceType === 'sales' ? t.sellingPrice : 'سعر الشراء'}</th>
                                <th className={`p-4 text-xs font-bold uppercase tracking-wider border-b ${borderColor} ${headerText} w-32 text-center`}>{t.total}</th>
                                <th className={`p-4 text-xs font-bold uppercase tracking-wider border-b ${borderColor} ${headerText} w-12 text-center`}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={showWarehouseColumn ? 7 : 6} className={`p-16 text-center ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                                        <div 
                                            className="flex flex-col items-center justify-center gap-4 cursor-pointer group" 
                                            onClick={onOpenProductModal}
                                        >
                                            <div className={`p-4 rounded-full border-2 border-dashed transition-all duration-300 ${isDark ? 'border-gray-700 group-hover:border-cyan-500 group-hover:bg-cyan-500/10' : 'border-slate-300 group-hover:border-cyan-400 group-hover:bg-cyan-50'}`}>
                                                <Plus size={32} className={`transition-transform duration-300 group-hover:scale-110 ${isDark ? 'text-gray-600 group-hover:text-cyan-400' : 'text-slate-400 group-hover:text-cyan-600'}`} />
                                            </div>
                                            <span className="font-medium transition-colors group-hover:text-cyan-500">اضغط لإضافة مواد (أو استخدم زر البحث)</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => (
                                    <tr key={item.productId} className={`border-b ${borderColor} ${rowBg} transition-colors duration-200`}>
                                        <td className={`text-center text-xs opacity-50 border-l ${borderColor}`} data-label="#">{index + 1}</td>
                                        
                                        {/* Product Name */}
                                        <td className={`px-4 py-3 border-l ${borderColor}`} data-label={t.product}>
                                            <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.productName}</div>
                                            {stockWarnings[item.productId] && (
                                                <div className="flex items-center gap-1 text-red-400 text-[10px] mt-1 animate-pulse">
                                                    <AlertCircle size={10} />
                                                    {stockWarnings[item.productId]}
                                                </div>
                                            )}
                                        </td>

                                        {/* Warehouse Select */}
                                        {showWarehouseColumn && (
                                            <td className={`p-0 border-l ${borderColor}`} data-label="المستودع">
                                                <Select 
                                                    ref={el => registerRef(el, index, 'warehouseId')}
                                                    value={item.warehouseId} 
                                                    onChange={e => onItemChange(item.productId, 'warehouseId', e.target.value)} 
                                                    onKeyDown={e => handleKeyDown(e, index, 'warehouseId')}
                                                    className={`${inputClasses} !text-right text-xs appearance-none px-3`}
                                                    style={{ borderRadius: 0 }}
                                                >
                                                    <option value="">اختر...</option>
                                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                </Select>
                                            </td>
                                        )}

                                        {/* Quantity Input */}
                                        <td className={`p-0 border-l ${borderColor}`} data-label={t.quantity}>
                                            <input 
                                                ref={el => registerRef(el, index, 'quantity')}
                                                type="number" 
                                                value={item.quantity} 
                                                onChange={e => onItemChange(item.productId, 'quantity', Number(e.target.value))} 
                                                onKeyDown={e => handleKeyDown(e, index, 'quantity')}
                                                className={inputClasses}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </td>

                                        {/* Price Input */}
                                        <td className={`p-0 border-l ${borderColor}`} data-label={invoiceType === 'sales' ? t.sellingPrice : 'سعر الشراء'}>
                                            <input 
                                                ref={el => registerRef(el, index, 'unitPrice')}
                                                type="number" 
                                                value={item.unitPrice} 
                                                onChange={e => onItemChange(item.productId, 'unitPrice', Number(e.target.value))}
                                                onKeyDown={e => handleKeyDown(e, index, 'unitPrice')}
                                                className={inputClasses}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </td>

                                        {/* Total (ReadOnly) */}
                                        <td className={`px-3 py-2 text-center font-mono font-bold text-sm border-l ${borderColor} ${isDark ? 'text-cyan-300 bg-cyan-500/5' : 'text-cyan-700 bg-cyan-50'}`} data-label={t.total}>
                                            {formatCurrency(item.total, displayCurrency)}
                                        </td>

                                        {/* Delete Action */}
                                        <td className={`text-center p-0 border-l ${borderColor}`} data-label="">
                                            <button onClick={() => onRemoveItem(item.productId)} tabIndex={-1} className="w-full h-full flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 transition-colors">
                                                <Trash2 size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Quick Add Bar */}
            <div 
                className={`mt-4 p-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm group ${isDark ? 'border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800' : 'border-slate-300 hover:border-cyan-400 hover:bg-slate-50'}`} 
                onClick={onOpenProductModal}
            >
                <Search size={18} className={`transition-colors ${isDark ? 'text-gray-500 group-hover:text-cyan-400' : 'text-slate-400 group-hover:text-cyan-600'}`} />
                <span className={`font-medium transition-colors ${isDark ? 'text-gray-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'}`}>
                    اضغط هنا للبحث السريع عن المنتجات (أو استخدم الباركود)
                </span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded border ${isDark ? 'border-gray-700 text-gray-500' : 'border-slate-200 text-slate-400'}`}>Enter</span>
            </div>
        </div>
    );
};

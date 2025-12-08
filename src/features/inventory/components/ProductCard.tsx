
import React, { useState } from 'react';
import { Product } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { SlidersHorizontal, Edit2, Trash2, Eye, MoreVertical, Package } from 'lucide-react';
import { StockStatusIndicator } from './StockStatusIndicator';
import { formatCurrency } from '../../expenses/lib/utils';

interface ProductCardProps {
    product: Product;
    stockQuantity: number;
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
    onQuickAdjust: (product: Product) => void;
    onView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, stockQuantity, onEdit, onDelete, onQuickAdjust, onView }) => {
    const { theme } = useZustandStore();
    const [showMenu, setShowMenu] = useState(false);
    const isDark = theme === 'dark';
    
    return (
        <div className={`group relative p-4 rounded-2xl border transition-all duration-500 flex flex-col h-full overflow-hidden ${isDark ? 'bg-gray-900/80 border-gray-800 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'bg-white border-slate-200 shadow-sm hover:shadow-xl'}`}>
            
            {/* Hover Glow Background */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${isDark ? 'bg-gradient-to-br from-cyan-500/5 to-purple-500/5' : 'bg-gradient-to-br from-cyan-50/50 to-purple-50/50'}`} />
            
            <div className="relative z-10 flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${isDark ? 'bg-gray-800 text-cyan-400' : 'bg-slate-100 text-slate-500'}`}>
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <Package size={24} />
                        )}
                    </div>
                    <div>
                        <h3 className={`font-bold text-base line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{product.name}</h3>
                        <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                    </div>
                </div>
                
                <div className="relative">
                    <button 
                        onClick={() => setShowMenu(!showMenu)} 
                        onBlur={() => setTimeout(() => setShowMenu(false), 200)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                        <MoreVertical size={18} />
                    </button>
                    {showMenu && (
                        <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-2xl z-20 border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                            <button onClick={() => onView(product)} className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-right hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-50 text-slate-700'}`}><Eye size={16} /> عرض</button>
                            <button onClick={() => onQuickAdjust(product)} className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-right hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-50 text-slate-700'}`}><SlidersHorizontal size={16} /> تعديل الكمية</button>
                            <button onClick={() => onEdit(product)} className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-right hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-slate-50 text-slate-700'}`}><Edit2 size={16} /> تعديل البيانات</button>
                            <button onClick={() => onDelete(product.id)} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-right text-red-500 hover:bg-red-500/10"><Trash2 size={16} /> حذف</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto space-y-4 relative z-10">
                <div className={`p-3 rounded-lg flex justify-between items-center ${isDark ? 'bg-gray-800/50' : 'bg-slate-50'}`}>
                     <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">المخزون</p>
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-bold font-mono ${stockQuantity === 0 ? 'text-red-500' : (isDark ? 'text-white' : 'text-slate-900')}`}>{stockQuantity}</span>
                            <StockStatusIndicator quantity={stockQuantity} reorderPoint={product.reorderPoint} />
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-center px-1">
                    <div className="text-xs text-gray-500">
                        {product.itemNumber ? `P/N: ${product.itemNumber}` : product.manufacturer || ''}
                    </div>
                    <p className={`font-bold font-mono text-lg ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        {formatCurrency(product.sellingPrice, product.currency)}
                    </p>
                </div>
            </div>
        </div>
    );
};


import React, { useMemo, useState, useEffect } from 'react';
import { Product, InventoryBatch } from '../../../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { X, Package, Car, DollarSign, BarChart3, MapPin, Layers, Settings, History, Wrench, Hash, Box } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { formatCurrency } from '../../expenses/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { salesService } from '../../../services/salesService';

interface ProductDetailsModalProps {
    product: Product;
    onClose: () => void;
    onEdit: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, onClose, onEdit }) => {
    const { theme, lang, inventoryLevels, warehouses, settings } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        inventoryLevels: state.inventoryLevels,
        warehouses: state.warehouses,
        settings: state.settings
    }));
    
    const { modalRef, headerRef, position, size, handleDragStart } = useDraggableAndResizable({ 
        initialSize: { width: 900, height: 750 }, 
        minSize: { width: 600, height: 500 } 
    });

    const [activeTab, setActiveTab] = useState<'overview' | 'compatibility' | 'stock' | 'financial' | 'movements' | 'batches'>('overview');

    // --- Queries ---
    const { data: movementsData, isLoading: movementsLoading } = useQuery({
        queryKey: ['productMovements', product.id],
        queryFn: () => inventoryService.getProductMovementHistory(product.id),
        enabled: activeTab === 'movements'
    });

    const { data: salesData } = useQuery({
        queryKey: ['productSalesStats', product.id],
        queryFn: () => salesService.getSalesPaginated({ pageSize: 1000 }), 
    });
    
    const { data: batchesData, isLoading: batchesLoading } = useQuery({
        queryKey: ['productBatches', product.id],
        queryFn: () => inventoryService.getProductBatches(product.id),
        enabled: activeTab === 'batches'
    });

    const salesList = salesData?.data || [];
    const batches = batchesData?.data || [];

    // --- Calculations ---
    const stockDistribution = useMemo(() => {
        return warehouses.map(wh => {
            const level = inventoryLevels.find(l => l.warehouseId === wh.id && l.productId === product.id);
            return {
                warehouseName: wh.name,
                quantity: level ? level.quantity : 0,
                location: wh.location
            };
        });
    }, [warehouses, inventoryLevels, product.id]);

    const totalQuantity = stockDistribution.reduce((sum, item) => sum + item.quantity, 0);

    const salesStats = useMemo(() => {
        if (!Array.isArray(salesList)) return { totalSoldQty: 0, totalRevenue: 0, totalProfit: 0, totalInventoryValue: 0 };

        const productSales = salesList.flatMap(sale => 
            (sale.items || [])
                .filter(item => item.productId === product.id)
                .map(item => ({
                    quantity: item.quantity,
                    price: item.unitPrice,
                    date: sale.date
                }))
        );

        const totalSoldQty = productSales.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = productSales.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const totalCostOfSold = totalSoldQty * product.costPrice;
        const totalProfit = totalRevenue - totalCostOfSold;
        const totalInventoryValue = totalQuantity * product.costPrice;

        return { totalSoldQty, totalRevenue, totalProfit, totalInventoryValue };
    }, [salesList, product.id, product.costPrice, totalQuantity]);


    // --- Render Helpers ---
    const DetailRow = ({ label, value, icon: Icon, className = '' }: { label: string, value: string | number | undefined, icon?: React.ElementType, className?: string }) => (
        <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-50'} ${className}`}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
                {Icon && <Icon size={16} />}
                <span>{label}</span>
            </div>
            <span className={`font-semibold text-right ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value || '-'}</span>
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'نظرة عامة', icon: Package },
        { id: 'compatibility', label: 'المواصفات', icon: Settings },
        { id: 'stock', label: 'المخزون', icon: Layers },
        { id: 'batches', label: 'الدفعات (Batches)', icon: Box },
        { id: 'financial', label: 'المالية', icon: BarChart3 },
        { id: 'movements', label: 'السجل', icon: History },
    ];

    return (
        <div className="fixed inset-0 bg-black/75 z-[60]" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                {/* Header */}
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-5 border-b flex justify-between items-start cursor-move ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex gap-4">
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden border ${theme === 'dark' ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200'}`}>
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <Package size={32} className="text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{product.nameAr || product.name}</h2>
                            <p className="text-gray-400 font-mono text-sm">{product.nameEn || product.sku}</p>
                            <div className="flex gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 text-xs rounded-md border border-cyan-500/20">{product.manufacturer || 'Unknown Brand'}</span>
                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 text-xs rounded-md border border-purple-500/20">{product.itemNumber || 'No Part #'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onEdit(product)} className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-sm font-bold">تعديل</button>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={20} /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'} overflow-x-auto`}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap
                                ${activeTab === tab.id 
                                    ? (theme === 'dark' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-cyan-700 border-b-2 border-cyan-600 bg-cyan-50') 
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    
                    {/* 1. Overview */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailRow label="الاسم (عربي)" value={product.nameAr || product.name} />
                                <DetailRow label="الاسم (إنجليزي)" value={product.nameEn} />
                                <DetailRow label="رقم القطعة (Part No)" value={product.itemNumber} icon={Hash} />
                                <DetailRow label="الرقم التسلسلي (SKU)" value={product.sku} icon={Hash} />
                                <DetailRow label="الشركة الصانعة" value={product.manufacturer} icon={Wrench} />
                                <DetailRow label="مقاس القطعة" value={product.size} />
                            </div>
                            
                            <div>
                                <h4 className="font-bold mb-2 text-gray-400 text-sm">الوصف</h4>
                                <div className={`p-4 rounded-lg text-sm leading-relaxed ${theme === 'dark' ? 'bg-gray-800/30 text-gray-300' : 'bg-slate-50 text-gray-700'}`}>
                                    {product.description || 'لا يوجد وصف متاح.'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Compatibility & Specs */}
                    {activeTab === 'compatibility' && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold mb-3 flex items-center gap-2"><Car size={18} className="text-cyan-400"/> السيارات المتوافقة</h4>
                                {product.compatibleVehicles && product.compatibleVehicles.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {product.compatibleVehicles.map((car, idx) => (
                                            <span key={idx} className={`px-3 py-1.5 rounded-full text-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-slate-300 text-slate-800'}`}>
                                                {car}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">لم يتم تحديد سيارات متوافقة.</p>
                                )}
                            </div>

                            <div className="border-t border-dashed border-gray-600 my-2"></div>
                             
                             <div>
                                <h4 className="font-bold mb-2 text-gray-400 text-sm">المواصفات الفنية</h4>
                                <div className={`p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'bg-gray-800/30 text-gray-300' : 'bg-slate-50 text-gray-700'}`}>
                                    {product.specifications || 'لا توجد مواصفات إضافية.'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Stock */}
                    {activeTab === 'stock' && (
                        <div className="space-y-6">
                            <div className={`p-4 rounded-xl flex items-center justify-between ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30' : 'bg-cyan-50 border border-cyan-200'}`}>
                                <div>
                                    <p className="text-sm text-cyan-500 font-bold uppercase">إجمالي الكميات المتوفرة</p>
                                    <p className="text-3xl font-bold mt-1">{totalQuantity}</p>
                                </div>
                                <Package size={40} className="text-cyan-400 opacity-50" />
                            </div>

                            <h4 className="font-bold text-sm text-gray-400 mt-6 mb-3">توزيع الكميات في المخازن</h4>
                            <div className={`rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                                <table className="w-full text-sm">
                                    <thead className={theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-slate-100 text-gray-700'}>
                                        <tr>
                                            <th className="p-3 text-right">المستودع</th>
                                            <th className="p-3 text-right">الموقع</th>
                                            <th className="p-3 text-center">الكمية</th>
                                            <th className="p-3 text-center">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {stockDistribution.map((stock, idx) => (
                                            <tr key={idx} className={theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50'}>
                                                <td className="p-3 font-medium">{stock.warehouseName}</td>
                                                <td className="p-3 text-gray-500 flex items-center gap-1"><MapPin size={12}/> {stock.location || '-'}</td>
                                                <td className="p-3 text-center font-bold font-mono">{stock.quantity}</td>
                                                <td className="p-3 text-center">
                                                    {stock.quantity > 0 
                                                        ? <span className="text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded">متوفر</span>
                                                        : <span className="text-red-500 text-xs bg-red-500/10 px-2 py-1 rounded">نفذ</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {/* 4. Batches (Phase 3) */}
                    {activeTab === 'batches' && (
                         <div className="space-y-4">
                             {batchesLoading ? <p className="text-center py-8">جاري تحميل الدفعات...</p> : (
                                 batches.length > 0 ? (
                                     <div className={`rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                                        <table className="w-full text-sm">
                                            <thead className={theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-slate-100 text-gray-700'}>
                                                <tr>
                                                    <th className="p-3 text-right">تاريخ الاستلام</th>
                                                    <th className="p-3 text-right">الكمية المتبقية</th>
                                                    <th className="p-3 text-right">تكلفة الوحدة</th>
                                                    <th className="p-3 text-right">المصدر (فاتورة)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {batches.map((batch) => (
                                                    <tr key={batch.id} className={theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50'}>
                                                        <td className="p-3">{new Date(batch.receivedDate).toLocaleDateString()}</td>
                                                        <td className="p-3 font-mono font-bold">{batch.quantity}</td>
                                                        <td className="p-3 font-mono text-green-400">{formatCurrency(batch.unitCost, settings.baseCurrency)}</td>
                                                        <td className="p-3 text-gray-500">{batch.purchaseInvoiceId || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                     </div>
                                 ) : (
                                     <div className="text-center py-12 text-gray-500">
                                         <Box size={40} className="mx-auto mb-2 opacity-50"/>
                                         <p>لا توجد معلومات دفعات متاحة لهذا المنتج.</p>
                                     </div>
                                 )
                             )}
                         </div>
                    )}

                    {/* 5. Financial */}
                    {activeTab === 'financial' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-slate-200'}`}>
                                    <p className="text-xs text-gray-500 mb-1">سعر التكلفة</p>
                                    <p className="text-xl font-bold font-mono">{formatCurrency(product.costPrice, product.currency)}</p>
                                </div>
                                <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-slate-200'}`}>
                                    <p className="text-xs text-gray-500 mb-1">سعر البيع</p>
                                    <p className="text-xl font-bold font-mono text-green-500">{formatCurrency(product.sellingPrice, product.currency)}</p>
                                </div>
                            </div>

                            <h4 className="font-bold text-sm text-gray-400 mt-4 mb-3">مؤشرات الأداء المالي</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                                    <div className="flex items-center gap-2 mb-2 text-indigo-400">
                                        <Package size={18} />
                                        <span className="text-sm font-bold">الكميات المباعة</span>
                                    </div>
                                    <p className="text-2xl font-bold">{salesStats.totalSoldQty}</p>
                                    <p className="text-xs text-gray-500 mt-1">وحدة مباعة</p>
                                </div>

                                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                        <DollarSign size={18} />
                                        <span className="text-sm font-bold">إجمالي الأرباح</span>
                                    </div>
                                    <p className="text-2xl font-bold font-mono">{formatCurrency(salesStats.totalProfit, product.currency)}</p>
                                    <p className="text-xs text-gray-500 mt-1">صافي الربح التقديري</p>
                                </div>

                                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                                    <div className="flex items-center gap-2 mb-2 text-orange-400">
                                        <Layers size={18} />
                                        <span className="text-sm font-bold">قيمة المخزون</span>
                                    </div>
                                    <p className="text-2xl font-bold font-mono">{formatCurrency(salesStats.totalInventoryValue, product.currency)}</p>
                                    <p className="text-xs text-gray-500 mt-1">للمخزون الحالي</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* 6. Movements */}
                    {activeTab === 'movements' && (
                        <div className="space-y-4">
                             {movementsLoading ? (
                                 <p className="text-center py-8">جاري تحميل سجل الحركات...</p>
                             ) : movementsData?.data && movementsData.data.length > 0 ? (
                                 <div className={`rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                                    <table className="w-full text-sm">
                                        <thead className={theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-slate-100 text-gray-700'}>
                                            <tr>
                                                <th className="p-3 text-right">التاريخ</th>
                                                <th className="p-3 text-right">النوع</th>
                                                <th className="p-3 text-right">المستودع</th>
                                                <th className="p-3 text-right">الكمية</th>
                                                <th className="p-3 text-right">الملاحظات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {movementsData.data.map((move: any) => (
                                                <tr key={move.id} className={theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50'}>
                                                    <td className="p-3">{new Date(move.date).toLocaleDateString(lang)}</td>
                                                    <td className="p-3">
                                                        <span className={`text-xs px-2 py-1 rounded ${move.quantity > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {move.reference || move.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">{move.warehouseName}</td>
                                                    <td className={`p-3 font-mono font-bold ${move.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {move.quantity > 0 ? `+${move.quantity}` : move.quantity}
                                                    </td>
                                                    <td className="p-3 text-gray-500 text-xs max-w-xs truncate" title={move.notes}>{move.notes}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             ) : (
                                 <p className="text-center py-8 text-gray-500">لا توجد حركات مسجلة لهذا المنتج.</p>
                             )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

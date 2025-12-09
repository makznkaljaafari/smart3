import React from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { SciFiCard } from '../../../components/ui/SciFiCard';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useInventoryData } from '../hooks/useInventoryData';
import { ProductDataTable } from './ProductDataTable';
import { ProductFormModal } from './ProductFormModal';
import { ProductDetailsModal } from './ProductDetailsModal';
import { Plus, Search, Package, DollarSign, AlertTriangle, ChevronLeft, ChevronRight, ServerCrash, ScanLine, Brain, Loader, UploadCloud, LayoutGrid, List } from 'lucide-react';
import { QuickStockAdjustModal } from './QuickStockAdjustModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ProductCard } from './ProductCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatCurrency } from '../../../lib/formatters';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { Product } from '../../../types';
import { AppTheme } from '../../../types';
import { Input } from '../../../components/ui/Input';

const InventorySkeleton = ({ theme }: { theme: AppTheme }) => {
    const isDark = theme.startsWith('dark');
    const shimmerColor = isDark ? 'bg-gray-800' : 'bg-slate-200';
    return (
        <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {[...Array(4)].map((_, i) => (
                     <div key={i} className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
                        <div className="flex justify-between">
                            <div className={`h-5 w-1/2 ${shimmerColor} rounded`}></div>
                            <div className={`h-8 w-20 ${shimmerColor} rounded`}></div>
                        </div>
                        <div className={`h-3 w-1/3 mt-2 ${shimmerColor} rounded`}></div>
                         <div className="flex justify-between mt-6">
                            <div className={`h-4 w-16 ${shimmerColor} rounded`}></div>
                            <div className={`h-4 w-16 ${shimmerColor} rounded`}></div>
                         </div>
                     </div>
                ))}
            </div>
            <div className={`hidden lg:block rounded-lg border overflow-hidden ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
                <div className={`h-10 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'}`}></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex items-center p-4 border-b ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                        <div className={`h-4 w-1/6 ${shimmerColor} rounded mr-4`}></div>
                        <div className={`h-4 w-1/4 ${shimmerColor} rounded mr-4`}></div>
                        <div className={`h-4 w-1/6 ${shimmerColor} rounded mr-4`}></div>
                        <div className={`h-4 w-1/6 ${shimmerColor} rounded mr-4`}></div>
                        <div className={`h-4 w-1/12 ${shimmerColor} rounded`}></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ItemsList: React.FC = () => {
    const { theme, lang, settings } = useZustandStore(state => ({ 
        theme: state.theme, 
        lang: state.lang, 
        settings: state.settings,
    }));
    const t = translations[lang];
    const navigate = useNavigate();
    const isDark = theme !== 'light';

    const {
        stats,
        searchTerm,
        setSearchTerm,
        viewMode,
        setViewMode,
        currentPage,
        setCurrentPage,
        paginatedProducts,
        stockTotals,
        totalPages,
        productsLoading,
        productsError,
        showFormModal,
        editingProduct,
        adjustingProduct,
        viewingProduct,
        showScannerModal,
        isAiSearching,
        handleAiSearch,
        handleOpenForm,
        handleCloseModals,
        handleSaveProduct,
        handleEditProduct,
        handleDeleteProduct,
        handleOpenAdjustModal,
        handleStockAdjustment,
        handleOpenScanner,
        handleScan,
        handleViewProduct,
    } = useInventoryData();

    // Ensure stockTotals is an object with number values, handling potential undefined
    // Type assertion to handle the loose type from hook
    const safeStockTotals: Record<string, number> = (stockTotals || {}) as Record<string, number>;

    const renderContent = () => {
        if (productsLoading) return <InventorySkeleton theme={theme as AppTheme} />;
        
        if (productsError) {
            return <EmptyState icon={ServerCrash} title="Error" description={productsError} variant="error" />;
        }

        if (paginatedProducts.length === 0) {
            return (
                <EmptyState 
                    icon={Package} 
                    title={searchTerm ? t.noItemsFound : t.noItemsYet} 
                    description={searchTerm ? '' : t.addFirstItem} 
                    actionLabel={searchTerm ? undefined : t.addItem}
                    onAction={searchTerm ? undefined : handleOpenForm}
                />
            );
        }

        return (
            <>
                <div className="block lg:hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedProducts.map((product: Product) => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                stockQuantity={safeStockTotals[product.id] || 0}
                                onEdit={() => handleEditProduct(product)}
                                onDelete={() => handleDeleteProduct(product.id)}
                                onQuickAdjust={() => handleOpenAdjustModal(product)}
                                onView={() => handleViewProduct(product)}
                            />
                        ))}
                    </div>
                </div>

                <div className="hidden lg:block">
                    {viewMode === 'grid' ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {paginatedProducts.map((product: Product) => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    stockQuantity={safeStockTotals[product.id] || 0}
                                    onEdit={() => handleEditProduct(product)}
                                    onDelete={() => handleDeleteProduct(product.id)}
                                    onQuickAdjust={() => handleOpenAdjustModal(product)}
                                    onView={() => handleViewProduct(product)}
                                />
                            ))}
                        </div>
                    ) : (
                        <ProductDataTable 
                            products={paginatedProducts} 
                            stockTotals={safeStockTotals} 
                            onEdit={handleEditProduct} 
                            onDelete={handleDeleteProduct}
                            onQuickAdjust={handleOpenAdjustModal}
                            onView={handleViewProduct}
                        />
                    )}
                </div>

                {/* Pagination */}
                <div className={`flex items-center justify-between pt-4 mt-4 border-t ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                        {lang === 'ar' ? `الصفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            disabled={currentPage === 1} 
                            className={`p-2 rounded-lg disabled:opacity-50 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-200'}`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            disabled={currentPage === totalPages} 
                            className={`p-2 rounded-lg disabled:opacity-50 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-200'}`}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SciFiCard theme={theme as AppTheme} title={t.totalItems} value={stats.totalCount.toString()} icon={Package} color="cyan" />
                <SciFiCard theme={theme as AppTheme} title={t.totalStockValue} value={formatCurrency(stats.totalValue, settings.baseCurrency)} icon={DollarSign} color="green" />
                <SciFiCard theme={theme as AppTheme} title={t.itemsLowOnStock} value={stats.lowStockCount.toString()} icon={AlertTriangle} color="orange" />
            </div>

            {/* Toolbar */}
            <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row gap-4 justify-between items-center ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <HoloButton icon={Plus} variant="primary" onClick={handleOpenForm}>{t.addItem}</HoloButton>
                    <HoloButton icon={UploadCloud} variant="secondary" onClick={() => navigate(ROUTES.INVENTORY_IMPORT)}>{t.importFromFile}</HoloButton>
                    <HoloButton icon={ScanLine} variant="secondary" onClick={handleOpenScanner}>{t.scanBarcode}</HoloButton>
                </div>
                
                <div className="flex items-center gap-3 w-full lg:w-auto flex-1 justify-end">
                    <div className={`rounded-lg p-1 flex items-center gap-1 ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-gray-400' : 'text-slate-500')}`}><LayoutGrid size={20} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-gray-400' : 'text-slate-500')}`}><List size={20} /></button>
                    </div>
                    <div className="relative flex-1 max-w-md">
                        <Input 
                            icon={Search} 
                            placeholder={t.searchItems} 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                        <button 
                            onClick={handleAiSearch} 
                            disabled={isAiSearching || !searchTerm}
                            className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'left-2' : 'right-2'} p-1.5 rounded-md transition-colors ${isAiSearching ? 'text-purple-400' : 'text-gray-400 hover:text-purple-400'}`}
                            title={t.smartSearch}
                        >
                            {isAiSearching ? <Loader size={16} className="animate-spin" /> : <Brain size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {renderContent()}

            {/* Modals */}
            {showFormModal && (
                <ProductFormModal 
                    product={editingProduct} 
                    onClose={handleCloseModals} 
                    onSave={handleSaveProduct} 
                />
            )}
            
            {showScannerModal && (
                <BarcodeScannerModal 
                    onClose={handleCloseModals} 
                    onScan={handleScan} 
                />
            )}

            {adjustingProduct && (
                <QuickStockAdjustModal
                    product={adjustingProduct}
                    onClose={handleCloseModals}
                    onSave={handleStockAdjustment}
                />
            )}

            {viewingProduct && (
                <ProductDetailsModal
                    product={viewingProduct}
                    onClose={handleCloseModals}
                    onEdit={(p) => { handleCloseModals(); handleEditProduct(p); }}
                />
            )}
        </div>
    );
};
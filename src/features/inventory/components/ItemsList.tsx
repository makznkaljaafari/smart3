
import React, { useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { SciFiCard } from '../../../components/ui/SciFiCard';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useInventoryData } from '../hooks/useInventoryData';
import { ProductDataTable } from './ProductDataTable';
import { ProductFormModal } from './ProductFormModal';
import { ProductDetailsModal } from './ProductDetailsModal';
import { Plus, Search, Package, DollarSign, AlertTriangle, ChevronLeft, ChevronRight, ServerCrash, ScanLine, Brain, X, Loader, UploadCloud } from 'lucide-react';
import { QuickStockAdjustModal } from './QuickStockAdjustModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ProductCard } from './ProductCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatCurrency } from '../../../lib/formatters';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';

const InventorySkeleton = ({ theme }: { theme: string }) => {
    const shimmerColor = theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200';
    return (
        <div className="space-y-4 animate-pulse">
             {/* Mobile Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {[...Array(4)].map((_, i) => (
                     <div key={i} className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
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

            {/* Desktop Table Skeleton */}
            <div className={`hidden lg:block rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
                <div className={`h-10 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'}`}></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex items-center p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
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

    const {
        stats,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        paginatedProducts,
        filteredProducts,
        stockTotals, // Used here from hook instead of calculating locally
        totalPages,
        productsLoading,
        productsError,
        showFormModal,
        editingProduct,
        adjustingProduct,
        viewingProduct,
        showScannerModal,
        isAiSearching,
        aiFilteredProductIds,
        setAiFilteredProductIds,
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

    const formControlClasses = `px-4 py-2 rounded-lg border focus:outline-none transition-colors ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'}`;

    // Ensure stockTotals is always an object to prevent indexing errors
    const safeStockTotals = (stockTotals || {}) as Record<string, number>;

    const renderContent = () => {
        if (productsLoading) {
            return <InventorySkeleton theme={theme} />;
        }
        if (productsError) {
            return <EmptyState icon={ServerCrash} title="Error" description={productsError} variant="error" />;
        }
        if (paginatedProducts.length > 0) {
            return (
                <>
                    {/* Mobile & Tablet View: Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                        {paginatedProducts.map(product => (
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

                    {/* Desktop View: Table */}
                    <div className="hidden lg:block">
                        <ProductDataTable 
                            products={paginatedProducts} 
                            stockTotals={safeStockTotals}
                            onEdit={handleEditProduct}
                            onDelete={handleDeleteProduct}
                            onQuickAdjust={handleOpenAdjustModal}
                            onView={handleViewProduct}
                        />
                    </div>
                    
                    <div className={`flex items-center justify-between pt-4 mt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                        <span className="text-sm">{t.showing} {paginatedProducts.length} {t.of} {filteredProducts.length}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg disabled:opacity-50"><ChevronLeft size={20} /></button>
                            <span>{t.page} {currentPage} / {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg disabled:opacity-50"><ChevronRight size={20} /></button>
                        </div>
                    </div>
                </>
            );
        }
        
        return (
            <EmptyState 
                icon={Package} 
                title={searchTerm || aiFilteredProductIds ? t.noItemsFound : t.noItemsYet}
                description={searchTerm || aiFilteredProductIds ? t.clearFilters : t.addFirstItem}
                actionLabel={searchTerm || aiFilteredProductIds ? undefined : t.addItem}
                onAction={searchTerm || aiFilteredProductIds ? undefined : handleOpenForm}
            />
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SciFiCard theme={theme} title={t.totalItems} value={stats.totalCount.toString()} icon={Package} color="cyan" />
                <SciFiCard theme={theme} title={t.totalStockValue} value={formatCurrency(stats.totalValue, settings.baseCurrency)} icon={DollarSign} color="green" />
                <SciFiCard theme={theme} title={t.itemsLowOnStock} value={stats.lowStockCount.toString()} icon={AlertTriangle} color="orange" />
            </div>
            <div className={`flex flex-wrap gap-4 items-center justify-between p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex flex-wrap gap-2">
                    <HoloButton icon={Plus} variant="primary" onClick={handleOpenForm}>{t.addItem}</HoloButton>
                    <HoloButton icon={ScanLine} variant="secondary" onClick={handleOpenScanner}>{t.scanBarcode}</HoloButton>
                    <HoloButton icon={UploadCloud} variant="secondary" onClick={() => navigate(ROUTES.INVENTORY_IMPORT)}>{t.import}</HoloButton>
                </div>
                <div className="flex items-center gap-2">
                     {aiFilteredProductIds !== null && (
                        <div className="flex items-center gap-2 text-sm text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/30">
                            <Brain size={16} />
                            <span>{t.aiSearchResults}</span>
                            <button onClick={() => setAiFilteredProductIds(null)} className="p-0.5 rounded-full hover:bg-white/20">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div className="relative flex-1 min-w-[200px]"><Search className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'right-3' : 'left-3'} text-gray-400`} size={20} /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()} placeholder={t.searchItems} className={`${formControlClasses} w-full ${lang === 'ar' ? 'pr-10' : 'pl-10'}`}/></div>
                    <HoloButton 
                        icon={isAiSearching ? Loader : Brain}
                        onClick={handleAiSearch}
                        disabled={isAiSearching || !searchTerm.trim()}
                        className={`!py-2.5 !px-3.5 ${isAiSearching ? 'animate-pulse' : ''}`}
                        title={t.smartSearch}
                    >
                        {t.smartSearch}
                    </HoloButton>
                </div>
            </div>

            {renderContent()}

            {showFormModal && <ProductFormModal product={editingProduct} onClose={handleCloseModals} onSave={handleSaveProduct} />}
            {adjustingProduct && (
                <QuickStockAdjustModal
                    product={adjustingProduct}
                    onClose={handleCloseModals}
                    onSave={(warehouseId, newQuantity) => handleStockAdjustment(warehouseId, newQuantity)}
                />
            )}
            {showScannerModal && (
                <BarcodeScannerModal
                    onClose={handleCloseModals}
                    onScan={handleScan}
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

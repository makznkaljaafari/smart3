
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Product, Toast, InventoryLevel } from '../../../types';
import { inventoryService } from '../api/inventoryService';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { callAIProxy } from '../../../lib/aiClient';

export interface InventoryOverviewStats {
    totalValue: number;
    lowStockCount: number;
    totalSku: number;
    totalCount: number; // Mapped from totalSku for UI compatibility
}

export const useInventoryData = () => {
    const { lang, authUser, settings, currentCompany, addToast } = useZustandStore(state => ({
        lang: state.lang,
        authUser: state.authUser,
        settings: state.settings,
        currentCompany: state.currentCompany,
        addToast: state.addToast
    }));
    const t = translations[lang];
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = settings.page.inventory.pageSize || 12;

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [isAiSearching, setIsAiSearching] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Data Fetching
    const { data: productsData, isLoading: productsLoading, error: productsErrorObj } = useQuery({
        queryKey: ['products', currentCompany?.id, currentPage, pageSize, debouncedSearch],
        queryFn: () => inventoryService.getProductsPaginated({
            page: currentPage,
            pageSize,
            search: debouncedSearch
        }),
        placeholderData: keepPreviousData,
        enabled: !!currentCompany?.id
    });

    const products = productsData?.data || [];
    const totalCount = productsData?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const { data: statsData } = useQuery({
        queryKey: ['inventoryStats', currentCompany?.id],
        queryFn: inventoryService.getInventoryOverviewStats,
        enabled: !!currentCompany?.id
    });

    // Map the API stats to the interface with explicit typing
    const stats: InventoryOverviewStats = useMemo(() => {
        const data = statsData?.data || { totalValue: 0, lowStockCount: 0, totalSku: 0 };
        return {
            totalValue: data.totalValue,
            lowStockCount: data.lowStockCount,
            totalSku: data.totalSku,
            totalCount: data.totalSku 
        };
    }, [statsData]);

    const { data: inventoryLevelsData } = useQuery({
        queryKey: ['inventoryLevels', currentCompany?.id],
        queryFn: inventoryService.getInventoryLevels,
        enabled: !!currentCompany?.id
    });

    // Aggregate stock totals with strict typing
    const stockTotals = useMemo(() => {
        const levels: InventoryLevel[] = inventoryLevelsData?.data || [];
        const totals: Record<string, number> = {};
        levels.forEach((l: InventoryLevel) => {
            totals[l.productId] = (totals[l.productId] || 0) + l.quantity;
        });
        return totals;
    }, [inventoryLevelsData]);

    // Handlers
    const handleCloseModals = useCallback(() => {
        setShowFormModal(false);
        setEditingProduct(null);
        setAdjustingProduct(null);
        setViewingProduct(null);
        setShowScannerModal(false);
    }, []);

    const handleOpenForm = useCallback(() => {
        setEditingProduct(null);
        setShowFormModal(true);
    }, []);

    const handleEditProduct = useCallback((product: Product) => {
        setEditingProduct(product);
        setShowFormModal(true);
    }, []);

    const handleDeleteProduct = useCallback(async (id: string) => {
        if (!confirm(t.areYouSureDeleteItem)) return;
        
        try {
            await inventoryService.deleteProduct(id);
            addToast({ message: t.itemDeletedSuccess, type: 'info' });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
        } catch (e: any) {
            addToast({ message: e.message || 'Error deleting product', type: 'error' });
        }
    }, [t, addToast, queryClient]);

    const handleSaveProduct = useCallback(async (data: Partial<Product>) => {
        if (!authUser) return;
        try {
            await inventoryService.saveProduct(data, !editingProduct);
            addToast({ message: editingProduct ? t.itemSavedSuccess : t.itemSavedSuccess, type: 'success' });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
            handleCloseModals();
        } catch (e: any) {
            addToast({ message: e.message || 'Error saving product', type: 'error' });
        }
    }, [authUser, editingProduct, addToast, t, queryClient, handleCloseModals]);

    const handleOpenAdjustModal = useCallback((product: Product) => {
        setAdjustingProduct(product);
    }, []);

    const handleStockAdjustment = useCallback(async (warehouseId: string, newQuantity: number, adjustmentAccountId?: string) => {
        if (!adjustingProduct) return;
        try {
            const { error } = await inventoryService.adjustStockLevel(adjustingProduct.id, warehouseId, newQuantity, adjustmentAccountId);
            if (error) throw error;
            
            addToast({ message: t.stockAdjustedSuccess, type: 'success' });
            queryClient.invalidateQueries({ queryKey: ['inventoryLevels'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
            handleCloseModals();
        } catch (e: any) {
            addToast({ message: e.message || 'Error adjusting stock', type: 'error' });
        }
    }, [adjustingProduct, addToast, t, queryClient, handleCloseModals]);

    const handleOpenScanner = useCallback(() => {
        setShowScannerModal(true);
    }, []);

    const handleScan = useCallback((barcode: string) => {
        setShowScannerModal(false);
        setSearchTerm(barcode);
    }, []);

    const handleViewProduct = useCallback((product: Product) => {
        setViewingProduct(product);
    }, []);

    const handleAiSearch = useCallback(async () => {
        if (!searchTerm.trim()) return;
        setIsAiSearching(true);
        try {
            const prompt = `Enhance this search term for an auto parts inventory: "${searchTerm}". Return only the key terms separated by space.`;
            const enhanced = await callAIProxy(prompt);
            if (enhanced) {
                setSearchTerm(enhanced.trim());
                addToast({ message: 'تم تحسين البحث بواسطة الذكاء الاصطناعي', type: 'info' });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAiSearching(false);
        }
    }, [searchTerm, addToast]);

    // Client-side filtering wrapper (strict typed pass-through)
    const displayedProducts = useMemo(() => {
         return products.filter((p: Product) => {
             return true; 
         });
    }, [products]);

    return {
        stats,
        searchTerm,
        setSearchTerm,
        viewMode,
        setViewMode,
        currentPage,
        setCurrentPage,
        paginatedProducts: displayedProducts, 
        stockTotals,
        totalPages,
        productsLoading,
        productsError: productsErrorObj ? (productsErrorObj as Error).message : null,
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
    };
};

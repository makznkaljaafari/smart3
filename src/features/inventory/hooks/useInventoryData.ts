
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { Product, Toast } from '../../../types';
import { inventoryService } from '../api/inventoryService';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';

export const useInventoryData = () => {
    const { lang, settings, authUser, currentCompany } = useZustandStore(state => ({
        lang: state.lang,
        settings: state.settings,
        authUser: state.authUser,
        currentCompany: state.currentCompany,
    }));
    const queryClient = useQueryClient();

    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = settings.page.inventory?.pageSize || 20;

    // Modal State
    const [showFormModal, setShowFormModal] = useState(false);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    
    // AI Search State
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [aiFilteredProductIds, setAiFilteredProductIds] = useState<string[] | null>(null);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Queries
    const { data: productsData, isLoading: productsLoading, error: productsErrorObj } = useQuery({
        queryKey: ['products', currentCompany?.id, currentPage, pageSize, debouncedSearch, aiFilteredProductIds],
        queryFn: async () => {
            // Note: In a real implementation, we would pass aiFilteredProductIds to the service
            // to filter on the backend if the list is large. For now we use standard search.
            return inventoryService.getProductsPaginated({
                page: currentPage,
                pageSize,
                search: debouncedSearch
            });
        },
        placeholderData: keepPreviousData,
        enabled: !!currentCompany?.id,
    });
    
    const { data: inventoryLevelsData } = useQuery({
        queryKey: ['inventoryLevels', currentCompany?.id],
        queryFn: inventoryService.getInventoryLevels,
        enabled: !!currentCompany?.id
    });
    
    const { data: overviewStats } = useQuery({
        queryKey: ['inventoryStats', currentCompany?.id],
        queryFn: inventoryService.getInventoryOverviewStats,
        enabled: !!currentCompany?.id
    });

    const products = productsData?.data || [];
    const totalCount = productsData?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Aggregate stock totals
    const stockTotals = useMemo(() => {
        const levels = inventoryLevelsData?.data || [];
        const totals: Record<string, number> = {};
        levels.forEach(l => {
            totals[l.productId] = (totals[l.productId] || 0) + l.quantity;
        });
        return totals;
    }, [inventoryLevelsData]);

    const stats = useMemo(() => {
        const os = overviewStats?.data || { totalValue: 0, lowStockCount: 0, totalSku: 0 };
        // Return a type safe object, cast to any in component if needed for 'totalCount' property mapping
        return {
            totalSku: os.totalSku,
            totalCount: os.totalSku, // Map totalSku to totalCount for component compatibility
            totalValue: os.totalValue,
            lowStockCount: os.lowStockCount
        };
    }, [overviewStats]);

    // Handlers
    const handleOpenForm = () => { setEditingProduct(null); setShowFormModal(true); };
    const handleCloseModals = () => { 
        setShowFormModal(false); 
        setShowScannerModal(false); 
        setEditingProduct(null);
        setAdjustingProduct(null);
        setViewingProduct(null);
    };

    const handleEditProduct = (product: Product) => { setEditingProduct(product); setShowFormModal(true); };
    const handleViewProduct = (product: Product) => { setViewingProduct(product); };
    const handleOpenAdjustModal = (product: Product) => { setAdjustingProduct(product); };
    const handleOpenScanner = () => { setShowScannerModal(true); };

    // Mutations
    const saveMutation = useMutation({
        mutationFn: async (product: Partial<Product>) => {
            const isNew = !product.id;
            const { error } = await inventoryService.saveProduct(product, isNew);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
            addToast('Product saved successfully', 'success');
            handleCloseModals();
        },
        onError: (e: any) => addToast(e.message, 'error')
    });

    const handleSaveProduct = async (product: Partial<Product>) => {
        await saveMutation.mutateAsync(product);
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await inventoryService.deleteProduct(id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
            addToast('Product deleted', 'info');
        },
        onError: (e: any) => addToast(e.message, 'error')
    });

    const handleDeleteProduct = async (id: string) => {
        if(confirm('Are you sure?')) await deleteMutation.mutateAsync(id);
    };

    const adjustMutation = useMutation({
        mutationFn: async (data: { warehouseId: string, quantity: number, accountId?: string }) => {
            if (!adjustingProduct) return;
            const { error } = await inventoryService.adjustStockLevel(adjustingProduct.id, data.warehouseId, data.quantity, data.accountId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryLevels'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
            addToast('Stock updated', 'success');
            handleCloseModals();
        },
        onError: (e: any) => addToast(e.message, 'error')
    });

    const handleStockAdjustment = async (warehouseId: string, quantity: number, accountId?: string) => {
        await adjustMutation.mutateAsync({ warehouseId, quantity, accountId });
    };

    const handleScan = (code: string) => {
        setSearchTerm(code);
        setShowScannerModal(false);
    };

    // AI Search
    const handleAiSearch = async () => {
        if (!searchTerm.trim()) return;
        setIsAiSearching(true);
        try {
            const { data: allProducts } = await inventoryService.getProductsPaginated({ page: 1, pageSize: 100 }); // Limited context for demo
            
            // Explicitly typing p as any to avoid implicit any error
            const productList = allProducts.map((p: any) => ({ id: p.id, name: p.name, desc: p.description, sku: p.sku }));
            const prompt = `Filter these products based on the query: "${searchTerm}". Return JSON array of matching IDs. Products: ${JSON.stringify(productList)}`;
            
            const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
            if (text) {
                const ids = JSON.parse(cleanJsonString(text));
                if (Array.isArray(ids)) {
                     setAiFilteredProductIds(ids);
                     if(ids.length > 0) addToast(`AI found ${ids.length} matches.`, 'info');
                     else addToast('AI found no matches.', 'warning');
                }
            }
        } catch (e) {
            console.error(e);
            addToast('AI Search failed', 'error');
        } finally {
            setIsAiSearching(false);
        }
    };

    return {
        stats,
        searchTerm, setSearchTerm,
        viewMode, setViewMode,
        currentPage, setCurrentPage,
        paginatedProducts: products,
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

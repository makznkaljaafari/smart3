
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Product, Toast } from '../../../types';
import { inventoryService } from '../../../services/inventoryService';
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';

export const useInventoryData = () => {
  const { lang, settings, authUser, currentCompany } = useZustandStore(
    state => ({
      lang: state.lang,
      settings: state.settings,
      authUser: state.authUser,
      currentCompany: state.currentCompany,
    })
  );
  const t = translations[lang];
  const queryClient = useQueryClient();

  const [searchTerm, _setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiFilteredProductIds, setAiFilteredProductIds] = useState<string[] | null>(null);

  const pageSize = settings.page.inventory.pageSize || 9;

  useEffect(() => {
      const timer = setTimeout(() => {
          setDebouncedSearch(searchTerm);
          setCurrentPage(1);
      }, 500);
      return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    useZustandStore.setState(s => ({ toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }] }));
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    _setSearchTerm(term);
    if (aiFilteredProductIds !== null) {
        setAiFilteredProductIds(null);
    }
  }, [aiFilteredProductIds]);

  // --- React Query: Fetch Products ---
  const { data: productsData, isLoading: productsLoading, isError: isProductsError, error: productsErrorObj } = useQuery({
      queryKey: ['products', currentCompany?.id, currentPage, pageSize, debouncedSearch],
      queryFn: () => inventoryService.getProductsPaginated({
          page: currentPage,
          pageSize,
          search: debouncedSearch
      }),
      placeholderData: keepPreviousData,
      enabled: !!currentCompany?.id,
  });

  const products = productsData?.data || [];
  const totalCount = productsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // --- React Query: Fetch Stock Levels (Optimized) ---
  const productIdsOnPage = useMemo(() => products.map(p => p.id), [products]);
  
  const { data: stockLevelsData } = useQuery({
      queryKey: ['stockLevels', currentCompany?.id, productIdsOnPage],
      queryFn: () => inventoryService.getAggregatedStockLevels(productIdsOnPage),
      enabled: !!currentCompany?.id && productIdsOnPage.length > 0,
      staleTime: 1000 * 30, // Cache for 30s
  });

  const stockTotals = stockLevelsData?.data || {};

  const { data: statsData } = useQuery({
      queryKey: ['inventoryStats', currentCompany?.id],
      queryFn: inventoryService.getInventoryOverviewStats,
      enabled: !!currentCompany?.id,
  });

  const displayedProducts = useMemo(() => {
      if (aiFilteredProductIds !== null) {
         return products.filter(p => aiFilteredProductIds.includes(p.id));
      }
      return products;
  }, [products, aiFilteredProductIds]);

  
  const stats = useMemo(() => {
      const data = statsData?.data;
      return {
        totalCount: data?.totalSku || 0,
        totalValue: data?.totalValue || 0,
        lowStockCount: data?.lowStockCount || 0,
        totalSku: data?.totalSku || 0
      };
  }, [statsData]);
  
  const handleAiSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;

    setIsAiSearching(true);
    addToast({ message: t.aiSearching || 'AI Search in progress...', type: 'info' });

    try {
        // Only fetch a subset for AI context (top 50) to avoid overloading payload
        const { data: allProductsShort } = await inventoryService.getProductsPaginated({ page: 1, pageSize: 50, search: searchTerm }); 

        const productList = allProductsShort.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            description: p.description || '',
        }));

        const prompt = `You are an intelligent search assistant for a car parts inventory system.
        Analyze the user's search query and the provided list of products.
        Return a JSON array containing only the IDs of the products that are the most relevant matches.
        
        User Query: "${searchTerm}"
        
        Available Products (subset): 
        ${JSON.stringify(productList)}
        `;

        const text = await callAIProxy(prompt, {
            responseMimeType: 'application/json',
            responseSchema: {
                type: 'ARRAY',
                items: { type: 'STRING' }
            }
        });
        
        const resultIds = JSON.parse(cleanJsonString(text || '[]')) as string[];
        setAiFilteredProductIds(resultIds);
        addToast({ message: (t.aiSearchFound || `AI found {count} results.`).replace('{count}', resultIds.length.toString()), type: 'success' });

    } catch (e: any) {
        console.error("AI Search failed:", e);
        addToast({ message: t.aiSearchFailed || 'AI search failed.', type: 'error' });
        setAiFilteredProductIds([]);
    } finally {
        setIsAiSearching(false);
    }
  }, [searchTerm, addToast, t]);


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

  const handleOpenAdjustModal = useCallback((product: Product) => {
    setAdjustingProduct(product);
  }, []);

  const handleOpenScanner = useCallback(() => {
    setShowScannerModal(true);
  }, []);

  const handleScan = useCallback((barcode: string) => {
    _setSearchTerm(barcode);
    handleCloseModals();
    addToast({ message: `${t.foundBarcode}: ${barcode}`, type: 'info' });
  }, [handleCloseModals, addToast, t]);

  const handleStockAdjustment = useCallback(async (warehouseId: string, newQuantity: number) => {
    if (!adjustingProduct || !authUser) return;

    const { error } = await inventoryService.adjustStockLevel(adjustingProduct.id, warehouseId, newQuantity);
    
    if (error) {
        addToast({message: error.message, type: 'error'});
        throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
    queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
    
    addToast({message: t.stockAdjustedSuccess, type: 'success'});
    handleCloseModals();

  }, [adjustingProduct, authUser, addToast, t, handleCloseModals, queryClient]);


  const handleSaveProduct = useCallback(async (data: Partial<Product>): Promise<void> => {
    if (!authUser) throw new Error('User not authenticated.');
    const isNew = !editingProduct;
    
    const finalData = isNew 
      ? { ...data, sku: `SKU-${Date.now().toString().slice(-6)}` }
      : data;

    const { error } = await inventoryService.saveProduct(finalData, isNew);

    if (error) {
      addToast({message: error.message, type: 'error'});
      throw error;
    }
    
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
    addToast({message: t.itemSavedSuccess, type: 'success'});
    handleCloseModals();
  }, [editingProduct, authUser, addToast, t, handleCloseModals, queryClient]);

  const handleDeleteProduct = useCallback(async (id: string) => {
    if (confirm(t.areYouSureDeleteItem)) {
      const { error } = await inventoryService.deleteProduct(id);
      if (error) {
        addToast({message: error.message, type: 'error'});
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      addToast({message: t.itemDeletedSuccess, type: 'info'});
    }
  }, [t, addToast, queryClient]);
  
  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setShowFormModal(true);
  }, []);

  const handleViewProduct = useCallback((product: Product) => {
      setViewingProduct(product);
  }, []);

  return {
    stats,
    searchTerm, setSearchTerm,
    viewMode, setViewMode,
    currentPage, setCurrentPage,
    paginatedProducts: displayedProducts,
    filteredProducts: displayedProducts,
    stockTotals,
    totalPages,
    productsLoading,
    productsError: isProductsError ? (productsErrorObj as Error).message : null,
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
  };
};

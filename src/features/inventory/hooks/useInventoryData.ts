
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { inventoryService } from '../api/inventoryService';
import { Product, Toast } from '../../../types';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';

export const useInventoryData = () => {
  const { lang, currentCompany, settings } = useZustandStore(state => ({
      lang: state.lang,
      currentCompany: state.currentCompany,
      settings: state.settings
  }));
  const queryClient = useQueryClient();
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
      useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = settings.page.inventory.pageSize || 15;

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  
  const [aiFilteredProductIds, setAiFilteredProductIds] = useState<string[] | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Queries
  const { data: productsData, isLoading: productsLoading, isError, error } = useQuery({
      queryKey: ['products', currentCompany?.id, currentPage, pageSize, debouncedSearch],
      queryFn: () => inventoryService.getProductsPaginated({
          page: currentPage,
          pageSize,
          search: debouncedSearch
      }),
      placeholderData: keepPreviousData,
      enabled: !!currentCompany?.id
  });

  const { data: statsData } = useQuery({
      queryKey: ['inventoryStats', currentCompany?.id],
      queryFn: inventoryService.getInventoryOverviewStats,
      enabled: !!currentCompany?.id
  });

  const products = productsData?.data || [];
  const totalCount = productsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const stats = statsData?.data || { totalValue: 0, lowStockCount: 0, totalCount: 0 };
  stats.totalCount = totalCount; // Sync count with paginated query total

  // Stock Levels (Aggregated for display in list)
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const { data: stockLevels } = useQuery({
      queryKey: ['stockAggregated', productIds],
      queryFn: () => inventoryService.getAggregatedStockLevels(productIds),
      enabled: productIds.length > 0
  });
  const stockTotals = stockLevels?.data || {};

  // AI Search
  const handleAiSearch = async () => {
      if (!searchTerm.trim()) return;
      setIsAiSearching(true);
      try {
          // Need all products for AI search context - this is heavy, ideally done backend.
          // For now, we fetch a larger set or just use current page context + search API
          const { data: allProducts } = await inventoryService.getProductsPaginated({ page: 1, pageSize: 1000 });
          
          const productList = allProducts.map(p => ({ id: p.id, name: p.name, desc: p.description, sku: p.sku }));
          const prompt = `Filter these products based on the query: "${searchTerm}". Return JSON array of matching IDs. Products: ${JSON.stringify(productList)}`;
          
          const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });
          if (text) {
              const ids = JSON.parse(cleanJsonString(text));
              setAiFilteredProductIds(ids);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsAiSearching(false);
      }
  };
  
  // Filter products if AI search active
  const displayedProducts = useMemo(() => {
      if (aiFilteredProductIds !== null) {
         // Fix: explicitly type p as any to resolve implicit any error
         return products.filter((p: any) => aiFilteredProductIds.includes(p.id));
      }
      return products;
  }, [products, aiFilteredProductIds]);

  // Mutations
  const saveMutation = useMutation({
      mutationFn: async (data: { product: Partial<Product>, isNew: boolean }) => {
          const { error } = await inventoryService.saveProduct(data.product, data.isNew);
          if (error) throw error;
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
          addToast('تم حفظ المنتج بنجاح', 'success');
          handleCloseModals();
      },
      onError: (err: any) => addToast(err.message, 'error')
  });

  const deleteMutation = useMutation({
      mutationFn: async (id: string) => {
          const { error } = await inventoryService.deleteProduct(id);
          if (error) throw error;
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
          addToast('تم حذف المنتج', 'info');
      },
      onError: (err: any) => addToast(err.message, 'error')
  });

  // Handlers
  const handleOpenForm = () => { setEditingProduct(null); setShowFormModal(true); };
  const handleCloseModals = () => {
      setShowFormModal(false);
      setEditingProduct(null);
      setAdjustingProduct(null);
      setViewingProduct(null);
      setShowScannerModal(false);
  };

  const handleEditProduct = (p: Product) => { setEditingProduct(p); setShowFormModal(true); };
  const handleDeleteProduct = async (id: string) => { if(confirm('Are you sure?')) await deleteMutation.mutateAsync(id); };
  
  const handleSaveProduct = async (p: Partial<Product>) => {
      await saveMutation.mutateAsync({ product: p, isNew: !editingProduct });
  };
  
  const handleOpenAdjustModal = (p: Product) => setAdjustingProduct(p);
  
  const handleStockAdjustment = async (warehouseId: string, newQuantity: number, adjustmentAccountId?: string) => {
      if (!adjustingProduct) return;
      const { error } = await inventoryService.adjustStockLevel(adjustingProduct.id, warehouseId, newQuantity, adjustmentAccountId);
      if (error) {
          addToast(error.message, 'error');
      } else {
          addToast('Stock adjusted successfully', 'success');
          queryClient.invalidateQueries({ queryKey: ['stockAggregated'] });
          queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
          handleCloseModals();
      }
  };

  const handleOpenScanner = () => setShowScannerModal(true);
  const handleScan = (code: string) => {
      setSearchTerm(code);
      setShowScannerModal(false);
  };
  
  const handleViewProduct = (p: Product) => setViewingProduct(p);

  return {
    stats,
    searchTerm, setSearchTerm,
    viewMode, setViewMode,
    currentPage, setCurrentPage,
    paginatedProducts: displayedProducts,
    stockTotals,
    totalPages,
    productsLoading,
    productsError: isError ? (error as Error).message : null,
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

import { useState, useCallback } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Stocktake, Toast, Product } from '../../../types';
import { inventoryService } from '../../../services/inventoryService';
import { salesService } from '../../../services/salesService';
import { Type } from '@google/genai';
import { generateStocktakeSummary } from '../../../services/aiService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callAIProxy } from '../../../lib/aiClient';

export const useStocktakeData = () => {
    const { 
        authUser, products, lang, currentCompany
    } = useZustandStore(state => ({
        authUser: state.authUser,
        products: state.products,
        lang: state.lang,
        currentCompany: state.currentCompany,
    }));
    const { fetchInventoryLevels } = useZustandStore.getState();
    const t = translations[lang];
    const queryClient = useQueryClient();

    const [showInitiationModal, setShowInitiationModal] = useState(false);
    const [showCountingModal, setShowCountingModal] = useState(false);
    const [activeStocktake, setActiveStocktake] = useState<Stocktake | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // State for AI suggestions
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [suggestedProducts, setSuggestedProducts] = useState<Product[] | null>(null);

    // State for AI summary
    const [summaryTarget, setSummaryTarget] = useState<Stocktake | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryResult, setSummaryResult] = useState<string | null>(null);
    const [summaryError, setSummaryError] = useState<string | null>(null);


    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    // --- React Query ---
    const { data: stocktakesData, isLoading: stocktakesLoading, error: stocktakesErrorObj } = useQuery({
        queryKey: ['stocktakes', currentCompany?.id],
        queryFn: inventoryService.getStocktakes,
        enabled: !!currentCompany?.id
    });

    const stocktakes = stocktakesData?.data || [];
    const stocktakesError = stocktakesErrorObj ? (stocktakesErrorObj as Error).message : null;

    const handleCloseModals = useCallback(() => {
        setShowInitiationModal(false);
        setShowCountingModal(false);
        setActiveStocktake(null);
        setSummaryTarget(null);
        setSummaryResult(null);
        setSummaryError(null);
    }, []);

    const handleOpenInitiation = useCallback(() => setShowInitiationModal(true), []);

    const generateSmartSuggestions = async () => {
        setIsGeneratingSuggestions(true);
        setSuggestionError(null);
        setSuggestedProducts(null);

        try {
            // Fetch recent sales data on demand
            const { data: recentSalesData } = await salesService.getSalesPaginated({ pageSize: 500 });
            const sales = recentSalesData || [];

            const productData = products.map(p => ({ id: p.id, name: p.name, costPrice: p.costPrice, sellingPrice: p.sellingPrice }));
            
            const recentSalesMapped = sales
                .flatMap(s => s.items.map((item: any) => ({ productId: item.productId, quantity: item.quantity, date: s.date })))
                .filter(s => new Date(s.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
                
            const previousDiscrepancies = stocktakes
                .filter(st => st.status === 'completed')
                .flatMap(st => st.items.map(item => ({ productId: item.productId, discrepancy: (item.countedQuantity ?? 0) - item.expectedQuantity })))
                .filter(d => d.discrepancy !== 0);

            const prompt = `You are an expert inventory management AI. Your task is to analyze sales data and previous stocktake discrepancies to identify high-risk products for a cycle count. High-risk items include fast-moving items and items with past discrepancies. Analyze the following data and return a JSON array of the top 5 most critical product IDs to count.

            Data:
            - Products: ${JSON.stringify(productData.slice(0, 50))}
            - Recent Sales (last 90 days): ${JSON.stringify(recentSalesMapped.slice(0, 100))}
            - Previous Stocktake Discrepancies: ${JSON.stringify(previousDiscrepancies.slice(0, 100))}
            `;

            const responseText = await callAIProxy(prompt, {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            });
            
            if (responseText) {
                const suggestedIds = JSON.parse(responseText) as string[];
                const matchingProducts = products.filter(p => suggestedIds.includes(p.id));
                setSuggestedProducts(matchingProducts);
            } else {
                throw new Error("No response from AI");
            }

        } catch (e: any) {
            console.error("AI suggestion failed:", e);
            setSuggestionError(e.message || "Failed to generate suggestions.");
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };
    
    const clearSuggestions = () => {
        setSuggestedProducts(null);
        setSuggestionError(null);
    };


    const handleInitiate = async (warehouseId: string, isBlind: boolean) => {
        if (!authUser) return;
        setIsSaving(true);
        const { error } = await inventoryService.createStocktake(warehouseId, isBlind);
        if (error) {
            addToast(error.message, 'error');
            setIsSaving(false);
            return;
        }
        addToast(t.stocktakeInitiatedSuccess, 'success');
        queryClient.invalidateQueries({ queryKey: ['stocktakes'] });
        handleCloseModals();
        clearSuggestions();
        setIsSaving(false);
    };

    const handleSelectStocktake = async (stocktakeId: string) => {
        const { data, error } = await inventoryService.getStocktakeDetails(stocktakeId);
        if (error) {
            addToast(error.message, 'error');
            return;
        }
        setActiveStocktake(data as Stocktake);
        setShowCountingModal(true);
    };
    
    const handleSaveProgress = async (stocktakeId: string, items: { product_id: string, counted_quantity: number | null }[]) => {
        const { error } = await inventoryService.updateStocktakeItems(stocktakeId, items);
        if (error) {
            addToast(error.message, 'error');
        } else {
            addToast('تم حفظ التقدم بنجاح.', 'info');
        }
    };
    
    const handleComplete = async (stocktakeId: string) => {
        if (confirm(t.areYouSureCompleteStocktake)) {
            setIsSaving(true);
            try {
                const itemsToUpdate = activeStocktake?.items.map(i => ({ product_id: i.productId, counted_quantity: i.countedQuantity })) || [];
                if (itemsToUpdate.length > 0) {
                    await handleSaveProgress(stocktakeId, itemsToUpdate); // Save progress first
                }
                const { error } = await inventoryService.completeStocktake(stocktakeId);
                if (error) {
                    addToast(error.message, 'error');
                    return;
                }
                addToast(t.stocktakeCompletedSuccess, 'success');
                queryClient.invalidateQueries({ queryKey: ['stocktakes'] });
                await fetchInventoryLevels();
                handleCloseModals();
            } catch (e) {
                console.error("Failed to complete stocktake:", e);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleGenerateSummary = async (stocktakeId: string) => {
        setIsGeneratingSummary(true);
        setSummaryError(null);
        setSummaryResult(null);

        const { data, error } = await inventoryService.getStocktakeDetails(stocktakeId);
        if (error || !data) {
            setSummaryError(error?.message || "Failed to fetch stocktake details.");
            setIsGeneratingSummary(false);
            return;
        }
        
        setSummaryTarget(data as Stocktake);
        const summary = await generateStocktakeSummary(data as Stocktake, lang);
        
        if (summary) {
            setSummaryResult(summary);
        } else {
            setSummaryError("Failed to generate summary.");
        }
        setIsGeneratingSummary(false);
    };


    return {
        stocktakes,
        stocktakesLoading,
        stocktakesError,
        showInitiationModal,
        showCountingModal,
        activeStocktake,
        isSaving,
        isGeneratingSuggestions,
        suggestionError,
        suggestedProducts,
        summaryTarget,
        isGeneratingSummary,
        summaryResult,
        summaryError,
        generateSmartSuggestions,
        clearSuggestions,
        handleOpenInitiation,
        handleCloseModals,
        handleInitiate,
        handleSelectStocktake,
        handleSaveProgress,
        handleComplete,
        handleGenerateSummary,
    };
};
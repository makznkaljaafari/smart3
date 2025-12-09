
import { useState, useCallback } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Stocktake, Toast, Product } from '../../../types';
import { inventoryService } from '../api/inventoryService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';
import { salesService } from '../../sales/api/salesService';

export const useStocktakeData = () => {
    const { authUser, currentCompany, lang } = useZustandStore(state => ({
        authUser: state.authUser,
        currentCompany: state.currentCompany,
        lang: state.lang,
    }));
    const t = translations[lang];
    const queryClient = useQueryClient();
    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    const [activeStocktake, setActiveStocktake] = useState<Stocktake | null>(null);
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    const [showCountingModal, setShowCountingModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Summary Generation
    const [summaryResult, setSummaryResult] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    // Smart Suggestions
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<Product[] | null>(null);

    const { data: stocktakesData, isLoading, error: queryError } = useQuery({
        queryKey: ['stocktakes', currentCompany?.id],
        queryFn: inventoryService.getStocktakes,
        enabled: !!currentCompany?.id
    });

    const stocktakes = stocktakesData?.data || [];
    const error = queryError ? (queryError as Error).message : null;

    const handleCloseModals = useCallback(() => {
        setShowInitiateModal(false);
        setShowCountingModal(false);
        setShowSummaryModal(false);
        setShowSuggestionModal(false);
        setActiveStocktake(null);
    }, []);

    const handleOpenInitiate = () => setShowInitiateModal(true);

    const handleInitiate = async (warehouseId: string, isBlind: boolean) => {
        if (!authUser) return;
        setIsSaving(true);
        const { error } = await inventoryService.createStocktake(warehouseId, isBlind);
        if (error) {
            addToast((error as Error).message, 'error');
            setIsSaving(false);
            return;
        }
        
        queryClient.invalidateQueries({ queryKey: ['stocktakes'] });
        addToast(t.stocktakeInitiatedSuccess, 'success');
        handleCloseModals();
        setIsSaving(false);
    };

    const handleSelectStocktake = async (stocktakeId: string) => {
        const { data, error } = await inventoryService.getStocktakeDetails(stocktakeId);
        if (error) {
            addToast((error as Error).message, 'error');
            return;
        }
        setActiveStocktake(data as Stocktake);
        setShowCountingModal(true);
    };
    
    const handleSaveProgress = async (stocktakeId: string, items: { product_id: string, counted_quantity: number | null }[]) => {
        const { error } = await inventoryService.updateStocktakeItems(stocktakeId, items);
        if (error) {
            addToast((error as Error).message, 'error');
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
                    addToast((error as Error).message, 'error');
                    return;
                }
                addToast(t.stocktakeCompletedSuccess, 'success');
                queryClient.invalidateQueries({ queryKey: ['stocktakes'] });
                useZustandStore.getState().fetchInventoryLevels();
                handleCloseModals();
            } catch (e: any) {
                console.error("Failed to complete stocktake:", e);
                // Fix: Cast e to any to access message safely
                const errMsg = (e as any).message || String(e);
                addToast(errMsg || 'Failed to complete', 'error');
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
            setSummaryError((error as Error)?.message || "Failed to fetch stocktake details.");
            setIsGeneratingSummary(false);
            return;
        }

        setShowSummaryModal(true);
        try {
             // Import generateStocktakeSummary from AI service
             const { generateStocktakeSummary } = await import('../api/inventoryAiService');
             const summary = await generateStocktakeSummary(data, lang);
             setSummaryResult(summary);
        } catch (e: any) {
             setSummaryError(e.message || "AI Generation Failed");
        } finally {
             setIsGeneratingSummary(false);
        }
    };
    
    // AI Suggestion for what to count
    const handleSmartSuggestion = async () => {
        setIsGeneratingSuggestions(true);
        setSuggestionError(null);
        setSuggestions(null);
        setShowSuggestionModal(true);

        try {
            // Fetch relevant data: Recent sales, past discrepancies
            const { data: sales } = await salesService.getSalesPaginated({ pageSize: 1000 });
            
            const recentSalesMapped = sales
                .flatMap((s: any) => s.items.map((item: any) => ({ productId: item.productId, quantity: item.quantity, date: s.date })))
                .filter((s: any) => new Date(s.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
                
            const previousDiscrepancies = stocktakes
                .filter((st: any) => st.status === 'completed') // st is typed as any here to fix implicit any from filter param
                .slice(0, 1);
            
            // Just use sales data for now to keep it simple
            const prompt = `
                You are an inventory AI. Analyze this sales data to suggest top 5 high-risk products that should be counted today (cycle counting).
                High risk = High volume sales.
                Sales Data: ${JSON.stringify(recentSalesMapped.slice(0, 50))}
                Return ONLY a JSON array of Product IDs.
            `;
            
            const text = await callAIProxy(prompt, { responseMimeType: "application/json" });
            if (text) {
                const productIds = JSON.parse(cleanJsonString(text));
                const { data: allProducts } = await inventoryService.getProducts();
                // Fix: Explicitly type p to avoid implicit any
                const suggestedProducts = allProducts.filter((p: any) => productIds.includes(p.id));
                setSuggestions(suggestedProducts);
            } else {
                setSuggestionError("No suggestions returned.");
            }

        } catch (e: any) {
            setSuggestionError(e.message);
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };
    
    const handleStartFromSuggestion = async (warehouseId: string, isBlind: boolean) => {
        // Not implemented fully in this snippet, but would start stocktake filtered by suggested items
        await handleInitiate(warehouseId, isBlind);
    };

    return {
        stocktakes,
        isLoading,
        error,
        activeStocktake,
        showInitiateModal,
        showCountingModal,
        showSummaryModal,
        summaryResult,
        isGeneratingSummary,
        summaryError,
        handleOpenInitiate,
        handleCloseModals,
        handleInitiate,
        handleSelectStocktake,
        handleSaveProgress,
        handleComplete,
        handleGenerateSummary,
        
        // Smart Suggestions
        showSuggestionModal,
        isGeneratingSuggestions,
        suggestionError,
        suggestions,
        handleSmartSuggestion,
        handleStartFromSuggestion
    };
};

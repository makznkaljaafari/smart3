import { useState, useMemo, useCallback, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { eventBus } from '../../../lib/events';
import { Income, IncomeCategory, AppEvent, LangCode, Toast, JournalEntry } from '../../../types';
import { incomeService } from '../api/incomeService';
import { journalService } from '../../../services/accounting/journalService';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

export const useIncomeData = () => {
    const { lang, authUser, settings, currentCompany } = useZustandStore(state => ({
        lang: state.lang,
        authUser: state.authUser,
        settings: state.settings,
        currentCompany: state.currentCompany,
    }));
    const t = translations[lang];
    const queryClient = useQueryClient();

    const [filters, setFilters] = useState<{ category: IncomeCategory | 'all', searchQuery: string, dateFrom?: string, dateTo?: string }>({ category: 'all', searchQuery: '' });
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(filters.searchQuery), 500);
        return () => clearTimeout(timer);
    }, [filters.searchQuery]);
    
    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    // --- React Query: List ---
    const { data: incomeData, isLoading, isError, error } = useQuery({
        queryKey: ['income', currentCompany?.id, currentPage, pageSize, filters.category, debouncedSearch, filters.dateFrom, filters.dateTo],
        queryFn: () => incomeService.getIncomePaginated({
            page: currentPage,
            pageSize,
            search: debouncedSearch,
            category: filters.category,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo
        }),
        placeholderData: keepPreviousData,
        enabled: !!currentCompany?.id,
    });

    // --- React Query: Stats ---
    const { data: statsData } = useQuery({
        queryKey: ['incomeStats', currentCompany?.id],
        queryFn: () => incomeService.getIncomeStats(), 
        enabled: !!currentCompany?.id,
    });

    const income = incomeData?.data || [];
    const totalCount = incomeData?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const stats = useMemo(() => {
        const rawIncome = statsData?.data || [];
        const now = new Date();
        const currentMonth = now.getMonth();
        
        const totalThisMonth = rawIncome
            .filter((i: any) => new Date(i.date).getMonth() === currentMonth)
            .reduce((sum: number, i: any) => sum + i.amount, 0);
            
        const sourceTotals = rawIncome.reduce((acc: Record<string, number>, i: any) => { 
            acc[i.source] = (acc[i.source] || 0) + i.amount; 
            return acc; 
        }, {});
        
        const highestSourceEntry = Object.entries(sourceTotals).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
        
        return {
            totalThisMonth,
            highestSource: highestSourceEntry ? highestSourceEntry[0] : '-',
            totalEntries: rawIncome.length,
        };
    }, [statsData]);


    // --- Mutations ---
    const saveMutation = useMutation({
        mutationFn: async (data: { income: Partial<Income>, isNew: boolean }) => {
            const { error, data: savedIncome } = await incomeService.saveIncome(data.income, data.isNew);
            if (error) throw error;
            return { savedIncome, isNew: data.isNew, originalData: data.income };
        },
        onSuccess: async ({ savedIncome, isNew, originalData }) => {
            queryClient.invalidateQueries({ queryKey: ['income'] });
            queryClient.invalidateQueries({ queryKey: ['incomeStats'] });
            
            // Journal Entry Creation (If applicable)
            if (savedIncome && originalData.depositAccountId && originalData.incomeAccountId && originalData.amount && originalData.amount > 0) {
                 const companyId = useZustandStore.getState().currentCompany?.id;
                 if (companyId && authUser) {
                     const journalEntry: Omit<JournalEntry, 'id'> = {
                        company_id: companyId,
                        date: originalData.date!,
                        description: `إيراد: ${originalData.title}`,
                        createdBy: authUser.name,
                        referenceType: 'income',
                        referenceId: savedIncome.id,
                        lines: [
                            { id: '', accountId: originalData.depositAccountId, debit: originalData.amount, credit: 0 },
                            { id: '', accountId: originalData.incomeAccountId, debit: 0, credit: originalData.amount },
                        ]
                    };
                    // Fire and forget for journal entry
                    await journalService.saveJournalEntry(journalEntry)
                        .then(() => queryClient.invalidateQueries({ queryKey: ['journalEntries'] }));
                 }
            }
            
            addToast(isNew ? 'تم إضافة الإيراد بنجاح' : 'تم تحديث الإيراد بنجاح', 'success');

            if (isNew) {
                eventBus.publish({
                    id: crypto.randomUUID(), type: 'INCOME_CREATED',
                    payload: { category: originalData.category, amount: originalData.amount, currency: originalData.currency },
                    at: new Date().toISOString(), lang: lang as LangCode,
                });
            }
            handleCloseForm();
        },
        onError: (err: any) => addToast(err.message, 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await incomeService.deleteIncome(id);
            if (error) throw error;
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['income'] });
             queryClient.invalidateQueries({ queryKey: ['incomeStats'] });
             addToast('تم حذف الإيراد', 'info');
        },
        onError: (err: any) => addToast(err.message, 'error')
    });

    // Handlers
    const handleSave = async (data: Partial<Income>) => {
        if (!authUser) { addToast("User not authenticated", 'error'); return; }
        await saveMutation.mutateAsync({ income: data, isNew: !editingIncome });
    };

    const handleDelete = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا الإيراد؟')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleEdit = (inc: Income) => { setEditingIncome(inc); setShowFormModal(true); };
    const handleOpenForm = () => { setEditingIncome(null); setShowFormModal(true); };
    const handleCloseForm = () => { setEditingIncome(null); setShowFormModal(false); };

    return {
        stats,
        filters,
        setFilters,
        filteredIncome: income,
        showFormModal,
        editingIncome,
        isLoading,
        error: isError ? (error as Error).message : null,
        handleSave,
        handleDelete,
        handleEdit,
        handleOpenForm,
        handleCloseForm,
    };
};
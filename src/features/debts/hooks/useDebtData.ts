
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Debt, DebtStatus, DebtPaymentDetails } from '../types';
import { Toast } from '../../../types';
import { debtService } from '../api/debtService';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

interface DebtFilters {
    status: DebtStatus | 'all';
    searchQuery: string;
}

export const useDebtData = () => {
    const { lang, settings, authUser, currentCompany } = useZustandStore(state => ({
        lang: state.lang,
        settings: state.settings,
        authUser: state.authUser,
        currentCompany: state.currentCompany,
    }));
    const t = translations[lang];
    const location = useLocation();
    const queryClient = useQueryClient();

    // State
    const [filters, setFilters] = useState<DebtFilters>(
        location.state?.initialFilters || { status: 'all', searchQuery: '' }
    );
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(filters.searchQuery), 500);
        return () => clearTimeout(timer);
    }, [filters.searchQuery]);

    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = settings.page.debts.pageSize || 10;

    const [deletingDebtId, setDeletingDebtId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    // Queries
    const { data: debtsData, isLoading: debtsLoading, isError, error } = useQuery({
        queryKey: ['debts', currentCompany?.id, currentPage, pageSize, filters.status, debouncedSearch],
        queryFn: () => debtService.getDebtsPaginated({
            page: currentPage,
            pageSize,
            status: filters.status,
            search: debouncedSearch,
        }),
        placeholderData: keepPreviousData,
        enabled: !!currentCompany?.id,
    });

    const { data: statsData } = useQuery({
        queryKey: ['debtStats', currentCompany?.id],
        queryFn: debtService.getDebtStats,
        enabled: !!currentCompany?.id,
    });

    const debts = debtsData?.data || [];
    const totalCount = debtsData?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const stats = useMemo(() => {
        const rawDebts = statsData?.data || [];
        const totalAmount = rawDebts.reduce((sum: number, d: any) => sum + d.amount, 0);
        const totalPaid = rawDebts.reduce((sum: number, d: any) => sum + d.paid_amount, 0);
        const totalRemaining = rawDebts.reduce((sum: number, d: any) => sum + d.remaining_amount, 0);
        const overdueDebts = rawDebts.filter((d: any) => d.status === 'overdue').length;
        const overdueAmount = rawDebts
            .filter((d: any) => d.status === 'overdue')
            .reduce((sum: number, d: any) => sum + d.remaining_amount, 0);

        return {
            totalAmount,
            totalPaid,
            totalRemaining,
            overdueDebts,
            overdueAmount
        };
    }, [statsData]);

    // Mutations
    const saveMutation = useMutation({
        mutationFn: async (data: { debt: Partial<Debt>, isNew: boolean }) => {
            const { error } = await debtService.saveDebt(data.debt, data.isNew);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['debtStats'] });
            addToast(variables.isNew ? t.debtAddedSuccess : t.debtUpdatedSuccess, 'success');
            handleCloseModals();
        },
        onError: (err: any) => addToast(err.message, 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await debtService.deleteDebt(id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['debtStats'] });
            addToast(t.debtDeletedSuccess, 'info');
            setIsDeleting(false);
            setDeletingDebtId(null);
        },
        onError: (err: any) => {
            addToast(err.message, 'error');
            setIsDeleting(false);
        }
    });

    const paymentMutation = useMutation({
        mutationFn: async (data: { debtId: string, payment: DebtPaymentDetails }) => {
            const { error } = await debtService.recordPayment(data.debtId, data.payment);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['debtStats'] });
            addToast(t.paymentAddedSuccess, 'success');
            // Also refresh journal entries if needed, but that's handled in service mostly or we can invalidate 'journalEntries'
        },
        onError: (err: any) => addToast(err.message, 'error')
    });

    // Handlers
    const handleCloseModals = useCallback(() => {
        setShowFormModal(false);
        setShowDetailsModal(false);
        setShowPaymentModal(false);
        setEditingDebt(null);
        setSelectedDebt(null);
    }, []);

    const handleOpenForm = useCallback(() => {
        setEditingDebt(null);
        setShowFormModal(true);
    }, []);

    const handleEdit = useCallback((debt: Debt) => {
        setEditingDebt(debt);
        setShowFormModal(true);
    }, []);

    const handleViewDetails = useCallback((debt: Debt) => {
        setSelectedDebt(debt);
        setShowDetailsModal(true);
    }, []);

    const handleAddPaymentClick = useCallback((debt: Debt) => {
        setSelectedDebt(debt);
        setShowPaymentModal(true);
    }, []);

    const handleSaveDebt = async (data: Partial<Debt>) => {
        if (!authUser) { addToast('User not authenticated.', 'error'); return; }
        await saveMutation.mutateAsync({ debt: data, isNew: !editingDebt });
    };

    const handleDeleteDebt = useCallback((id: string) => {
        setDeletingDebtId(id);
    }, []);

    const confirmDeleteDebt = async () => {
        if (!deletingDebtId) return;
        setIsDeleting(true);
        await deleteMutation.mutateAsync(deletingDebtId);
    };
    
    const cancelDeleteDebt = useCallback(() => setDeletingDebtId(null), []);

    const handleAddPayment = async (debtId: string, paymentData: DebtPaymentDetails) => {
        await paymentMutation.mutateAsync({ debtId, payment: paymentData });
    };

    const clearFilters = useCallback(() => {
        setFilters({ status: 'all', searchQuery: '' });
    }, []);

    return {
        stats,
        filters,
        setFilters,
        filteredDebts: debts,
        selectedDebt,
        showDetailsModal,
        showFormModal,
        showPaymentModal,
        editingDebt,
        debtsLoading,
        debtsError: isError ? (error as Error).message : null,
        handleSaveDebt,
        handleDeleteDebt,
        handleAddPayment,
        handleViewDetails,
        handleEdit,
        handleAddPaymentClick,
        handleOpenForm,
        handleCloseModals,
        clearFilters,
        deletingDebtId,
        isDeleting,
        confirmDeleteDebt,
        cancelDeleteDebt,
        totalPages,
        currentPage,
        setCurrentPage
    };
};

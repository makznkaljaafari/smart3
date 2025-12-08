
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Supplier } from '../types';
import { Toast } from '../../../types';
import { supplierService } from '../../../services/supplierService';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

export const useSupplierData = () => {
    const { lang, authUser, currentCompany } = useZustandStore(state => ({
        lang: state.lang,
        authUser: state.authUser,
        currentCompany: state.currentCompany,
    }));
    const t = translations[lang];
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    // --- React Query ---
    const { data: suppliersData, isLoading: suppliersLoading, isError, error } = useQuery({
        queryKey: ['suppliers', currentCompany?.id, currentPage, pageSize, debouncedSearch],
        queryFn: () => supplierService.getSuppliersPaginated({
            page: currentPage,
            pageSize,
            search: debouncedSearch
        }),
        placeholderData: keepPreviousData,
        enabled: !!currentCompany?.id,
    });

    const { data: statsData } = useQuery({
        queryKey: ['supplierStats', currentCompany?.id],
        queryFn: supplierService.getSupplierStats,
        enabled: !!currentCompany?.id,
    });

    const suppliers = suppliersData?.data || [];
    const totalCount = suppliersData?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const stats = useMemo(() => {
        const rawStats = statsData?.data || [];
        return {
            totalCount: totalCount, // Use count from pagination query for total count
            totalPurchases: rawStats.reduce((sum: number, s: any) => sum + (s.total_purchases_value || 0), 0),
            totalBalance: rawStats.reduce((sum: number, s: any) => sum + (s.outstanding_balance || 0), 0),
        };
    }, [statsData, totalCount]);

    // --- Handlers ---

    const handleCloseModals = useCallback(() => {
        setShowFormModal(false);
        setEditingSupplier(null);
        setShowDetailsModal(false);
        setSelectedSupplier(null);
    }, []);

    const handleOpenForm = () => {
        setEditingSupplier(null);
        setShowFormModal(true);
    };

    const handleEditSupplier = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setShowFormModal(true);
    };

    const handleViewDetails = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setShowDetailsModal(true);
    };

    // --- Mutations ---
    const saveMutation = useMutation({
        mutationFn: async (data: { supplier: Partial<Supplier>, isNew: boolean }) => {
            const { error } = await supplierService.saveSupplier(data.supplier, data.isNew);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['supplierStats'] });
            addToast(variables.isNew ? t.supplierSavedSuccess : 'تم تحديث المورد بنجاح', 'success');
            handleCloseModals();
        },
        onError: (err: any) => {
            addToast(err.message, 'error');
        }
    });

    const handleSaveSupplier = async (data: Partial<Supplier>) => {
        if (!authUser) {
            addToast('User not authenticated.', 'error');
            return;
        }
        await saveMutation.mutateAsync({ supplier: data, isNew: !editingSupplier });
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supplierService.deleteSupplier(id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['supplierStats'] });
            addToast(t.supplierDeletedSuccess, 'info');
        },
        onError: (err: any) => {
            addToast(err.message, 'error');
        }
    });

    const handleDeleteSupplier = async (supplierId: string) => {
        if (confirm(t.areYouSureDeleteSupplier)) { 
            await deleteMutation.mutateAsync(supplierId);
        } 
    };

    return {
        stats,
        searchTerm, setSearchTerm,
        filteredSuppliers: suppliers,
        showFormModal,
        editingSupplier,
        suppliersLoading,
        suppliersError: isError ? (error as Error).message : null,
        showDetailsModal,
        selectedSupplier,
        handleEditSupplier,
        handleDeleteSupplier,
        handleSaveSupplier,
        handleOpenForm,
        handleCloseModals,
        handleViewDetails,
        currentPage, setCurrentPage,
        totalPages
    };
};

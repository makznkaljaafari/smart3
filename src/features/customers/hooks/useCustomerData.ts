
import { useState, useMemo, useCallback, ChangeEvent, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { eventBus } from '../../../lib/events';
import { Customer, CustomerStatus, RiskLevel } from '../types';
import { AppEvent, LangCode, Toast } from '../../../types';
import { customerService } from '../api/customerService';
import { useSelection } from '../../../hooks/useSelection';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { syncService } from '../../../services/syncService';

/**
 * Custom hook to manage all state and business logic for the Customers feature.
 * This includes data fetching via React Query, state management for filters and modals,
 * and CRUD operations (Create, Read, Update, Delete).
 */
export const useCustomerData = () => {
    const { lang, settings, authUser, currentCompany, isOffline } = useZustandStore(state => ({
        lang: state.lang,
        settings: state.settings,
        authUser: state.authUser,
        currentCompany: state.currentCompany,
        isOffline: state.isOffline,
    }));
    const t = translations[lang];
    const queryClient = useQueryClient();

    // --- Local State for UI & Filters ---
    const [searchTerm, setSearchTerm] = useState('');
    // Debounce search term for API calls
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all');
    const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = settings.page.customers.pageSize || 10;

    const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    // --- React Query Data Fetching ---
    const { data: response, isLoading, isError: isQueryError, error: queryError } = useQuery({
        queryKey: ['customers', currentCompany?.id, currentPage, pageSize, debouncedSearch, statusFilter, riskFilter],
        queryFn: () => customerService.getCustomersPaginated({
            page: currentPage,
            pageSize,
            search: debouncedSearch,
            status: statusFilter,
            riskLevel: riskFilter,
        }),
        placeholderData: keepPreviousData,
        enabled: !!currentCompany?.id,
    });
    
    const { data: statsResponse } = useQuery({
        queryKey: ['customerStats', currentCompany?.id],
        queryFn: customerService.getCustomerStats,
        enabled: !!currentCompany?.id,
    });

    const customers = response?.data || [];
    const totalCount = response?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Extract error from service response if present (handled errors)
    const serviceError = response?.error;
    const finalError = isQueryError ? (queryError as Error).message : (serviceError ? (serviceError as Error).message : null);

    const stats = useMemo(() => {
        const s = statsResponse?.data || { active: 0, highRisk: 0, totalDebt: 0 };
        return {
            total: totalCount,
            active: s.active,
            highRisk: s.highRisk,
            totalDebt: s.totalDebt
        };
    }, [totalCount, statsResponse]);


    // --- Selection Logic ---
    const filteredCustomerIds = useMemo(() => customers.map(c => c.id), [customers]);
    const { selectedIds, handleSelect, handleSelectAll, clearSelection, isAllSelected } = useSelection(filteredCustomerIds);

    // --- Handlers ---

    const handleCloseModals = useCallback(() => {
        setShowDetailsModal(false);
        setShowFormModal(false);
        setSelectedCustomer(null);
        setEditingCustomer(null);
    }, []);

    const handleOpenForm = () => {
        setEditingCustomer(null);
        setShowFormModal(true);
    };

    const handleViewCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowDetailsModal(true);
    };
    
    const handleEditCustomer = (customer: Customer) => {
        setEditingCustomer(customer);
        setShowFormModal(true);
    };
    
    // Mutation for Saving Customer
    const saveMutation = useMutation({
        mutationFn: async (data: { customer: Partial<Customer>, isNew: boolean }) => {
             // Offline Handling
             if (isOffline) {
                 const tempId = data.isNew ? `temp-${Date.now()}` : data.customer.id!;
                 const offlineCustomer = { ...data.customer, id: tempId, company_id: currentCompany?.id } as Customer;
                 
                 if (data.isNew) {
                     syncService.enqueue({ type: 'CREATE_CUSTOMER', payload: offlineCustomer, tempId });
                 } else {
                     syncService.enqueue({ type: 'UPDATE_CUSTOMER', payload: offlineCustomer });
                 }
                 return { offline: true, data: offlineCustomer, isNew: data.isNew };
             }

             const { error } = await customerService.saveCustomer(data.customer, data.isNew);
             if (error) throw error;
             return { offline: false, isNew: data.isNew };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customerStats'] });
            
            if (result.offline) {
                addToast(lang === 'ar' ? 'تم الحفظ محلياً. ستتم المزامنة عند الاتصال.' : 'Saved locally. Will sync when online.', 'warning');
            } else {
                addToast(result.isNew ? t.customerAddedSuccess : t.customerUpdatedSuccess, 'success');
                if (result.isNew) {
                    const event: AppEvent = {
                        id: crypto.randomUUID(),
                        type: 'CUSTOMER_CREATED',
                        payload: { name: result.data?.name || 'New Customer' },
                        at: new Date().toISOString(),
                        lang: lang as LangCode,
                    };
                    eventBus.publish(event);
                }
            }
            handleCloseModals();
        },
        onError: (err: any) => {
            addToast(err.message, 'error');
        }
    });

    const handleSaveCustomer = async (data: Partial<Customer>) => {
        if (!authUser) {
          addToast('User not authenticated.', 'error');
          return;
        }
        await saveMutation.mutateAsync({ customer: data, isNew: !editingCustomer });
    };

    // Mutation for Deleting Customer
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
             if (isOffline) {
                 syncService.enqueue({ type: 'DELETE_CUSTOMER', payload: id });
                 return { offline: true };
             }
             const { error } = await customerService.deleteCustomer(id);
             if (error) throw error;
             return { offline: false };
        },
        onMutate: async (id) => {
             // Optimistic Update
             await queryClient.cancelQueries({ queryKey: ['customers'] });
             const previousData = queryClient.getQueryData(['customers', currentCompany?.id]);
             
             queryClient.setQueryData(['customers', currentCompany?.id], (old: any) => {
                 if (!old) return old;
                 return {
                     ...old,
                     data: old.data.filter((c: Customer) => c.id !== id),
                     count: old.count - 1
                 };
             });
             
             return { previousData };
        },
        onSuccess: (result) => {
            if (result.offline) {
                addToast(lang === 'ar' ? 'تم الحذف محلياً.' : 'Deleted locally.', 'warning');
            } else {
                addToast(t.customerDeletedSuccess, 'info');
            }
            
            queryClient.invalidateQueries({ queryKey: ['customerStats'] });
            setIsDeleting(false);
            setDeletingCustomerId(null);
        },
        onError: (err: any, id, context) => {
             if (context?.previousData) {
                 queryClient.setQueryData(['customers', currentCompany?.id], context.previousData);
             }
             addToast(err.message, 'error');
             setIsDeleting(false);
        },
        onSettled: () => {
             queryClient.invalidateQueries({ queryKey: ['customers'] });
        }
    });

    const handleDeleteCustomer = useCallback((customerId: string) => {
        setDeletingCustomerId(customerId);
    }, []);

    const confirmDeleteCustomer = async () => {
        if (!deletingCustomerId) return;
        setIsDeleting(true);
        await deleteMutation.mutateAsync(deletingCustomerId);
    };
    
    const cancelDeleteCustomer = useCallback(() => {
        setDeletingCustomerId(null);
    }, []);

    // Mutation for Bulk Delete
    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
             const { error } = await customerService.deleteCustomers(ids);
             if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customerStats'] });
            addToast(`${variables.length} customers deleted successfully.`, 'info');
            clearSelection();
            setIsDeleting(false);
            setIsBulkDeleteConfirmOpen(false);
        },
        onError: (err: any) => {
             addToast(err.message, 'error');
             setIsDeleting(false);
        }
    });

    const handleDeleteSelected = useCallback(() => {
        setIsBulkDeleteConfirmOpen(true);
    }, []);

    const confirmBulkDelete = async () => {
        setIsDeleting(true);
        const idsToDelete = [...selectedIds];
        await bulkDeleteMutation.mutateAsync(idsToDelete);
    };

    const cancelBulkDelete = useCallback(() => {
        setIsBulkDeleteConfirmOpen(false);
    }, []);


    const handleExport = () => { /* ... implementation ... */ };
    const handleImport = (e: ChangeEvent<HTMLInputElement>) => { /* ... implementation ... */ };

    return {
        stats,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        riskFilter, setRiskFilter,
        selectedCustomer,
        showDetailsModal,
        showFormModal,
        editingCustomer,
        viewMode, setViewMode,
        currentPage, setCurrentPage,
        paginatedCustomers: customers,
        filteredCustomers: customers,
        totalPages,
        customersLoading: isLoading,
        customersError: finalError,
        handleViewCustomer,
        handleEditCustomer,
        handleDeleteCustomer,
        handleSaveCustomer,
        handleExport,
        handleImport,
        handleOpenForm,
        handleCloseModals,
        deletingCustomerId,
        isDeleting,
        confirmDeleteCustomer,
        cancelDeleteCustomer,
        selectedIds,
        handleSelect,
        handleSelectAll,
        clearSelection,
        isAllSelected,
        handleDeleteSelected,
        isBulkDeleteConfirmOpen,
        confirmBulkDelete,
        cancelBulkDelete,
    };
};

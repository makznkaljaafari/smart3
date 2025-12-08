
import { useState, useCallback } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { InventoryTransfer, Toast, InventoryTransferItem } from '../../../types';
import { inventoryService } from '../../../services/inventoryService';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useInventoryTransferData = () => {
    const { authUser, currentCompany } = useZustandStore(state => ({
        authUser: state.authUser,
        currentCompany: state.currentCompany,
    }));
    const t = translations[useZustandStore.getState().lang];
    const queryClient = useQueryClient();

    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<InventoryTransfer | null>(null);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    const { data: transfersData, isLoading: transfersLoading, error: transfersErrorObj } = useQuery({
        queryKey: ['transfers', currentCompany?.id],
        queryFn: inventoryService.getInventoryTransfers,
        enabled: !!currentCompany?.id
    });

    const transfers = transfersData?.data || [];
    const transfersError = transfersErrorObj ? (transfersErrorObj as Error).message : null;

    const handleCloseModals = useCallback(() => {
        setShowFormModal(false);
        setShowDetailsModal(false);
        setSelectedTransfer(null);
    }, []);

    const handleOpenForm = useCallback(() => {
        setShowFormModal(true);
    }, []);

    const handleSave = useCallback(async (data: { fromWarehouseId: string, toWarehouseId: string, transferDate: string, notes?: string, items: InventoryTransferItem[] }) => {
        if (!authUser) throw new Error("Not authenticated");
        
        const { error } = await inventoryService.createInventoryTransfer(data);
        if (error) {
            addToast(error.message, 'error');
            throw error;
        }

        queryClient.invalidateQueries({ queryKey: ['transfers'] });
        addToast(t.transferSavedSuccess, 'success');
        handleCloseModals();
    }, [authUser, addToast, t, queryClient, handleCloseModals]);

    const handleViewDetails = (transfer: InventoryTransfer) => {
        setSelectedTransfer(transfer);
        setShowDetailsModal(true);
    };
    
    const handleComplete = async (transferId: string) => {
        const { error } = await inventoryService.completeInventoryTransfer(transferId);
        if (error) {
            addToast(error.message, 'error');
            throw error;
        }

        queryClient.invalidateQueries({ queryKey: ['transfers'] });
        addToast(t.transferCompletedSuccess, 'success');
        handleCloseModals();
    };

    return {
        transfers,
        transfersLoading,
        transfersError,
        showFormModal,
        showDetailsModal,
        selectedTransfer,
        handleOpenForm,
        handleCloseModals,
        handleSave,
        handleViewDetails,
        handleComplete,
    };
};

import { useState, useCallback, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Warehouse, Toast } from '../../../types';
import { inventoryService } from '../../../services/inventoryService';

export const useWarehouseData = () => {
    const { warehouses, lang, authUser, warehousesLoading, warehousesError } = useZustandStore(state => ({
        warehouses: state.warehouses,
        lang: state.lang,
        authUser: state.authUser,
        warehousesLoading: state.warehousesLoading,
        warehousesError: state.warehousesError,
    }));
    const { fetchWarehouses } = useZustandStore.getState();
    const t = translations[lang];

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedWarehouseForDetails, setSelectedWarehouseForDetails] = useState<Warehouse | null>(null);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    const handleCloseModals = useCallback(() => {
        setShowFormModal(false);
        setEditingWarehouse(null);
        setShowDetailsModal(false);
        setSelectedWarehouseForDetails(null);
    }, []);

    const handleOpenForm = useCallback(() => {
        setEditingWarehouse(null);
        setShowFormModal(true);
    }, []);

    const handleEdit = useCallback((warehouse: Warehouse) => {
        setEditingWarehouse(warehouse);
        setShowFormModal(true);
    }, []);
    
    const handleViewDetails = useCallback((warehouse: Warehouse) => {
        setSelectedWarehouseForDetails(warehouse);
        setShowDetailsModal(true);
    }, []);

    const handleSave = useCallback(async (data: Partial<Warehouse>): Promise<void> => {
        if (!authUser) throw new Error('User not authenticated.');
        const isNew = !editingWarehouse;
        
        const { error } = await inventoryService.saveWarehouse(data, isNew);

        if (error) {
            addToast(error.message, 'error');
            throw error;
        }
        
        await fetchWarehouses(); // Refetch
        addToast(t.warehouseSavedSuccess, 'success');
        handleCloseModals();
    }, [editingWarehouse, authUser, addToast, t, fetchWarehouses, handleCloseModals]);

    const handleDelete = useCallback(async (id: string) => {
        if (confirm(t.areYouSureDeleteWarehouse)) {
            const { error } = await inventoryService.deleteWarehouse(id);
            if (error) {
                addToast(error.message, 'error');
                return;
            }
            await fetchWarehouses(); // Refetch
            addToast(t.warehouseDeletedSuccess, 'info');
        }
    }, [t, addToast, fetchWarehouses]);

    return {
        warehouses,
        warehousesLoading,
        warehousesError,
        showFormModal,
        editingWarehouse,
        showDetailsModal,
        selectedWarehouseForDetails,
        handleOpenForm,
        handleCloseModals,
        handleSave,
        handleEdit,
        handleDelete,
        handleViewDetails,
    };
};
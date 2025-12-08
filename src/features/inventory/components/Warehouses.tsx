import React from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useWarehouseData } from '../hooks/useWarehouseData';
import { WarehouseCard } from './WarehouseCard';
import { WarehouseFormModal } from './WarehouseFormModal';
import { WarehouseDetailsModal } from './WarehouseDetailsModal';
import { Plus, Warehouse as WarehouseIcon, ServerCrash } from 'lucide-react';
import { LoadingState } from '../../../components/common/LoadingState';
import { EmptyState } from '../../../components/common/EmptyState';

export const Warehouses: React.FC = () => {
    const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
    const t = translations[lang];

    const {
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
    } = useWarehouseData();

    const renderContent = () => {
        if (warehousesLoading) {
            return <LoadingState />;
        }
        if (warehousesError) {
            return <EmptyState icon={ServerCrash} title="Error" description={warehousesError} variant="error" />;
        }
        if (warehouses.length > 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {warehouses.map(w => (
                        <WarehouseCard
                            key={w.id}
                            warehouse={w}
                            theme={theme}
                            onViewDetails={() => handleViewDetails(w)}
                            onEdit={() => handleEdit(w)}
                            onDelete={() => handleDelete(w.id)}
                        />
                    ))}
                </div>
            );
        }
        return (
            <EmptyState 
                icon={WarehouseIcon} 
                title={t.noWarehousesYet} 
                description={t.addFirstWarehouse} 
                actionLabel={t.addWarehouse} 
                onAction={handleOpenForm} 
            />
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <HoloButton icon={Plus} variant="primary" onClick={handleOpenForm}>{t.addWarehouse}</HoloButton>
            </div>
            {renderContent()}
            {showFormModal && (
                <WarehouseFormModal
                    warehouse={editingWarehouse}
                    onClose={handleCloseModals}
                    onSave={handleSave}
                />
            )}
            {showDetailsModal && selectedWarehouseForDetails && (
                <WarehouseDetailsModal
                    warehouse={selectedWarehouseForDetails}
                    onClose={handleCloseModals}
                />
            )}
        </div>
    );
};
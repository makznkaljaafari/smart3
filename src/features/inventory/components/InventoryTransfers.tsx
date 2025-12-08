
import React, { useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useInventoryTransferData } from '../hooks/useInventoryTransferData';
import { InventoryTransferRow } from './InventoryTransferRow';
import { InventoryTransferFormModal } from './InventoryTransferFormModal';
import { InventoryTransferDetailsModal } from './InventoryTransferDetailsModal';
import { Plus, ArrowRightLeft, ServerCrash } from 'lucide-react';
import { LoadingState } from '../../../components/common/LoadingState';
import { EmptyState } from '../../../components/common/EmptyState';
import { InventoryTransfer } from '../../../types';

export const InventoryTransfers: React.FC = () => {
    const { theme, settings } = useZustandStore(state => ({
        theme: state.theme,
        settings: state.settings,
    }));
    const t = translations[useZustandStore.getState().lang];
    const { tables: tableSettings } = settings.appearance;

    const {
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
    } = useInventoryTransferData();

    const headerClasses = useMemo(() => {
        let base = `p-3 text-sm transition-colors ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-700'}`;
        if (tableSettings.headerStyle === 'bold') {
            base += ' font-bold';
        } else {
            base += ' font-semibold';
        }
        if (tableSettings.headerStyle === 'accent') {
            base += theme === 'dark' ? ' !bg-[var(--accent-bg-20)] !text-[var(--accent-300)]' : ' !bg-cyan-100 !text-cyan-800';
        }
        return base;
    }, [theme, tableSettings.headerStyle]);

    const fontSizeClass = useMemo(() => {
        switch (tableSettings.fontSize) {
            case 'small': return 'text-xs';
            case 'large': return 'text-base';
            default: return 'text-sm';
        }
    }, [tableSettings.fontSize]);

    const renderContent = () => {
        if (transfersLoading) {
            return <LoadingState />;
        }
        if (transfersError) {
            return <EmptyState icon={ServerCrash} title="Error" description={transfersError} variant="error" />;
        }
        if (transfers.length === 0) {
            return (
                <EmptyState 
                    icon={ArrowRightLeft} 
                    title={t.noTransfersYet} 
                    description="" 
                />
            );
        }
        return (
            <div className={`rounded-lg overflow-x-auto border ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                <table className={`w-full ${fontSizeClass} responsive-table`}>
                    <thead>
                        <tr>
                            <th className={`${headerClasses} text-right`}>{t.transferDate}</th>
                            <th className={`${headerClasses} text-right`}>{t.fromWarehouse}</th>
                            <th className={`${headerClasses} text-right`}>{t.toWarehouse}</th>
                            <th className={`${headerClasses} text-right`}>{t.status}</th>
                            <th className={`${headerClasses} text-center`}>{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfers.map((transfer: InventoryTransfer, index: number) => (
                            <InventoryTransferRow 
                                key={transfer.id}
                                transfer={transfer}
                                onReceive={() => handleViewDetails(transfer)}
                                isOdd={index % 2 !== 0}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <HoloButton icon={Plus} variant="primary" onClick={handleOpenForm}>{t.createTransfer}</HoloButton>
            </div>
            {renderContent()}
            {showFormModal && <InventoryTransferFormModal onClose={handleCloseModals} onSave={handleSave} />}
            {showDetailsModal && selectedTransfer && (
                <InventoryTransferDetailsModal
                    transfer={selectedTransfer}
                    onClose={handleCloseModals}
                    onConfirm={handleComplete}
                />
            )}
        </div>
    );
};


import React, { useMemo } from 'react';
import { InventoryTransfer } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { CheckCircle, Clock } from 'lucide-react';

interface InventoryTransferRowProps {
    transfer: InventoryTransfer;
    onReceive: () => void;
    isOdd: boolean;
}

const formatDate = (dateString: string) => new Intl.DateTimeFormat('en-CA').format(new Date(dateString));

export const InventoryTransferRow: React.FC<InventoryTransferRowProps> = React.memo(({ transfer, onReceive, isOdd }) => {
    const { theme, lang, settings } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
    }));
    const t = translations[lang];
    const { tables: tableSettings } = settings.appearance;

    const statusBadge = transfer.status === 'completed'
        ? <span className="flex items-center gap-1 text-green-400"><CheckCircle size={14} /> {t.completed}</span>
        : <span className="flex items-center gap-1 text-yellow-400"><Clock size={14} /> {t.pending}</span>;

    const rowClass = useMemo(() => {
        let base = `border-b transition-colors ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800/50' : 'border-slate-200 hover:bg-slate-100'}`;
        if (tableSettings.theme === 'striped' && isOdd) {
            base += theme === 'dark' ? ' bg-white/5' : ' bg-slate-50';
        }
        return base;
    }, [theme, tableSettings.theme, isOdd]);

    return (
        <tr className={rowClass}>
            <td className="p-3" data-label={t.transferDate}>{formatDate(transfer.transferDate)}</td>
            <td className="p-3" data-label={t.fromWarehouse}>{transfer.fromWarehouseName}</td>
            <td className="p-3" data-label={t.toWarehouse}>{transfer.toWarehouseName}</td>
            <td className="p-3" data-label={t.status}>{statusBadge}</td>
            <td className="p-3 text-center" data-label={t.actions}>
                {transfer.status === 'pending' && (
                    <HoloButton variant="success" onClick={onReceive} className="!py-1 !px-3 !text-sm">
                        {t.receive}
                    </HoloButton>
                )}
            </td>
        </tr>
    );
});

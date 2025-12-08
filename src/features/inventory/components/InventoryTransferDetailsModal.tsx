import React, { useState } from 'react';
import { InventoryTransfer } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, CheckCircle, Loader } from 'lucide-react';

interface InventoryTransferDetailsModalProps {
    transfer: InventoryTransfer;
    onClose: () => void;
    onConfirm: (transferId: string) => Promise<void>;
}

const formatDate = (dateString: string) => new Intl.DateTimeFormat('en-CA').format(new Date(dateString));

export const InventoryTransferDetailsModal: React.FC<InventoryTransferDetailsModalProps> = ({ transfer, onClose, onConfirm }) => {
    const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 600, height: 500 } });
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm(transfer.id);
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div ref={modalRef} style={{ ...position, ...size }} className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-cyan-500/50' : 'bg-white border'}`} onMouseDown={e => e.stopPropagation()}>
                <div ref={headerRef} onMouseDown={handleDragStart} className="p-6 border-b border-gray-700 cursor-move flex justify-between items-center">
                    <h3 className="text-xl font-bold">{t.transferDetails}</h3>
                    <button onClick={onClose}><X/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <p><strong>{t.fromWarehouse}:</strong> {transfer.fromWarehouseName}</p>
                        <p><strong>{t.toWarehouse}:</strong> {transfer.toWarehouseName}</p>
                        <p><strong>{t.transferDate}:</strong> {formatDate(transfer.transferDate)}</p>
                        <p><strong>{t.status}:</strong> {t[transfer.status]}</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold">المواد:</h4>
                        {transfer.items.map(item => (
                            <div key={item.productId} className="flex justify-between p-2 bg-gray-800 rounded">
                                <span>{item.productName}</span>
                                <span className="font-mono">{item.quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose}>{t.cancel}</button>
                    <HoloButton icon={isConfirming ? Loader : CheckCircle} variant="success" onClick={handleConfirm} disabled={isConfirming}>
                        {isConfirming ? 'جاري التأكيد...' : t.confirmReceipt}
                    </HoloButton>
                </div>
            </div>
        </div>
    );
};
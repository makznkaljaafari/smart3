import React, { useRef } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { X, UploadCloud, Camera } from 'lucide-react';

interface ImportFromFileModalProps {
  onClose: () => void;
  onFileSelect: (file: File) => void;
}

export const ImportFromFileModal: React.FC<ImportFromFileModalProps> = ({ onClose, onFileSelect }) => {
    const { theme, lang } = useZustandStore();
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
        initialSize: { width: 500, height: 400 },
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className="p-4 border-b border-gray-700 cursor-move flex justify-between items-center">
                    <h3 className="text-xl font-bold">{t.importPurchaseInvoice}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800/50"
                    >
                        <UploadCloud size={48} className="text-gray-500 mb-2" />
                        <span className="font-semibold">{t.uploadInvoiceImage}</span>
                        <span className="text-sm text-gray-400">{t.dragAndDrop}</span>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                </div>
            </div>
        </div>
    );
};
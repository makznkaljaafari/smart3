
import React, { useState } from 'react';
import { PurchaseInvoice } from '../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Printer, Truck, Calculator } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { formatCurrency } from '../../expenses/lib/utils';
import { PrintPreviewModal } from '../../reports/components/PrintPreviewModal';
import { PurchaseInfoSection } from './details/PurchaseInfoSection';
import { PurchaseItemsSection } from './details/PurchaseItemsSection';
import { PurchaseSummarySection } from './details/PurchaseSummarySection';
import { LandedCostModal } from './LandedCostModal';

interface PurchaseDetailsModalProps {
  purchase: PurchaseInvoice;
  onClose: () => void;
}

export const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({ purchase, onClose }) => {
  const { theme, lang, settings } = useZustandStore();
  const t = translations[lang];
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
    initialSize: { width: 800, height: 700 },
    minSize: { width: 600, height: 500 }
  });

  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showLandedCostModal, setShowLandedCostModal] = useState(false);

  const baseCurrency = settings.baseCurrency;
  const displayCurrency = purchase.currency || baseCurrency;

  return (
    <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" onMouseDown={onClose}>
      <div
        ref={modalRef}
        style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
        className={`fixed rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border ${theme === 'dark' ? 'bg-gray-900/90 border-purple-500/30' : 'bg-white border-slate-200'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          ref={headerRef} 
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                <Truck size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.invoiceDetails}</h3>
              <p className="text-sm text-gray-500 font-mono mt-0.5">#{purchase.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <HoloButton variant="primary" icon={Calculator} onClick={() => setShowLandedCostModal(true)} className="!py-2 !px-4 !text-xs">
              توزيع تكاليف إضافية
            </HoloButton>
            <HoloButton variant="secondary" icon={Printer} onClick={() => setShowPrintPreview(true)} className="!py-2 !px-4 !text-xs">
              {t.print}
            </HoloButton>
            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500'}`}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <PurchaseInfoSection purchase={purchase} t={t} />
          <PurchaseItemsSection items={purchase.items} currency={displayCurrency} t={t} />
          <PurchaseSummarySection purchase={purchase} currency={displayCurrency} t={t} />
        </div>

        <div 
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20 text-gray-500 hover:text-purple-400 transition-colors"
        >
          <svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg>
        </div>
      </div>
    </div>

    {/* Print Preview Modal */}
    {showPrintPreview && (
        <PrintPreviewModal title={`${t.newPurchaseInvoice} #${purchase.invoiceNumber}`} onClose={() => setShowPrintPreview(false)}>
            <div className="space-y-6 text-black">
                {/* Meta Info */}
                <div className="flex justify-between border-b pb-4">
                    <div>
                        <p className="text-sm text-gray-500">{t.invoiceNumber}</p>
                        <p className="font-bold text-lg">{purchase.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">{t.date}</p>
                        <p className="font-bold text-lg">{new Date(purchase.date).toLocaleDateString(lang)}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8 pb-4 border-b">
                    <div>
                        <h4 className="font-bold text-gray-500 mb-1">{t.supplierName}</h4>
                        <p className="text-lg font-semibold">{purchase.supplierName}</p>
                    </div>
                    <div className="text-right">
                        <h4 className="font-bold text-gray-500 mb-1">{t.status}</h4>
                        <span className="inline-block px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm font-bold text-gray-700">
                             {purchase.remainingAmount > 0 ? t.partially_paid : t.paid}
                        </span>
                    </div>
                </div>
                
                {/* Table */}
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-3 text-right font-bold text-gray-600">#</th>
                            <th className="p-3 text-right font-bold text-gray-600">{t.product}</th>
                            <th className="p-3 text-center font-bold text-gray-600">{t.quantity}</th>
                            <th className="p-3 text-right font-bold text-gray-600">{t.unitPrice}</th>
                            <th className="p-3 text-right font-bold text-gray-600">{t.total}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchase.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                                <td className="p-3 text-gray-500">{index + 1}</td>
                                <td className="p-3 font-medium">{item.productName}</td>
                                <td className="p-3 text-center">{item.quantity}</td>
                                <td className="p-3 text-right">{formatCurrency(item.unitPrice, displayCurrency)}</td>
                                <td className="p-3 text-right font-bold">{formatCurrency(item.total, displayCurrency)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* Summary */}
                <div className="flex justify-end pt-4">
                    <div className="w-1/2 space-y-2">
                        <div className="flex justify-between text-xl font-bold">
                            <span>{t.total}</span>
                            <span>{formatCurrency(purchase.total, displayCurrency)}</span>
                        </div>
                         <div className="flex justify-between text-sm text-gray-600 pt-2">
                            <span>{t.amountPaid}</span>
                            <span>{formatCurrency(purchase.amountPaid, displayCurrency)}</span>
                        </div>
                    </div>
                </div>

                 {/* Notes */}
                 {purchase.notes && (
                    <div className="mt-8 pt-4 border-t text-sm text-gray-600">
                        <h5 className="font-bold mb-1">{t.notes}:</h5>
                        <p>{purchase.notes}</p>
                    </div>
                )}
            </div>
        </PrintPreviewModal>
    )}
    
    {showLandedCostModal && (
        <LandedCostModal 
            invoice={purchase} 
            onClose={() => setShowLandedCostModal(false)} 
            onSuccess={() => {
                // trigger refetch logic here if needed
            }}
        />
    )}
    </>
  );
};

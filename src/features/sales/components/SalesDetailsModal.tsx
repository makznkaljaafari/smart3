
import React, { useState } from 'react';
import { SalesInvoice } from '../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Printer, FileText } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { PrintPreviewModal } from '../../reports/components/PrintPreviewModal';
import { formatCurrency } from '../../expenses/lib/utils';
import { SalesInfoSection } from './details/SalesInfoSection';
import { SalesItemsSection } from './details/SalesItemsSection';
import { SalesSummarySection } from './details/SalesSummarySection';

interface SalesDetailsModalProps {
  sale: SalesInvoice;
  onClose: () => void;
}

export const SalesDetailsModal: React.FC<SalesDetailsModalProps> = ({ sale, onClose }) => {
  const { theme, lang, settings } = useZustandStore();
  const t = translations[lang];
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
    initialSize: { width: 800, height: 750 },
    minSize: { width: 600, height: 500 }
  });

  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const baseCurrency = settings.baseCurrency;
  const displayCurrency = sale.currency || baseCurrency;

  return (
    <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" onMouseDown={onClose}>
      <div
        ref={modalRef}
        style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
        className={`fixed rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border ${theme === 'dark' ? 'bg-gray-900/90 border-cyan-500/30' : 'bg-white border-slate-200'}`}
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
            <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                <FileText size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.invoiceDetails}</h3>
              <p className="text-sm text-gray-500 font-mono mt-0.5">#{sale.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
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
          <SalesInfoSection sale={sale} t={t} />
          <SalesItemsSection items={sale.items} currency={displayCurrency} t={t} />
          <SalesSummarySection sale={sale} currency={displayCurrency} t={t} />
        </div>

        {/* Resize Handle */}
        <div 
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 transition-colors"
        >
          <svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg>
        </div>
      </div>
    </div>

    {/* Print Preview Modal */}
    {showPrintPreview && (
        <PrintPreviewModal title={`${t.newSalesInvoice} #${sale.invoiceNumber}`} onClose={() => setShowPrintPreview(false)}>
            <div className="space-y-6 text-black">
                <div className="flex justify-between border-b pb-4">
                    <div>
                        <p className="text-sm text-gray-500">{t.invoiceNumber}</p>
                        <p className="font-bold text-lg">{sale.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">{t.date}</p>
                        <p className="font-bold text-lg">{new Date(sale.date).toLocaleDateString(lang)}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8 pb-4 border-b">
                    <div>
                        <h4 className="font-bold text-gray-500 mb-1">{t.customer}</h4>
                        <p className="text-lg font-semibold">{sale.customerName}</p>
                         {sale.customerEmail && <p className="text-sm text-gray-600">{sale.customerEmail}</p>}
                    </div>
                    <div className="text-right">
                        <h4 className="font-bold text-gray-500 mb-1">{t.status}</h4>
                        <span className="inline-block px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm font-bold text-gray-700">
                             {sale.status}
                        </span>
                    </div>
                </div>
                
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
                        {sale.items.map((item, index) => (
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
                
                <div className="flex justify-end pt-4">
                    <div className="w-1/2 space-y-2">
                         <div className="flex justify-between text-gray-600">
                            <span>{t.subtotal}</span>
                            <span>{formatCurrency(sale.items.reduce((a,b) => a + b.total, 0), displayCurrency)}</span>
                        </div>
                        <div className="border-t border-gray-200 my-2"></div>
                        <div className="flex justify-between text-xl font-bold">
                            <span>{t.total}</span>
                            <span>{formatCurrency(sale.total, displayCurrency)}</span>
                        </div>
                         <div className="flex justify-between text-sm text-gray-600 pt-2">
                            <span>{t.amountPaid}</span>
                            <span>{formatCurrency(sale.amountPaid, displayCurrency)}</span>
                        </div>
                    </div>
                </div>

                 {sale.notes && (
                    <div className="mt-8 pt-4 border-t text-sm text-gray-600">
                        <h5 className="font-bold mb-1">{t.notes}:</h5>
                        <p>{sale.notes}</p>
                    </div>
                )}
            </div>
        </PrintPreviewModal>
    )}
    </>
  );
};

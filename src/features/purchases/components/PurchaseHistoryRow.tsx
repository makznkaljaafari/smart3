
import React, { useMemo } from 'react';
import { PurchaseInvoice } from '../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Eye, Send, DollarSign } from 'lucide-react';
import { eventBus } from '../../../lib/events';
import { LangCode } from '../../../types';
import { formatCurrency } from '../../../lib/formatters';

export const PurchaseHistoryRow: React.FC<{ 
    purchase: PurchaseInvoice; 
    isOdd: boolean;
    onView: (purchase: PurchaseInvoice) => void;
    onPay: (purchase: PurchaseInvoice) => void;
}> = React.memo(({ purchase, isOdd, onView, onPay }) => {
    const { theme, lang, settings, addToast } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
        addToast: state.addToast,
    }));
    const t = translations[lang];
    const { tables: tableSettings } = settings.appearance;
    const isPayable = purchase.remainingAmount > 0;

    // Map statuses to localized labels
    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            draft: 'مسودة',
            ordered: 'تم الطلب',
            partially_received: 'استلام جزئي',
            received: 'تم الاستلام',
            paid: 'مدفوعة',
        };
        return map[status] || status;
    };
    
    const rowClass = useMemo(() => {
        let base = `border-b transition-colors ${theme === 'dark' ? 'border-gray-800 hover:bg-gray-800/50' : 'border-slate-200 hover:bg-slate-100'}`;
        if (tableSettings.theme === 'striped' && isOdd) {
            base += theme === 'dark' ? ' bg-white/5' : ' bg-slate-50';
        }
        return base;
    }, [theme, tableSettings.theme, isOdd]);
    
    const handleSend = () => {
        if(confirm(`هل أنت متأكد من إرسال الفاتورة #${purchase.invoiceNumber}؟`)) {
            eventBus.publish({
                id: crypto.randomUUID(),
                type: 'PURCHASE_INVOICE_SEND',
                payload: { invoiceNumber: purchase.invoiceNumber, supplierName: purchase.supplierName, total: purchase.total, currency: settings.baseCurrency },
                at: new Date().toISOString(),
                lang: lang as LangCode,
            });
            addToast({ message: `تم إرسال الفاتورة #${purchase.invoiceNumber} بنجاح.`, type: 'success'});
        }
    };

    return (
        <tr className={rowClass}>
            <td className="p-3 font-mono text-right" data-label={t.invoiceNumber}>{purchase.invoiceNumber}</td>
            <td className="p-3 text-right" data-label={t.supplierName}>{purchase.supplierName}</td>
            <td className="p-3 text-right" data-label={t.date}>{new Date(purchase.date).toLocaleDateString(lang)}</td>
            <td className="p-3 font-mono text-right" data-label={t.total}>{formatCurrency(purchase.total, settings.baseCurrency)}</td>
            <td className="p-3 text-right" data-label={t.status}>
                <StatusBadge status={purchase.status} label={getStatusLabel(purchase.status)} />
            </td>
            <td className="p-3 text-center" data-label={t.actions}>
                <div className="flex items-center justify-center gap-1">
                    {isPayable && (
                        <button onClick={() => onPay(purchase)} title="تسديد دفعة" className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        ><DollarSign size={16} /></button>
                    )}
                    <button onClick={() => onView(purchase)} title={t.viewDetails} className="p-2 rounded-lg hover:bg-gray-700"><Eye size={16} /></button>
                    <button onClick={handleSend} title={t.send} className="p-2 rounded-lg hover:bg-gray-700"><Send size={16} /></button>
                </div>
            </td>
        </tr>
    );
});

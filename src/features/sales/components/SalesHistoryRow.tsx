
import React, { useMemo } from 'react';
import { SalesInvoice } from '../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Eye, Send, Download, DollarSign, Car } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';

interface SalesHistoryRowProps {
    sale: SalesInvoice;
    isOdd: boolean;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onSend: (sale: SalesInvoice) => void;
    onDownload: (sale: SalesInvoice, format: 'pdf' | 'csv') => void;
    onView: (sale: SalesInvoice) => void;
    onPay?: (sale: SalesInvoice) => void;
}

export const SalesHistoryRow: React.FC<SalesHistoryRowProps> = React.memo(({ sale, isOdd, isSelected, onSelect, onSend, onDownload, onView, onPay }) => {
    const { theme, lang, settings } = useZustandStore();
    const t = translations[lang];
    const { tables: tableSettings } = settings.appearance;
    const navigate = useNavigate();

    // Map sales status to localized label
    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            paid: 'مدفوعة',
            partially_paid: 'مدفوعة جزئياً',
            draft: 'مسودة',
            cancelled: 'ملغاة',
            sent: 'مرسلة'
        };
        return map[status] || status;
    };
    
    const rowClass = useMemo(() => {
        let base = `border-b transition-colors ${theme === 'dark' ? 'border-gray-800 hover:bg-gray-800/50' : 'border-slate-200 hover:bg-slate-100'}`;
        if (tableSettings.theme === 'striped' && isOdd) {
            base += theme === 'dark' ? ' bg-white/5' : ' bg-slate-50';
        }
        if (isSelected) {
            base += theme === 'dark' ? ' !bg-cyan-900/50' : ' !bg-cyan-50';
        }
        return base;
    }, [theme, tableSettings.theme, isOdd, isSelected]);
    
    const isPayable = sale.status !== 'paid' && sale.status !== 'cancelled' && sale.remainingAmount > 0;
    const isCredit = sale.status === 'partially_paid' || sale.status === 'sent';

    const handleViewDebt = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(ROUTES.DEBTS, { state: { initialFilters: { searchQuery: sale.invoiceNumber } } });
    };

    return (
        <tr className={rowClass}>
            <td className="p-3 text-center" data-label="">
                <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => onSelect(sale.id)}
                    className="rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600 focus:ring-offset-gray-900 cursor-pointer"
                />
            </td>
            <td className="p-3 font-mono text-right" data-label={t.invoiceNumber}>{sale.invoiceNumber}</td>
            <td className="p-3 text-right" data-label={t.customer}>
                <div className="flex flex-col">
                    <span className="font-semibold">{sale.customerName}</span>
                    {sale.vehicleDescription && (
                        <span className={`text-xs flex items-center gap-1 mt-0.5 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            <Car size={12} /> {sale.vehicleDescription}
                        </span>
                    )}
                </div>
            </td>
            <td className="p-3 text-right" data-label={t.date}>{new Date(sale.date).toLocaleDateString(lang)}</td>
            <td className="p-3 font-mono text-right" data-label={t.total}>{formatCurrency(sale.total, settings.baseCurrency)}</td>
            <td className="p-3 text-right" data-label={t.status}>
                <div className="flex items-center gap-2">
                    <StatusBadge status={sale.status} label={getStatusLabel(sale.status)} />
                    {isCredit && (
                        <button 
                            onClick={handleViewDebt}
                            className="p-1 text-xs text-orange-400 hover:underline"
                            title="عرض الدين"
                        >
                           (دين)
                        </button>
                    )}
                </div>
            </td>
            <td className="p-3 text-center" data-label={t.actions}>
                <div className="flex items-center justify-center gap-1">
                    {onPay && (
                        <button 
                            onClick={() => onPay(sale)} 
                            disabled={!isPayable}
                            title={t.addPayment || "Add Payment"}
                            className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <DollarSign size={16} />
                        </button>
                    )}
                    <button onClick={() => onView(sale)} title={t.viewDetails} className="p-2 rounded-lg hover:bg-gray-700"><Eye size={16} /></button>
                    <button onClick={() => onSend(sale)} title={t.send} className="p-2 rounded-lg hover:bg-gray-700"><Send size={16} /></button>
                    <button onClick={() => onDownload(sale, 'pdf')} title={t.downloadPDF} className="p-2 rounded-lg hover:bg-gray-700"><Download size={16} /></button>
                </div>
            </td>
        </tr>
    );
});

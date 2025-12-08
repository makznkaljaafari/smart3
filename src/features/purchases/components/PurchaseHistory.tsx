
import React, { useState, useCallback, useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Input } from '../../../components/ui/Input';
import { Search, FileText } from 'lucide-react';
import { PurchaseHistoryRow } from './PurchaseHistoryRow';
import { PurchaseInvoice } from '../../../types';
import { eventBus } from '../../../lib/events';
import { PaymentOutModal } from '../../payments/components/PaymentOutModal';
import { PaymentOutDetails } from '../../payments/types';
import { purchaseService } from '../../../services/purchaseService';
import { PurchaseDetailsModal } from './PurchaseDetailsModal';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { DataTable, DataTableColumn } from '../../../components/ui/DataTable';

export const PurchaseHistory: React.FC = () => {
    const { lang, settings, addToast } = useZustandStore(state => ({
        lang: state.lang,
        settings: state.settings,
        addToast: state.addToast,
    }));
    const t = translations[lang];
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [payingPurchase, setPayingPurchase] = useState<PurchaseInvoice | null>(null);
    const [viewingPurchase, setViewingPurchase] = useState<PurchaseInvoice | null>(null);

    const pageSize = 10;

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // React Query
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['purchases', currentPage, pageSize, debouncedSearch],
        queryFn: () => purchaseService.getPurchasesPaginated({
            page: currentPage,
            pageSize,
            search: debouncedSearch
        }),
        placeholderData: keepPreviousData,
    });

    const purchases = data?.data || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const handlePayClick = useCallback((item: PurchaseInvoice) => setPayingPurchase(item), []);
    const handleClosePaymentModal = useCallback(() => setPayingPurchase(null), []);
    const handleViewClick = useCallback((item: PurchaseInvoice) => setViewingPurchase(item), []);
    const handleCloseViewModal = useCallback(() => setViewingPurchase(null), []);

    const handleSavePayment = async (paymentDetails: PaymentOutDetails) => {
        if (!payingPurchase) return;

        const { error } = await purchaseService.recordPayment(payingPurchase.id, paymentDetails);
        if (error) {
            addToast({ message: error.message, type: 'error' });
            return;
        }

        addToast({ message: 'تم تسجيل الدفعة بنجاح.', type: 'success' });
        
        // Invalidate queries to refresh list and stats
        queryClient.invalidateQueries({ queryKey: ['purchases'] });
        queryClient.invalidateQueries({ queryKey: ['purchaseStats'] });
        queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });

        if (paymentDetails.sendReceipt) {
            eventBus.publish({
                id: crypto.randomUUID(),
                type: 'PAYMENT_RECEIPT_SEND',
                payload: { recipientName: payingPurchase.supplierName, recipientEmail: null, amount: paymentDetails.amount, currency: paymentDetails.currency, date: paymentDetails.date },
                at: new Date().toISOString(),
                lang: lang,
            });
        }
        
        handleClosePaymentModal();
    };

    const columns: DataTableColumn[] = useMemo(() => [
        { header: t.invoiceNumber, className: 'text-right' },
        { header: t.supplierName, className: 'text-right' },
        { header: t.date, className: 'text-right' },
        { header: t.total, className: 'text-right' },
        { header: t.status, className: 'text-right' },
        { header: t.actions, className: 'text-center' },
    ], [t]);

    const renderRow = useCallback((purchase: PurchaseInvoice, index: number) => (
        <PurchaseHistoryRow
            key={purchase.id}
            purchase={purchase}
            isOdd={index % 2 !== 0}
            onPay={handlePayClick}
            onView={handleViewClick}
        />
    ), [handlePayClick, handleViewClick]);

    return (
        <div className="space-y-4">
            <Input
                icon={Search}
                placeholder="ابحث برقم الفاتورة أو اسم المورد..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            
            <DataTable<PurchaseInvoice>
                data={purchases}
                columns={columns}
                isLoading={isLoading}
                error={isError ? (error as Error).message : null}
                emptyMessage={searchTerm ? 'لا توجد فواتير مطابقة للبحث' : 'لا توجد فواتير مشتريات بعد.'}
                emptyIcon={FileText}
                pagination={{
                    currentPage,
                    totalPages,
                    totalCount,
                    onPageChange: setCurrentPage,
                    showingText: `${t.showing} ${purchases.length} ${t.of} ${totalCount}`
                }}
                renderRow={renderRow}
            />
            
            {payingPurchase && (
                <PaymentOutModal
                    payable={{
                        id: payingPurchase.id,
                        type: 'purchase',
                        description: `${t.newPurchaseInvoice} #${payingPurchase.invoiceNumber}`,
                        remainingAmount: payingPurchase.remainingAmount,
                        currency: settings.baseCurrency,
                    }}
                    onClose={handleClosePaymentModal}
                    onSave={handleSavePayment}
                />
            )}

            {viewingPurchase && (
                <PurchaseDetailsModal 
                    purchase={viewingPurchase} 
                    onClose={handleCloseViewModal}
                />
            )}
        </div>
    );
};

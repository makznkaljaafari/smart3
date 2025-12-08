
import React, { useState, useMemo } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { Input } from '../../components/ui/Input';
import { Search, Loader, ServerCrash, FileText, ChevronLeft, ChevronRight, Send, Download, Eye } from 'lucide-react';
import { SalesHistoryRow } from './components/SalesHistoryRow';
import { HoloButton } from '../../components/ui/HoloButton';
import { SalesInvoice, LangCode } from '../../types';
import { eventBus } from '../../lib/events';
import { SalesDetailsModal } from './components/SalesDetailsModal';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../../services/salesService';
import { DataTable, DataTableColumn } from '../../components/ui/DataTable';
import { PaymentInModal } from '../payments/components/PaymentInModal';

export const SalesHistory: React.FC = () => {
    const { lang, addToast, settings, fetchInventoryLevels } = useZustandStore(state => ({
        lang: state.lang,
        addToast: state.addToast,
        settings: state.settings,
        fetchInventoryLevels: state.fetchInventoryLevels,
    }));
    const t = translations[lang];
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    // State for viewing details
    const [viewingSale, setViewingSale] = useState<SalesInvoice | null>(null);
    // State for paying sale
    const [payingSale, setPayingSale] = useState<SalesInvoice | null>(null);
    
    const pageSize = 10;

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Use React Query for data fetching
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['sales', currentPage, pageSize, debouncedSearch],
        queryFn: () => salesService.getSalesPaginated({
            page: currentPage,
            pageSize,
            search: debouncedSearch
        }),
        placeholderData: keepPreviousData,
    });

    const sales = data?.data || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const handleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(sales.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };
    
    const sendInvoices = (invoices: SalesInvoice[]) => {
        if (invoices.length === 0) return;
        invoices.forEach(sale => {
            eventBus.publish({
                id: crypto.randomUUID(),
                type: 'SALES_INVOICE_SEND',
                payload: { invoiceNumber: sale.invoiceNumber, customerName: sale.customerName, total: sale.total, currency: settings.baseCurrency },
                at: new Date().toISOString(),
                lang: lang as LangCode,
            });
        });
        addToast({ message: `تم إرسال ${invoices.length} فاتورة بنجاح.`, type: 'success'});
        setSelectedIds([]);
    };

    const handleSend = (sale: SalesInvoice) => {
        if (confirm(`هل أنت متأكد من إرسال الفاتورة #${sale.invoiceNumber}؟`)) {
            sendInvoices([sale]);
        }
    };
    
    const handleSendSelected = () => {
        const toSend = sales.filter(s => selectedIds.includes(s.id));
        if (confirm(`هل أنت متأكد من إرسال ${toSend.length} فاتورة محددة؟`)) {
            sendInvoices(toSend);
        }
    };
    
    const handleDownload = (sale: SalesInvoice, format: 'pdf' | 'csv') => {
        alert(`Downloading ${format} for invoice ${sale.invoiceNumber}`);
    };

    const handleViewDetails = (sale: SalesInvoice) => setViewingSale(sale);
    const handleCloseDetails = () => setViewingSale(null);

    const handlePay = (sale: SalesInvoice) => setPayingSale(sale);
    const handleClosePay = () => setPayingSale(null);

    const handleSavePayment = async (paymentData: any) => {
        if (!payingSale) return;

        const { error } = await salesService.recordPayment(payingSale.id, paymentData);
        
        if (error) {
            addToast({ message: error.message || 'Failed to record payment', type: 'error' });
            return;
        }

        addToast({ message: 'تم تسجيل الدفعة بنجاح!', type: 'success' });
        
        queryClient.invalidateQueries({ queryKey: ['sales'] });
        queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
        fetchInventoryLevels(); // Refresh stock
        
        handleClosePay();
    };

    const columns: DataTableColumn[] = [
        { header: t.invoiceNumber, className: 'text-right' },
        { header: t.customer, className: 'text-right' },
        { header: t.date, className: 'text-right' },
        { header: t.total, className: 'text-right' },
        { header: t.status, className: 'text-right' },
        { header: t.actions, className: 'text-center' },
    ];

    return (
        <div className="space-y-4">
            <Input
                icon={Search}
                placeholder="ابحث برقم الفاتورة..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            
            <DataTable<SalesInvoice>
                data={sales}
                columns={columns}
                isLoading={isLoading}
                error={isError ? (error as Error).message : null}
                emptyMessage={searchTerm ? 'لا توجد فواتير مطابقة للبحث' : 'لا توجد فواتير مبيعات بعد.'}
                emptyIcon={FileText}
                pagination={{
                    currentPage,
                    totalPages,
                    totalCount,
                    onPageChange: setCurrentPage,
                    showingText: `${t.showing} ${sales.length} ${t.of} ${totalCount}`
                }}
                selection={{
                    selectedCount: selectedIds.length,
                    isAllSelected: sales.length > 0 && selectedIds.length === sales.length,
                    onSelectAll: handleSelectAll
                }}
                actions={
                    <HoloButton variant="secondary" icon={Send} disabled={selectedIds.length === 0} onClick={handleSendSelected}>
                        {t.sendSelected}
                    </HoloButton>
                }
                renderRow={(sale, index) => (
                    <SalesHistoryRow
                        key={sale.id}
                        sale={sale}
                        isOdd={index % 2 !== 0}
                        isSelected={selectedIds.includes(sale.id)}
                        onSelect={handleSelect}
                        onSend={handleSend}
                        onDownload={handleDownload}
                        onView={handleViewDetails}
                        onPay={handlePay}
                    />
                )}
            />

            {viewingSale && <SalesDetailsModal sale={viewingSale} onClose={handleCloseDetails} />}
            
            {payingSale && (
                <PaymentInModal 
                    invoice={payingSale}
                    onClose={handleClosePay}
                    onSave={handleSavePayment}
                />
            )}
        </div>
    );
};

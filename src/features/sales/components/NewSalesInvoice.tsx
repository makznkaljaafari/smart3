
import React, { useState, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { AISalesSuggestions } from './AISalesSuggestions';
import { ProductSelectionModal } from '../../../components/common/ProductSelectionModal';
import { InvoiceItemsTable } from '../../invoices/components/InvoiceItemsTable';
import { InvoiceHeaderModal } from './InvoiceHeaderModal';
import { useSalesInvoice } from '../hooks/useSalesInvoice';
import { Keyboard } from 'lucide-react';
import { InvoiceHeader } from './invoice/InvoiceHeader';
import { InvoiceConfiguration } from './invoice/InvoiceConfiguration';
import { InvoiceFooter } from './invoice/InvoiceFooter';

export const NewSalesInvoice: React.FC = () => {
    const { theme, lang, settings } = useZustandStore();
    const t = translations[lang];
    const isDark = theme === 'dark';
    
    const {
        selectedCustomer, setSelectedCustomer,
        selectedVehicleId, setSelectedVehicleId,
        invoiceType, setInvoiceType,
        invoiceNumber, setInvoiceNumber,
        warehouseId, setWarehouseId,
        currency, setCurrency,
        items,
        discount, setDiscount,
        tax, setTax,
        amountPaid, setAmountPaid,
        paymentMethod, setPaymentMethod,
        depositAccountId, setDepositAccountId,
        date, setDate,
        notes, setNotes,
        isSaving,
        stockWarnings,
        aiSuggestions,
        setAiSuggestions,
        isSuggesting,
        sendInvoice, setSendInvoice,
        calculations,
        accountGroups,
        handleAddItem,
        handleItemChange,
        handleRemoveItem,
        handleSaveInvoice,
        handleSaveHeader,
    } = useSalesInvoice();

    const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Save: Ctrl/Cmd + Enter
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSaveInvoice();
            }
            // Open Product Modal: Ctrl/Cmd + I
            if ((e.metaKey || e.ctrlKey) && (e.key === 'i' || e.key === 'I')) {
                e.preventDefault();
                setIsProductModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSaveInvoice]);

    return (
        <div className={`p-6 md:p-8 rounded-2xl w-full transition-colors duration-300 ${isDark ? 'bg-slate-900 border border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            
            <InvoiceHeader 
                date={date} 
                setDate={setDate} 
                invoiceType={invoiceType} 
                setInvoiceType={setInvoiceType}
                invoiceNumber={invoiceNumber}
                setInvoiceNumber={setInvoiceNumber}
                onEditProfile={() => setIsHeaderModalOpen(true)} 
            />

            <div className="px-1">
                <InvoiceConfiguration 
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                    selectedVehicleId={selectedVehicleId}
                    setSelectedVehicleId={setSelectedVehicleId}
                    warehouseId={warehouseId}
                    setWarehouseId={setWarehouseId}
                    currency={currency}
                    setCurrency={setCurrency}
                />
                
                {selectedCustomer && (
                    <AISalesSuggestions 
                        suggestions={aiSuggestions} 
                        onSelect={(p) => { handleAddItem(p); setAiSuggestions([]); }} 
                        isLoading={isSuggesting} 
                    />
                )}
            </div>

            <div className="relative mt-6">
                <InvoiceItemsTable 
                    items={items} 
                    onItemChange={(id, field, val) => handleItemChange(id, field as any, val)} 
                    onRemoveItem={handleRemoveItem} 
                    onOpenProductModal={() => setIsProductModalOpen(true)} 
                    stockWarnings={stockWarnings} 
                    t={t} 
                    invoiceType="sales" 
                    currency={currency} 
                    showWarehouseColumn={false}
                />
            </div>
            
            <InvoiceFooter 
                invoiceType={invoiceType}
                notes={notes} setNotes={setNotes}
                amountPaid={amountPaid} setAmountPaid={setAmountPaid}
                paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                depositAccountId={depositAccountId} setDepositAccountId={setDepositAccountId}
                accountGroups={accountGroups}
                calculations={calculations}
                currency={currency}
                discount={discount} setDiscount={setDiscount}
                tax={tax} setTax={setTax}
                sendInvoice={sendInvoice} setSendInvoice={setSendInvoice}
                isSaving={isSaving}
                onSave={handleSaveInvoice}
            />
            
            {/* Keyboard Shortcuts Legend */}
            <div className={`mt-8 pt-4 border-t flex items-center justify-center gap-6 text-xs ${isDark ? 'border-gray-800 text-gray-500' : 'border-slate-100 text-gray-400'}`}>
                <div className="flex items-center gap-2">
                    <Keyboard size={14} />
                    <span className="font-semibold uppercase tracking-wide">Shortcuts</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded border font-mono ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-slate-100 border-slate-300'}`}>Ctrl + I</span>
                    <span>Add Items</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded border font-mono ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-slate-100 border-slate-300'}`}>Ctrl + Enter</span>
                    <span>Save Invoice</span>
                </div>
            </div>

            <ProductSelectionModal 
                isOpen={isProductModalOpen} 
                onClose={() => setIsProductModalOpen(false)} 
                onSelect={(p) => { handleAddItem(p); setIsProductModalOpen(false); }}
            />
        
            {isHeaderModalOpen && (
                <InvoiceHeaderModal
                    initialData={settings.profile}
                    onClose={() => setIsHeaderModalOpen(false)}
                    onSave={async (data) => { await handleSaveHeader(data); setIsHeaderModalOpen(false); }}
                />
            )}
        </div>
    );
};

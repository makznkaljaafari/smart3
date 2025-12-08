
import React, { useState } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { usePurchaseInvoice } from '../hooks/usePurchaseInvoice';
import { ProductSelectionModal } from '../../../components/common/ProductSelectionModal';
import { InvoiceItemsTable } from '../../invoices/components/InvoiceItemsTable';

// New Components
import { PurchaseHeader } from './invoice/PurchaseHeader';
import { PurchaseConfiguration } from './invoice/PurchaseConfiguration';
import { PurchaseFooter } from './invoice/PurchaseFooter';

export const NewPurchaseInvoice: React.FC = () => {
    const { theme, lang } = useZustandStore();
    const t = translations[lang];
    
    const {
        selectedSupplier, setSelectedSupplier,
        invoiceType, setInvoiceType,
        invoiceNumber, setInvoiceNumber,
        warehouseId, setWarehouseId,
        currency, setCurrency,
        items, handleAddItem, handleItemChange, handleRemoveItem,
        discount, setDiscount,
        tax, setTax,
        amountPaid, setAmountPaid,
        paymentMethod, setPaymentMethod,
        paymentAccountId, setPaymentAccountId,
        date, setDate,
        notes, setNotes,
        isSaving, handleSaveInvoice,
        accountGroups,
        calculations,
    } = usePurchaseInvoice();

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    return (
        <div className={`p-6 md:p-8 rounded-2xl w-full ${theme === 'dark' ? 'bg-slate-900 border border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            
            <PurchaseHeader 
                date={date} 
                setDate={setDate} 
                invoiceType={invoiceType} 
                setInvoiceType={setInvoiceType}
                invoiceNumber={invoiceNumber}
                setInvoiceNumber={setInvoiceNumber}
            />

            <div className="px-1">
                <PurchaseConfiguration
                    selectedSupplier={selectedSupplier}
                    setSelectedSupplier={setSelectedSupplier}
                    warehouseId={warehouseId}
                    setWarehouseId={setWarehouseId}
                    currency={currency}
                    setCurrency={setCurrency}
                />
            </div>

            <InvoiceItemsTable 
                items={items} 
                onItemChange={handleItemChange} 
                onRemoveItem={handleRemoveItem} 
                onOpenProductModal={() => setIsProductModalOpen(true)} 
                stockWarnings={{}} // No stock warnings for purchase usually (unless checking max capacity)
                t={t} 
                invoiceType="purchase" 
                currency={currency} 
                showWarehouseColumn={false}
            />
            
            <PurchaseFooter 
                invoiceType={invoiceType}
                notes={notes} setNotes={setNotes}
                amountPaid={amountPaid} setAmountPaid={setAmountPaid}
                paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                paymentAccountId={paymentAccountId} setPaymentAccountId={setPaymentAccountId}
                accountGroups={accountGroups}
                calculations={calculations}
                currency={currency}
                discount={discount} setDiscount={setDiscount}
                tax={tax} setTax={setTax}
                isSaving={isSaving}
                onSave={handleSaveInvoice}
            />

            <ProductSelectionModal 
                isOpen={isProductModalOpen} 
                onClose={() => setIsProductModalOpen(false)} 
                onSelect={(p) => { handleAddItem(p); setIsProductModalOpen(false); }}
            />
        </div>
    );
};

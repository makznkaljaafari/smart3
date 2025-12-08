
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { purchaseService } from '../../../services/purchaseService';
import { inventoryService } from '../../../services/inventoryService';
import { SalesInvoiceItem, Product, PaymentMethod, CurrencyCode, Account } from '../../../types';
import { Supplier } from '../../suppliers/types';
import { useQueryClient } from '@tanstack/react-query';

interface LocalPurchaseInvoiceItem extends SalesInvoiceItem {
  warehouseId: string;
}

export const usePurchaseInvoice = () => {
    const { settings, addToast, accounts, warehouses } = useZustandStore(state => ({
        settings: state.settings,
        addToast: state.addToast,
        accounts: state.accounts,
        warehouses: state.warehouses,
    }));
    
    const queryClient = useQueryClient();

    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [invoiceType, setInvoiceType] = useState<'cash' | 'credit'>('credit');
    const [items, setItems] = useState<LocalPurchaseInvoiceItem[]>([]);
    
    // Financials
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    
    // Payment Details
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [paymentAccountId, setPaymentAccountId] = useState<string>('');

    // Meta
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Header Settings
    const [currency, setCurrency] = useState<CurrencyCode>(settings.baseCurrency);
    const [warehouseId, setWarehouseId] = useState<string>(settings.inventory?.defaultWarehouseId || '');

    // Initialize warehouse
    useEffect(() => {
        if (settings.inventory?.defaultWarehouseId) {
            setWarehouseId(settings.inventory.defaultWarehouseId);
        } else if (!warehouseId && warehouses.length > 0) {
            setWarehouseId(warehouses[0].id);
        }
    }, [settings.inventory?.defaultWarehouseId, warehouseId, warehouses]);

    // Group Accounts
    const accountGroups = useMemo(() => {
        const assets = accounts.filter(a => a.type === 'asset' && !a.isPlaceholder);
        return {
            cash: assets.filter(a => a.name.toLowerCase().includes('cash') || a.name.includes('نقد') || a.name.includes('صندوق') || a.name.includes('box')),
            bank: assets.filter(a => a.name.toLowerCase().includes('bank') || a.name.includes('بنك') || a.name.includes('مصرف')),
            exchange: assets.filter(a => a.name.toLowerCase().includes('exchange') || a.name.includes('صراف') || a.name.includes('تحويل')),
            other: assets.filter(a => !a.name.match(/(cash|نقد|صندوق|box|bank|بنك|مصرف|exchange|صراف|تحويل)/i))
        };
    }, [accounts]);

    // Default payment account logic
    useEffect(() => {
        if (amountPaid > 0 || invoiceType === 'cash') {
            let targetGroup: Account[] = [];
            if (paymentMethod === 'cash') targetGroup = accountGroups.cash;
            else if (paymentMethod === 'bank_transfer' || paymentMethod === 'credit_card') targetGroup = accountGroups.bank;
            else if (paymentMethod === 'exchange') targetGroup = accountGroups.exchange;
            
            if (targetGroup.length > 0) {
                 if (!targetGroup.find(a => a.id === paymentAccountId)) {
                     setPaymentAccountId(targetGroup[0].id);
                 }
            } else if (!paymentAccountId && accountGroups.other.length > 0) {
                 setPaymentAccountId(accountGroups.other[0].id);
            } else if (!paymentAccountId && accounts.filter(a=>a.type === 'asset').length > 0) {
                 setPaymentAccountId(accounts.filter(a=>a.type === 'asset')[0].id);
            }
        }
    }, [paymentMethod, amountPaid, invoiceType, accountGroups, accounts, paymentAccountId]);

    // Calculations
    const calculations = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + item.total, 0);
        const grandTotal = subtotal - discount + tax;
        const actualPaid = invoiceType === 'cash' ? grandTotal : amountPaid;
        const remainingAmount = grandTotal - actualPaid;
        return { subtotal, total: grandTotal, remainingAmount, actualPaid };
    }, [items, discount, tax, amountPaid, invoiceType]);

    // Sync amountPaid for cash invoices
    useEffect(() => {
        if (invoiceType === 'cash') {
            setAmountPaid(calculations.total);
        } else if (invoiceType === 'credit' && amountPaid === calculations.total && calculations.total > 0) {
             setAmountPaid(0);
        }
    }, [invoiceType, calculations.total]);

    const handleAddItem = (product: Product) => {
        if (items.some(i => i.productId === product.id)) { addToast({ message: 'هذا المنتج موجود بالفعل.', type: 'info' }); return; }
        
        const newItem: LocalPurchaseInvoiceItem = { 
            productId: product.id, 
            productName: product.name, 
            quantity: 1, 
            unitPrice: product.costPrice, 
            total: product.costPrice, 
            warehouseId: warehouseId 
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleItemChange = (productId: string, field: 'quantity' | 'unitPrice' | 'warehouseId', value: any) => {
        setItems(prev => prev.map(item => {
            if (item.productId === productId) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') { updatedItem.total = updatedItem.quantity * updatedItem.unitPrice; }
                return updatedItem;
            }
            return item;
        }));
    };

    const handleRemoveItem = (productId: string) => setItems(prev => prev.filter(item => item.productId !== productId));

    const resetForm = useCallback(() => {
        setSelectedSupplier(null);
        setItems([]);
        setDiscount(0);
        setTax(0);
        setAmountPaid(0);
        setPaymentMethod('cash');
        setNotes('');
        setInvoiceType('credit');
        setPaymentAccountId('');
        setInvoiceNumber('');
        setCurrency(settings.baseCurrency);
        setDate(new Date().toISOString().split('T')[0]);
        const defaultWh = settings.inventory?.defaultWarehouseId || (warehouses.length > 0 ? warehouses[0].id : '');
        setWarehouseId(defaultWh);
    }, [settings.baseCurrency, settings.inventory?.defaultWarehouseId, warehouses]);

    const handleSaveInvoice = async () => {
        if (!selectedSupplier) { addToast({ message: 'الرجاء اختيار مورد.', type: 'error' }); return; }
        if (!invoiceNumber) { addToast({ message: 'رقم الفاتورة مطلوب.', type: 'error' }); return; }
        if (items.length === 0) { addToast({ message: 'يجب إضافة مادة واحدة على الأقل.', type: 'error' }); return; }
        if (!warehouseId) { addToast({ message: 'الرجاء اختيار المستودع.', type: 'error' }); return; }
        
        if (invoiceType === 'cash' && Math.abs(amountPaid - calculations.total) > 0.01) {
             addToast({ message: 'في الفاتورة النقدية، يجب أن يكون المبلغ المدفوع مساوياً للإجمالي.', type: 'warning' });
             return;
        }

        if ((invoiceType === 'cash' || amountPaid > 0) && !paymentAccountId) {
            addToast({ message: 'يجب اختيار حساب الخصم (الأصل) الذي سيتم الدفع منه.', type: 'error' });
            return;
        }

        setIsSaving(true);
        
        try {
            const { actualPaid } = calculations;
            
            const processedItems = [];
            for (const item of items) {
                let finalProductId = item.productId;
                
                if (!finalProductId && item.productName) {
                    const newProductData: Partial<Product> = {
                        name: item.productName,
                        sku: `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
                        costPrice: item.unitPrice,
                        sellingPrice: item.unitPrice * 1.2,
                        currency: currency,
                        description: item.productName
                    };
                    const { data: newProds, error: prodError } = await inventoryService.saveProduct(newProductData, true);
                    if (prodError || !newProds || newProds.length === 0) {
                        throw new Error(`Failed to create product ${item.productName}: ${prodError?.message}`);
                    }
                    finalProductId = newProds[0].id;
                }
                
                processedItems.push({
                    product_id: finalProductId,
                    warehouse_id: warehouseId,
                    quantity: item.quantity,
                    price: item.unitPrice
                });
            }

            const { error } = await purchaseService.createPurchase({
                supplierName: selectedSupplier.name,
                invoiceNumber: invoiceNumber,
                currency: currency,
                items: processedItems,
                amountPaid: actualPaid,
                paymentMethod: paymentMethod,
                notes: notes,
                paymentAccountId: paymentAccountId,
                discount: discount, // Pass discount
                tax: tax,           // Pass tax
            });

            if (error) throw error;

            addToast({ message: 'تم حفظ فاتورة الشراء بنجاح!', type: 'success' }); 
            resetForm();

            // Refresh related data
            queryClient.invalidateQueries({ queryKey: ['purchaseStats'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
            queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
            
            useZustandStore.getState().fetchInventoryLevels();
            useZustandStore.getState().fetchProducts();

        } catch (e: any) {
            console.error("Save Purchase Error:", e);
            addToast({ message: `فشل حفظ الفاتورة: ${e.message || 'حدث خطأ غير متوقع'}`, type: 'error' }); 
        } finally {
            setIsSaving(false);
        }
    };

    return {
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
    };
};

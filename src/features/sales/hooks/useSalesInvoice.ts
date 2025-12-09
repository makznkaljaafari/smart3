
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { salesService } from '../api/salesService';
import { inventoryService } from '../../inventory/api/inventoryService';
import { SalesInvoiceItem, Product, PaymentMethod, CurrencyCode, Account } from '../../../types';
import { Customer } from '../../customers/types';
import { useQueryClient } from '@tanstack/react-query';
import { suggestProductsForCustomer } from '../api/salesAiService';

interface LocalSalesInvoiceItem extends SalesInvoiceItem {
  warehouseId: string;
}

export const useSalesInvoice = () => {
    const { settings, addToast, accounts, warehouses, products } = useZustandStore(state => ({
        settings: state.settings,
        addToast: state.addToast,
        accounts: state.accounts,
        warehouses: state.warehouses,
        products: state.products
    }));
    
    const queryClient = useQueryClient();

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [invoiceType, setInvoiceType] = useState<'cash' | 'credit'>('cash');
    const [items, setItems] = useState<LocalSalesInvoiceItem[]>([]);
    
    // Financials
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    
    // Payment Details
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [depositAccountId, setDepositAccountId] = useState<string>('');

    // Meta
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [sendInvoice, setSendInvoice] = useState(false);
    
    // Header Settings
    const [currency, setCurrency] = useState<CurrencyCode>(settings.baseCurrency);
    const [warehouseId, setWarehouseId] = useState<string>(settings.inventory?.defaultWarehouseId || '');
    
    // AI Suggestions
    const [aiSuggestions, setAiSuggestions] = useState<Product[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [stockWarnings, setStockWarnings] = useState<Record<string, string>>({});

    // Initialize warehouse
    useEffect(() => {
        if (settings.inventory?.defaultWarehouseId) {
            setWarehouseId(settings.inventory.defaultWarehouseId);
        } else if (!warehouseId && warehouses.length > 0) {
            setWarehouseId(warehouses[0].id);
        }
    }, [settings.inventory?.defaultWarehouseId, warehouseId, warehouses]);

    // AI Suggestions Logic
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!selectedCustomer) {
                setAiSuggestions([]);
                return;
            }
            setIsSuggesting(true);
            
            // Mock fetching purchase history from a query or cache
            // In a real app, query salesService.getSalesByCustomer(selectedCustomer.id)
            const purchaseHistory: { productName: string, quantity: number }[] = []; 
            const availableToSuggest = products.map(p => ({ id: p.id, name: p.name }));
            
            // Call AI Service
            // (Assuming purchaseHistory would be populated from actual data)
            if (purchaseHistory.length >= 0 && availableToSuggest.length > 0) {
                 const suggestedIds = await suggestProductsForCustomer(selectedCustomer.name, purchaseHistory, availableToSuggest);
                 if (suggestedIds) {
                     setAiSuggestions(products.filter((p: Product) => suggestedIds.includes(p.id) && !items.some(i => i.productId === p.id)));
                 } else {
                     setAiSuggestions([]);
                 }
            }
            setIsSuggesting(false);
        };
        fetchSuggestions();
    }, [selectedCustomer, products]); // Removing items from dep array to avoid loops, handled by filtering

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
                 if (!targetGroup.find(a => a.id === depositAccountId)) {
                     setDepositAccountId(targetGroup[0].id);
                 }
            } else if (!depositAccountId && accountGroups.other.length > 0) {
                 setDepositAccountId(accountGroups.other[0].id);
            } else if (!depositAccountId && accounts.filter(a=>a.type === 'asset').length > 0) {
                 setDepositAccountId(accounts.filter(a=>a.type === 'asset')[0].id);
            }
        }
    }, [paymentMethod, amountPaid, invoiceType, accountGroups, accounts, depositAccountId]);

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
        
        const newItem: LocalSalesInvoiceItem = { 
            productId: product.id, 
            productName: product.name, 
            quantity: 1, 
            unitPrice: product.sellingPrice, 
            total: product.sellingPrice, 
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
        setSelectedCustomer(null);
        setSelectedVehicleId('');
        setItems([]);
        setDiscount(0);
        setTax(0);
        setAmountPaid(0);
        setPaymentMethod('cash');
        setNotes('');
        setInvoiceType('cash');
        setDepositAccountId('');
        setInvoiceNumber('');
        setCurrency(settings.baseCurrency);
        setDate(new Date().toISOString().split('T')[0]);
        const defaultWh = settings.inventory?.defaultWarehouseId || (warehouses.length > 0 ? warehouses[0].id : '');
        setWarehouseId(defaultWh);
    }, [settings.baseCurrency, settings.inventory?.defaultWarehouseId, warehouses]);

    const handleSaveInvoice = async () => {
        if (!selectedCustomer) { addToast({ message: 'الرجاء اختيار عميل.', type: 'error' }); return; }
        if (items.length === 0) { addToast({ message: 'يجب إضافة مادة واحدة على الأقل.', type: 'error' }); return; }
        if (!warehouseId) { addToast({ message: 'الرجاء اختيار المستودع.', type: 'error' }); return; }
        
        if ((invoiceType === 'cash' || amountPaid > 0) && !depositAccountId) {
            addToast({ message: 'يجب اختيار حساب الإيداع (الأصل) لاستلام المبلغ.', type: 'error' });
            return;
        }

        setIsSaving(true);
        
        try {
            const { actualPaid } = calculations;
            
            const processedItems = items.map(item => ({
                product_id: item.productId,
                warehouse_id: item.warehouseId,
                quantity: item.quantity,
                price: item.unitPrice
            }));

            const { data: invoiceId, error } = await salesService.createSale({
                customerId: selectedCustomer.id,
                invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
                currency: currency,
                items: processedItems,
                amountPaid: actualPaid,
                paymentMethod: paymentMethod,
                notes: notes,
                depositAccountId: depositAccountId,
                discount: discount,
                tax: tax,
                vehicleId: selectedVehicleId
            });

            if (error) throw error;
            
            // Inventory movements handled via logic in createSale or separate
            // For this implementation, we assume createSale RPC handles inventory deduction via trigger or we call logic
            // Since we moved logic to frontend service for consistency in this example:
            if (invoiceId) {
                 const movements = items.map(item => ({
                     productId: item.productId,
                     warehouseId: item.warehouseId,
                     quantityChange: -item.quantity, // Negative for sale
                     movementType: 'sale' as const,
                     referenceType: 'sales_invoice',
                     referenceId: invoiceId,
                     notes: `Invoice #${invoiceNumber}`
                 }));
                 await inventoryService.recordBatchMovements(movements);
            }

            addToast({ message: 'تم حفظ فاتورة المبيعات بنجاح!', type: 'success' }); 
            resetForm();

            queryClient.invalidateQueries({ queryKey: ['salesStats'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
            useZustandStore.getState().fetchInventoryLevels();

        } catch (e: any) {
            console.error("Save Sale Error:", e);
            addToast({ message: `فشل حفظ الفاتورة: ${e.message}`, type: 'error' }); 
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveHeader = async (data: any) => {
        // Implementation for updating profile settings from invoice header modal
        const { profileService } = await import('../../../services/profileService');
        await profileService.updateProfileAndSettings({ ...settings, profile: { ...settings.profile, ...data }});
        useZustandStore.setState(s => ({ settings: { ...s.settings, profile: { ...s.settings.profile, ...data } } }));
    }

    return {
        selectedCustomer, setSelectedCustomer,
        selectedVehicleId, setSelectedVehicleId,
        invoiceType, setInvoiceType,
        invoiceNumber, setInvoiceNumber,
        warehouseId, setWarehouseId,
        currency, setCurrency,
        items, handleAddItem, handleItemChange, handleRemoveItem,
        discount, setDiscount,
        tax, setTax,
        amountPaid, setAmountPaid,
        paymentMethod, setPaymentMethod,
        depositAccountId, setDepositAccountId,
        date, setDate,
        notes, setNotes,
        isSaving, handleSaveInvoice,
        stockWarnings,
        aiSuggestions, setAiSuggestions, isSuggesting,
        sendInvoice, setSendInvoice,
        accountGroups,
        calculations,
        handleSaveHeader
    };
};

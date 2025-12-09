import { useState, useMemo, useEffect, useCallback } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { salesService } from '../../../services/salesService';
import { profileService } from '../../../services/profileService';
import { suggestProductsForCustomer } from '../../../services/aiService';
import { SalesInvoiceItem, Customer, Product, PaymentMethod, CurrencyCode, SettingsState, LangCode } from '../../../types';
import { eventBus } from '../../../lib/events';
import { inventoryService } from '../../../services/inventoryService';
import { useQueryClient } from '@tanstack/react-query';

interface LocalSalesInvoiceItem extends SalesInvoiceItem {
  warehouseId: string;
}

export const useSalesInvoice = () => {
    const { lang, settings, addToast, setSettings, warehouses, accounts } = useZustandStore(state => ({
        lang: state.lang,
        settings: state.settings,
        addToast: state.addToast,
        setSettings: state.setSettings,
        warehouses: state.warehouses,
        accounts: state.accounts,
    }));
    
    const queryClient = useQueryClient();

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    
    const [invoiceType, setInvoiceType] = useState<'cash' | 'credit'>('cash');
    const [warehouseId, setWarehouseId] = useState<string>('');
    const [currency, setCurrency] = useState<CurrencyCode>(settings.baseCurrency);
    const [items, setItems] = useState<LocalSalesInvoiceItem[]>([]);
    
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [depositAccountId, setDepositAccountId] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    // New: Allow manual invoice number
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [stockWarnings, setStockWarnings] = useState<Record<string, string>>({});
    const [aiSuggestions, setAiSuggestions] = useState<Product[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [sendInvoice, setSendInvoice] = useState(true);

    useEffect(() => {
        if (settings.inventory?.defaultWarehouseId) {
            setWarehouseId(settings.inventory.defaultWarehouseId);
        } else if (!warehouseId && warehouses.length > 0) {
            setWarehouseId(warehouses[0].id);
        }
    }, [settings.inventory?.defaultWarehouseId, warehouses]);

    const accountGroups = useMemo(() => {
        const assets = accounts.filter(a => a.type === 'asset' && !a.isPlaceholder);
        return {
            cash: assets.filter(a => a.name.toLowerCase().includes('cash') || a.name.includes('نقد') || a.name.includes('صندوق')),
            bank: assets.filter(a => a.name.toLowerCase().includes('bank') || a.name.includes('بنك')),
            exchange: assets.filter(a => a.name.toLowerCase().includes('exchange') || a.name.includes('صراف')),
            other: assets.filter(a => !a.name.match(/(cash|نقد|صندوق|bank|بنك|exchange|صراف)/i))
        };
    }, [accounts]);

    useEffect(() => {
        if (amountPaid > 0 || invoiceType === 'cash') {
            let targetGroup: any[] = [];
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

    const calculations = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + item.total, 0);
        const grandTotal = subtotal - discount + tax;
        const actualPaid = invoiceType === 'cash' ? grandTotal : amountPaid;
        const remainingAmount = grandTotal - actualPaid;
        return { subtotal, total: grandTotal, remainingAmount, actualPaid };
    }, [items, discount, tax, amountPaid, invoiceType]);

    useEffect(() => {
        if (invoiceType === 'cash') {
            setAmountPaid(calculations.total);
        }
    }, [invoiceType, calculations.total]);

    useEffect(() => {
        const checkStocks = async () => {
            const { allowNegativeStock } = settings.inventory || {};
            if (!warehouseId || items.length === 0) {
                setStockWarnings({});
                return;
            }

            const productIds = Array.from(new Set(items.map(i => i.productId))) as string[];
            const { data: levels } = await inventoryService.getBatchStockLevels(productIds, warehouseId);
            const stockMap = new Map();
            levels?.forEach((l: any) => stockMap.set(l.productId, l.quantity));

            const newWarnings: Record<string, string> = {};

            items.forEach(item => {
                const available = stockMap.get(item.productId) || 0;
                const totalRequested = items.filter(i => i.productId === item.productId).reduce((sum, i) => sum + i.quantity, 0);

                if (totalRequested > available) {
                    if (!allowNegativeStock) {
                        newWarnings[item.productId] = `الكمية المطلوبة تتجاوز المخزون (${available} متوفر)`;
                    }
                }
            });
            
            setStockWarnings(newWarnings);
        };
        
        const timer = setTimeout(checkStocks, 500);
        return () => clearTimeout(timer);

    }, [items, warehouseId, settings.inventory]);

    useEffect(() => {
        if (!selectedCustomer) {
            setAiSuggestions([]);
            return;
        }
        const fetchSuggestions = async () => {
            setIsSuggesting(true);
            // Fetch recent sales for this customer to avoid loading all sales
            const { data: allSales } = await salesService.getSalesPaginated({ pageSize: 20, search: selectedCustomer.name });
            
            const purchaseHistory: { productName: string, quantity: number }[] = [];
            const purchasedProductIds = new Set<string>();
            
            allSales.forEach(sale => { 
                if (sale.customerId === selectedCustomer.id) {
                    sale.items.forEach(item => {
                        purchasedProductIds.add(item.productId);
                        purchaseHistory.push({ productName: item.productName, quantity: item.quantity });
                    });
                }
            });
            
            // OPTIMIZED: Fetch a subset of products (e.g. most recent) to suggest from, instead of loading all
            const { data: availableProducts } = await inventoryService.getProductsPaginated({ pageSize: 50 }); // Fetch top 50
            
            const availableToSuggest = availableProducts.filter(p => !purchasedProductIds.has(p.id)).map(p => ({ id: p.id, name: p.name }));
            
            if (purchaseHistory.length > 0 && availableToSuggest.length > 0) {
                 const suggestedIds = await suggestProductsForCustomer(selectedCustomer.name, purchaseHistory, availableToSuggest);
                 if (suggestedIds) {
                     // Only filter from the products we actually fetched
                     setAiSuggestions(availableProducts.filter(p => suggestedIds.includes(p.id) && !items.some(i => i.productId === p.id)));
                 } else {
                     setAiSuggestions([]);
                 }
            }
            setIsSuggesting(false);
        };
        fetchSuggestions();
    }, [selectedCustomer, items]);

    const handleAddItem = (product: Product) => {
        if (items.some(i => i.productId === product.id)) { addToast({ message: 'هذا المنتج موجود بالفعل.', type: 'info' }); return; }
        if (!warehouseId) { addToast({ message: 'الرجاء اختيار المستودع أولاً.', type: 'warning' }); }
        const newItem: LocalSalesInvoiceItem = { 
            productId: product.id, productName: product.name, quantity: 1, 
            unitPrice: product.sellingPrice, total: product.sellingPrice, warehouseId: warehouseId 
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleItemChange = (productId: string, field: 'quantity' | 'unitPrice', value: any) => {
        setItems(prev => prev.map(item => {
            if (item.productId === productId) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') { updatedItem.total = updatedItem.quantity * updatedItem.unitPrice; }
                return updatedItem;
            }
            return item;
        }));
    };

    const handleRemoveItem = (productId: string) => {
        setItems(prev => prev.filter(item => item.productId !== productId));
        setStockWarnings(prev => { const newWarnings = {...prev}; delete newWarnings[productId]; return newWarnings; });
    };

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
        setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
        const defaultWh = settings.inventory?.defaultWarehouseId || (warehouses.length > 0 ? warehouses[0].id : '');
        setWarehouseId(defaultWh);
        setCurrency(settings.baseCurrency);
        setStockWarnings({});
        setAiSuggestions([]);
        setSendInvoice(true);
        setDepositAccountId('');
    }, [settings, warehouses]);

    const handleSaveInvoice = async () => {
        const { allowBackdatedSales } = settings.inventory || {};
        const today = new Date().toISOString().split('T')[0];
        if (date < today && !allowBackdatedSales) {
            addToast({ message: 'لا يسمح بإنشاء فواتير بتاريخ قديم.', type: 'error' });
            return;
        }
        if (!selectedCustomer) { addToast({ message: 'الرجاء اختيار عميل.', type: 'error' }); return; }
        if (!invoiceNumber) { addToast({ message: 'رقم الفاتورة مطلوب.', type: 'error' }); return; }
        if (!warehouseId) { addToast({ message: 'الرجاء اختيار المستودع.', type: 'error' }); return; }
        if (items.length === 0) { addToast({ message: 'يجب إضافة مادة واحدة على الأقل.', type: 'error' }); return; }
        if (Object.keys(stockWarnings).length > 0) { addToast({ message: 'توجد كميات غير متوفرة. لا يمكن الحفظ.', type: 'error' }); return; }
        
        if ((invoiceType === 'cash' || amountPaid > 0) && !depositAccountId) {
             addToast({ message: 'يجب اختيار حساب الإيداع (صندوق/بنك) لتسجيل الدفعة.', type: 'error' });
             return;
        }

        setIsSaving(true);
        try {
            const { total, actualPaid } = calculations;
            
            const { error } = await salesService.createSale({
                customerId: selectedCustomer.id,
                invoiceNumber: invoiceNumber,
                currency,
                items: items.map(i => ({ product_id: i.productId, warehouse_id: warehouseId, quantity: i.quantity, price: i.unitPrice })),
                amountPaid: actualPaid,
                paymentMethod,
                notes,
                depositAccountId: depositAccountId,
                discount, // Pass discount
                tax,      // Pass tax
                vehicleId: selectedVehicleId // Pass vehicle
            });

            if (error) throw error;

            addToast({ message: 'تم حفظ الفاتورة بنجاح!', type: 'success' });
            if (sendInvoice) {
                eventBus.publish({
                    id: crypto.randomUUID(), type: 'SALES_INVOICE_SEND',
                    payload: { invoiceNumber, customerName: selectedCustomer.name, total, currency, recipientEmail: selectedCustomer.email },
                    at: new Date().toISOString(), lang: lang as LangCode,
                });
            }
            resetForm();
            
            // Refresh related data
            queryClient.invalidateQueries({ queryKey: ['salesStats'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
            queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
            // We still fetch inventory levels to update the local cache of stock for next invoice
            queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
            
        } catch (e: any) {
            addToast({ message: `فشل حفظ الفاتورة: ${e.message}`, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveHeader = async (newProfileData: Partial<SettingsState['profile']>) => {
        const newSettings = { ...settings, profile: { ...settings.profile, ...newProfileData } };
        const { error } = await profileService.updateProfileAndSettings(newSettings);
        if (error) {
            addToast({ message: error.message, type: 'error' });
        } else {
            setSettings(newSettings);
            addToast({ message: 'تم تحديث الملف الشخصي.', type: 'success' });
        }
    };

    return {
        selectedCustomer, setSelectedCustomer,
        selectedVehicleId, setSelectedVehicleId,
        invoiceType, setInvoiceType,
        invoiceNumber, setInvoiceNumber,
        warehouseId, setWarehouseId,
        currency, setCurrency,
        items, setItems,
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
        warehouses,
        settings,
    };
};
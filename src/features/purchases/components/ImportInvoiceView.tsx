
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { X, Save, UploadCloud, Loader, ZoomIn, ZoomOut, RotateCw, Trash2, FileText, Settings, GripVertical, Plus, Camera, ArrowLeft, View, AlertTriangle, Link as LinkIcon, Link2Off, Layers, Search, RefreshCw, ArrowRight } from 'lucide-react';
import { purchaseService } from '../../../services/purchaseService';
import { extractInvoiceDataFromFile, matchInvoiceItemsToProducts } from '../../../services/aiService';
import { Product, PaymentMethod, CurrencyCode } from '../../../types';
import { useResizableColumns } from '../../../hooks/useResizableColumns';
import { ROUTES } from '../../../constants/routes';
import { inventoryService } from '../../../services/inventoryService';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { ProductSelectionModal } from '../../../components/common/ProductSelectionModal';
import { getLatestRate } from '../../../lib/currency';


const formatCurrency = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);

// Helper to safely parse numbers from string/number input
const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const clean = value.replace(/[^0-9.-]+/g, '');
        return parseFloat(clean) || 0;
    }
    return 0;
};

interface ExtractedItem {
    description: string;
    nameAr?: string;
    nameEn?: string;
    itemNumber?: string;
    serialNumber?: string;
    manufacturer?: string;
    compatibleVehicles?: string[];
    quantity: number;
    originalUnitPrice: number;
    unitPrice: number;
    total: number;
    warehouseId: string;
    productId?: string;
    productName?: string;
    [key: string]: any;
}

const fileToB64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

export const ImportInvoiceView: React.FC = () => {
    const { theme, lang, warehouses, settings, addToast, products } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        warehouses: state.warehouses,
        settings: state.settings,
        addToast: state.addToast,
        products: state.products,
    }));
    const t = translations[lang];
    const isRTL = lang === 'ar';
    const navigate = useNavigate();

    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [processingStatus, setProcessingStatus] = useState<'idle' | 'extracting' | 'matching'>('idle');
    
    const [supplierName, setSupplierName] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<ExtractedItem[]>([]);
    
    const [invoiceCurrency, setInvoiceCurrency] = useState<string>(settings.baseCurrency);
    const [exchangeRate, setExchangeRate] = useState<number>(1);
    
    const [subtotal, setSubtotal] = useState(0);
    const [tax, setTax] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectingItemIndex, setSelectingItemIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUnifyWarehouse, setShowUnifyWarehouse] = useState(false);

    const initialColumns = useMemo(() => [
        { key: 'link', label: 'الربط', width: 60 },
        { key: 'serialNumber', label: '#', width: 50 },
        { key: 'description', label: t.description, width: 250 },
        { key: 'itemNumber', label: 'رقم القطعه', width: 100 },
        { key: 'manufacturer', label: t.brand, width: 100 },
        { key: 'quantity', label: 'الكميه', width: 70 },
        { key: 'unitPrice', label: 'سعر الحبه', width: 90 },
        { key: 'total', label: t.total, width: 90 },
        { key: 'warehouseId', label: 'المستودع', width: 140 },
    ], [t]);

    const [columns, setColumns] = useState(initialColumns);
    const [columnWidths, handleMouseDown] = useResizableColumns(columns.map(c => ({ key: c.key, initialWidth: c.width })), isRTL);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (items.length > 0) {
            setItems(prev => prev.map(item => ({
                ...item,
                unitPrice: (item.originalUnitPrice || 0) * exchangeRate,
                total: (item.quantity || 0) * ((item.originalUnitPrice || 0) * exchangeRate)
            })));
        }
    }, [exchangeRate]);

    const handleFileChange = async (selectedFile: File | null) => {
        if (!selectedFile) return;
        
        const fileType = selectedFile.type;
        if (fileType.startsWith('image/')) {
            setFile(selectedFile);
            setFilePreview(URL.createObjectURL(selectedFile));
        } else if (fileType === 'application/pdf') {
            setFile(selectedFile);
            setFilePreview('pdf'); 
        } else {
            addToast({ message: t.unsupportedFileType || 'Unsupported file type.', type: 'error' });
            return;
        }

        setProcessingStatus('extracting');
        try {
            const b64 = await fileToB64(selectedFile);
            const result = await extractInvoiceDataFromFile(b64, selectedFile.type);
            
            if (result) {
                setSupplierName(result.supplierName || '');
                setInvoiceNumber(result.invoiceNumber || '');
                if (result.date && !isNaN(new Date(result.date).getTime())) {
                    setDate(result.date);
                }
                
                const detectedCurrency = result.currencyCode || settings.baseCurrency;
                setInvoiceCurrency(detectedCurrency);
                
                let rate = 1;
                if (detectedCurrency !== settings.baseCurrency) {
                    if (detectedCurrency === 'CNY' || detectedCurrency === 'RMB') {
                         rate = 0.55;
                         addToast({ message: `تم تحديد سعر صرف الريمباي تلقائياً: 1 RMB = 0.55 SAR`, type: 'info' });
                    } else if (detectedCurrency === 'USD') {
                         rate = 3.75;
                    } else {
                        const rateInfo = getLatestRate(detectedCurrency as CurrencyCode, settings.baseCurrency, settings.exchangeRates || []);
                        if (rateInfo) {
                            rate = rateInfo.rate;
                            addToast({ message: `تم تطبيق سعر صرف تلقائي: 1 ${detectedCurrency} = ${rate.toFixed(4)} ${settings.baseCurrency}`, type: 'info' });
                        } else {
                             rate = 1; // Fallback to 1 to prevent zeros
                             addToast({ message: `لم يتم العثور على سعر صرف لـ (${detectedCurrency}). يرجى تحديده يدوياً.`, type: 'warning' });
                        }
                    }
                }
                setExchangeRate(rate);

                const rawItems = result.items || result.lineItems || result.products || [];
                
                const extractedItems = rawItems.map((item: any) => {
                    if (item.brand && !item.manufacturer) item.manufacturer = item.brand;

                    const numericUnitPrice = parseNumber(item.unitPrice || item.price || item.cost) || 0; // Default 0 if parse fail
                    const numericQuantity = parseNumber(item.quantity || item.qty) || 0;
                    const numericTotal = parseNumber(item.total || item.amount) || 0;

                    return { 
                        ...item, 
                        warehouseId: warehouses.length > 0 ? warehouses[0].id : '', // Default first warehouse
                        originalUnitPrice: numericUnitPrice,
                        unitPrice: numericUnitPrice * rate,
                        quantity: numericQuantity,
                        total: (numericTotal || (numericUnitPrice * numericQuantity)) * rate,
                        nameAr: item.nameAr || '',
                        nameEn: item.nameEn || '',
                        compatibleVehicles: Array.isArray(item.compatibleVehicles) ? item.compatibleVehicles : [],
                        description: item.description || 'Item',
                    };
                });
                
                setItems(extractedItems);
                setSubtotal(parseNumber(result.subtotal));
                setTax(parseNumber(result.tax));
                setGrandTotal(parseNumber(result.grandTotal));
                
                // Dynamic Columns Update
                if (extractedItems.length > 0) {
                    const newCols = [...initialColumns];
                    const qtyIndex = newCols.findIndex(c => c.key === 'quantity');

                    if (extractedItems.some((i: any) => i.nameEn)) newCols.splice(qtyIndex, 0, { key: 'nameEn', label: 'English Name', width: 150 });
                    if (extractedItems.some((i: any) => i.compatibleVehicles && i.compatibleVehicles.length > 0)) newCols.splice(qtyIndex, 0, { key: 'compatibleVehicles', label: 'المركبات', width: 150 });
                    
                    setColumns(newCols);
                }

                setProcessingStatus('matching');
                const { products } = useZustandStore.getState();
                const itemPayload = extractedItems.map((item: any, index: number) => ({
                    index,
                    description: item.description,
                    itemNumber: item.itemNumber,
                    manufacturer: item.manufacturer,
                }));
                const productPayload = products.map(p => ({ id: p.id, name: p.name, sku: p.sku }));
                const mapping = await matchInvoiceItemsToProducts(itemPayload, productPayload);

                if (mapping) {
                    setItems(currentItems => currentItems.map((item, index) => {
                        const matchedProductId = mapping[index.toString()];
                        if (matchedProductId) {
                            const matchedProduct = products.find(p => p.id === matchedProductId);
                            return { ...item, productId: matchedProductId, productName: matchedProduct?.name, description: matchedProduct?.name || item.description };
                        }
                        return item;
                    }));
                }

            } else {
                addToast({ message: 'فشل استخراج البيانات من الملف.', type: 'error' });
            }
        } catch (e) {
            console.error(e);
            addToast({ message: 'حدث خطأ أثناء معالجة الملف.', type: 'error' });
        } finally {
            setProcessingStatus('idle');
        }
    };

    const handleOpenLinkModal = (index: number) => {
        setSelectingItemIndex(index);
        setIsProductModalOpen(true);
    };

    const handleSelectProduct = (product: Product) => {
        if (selectingItemIndex === null) return;
        setItems(prev => prev.map((item, i) => i === selectingItemIndex ? { ...item, productId: product.id, productName: product.name } : item));
        setIsProductModalOpen(false);
        setSelectingItemIndex(null);
    };
    
    const handleItemChange = (index: number, field: string, value: any) => {
        setItems(prev => prev.map((item, i) => {
            if (i === index) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') { 
                     updatedItem.total = (parseNumber(updatedItem.quantity)) * (parseNumber(updatedItem.unitPrice));
                     if (field === 'unitPrice' && exchangeRate > 0) {
                         updatedItem.originalUnitPrice = parseNumber(value) / exchangeRate;
                     }
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const handleSaveInvoice = useCallback(async () => {
        if (!supplierName || !invoiceNumber) { addToast({ message: 'Missing supplier or invoice number.', type: 'error' }); return; }
        if (items.length === 0) { addToast({ message: 'No items to save.', type: 'error' }); return; }
        
        // Validate warehouses
        if (items.some(i => !i.warehouseId)) {
            addToast({ message: 'يرجى تحديد المستودع لجميع المواد.', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const { fetchProducts, fetchInventoryLevels } = useZustandStore.getState();
            const processedItems = [];

            for (const item of items) {
                let productId = item.productId;
                if (!productId) {
                    const newProductData: Partial<Product> = {
                        name: item.nameAr || item.description, // Prefer Arabic Name
                        nameAr: item.nameAr,
                        nameEn: item.nameEn || (isRTL ? undefined : item.description), // Use description as EN name if RTL false
                        sku: `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
                        itemNumber: item.itemNumber,
                        manufacturer: item.manufacturer,
                        costPrice: parseNumber(item.unitPrice),
                        sellingPrice: parseNumber(item.unitPrice) * 1.25,
                        currency: settings.baseCurrency,
                        description: item.description,
                        compatibleVehicles: item.compatibleVehicles,
                    };

                    const { data: newProds, error } = await inventoryService.saveProduct(newProductData, true);
                    if (error || !newProds) throw new Error(`Failed to create product: ${item.description}`);
                    productId = newProds[0].id;
                }
                
                processedItems.push({
                    product_id: productId!,
                    warehouse_id: item.warehouseId,
                    quantity: parseNumber(item.quantity),
                    price: parseNumber(item.unitPrice),
                    description: item.description
                });
            }
            
            // 1. Create Invoice (This only creates the financial record and journal entries)
            const { data: invoiceId, error } = await purchaseService.createPurchase({
                supplierName,
                invoiceNumber,
                currency: settings.baseCurrency,
                items: processedItems,
                amountPaid: 0,
                paymentMethod: 'credit',
                notes: `Imported from file. Original Currency: ${invoiceCurrency}`,
            });

            if (error) throw error;
            
            // 2. Create Inventory Movements (To increase stock)
            if (invoiceId) {
                 const movements = processedItems.map(item => ({
                     productId: item.product_id,
                     warehouseId: item.warehouse_id,
                     quantityChange: item.quantity, // Positive for purchase
                     movementType: 'purchase' as const,
                     referenceType: 'purchase_invoice',
                     referenceId: invoiceId as string, // cast generic string return
                     notes: `Invoice Import #${invoiceNumber}`
                 }));
                 
                 const { error: movError } = await inventoryService.recordBatchMovements(movements);
                 if (movError) {
                     console.error("Failed to record inventory movements:", movError);
                     addToast({ message: 'تم حفظ الفاتورة ولكن فشل تحديث المخزون.', type: 'warning' });
                 } else {
                     addToast({ message: 'تم حفظ الفاتورة وتحديث المخزون بنجاح!', type: 'success' });
                 }
            } else {
                 addToast({ message: 'تم حفظ الفاتورة بنجاح!', type: 'success' });
            }

            await fetchProducts();
            await fetchInventoryLevels();
            navigate(ROUTES.PURCHASES);

        } catch (e: any) {
            console.error(e);
            addToast({ message: `Save failed: ${e.message}`, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    }, [supplierName, invoiceNumber, items, settings.baseCurrency, addToast, navigate, invoiceCurrency]);

    const tableHeaderClasses = `p-2 text-xs font-bold text-center sticky top-0 z-10 ${theme === 'dark' ? 'bg-gray-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`;
    const inputClasses = `w-full bg-transparent p-1 rounded focus:bg-gray-700 outline-none focus:ring-1 focus:ring-cyan-500 text-center`;

    const handleUnifyWarehouse = (warehouseId: string) => {
        setItems(prev => prev.map(item => ({ ...item, warehouseId })));
        setShowUnifyWarehouse(false);
    };
    
    return (
         <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                <HoloButton variant="secondary" icon={ArrowLeft} onClick={() => navigate(ROUTES.PURCHASES)}>{t.back}</HoloButton>
                <h3 className="text-xl font-bold">{t.importPurchaseInvoice}</h3>
                <div>
                     {filePreview && (
                        <HoloButton icon={isSaving ? Loader : Save} variant="success" onClick={handleSaveInvoice} disabled={isSaving}>
                            {isSaving ? 'جاري الحفظ...' : t.savePurchase}
                        </HoloButton>
                    )}
                </div>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                {!filePreview ? (
                    <div className="flex-1 flex items-center justify-center p-4">
                       <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                            <div onClick={() => fileInputRef.current?.click()} className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800/50">
                                <UploadCloud size={48} className="text-gray-500 mb-2" />
                                <span className="font-semibold">{t.uploadInvoiceImage}</span>
                                <span className="text-sm text-gray-400">{t.dragAndDrop}</span>
                            </div>
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*,application/pdf" onChange={e => handleFileChange(e.target.files ? e.target.files[0] : null)} />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-4 space-y-3 border-b border-gray-700 flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-lg">{t.extractedData}</h4>
                                {processingStatus !== 'idle' && <div className="flex items-center gap-2 text-sm text-cyan-300"><Loader size={16} className="animate-spin" /> المعالجة...</div>}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Input label={t.supplierName} value={supplierName} onChange={e=>setSupplierName(e.target.value)} />
                                <Input label={t.invoiceNumber} value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} />
                                <Input type="date" label={t.date} value={date} onChange={e=>setDate(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 p-3 rounded-lg bg-gray-800/30 border border-gray-700">
                                <div><Label>العملة الأصلية</Label><Input value={invoiceCurrency} onChange={e => setInvoiceCurrency(e.target.value.toUpperCase())} className="font-mono text-center" /></div>
                                <div className="flex flex-col justify-center items-center pt-6"><ArrowRight className="text-gray-500" /></div>
                                <div><Label>سعر الصرف</Label><Input type="number" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || 0)} className="font-mono text-center text-yellow-400" /></div>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-xs border-collapse responsive-table" style={{ tableLayout: 'fixed' }}>
                                <colgroup>{columns.map(col => <col key={col.key} style={{ width: `${columnWidths[col.key]}px` }} />)}<col style={{ width: '40px' }} /></colgroup>
                                <thead>
                                <tr>
                                    {columns.map(col => (
                                        <th key={col.key} className={`${tableHeaderClasses} border-b border-gray-700 relative group`}>
                                            {col.key === 'warehouseId' ? (
                                                <div className="flex items-center justify-center">
                                                    <span>{col.label}</span>
                                                    <button type="button" onClick={() => setShowUnifyWarehouse(p => !p)} className="p-1 hover:bg-gray-600 rounded ml-2"><Layers size={14} /></button>
                                                    {showUnifyWarehouse && (
                                                        <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-20 p-2 w-48 text-right">
                                                            <select onChange={(e) => handleUnifyWarehouse(e.target.value)} className="w-full p-1 bg-gray-700 rounded"><option value="">اختر...</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : col.label}
                                            {col.key !== 'link' && <div onMouseDown={(e) => handleMouseDown(col.key, e)} className={`absolute top-0 h-full w-2 cursor-col-resize group-hover:bg-cyan-500/30 ${isRTL ? 'left-0' : 'right-0'}`} />}
                                        </th>
                                    ))}
                                    <th className={`${tableHeaderClasses} border-b border-gray-700`}></th>
                                </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-800/50">
                                            {columns.map(col => {
                                                if (col.key === 'link') {
                                                     return <td key={col.key} className="p-0 border-b border-gray-700 text-center">
                                                        {item.productId ? <div className="p-2 text-green-400"><LinkIcon size={18} /></div> : <button onClick={() => handleOpenLinkModal(index)} className="p-2 text-cyan-400"><Search size={18} /></button>}
                                                     </td>
                                                }
                                                if (col.key === 'warehouseId') {
                                                    return <td key={col.key} className="p-0 border-b border-gray-700"><select value={item.warehouseId || ''} onChange={e => handleItemChange(index, col.key, e.target.value)} className={`${inputClasses} !p-0`}><option value="">اختر...</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></td>
                                                }
                                                if (col.key === 'compatibleVehicles') {
                                                     return <td key={col.key} className="p-0 border-b border-gray-700"><input type="text" value={Array.isArray(item.compatibleVehicles) ? item.compatibleVehicles.join(', ') : ''} onChange={e => handleItemChange(index, 'compatibleVehicles', e.target.value.split(',').map(s=>s.trim()))} className={inputClasses} /></td>
                                                }
                                                return <td key={col.key} className="p-0 border-b border-gray-700">
                                                    <input type={['quantity', 'unitPrice', 'total'].includes(col.key) ? 'number' : 'text'} value={item[col.key] || ''} onChange={e => handleItemChange(index, col.key, e.target.value)} className={inputClasses} />
                                                </td>
                                            })}
                                            <td className="p-0 border-b border-gray-700 text-center"><button onClick={()=>setItems(p=>p.filter((_,i)=>i!==index))} className="p-1 text-red-500"><Trash2 size={14}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {isProductModalOpen && <ProductSelectionModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSelect={handleSelectProduct} />}
        </div>
    );
};

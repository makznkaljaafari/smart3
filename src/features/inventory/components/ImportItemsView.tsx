
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, UploadCloud, Loader, ArrowLeft, CheckCircle, AlertTriangle, ArrowRight, Settings, Trash2, Edit3, RefreshCw, Zap, Filter, Layers } from 'lucide-react';
import { extractInventoryItemsFromFile, mapCsvHeadersToSchema } from '../api/inventoryAiService';
import { inventoryService } from '../../../services/inventoryService';
import { useResizableColumns } from '../../../hooks/useResizableColumns';
import { ROUTES } from '../../../constants/routes';
import { Select } from '../../../components/ui/Select';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { Tooltip } from '../../../components/ui/Tooltip';

const fileToB64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

// Robust CSV Parser
const analyzeCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [], delimiter: ',' };

    // Detect delimiter
    const sample = lines.slice(0, 5).join('\n');
    const commaCount = (sample.match(/,/g) || []).length;
    const semicolonCount = (sample.match(/;/g) || []).length;
    const tabCount = (sample.match(/\t/g) || []).length;
    
    let delimiter = ',';
    if (semicolonCount > commaCount && semicolonCount > tabCount) delimiter = ';';
    else if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';

    // Find header row
    let headerIndex = 0;
    for(let i=0; i<Math.min(lines.length, 20); i++) {
        const lowerLine = lines[i].toLowerCase();
        if (lowerLine.includes('sku') || lowerLine.includes('name') || lowerLine.includes('price') || lowerLine.startsWith('#') || lowerLine.includes('code') || lowerLine.includes('item')) {
             headerIndex = i;
             break;
        }
    }
    
    // Robust Split function
    const splitLine = (line: string) => {
        const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^${delimiter}]*))`, 'g');
        const matches = [];
        let match;
        while ((match = regex.exec(line))) {
            matches.push(match[1] ? match[1].replace(/""/g, '"') : match[2]);
        }
        return matches;
    };

    // Fallback split if regex fails or simple split is preferred for speed on huge files
    const simpleSplit = (line: string) => line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));

    const headers = simpleSplit(lines[headerIndex]).map(h => h.replace(/^#/, '').trim());
    const rowLines = lines.slice(headerIndex + 1);

    const rows = rowLines.map(line => {
        const cols = simpleSplit(line);
        while(cols.length < headers.length) cols.push('');
        return cols.slice(0, headers.length);
    }).filter(row => row.some(c => c !== ''));

    return { headers, rows, delimiter };
};

const BATCH_SIZE = 200; 

const SYSTEM_FIELDS = [
    { key: 'sku', label: 'رمز المادة (SKU)', required: false, type: 'text' },
    { key: 'name', label: 'اسم المادة', required: true, type: 'text' },
    { key: 'nameAr', label: 'الاسم (عربي)', required: false, type: 'text' },
    { key: 'nameEn', label: 'الاسم (إنجليزي)', required: false, type: 'text' },
    { key: 'itemNumber', label: 'رقم المادة/القطعة', required: false, type: 'text' },
    { key: 'manufacturer', label: 'الشركة الصانعة', required: false, type: 'text' },
    { key: 'quantity', label: 'الكمية', required: false, type: 'number' },
    { key: 'costPrice', label: 'سعر الشراء', required: false, type: 'number' },
    { key: 'sellingPrice', label: 'سعر البيع', required: true, type: 'number' },
    { key: 'description', label: 'الوصف', required: false, type: 'text' },
    { key: 'size', label: 'المقاس', required: false, type: 'text' },
    { key: 'location', label: 'الموقع', required: false, type: 'text' },
];

// Helper to parse numbers safely
const safeParseFloat = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = val.toString().replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
};

export const ImportItemsView: React.FC = () => {
    const { theme, lang, settings, addToast, warehouses } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
        addToast: state.addToast,
        warehouses: state.warehouses
    }));
    const t = translations[lang];
    const isRTL = lang === 'ar';
    const isDark = theme === 'dark';
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'checking_duplicates' | 'saving'>('idle');
    const [progress, setProgress] = useState(0);
    const [errorLog, setErrorLog] = useState<string[]>([]);
    
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    
    const [finalItems, setFinalItems] = useState<any[]>([]);
    const [importMode, setImportMode] = useState<'skip' | 'update'>('skip');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [page, setPage] = useState(1);
    const previewPageSize = 50;
    const [existingItemsCount, setExistingItemsCount] = useState(0);

    // Bulk Edit State
    const [bulkField, setBulkField] = useState<string>('');
    const [bulkValue, setBulkValue] = useState<string>('');

    const [previewColumns, setPreviewColumns] = useState<{ key: string, label: string, width: number }[]>([]);
    const [columnWidths, handleMouseDown] = useResizableColumns(
        previewColumns.map(c => ({ key: c.key, initialWidth: c.width })),
        isRTL
    );

    // --- Validation Stats ---
    const validationStats = useMemo(() => {
        let missingName = 0;
        let missingPrice = 0;
        finalItems.forEach(item => {
            if (!item.name) missingName++;
            if (!item.sellingPrice || item.sellingPrice <= 0) missingPrice++;
        });
        return { missingName, missingPrice };
    }, [finalItems]);

    const handleFileChange = async (selectedFile: File | null) => {
        if (!selectedFile) return;
        setStatus('analyzing');

        const isCSV = selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.txt');
        
        try {
            if (isCSV) {
                const text = await selectedFile.text();
                const { headers, rows } = analyzeCSV(text);
                
                if (rows.length === 0) {
                    addToast({ message: 'لم يتم العثور على بيانات في الملف.', type: 'error' });
                    setStatus('idle');
                    return;
                }

                setCsvHeaders(headers);
                setCsvRows(rows);
                
                const suggestedMapping = await mapCsvHeadersToSchema(headers);
                if (suggestedMapping) {
                    setMapping(suggestedMapping);
                }
                
                setStep(2);
            } else {
                // AI fallback for images/PDF
                const b64 = await fileToB64(selectedFile);
                const result = await extractInventoryItemsFromFile(b64, selectedFile.type);
                if (result && result.items) {
                    setFinalItems(result.items);
                    const cols = Object.keys(result.items[0] || {}).map(k => ({ 
                        key: k, 
                        label: SYSTEM_FIELDS.find(f => f.key === k)?.label || k, 
                        width: 120 
                    }));
                    setPreviewColumns(cols);
                    setStep(3);
                } else {
                    throw new Error("Failed to extract data from image");
                }
            }
        } catch (e: any) {
            console.error(e);
            addToast({ message: 'خطأ في قراءة الملف: ' + e.message, type: 'error' });
        } finally {
            setStatus('idle');
        }
    };

    const confirmMapping = async () => {
        setStatus('checking_duplicates');
        
        const mappedItems = csvRows.map((row, index) => {
            const item: any = { _id: index };
            Object.entries(mapping).forEach(([sysKey, headerName]) => {
                const colIndex = csvHeaders.indexOf(headerName);
                if (colIndex !== -1) {
                    item[sysKey] = row[colIndex];
                }
            });
            
            // Cleanup and Defaults
            if (!item.name) item.name = item.nameAr || item.nameEn || item.description || 'Unknown Item';
            item.quantity = safeParseFloat(item.quantity);
            item.costPrice = safeParseFloat(item.costPrice);
            item.sellingPrice = safeParseFloat(item.sellingPrice);
            
            return item;
        });

        // Filter out completely empty rows
        const validItems = mappedItems.filter(i => i.name !== 'Unknown Item' || i.sku);
        
        // Check Duplicates
        const skus = validItems.map(i => i.sku).filter(Boolean);
        try {
            const { data: existingMap } = await inventoryService.checkExistingProducts(skus);
            
            let existCount = 0;
            const checkedItems = validItems.map(item => {
                const existing = existingMap ? existingMap[item.sku] : null;
                if (existing) {
                    existCount++;
                    return { 
                        ...item, 
                        isExisting: true, 
                        existingId: existing.id,
                        existingName: existing.name,
                    };
                }
                return { ...item, isExisting: false };
            });
            
            setFinalItems(checkedItems);
            setExistingItemsCount(existCount);
            
        } catch (e) {
            console.error("Check failed", e);
            setFinalItems(validItems);
        } finally {
            setStatus('idle');
        }
        
        const cols = SYSTEM_FIELDS.map(f => ({
            key: f.key,
            label: f.label,
            width: 150
        }));
        
        // Add warehouse column if not mapped
        if (!mapping['warehouseId']) {
             cols.push({ key: 'warehouseId', label: 'المستودع (تلقائي)', width: 150 });
             const defaultWid = warehouses.length > 0 ? warehouses[0].id : '';
             setFinalItems(prev => prev.map(i => ({ ...i, warehouseId: defaultWid })));
        }

        setPreviewColumns(cols);
        setStep(3);
    };

    const handleUpdateItem = useCallback((index: number, key: string, value: string) => {
        setFinalItems(prevItems => {
            const newItems = [...prevItems];
            newItems[index] = { ...newItems[index], [key]: value };
            return newItems;
        });
    }, []);
    
    const handleBulkEdit = (applyToAll: boolean) => {
        if (!bulkField) return;
        
        setFinalItems(prevItems => prevItems.map(item => {
             if (applyToAll || !item[bulkField]) {
                 return { ...item, [bulkField]: bulkValue };
             }
             return item;
        }));
        
        addToast({ message: 'تم تطبيق التعديل الجماعي.', type: 'success' });
    };

    const handleSave = async () => {
        // Filter items based on mode
        const itemsToProcess = finalItems.filter(item => {
            if (importMode === 'skip' && item.isExisting) return false;
            return true;
        });

        if (itemsToProcess.length === 0) {
             addToast({ message: 'لا توجد مواد للمعالجة بناءً على الخيارات المحددة.', type: 'warning' });
             return;
        }

        setStatus('saving');
        setProgress(0);
        setErrorLog([]);
        
        let successCount = 0;
        let failCount = 0;
        
        try {
            for (let i = 0; i < itemsToProcess.length; i += BATCH_SIZE) {
                const batch = itemsToProcess.slice(i, i + BATCH_SIZE);
                
                const productsToSave = batch.map(item => ({
                    // If updating, pass ID if available (logic in service will handle by SKU usually, but safer to check)
                    // However, our service uses SKU for upsert usually.
                    name: item.name,
                    sku: item.sku || `Gen-${Date.now()}-${Math.floor(Math.random()*100000)}`,
                    itemNumber: item.itemNumber,
                    manufacturer: item.manufacturer,
                    description: item.description,
                    costPrice: safeParseFloat(item.costPrice),
                    sellingPrice: safeParseFloat(item.sellingPrice),
                    nameAr: item.nameAr,
                    nameEn: item.nameEn,
                    size: item.size,
                    currency: settings.baseCurrency,
                    location: item.location,
                    compatibleVehicles: Array.isArray(item.compatibleVehicles) ? item.compatibleVehicles : [],
                    alternativePartNumbers: Array.isArray(item.alternativePartNumbers) ? item.alternativePartNumbers : []
                }));

                try {
                    const { data: savedProducts, error } = await inventoryService.saveProductsBulk(productsToSave);
                    
                    if (error) throw error;
                    
                    successCount += batch.length;

                    // Handle Stock Initialization for New Items
                    if (savedProducts) {
                         const movements: any[] = [];
                         
                         savedProducts.forEach((p: any, idx: number) => {
                             const originalItem = batch[idx];
                             const qty = safeParseFloat(originalItem.quantity);
                             const whId = originalItem.warehouseId || warehouses[0]?.id;
                             
                             // Only add stock if qty > 0 AND we have a warehouse
                             if (qty > 0 && whId) {
                                 // For existing items in 'update' mode, we might want to adjust or set absolute.
                                 // Currently this adds adjustment. A proper stocktake logic is better for setting exact values.
                                 // Here we assume 'quantity' in CSV implies initial stock for new items, or addition for existing.
                                 movements.push({
                                    productId: p.id,
                                    warehouseId: whId,
                                    quantityChange: qty,
                                    movementType: 'adjustment',
                                    referenceType: 'import',
                                    notes: 'Bulk Import'
                                 });
                             }
                         });
                         
                         if (movements.length > 0) {
                             await inventoryService.recordBatchMovements(movements);
                         }
                    }

                } catch (err: any) {
                    console.error("Batch error", err);
                    failCount += batch.length;
                    setErrorLog(prev => [...prev, `Batch error: ${err.message}`]);
                }

                setProgress(Math.round(((i + batch.length) / itemsToProcess.length) * 100));
                await new Promise(resolve => setTimeout(resolve, 20));
            }
            
            if (successCount > 0) addToast({ message: `تمت العملية لـ ${successCount} مادة بنجاح.`, type: 'success' });
            if (failCount > 0) addToast({ message: `فشلت ${failCount} عملية.`, type: 'warning' });
            
            if (failCount === 0) setTimeout(() => navigate(ROUTES.INVENTORY), 1500);

        } catch (e: any) {
            addToast({ message: `خطأ: ${e.message}`, type: 'error' });
        } finally {
            setStatus('idle');
        }
    };

    const renderUploadStep = () => (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className={`w-full max-w-2xl border-2 border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-6 transition-colors ${isDark ? 'border-gray-700 bg-gray-900/50 hover:bg-gray-900' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFileChange(e.dataTransfer.files[0]); }}
            >
                <UploadCloud size={48} className="text-cyan-500" />
                <div>
                    <h3 className="text-xl font-bold mb-2">رفع ملف المواد</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        يدعم ملفات CSV كبيرة الحجم (3000+ مادة). سيتم معالجة البيانات محلياً لضمان السرعة والخصوصية.
                    </p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.txt,image/*,application/pdf" onChange={e => handleFileChange(e.target.files?.[0] || null)} />
                <HoloButton variant="primary" onClick={() => fileInputRef.current?.click()} disabled={status === 'analyzing'}>
                    {status === 'analyzing' ? <Loader className="animate-spin" /> : 'اختيار ملف'}
                </HoloButton>
            </div>
        </div>
    );

    const renderMappingStep = () => (
        <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full p-4">
             <div className={`p-6 rounded-xl border mb-6 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings className="text-cyan-400" /> مطابقة الأعمدة ({csvRows.length} صف)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {SYSTEM_FIELDS.map(field => {
                        const mappedHeader = mapping[field.key] || '';
                        return (
                            <div key={field.key} className={`p-3 rounded-lg border flex items-center justify-between ${!!mappedHeader ? (isDark ? 'bg-green-900/10 border-green-500/30' : 'bg-green-50 border-green-200') : (isDark ? 'border-gray-700' : 'border-slate-200')}`}>
                                <div className="flex items-center gap-2">
                                    {!!mappedHeader ? <CheckCircle size={16} className="text-green-500"/> : <AlertTriangle size={16} className="text-gray-400"/>}
                                    <Label className="mb-0">{field.label} {field.required && <span className="text-red-400">*</span>}</Label>
                                </div>
                                <select value={mappedHeader} onChange={(e) => setMapping(prev => ({...prev, [field.key]: e.target.value}))} className={`p-2 rounded text-sm w-48 ${isDark ? 'bg-gray-900 border-gray-600' : 'bg-white border-slate-300'}`}>
                                    <option value="">(تجاهل)</option>
                                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="flex justify-between">
                <HoloButton variant="secondary" onClick={() => setStep(1)}>إلغاء</HoloButton>
                <HoloButton variant="primary" onClick={confirmMapping} icon={status === 'checking_duplicates' ? Loader : ArrowRight} disabled={status === 'checking_duplicates'}>
                    {status === 'checking_duplicates' ? 'جاري التحقق...' : 'معاينة البيانات'}
                </HoloButton>
            </div>
        </div>
    );

    const renderPreviewStep = () => {
        const startIdx = (page - 1) * previewPageSize;
        const currentData = finalItems.slice(startIdx, startIdx + previewPageSize);
        const totalPages = Math.ceil(finalItems.length / previewPageSize);

        return (
             <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                {/* Header & Controls */}
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                         {/* Stats */}
                         <div className={`flex gap-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"/> {finalItems.length} مادة</div>
                            {existingItemsCount > 0 && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"/> {existingItemsCount} مكرر</div>}
                            {validationStats.missingPrice > 0 && <div className="flex items-center gap-2 text-red-400 font-bold"><AlertTriangle size={14}/> {validationStats.missingPrice} بدون سعر</div>}
                         </div>
                    </div>

                    {/* Mode Selection */}
                    <div className={`flex items-center gap-2 p-1 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-300'}`}>
                         <span className="text-xs font-bold px-2 opacity-70">في حال التكرار:</span>
                         <button onClick={() => setImportMode('skip')} className={`px-3 py-1 text-xs rounded transition-colors ${importMode === 'skip' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-gray-700'}`}>تجاهل</button>
                         <button onClick={() => setImportMode('update')} className={`px-3 py-1 text-xs rounded transition-colors ${importMode === 'update' ? 'bg-blue-500 text-white font-bold' : 'hover:bg-gray-700'}`}>تحديث</button>
                    </div>
                </div>

                {/* Bulk Edit Toolbar */}
                <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-3 ${isDark ? 'bg-gray-800/80 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'}`}>
                    <div className="flex items-center gap-2">
                        <Zap size={16} className="text-cyan-400" />
                        <span className="text-sm font-bold">تعديل جماعي:</span>
                    </div>
                    <select value={bulkField} onChange={(e) => setBulkField(e.target.value)} className={`p-2 rounded text-sm ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-300'}`}>
                        <option value="">اختر عمود...</option>
                        {previewColumns.map(col => <option key={col.key} value={col.key}>{col.label}</option>)}
                        <option value="warehouseId">المستودع</option>
                    </select>
                    {bulkField === 'warehouseId' ? (
                         <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className={`p-2 rounded text-sm w-40 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-300'}`}>
                            <option value="">اختر...</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                         </select>
                    ) : (
                        <input type="text" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="القيمة الجديدة" className={`p-2 rounded text-sm w-40 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-300'}`} />
                    )}
                    <div className="h-6 w-px bg-gray-600 mx-2"></div>
                    <button onClick={() => handleBulkEdit(true)} className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded transition-colors">تطبيق على الكل</button>
                    <button onClick={() => handleBulkEdit(false)} className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded transition-colors">تطبيق على الفارغ فقط</button>
                </div>
                
                {errorLog.length > 0 && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg max-h-32 overflow-y-auto text-xs text-red-400 font-mono">
                        {errorLog.map((err, i) => <div key={i}>{err}</div>)}
                    </div>
                )}

                {/* Table */}
                <div className={`flex-1 overflow-auto rounded-xl border ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <table className="w-full text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
                         <colgroup>
                             <col style={{ width: '40px' }} />
                             <col style={{ width: '50px' }} />
                             {previewColumns.map(col => <col key={col.key} style={{ width: `${columnWidths[col.key] || col.width}px` }} />)}
                             <col style={{ width: '50px' }} />
                        </colgroup>
                        <thead className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-slate-100 text-slate-700'}`}>
                            <tr>
                                <th className="p-3 border-b border-gray-600 text-center"></th>
                                <th className="p-3 border-b border-gray-600 text-center">#</th>
                                {previewColumns.map(col => (
                                    <th key={col.key} className="p-3 border-b border-gray-600 text-right relative group">
                                        <div className="flex items-center gap-1">
                                            {col.label}
                                            <Edit3 size={10} className="opacity-50"/>
                                        </div>
                                        <div onMouseDown={(e) => handleMouseDown(col.key, e)} className="absolute top-0 left-0 h-full w-1 cursor-col-resize hover:bg-cyan-500" />
                                    </th>
                                ))}
                                <th className="p-3 border-b border-gray-600"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((item, idx) => {
                                const realIndex = startIdx + idx;
                                const isDup = item.isExisting;
                                // Highlight logic
                                const rowBg = isDup 
                                    ? (importMode === 'skip' ? 'bg-red-500/10 opacity-50' : 'bg-blue-500/10') 
                                    : '';
                                const isValid = item.name && item.sellingPrice > 0;

                                return (
                                    <tr key={realIndex} className={`border-b group ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-slate-100 hover:bg-slate-50'} ${rowBg}`}>
                                        <td className="p-2 text-center">
                                            {isDup && (
                                                <Tooltip content={`موجود مسبقاً: ${item.existingName || ''}`}>
                                                    <RefreshCw size={14} className={importMode === 'skip' ? 'text-red-400' : 'text-blue-400'} />
                                                </Tooltip>
                                            )}
                                            {!isValid && !isDup && <AlertTriangle size={14} className="text-red-500 mx-auto" />}
                                        </td>
                                        <td className="p-2 text-center text-gray-500">{realIndex + 1}</td>
                                        {previewColumns.map(col => {
                                            const isError = (col.key === 'name' && !item.name) || (col.key === 'sellingPrice' && (!item.sellingPrice || item.sellingPrice <= 0));
                                            return (
                                                <td key={col.key} className={`p-0 border-l ${isDark ? 'border-gray-700/50' : 'border-slate-200'} ${isError ? 'ring-1 ring-inset ring-red-500/50 bg-red-500/5' : ''}`}>
                                                    {col.key === 'warehouseId' ? (
                                                        <select 
                                                            value={item.warehouseId || ''} 
                                                            onChange={(e) => handleUpdateItem(realIndex, col.key, e.target.value)} 
                                                            className="w-full h-full p-2 bg-transparent outline-none text-xs"
                                                        >
                                                            <option value="">اختر...</option>
                                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                        </select>
                                                    ) : (
                                                        <input 
                                                            type="text" 
                                                            value={item[col.key] || ''} 
                                                            onChange={(e) => handleUpdateItem(realIndex, col.key, e.target.value)}
                                                            className={`w-full h-full p-2 bg-transparent outline-none focus:bg-cyan-500/10 focus:shadow-inner text-right ${isDark ? 'text-white' : 'text-gray-900'} ${isDup && col.key === 'sku' ? 'font-bold' : ''}`}
                                                        />
                                                    )}
                                                </td>
                                            )
                                        })}
                                        <td className="p-2 text-center">
                                            <button onClick={() => setFinalItems(p => p.filter((_, i) => i !== realIndex))} className="text-red-500 hover:bg-red-500/10 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer Pagination & Action */}
                <div className="flex justify-between items-center pt-2">
                     <div className="flex items-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50 text-xs">السابق</button>
                        <span className="font-mono text-xs">{page} / {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50 text-xs">التالي</button>
                    </div>
                    
                    <HoloButton variant="success" icon={status === 'saving' ? Loader : Save} onClick={handleSave} disabled={status === 'saving' || (validationStats.missingName > 0)}>
                        {status === 'saving' ? `جاري الحفظ ${progress}%` : `حفظ (${finalItems.length})`}
                    </HoloButton>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
             <div className={`p-4 border-b flex items-center gap-4 ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
                <HoloButton variant="secondary" icon={ArrowLeft} onClick={() => navigate(ROUTES.INVENTORY)}>{t.back}</HoloButton>
                <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>استيراد مواد (معالج الاستيراد الذكي)</h2>
                    <div className="flex gap-2 mt-1">
                        {[1, 2, 3].map(s => (
                             <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${step >= s ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                {s}. {s === 1 ? 'رفع الملف' : s === 2 ? 'مطابقة الأعمدة' : 'مراجعة وحفظ'}
                             </span>
                        ))}
                    </div>
                </div>
            </div>
            {step === 1 && renderUploadStep()}
            {step === 2 && renderMappingStep()}
            {step === 3 && renderPreviewStep()}
        </div>
    );
};

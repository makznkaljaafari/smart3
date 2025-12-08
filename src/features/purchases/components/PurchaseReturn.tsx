
import React, { useState, useMemo, useCallback } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { SectionBox } from '../../../components/ui/SectionBox';
import { translations } from '../../../lib/i18n';
import { Input } from '../../../components/ui/Input';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Search, Loader, ServerCrash, Save, Trash2 } from 'lucide-react';
import { purchaseService } from '../../../services/purchaseService';
import { PurchaseInvoice, PurchaseInvoiceItem } from '../types';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { formatCurrency } from '../../../lib/formatters';
import { useQueryClient } from '@tanstack/react-query';

interface ReturnItem extends PurchaseInvoiceItem {
    returnQuantity: number;
    warehouseId: string;
}

export const PurchaseReturn: React.FC = () => {
    const { theme, lang, settings, addToast, warehouses } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
        addToast: state.addToast,
        warehouses: state.warehouses,
    }));
    const t = translations[lang];
    const queryClient = useQueryClient();

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [originalInvoice, setOriginalInvoice] = useState<PurchaseInvoice | null>(null);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [refundMethod, setRefundMethod] = useState<'cash' | 'credit_note' | 'bank_transfer' | 'exchange'>('credit_note');

    const handleFindInvoice = async () => {
        if (!invoiceNumber.trim()) return;
        setIsLoading(true);
        setError(null);
        setOriginalInvoice(null);
        setReturnItems([]);

        const { data, error: fetchError } = await purchaseService.getPurchaseByInvoiceNumber(invoiceNumber.trim());

        if (fetchError || !data) {
            setError(t.invoiceNotFound);
        } else {
            setOriginalInvoice(data as PurchaseInvoice);
            setReturnItems((data.items || []).map(item => ({ ...item, returnQuantity: 0, warehouseId: '' })));
        }
        setIsLoading(false);
    };

    const handleReturnQuantityChange = (productId: string, quantity: number) => {
        setReturnItems(prev => prev.map(item => {
            if (item.productId === productId) {
                const originalItem = originalInvoice?.items.find(i => i.productId === productId);
                const maxQuantity = originalItem?.quantity || 0;
                return { ...item, returnQuantity: Math.max(0, Math.min(quantity, maxQuantity)) };
            }
            return item;
        }));
    };

    const handleItemChange = (productId: string, field: 'warehouseId', value: string) => {
        setReturnItems(prev => prev.map(item => {
            if (item.productId === productId) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const totalReturnValue = useMemo(() => {
        return returnItems.reduce((total, item) => total + (item.returnQuantity * item.unitPrice), 0);
    }, [returnItems]);

    const handleSaveReturn = async () => {
        if (!originalInvoice || returnItems.every(i => i.returnQuantity === 0)) {
            addToast({ message: 'الرجاء تحديد كمية الإرجاع لمادة واحدة على الأقل.', type: 'error' });
            return;
        }
        if (returnItems.some(i => i.returnQuantity > 0 && !i.warehouseId)) {
            addToast({ message: 'الرجاء تحديد مستودع الإرجاع لجميع المواد المرتجعة.', type: 'error' });
            return;
        }

        setIsSaving(true);
        const { error: saveError } = await purchaseService.createPurchaseReturn({
            originalPurchaseId: originalInvoice.id,
            returnDate: returnDate,
            notes: notes,
            refundMethod: refundMethod as any,
            items: returnItems.filter(i => i.returnQuantity > 0).map(i => ({
                product_id: i.productId,
                warehouse_id: i.warehouseId,
                quantity: i.returnQuantity,
                price: i.unitPrice,
            })),
        });

        if (saveError) {
            addToast({ message: `فشل حفظ المرتجع: ${saveError.message}`, type: 'error' });
        } else {
            addToast({ message: 'تم حفظ مرتجع الشراء بنجاح!', type: 'success' });
            // Reset form
            setInvoiceNumber('');
            setOriginalInvoice(null);
            setReturnItems([]);
            // Refetch data
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
            queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
            // queryClient.invalidateQueries({ queryKey: ['purchaseReturns'] }); // If list exists
        }
        setIsSaving(false);
    };
    
    const tableHeaderClasses = `p-2 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`;

    return (
        <SectionBox title={t.purchaseReturn} theme={theme}>
            <div className="space-y-6">
                {/* Invoice Search */}
                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <Label>{t.searchOriginalInvoice}</Label>
                        <Input 
                            icon={Search} 
                            placeholder="أدخل رقم فاتورة الشراء"
                            value={invoiceNumber}
                            onChange={e => setInvoiceNumber(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleFindInvoice()}
                        />
                    </div>
                    <HoloButton variant="primary" onClick={handleFindInvoice} disabled={isLoading}>
                        {isLoading ? <Loader size={18} className="animate-spin" /> : t.findInvoice}
                    </HoloButton>
                </div>

                {error && <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">{error}</div>}

                {/* Return Details */}
                {originalInvoice && (
                    <div className="space-y-4 pt-4 border-t border-gray-700">
                        <div>
                            <h4 className="font-bold">{t.originalInvoice}: #{originalInvoice.invoiceNumber}</h4>
                            <p className="text-sm text-gray-400">{t.supplierName}: {originalInvoice.supplierName} | {t.date}: {originalInvoice.date}</p>
                        </div>

                        <div>
                            <h4 className="font-bold mb-2">{t.itemToReturn}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm responsive-table">
                                    <thead>
                                        <tr>
                                            <th className={`${tableHeaderClasses} text-right`}>{t.product}</th>
                                            <th className={`${tableHeaderClasses} text-center`}>{t.originalQuantity}</th>
                                            <th className={`${tableHeaderClasses} text-center w-40`}>مستودع الإرجاع</th>
                                            <th className={`${tableHeaderClasses} text-center w-32`}>{t.returnQuantity}</th>
                                            <th className={`${tableHeaderClasses} text-right`}>{t.unitPrice}</th>
                                            <th className={`${tableHeaderClasses} text-right`}>{t.returnTotal}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnItems.map(item => (
                                            <tr key={item.productId}>
                                                <td className="p-1" data-label={t.product}>{item.productName}</td>
                                                <td className="p-1 text-center" data-label={t.originalQuantity}>{originalInvoice.items.find(i => i.productId === item.productId)?.quantity || 0}</td>
                                                <td className="p-1" data-label="مستودع الإرجاع">
                                                    <Select value={item.warehouseId} onChange={e => handleItemChange(item.productId, 'warehouseId', e.target.value)} className="!py-1 !px-2">
                                                        <option value="">اختر مستودع...</option>
                                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                    </Select>
                                                </td>
                                                <td className="p-1" data-label={t.returnQuantity}><Input type="number" value={item.returnQuantity} onChange={e => handleReturnQuantityChange(item.productId, Number(e.target.value))} className="text-center !p-1" /></td>
                                                <td className="p-1 text-right font-mono" data-label={t.unitPrice}>{formatCurrency(item.unitPrice, settings.baseCurrency)}</td>
                                                <td className="p-1 text-right font-mono" data-label={t.returnTotal}>{formatCurrency(item.returnQuantity * item.unitPrice, settings.baseCurrency)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-700">
                             <div>
                                <Label>{t.returnDate}</Label>
                                <Input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                                <Label className="mt-4">{t.notes}</Label>
                                <Input value={notes} onChange={e => setNotes(e.target.value)} />
                             </div>
                             <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
                                <h4 className="font-semibold mb-2">{t.refundDetails}</h4>
                                <div className="mb-4">
                                    <Label>{t.refundMethod}</Label>
                                    <Select value={refundMethod} onChange={e => setRefundMethod(e.target.value as any)}>
                                        <option value="credit_note">إشعار دائن (رصيد لدى المورد)</option>
                                        <option value="cash">نقداً</option>
                                        <option value="bank_transfer">تحويل بنكي</option>
                                        <option value="exchange">صرافة</option>
                                    </Select>
                                </div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-bold">{t.totalReturnValue}</span>
                                    <span className="font-mono font-bold text-cyan-400">{formatCurrency(totalReturnValue, settings.baseCurrency)}</span>
                                </div>
                             </div>
                        </div>

                        <div className="flex justify-end">
                            <HoloButton variant="success" icon={Save} onClick={handleSaveReturn} disabled={isSaving}>
                                {isSaving ? 'جاري الحفظ...' : t.saveReturn}
                            </HoloButton>
                        </div>
                    </div>
                )}
            </div>
        </SectionBox>
    );
};

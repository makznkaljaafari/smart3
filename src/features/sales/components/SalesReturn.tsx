
import React, { useState } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Input } from '../../../components/ui/Input';
import { Search, RotateCw, Save, Loader, X, AlertTriangle } from 'lucide-react';
import { salesService } from '../../../services/salesService';
import { SalesInvoice, SalesReturnItem } from '../../sales/types';
import { formatCurrency } from '../../expenses/lib/utils';
import { Select } from '../../../components/ui/Select';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';

export const SalesReturn: React.FC = () => {
    const { lang, addToast, settings } = useZustandStore(state => ({
        lang: state.lang,
        addToast: state.addToast,
        settings: state.settings,
    }));
    const t = translations[lang];

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [originalInvoice, setOriginalInvoice] = useState<SalesInvoice | null>(null);
    const [returnItems, setReturnItems] = useState<SalesReturnItem[]>([]);
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [refundMethod, setRefundMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSearch = async () => {
        if (!invoiceNumber.trim()) return;
        setIsSearching(true);
        setOriginalInvoice(null);
        
        try {
            const { data, error } = await salesService.getSaleByInvoiceNumber(invoiceNumber);
            if (error || !data) {
                addToast({ message: t.invoiceNotFound || 'Invoice not found', type: 'error' });
            } else {
                setOriginalInvoice(data);
                // Initialize return items with 0 quantity
                setReturnItems(data.items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity, // Max returnable
                    returnQuantity: 0,
                    unitPrice: item.unitPrice,
                    total: 0
                })));
            }
        } catch (e) {
             addToast({ message: 'Error fetching invoice', type: 'error' });
        } finally {
            setIsSearching(false);
        }
    };

    const handleQuantityChange = (index: number, val: number) => {
        setReturnItems(prev => prev.map((item, i) => {
            if (i === index) {
                const newQty = Math.min(Math.max(0, val), item.quantity); // Ensure between 0 and original quantity
                return { 
                    ...item, 
                    returnQuantity: newQty,
                    total: newQty * item.unitPrice
                };
            }
            return item;
        }));
    };

    const totalReturnValue = returnItems.reduce((sum, item) => sum + item.total, 0);

    const handleSave = async () => {
        if (!originalInvoice) return;
        if (totalReturnValue <= 0) {
            addToast({ message: 'Please specify items to return.', type: 'error' });
            return;
        }

        setIsSaving(true);
        
        const returnData = {
            originalSaleId: originalInvoice.id,
            returnDate: returnDate,
            notes: notes,
            refundMethod: refundMethod as any,
            items: returnItems.filter(i => i.returnQuantity > 0).map(i => ({
                product_id: i.productId,
                quantity: i.returnQuantity,
                price: i.unitPrice,
            })),
        };

        const { error: serviceError } = await salesService.createSaleReturn(returnData);

        if (serviceError) {
            addToast({ message: `فشل حفظ المرتجع: ${serviceError.message}`, type: 'error' });
        } else {
            addToast({ message: 'تم حفظ مرتجع المبيع بنجاح!', type: 'success' });
            setOriginalInvoice(null);
            setInvoiceNumber('');
            setNotes('');
        }
        
        setIsSaving(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-xl border dark:border-gray-700 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                <RotateCw className="text-orange-400" /> {t.salesReturn}
            </h2>

            {/* Search Section */}
            <div className="flex gap-2 mb-6">
                <Input 
                    placeholder={t.searchOriginalSalesInvoice} 
                    value={invoiceNumber} 
                    onChange={e => setInvoiceNumber(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                />
                <HoloButton onClick={handleSearch} disabled={isSearching} variant="secondary">
                    {isSearching ? <Loader className="animate-spin" /> : <Search />}
                </HoloButton>
            </div>

            {originalInvoice && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                    {/* Invoice Info */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">{t.customer}</p>
                            <p className="font-bold text-lg dark:text-white">{originalInvoice.customerName}</p>
                            <p className="text-xs text-gray-400">{new Date(originalInvoice.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-gray-500">{t.originalInvoice}</p>
                             <p className="font-mono font-bold text-cyan-400">#{originalInvoice.invoiceNumber}</p>
                        </div>
                    </div>

                    {/* Return Items Table */}
                    <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-800">
                                <tr>
                                    <th className="p-3 text-left">{t.product}</th>
                                    <th className="p-3 text-center">{t.unitPrice}</th>
                                    <th className="p-3 text-center">{t.originalQuantity}</th>
                                    <th className="p-3 text-center text-orange-400">{t.returnQuantity}</th>
                                    <th className="p-3 text-right">{t.total}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {returnItems.map((item, idx) => (
                                    <tr key={idx} className="dark:text-gray-200">
                                        <td className="p-3">{item.productName}</td>
                                        <td className="p-3 text-center font-mono">{formatCurrency(item.unitPrice, originalInvoice.currency)}</td>
                                        <td className="p-3 text-center">{item.quantity}</td>
                                        <td className="p-3">
                                            <input 
                                                type="number" 
                                                value={item.returnQuantity} 
                                                onChange={e => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                                                className="w-20 p-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-orange-400 outline-none"
                                                min={0}
                                                max={item.quantity}
                                            />
                                        </td>
                                        <td className="p-3 text-right font-bold text-orange-400">{formatCurrency(item.total, originalInvoice.currency)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Return Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                             <div>
                                <Label>{t.returnDate}</Label>
                                <Input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                             </div>
                             <div>
                                <Label>{t.refundMethod}</Label>
                                <Select value={refundMethod} onChange={e => setRefundMethod(e.target.value)}>
                                    <option value="cash">نقد</option>
                                    <option value="credit_note">رصيد للعميل (Credit Note)</option>
                                    <option value="bank_transfer">تحويل بنكي</option>
                                </Select>
                             </div>
                             <div>
                                <Label>{t.notes}</Label>
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
                             </div>
                        </div>

                        <div className="p-6 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/30 flex flex-col justify-between">
                            <h4 className="font-bold text-orange-800 dark:text-orange-300">{t.refundDetails}</h4>
                            <div className="mt-4">
                                <p className="text-sm text-orange-600/80 dark:text-orange-300/80">{t.totalReturnValue}</p>
                                <p className="text-3xl font-black text-orange-500 font-mono mt-1">{formatCurrency(totalReturnValue, originalInvoice.currency)}</p>
                            </div>
                            <HoloButton onClick={handleSave} disabled={isSaving || totalReturnValue <= 0} variant="danger" icon={Save} className="mt-6 w-full justify-center">
                                {isSaving ? t.saving : t.saveReturn}
                            </HoloButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

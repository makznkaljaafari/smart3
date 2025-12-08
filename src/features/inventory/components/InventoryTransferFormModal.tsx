
import React, { useState, useMemo } from 'react';
import { Warehouse, Product, InventoryTransferItem, Toast } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Plus, Trash2, ArrowRight, Loader } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';

interface InventoryTransferFormModalProps {
    onClose: () => void;
    onSave: (data: { fromWarehouseId: string; toWarehouseId: string; transferDate: string; notes?: string; items: InventoryTransferItem[] }) => Promise<void>;
}

const WizardStepper: React.FC<{ currentStep: number; t: Record<string, string> }> = ({ currentStep, t }) => {
    const steps = [
        { num: 1, title: t.selectWarehouses },
        { num: 2, title: t.addItems },
        { num: 3, title: t.reviewAndConfirm },
    ];
    return (
        <div className="flex items-center w-full px-4">
            {steps.map((step, index) => (
                <React.Fragment key={step.num}>
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${currentStep >= step.num ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                            {step.num}
                        </div>
                        <p className={`text-xs mt-1 text-center ${currentStep >= step.num ? 'text-white' : 'text-gray-400'}`}>{step.title}</p>
                    </div>
                    {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 transition-colors ${currentStep > step.num ? 'bg-cyan-500' : 'bg-gray-700'}`}></div>}
                </React.Fragment>
            ))}
        </div>
    );
};

export const InventoryTransferFormModal: React.FC<InventoryTransferFormModalProps> = ({ onClose, onSave }) => {
    const { theme, lang, warehouses, products } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        warehouses: state.warehouses,
        products: state.products,
    }));
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 800, height: 750 } });
    const addToast = useZustandStore(state => state.addToast);

    const [step, setStep] = useState(1);
    const [fromWarehouseId, setFromWarehouseId] = useState('');
    const [toWarehouseId, setToWarehouseId] = useState('');
    const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<InventoryTransferItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const filteredProducts = useMemo(() => {
        if (!productSearch) return [];
        return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
            .filter(p => !items.some(item => item.productId === p.id));
    }, [productSearch, products, items]);

    const handleAddItem = (product: Product) => {
        setItems(prev => [...prev, { productId: product.id, productName: product.name, quantity: 1 }]);
        setProductSearch('');
    };
    
    const handleItemQuantityChange = (productId: string, quantity: number) => {
        setItems(prev => prev.map(item => item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item));
    };

    const handleRemoveItem = (productId: string) => {
        setItems(prev => prev.filter(item => item.productId !== productId));
    };

    const nextStep = () => {
        if (step === 1 && (!fromWarehouseId || !toWarehouseId)) {
            addToast({ message: t.mustSelectWarehouses, type: 'error' });
            return;
        }
        if (step === 1 && fromWarehouseId === toWarehouseId) {
            addToast({ message: t.warehousesCannotBeSame, type: 'error' });
            return;
        }
        if (step === 2 && items.length === 0) {
            addToast({ message: t.mustAddOneItem, type: 'error' });
            return;
        }
        if (step === 2 && items.some(i => i.quantity <= 0)) {
            addToast({ message: t.quantityMustBePositive, type: 'error' });
            return;
        }
        setStep(s => s + 1);
    };
    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await onSave({ fromWarehouseId, toWarehouseId, transferDate, notes, items });
        } finally {
            setIsSaving(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1: {
                return (
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">{t.selectWarehousesAndDate}</h4>
                        <div><Label>{t.fromWarehouse}</Label><Select value={fromWarehouseId} onChange={e=>setFromWarehouseId(e.target.value)}><option value="">{t.selectAnAccount}</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</Select></div>
                        <div><Label>{t.toWarehouse}</Label><Select value={toWarehouseId} onChange={e=>setToWarehouseId(e.target.value)}><option value="">{t.selectAnAccount}</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</Select></div>
                        <div><Label>{t.transferDate}</Label><Input type="date" value={transferDate} onChange={e=>setTransferDate(e.target.value)} /></div>
                    </div>
                );
            }
            case 2: {
                return (
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">{t.addItemsAndQuantities}</h4>
                        <div><Label>{t.addItemsToTransfer}</Label>
                            <div className="relative">
                               <Input type="text" placeholder={t.searchProduct} value={productSearch} onChange={e=>setProductSearch(e.target.value)}/>
                               {filteredProducts.length > 0 && (
                                   <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                                       {filteredProducts.map(p => <div key={p.id} onClick={()=>handleAddItem(p)} className="p-2 hover:bg-gray-700 cursor-pointer">{p.name} ({p.sku})</div>)}
                                   </div>
                               )}
                            </div>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                             {items.map(item => (
                                 <div key={item.productId} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                                     <span className="flex-1">{item.productName}</span>
                                     <Input type="number" value={item.quantity} onChange={e=>handleItemQuantityChange(item.productId, parseInt(e.target.value))} className="w-24 p-1 text-center"/>
                                     <button onClick={()=>handleRemoveItem(item.productId)} className="p-1 text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 size={16}/></button>
                                 </div>
                             ))}
                        </div>
                    </div>
                );
            }
            case 3: {
                const from = warehouses.find(w => w.id === fromWarehouseId)?.name;
                const to = warehouses.find(w => w.id === toWarehouseId)?.name;
                return (
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">{t.reviewAndConfirmTransfer}</h4>
                        <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                            <div className="flex justify-between items-center"><strong>{t.fromWarehouse}:</strong><span>{from}</span></div>
                            <div className="flex justify-between items-center"><strong>{t.toWarehouse}:</strong><span>{to}</span></div>
                            <div className="flex justify-between items-center"><strong>{t.transferDate}:</strong><span>{transferDate}</span></div>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {items.map(item => (
                                <div key={item.productId} className="flex justify-between p-2 bg-gray-800 rounded"><span>{item.productName}</span><span className="font-mono">{item.quantity}</span></div>
                            ))}
                        </div>
                        <div><Label>{t.notes}</Label><Input value={notes} onChange={e=>setNotes(e.target.value)} /></div>
                    </div>
                );
            }
            default:
                return null;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div ref={modalRef} style={{ ...position, ...size }} className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-cyan-500/50' : 'bg-white border'}`} onMouseDown={e => e.stopPropagation()}>
                <div ref={headerRef} onMouseDown={handleDragStart} className="p-4 border-b border-gray-700 cursor-move flex justify-between items-center">
                    <h3 className="text-xl font-bold">{t.createTransfer}</h3>
                    <button onClick={onClose}><X/></button>
                </div>

                <div className="p-4 border-b border-gray-700">
                    <WizardStepper currentStep={step} t={t} />
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {renderStepContent()}
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-between items-center">
                    <div>{step > 1 && <HoloButton variant="secondary" onClick={prevStep}>{t.back}</HoloButton>}</div>
                    <div>
                        {step < 3 && <HoloButton variant="primary" onClick={nextStep}>{t.next}</HoloButton>}
                        {step === 3 && (
                            <HoloButton icon={isSaving ? Loader : Save} variant="success" onClick={handleSubmit} disabled={isSaving}>
                                {isSaving ? 'جاري الحفظ...' : t.confirmTransfer}
                            </HoloButton>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

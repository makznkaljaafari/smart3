
import React, { useState } from 'react';
import { Vehicle, VINScanResult } from '../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Car, ScanLine, Loader, Gauge } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import { VinScannerModal } from './VinScannerModal';
import { CustomerSupplierSearch } from '../../invoices/components/CustomerSupplierSearch';
import { useZustandStore } from '../../../store/useStore';

interface VehicleFormModalProps {
    vehicle: Vehicle | null;
    onClose: () => void;
    onSave: (data: Partial<Vehicle>) => Promise<void>;
    t: any;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ vehicle, onClose, onSave, t }) => {
    const { theme } = useZustandStore();
    const { modalRef, headerRef, position, size, handleDragStart } = useDraggableAndResizable({ initialSize: { width: 800, height: 750 } });
    
    const [formData, setFormData] = useState<Partial<Vehicle>>(vehicle || {
        vin: '', make: '', model: '', year: new Date().getFullYear(), color: '', plateNumber: '', engineSize: '', currentMileage: 0
    });
    
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleScanSuccess = (result: VINScanResult) => {
        setFormData(prev => ({
            ...prev,
            vin: result.vin || prev.vin,
            make: result.make || prev.make,
            model: result.model || prev.model,
            year: result.year || prev.year,
            color: result.color || prev.color
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vin || isSaving) return;
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
                <div
                    ref={modalRef}
                    style={{ ...position, ...size }}
                    className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <div ref={headerRef} onMouseDown={handleDragStart} className="p-6 border-b border-gray-700 cursor-move flex justify-between items-center">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Car className="text-cyan-400" /> {vehicle ? 'تعديل بيانات السيارة' : 'إضافة سيارة جديدة'}
                        </h3>
                        <button onClick={onClose}><X /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* VIN Section with AI Scanner */}
                        <div className="p-4 bg-cyan-900/10 border border-cyan-500/30 rounded-xl">
                            <div className="flex justify-between items-end gap-4">
                                <div className="flex-1">
                                    <Label>رقم الهيكل (VIN) *</Label>
                                    <Input 
                                        value={formData.vin} 
                                        onChange={e => setFormData({...formData, vin: e.target.value.toUpperCase()})} 
                                        placeholder="17 characters"
                                        className="font-mono tracking-widest uppercase"
                                        maxLength={17}
                                        required
                                    />
                                </div>
                                <HoloButton type="button" variant="secondary" icon={ScanLine} onClick={() => setIsScannerOpen(true)} className="mb-[2px]">
                                    AI Scan
                                </HoloButton>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><Label>الشركة المصنعة</Label><Input value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} placeholder="Toyota" required /></div>
                            <div><Label>الموديل</Label><Input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="Camry" required /></div>
                            <div><Label>سنة الصنع</Label><Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} /></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>رقم اللوحة</Label><Input value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})} placeholder="ABC 1234" /></div>
                            <div><Label>اللون</Label><Input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} /></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>الممشى الحالي (كم)</Label>
                                <Input icon={Gauge} type="number" value={formData.currentMileage || ''} onChange={e => setFormData({...formData, currentMileage: parseInt(e.target.value)})} placeholder="Example: 120000" />
                            </div>
                             <div>
                                <Label>حجم المحرك</Label>
                                <Input value={formData.engineSize || ''} onChange={e => setFormData({...formData, engineSize: e.target.value})} placeholder="e.g. 2.5L V4" />
                            </div>
                        </div>

                        <div>
                            <Label>المالك (العميل)</Label>
                            <CustomerSupplierSearch 
                                type="customer" 
                                t={t}
                                initialName={formData.customerName}
                                onSelect={(c) => setFormData({...formData, customerId: c?.id, customerName: c?.name})} 
                            />
                        </div>

                        <div>
                            <Label>ملاحظات</Label>
                            <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} />
                        </div>
                    </form>

                    <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800">إلغاء</button>
                        <HoloButton variant="success" icon={isSaving ? Loader : Save} onClick={handleSubmit} disabled={isSaving}>
                            {isSaving ? 'جاري الحفظ...' : 'حفظ السيارة'}
                        </HoloButton>
                    </div>
                </div>
            </div>

            {isScannerOpen && (
                <VinScannerModal 
                    onClose={() => setIsScannerOpen(false)} 
                    onScanSuccess={handleScanSuccess} 
                />
            )}
        </>
    );
};

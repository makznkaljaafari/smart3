
import React, { useState, useMemo } from 'react';
import { Vehicle, MaintenancePrediction } from '../types';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Car, Gauge, Wrench, Brain, Loader, AlertTriangle, MessageSquare, History, FileText } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';
import { vehicleService } from '../../../services/vehicleService';
import { VehicleChat } from './VehicleChat';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../../../services/salesService';
import { formatCurrency } from '../../expenses/lib/utils';

interface VehicleDetailsModalProps {
    vehicle: Vehicle;
    onClose: () => void;
}

export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({ vehicle, onClose }) => {
    const { theme, lang, settings } = useZustandStore();
    const { modalRef, headerRef, position, size, handleDragStart } = useDraggableAndResizable({ initialSize: { width: 800, height: 700 } });
    
    const [activeTab, setActiveTab] = useState<'details' | 'maintenance' | 'history' | 'chat'>('details');
    const [maintenancePlan, setMaintenancePlan] = useState<MaintenancePrediction[] | null>(null);
    const [isPredicting, setIsPredicting] = useState(false);

    // Fetch Service History (Sales Invoices linked to this vehicle)
    const { data: serviceHistory, isLoading: historyLoading } = useQuery({
        queryKey: ['vehicleHistory', vehicle.id],
        queryFn: async () => {
             // Fetch all sales (or ideally filter by vehicle_id via API if supported)
             // For now, we fetch all (as per current API capabilities) and filter client side.
             // Optimized approach would be to update salesService to accept vehicleId filter.
             // Given the scope, we filter the existing getSalesPaginated result or fetch all if needed.
             const { data } = await salesService.getSalesPaginated({ pageSize: 1000 });
             return data.filter(s => s.vehicleId === vehicle.id);
        },
        enabled: activeTab === 'history'
    });

    const handlePredictMaintenance = async () => {
        setIsPredicting(true);
        const result = await vehicleService.predictMaintenance(vehicle, lang as 'ar' | 'en');
        setMaintenancePlan(result);
        setIsPredicting(false);
    };

    const isDark = theme === 'dark';
    const cardBg = isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200';

    return (
        <div className="fixed inset-0 bg-black/80 z-[60]" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${isDark ? 'bg-gray-900 border-cyan-500/30' : 'bg-white border-slate-200'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                {/* Header */}
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-5 border-b flex justify-between items-start cursor-move ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${isDark ? 'bg-gray-800 text-cyan-400' : 'bg-white text-cyan-600'}`}>
                            <Car />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{vehicle.make} {vehicle.model}</h2>
                            <p className="text-sm text-gray-500">{vehicle.year} • {vehicle.plateNumber || 'No Plate'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={24} /></button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b overflow-x-auto ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 px-4 whitespace-nowrap font-semibold border-b-2 transition-colors ${activeTab === 'details' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>معلومات المركبة</button>
                    <button onClick={() => setActiveTab('maintenance')} className={`flex-1 py-3 px-4 whitespace-nowrap font-semibold border-b-2 transition-colors ${activeTab === 'maintenance' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><span className="flex items-center justify-center gap-2"><Brain size={16}/> الصيانة الذكية</span></button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-4 whitespace-nowrap font-semibold border-b-2 transition-colors ${activeTab === 'history' ? 'border-orange-500 text-orange-400 bg-orange-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><span className="flex items-center justify-center gap-2"><History size={16}/> سجل الخدمة</span></button>
                    <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 px-4 whitespace-nowrap font-semibold border-b-2 transition-colors ${activeTab === 'chat' ? 'border-green-500 text-green-400 bg-green-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><span className="flex items-center justify-center gap-2"><MessageSquare size={16}/> مساعد السيارة</span></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-xl border ${cardBg}`}>
                                    <div className="flex items-center gap-2 text-gray-500 mb-1"><Car size={16}/> <span>المركبة</span></div>
                                    <p className="text-xl font-bold">{vehicle.make} {vehicle.model} {vehicle.year}</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${cardBg}`}>
                                    <div className="flex items-center gap-2 text-gray-500 mb-1"><Gauge size={16}/> <span>الممشى</span></div>
                                    <p className="text-xl font-bold font-mono">{vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : 'غير مسجل'}</p>
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl border ${cardBg}`}>
                                <h4 className="font-bold mb-3 text-cyan-400">تفاصيل إضافية</h4>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                                    <div className="flex justify-between border-b border-gray-700 pb-2">
                                        <span className="text-gray-500">رقم الهيكل (VIN)</span>
                                        <span className="font-mono select-all">{vehicle.vin}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-700 pb-2">
                                        <span className="text-gray-500">اللون</span>
                                        <span>{vehicle.color || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-700 pb-2">
                                        <span className="text-gray-500">حجم المحرك</span>
                                        <span>{vehicle.engineSize || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-700 pb-2">
                                        <span className="text-gray-500">المالك</span>
                                        <span>{vehicle.customerName || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {vehicle.notes && (
                                <div className={`p-4 rounded-xl border ${cardBg}`}>
                                    <h4 className="font-bold mb-2 text-gray-500 text-xs uppercase">ملاحظات</h4>
                                    <p className="text-sm">{vehicle.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'maintenance' && (
                        <div className="space-y-6">
                            {!maintenancePlan ? (
                                <div className="text-center py-10">
                                    <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Brain size={40} className="text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">تحليل الصيانة الذكي</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto mb-6">
                                        استخدم الذكاء الاصطناعي لتحليل حالة سيارتك بناءً على الموديل والممشى واقتراح الصيانة اللازمة.
                                    </p>
                                    <HoloButton variant="primary" onClick={handlePredictMaintenance} disabled={isPredicting}>
                                        {isPredicting ? <Loader className="animate-spin mr-2"/> : <Wrench className="mr-2"/>}
                                        {isPredicting ? 'جاري التحليل...' : 'توليد خطة الصيانة'}
                                    </HoloButton>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-lg flex items-center gap-2"><Brain size={18} className="text-purple-400"/> التوصيات المقترحة</h3>
                                        <button onClick={() => setMaintenancePlan(null)} className="text-xs text-gray-500 hover:text-white">إعادة التحليل</button>
                                    </div>
                                    {maintenancePlan.map((item, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl border flex gap-4 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200'}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.urgency === 'high' ? 'bg-red-500/20 text-red-400' : item.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-lg">{item.task}</h4>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${item.urgency === 'high' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}>{item.urgency}</span>
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                                                <div className="flex items-center gap-4 mt-3 text-xs font-mono">
                                                    <span className="text-cyan-400">التكلفة المتوقعة: {item.estimatedCostRange}</span>
                                                    <span className="text-purple-400">الإجراء: {item.recommendedAction}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-4">
                             {historyLoading ? <div className="text-center py-8 text-gray-500">جاري تحميل السجل...</div> : 
                              (!serviceHistory || serviceHistory.length === 0) ? (
                                 <div className="text-center py-12 text-gray-500 opacity-60">
                                     <History size={48} className="mx-auto mb-2"/>
                                     <p>لا يوجد سجل صيانة/مبيعات مسجل لهذه السيارة.</p>
                                 </div>
                             ) : (
                                 <div className="space-y-3">
                                     {serviceHistory.map(invoice => (
                                         <div key={invoice.id} className={`p-4 rounded-xl border flex justify-between items-center ${cardBg}`}>
                                             <div>
                                                 <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-white">#{invoice.invoiceNumber}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">{new Date(invoice.date).toLocaleDateString(lang)}</span>
                                                 </div>
                                                 <p className="text-sm text-gray-400">{invoice.items.map(i => i.productName).join(', ').substring(0, 50)}...</p>
                                             </div>
                                             <div className="text-right">
                                                 <p className="font-bold font-mono text-lg text-green-400">{formatCurrency(invoice.total, settings.baseCurrency)}</p>
                                                 <div className="text-xs flex justify-end gap-2">
                                                     <span className="text-gray-500">{invoice.status}</span>
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    )}
                    
                    {activeTab === 'chat' && (
                        <VehicleChat vehicle={vehicle} />
                    )}
                </div>
            </div>
        </div>
    );
};

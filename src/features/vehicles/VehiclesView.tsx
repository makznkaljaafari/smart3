
import React, { useState, useEffect } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { HoloButton } from '../../components/ui/HoloButton';
import { Input } from '../../components/ui/Input';
import { Plus, Search, Car, Eye, Edit2, Trash2, LayoutGrid, List } from 'lucide-react';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle } from './types';
import { VehicleFormModal } from './components/VehicleFormModal';
import { VehicleDetailsModal } from './components/VehicleDetailsModal';
import { VehicleCard } from './components/VehicleCard'; // New Import
import { DataTable } from '../../components/ui/DataTable';

export const VehiclesView: React.FC = () => {
    const { theme, lang, addToast } = useZustandStore();
    const t = translations[lang];
    const isDark = theme === 'dark';

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const fetchVehicles = async () => {
        setIsLoading(true);
        const { data, error } = await vehicleService.getVehicles(search);
        if (error) {
            addToast({ message: error.message, type: 'error' });
        } else {
            setVehicles(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(fetchVehicles, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSave = async (data: Partial<Vehicle>) => {
        const isNew = !editingVehicle;
        const { error } = await vehicleService.saveVehicle(data, isNew);
        if (error) {
            addToast({ message: error.message, type: 'error' });
        } else {
            addToast({ message: isNew ? 'Vehicle added!' : 'Vehicle updated!', type: 'success' });
            setShowForm(false);
            fetchVehicles();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this vehicle?")) {
            await vehicleService.deleteVehicle(id);
            fetchVehicles();
        }
    };

    const columns = [
        { header: 'المركبة', className: 'text-right' },
        { header: 'رقم الهيكل (VIN)', className: 'text-center' },
        { header: 'اللوحة', className: 'text-center' },
        { header: 'المالك', className: 'text-right' },
        { header: 'الممشى', className: 'text-center' },
        { header: 'إجراءات', className: 'text-center' },
    ];

    const renderRow = (v: Vehicle, index: number) => (
        <tr key={v.id} className={`border-b transition-colors ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-slate-200 hover:bg-slate-50'}`}>
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 text-cyan-400' : 'bg-slate-100 text-cyan-600'}`}>
                        <Car size={20} />
                    </div>
                    <div>
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{v.make} {v.model}</p>
                        <p className="text-xs text-gray-500">{v.year} • {v.color}</p>
                    </div>
                </div>
            </td>
            <td className="p-4 text-center font-mono text-sm">{v.vin}</td>
            <td className="p-4 text-center font-bold bg-gray-100/10 rounded">{v.plateNumber || '-'}</td>
            <td className="p-4">{v.customerName || '-'}</td>
            <td className="p-4 text-center font-mono text-sm text-orange-400">{v.currentMileage ? v.currentMileage.toLocaleString() : '-'} km</td>
            <td className="p-4 text-center">
                <div className="flex justify-center gap-2">
                    <button onClick={() => setViewingVehicle(v)} className="p-2 hover:bg-gray-500/10 text-gray-400 rounded"><Eye size={16}/></button>
                    <button onClick={() => { setEditingVehicle(v); setShowForm(true); }} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(v.id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded"><Trash2 size={16}/></button>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>سجل السيارات</h1>
                    <p className="text-gray-500">إدارة أسطول السيارات والعملاء باستخدام الذكاء الاصطناعي.</p>
                </div>
                <HoloButton icon={Plus} variant="primary" onClick={() => { setEditingVehicle(null); setShowForm(true); }}>إضافة سيارة</HoloButton>
            </div>

            <div className={`p-4 rounded-2xl border bg-[rgb(var(--bg-secondary-rgb))] border-[rgb(var(--border-primary-rgb))] flex flex-col md:flex-row gap-4 items-center`}>
                <div className="relative flex-1 w-full">
                    <Input icon={Search} placeholder="بحث برقم الهيكل، اللوحة، أو العميل..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                 <div className={`rounded-lg p-1 flex items-center gap-1 ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-gray-400' : 'text-slate-500')}`}><LayoutGrid size={20} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-gray-400' : 'text-slate-500')}`}><List size={20} /></button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <DataTable 
                    data={vehicles} 
                    columns={columns} 
                    renderRow={renderRow} 
                    isLoading={isLoading}
                    emptyMessage="لا توجد سيارات مسجلة."
                    emptyIcon={Car}
                />
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map(v => (
                        <VehicleCard 
                            key={v.id} 
                            vehicle={v} 
                            theme={theme} 
                            onEdit={() => { setEditingVehicle(v); setShowForm(true); }}
                            onDelete={() => handleDelete(v.id)}
                            onViewDetails={() => setViewingVehicle(v)}
                        />
                    ))}
                    {vehicles.length === 0 && !isLoading && (
                        <div className="col-span-full text-center p-12 text-gray-500">لا توجد سيارات مسجلة.</div>
                    )}
                 </div>
            )}

            {showForm && (
                <VehicleFormModal 
                    vehicle={editingVehicle} 
                    onClose={() => setShowForm(false)} 
                    onSave={handleSave} 
                    t={t}
                />
            )}
            
            {viewingVehicle && (
                <VehicleDetailsModal
                    vehicle={viewingVehicle}
                    onClose={() => setViewingVehicle(null)}
                />
            )}
        </div>
    );
};

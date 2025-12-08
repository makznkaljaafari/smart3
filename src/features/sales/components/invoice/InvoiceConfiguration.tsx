
import React, { useMemo, useState, useEffect } from 'react';
import { useZustandStore } from '../../../../store/useStore';
import { translations, currencyLabels } from '../../../../lib/i18n';
import { CustomerSupplierSearch } from '../../../invoices/components/CustomerSupplierSearch';
import { Label } from '../../../../components/ui/Label';
import { Select } from '../../../../components/ui/Select';
import { Customer, CurrencyCode } from '../../../../types';
import { vehicleService } from '../../../../services/vehicleService';
import { Vehicle } from '../../../vehicles/types';
import { Car } from 'lucide-react';

interface InvoiceConfigurationProps {
    selectedCustomer: Customer | null;
    setSelectedCustomer: (customer: Customer | null) => void;
    selectedVehicleId?: string;
    setSelectedVehicleId?: (id: string) => void;
    warehouseId: string;
    setWarehouseId: (id: string) => void;
    currency: CurrencyCode;
    setCurrency: (currency: CurrencyCode) => void;
}

export const InvoiceConfiguration: React.FC<InvoiceConfigurationProps> = ({
    selectedCustomer,
    setSelectedCustomer,
    selectedVehicleId,
    setSelectedVehicleId,
    warehouseId,
    setWarehouseId,
    currency,
    setCurrency
}) => {
    const { lang, settings, warehouses } = useZustandStore();
    const t = translations[lang];
    const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);

    // Fetch vehicles when customer changes
    useEffect(() => {
        const fetchVehicles = async () => {
            if (selectedCustomer) {
                const { data } = await vehicleService.getVehiclesByCustomerId(selectedCustomer.id);
                setCustomerVehicles(data);
                // Auto-select if only one vehicle
                if (data.length === 1 && setSelectedVehicleId) {
                    setSelectedVehicleId(data[0].id);
                } else if (setSelectedVehicleId) {
                    setSelectedVehicleId('');
                }
            } else {
                setCustomerVehicles([]);
                if (setSelectedVehicleId) setSelectedVehicleId('');
            }
        };
        fetchVehicles();
    }, [selectedCustomer]);

    // Merge default and custom currencies for dropdown
    const allCurrencies = useMemo(() => {
        const builtIn: Record<string, { ar: string, en: string }> = { ...currencyLabels };
        const custom = settings.customCurrencies || [];
        custom.forEach(c => {
            builtIn[c.code] = { ar: c.nameAr, en: c.nameEn };
        });
        return builtIn;
    }, [settings.customCurrencies]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-1">
                <CustomerSupplierSearch 
                    type="customer" 
                    onSelect={(entity) => setSelectedCustomer(entity as Customer | null)} 
                    t={t} 
                />
            </div>
            
            {/* Vehicle Selection - Only show if customer is selected and has vehicles */}
            <div className="md:col-span-1">
                 <Label className="text-xs">المركبة (اختياري)</Label>
                 <div className="relative">
                    <Select 
                        value={selectedVehicleId || ''} 
                        onChange={e => setSelectedVehicleId && setSelectedVehicleId(e.target.value)} 
                        className="!p-2 h-[42px] text-sm pl-8"
                        disabled={!selectedCustomer}
                    >
                        <option value="">-- بدون مركبة --</option>
                        {customerVehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</option>
                        ))}
                    </Select>
                    <Car size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
                 </div>
            </div>

            <div>
                <Label className="text-xs">المستودع *</Label>
                <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} className="!p-2 h-[42px] text-sm">
                    {warehouses.length === 0 && <option value="">لا يوجد مستودعات</option>}
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </Select>
            </div>
             <div>
                <Label className="text-xs">العملة</Label>
                <Select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)} className="!p-2 h-[42px] text-sm">
                    {settings.enabledCurrencies.map(c => {
                        const label = allCurrencies[c] ? allCurrencies[c][lang] : c;
                        return <option key={c} value={c}>{label} ({c})</option>
                    })}
                </Select>
            </div>
        </div>
    );
};

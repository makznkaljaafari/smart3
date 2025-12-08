
import React, { useMemo } from 'react';
import { useZustandStore } from '../../../../store/useStore';
import { translations, currencyLabels } from '../../../../lib/i18n';
import { CustomerSupplierSearch } from '../../../invoices/components/CustomerSupplierSearch';
import { Label } from '../../../../components/ui/Label';
import { Select } from '../../../../components/ui/Select';
import { Supplier } from '../../../suppliers/types';
import { CurrencyCode } from '../../../../types';

interface PurchaseConfigurationProps {
    selectedSupplier: Supplier | null;
    setSelectedSupplier: (supplier: Supplier | null) => void;
    warehouseId: string;
    setWarehouseId: (id: string) => void;
    currency: CurrencyCode;
    setCurrency: (currency: CurrencyCode) => void;
}

export const PurchaseConfiguration: React.FC<PurchaseConfigurationProps> = ({
    setSelectedSupplier,
    warehouseId,
    setWarehouseId,
    currency,
    setCurrency
}) => {
    const { lang, settings, warehouses } = useZustandStore();
    const t = translations[lang];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
                <CustomerSupplierSearch 
                    type="supplier" 
                    onSelect={(entity) => setSelectedSupplier(entity as Supplier | null)} 
                    t={t} 
                />
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
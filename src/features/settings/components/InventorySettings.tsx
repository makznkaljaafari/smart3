
import React from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { Toggle } from '../../../components/ui/Toggle';
import { SettingsState, AppTheme } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { Select } from '../../../components/ui/Select';
import { Label } from '../../../components/ui/Label';

interface InventorySettingsProps {
  localSettings: SettingsState;
  setLocalSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  t: Record<string, string>;
  theme: AppTheme;
  lang: 'ar' | 'en';
}

export const InventorySettings: React.FC<InventorySettingsProps> = ({ localSettings, setLocalSettings, t, theme }) => {
  const { warehouses } = useZustandStore(state => ({ warehouses: state.warehouses }));

  const handleToggle = (key: keyof SettingsState['inventory'], value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [key]: value
      }
    }));
  };

  const handleWarehouseChange = (value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        defaultWarehouseId: value
      }
    }));
  };

  const settingOptions = [
    { key: 'allowNegativeStock', label: t.allowNegativeStock, description: t.allowNegativeStockDesc },
    { key: 'allowSellBelowCost', label: t.allowSellBelowCost, description: t.allowSellBelowCostDesc },
    { key: 'allowBackdatedSales', label: t.allowBackdatedSales, description: t.allowBackdatedSalesDesc },
  ];

  return (
    <SectionBox title={t.inventoryAndSalesSettings} theme={theme}>
      <div className="space-y-6">
        
        {/* Default Warehouse Selection */}
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
            <div className="mb-3">
                <p className="font-medium">{t.defaultWarehouse}</p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>{t.defaultWarehouseDesc}</p>
            </div>
            <Select 
                value={localSettings.inventory.defaultWarehouseId || ''} 
                onChange={e => handleWarehouseChange(e.target.value)}
            >
                <option value="">-- {t.selectWarehouse || 'اختر مستودع'} --</option>
                {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                ))}
            </Select>
        </div>

        {/* Toggles for settings */}
        {settingOptions.map(opt => (
          <div key={opt.key} className={`p-4 rounded-lg flex items-center justify-between ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
            <div>
              <p className="font-medium">{opt.label}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>{opt.description}</p>
            </div>
            <Toggle
              checked={(localSettings.inventory?.[opt.key as keyof SettingsState['inventory']] as boolean) || false}
              onChange={value => handleToggle(opt.key as keyof SettingsState['inventory'], value)}
            />
          </div>
        ))}
      </div>
    </SectionBox>
  );
};

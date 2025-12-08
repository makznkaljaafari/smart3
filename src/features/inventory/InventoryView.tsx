import React, { useState } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { Package, Warehouse, ArrowRightLeft, ClipboardList, PieChart } from 'lucide-react';
import { ItemsList } from './components/ItemsList';
import { Warehouses } from './components/Warehouses';
import { InventoryTransfers } from './components/InventoryTransfers';
import { Stocktakes } from './components/Stocktakes';
import { InventoryOverview } from './components/InventoryOverview';

type InventoryTab = 'overview' | 'items' | 'warehouses' | 'transfers' | 'stocktakes';

export const InventoryView: React.FC = () => {
    const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
    const t = translations[lang];

    const [activeTab, setActiveTab] = useState<InventoryTab>('overview');

    const tabs: { id: InventoryTab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: t.inventoryOverview, icon: PieChart },
        { id: 'items', label: t.itemsList, icon: Package },
        { id: 'warehouses', label: t.warehouses, icon: Warehouse },
        { id: 'transfers', label: t.stockTransfers, icon: ArrowRightLeft },
        { id: 'stocktakes', label: t.stocktake, icon: ClipboardList },
    ];
    
    const renderContent = () => {
        switch(activeTab) {
            case 'overview': return <InventoryOverview />;
            case 'items': return <ItemsList />;
            case 'warehouses': return <Warehouses />;
            case 'transfers': return <InventoryTransfers />;
            case 'stocktakes': return <Stocktakes />;
            default: return null;
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.inventory}</h1>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>{'إدارة المنتجات والمستودعات وعمليات الجرد'}</p>
            </div>
            
            <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'} flex items-stretch gap-2`}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors
                                ${isActive 
                                    ? 'border-cyan-500 text-cyan-400' 
                                    : `border-transparent ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                                }`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    )
                })}
            </div>
            
            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
};
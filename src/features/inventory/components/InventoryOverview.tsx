
import React, { useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { SciFiCard } from '../../../components/ui/SciFiCard';
import { SectionBox } from '../../../components/ui/SectionBox';
import { formatCurrency } from '../../expenses/lib/utils';
import { DollarSign, Package, AlertTriangle } from 'lucide-react';
import { DemandForecast } from './DemandForecast';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { TopStockedList } from './overview/TopStockedList';
import { RestockAlertsList } from './overview/RestockAlertsList';

export const InventoryOverview: React.FC = () => {
    const { products, inventoryLevels, theme, lang, settings } = useZustandStore(state => ({
        products: state.products,
        inventoryLevels: state.inventoryLevels,
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
    }));
    const t = translations[lang];

    const { data: statsData } = useQuery({
        queryKey: ['inventoryOverviewStats'],
        queryFn: inventoryService.getInventoryOverviewStats
    });
    
    const overviewStats = statsData?.data || { totalValue: 0, lowStockCount: 0, totalSku: 0 };

    const stockTotals = useMemo(() => {
        return inventoryLevels.reduce((acc, level) => {
            acc[level.productId] = (acc[level.productId] || 0) + level.quantity;
            return acc;
        }, {} as Record<string, number>);
    }, [inventoryLevels]);

    const topStockedItems = useMemo(() => {
        return Object.entries(stockTotals)
            .map(([productId, quantity]) => {
                const product = products.find(p => p.id === productId);
                return {
                    id: productId,
                    quantity: Number(quantity),
                    name: product?.name || 'Unknown',
                    sku: product?.sku || ''
                };
            })
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [stockTotals, products]);

    const maxStock = topStockedItems.length > 0 ? topStockedItems[0].quantity : 0;

    const itemsToRestock = useMemo(() => {
        return products
            .filter(p => {
                const qty = stockTotals[p.id] || 0;
                return p.reorderPoint && p.reorderPoint > 0 && qty <= p.reorderPoint;
            })
            .map(p => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                currentQty: stockTotals[p.id] || 0,
                reorderPoint: p.reorderPoint
            }))
            .sort((a, b) => (a.currentQty - (a.reorderPoint || 0)) - (b.currentQty - (b.reorderPoint || 0))) 
            .slice(0, 5);
    }, [products, stockTotals]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SciFiCard theme={theme} title={t.totalInventoryValue} value={formatCurrency(overviewStats.totalValue, settings.baseCurrency)} icon={DollarSign} color="green" />
                <SciFiCard theme={theme} title={t.totalItems} value={overviewStats.totalSku.toString()} icon={Package} color="cyan" />
                <SciFiCard theme={theme} title={t.itemsAtReorderPoint} value={overviewStats.lowStockCount.toString()} icon={AlertTriangle} color="orange" />
            </div>
            
            <SectionBox title={t.demandForecast} theme={theme}>
                <DemandForecast />
            </SectionBox>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionBox title={t.topStockedItems} theme={theme}>
                    <TopStockedList items={topStockedItems} maxStock={maxStock} theme={theme} t={t} />
                </SectionBox>

                <SectionBox title={t.itemsToRestock} theme={theme}>
                    <RestockAlertsList items={itemsToRestock} theme={theme} t={t} />
                </SectionBox>
            </div>
        </div>
    );
};

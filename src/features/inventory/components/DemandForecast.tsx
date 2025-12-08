
import React, { useState, useMemo, useCallback } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { LineChart } from '../../../components/charts/LineChart';
import { generateDemandForecast } from '../../../services/aiService';
import { Brain, Loader } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../../../services/salesService';

export const DemandForecast: React.FC = () => {
    const { products, theme, lang, currentCompany } = useZustandStore(state => ({
        products: state.products,
        theme: state.theme,
        lang: state.lang,
        currentCompany: state.currentCompany,
    }));
    const t = translations[lang];

    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forecastData, setForecastData] = useState<{ label: string, value: number }[] | null>(null);

    // Fetch sales for history
    const { data: salesData } = useQuery({
        queryKey: ['salesForForecast', currentCompany?.id],
        queryFn: () => salesService.getSalesPaginated({ pageSize: 1000 }), // Get recent 1000
        enabled: !!currentCompany?.id,
    });
    
    const sales = salesData?.data || [];

    const historicalData = useMemo(() => {
        if (!selectedProductId) return [];

        const data: { [month: string]: number } = {};
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleString(lang, { month: 'short', year: '2-digit' });
            data[monthKey] = 0;
        }

        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            const monthKey = saleDate.toLocaleString(lang, { month: 'short', year: '2-digit' });
            if (data.hasOwnProperty(monthKey)) {
                sale.items.forEach((item: any) => {
                    if (item.productId === selectedProductId) {
                        data[monthKey] += item.quantity;
                    }
                });
            }
        });

        return Object.entries(data).map(([label, value]) => ({ label, value }));
    }, [selectedProductId, sales, lang]);

    const handleGenerateForecast = useCallback(async () => {
        if (!selectedProductId) return;

        setIsLoading(true);
        setError(null);
        setForecastData(null);

        try {
            const result = await generateDemandForecast(selectedProductId, sales, lang);
            if (result) {
                setForecastData(result);
            } else {
                throw new Error(t.forecastError || 'Failed to generate forecast.');
            }
        } catch (e: any) {
            setError(e.message || t.forecastError);
        } finally {
            setIsLoading(false);
        }
    }, [selectedProductId, sales, lang, t.forecastError]);
    
    const selectClasses = `w-full rounded-lg p-2 border focus:ring-cyan-500 focus:border-cyan-500 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-slate-50 text-slate-900 border-slate-300'}`;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                    <label className="text-sm">{t.product}</label>
                    <select
                        value={selectedProductId}
                        onChange={e => {
                            setSelectedProductId(e.target.value);
                            setForecastData(null); // Reset forecast when product changes
                        }}
                        className={selectClasses}
                    >
                        <option value="">{t.selectAProduct || 'Select a Product'}</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <HoloButton
                    icon={isLoading ? Loader : Brain}
                    onClick={handleGenerateForecast}
                    disabled={!selectedProductId || isLoading}
                    className={isLoading ? 'animate-pulse' : ''}
                >
                    {isLoading ? (t.generatingForecast || 'Generating...') : (t.generateForecast || 'Generate Forecast')}
                </HoloButton>
            </div>

            {selectedProductId && (
                <div className="h-80">
                    <LineChart data={historicalData} forecastData={forecastData || []} />
                    <div className="flex justify-center items-center gap-6 mt-2 text-xs">
                        <div className="flex items-center gap-2"><span className="w-4 h-1 rounded-full bg-cyan-500"/> <span>{t.historicalSales || 'Historical Sales'}</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-1 border-t-2 border-dashed border-purple-500"/> <span>{t.forecastedDemand || 'Forecasted Demand'}</span></div>
                    </div>
                </div>
            )}
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );
};

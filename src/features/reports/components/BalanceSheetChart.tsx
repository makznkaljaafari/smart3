import React from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { AppTheme } from '../../../types';
import { formatCurrency } from '../../expenses/lib/utils';


interface BalanceSheetChartProps {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
}

export const BalanceSheetChart: React.FC<BalanceSheetChartProps> = ({ totalAssets, totalLiabilities, totalEquity }) => {
    const { theme, lang, settings } = useZustandStore();
    const t = translations[lang];
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    const maxValue = Math.max(totalAssets, totalLiabilitiesAndEquity) * 1.2;

    const Bar = ({ label, value, color, maxValue }: {label: string, value: number, color: string, maxValue: number}) => (
        <div className="flex flex-col items-center">
            <div className="w-24 h-64 bg-gray-800 rounded-t-lg flex flex-col justify-end">
                <div 
                    className="transition-all duration-500 rounded-t-lg"
                    style={{ height: `${(value / maxValue) * 100}%`, backgroundColor: color }}
                    title={`${label}: ${formatCurrency(value, settings.baseCurrency)}`}
                />
            </div>
            <span className="mt-2 text-sm font-semibold">{label}</span>
        </div>
    );
    
     const StackedBar = ({ labels, values, colors, maxValue }: {labels: string[], values: number[], colors: string[], maxValue: number}) => {
        const totalValue = values.reduce((sum, v) => sum + v, 0);
        return (
            <div className="flex flex-col items-center">
                <div className="w-24 h-64 bg-gray-800 rounded-t-lg flex flex-col justify-end">
                    {values.map((value, index) => (
                         <div 
                            key={index}
                            className="transition-all duration-500"
                            style={{ height: `${(value / maxValue) * 100}%`, backgroundColor: colors[index] }}
                            title={`${labels[index]}: ${formatCurrency(value, settings.baseCurrency)}`}
                        />
                    ))}
                </div>
                <span className="mt-2 text-sm font-semibold">{labels.join(' + ')}</span>
            </div>
        )
     };

    return (
        <div className="flex flex-col items-center gap-8">
            <div className="flex items-end gap-16">
                 <Bar label={t.totalAssets} value={totalAssets} color="#10b981" maxValue={maxValue} />
                 <StackedBar 
                    labels={[t.totalLiabilities, t.totalEquity]} 
                    values={[totalLiabilities, totalEquity]}
                    colors={['#f97316', '#8b5cf6']}
                    maxValue={maxValue}
                />
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#10b981]"/> {t.assets}</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#f97316]"/> {t.liabilities}</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#8b5cf6]"/> {t.equity}</div>
            </div>
        </div>
    );
};


import React from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';

interface StockStatusIndicatorProps {
    quantity: number;
    reorderPoint: number | null | undefined;
}

export const StockStatusIndicator: React.FC<StockStatusIndicatorProps> = ({ quantity, reorderPoint }) => {
    const { lang } = useZustandStore();
    const t = translations[lang];

    let status: 'inStock' | 'lowStock' | 'outOfStock' = 'inStock';
    let bars = 3;
    let colorClass = 'bg-green-500';
    let glowClass = 'shadow-[0_0_8px_rgba(34,197,94,0.6)]';
    let textClass = 'text-green-400';

    if (quantity <= 0) {
        status = 'outOfStock';
        bars = 1;
        colorClass = 'bg-red-500';
        glowClass = 'shadow-[0_0_8px_rgba(239,68,68,0.6)]';
        textClass = 'text-red-400';
    } else if (reorderPoint && quantity <= reorderPoint) {
        status = 'lowStock';
        bars = 2;
        colorClass = 'bg-yellow-500';
        glowClass = 'shadow-[0_0_8px_rgba(234,179,8,0.6)]';
        textClass = 'text-yellow-400';
    }

    return (
        <div className="flex items-center gap-2 mt-1" title={t[status]}>
            <div className="flex items-end gap-0.5 h-3">
                {[1, 2, 3].map((bar) => (
                    <div 
                        key={bar}
                        className={`w-1 rounded-sm transition-all duration-300 ${bar <= bars ? `${colorClass} ${glowClass}` : 'bg-gray-700/50'}`}
                        style={{ height: `${bar * 33}%` }}
                    />
                ))}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textClass}`}>{t[status]}</span>
        </div>
    );
};

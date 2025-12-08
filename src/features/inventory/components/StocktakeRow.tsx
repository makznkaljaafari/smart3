
import React, { useMemo } from 'react';
import { Stocktake } from '../../../types';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { CheckCircle, Clock, Brain } from 'lucide-react';

interface StocktakeRowProps {
    stocktake: Stocktake;
    onSelect: () => void;
    onGenerateSummary: () => void;
    isOdd: boolean;
}

const formatDate = (dateString: string) => new Intl.DateTimeFormat('en-CA').format(new Date(dateString));

export const StocktakeRow: React.FC<StocktakeRowProps> = React.memo(({ stocktake, onSelect, onGenerateSummary, isOdd }) => {
    const { theme, lang, settings } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
    }));
    const t = translations[lang];
    const { tables: tableSettings } = settings.appearance;

    const statusBadge = stocktake.status === 'completed'
        ? <span className="flex items-center gap-1 text-green-400"><CheckCircle size={14} /> {t.completed}</span>
        : <span className="flex items-center gap-1 text-yellow-400"><Clock size={14} /> {t.in_progress}</span>;

    const rowClass = useMemo(() => {
        let base = `border-b transition-colors ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800/50' : 'border-slate-200 hover:bg-slate-100'}`;
        if (tableSettings.theme === 'striped' && isOdd) {
            base += theme === 'dark' ? ' bg-white/5' : ' bg-slate-50';
        }
        return base;
    }, [theme, tableSettings.theme, isOdd]);

    return (
        <tr className={rowClass}>
            <td className="p-3" data-label={t.stocktakeDate}>{formatDate(stocktake.stocktakeDate)}</td>
            <td className="p-3" data-label={t.warehouse}>{stocktake.warehouseName}</td>
            <td className="p-3" data-label={t.status}>{statusBadge}</td>
            <td className="p-3 text-center" data-label={t.actions}>
                <div className="flex items-center justify-center gap-2">
                    <HoloButton variant="secondary" onClick={onSelect} className="!py-1 !px-3 !text-sm">
                        {stocktake.status === 'in_progress' ? t.continueStocktake : t.viewStocktake}
                    </HoloButton>
                    {stocktake.status === 'completed' && (
                        <HoloButton variant="primary" icon={Brain} onClick={onGenerateSummary} className="!py-1 !px-3 !text-sm">
                            {t.generateSmartSummary}
                        </HoloButton>
                    )}
                </div>
            </td>
        </tr>
    );
});

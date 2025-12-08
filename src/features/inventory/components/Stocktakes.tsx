import React, { useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useStocktakeData } from '../hooks/useStocktakeData';
import { StocktakeRow } from './StocktakeRow';
import { StocktakeInitiationModal } from './StocktakeInitiationModal';
import { StocktakeCountingModal } from './StocktakeCountingModal';
import { SmartStocktakeSuggestionModal } from './SmartStocktakeSuggestionModal';
import { Plus, ServerCrash, ClipboardList, Brain } from 'lucide-react';
import { StocktakeSummaryModal } from './StocktakeSummaryModal';
import { LoadingState } from '../../../components/common/LoadingState';
import { EmptyState } from '../../../components/common/EmptyState';

export const Stocktakes: React.FC = () => {
    const { theme, settings } = useZustandStore(state => ({
        theme: state.theme,
        settings: state.settings,
    }));
    const t = translations[useZustandStore.getState().lang];
    const { tables: tableSettings } = settings.appearance;

    const {
        stocktakes,
        stocktakesLoading,
        stocktakesError,
        showInitiationModal,
        showCountingModal,
        activeStocktake,
        isGeneratingSuggestions,
        suggestionError,
        suggestedProducts,
        summaryTarget,
        isGeneratingSummary,
        summaryResult,
        summaryError,
        generateSmartSuggestions,
        clearSuggestions,
        handleOpenInitiation,
        handleCloseModals,
        handleInitiate,
        handleSelectStocktake,
        handleSaveProgress,
        handleComplete,
        handleGenerateSummary,
    } = useStocktakeData();

    const headerClasses = useMemo(() => {
        let base = `p-3 text-sm transition-colors ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-700'}`;
        if (tableSettings.headerStyle === 'bold') {
            base += ' font-bold';
        } else {
            base += ' font-semibold';
        }
        if (tableSettings.headerStyle === 'accent') {
            base += theme === 'dark' ? ' !bg-[var(--accent-bg-20)] !text-[var(--accent-300)]' : ' !bg-cyan-100 !text-cyan-800';
        }
        return base;
    }, [theme, tableSettings.headerStyle]);

    const fontSizeClass = useMemo(() => {
        switch (tableSettings.fontSize) {
            case 'small': return 'text-xs';
            case 'large': return 'text-base';
            default: return 'text-sm';
        }
    }, [tableSettings.fontSize]);

    const renderContent = () => {
        if (stocktakesLoading) {
            return <LoadingState />;
        }
        if (stocktakesError) {
            return <EmptyState icon={ServerCrash} title="Error" description={stocktakesError} variant="error" />;
        }
        if (stocktakes.length === 0) {
            return (
                <EmptyState 
                    icon={ClipboardList} 
                    title={t.noStocktakesYet} 
                    description="" 
                />
            );
        }
        return (
            <div className={`rounded-lg overflow-x-auto border ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                <table className={`w-full ${fontSizeClass} responsive-table`}>
                    <thead>
                        <tr>
                            <th className={`${headerClasses} text-right`}>{t.stocktakeDate}</th>
                            <th className={`${headerClasses} text-right`}>{t.warehouse}</th>
                            <th className={`${headerClasses} text-right`}>{t.status}</th>
                            <th className={`${headerClasses} text-center`}>{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocktakes.map((st, index) => (
                            <StocktakeRow 
                                key={st.id}
                                stocktake={st}
                                onSelect={() => handleSelectStocktake(st.id)}
                                onGenerateSummary={() => handleGenerateSummary(st.id)}
                                isOdd={index % 2 !== 0}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-3">
                <HoloButton icon={Brain} variant="secondary" onClick={generateSmartSuggestions} disabled={isGeneratingSuggestions}>
                    {isGeneratingSuggestions ? t.generatingSuggestions : t.smartStocktakeSuggestion}
                </HoloButton>
                <HoloButton icon={Plus} variant="primary" onClick={handleOpenInitiation}>{t.startStocktake}</HoloButton>
            </div>
            {renderContent()}
            {showInitiationModal && <StocktakeInitiationModal onClose={handleCloseModals} onInitiate={handleInitiate} />}
            {showCountingModal && activeStocktake && (
                <StocktakeCountingModal
                    stocktake={activeStocktake}
                    onClose={handleCloseModals}
                    onSaveProgress={handleSaveProgress}
                    onComplete={handleComplete}
                />
            )}
            {(suggestedProducts || isGeneratingSuggestions || suggestionError) && (
                <SmartStocktakeSuggestionModal
                    isOpen={true}
                    isLoading={isGeneratingSuggestions}
                    error={suggestionError}
                    suggestions={suggestedProducts}
                    onClose={clearSuggestions}
                    onStartStocktake={handleInitiate}
                />
            )}
            {(isGeneratingSummary || summaryResult || summaryError) && (
                <StocktakeSummaryModal
                    isLoading={isGeneratingSummary}
                    error={summaryError}
                    summary={summaryResult}
                    onClose={handleCloseModals}
                />
            )}
        </div>
    );
};
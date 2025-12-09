
import React from 'react';
import { useStocktakeData } from '../hooks/useStocktakeData';
import { StocktakeRow } from './StocktakeRow';
import { StocktakeInitiationModal } from './StocktakeInitiationModal';
import { StocktakeCountingModal } from './StocktakeCountingModal';
import { StocktakeSummaryModal } from './StocktakeSummaryModal';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Plus, ClipboardList, ServerCrash } from 'lucide-react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { LoadingState } from '../../../components/common/LoadingState';
import { EmptyState } from '../../../components/common/EmptyState';
import { Stocktake } from '../../../types';
import { SmartStocktakeSuggestionModal } from './SmartStocktakeSuggestionModal';

export const Stocktakes: React.FC = () => {
    const { theme, lang, settings } = useZustandStore(state => ({
        theme: state.theme,
        lang: state.lang,
        settings: state.settings,
    }));
    const t = translations[lang];
    const { tables: tableSettings } = settings.appearance;
    
    const {
        stocktakes,
        isLoading,
        error,
        activeStocktake,
        showInitiateModal,
        showCountingModal,
        showSummaryModal,
        summaryResult,
        isGeneratingSummary,
        summaryError,
        handleOpenInitiate,
        handleCloseModals,
        handleInitiate,
        handleSelectStocktake,
        handleSaveProgress,
        handleComplete,
        handleGenerateSummary,
        
        // Smart Suggestions
        showSuggestionModal,
        isGeneratingSuggestions,
        suggestionError,
        suggestions,
        handleSmartSuggestion,
        handleStartFromSuggestion
    } = useStocktakeData();

    const headerClasses = `p-3 text-sm font-semibold transition-colors ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-700'}`;

    const renderContent = () => {
        if (isLoading) return <LoadingState />;
        if (error) return <EmptyState icon={ServerCrash} title="Error" description={error} variant="error" />;
        if (stocktakes.length === 0) {
             return (
                <EmptyState 
                    icon={ClipboardList} 
                    title={t.noStocktakesYet} 
                    description={t.initiateStocktake} 
                    actionLabel={t.startStocktake}
                    onAction={handleOpenInitiate}
                />
            );
        }
        
        return (
            <div className={`rounded-lg overflow-x-auto border ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                <table className="w-full text-sm responsive-table">
                    <thead>
                        <tr>
                            <th className={`${headerClasses} text-right`}>{t.stocktakeDate}</th>
                            <th className={`${headerClasses} text-right`}>{t.warehouse}</th>
                            <th className={`${headerClasses} text-right`}>{t.status}</th>
                            <th className={`${headerClasses} text-center`}>{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocktakes.map((st: any, index: number) => (
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
                 <HoloButton variant="secondary" onClick={handleSmartSuggestion} disabled={isGeneratingSuggestions}>
                    {isGeneratingSuggestions ? t.analyzing : t.smartStocktakeSuggestion}
                </HoloButton>
                <HoloButton icon={Plus} variant="primary" onClick={handleOpenInitiate}>{t.startStocktake}</HoloButton>
            </div>
            {renderContent()}
            
            {showInitiateModal && (
                <StocktakeInitiationModal 
                    onClose={handleCloseModals} 
                    onInitiate={handleInitiate} 
                />
            )}
            
            {showCountingModal && activeStocktake && (
                <StocktakeCountingModal 
                    stocktake={activeStocktake} 
                    onClose={handleCloseModals}
                    onSaveProgress={handleSaveProgress}
                    onComplete={handleComplete}
                />
            )}
            
            {showSummaryModal && (
                <StocktakeSummaryModal
                    isLoading={isGeneratingSummary}
                    error={summaryError}
                    summary={summaryResult}
                    onClose={handleCloseModals}
                />
            )}
            
            {showSuggestionModal && (
                <SmartStocktakeSuggestionModal
                    isOpen={showSuggestionModal}
                    isLoading={isGeneratingSuggestions}
                    error={suggestionError}
                    suggestions={suggestions}
                    onClose={handleCloseModals}
                    onStartStocktake={handleStartFromSuggestion}
                />
            )}
        </div>
    );
};

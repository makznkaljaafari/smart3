
import React from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardStatsGrid } from './components/DashboardStatsGrid';
import { AIInsightsSection } from './components/AIInsightsSection';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { CashFlowForecastChart } from './components/CashFlowForecastChart';
import { BudgetProgress } from './components/BudgetProgress';
import { SectionBox } from '../../components/ui/SectionBox';
import { FinancialHealthDetailsModal } from './components/FinancialHealthDetailsModal';
import { StrategicAdviceModal } from './components/StrategicAdviceModal';
import { CustomerFormModal } from '../customers/components/CustomerFormModal';
import { DebtFormModal } from '../debts/components/DebtFormModal';
import { ExpenseFormModal } from '../expenses/components/ExpenseFormModal';
import { useDashboardData } from './hooks/useDashboardData';
import { useZustandStore } from '../../store/useStore';
import { customerService } from '../../services/customerService';
import { debtService } from '../../services/debtService';
import { expenseService } from '../../services/expenseService';
import { HoloButton } from '../../components/ui/HoloButton';
import { Lightbulb } from 'lucide-react';
import { AppTheme } from '../../types';

export const DashboardView = () => {
    const { 
        dashboardStats, currentMonthBudgets, spentPerCategory, financialHealth, briefing, 
        forecastResult, aiInsights, strategicAdvice, localDashboardCards, customizeMode, setCustomizeMode, 
        isHealthModalOpen, setIsHealthModalOpen, showCustomerForm, setShowCustomerForm, 
        showDebtForm, setShowDebtForm, showExpenseForm, setShowExpenseForm, showStrategyModal, setShowStrategyModal, 
        draggedId, setDraggedId, isHealthLoading, isBriefingLoading, isForecastLoading, 
        isLoadingInsights, isStrategyLoading, forecastError, insightsError, isLoading, 
        generateBriefing, handleGenerateFinancialHealth, handleGenerateForecast, handleGenerateInsights, 
        handleGenerateStrategy, handleSaveLayout, handleCardClick, handleDrop, setLocalDashboardCards, 
        t, lang, theme, settings 
    } = useDashboardData();
    
    const { addToast } = useZustandStore(s => ({ addToast: s.addToast }));

    const handleSaveCustomer = async (data: any) => {
        await customerService.saveCustomer(data, true);
        addToast({message: t.customerAddedSuccess, type: 'success'});
        setShowCustomerForm(false);
    };
    const handleSaveDebt = async (data: any) => {
        await debtService.saveDebt(data, true);
        addToast({message: t.debtAddedSuccess, type: 'success'});
        setShowDebtForm(false);
    };
    const handleSaveExpense = async (data: any) => {
        await expenseService.saveExpense({...data, updatedDate: new Date().toISOString()}, true);
        addToast({message: t.expenseAddedSuccess, type: 'success'});
        setShowExpenseForm(false);
    };

    return (
        <>
            <div className="space-y-6">
                <DashboardHeader
                    t={t}
                    customizeMode={customizeMode}
                    onCustomize={() => setCustomizeMode(true)}
                    onCancel={() => { setLocalDashboardCards(settings.dashboardCards); setCustomizeMode(false); }}
                    onSaveLayout={handleSaveLayout}
                    onAddDebt={() => setShowDebtForm(true)}
                    onAddCustomer={() => setShowCustomerForm(true)}
                    onAddExpense={() => setShowExpenseForm(true)}
                />
                
                <DashboardStatsGrid 
                    theme={theme} t={t} lang={lang} baseCurrency={settings.baseCurrency} customizeMode={customizeMode}
                    localDashboardCards={localDashboardCards} dashboardStats={dashboardStats}
                    financialHealth={financialHealth} isHealthLoading={isHealthLoading}
                    briefing={briefing} isBriefingLoading={isBriefingLoading}
                    onGenerateBriefing={generateBriefing}
                    onCardChange={(id, k, v) => setLocalDashboardCards(prev => prev.map(c => c.id === id ? { ...c, [k]: v } : c))}
                    onDragStart={setDraggedId} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} draggedId={draggedId}
                    onViewHealthDetails={() => setIsHealthModalOpen(true)}
                    onGenerateHealth={handleGenerateFinancialHealth}
                    onCardClick={handleCardClick}
                    isLoading={isLoading}
                />
                
                <div className="flex justify-end">
                    <HoloButton 
                        icon={Lightbulb} 
                        variant="secondary" 
                        onClick={handleGenerateStrategy} 
                        className="shadow-lg shadow-yellow-500/20 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                    >
                        {lang === 'ar' ? 'المستشار الاستراتيجي' : 'Strategic Advisor'}
                    </HoloButton>
                </div>

                <SectionBox title={t.monthlyOverview} theme={theme}>
                    <IncomeExpenseChart />
                </SectionBox>
                
                <SectionBox title={t.predictiveAnalysis} theme={theme}>
                    <CashFlowForecastChart 
                        forecastResult={forecastResult} 
                        isLoading={isForecastLoading} 
                        error={forecastError} 
                        onGenerate={handleGenerateForecast} 
                    />
                </SectionBox>
                
                <SectionBox title={t.monthlyBudgets} theme={theme}>
                    {currentMonthBudgets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentMonthBudgets.map((budget) => ( 
                                <BudgetProgress 
                                    key={budget.id} 
                                    category={budget.category} 
                                    spent={spentPerCategory[budget.category] || 0} 
                                    total={budget.amount} 
                                    currency={settings.baseCurrency} 
                                    theme={theme} 
                                    t={t}
                                /> 
                            ))}
                        </div>
                    ) : ( 
                        <p className="text-center text-gray-500 py-4">{t.noBudgetsSet}</p> 
                    )}
                </SectionBox>
                
                <AIInsightsSection
                    theme={theme} lang={lang} t={t} isLoading={isLoadingInsights} error={insightsError}
                    insights={aiInsights} onGenerate={handleGenerateInsights} canGenerate={!!forecastResult}
                />
            </div>

            {isHealthModalOpen && financialHealth?.analysis && 
                <FinancialHealthDetailsModal analysis={financialHealth.analysis} onClose={() => setIsHealthModalOpen(false)} theme={theme} t={t} />
            }
            {showStrategyModal && 
                <StrategicAdviceModal adviceData={strategicAdvice} onClose={() => setShowStrategyModal(false)} isLoading={isStrategyLoading} />
            }
            {showCustomerForm && 
                <CustomerFormModal customer={null} onClose={() => setShowCustomerForm(false)} onSave={handleSaveCustomer} theme={theme} />
            }
            {showDebtForm && 
                <DebtFormModal onClose={() => setShowDebtForm(false)} onSave={handleSaveDebt} />
            }
            {showExpenseForm && 
                <ExpenseFormModal onClose={() => setShowExpenseForm(false)} onSave={handleSaveExpense} t={t} theme={theme} />
            }
        </>
    );
};

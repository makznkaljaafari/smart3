import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useZustandStore } from '../../../store/useStore';
import { reportService } from '../../../services/reportService';
import { expenseService } from '../../../services/expenseService';
import { useFinancialSummary } from '../../../services/reports/hooks';
import { analyzeFinancialHealth, generateStrategicAdvice } from '../../../services/aiService';
import { profileService } from '../../../services/profileService';
import { DashboardCardConfig, Toast, Budget } from '../../../types';
import { ROUTES } from '../../../constants/routes';
import { ForecastResult } from '../components/CashFlowForecastChart';
import { translations } from '../../../lib/i18n';
import { callAIProxy, cleanJsonString } from '../../../lib/aiClient';

export const useDashboardData = () => {
    const { accounts, settings, lang, theme, authUser, currentCompany, addToast, setState, inventoryLevels } = useZustandStore(state => ({
        accounts: state.accounts,
        settings: state.settings,
        lang: state.lang,
        theme: state.theme,
        authUser: state.authUser,
        currentCompany: state.currentCompany,
        addToast: state.addToast,
        setState: useZustandStore.setState,
        inventoryLevels: state.inventoryLevels
    }));
    const t = translations[lang];
    const navigate = useNavigate();

    // --- UI State ---
    const [customizeMode, setCustomizeMode] = useState(false);
    const [localDashboardCards, setLocalDashboardCards] = useState<DashboardCardConfig[]>(settings.dashboardCards);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [showDebtForm, setShowDebtForm] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    const [showStrategyModal, setShowStrategyModal] = useState(false);

    // --- AI State ---
    const [aiInsights, setAiInsights] = useState<string[] | null>(null);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [insightsError, setInsightsError] = useState<string | null>(null);
    const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
    const [isForecastLoading, setIsForecastLoading] = useState(false);
    const [forecastError, setForecastError] = useState<string | null>(null);
    const [financialHealth, setFinancialHealth] = useState<{ score: number, summary: string, analysis: string } | null>(null);
    const [isHealthLoading, setIsHealthLoading] = useState(false);
    const [briefing, setBriefing] = useState<string | null>(sessionStorage.getItem('dailyBriefing'));
    const [isBriefingLoading, setIsBriefingLoading] = useState(false);
    const [strategicAdvice, setStrategicAdvice] = useState<{ advice: string[], priority: 'high' | 'medium' | 'low' } | null>(null);
    const [isStrategyLoading, setIsStrategyLoading] = useState(false);

    // --- Date Range for Stats (Current Year) ---
    const currentYearStart = useMemo(() => {
        const d = new Date();
        d.setMonth(0, 1); // Jan 1st of current year
        return d.toISOString().split('T')[0];
    }, []);

    // --- Data Fetching ---
    const { data: accountBalances, isLoading: isBalancesLoading } = useQuery({
        queryKey: ['accountBalances', currentCompany?.id],
        queryFn: reportService.getAccountBalances,
        enabled: !!currentCompany?.id,
        staleTime: 1000 * 60
    });

    const { data: incomeStatement, isLoading: isIncomeLoading } = useQuery({
        queryKey: ['incomeStatement', currentCompany?.id],
        queryFn: reportService.getIncomeStatement,
        enabled: !!currentCompany?.id,
        staleTime: 1000 * 60
    });

    const { data: expenseStats, isLoading: isExpenseLoading } = useQuery({
        queryKey: ['expenseStats', currentCompany?.id, currentYearStart],
        queryFn: () => expenseService.getExpenseStats(currentYearStart),
        enabled: !!currentCompany?.id,
    });

    const { data: financialSummary, isLoading: isSummaryLoading } = useFinancialSummary(currentCompany?.id, {
        from: currentYearStart,
        to: new Date().toISOString().split('T')[0],
        asOf: new Date().toISOString().split('T')[0]
    });
    
    const isDataLoading = isBalancesLoading || isIncomeLoading || isExpenseLoading || isSummaryLoading;

    // --- Sync Local State ---
    useEffect(() => {
        setLocalDashboardCards(settings.dashboardCards);
    }, [settings.dashboardCards]);

    // --- Derived State ---
    const dashboardStats = useMemo(() => {
        const accounts = accountBalances?.data || [];
        const pnl = incomeStatement?.data || [];
        const receivables = accounts
            .filter(a => a.account_type === 'asset' && (a.account_id === settings.accounting.defaultAccountsReceivableId || a.account_name.includes('Receivable') || a.account_name.includes('الذمم المدينة')))
            .reduce((sum: number, a: any) => sum + a.balance, 0);
        const totalIncome = pnl.filter(a => a.account_type === 'revenue').reduce((sum: number, a: any) => sum + a.net_amount, 0);
        const totalExpenses = pnl.filter(a => a.account_type === 'expense').reduce((sum: number, a: any) => sum + a.net_amount, 0);

        return {
            totalDebts: { value: receivables, trend: 0 },
            overdueDebts: { value: 0, trend: 0 },
            totalIncome: { value: totalIncome, trend: 0 },
            totalExpenses: { value: totalExpenses, trend: 0 }
        };
    }, [accountBalances, incomeStatement, settings.accounting]);

    const currentMonthBudgets = useMemo(() => {
        const currentMonthStr = new Date().toISOString().slice(0, 7);
        return settings.budgets?.filter(b => b.month === currentMonthStr) || [];
    }, [settings.budgets]);

    const spentPerCategory = useMemo(() => {
        const rawExpenses = expenseStats?.data || [];
        return rawExpenses.reduce((acc: any, expense: any) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);
    }, [expenseStats]);

    // --- Actions ---
    const generateBriefing = useCallback(async () => {
        setIsBriefingLoading(true);
        try {
            const totalRevenue = incomeStatement?.data?.filter(r => r.account_type === 'revenue').reduce((sum: number, r: any) => sum + r.net_amount, 0) || 0;
            const totalExpenses = incomeStatement?.data?.filter(r => r.account_type === 'expense').reduce((sum: number, r: any) => sum + r.net_amount, 0) || 0;
            const cashOnHand = accountBalances?.data?.filter(a => a.account_type === 'asset' && (a.account_name.toLowerCase().includes('cash') || a.account_name.includes('نقد'))).reduce((sum: number, a: any) => sum + a.balance, 0) || 0;

            const prompt = `You are a financial advisor AI. Write a short daily briefing in ${lang}. Data: Revenue YTD: ${totalRevenue}, Expenses YTD: ${totalExpenses}, Cash: ${cashOnHand}. Keep it concise (2-3 sentences).`;
            
            const responseText = await callAIProxy(prompt);
            if (responseText) {
                setBriefing(responseText);
                sessionStorage.setItem('dailyBriefing', responseText);
            }
        } catch (e) {
            console.error("Failed to generate briefing:", e);
        } finally {
            setIsBriefingLoading(false);
        }
    }, [incomeStatement, accountBalances, lang]);

    useEffect(() => {
        const lastBriefingDate = localStorage.getItem('lastBriefingDate');
        const today = new Date().toISOString().split('T')[0];
        if (lastBriefingDate !== today && incomeStatement && accountBalances) {
            generateBriefing();
            localStorage.setItem('lastBriefingDate', today);
        }
    }, [generateBriefing, incomeStatement, accountBalances]);

    const handleGenerateFinancialHealth = useCallback(async () => {
        setIsHealthLoading(true);
        const healthData = { 
            totalAssets: financialSummary?.totalAssets || 0, 
            totalLiabilities: financialSummary?.totalLiabilities || 0, 
            recentCashFlow: (financialSummary?.totalRevenue || 0) - (financialSummary?.totalExpense || 0), 
            overdueDebtPercentage: 0 
        };
        try {
            const result = await analyzeFinancialHealth(healthData, lang);
            if (result) setFinancialHealth(result);
            else throw new Error("Failed");
        } catch (e) {
            addToast({ message: t.errorGeneratingResponse, type: 'error' });
        } finally {
            setIsHealthLoading(false);
        }
    }, [financialSummary, lang, addToast, t]);

    const handleGenerateForecast = useCallback(async () => {
        setIsForecastLoading(true);
        setForecastError(null);
        
        try {
            const rawExpenses = expenseStats?.data || [];
            const promptData = {
                expensesHistory: rawExpenses.slice(0, 50),
                currentTotals: dashboardStats
            };

            const prompt = `
                You are a financial forecasting expert. 
                Based on the following actual financial data, generate a cash flow forecast for the next 3 months.
                
                Current State (YTD):
                - Total Income: ${dashboardStats.totalIncome.value}
                - Total Expenses: ${dashboardStats.totalExpenses.value}
                
                Expense History Sample: ${JSON.stringify(promptData.expensesHistory)}

                Task:
                1. Estimate future income and expenses based on the totals and expense patterns.
                2. Return a valid JSON object with this structure:
                { 
                    "incomeForecast": [{"month": "NextMonthShortName", "amount": number}, ...], 
                    "expenseForecast": [{"month": "NextMonthShortName", "amount": number}, ...], 
                    "analysis": "Short analysis string in ${lang}." 
                }
                
                If history is insufficient, project a 5% growth from current average monthly run rate.
                Do not output markdown blocks, just the JSON.
            `;
            
            const responseText = await callAIProxy(prompt, { responseMimeType: "application/json" });
            
            if (responseText) {
                const jsonStr = cleanJsonString(responseText);
                setForecastResult(JSON.parse(jsonStr) as ForecastResult);
            } else {
                throw new Error('No response from AI');
            }
        } catch (e: any) {
            console.error("Forecast Generation Error:", e);
            setForecastError(t.forecastError || 'Failed to generate forecast.');
        } finally {
            setIsForecastLoading(false);
        }
    }, [t, expenseStats, dashboardStats, lang]);

    const handleGenerateInsights = useCallback(async () => {
        if (!forecastResult) { setInsightsError('Forecast missing'); return; }
        setIsLoadingInsights(true);
        try {
            const prompt = `Financial insights bullet points in ${lang}. Data: ${JSON.stringify(dashboardStats)} and Forecast: ${JSON.stringify(forecastResult)}. Focus on actionable advice.`;
            const responseText = await callAIProxy(prompt);
            if (responseText) {
                setAiInsights(responseText.split(/•|-/).filter((s: string) => s.trim()).map((s: string) => s.trim()));
            }
        } catch (e) {
            setInsightsError('Failed to generate insights');
        } finally {
            setIsLoadingInsights(false);
        }
    }, [dashboardStats, lang, forecastResult]);
    
    const handleGenerateStrategy = useCallback(async () => {
        setIsStrategyLoading(true);
        setShowStrategyModal(true);
        try {
            const cashOnHand = accountBalances?.data?.filter(a => a.account_type === 'asset' && (a.account_name.toLowerCase().includes('cash') || a.account_name.includes('نقد'))).reduce((sum: number, a: any) => sum + a.balance, 0) || 0;
            const inventoryValue = inventoryLevels.reduce((sum: number, l: any) => sum + (l.quantity * 50), 0); 
            const burnRate = (dashboardStats.totalExpenses.value || 0) / 12; 

            const advice = await generateStrategicAdvice({
                cashOnHand,
                totalDebt: dashboardStats.totalDebts.value,
                inventoryValue,
                monthlyBurnRate: burnRate
            }, lang);
            
            setStrategicAdvice(advice);
        } catch (e) {
            console.error("Strategy Error:", e);
        } finally {
            setIsStrategyLoading(false);
        }
    }, [accountBalances, dashboardStats, inventoryLevels, lang]);


    const handleSaveLayout = async () => {
        const newSettings = { ...settings, dashboardCards: localDashboardCards };
        const { error } = await profileService.updateProfileAndSettings(newSettings);
        if (error) { addToast({ message: error.message, type: 'error' }); return; }
        setState(s => ({ ...s, settings: newSettings }));
        setCustomizeMode(false);
        addToast({ message: t.successSaved, type: 'success' });
    };

    const handleCardClick = (id: DashboardCardConfig['id']) => {
        const routes = { totalDebts: ROUTES.DEBTS, overdueDebts: ROUTES.DEBTS, totalIncome: ROUTES.INCOME, totalExpenses: ROUTES.EXPENSES };
        if (routes[id as keyof typeof routes]) navigate(routes[id as keyof typeof routes]);
    };

    const handleDrop = (targetId: string) => {
        if (!draggedId) return;
        const draggedIndex = localDashboardCards.findIndex(c => c.id === draggedId);
        const targetIndex = localDashboardCards.findIndex(c => c.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return;
        const newOrder = [...localDashboardCards];
        const [draggedItem] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);
        setLocalDashboardCards(newOrder);
        setDraggedId(null);
    };

    return {
        // Data
        dashboardStats,
        currentMonthBudgets,
        spentPerCategory,
        financialHealth,
        briefing,
        forecastResult,
        aiInsights,
        localDashboardCards,
        strategicAdvice,
        
        // UI State
        customizeMode, setCustomizeMode,
        isHealthModalOpen, setIsHealthModalOpen,
        showCustomerForm, setShowCustomerForm,
        showDebtForm, setShowDebtForm,
        showExpenseForm, setShowExpenseForm,
        showStrategyModal, setShowStrategyModal,
        draggedId, setDraggedId,
        
        // Loading/Errors
        isLoading: isDataLoading,
        isHealthLoading,
        isBriefingLoading,
        isForecastLoading,
        isLoadingInsights,
        isStrategyLoading,
        forecastError,
        insightsError,
        
        // Methods
        generateBriefing,
        handleGenerateFinancialHealth,
        handleGenerateForecast,
        handleGenerateInsights,
        handleGenerateStrategy,
        handleSaveLayout,
        handleCardClick,
        handleDrop,
        setLocalDashboardCards,
        
        // Context
        t, lang, theme, settings
    };
};
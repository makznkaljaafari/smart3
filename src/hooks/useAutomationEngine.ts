
import { useEffect, useRef } from 'react';
import { useZustandStore } from '../store/useStore';
import { automationService } from '../services/automationService';
import { notifyAll } from '../lib/events';
import { translations } from '../lib/i18n';
import { Product, InventoryLevel } from '../types';

export const useAutomationEngine = () => {
    const { 
        settings, 
        expenses, 
        income: incomeList, // Renamed to avoid collision
        debts, 
        customers,
        products, 
        inventoryLevels, 
        projects,
        currentCompany,
        lang
    } = useZustandStore(state => ({
        settings: state.settings,
        expenses: state.expenses || [],
        income: state.income || [],
        debts: state.debts || [],
        customers: state.customers || [],
        products: state.products || [],
        inventoryLevels: state.inventoryLevels || [],
        projects: state.projects || [],
        currentCompany: state.currentCompany,
        lang: state.lang
    }));

    const processedRef = useRef(false);
    const t = translations[lang];

    useEffect(() => {
        if (!currentCompany || processedRef.current) return;

        const runAutomation = async () => {
            // 1. Recurring Expenses
            const expenseResult = automationService.processRecurringExpenses(expenses, currentCompany.id, t);
            
            // 2. Recurring Income
            const incomeResult = automationService.processRecurringIncome(incomeList, currentCompany.id, t);
            
            // 3. Customer Risks
            const customerResult = automationService.evaluateCustomerRisks(customers, debts, t);
            
            // 4. Low Stock / Auto Restock
            // Ensure products and inventory levels are safe arrays
            const safeProducts: Product[] = products || [];
            const safeInventoryLevels: InventoryLevel[] = inventoryLevels || [];
            
            // Assuming empty existing drafts for simplicity in this hook context
            const restockResult = automationService.checkAutoRestock(safeProducts, safeInventoryLevels, [], currentCompany.id, settings.inventory.defaultWarehouseId || '', t);

            // 5. Project Budgets
            const projectResult = automationService.monitorProjectBudgets(projects, expenses, t);
            
            // 6. Overdue Debts
            const debtResult = automationService.checkOverdueDebts(
                debts, 
                settings.smartAlerts.overdueDebt, 
                new Set(), // Pass already alerted set in real implementation
                lang, 
                t
            );

            // Aggregate Logs and Events
            const allLogs = [
                ...expenseResult.logs, 
                ...incomeResult.logs, 
                ...customerResult.logs,
                ...restockResult.logs,
                ...projectResult.logs,
                ...debtResult.logs
            ];

            const allEvents = [
                ...projectResult.events,
                ...debtResult.events
            ];
            
            // Dispatch Events
            allEvents.forEach(e => notifyAll(e, settings));
            
            // Update Store (In a real app, this would likely be batched server-side or via specific actions)
            // Here we just log for demonstration as we can't easily mutate store from here without actions
            if (allLogs.length > 0) {
                // console.log("Automation Run:", allLogs);
                // useZustandStore.setState(s => ({ automationLogs: [...s.automationLogs, ...allLogs] }));
            }
        };

        runAutomation();
        processedRef.current = true;

        // Reset processed flag periodically (e.g., every 24h or refresh)
        const interval = setInterval(() => { processedRef.current = false; }, 24 * 60 * 60 * 1000);
        return () => clearInterval(interval);

    }, [currentCompany, expenses, incomeList, debts, customers, products, inventoryLevels, projects, settings, lang, t]);
};

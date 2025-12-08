
import { useEffect, useRef } from 'react';
import { useZustandStore } from '../store/useStore';
import { eventBus } from '../lib/events';
import { translations } from '../lib/i18n';
import { customerService } from '../services/customerService';
import { projectService } from '../services/projectService';
import { getStockoutPrediction } from '../services/aiService';
import { automationService } from '../services/automationService';
import { AppEvent, AutomationLog } from '../types';
import { inventoryService } from '../services/inventoryService';
import { debtService } from '../services/debtService';
import { expenseService } from '../services/expenseService';
import { incomeService } from '../services/incomeService';
import { salesService } from '../services/salesService';
import { purchaseService } from '../services/purchaseService';

export const useAutomationEngine = () => {
    const setState = useZustandStore.setState;
    const alertedDebtsRef = useRef<Set<string>>(new Set());
    const lowStockAlertedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const runAutomation = async () => {
            try {
                const { 
                    settings, lang, authUser, 
                    currentCompany, projects,
                    addNotification 
                } = useZustandStore.getState();
                
                if (!currentCompany || !authUser) return;

                const t = translations[lang];
                let allLogs: AutomationLog[] = [];

                // --- PHASE A: Data Fetching ---
                const { data: inventoryLevels } = await inventoryService.getInventoryLevels();
                const { data: products } = await inventoryService.getProducts();
                const { data: debts } = await debtService.getDebts();
                const { data: customers } = await customerService.getCustomers();
                const { data: expenses } = await expenseService.getExpenses(); 
                const { data: income } = await incomeService.getIncome();
                const { data: purchases } = await purchaseService.getPurchases();
                const { data: recentSales } = await salesService.getSalesPaginated({ pageSize: 1000 }); 
                
                const safeProducts = products || [];
                const safeInventoryLevels = inventoryLevels || [];
                const safeDebts = debts || [];
                const safeCustomers = customers || [];
                const safeExpenses = expenses || [];
                const safeIncome = income || [];
                const safePurchases = purchases || [];
                const safeSales = recentSales || [];

                // --- PHASE B: Processing ---

                // 1. Process Recurring Transactions
                const expenseResult = automationService.processRecurringExpenses(safeExpenses, currentCompany.id, t);
                const incomeResult = automationService.processRecurringIncome(safeIncome, currentCompany.id, t);
                
                allLogs = [...allLogs, ...expenseResult.logs, ...incomeResult.logs];

                if (expenseResult.newExpenses.length > 0 || incomeResult.newIncomes.length > 0) {
                    for (const exp of expenseResult.newExpenses) {
                        await expenseService.saveExpense(exp, true);
                    }
                    for (const inc of incomeResult.newIncomes) {
                        await incomeService.saveIncome(inc, true);
                    }

                    addNotification({ 
                        message: lang === 'ar' ? `تم إنشاء مسودات تلقائية جديدة.` : `New automated drafts created.`,
                        type: 'info',
                        action: { label: lang === 'ar' ? 'مراجعة' : 'Review', path: '/expenses' }
                    });
                }

                // 2. Auto-Restock Drafts
                const restockResult = automationService.checkAutoRestock(
                    safeProducts, 
                    safeInventoryLevels, 
                    safePurchases, 
                    currentCompany.id, 
                    settings.inventory.defaultWarehouseId || '', 
                    t
                );
                
                if (restockResult.newPurchaseInvoices.length > 0) {
                    allLogs = [...allLogs, ...restockResult.logs];
                    for (const purchase of restockResult.newPurchaseInvoices) {
                         await purchaseService.createPurchase({
                             supplierName: purchase.supplierName,
                             invoiceNumber: purchase.invoiceNumber,
                             currency: settings.baseCurrency,
                             items: purchase.items.map(i => ({ product_id: i.productId, warehouse_id: settings.inventory.defaultWarehouseId || '', quantity: i.quantity, price: i.unitPrice })),
                             amountPaid: 0,
                             paymentMethod: 'credit',
                             notes: purchase.notes
                         });
                    }
                    addNotification({
                        message: lang === 'ar' ? `تم إنشاء مسودات شراء لإعادة المخزون.` : `Restock drafts created.`,
                        type: 'info',
                        action: { label: lang === 'ar' ? 'مشتريات' : 'Purchases', path: '/purchases' }
                    });
                }

                // 3. Project Budget Monitoring
                const projectResult = automationService.monitorProjectBudgets(projects, safeExpenses, t);
                if (projectResult.projectUpdates.length > 0) {
                    allLogs = [...allLogs, ...projectResult.logs];
                    setState(s => ({
                        ...s,
                        projects: s.projects.map(p => {
                            const update = projectResult.projectUpdates.find(u => u.id === p.id);
                            return update ? { ...p, ...update } : p;
                        })
                    }));
                    for (const update of projectResult.projectUpdates) {
                        await projectService.saveProject(update, false); 
                    }
                    projectResult.events.forEach(e => {
                        addNotification({ message: e.payload.message, type: 'warning' });
                        eventBus.publish(e);
                    });
                }

                // 4. Customer Risk Assessment
                const riskResult = automationService.evaluateCustomerRisks(safeCustomers, safeDebts, t);
                allLogs = [...allLogs, ...riskResult.logs];
                if (riskResult.customerUpdates.length > 0) {
                    for (const update of riskResult.customerUpdates) {
                        await customerService.saveCustomer(update, false);
                    }
                }

                // 5. Overdue Debt Alerts
                const alertResult = automationService.checkOverdueDebts(
                    safeDebts, 
                    settings.smartAlerts.overdueDebt, 
                    alertedDebtsRef.current, 
                    lang, 
                    t
                );
                
                allLogs = [...allLogs, ...alertResult.logs];
                alertResult.newAlertedIds.forEach(id => alertedDebtsRef.current.add(id));
                
                alertResult.events.forEach(e => {
                    addNotification({ message: e.payload.recipientName ? `${e.payload.recipientName}: Overdue Debt` : 'Debt Alert', type: 'warning' });
                    eventBus.publish(e);
                });

                // 6. Low Stock Alerts & AI Prediction
                if (safeProducts.length > 0 && safeInventoryLevels.length > 0) {
                    const stockTotals = safeInventoryLevels.reduce((acc, level) => {
                        acc[level.productId] = (acc[level.productId] || 0) + level.quantity;
                        return acc;
                    }, {} as Record<string, number>);

                    for (const product of safeProducts) {
                        if (product.reorderPoint && product.reorderPoint > 0) {
                            const currentStock = stockTotals[product.id] || 0;
                            if (currentStock <= product.reorderPoint && !lowStockAlertedRef.current.has(product.id)) {
                                lowStockAlertedRef.current.add(product.id);

                                const ninetyDaysAgo = new Date();
                                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                                
                                const salesHistory = safeSales
                                    .filter(sale => new Date(sale.date) > ninetyDaysAgo)
                                    .flatMap(sale => sale.items.map(item => ({ ...item, date: sale.date })))
                                    .filter(item => item.productId === product.id)
                                    .map(item => ({ date: new Date(item.date).toISOString().split('T')[0], quantity: item.quantity }));
                                
                                let prediction: string | null = null;
                                if (salesHistory.length > 0 && process.env.API_KEY) {
                                    prediction = await getStockoutPrediction(product.name, currentStock, salesHistory, lang);
                                }
                                
                                const message = lang === 'ar' 
                                    ? `تنبيه انخفاض المخزون: ${product.name}` 
                                    : `Low stock alert: ${product.name}`;
                                
                                addNotification({ message, type: 'warning' });

                                const event: AppEvent = {
                                    id: crypto.randomUUID(),
                                    type: 'LOW_STOCK_ALERT',
                                    payload: { 
                                        productName: product.name, 
                                        quantity: currentStock, 
                                        productId: product.id,
                                        prediction: prediction,
                                    },
                                    at: new Date().toISOString(),
                                    lang,
                                };
                                eventBus.publish(event);
                                
                                allLogs.push({
                                    id: crypto.randomUUID(),
                                    timestamp: new Date().toISOString(),
                                    event: 'LOW_STOCK_ALERT',
                                    details: `${product.name} reached reorder point (${currentStock})`,
                                    status: 'success'
                                });
                            }
                        }
                    }
                }

                // Commit Logs
                if (allLogs.length > 0) {
                    setState(s => ({ ...s, automationLogs: [...allLogs, ...s.automationLogs].slice(0, 200) }));
                }
            } catch (e) {
                console.error("Automation Engine Error:", e);
            }
        };

        // Run immediately on mount
        runAutomation();
        // Run every minute
        const interval = setInterval(runAutomation, 60000);

        return () => clearInterval(interval);
    }, [setState]);
};

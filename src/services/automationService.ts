
import { RecurrenceType, Expense, ExpenseStatus } from '../features/expenses/types';
import { Income } from '../features/income/types';
import { Debt } from '../features/debts/types';
import { Customer, RiskLevel } from '../features/customers/types';
import { AppEvent, AppEventType, AutomationLog, JournalEntry, InventoryLevel } from '../types';
import { getStockoutPrediction } from './aiService';
import { translations } from '../lib/i18n';
import { LangCode } from '../types.base';
import { Product } from '../features/inventory/types';
import { PurchaseInvoice, PurchaseInvoiceItem } from '../features/purchases/types';
import { Project } from '../features/projects/types';

// --- Helper Functions ---

export const getNextRecurrenceDate = (frequency: RecurrenceType, lastDate: string): Date => {
    const nextDate = new Date(lastDate);
    // Use UTC to avoid timezone shifting issues over multiple recurrences
    const day = nextDate.getUTCDate();
    const month = nextDate.getUTCMonth();
    const year = nextDate.getUTCFullYear();

    switch (frequency) {
        case 'daily': nextDate.setUTCDate(day + 1); break;
        case 'weekly': nextDate.setUTCDate(day + 7); break;
        case 'monthly': nextDate.setUTCMonth(month + 1); break;
        case 'yearly': nextDate.setUTCFullYear(year + 1); break;
    }
    return nextDate;
};

export interface AutomationResult {
    newExpenses: Expense[];
    newIncomes: Income[];
    newJournalEntries: JournalEntry[];
    newPurchaseInvoices: PurchaseInvoice[];
    updatedTemplates: (Expense | Income)[];
    logs: AutomationLog[];
    customerUpdates: Partial<Customer>[];
    projectUpdates: Partial<Project>[];
    eventsToPublish: AppEvent[];
}

/**
 * Core Automation Logic Service
 * Designed to be pure logic where possible, to allow future migration to server-side.
 */
export const automationService = {

    /**
     * Checks for recurring expenses and generates drafts if due.
     */
    processRecurringExpenses: (
        expenses: Expense[],
        companyId: string,
        t: any
    ): { newExpenses: Expense[], updatedTemplates: Expense[], logs: AutomationLog[], newJournalEntries: JournalEntry[] } => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        
        const newExpenses: Expense[] = [];
        const updatedTemplates: Expense[] = [];
        const logs: AutomationLog[] = [];
        const newJournalEntries: JournalEntry[] = [];

        const recurringExpenses = expenses.filter(e => e.isRecurringTemplate && e.recurrence && e.recurrence !== 'none');

        recurringExpenses.forEach(template => {
            const lastDate = template.lastRecurrenceDate || template.createdDate;
            let nextDate = getNextRecurrenceDate(template.recurrence!, lastDate);
            
            let iterations = 0; 
            const MAX_ITERATIONS = 12; 

            while (nextDate <= today && iterations < MAX_ITERATIONS) {
                const newExpense: Expense = {
                    ...template,
                    id: `EXP-AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    date: nextDate.toISOString().split('T')[0],
                    isRecurringTemplate: false,
                    recurrence: 'none',
                    status: 'draft', // Draft First
                    notes: (template.notes || '') + ' [Auto-Generated Draft]',
                    createdDate: new Date().toISOString(),
                    updatedDate: new Date().toISOString(),
                };
                delete newExpense.lastRecurrenceDate;
                
                newExpenses.push(newExpense);
                
                logs.push({
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    event: 'EXPENSE_CREATED',
                    details: t.recurringTransactionGenerated.replace('{title}', newExpense.title),
                    status: 'success'
                });
                
                const updatedTemplate = { ...template, lastRecurrenceDate: nextDate.toISOString() };
                updatedTemplates.push(updatedTemplate); 
                
                nextDate = getNextRecurrenceDate(template.recurrence!, nextDate.toISOString());
                iterations++;
            }
        });

        const uniqueUpdatedTemplates = Object.values(updatedTemplates.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {} as Record<string, Expense>));

        return { newExpenses, updatedTemplates: uniqueUpdatedTemplates, logs, newJournalEntries };
    },

    /**
     * Checks for recurring income and generates drafts if due.
     */
    processRecurringIncome: (
        incomeList: Income[],
        companyId: string,
        t: any
    ): { newIncomes: Income[], updatedTemplates: Income[], logs: AutomationLog[] } => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const newIncomes: Income[] = [];
        const updatedTemplates: Income[] = [];
        const logs: AutomationLog[] = [];

        const recurringIncome = incomeList.filter(i => i.isRecurringTemplate && i.recurrence && i.recurrence !== 'none');

        recurringIncome.forEach(template => {
            const lastDate = template.lastRecurrenceDate || template.createdDate;
            let nextDate = getNextRecurrenceDate(template.recurrence!, lastDate);
            let iterations = 0;
            const MAX_ITERATIONS = 12;

            while (nextDate <= today && iterations < MAX_ITERATIONS) {
                const newIncome: Income = {
                    ...template,
                    id: `INC-AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    date: nextDate.toISOString().split('T')[0],
                    isRecurringTemplate: false,
                    recurrence: 'none',
                    notes: (template.notes || '') + ' [Auto-Generated Draft]',
                    createdDate: new Date().toISOString(),
                    updatedDate: new Date().toISOString(),
                };
                delete newIncome.lastRecurrenceDate;
                
                newIncomes.push(newIncome);
                
                logs.push({
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    event: 'INCOME_CREATED',
                    details: t.recurringTransactionGenerated.replace('{title}', newIncome.title),
                    status: 'success'
                });

                const updatedTemplate = { ...template, lastRecurrenceDate: nextDate.toISOString() };
                updatedTemplates.push(updatedTemplate);
                
                nextDate = getNextRecurrenceDate(template.recurrence!, nextDate.toISOString());
                iterations++;
            }
        });

        const uniqueUpdatedTemplates = Object.values(updatedTemplates.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {} as Record<string, Income>));

        return { newIncomes, updatedTemplates: uniqueUpdatedTemplates, logs };
    },

    /**
     * Analyzes customer debts and updates risk levels.
     */
    evaluateCustomerRisks: (
        customers: Customer[],
        debts: Debt[],
        t: any
    ): { customerUpdates: Partial<Customer>[], logs: AutomationLog[] } => {
        const updates: Partial<Customer>[] = [];
        const logs: AutomationLog[] = [];

        customers.forEach(customer => {
            const customerDebts = debts.filter(d => d.customerId === customer.id && (d.status === 'overdue' || d.status === 'partial' || d.status === 'pending'));

            if (customerDebts.length === 0) {
                if (customer.riskLevel !== 'low') {
                    updates.push({ id: customer.id, riskLevel: 'low' });
                    logs.push({
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                        event: 'SMART_ALERT',
                        details: t.customerRiskLevelChanged.replace('{customerName}', customer.name).replace('{riskLevel}', t.low),
                        status: 'success'
                    });
                }
                return;
            }

            const totalOutstanding = customerDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
            const overdueDebts = customerDebts.filter(d => d.status === 'overdue');
            const totalOverdueAmount = overdueDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

            let score = 0;
            score += totalOutstanding / 2000; 
            if (totalOutstanding > 0) {
                score += (totalOverdueAmount / totalOutstanding) * 50; 
            }
            score += overdueDebts.length * 5; 

            let newRiskLevel: RiskLevel = 'low';
            if (score >= 50) newRiskLevel = 'high';
            else if (score >= 20) newRiskLevel = 'medium';

            if (customer.riskLevel !== newRiskLevel) {
                updates.push({ id: customer.id, riskLevel: newRiskLevel });
                logs.push({
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    event: 'SMART_ALERT',
                    details: t.customerRiskLevelChanged.replace('{customerName}', customer.name).replace('{riskLevel}', t[newRiskLevel]),
                    status: 'success'
                });
            }
        });

        return { customerUpdates: updates, logs };
    },

    /**
     * Auto-Restock Logic: Creates Draft Purchase Invoices for low stock items.
     */
    checkAutoRestock: (
        products: Product[],
        inventoryLevels: InventoryLevel[],
        existingDraftPurchases: PurchaseInvoice[],
        companyId: string,
        defaultWarehouseId: string,
        t: any
    ): { newPurchaseInvoices: PurchaseInvoice[], logs: AutomationLog[] } => {
        const newInvoices: PurchaseInvoice[] = [];
        const logs: AutomationLog[] = [];

        const stockTotals = inventoryLevels.reduce((acc, level) => {
            acc[level.productId] = (acc[level.productId] || 0) + level.quantity;
            return acc;
        }, {} as Record<string, number>);

        // Find products needing restock
        const productsToRestock = products.filter(p => {
            const qty = stockTotals[p.id] || 0;
            return p.reorderPoint && p.reorderPoint > 0 && qty <= p.reorderPoint;
        });

        // Filter out products that are already in a draft purchase order
        const pendingProducts = new Set<string>();
        existingDraftPurchases.forEach(inv => {
            // Using 'sent' to represent an order sent to supplier
            if (inv.status === 'draft' || inv.status === 'sent') {
                inv.items.forEach(item => pendingProducts.add(item.productId));
            }
        });

        const finalRestockList = productsToRestock.filter(p => !pendingProducts.has(p.id));

        if (finalRestockList.length > 0) {
            // Group by supplier if available, otherwise create a generic "To Order" invoice
            // For simplicity in this phase, we create one draft invoice for all items (user can split later or we improve logic)
            // Or better: create one invoice per product to keep it simple and manageable in drafts
            
            finalRestockList.forEach(product => {
                const qty = stockTotals[product.id] || 0;
                const orderQty = Math.max((product.reorderPoint || 0) * 2, 10); // Simple heuristic
                
                const newItem: PurchaseInvoiceItem = {
                    productId: product.id,
                    productName: product.name,
                    quantity: orderQty,
                    unitPrice: product.costPrice,
                    total: orderQty * product.costPrice
                };

                const newInvoice: PurchaseInvoice = {
                    id: `PO-AUTO-${Date.now()}-${product.sku}`,
                    company_id: companyId,
                    supplierName: 'Auto Restock (Draft)',
                    invoiceNumber: `PO-AUTO-${Date.now().toString().slice(-6)}`,
                    date: new Date().toISOString().split('T')[0],
                    items: [newItem],
                    subtotal: newItem.total,
                    total: newItem.total,
                    amountPaid: 0,
                    remainingAmount: newItem.total,
                    paymentMethod: 'credit',
                    status: 'draft',
                    discountValue: 0,
                    discountType: 'fixed',
                    taxValue: 0,
                    taxType: 'fixed',
                    notes: `Auto-generated draft for low stock (${qty} <= ${product.reorderPoint})`
                };

                newInvoices.push(newInvoice);
                logs.push({
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    event: 'LOW_STOCK_ALERT',
                    details: t.autoRestockDraftCreated.replace('{product}', product.name),
                    status: 'success'
                });
            });
        }

        return { newPurchaseInvoices: newInvoices, logs };
    },

    /**
     * Project Budget Monitoring
     */
    monitorProjectBudgets: (
        projects: Project[],
        expenses: Expense[],
        t: any
    ): { projectUpdates: Partial<Project>[], events: AppEvent[], logs: AutomationLog[] } => {
        const updates: Partial<Project>[] = [];
        const events: AppEvent[] = [];
        const logs: AutomationLog[] = [];

        projects.forEach(project => {
            if (project.status === 'in_progress' && project.budget && project.budget > 0) {
                const projectExpenses = expenses
                    .filter(e => e.projectId === project.id)
                    .reduce((sum, e) => sum + e.amount, 0);
                
                if (projectExpenses > project.budget) {
                    updates.push({ id: project.id, status: 'needs_review' });
                    
                    const msg = t.projectBudgetExceeded.replace('{project}', project.name);
                    events.push({
                        id: crypto.randomUUID(),
                        type: 'SMART_ALERT',
                        payload: { message: msg },
                        at: new Date().toISOString(),
                        lang: 'ar' // Defaulting to 'ar' or passed lang
                    });

                    logs.push({
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                        event: 'SMART_ALERT',
                        details: msg,
                        status: 'success'
                    });
                }
            }
        });

        return { projectUpdates: updates, events, logs };
    },

    /**
     * Checks for overdue debts and returns needed notifications.
     */
    checkOverdueDebts: (
        debts: Debt[],
        alertSettings: { enabled: boolean, days: number },
        alertedDebts: Set<string>,
        lang: LangCode,
        t: any
    ): { events: AppEvent[], logs: AutomationLog[], newAlertedIds: string[] } => {
        const events: AppEvent[] = [];
        const logs: AutomationLog[] = [];
        const newAlertedIds: string[] = [];

        if (!alertSettings.enabled) return { events, logs, newAlertedIds };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        debts.forEach(debt => {
            if ((debt.status === 'overdue' || debt.status === 'partial' || debt.status === 'pending') && !alertedDebts.has(debt.id)) {
                const due = new Date(debt.dueDate);
                if (due >= today) return; 

                const diffTime = today.getTime() - due.getTime();
                const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (daysOverdue > alertSettings.days) {
                    events.push({
                        id: crypto.randomUUID(),
                        type: 'DEBT_REMINDER_SEND',
                        payload: { 
                            recipientName: debt.customerName,
                            recipientEmail: debt.customerEmail,
                            recipientPhone: debt.customerPhone,
                            remainingAmount: debt.remainingAmount,
                            currency: debt.currency,
                            dueDate: debt.dueDate,
                            invoiceNumber: debt.invoiceNumber,
                        },
                        at: new Date().toISOString(),
                        lang,
                    });
                    
                    logs.push({
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                        event: 'DEBT_REMINDER_SEND',
                        details: `Overdue debt reminder sent to ${debt.customerName}`,
                        status: 'success'
                    });
                    
                    newAlertedIds.push(debt.id);
                }
            }
        });

        return { events, logs, newAlertedIds };
    }
};

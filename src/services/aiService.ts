
// Re-exporting decentralized AI services to maintain backward compatibility
// Phase 3 Refactor: AI logic moved to feature directories

export { analyzeFinancialHealth, generateStrategicAdvice } from '../features/dashboard/api/dashboardAiService';
export { analyzeProjectPerformance } from '../features/projects/api/projectAiService';
export { suggestBudgets, suggestExpenseCategory, suggestExpenseAccounts } from '../features/expenses/api/expenseAiService';
export { analyzeCustomerRisk } from '../features/customers/api/customerAiService';
export { generateStocktakeSummary, matchInvoiceItemsToProducts, suggestProductDetails, getStockoutPrediction, generateDemandForecast } from '../features/inventory/api/inventoryAiService';
export { extractInvoiceDataFromFile } from '../features/purchases/api/purchaseAiService';
export { suggestJournalEntryFromDescription, suggestAccountType } from '../features/accounting/api/accountingAiService';
export { suggestProductsForCustomer } from '../features/sales/api/salesAiService';

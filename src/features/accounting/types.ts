
import { CurrencyCode } from '../../types.base';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  company_id: string;
  accountNumber: string;
  name: string;
  type: AccountType;
  parentId?: string | null;
  isPlaceholder: boolean; // Cannot post transactions to this account
  balance: number; // Calculated field from view
  currency: CurrencyCode;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  note?: string;
}

export interface JournalEntry {
  id: string;
  company_id: string; // Critical for RLS
  date: string; // ISO string date
  description: string;
  lines: JournalEntryLine[];
  createdBy: string;
  referenceType?: 'sale' | 'purchase' | 'expense' | 'payment' | 'income' | 'closing_entry' | 'depreciation' | 'revaluation' | 'reconciliation' | 'adjustment' | 'tax_return';
  referenceId?: string;
}

export type FiscalYearStatus = 'open' | 'locked' | 'closed';

export interface FiscalYear {
  id: string;
  company_id: string;
  name: string; // e.g., "2024"
  startDate: string;
  endDate: string;
  status: FiscalYearStatus;
  closedAt?: string;
  closedBy?: string;
  netIncome?: number; // Snapshot of net income at closing
}

export type DepreciationMethod = 'straight_line' | 'declining_balance';
export type AssetStatus = 'active' | 'sold' | 'disposed' | 'fully_depreciated';

export interface FixedAsset {
  id: string;
  company_id: string;
  name: string;
  assetNumber: string; // Tag ID
  purchaseDate: string;
  cost: number;
  salvageValue: number; // Value at end of life
  usefulLifeMonths: number; // e.g. 60 for 5 years
  depreciationMethod: DepreciationMethod;
  status: AssetStatus;
  
  // Accounting Links
  assetAccountId: string; // Fixed Asset Account (Debit at purchase)
  accumulatedDepreciationAccountId: string; // Contra Asset (Credit during dep)
  depreciationExpenseAccountId: string; // Expense Account (Debit during dep)
  
  // Calculated / Snapshot fields
  currentBookValue?: number;
  totalDepreciated?: number;
  lastDepreciationDate?: string;
}

export interface ReconciliationSession {
    id: string;
    accountId: string;
    statementDate: string;
    statementBalance: number;
    ledgerBalance: number;
    status: 'draft' | 'reconciled';
    transactions: ReconciliationTransaction[];
}

export interface ReconciliationTransaction {
    id: string; // Journal Line ID
    date: string;
    description: string;
    amount: number; // Debit - Credit
    isCleared: boolean;
}

export interface TaxSummary {
    periodStart: string;
    periodEnd: string;
    totalSalesTaxable: number;
    totalOutputTax: number; // Collected from Sales
    totalPurchasesTaxable: number;
    totalInputTax: number; // Paid on Purchases
    netTaxPayable: number;
}

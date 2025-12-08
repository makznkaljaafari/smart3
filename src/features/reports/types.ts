
import { CurrencyCode } from '../../types.base';

// Matches view: vw_debts_aging_by_customer
export interface DebtsAgingRow {
  company_id: string;
  customer_id: string;
  customer_name: string;
  currency: CurrencyCode;
  total_outstanding: number;
  not_due: number;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  last_payment_date?: string;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

// Matches view: vw_account_balances
export interface AccountBalanceRow {
  account_id: string;
  account_number: string;
  account_name: string;
  account_type: AccountType;
  company_id: string;
  currency: CurrencyCode;
  total_debit: number;
  total_credit: number;
  balance: number;
  is_placeholder: boolean;
  parent_id?: string | null;
}

// Matches view: vw_income_statement_by_account
export interface IncomeStatementRow {
  account_id: string;
  account_number: string;
  account_name: string;
  account_type: 'revenue' | 'expense';
  company_id: string;
  currency: CurrencyCode;
  total_debit: number;
  total_credit: number;
  net_amount: number; // Revenue is positive, Expense is positive (magnitude) usually, or handled by logic
}

// Matches view: vw_balance_sheet_by_account
export interface BalanceSheetRow {
  account_id: string;
  account_number: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity';
  company_id: string;
  currency: CurrencyCode;
  total_debit: number;
  total_credit: number;
  balance: number;
}

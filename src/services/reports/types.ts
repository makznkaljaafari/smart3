
import { CurrencyCode } from '../../types.base';

export type TrialBalanceRow = {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  currency: CurrencyCode;
  totalDebit: number;
  totalCredit: number;
  balance: number;
};

export type IncomeStatementRow = {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: 'revenue' | 'expense';
  currency: CurrencyCode;
  totalDebit: number;
  totalCredit: number;
  netAmount: number;
};

export type BalanceSheetRow = {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity';
  currency: CurrencyCode;
  totalDebit: number;
  totalCredit: number;
  balance: number;
};

export type FinancialSummary = {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
};

export type DebtsAgingRow = {
  customerId: string;
  customerName: string;
  notDue: number;
  bucket0_30: number;
  bucket31_60: number;
  bucket61_90: number;
  bucket90Plus: number;
  totalOutstanding: number;
};

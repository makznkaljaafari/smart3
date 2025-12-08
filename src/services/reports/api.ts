
import { supabase } from '../../lib/supabaseClient';
import {
  TrialBalanceRow,
  IncomeStatementRow,
  BalanceSheetRow,
  FinancialSummary,
  DebtsAgingRow,
} from './types';

export async function fetchTrialBalance(params: {
  companyId: string;
  asOf: string; // 'YYYY-MM-DD'
}): Promise<TrialBalanceRow[]> {
  const { data, error } = await supabase.rpc('get_trial_balance', {
    p_company_id: params.companyId,
    p_as_of: params.asOf,
  });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    accountId: row.account_id,
    accountNumber: row.account_number,
    accountName: row.account_name,
    accountType: row.account_type,
    currency: row.currency,
    totalDebit: Number(row.total_debit ?? 0),
    totalCredit: Number(row.total_credit ?? 0),
    balance: Number(row.balance ?? 0),
  }));
}

export async function fetchIncomeStatement(params: {
  companyId: string;
  from: string; // 'YYYY-MM-DD'
  to: string;   // 'YYYY-MM-DD'
}): Promise<IncomeStatementRow[]> {
  const { data, error } = await supabase.rpc('get_income_statement', {
    p_company_id: params.companyId,
    p_from: params.from,
    p_to: params.to,
  });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    accountId: row.account_id,
    accountNumber: row.account_number,
    accountName: row.account_name,
    accountType: row.account_type,
    currency: row.currency,
    totalDebit: Number(row.total_debit ?? 0),
    totalCredit: Number(row.total_credit ?? 0),
    netAmount: Number(row.net_amount ?? 0),
  }));
}

export async function fetchBalanceSheet(params: {
  companyId: string;
  asOf: string; // 'YYYY-MM-DD'
}): Promise<BalanceSheetRow[]> {
  const { data, error } = await supabase.rpc('get_balance_sheet', {
    p_company_id: params.companyId,
    p_as_of: params.asOf,
  });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    accountId: row.account_id,
    accountNumber: row.account_number,
    accountName: row.account_name,
    accountType: row.account_type,
    currency: row.currency,
    totalDebit: Number(row.total_debit ?? 0),
    totalCredit: Number(row.total_credit ?? 0),
    balance: Number(row.balance ?? 0),
  }));
}

export async function fetchFinancialSummary(params: {
  companyId: string;
  from: string;
  to: string;
  asOf: string;
}): Promise<FinancialSummary> {
  const { data, error } = await supabase.rpc('get_financial_summary', {
    p_company_id: params.companyId,
    p_from: params.from,
    p_to: params.to,
    p_as_of: params.asOf,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    return {
      totalRevenue: 0,
      totalExpense: 0,
      netProfit: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
    };
  }

  return {
    totalRevenue: Number(row.total_revenue ?? 0),
    totalExpense: Number(row.total_expense ?? 0),
    netProfit: Number(row.net_profit ?? 0),
    totalAssets: Number(row.total_assets ?? 0),
    totalLiabilities: Number(row.total_liabilities ?? 0),
    totalEquity: Number(row.total_equity ?? 0),
  };
}

export async function fetchDebtsAging(params: {
  companyId: string;
  asOf: string;
}): Promise<DebtsAgingRow[]> {
  const { data, error } = await supabase.rpc('get_debts_aging', {
    p_company_id: params.companyId,
    p_as_of: params.asOf,
  });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    customerId: row.customer_id,
    customerName: row.customer_name,
    notDue: Number(row.not_due ?? 0),
    bucket0_30: Number(row.bucket_0_30 ?? 0),
    bucket31_60: Number(row.bucket_31_60 ?? 0),
    bucket61_90: Number(row.bucket_61_90 ?? 0),
    bucket90Plus: Number(row.bucket_90_plus ?? 0),
    totalOutstanding: Number(row.total_outstanding ?? 0),
  }));
}

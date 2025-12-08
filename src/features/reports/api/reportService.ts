
import { supabase } from '../../../lib/supabaseClient';
import { useZustandStore } from '../../../store/useStore';
import { getStore } from '../../../lib/storeAccess';
import { 
  DebtsAgingRow, 
  AccountBalanceRow, 
  IncomeStatementRow, 
  BalanceSheetRow 
} from '../types';

export interface PnLReport {
    revenue: number;
    cogs: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    breakdown: {
        revenue: Record<string, number>;
        expenses: Record<string, number>;
    };
}

export interface BalanceSheetReport {
    assets: number;
    liabilities: number;
    equity: number;
    breakdown: {
        assets: Record<string, number>;
        liabilities: Record<string, number>;
        equity: Record<string, number>;
    };
    isBalanced: boolean;
}

export const reportService = {
  async getDebtsAging() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
      .from('vw_debts_aging_by_customer')
      .select('*')
      .eq('company_id', companyId);

    return { data: (data as unknown as DebtsAgingRow[]) || [], error };
  },

  async getAccountBalances() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
      .from('vw_account_balances')
      .select('*')
      .eq('company_id', companyId)
      .order('account_number', { ascending: true });

    return { data: (data as unknown as AccountBalanceRow[]) || [], error };
  },

  // Fetches raw rows from View
  async getIncomeStatementRows() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
      .from('vw_income_statement_by_account')
      .select('*')
      .eq('company_id', companyId)
      .order('account_number', { ascending: true });

    return { data: (data as unknown as IncomeStatementRow[]) || [], error };
  },

  // Logic for UI consumption (PnL)
  async getIncomeStatement(): Promise<PnLReport & { data?: IncomeStatementRow[] }> {
    const { data, error } = await this.getIncomeStatementRows();
    if (error) throw error;

    const revenueRows = data.filter(r => r.account_type === 'revenue');
    const expenseRows = data.filter(r => r.account_type === 'expense');

    const totalRevenue = revenueRows.reduce((sum, r) => sum + (r.net_amount || 0), 0);
    const totalExpenses = expenseRows.reduce((sum, r) => sum + (r.net_amount || 0), 0);
    
    const revenueBreakdown: Record<string, number> = {};
    revenueRows.forEach(r => revenueBreakdown[r.account_name] = r.net_amount);

    const expenseBreakdown: Record<string, number> = {};
    expenseRows.forEach(r => expenseBreakdown[r.account_name] = r.net_amount);
    
    // Simplified COGS if no specific tag, assumed inside expenses for now
    const cogs = 0; 

    return {
        revenue: totalRevenue,
        cogs,
        grossProfit: totalRevenue - cogs,
        expenses: totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        breakdown: {
            revenue: revenueBreakdown,
            expenses: expenseBreakdown
        },
        data // pass through raw rows for detailed table
    };
  },

  // Fetches raw rows from View
  async getBalanceSheetRows() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
      .from('vw_balance_sheet_by_account')
      .select('*')
      .eq('company_id', companyId)
      .order('account_number', { ascending: true });

    return { data: (data as unknown as BalanceSheetRow[]) || [], error };
  },

  // Logic for UI consumption (Balance Sheet)
  async getBalanceSheet(): Promise<BalanceSheetReport & { data?: BalanceSheetRow[] }> {
      const { data, error } = await this.getBalanceSheetRows();
      if (error) throw error;
      
      const assets = data.filter(r => r.account_type === 'asset');
      const liabilities = data.filter(r => r.account_type === 'liability');
      const equity = data.filter(r => r.account_type === 'equity');

      const totalAssets = assets.reduce((sum, r) => sum + (r.balance || 0), 0);
      const totalLiabilities = liabilities.reduce((sum, r) => sum + (r.balance || 0), 0);
      const totalEquity = equity.reduce((sum, r) => sum + (r.balance || 0), 0);
      
      // Transform for breakdown maps
      const assetsMap: Record<string, number> = {};
      assets.forEach(r => assetsMap[r.account_name] = r.balance);
      
      const liabilitiesMap: Record<string, number> = {};
      liabilities.forEach(r => liabilitiesMap[r.account_name] = r.balance);
      
      const equityMap: Record<string, number> = {};
      equity.forEach(r => equityMap[r.account_name] = r.balance);

      // Basic Check: Assets = Liabilities + Equity
      // Note: Net Income might need to be added to Equity if not already closed
      const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1.0;

      return {
          assets: totalAssets,
          liabilities: totalLiabilities,
          equity: totalEquity,
          breakdown: {
              assets: assetsMap,
              liabilities: liabilitiesMap,
              equity: equityMap
          },
          isBalanced,
          data // pass through raw rows
      };
  }
};

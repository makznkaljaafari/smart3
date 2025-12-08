
import { supabase } from '../../../lib/supabaseClient';
import { keysToSnakeCase } from '../../../lib/utils';

export type CompanyAccountMap = {
  cashAccountId?: string;
  bankAccountId?: string;
  accountsReceivableId?: string;
  accountsPayableId?: string;
  defaultRevenueAccountId?: string;
  defaultExpenseAccountId?: string;
  inventoryAccountId?: string;
  cogsAccountId?: string;
  taxPayableAccountId?: string;
  defaultSalariesExpenseId?: string;
  defaultSalariesPayableId?: string;
  defaultGeneralExpenseAccountId?: string;
  defaultCashSalesAccountId?: string;
  defaultInventoryAdjustmentAccountId?: string;
};

const toUuidOrNull = (val: string | undefined | null) => {
    if (!val || typeof val !== 'string' || val.trim() === '') return null;
    return val;
};

export const accountMappingService = {
  /**
   * Fetches the default account mapping for the company from the backend.
   * This uses the `get_company_account_map` RPC function.
   */
  async getCompanyAccountMap(companyId: string): Promise<CompanyAccountMap | null> {
    if (!companyId) return null;

    const { data, error } = await supabase.rpc('get_company_account_map', { 
      p_company_id: companyId 
    });

    if (error) {
      console.error('Error fetching account map:', error);
      return null;
    }

    if (!data) return null;
    
    // Map backend JSON snake_case to frontend camelCase
    return {
      cashAccountId: data.cash_account_id,
      bankAccountId: data.bank_account_id,
      accountsReceivableId: data.accounts_receivable_id,
      accountsPayableId: data.accounts_payable_id,
      defaultRevenueAccountId: data.default_revenue_account_id,
      defaultExpenseAccountId: data.default_expense_account_id,
      inventoryAccountId: data.inventory_account_id,
      cogsAccountId: data.cogs_account_id,
      taxPayableAccountId: data.tax_payable_account_id,
      defaultSalariesExpenseId: data.default_salaries_expense_id,
      defaultSalariesPayableId: data.default_salaries_payable_id,
      defaultGeneralExpenseAccountId: data.default_general_expense_account_id,
      defaultCashSalesAccountId: data.default_cash_sales_account_id,
      defaultInventoryAdjustmentAccountId: data.default_inventory_adjustment_account_id,
    };
  },

  /**
   * Updates or Inserts the account mapping for the company.
   */
  async updateCompanyAccountMap(companyId: string, mapping: CompanyAccountMap) {
    // Map camelCase to snake_case manually to match DB columns exactly
    // Use toUuidOrNull to ensure empty strings become null (valid for UUID columns)
    const dbPayload: any = {
      company_id: companyId,
      cash_account_id: toUuidOrNull(mapping.cashAccountId),
      bank_account_id: toUuidOrNull(mapping.bankAccountId),
      accounts_receivable_id: toUuidOrNull(mapping.accountsReceivableId),
      accounts_payable_id: toUuidOrNull(mapping.accountsPayableId),
      default_revenue_account_id: toUuidOrNull(mapping.defaultRevenueAccountId),
      default_expense_account_id: toUuidOrNull(mapping.defaultExpenseAccountId),
      inventory_account_id: toUuidOrNull(mapping.inventoryAccountId),
      cogs_account_id: toUuidOrNull(mapping.cogsAccountId),
      tax_payable_account_id: toUuidOrNull(mapping.taxPayableAccountId),
      default_salaries_expense_id: toUuidOrNull(mapping.defaultSalariesExpenseId),
      default_salaries_payable_id: toUuidOrNull(mapping.defaultSalariesPayableId),
      default_general_expense_account_id: toUuidOrNull(mapping.defaultGeneralExpenseAccountId),
      default_cash_sales_account_id: toUuidOrNull(mapping.defaultCashSalesAccountId),
      default_inventory_adjustment_account_id: toUuidOrNull(mapping.defaultInventoryAdjustmentAccountId),
    };

    const { error } = await supabase
        .from('company_account_settings')
        .upsert(dbPayload, { onConflict: 'company_id' });

    return { error };
  }
};

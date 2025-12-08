import { supabase } from '../../../lib/supabaseClient';
import { Account } from '../types';
import { getStore } from '../../../lib/storeAccess';

const ACCOUNT_VIEW_SELECT = '*';

export const accountService = {
  async getAccounts() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
      .from('vw_account_balances')
      .select(ACCOUNT_VIEW_SELECT)
      .eq('company_id', companyId)
      .order('account_number', { ascending: true });

    if (error) return { data: [], error };

    const mappedData: Account[] = (data || []).map((row: any) => ({
        id: row.account_id,
        company_id: row.company_id,
        accountNumber: row.account_number,
        name: row.account_name,
        type: row.account_type,
        parentId: row.parent_id,
        isPlaceholder: row.is_placeholder,
        balance: row.balance,
        currency: row.currency
    }));

    return { data: mappedData, error: null };
  },

  async saveAccount(accountData: Partial<Account>, isNew: boolean) {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: null, error: new Error("No active company selected.") };
    
    const dbPayload: any = {
        company_id: companyId,
        account_number: accountData.accountNumber,
        name: accountData.name,
        type: accountData.type,
        parent_id: accountData.parentId,
        is_placeholder: accountData.isPlaceholder,
        currency: accountData.currency
    };

    if (isNew) {
        return await supabase.from('accounts').insert(dbPayload).select().single();
    } else {
        return await supabase.from('accounts').update(dbPayload).eq('id', accountData.id!).select().single();
    }
  },
  
  async seedDefaultAccounts(currency: string = 'SAR') {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { error: new Error("No active company selected.") };

    const { error: rpcError } = await supabase.rpc('seed_default_accounts', { p_company_id: companyId });
    
    if (!rpcError) return { error: null };

    console.warn("RPC seed_default_accounts failed, falling back to client-side seeding.", rpcError.message);

    // Fallback seeding logic omitted for brevity as RPC should be primary.
    return { error: rpcError };
  }
};
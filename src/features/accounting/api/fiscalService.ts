
import { supabase } from '../../../lib/supabaseClient';
import { FiscalYear } from '../../accounting/types';
import { getStore } from '../../../lib/storeAccess';

export const fiscalService = {
  async getFiscalYears() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
        .from('fiscal_years')
        .select('*')
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });

    if (error) {
        return { data: [], error };
    }

    const mappedData: FiscalYear[] = data.map((row: any) => ({
        id: row.id,
        company_id: row.company_id,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        closedAt: row.closed_at,
        closedBy: row.closed_by,
        netIncome: row.net_income
    }));

    return { data: mappedData, error: null };
  },

  async createFiscalYear(yearData: Partial<FiscalYear>) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: null, error: new Error("No company") };

      const { data, error } = await supabase.from('fiscal_years').insert({
          company_id: companyId,
          name: yearData.name,
          start_date: yearData.startDate,
          end_date: yearData.endDate,
          status: 'open'
      }).select().single();

      if (error) return { data: null, error };

      return { 
          data: {
              id: data.id,
              company_id: data.company_id,
              name: data.name,
              startDate: data.start_date,
              endDate: data.end_date,
              status: data.status
          } as FiscalYear, 
          error: null 
      };
  },

  async closeFiscalYear(yearId: string, closingData: any) {
      const companyId = getStore().getState().currentCompany?.id;
      const user = getStore().getState().authUser;
      const settings = getStore().getState().settings;
      
      if (!companyId || !user) return { error: new Error("Context missing") };

      let retainedId = settings.accounting.defaultEquityAccountId; 

      if (!retainedId) {
          // Fallback if not configured: Try to find an Equity account named 'Retained Earnings'
          const { data: accounts } = await supabase.from('accounts').select('id').eq('company_id', companyId).ilike('name', '%Retained%').single();
          retainedId = accounts?.id;
      }

      if (!retainedId) {
          console.warn("Retained Earnings account not found. Closing might fail on backend.");
          // Ideally throw error here or user notification
      }

      const { error } = await supabase.rpc('close_fiscal_year', {
          p_year_id: yearId,
          p_retained_earnings_account_id: retainedId || null, 
          p_closing_date: new Date().toISOString().split('T')[0],
          p_user_id: user.id
      });
      
      return { error };
  },
  
  async lockPeriod(yearId: string) {
      const { error } = await supabase
        .from('fiscal_years')
        .update({ status: 'locked' })
        .eq('id', yearId);
      return { error };
  }
};

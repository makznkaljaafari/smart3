
import { supabase } from '../../../lib/supabaseClient';
import { keysToSnakeCase } from '../../../lib/utils';
import { Income, IncomeCategory, IncomeStatus } from '../types';
import { getStore } from '../../../lib/storeAccess';
import { journalService } from '../../../services/accounting/journalService';

const INCOME_COLUMNS = `
    id, company_id, title, description, category, amount, currency, 
    date:income_date, status,
    customerId:customer_id, customerName:customers(name),
    source, invoiceNumber:invoice_number, receiptNumber:receipt_number,
    notes, tags, createdDate:created_at, updatedDate:updated_at, recurrence, 
    isRecurringTemplate:is_recurring_template, lastRecurrenceDate:last_recurrence_date,
    incomeAccountId:income_account_id, depositAccountId:deposit_account_id, projectId:project_id
`;

export interface GetIncomeParams {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: IncomeCategory | 'all';
    status?: IncomeStatus | 'all';
    dateFrom?: string;
    dateTo?: string;
}

export const incomeService = {
  async getIncomePaginated({ 
      page = 1, pageSize = 10, search = '', category = 'all',
      status = 'all', dateFrom, dateTo
  }: GetIncomeParams) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: [], count: 0, error: new Error("No active company") };

      let query = supabase
        .from('income')
        .select(INCOME_COLUMNS, { count: 'exact' })
        .eq('company_id', companyId);

      if (search) query = query.or(`title.ilike.%${search}%,source.ilike.%${search}%,invoice_number.ilike.%${search}%`);
      if (category !== 'all') query = query.eq('category', category);
      if (status !== 'all') query = query.eq('status', status);
      if (dateFrom) query = query.gte('income_date', dateFrom);
      if (dateTo) query = query.lte('income_date', dateTo);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query.order('income_date', { ascending: false }).range(from, to);
      
      if (error) return { data: [], count: 0, error };

      const mappedData = (data || []).map((item: any) => ({
          ...item,
          customerName: item.customerName?.name || null,
          source: item.source || item.customerName?.name || ''
      }));

      return { data: (mappedData as Income[]) || [], count: count || 0, error };
  },

  async getIncome() {
    return this.getIncomePaginated({ page: 1, pageSize: 1000 });
  },

  async getIncomeStats(dateFrom?: string) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: null, error: new Error("No active company") };

      let query = supabase
        .from('income')
        .select('amount, income_date, currency, source, project_id, category')
        .eq('company_id', companyId);
        
      if (dateFrom) {
          query = query.gte('income_date', dateFrom);
      }

      const { data, error } = await query;
      
      const mappedData = (data || []).map((d: any) => ({ ...d, date: d.income_date, projectId: d.project_id }));

      return { data: mappedData, error };
  },
  
  async getIncomeReportData(dateFrom?: Date) {
       const companyId = getStore().getState().currentCompany?.id;
       if (!companyId) return { data: [], error: new Error("No active company") };

       let query = supabase.from('income').select('category, amount, income_date').eq('company_id', companyId);
       if (dateFrom) query = query.gte('income_date', dateFrom.toISOString());
       
       const { data, error } = await query;
       const mappedData = (data || []).map((d: any) => ({ ...d, date: d.income_date }));
       return { data: mappedData, error };
  },

  async saveIncome(incomeData: Partial<Income>, isNew: boolean) {
    const { currentCompany, authUser } = getStore().getState();
    if (!currentCompany) return { data: null, error: new Error("No active company selected.") };

    const dataToSave: any = { ...incomeData, company_id: currentCompany.id };
    if (dataToSave.date) { dataToSave.income_date = dataToSave.date; delete dataToSave.date; }
    delete dataToSave.customerName;

    const snakeCaseData = keysToSnakeCase(dataToSave);
    let result;
    
    if (isNew) {
      delete (snakeCaseData as any).id;
      result = await supabase.from('income').insert(snakeCaseData).select(INCOME_COLUMNS).single();
    } else {
      result = await supabase.from('income').update(snakeCaseData).eq('id', incomeData.id!).select(INCOME_COLUMNS).single();
    }

    if (result.error) return result;

    const savedIncome = {
        ...result.data,
        customerName: result.data.customerName?.name || null
    };

    // Call accounting RPC if received
    if (isNew && result.data && result.data.status === 'received') {
        try {
            await journalService.createCashIncome({
                companyId: currentCompany.id,
                amount: result.data.amount,
                date: result.data.income_date,
                notes: result.data.description || result.data.title,
                createdBy: authUser?.id
            });
        } catch (rpcError) {
             console.error("Accounting RPC post_cash_income failed:", rpcError);
        }
    }

    return { data: savedIncome, error: null };
  },

  async deleteIncome(incomeId: string) {
    return await supabase.from('income').delete().eq('id', incomeId);
  }
};

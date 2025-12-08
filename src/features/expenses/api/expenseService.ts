
import { supabase } from '../../../lib/supabaseClient';
import { keysToSnakeCase } from '../../../lib/utils';
import { Expense, ExpenseCategory, ExpenseStatus, ExpensePriority } from '../types';
import { getStore } from '../../../lib/storeAccess';
import { PaymentOutDetails } from '../../payments/types';
import { journalService } from '../../../services/accounting/journalService';

const EXPENSE_COLUMNS = `
    id, company_id, title, description, category, amount, currency, 
    date:expense_date, dueDate:due_date, paidDate:paid_date, 
    status, priority, paymentMethod:payment_method, 
    vendor:vendor_name, vendorPhone:vendor_phone, vendorEmail:vendor_email,
    supplierId:supplier_id, supplierName:suppliers(name),
    invoiceNumber:invoice_number, receiptNumber:receipt_number, 
    notes, tags, 
    createdDate:created_at, updatedDate:updated_at, 
    isRecurringTemplate:is_recurring_template, lastRecurrenceDate:last_recurrence_date,
    expenseAccountId:expense_account_id, paymentAccountId:payment_account_id,
    projectId:project_id
`;

export interface GetExpensesParams {
    page?: number;
    pageSize?: number;
    category?: ExpenseCategory | 'all';
    status?: ExpenseStatus | 'all';
    priority?: ExpensePriority | 'all';
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}

export const expenseService = {
  async getExpensesPaginated({ 
      page = 1, pageSize = 10, category = 'all', status = 'all', 
      priority = 'all', search = '', dateFrom, dateTo 
  }: GetExpensesParams) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: [], count: 0, error: new Error("No active company") };

      let query = supabase
        .from('expenses')
        .select(EXPENSE_COLUMNS, { count: 'exact' })
        .eq('company_id', companyId);

      if (category !== 'all') query = query.eq('category', category);
      if (status !== 'all') query = query.eq('status', status);
      if (priority !== 'all') query = query.eq('priority', priority);
      if (dateFrom) query = query.gte('expense_date', dateFrom);
      if (dateTo) query = query.lte('expense_date', dateTo);
      if (search) query = query.or(`title.ilike.%${search}%,vendor_name.ilike.%${search}%`);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, count, error } = await query.order('expense_date', { ascending: false }).range(from, to);

      if (error) return { data: [], count: 0, error };

      const mappedData = data.map((e: any) => ({
          ...e,
          supplierName: e.supplierName?.name || null,
          vendor: e.supplierName?.name || e.vendor
      }));

      return { data: (mappedData as Expense[]) || [], count: count || 0, error };
  },

  async getExpenseStats(dateFrom?: string) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: null, error: new Error("No active company") };
      
      let query = supabase.from('expenses').select('category, amount, expense_date, project_id').eq('company_id', companyId);
      
      if (dateFrom) {
          query = query.gte('expense_date', dateFrom);
      }

      const { data, error } = await query;
      const mappedData = (data || []).map((d: any) => ({ ...d, date: d.expense_date, projectId: d.project_id }));
      return { data: mappedData, error };
  },
  
  async getExpensesReportData(dateFrom?: Date) {
       const companyId = getStore().getState().currentCompany?.id;
       if (!companyId) return { data: [], error: new Error("No active company") };

       let query = supabase.from('expenses').select('category, amount, expense_date, project_id').eq('company_id', companyId);
       if (dateFrom) query = query.gte('expense_date', dateFrom.toISOString());
       
       const { data, error } = await query;
       const mappedData = (data || []).map((d: any) => ({ ...d, date: d.expense_date }));
       return { data: mappedData, error };
  },

  async getExpenses() {
    return this.getExpensesPaginated({ page: 1, pageSize: 1000 });
  },

  async saveExpense(expenseData: Partial<Expense>, isNew: boolean) {
    const { currentCompany, authUser } = getStore().getState();
    if (!currentCompany) return { data: null, error: new Error("No active company selected.") };
    
    const dataToSave: any = { ...expenseData, company_id: currentCompany.id };
    if (dataToSave.date) { dataToSave.expense_date = dataToSave.date; delete dataToSave.date; }
    if (dataToSave.vendor) { dataToSave.vendor_name = dataToSave.vendor; delete dataToSave.vendor; }
    delete dataToSave.supplierName;

    const snakeCaseData = keysToSnakeCase(dataToSave);
    let result;

    if (isNew) {
      delete (snakeCaseData as any).id;
      result = await supabase.from('expenses').insert(snakeCaseData).select().single();
    } else {
      result = await supabase.from('expenses').update(snakeCaseData).eq('id', expenseData.id!).select().single();
    }

    if (result.error) return result;

    // Call accounting RPC if paid
    if (isNew && result.data && result.data.status === 'paid') {
        try {
            await journalService.createCashExpense({
                companyId: currentCompany.id,
                amount: result.data.amount,
                date: result.data.expense_date,
                notes: result.data.description || result.data.title,
                createdBy: authUser?.id
            });
        } catch (rpcError) {
            console.error("Accounting RPC post_cash_expense failed:", rpcError);
        }
    }

    return result;
  },

  async deleteExpense(expenseId: string) {
    return await supabase.from('expenses').delete().eq('id', expenseId);
  },
  
  async importExpenses(expenses: Partial<Expense>[]) {
      return { data: null, error: new Error("Not implemented yet") };
  },

  async recordPayment(expenseId: string, paymentDetails: PaymentOutDetails) {
     return { data: null, error: new Error("Use debt payment flow for now") };
  }
};

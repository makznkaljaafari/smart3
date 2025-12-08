
import { supabase } from '../../../lib/supabaseClient';
import { keysToSnakeCase } from '../../../lib/utils';
import { Debt, DebtPaymentDetails, DebtStatus } from '../types';
import { getStore } from '../../../lib/storeAccess';

const DEBT_COLUMNS_WITH_JOIN = `
    id, company_id, customerId:customer_id, amount, currency, paidAmount:paid_amount, 
    remainingAmount:remaining_amount, dueDate:due_date, createdDate:created_date, status, 
    description, notes, lastPaymentDate:last_payment_date, invoiceNumber:invoice_number, 
    category, tags, 
    customers!inner(name, phone, email, company_name), 
    payments:debt_payments(
        id, debt_id, company_id, amount, currency, date:payment_date, method, notes, 
        receiptNumber:receipt_number, exchangeRateUsed:exchange_rate_used, 
        amountInDebtCurrency:amount_in_debt_currency
    )
`;

export interface GetDebtsParams {
    page?: number;
    pageSize?: number;
    status?: DebtStatus | 'all';
    search?: string;
}

export const debtService = {
  async getDebtsPaginated({ page = 1, pageSize = 10, status = 'all', search = '' }: GetDebtsParams) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: [], count: 0, error: new Error("No active company") };

      let query = supabase
        .from('debts')
        .select(DEBT_COLUMNS_WITH_JOIN, { count: 'exact' })
        .eq('company_id', companyId);

      if (status !== 'all') {
          query = query.eq('status', status);
      }

      if (search) {
          query = query.or(`invoice_number.ilike.%${search}%,description.ilike.%${search}%,customers.name.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('due_date', { ascending: false })
        .range(from, to);

      if (error) return { data: [], count: 0, error };

      const mappedData = data.map((d: any) => {
        const { customers, ...debt } = d;
        return {
            ...debt,
            customerName: customers?.name || 'Unknown',
            customerPhone: customers?.phone || '',
            customerEmail: customers?.email || '',
            customerCompany: customers?.company_name || '',
        };
    });

    return { data: mappedData as Debt[], count: count || 0, error: null };
  },

  async getDebtStats() {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: null, error: new Error("No active company") };

      const { data, error } = await supabase
          .from('debts')
          .select('amount, paid_amount, remaining_amount, status, due_date, currency')
          .eq('company_id', companyId);

      return { data, error };
  },

  async getDebts() {
    return this.getDebtsPaginated({ page: 1, pageSize: 1000 });
  },

  async saveDebt(debtData: Partial<Debt>, isNew: boolean) {
    const { currentCompany } = getStore().getState();
    if (!currentCompany) return { data: null, error: new Error("No active company selected.") };
    
    if (isNew) {
        // Assuming a simpler create_debt RPC might exist or just standard insert if logic is simple
        const dataToSave: any = { 
             company_id: currentCompany.id,
             customer_id: debtData.customerId,
             amount: debtData.amount,
             currency: debtData.currency,
             due_date: debtData.dueDate,
             description: debtData.description,
             invoice_number: debtData.invoiceNumber,
             category: debtData.category,
             notes: debtData.notes,
             status: 'pending',
             paid_amount: 0,
             remaining_amount: debtData.amount
        };

        const { data, error } = await supabase.from('debts').insert(dataToSave).select().single();
        return { data, error };
    } else {
        const dataToSave: any = { ...debtData, company_id: currentCompany.id };
        delete dataToSave.payments; 
        delete dataToSave.remainingAmount; // Handled by trigger usually
        delete dataToSave.customerName;
        delete dataToSave.customerPhone;
        delete dataToSave.customerEmail;
        delete dataToSave.customerCompany;

        const snakeCaseData = keysToSnakeCase(dataToSave);
        return await supabase.from('debts').update(snakeCaseData).eq('id', debtData.id!).select('id, amount, currency, due_date').single();
    }
  },

  async deleteDebt(debtId: string) {
    return await supabase.from('debts').delete().eq('id', debtId);
  },

  async recordPayment(debtId: string, paymentData: DebtPaymentDetails) {
    const { currentCompany, authUser } = getStore().getState();
    if (!currentCompany || !authUser) return { data: null, error: new Error("Context missing.") };

    // Call the specific multi-currency payment RPC
    const { data: result, error: rpcError } = await supabase.rpc('add_debt_payment_multi_currency', {
        p_company_id: currentCompany.id,
        p_debt_id: debtId,
        p_payment_amount: paymentData.amount,
        p_payment_currency: paymentData.currency,
        p_payment_date: paymentData.date,
        p_method: paymentData.method,
        p_deposit_account_id: paymentData.depositAccountId || null,
        p_notes: paymentData.notes || null,
        p_created_by: authUser.id
    });

    if (rpcError) {
        console.error("RPC add_debt_payment_multi_currency failed:", rpcError);
        return { data: null, error: rpcError };
    }

    return { data: result, error: null };
  }
};

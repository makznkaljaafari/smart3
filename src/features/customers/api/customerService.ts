
import { supabase } from '../../../lib/supabaseClient';
import { keysToSnakeCase } from '../../../lib/utils';
import { Customer, CustomerStatus, RiskLevel } from '../types';
import { getStore } from '../../../lib/storeAccess';

// Updated columns to match database schema
const CUSTOMER_COLUMNS = 'id, company_id, name, phone, email, address, national_id, company_name, notes, status, risk_level, currency, created_at, updated_at, total_transactions';

export interface GetCustomersParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: CustomerStatus | 'all';
    riskLevel?: RiskLevel | 'all';
}

/**
 * Service object for all customer-related database operations.
 */
export const customerService = {
  /**
   * Fetches paginated customers from the database.
   */
  async getCustomersPaginated({ page = 1, pageSize = 10, search = '', status = 'all', riskLevel = 'all' }: GetCustomersParams) {
      try {
          // Verify store is initialized to prevent crash
          let companyId;
          try {
              companyId = getStore().getState().currentCompany?.id;
          } catch (e) {
              return { data: [], count: 0, error: new Error("Store not initialized") };
          }
          
          if (!companyId) return { data: [], count: 0, error: new Error("No active company") };

          let query = supabase
            .from('customers')
            .select(CUSTOMER_COLUMNS, { count: 'exact' })
            .eq('company_id', companyId);
          
          // Search
          if (search) {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
          }

          // Filters
          if (status !== 'all') {
            query = query.eq('status', status);
          }
          if (riskLevel !== 'all') {
            query = query.eq('risk_level', riskLevel);
          }

          // Pagination
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          
          const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);
          
          if (error) {
              throw error;
          }

          // Map the raw data to the Customer type
          const mappedData: Customer[] = (data || []).map((c: any) => ({
              id: c.id,
              company_id: c.company_id,
              name: c.name,
              phone: c.phone,
              email: c.email,
              address: c.address,
              nationalId: c.national_id,
              company: c.company_name, // Mapped from company_name
              notes: c.notes,
              status: c.status,
              riskLevel: c.risk_level,
              currency: c.currency || 'SAR',
              createdAt: c.created_at,
              updatedAt: c.updated_at,
              totalTransactions: c.total_transactions || 0,
              
              // Default values for calculated fields (these would ideally come from a view)
              totalDebt: 0,
              paidAmount: 0,
              remainingDebt: 0,
              lastTransaction: undefined,
              avatar: null
          }));

          return { data: mappedData, count: count || 0, error: null };
      } catch (error: any) {
          console.error("Error fetching customers:", error);
          // Handle Network Errors specifically
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
               return { data: [], count: 0, error: new Error("Network error: Could not connect to database. Please check your internet connection.") };
          }
          return { data: [], count: 0, error: error };
      }
  },

  /**
   * Fetches customer statistics for the dashboard cards.
   */
  async getCustomerStats() {
      try {
          const companyId = getStore().getState().currentCompany?.id;
          if (!companyId) return { data: null, error: new Error("No active company") };
          
          const activeQuery = supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active');
          const highRiskQuery = supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('risk_level', 'high');
          
          // To calculate total debt without a view, we sum the 'debts' table
          const debtQuery = supabase.from('debts').select('remaining_amount').eq('company_id', companyId);
          
          const [activeRes, highRiskRes, debtRes] = await Promise.all([activeQuery, highRiskQuery, debtQuery]);
          
          const totalDebt = debtRes.data?.reduce((sum, d: any) => sum + (d.remaining_amount || 0), 0) || 0;

          return {
              data: {
                  active: activeRes.count || 0,
                  highRisk: highRiskRes.count || 0,
                  totalDebt: totalDebt
              },
              error: activeRes.error || highRiskRes.error || debtRes.error
          };
      } catch (error: any) {
          console.error("Error fetching customer stats:", error);
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
              return { data: null, error: new Error("Network error") };
          }
          return { data: null, error };
      }
  },

  /**
   * Fetches all customers (Legacy).
   */
  async getCustomers() {
    return this.getCustomersPaginated({ page: 1, pageSize: 1000 });
  },

  /**
   * Creates or updates a customer record.
   */
  async saveCustomer(customerData: Partial<Customer>, isNew: boolean) {
    try {
        const companyId = getStore().getState().currentCompany?.id;
        if (!companyId) return { data: null, error: new Error("No active company selected.") };
        
        // Remove calculated fields and non-existent columns
        const { totalDebt, paidAmount, remainingDebt, totalTransactions, lastTransaction, avatar, updatedAt, ...saveableData } = customerData;

        const dataToSave: any = { ...saveableData, company_id: companyId };
        
        // Handle company name mapping for save
        if (dataToSave.company) {
            dataToSave.company_name = dataToSave.company;
            delete dataToSave.company;
        }

        const snakeCaseData = keysToSnakeCase(dataToSave);

        // Ensure we don't send ID on insert
        if (isNew) {
            delete (snakeCaseData as any).id;
        }

        const query = isNew
          ? supabase.from('customers').insert(snakeCaseData)
          : supabase.from('customers').update(snakeCaseData).eq('id', customerData.id!);

        const { data, error } = await query.select(CUSTOMER_COLUMNS).single();
        
        if (error) {
            throw error;
        }

        // Map result back to full object with defaults
        const mappedData: Customer = {
              id: data.id,
              company_id: data.company_id,
              name: data.name,
              phone: data.phone,
              email: data.email,
              address: data.address,
              nationalId: data.national_id,
              company: data.company_name,
              notes: data.notes,
              status: data.status,
              riskLevel: data.risk_level,
              currency: data.currency || 'SAR',
              createdAt: data.created_at,
              updatedAt: data.updated_at,
              totalTransactions: data.total_transactions || 0,
              avatar: null,
              totalDebt: 0,
              paidAmount: 0,
              remainingDebt: 0,
        };

        return { data: mappedData, error: null };
    } catch (error: any) {
        console.error("Error saving customer:", error);
        return { data: null, error };
    }
  },

  /**
   * Deletes a customer from the database.
   */
  async deleteCustomer(customerId: string) {
    return await supabase.from('customers').delete().eq('id', customerId);
  },

  /**
   * Deletes multiple customers from the database.
   */
  async deleteCustomers(customerIds: string[]) {
    return await supabase.from('customers').delete().in('id', customerIds);
  }
};

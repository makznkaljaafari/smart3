import { supabase } from '../../../lib/supabaseClient';
import { keysToSnakeCase } from '../../../lib/utils';
import { Supplier } from '../types';
import { getStore } from '../../../lib/storeAccess';

const SUPPLIER_COLUMNS = 'id, company_id, name, contactPerson:contact_person, phone, email, address, notes, createdAt:created_at, totalPurchasesValue:total_purchases_value, outstandingBalance:outstanding_balance, currency';

export interface GetSuppliersParams {
    page?: number;
    pageSize?: number;
    search?: string;
}

export const supplierService = {
  async getSuppliersPaginated({ page = 1, pageSize = 10, search = '' }: GetSuppliersParams) {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], count: 0, error: new Error("No active company") };

    let query = supabase
      .from('suppliers')
      .select(SUPPLIER_COLUMNS, { count: 'exact' })
      .eq('company_id', companyId);

    if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,contact_person.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    return { data: (data as Supplier[]) || [], count: count || 0, error };
  },

  async getSupplierStats() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: null, error: new Error("No active company") };

    const { data, error } = await supabase
      .from('suppliers')
      .select('total_purchases_value, outstanding_balance')
      .eq('company_id', companyId);

    return { data, error };
  },

  async getSuppliers() {
    return this.getSuppliersPaginated({ page: 1, pageSize: 1000 });
  },

  async saveSupplier(supplierData: Partial<Supplier>, isNew: boolean) {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: null, error: new Error("No active company selected.") };
    
    const dataToSave = { ...supplierData, company_id: companyId };
    const snakeCaseData = keysToSnakeCase(dataToSave);

    if (isNew) {
        delete (snakeCaseData as any).id;
    }

    const query = isNew
      ? supabase.from('suppliers').insert(snakeCaseData)
      : supabase.from('suppliers').update(snakeCaseData).eq('id', supplierData.id!);

    return await query.select(SUPPLIER_COLUMNS).single();
  },

  async deleteSupplier(supplierId: string) {
    return await supabase.from('suppliers').delete().eq('id', supplierId);
  }
};
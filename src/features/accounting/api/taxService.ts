
import { supabase } from '../../../lib/supabaseClient';
import { getStore } from '../../../lib/storeAccess';
import { TaxSummary } from '../../accounting/types';

export const taxService = {
  /**
   * Calculates the VAT return for a specific period.
   * It aggregates Output Tax (Sales) and Input Tax (Purchases/Expenses).
   */
  async getTaxSummary(startDate: string, endDate: string): Promise<{ data: TaxSummary | null, error: any }> {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: null, error: new Error("No active company") };

    // 1. Sales (Output Tax)
    const { data: sales, error: salesError } = await supabase
        .from('sales_invoices')
        .select('subtotal, tax_total')
        .eq('company_id', companyId)
        .neq('status', 'void')
        .neq('status', 'cancelled')
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

    if (salesError) return { data: null, error: salesError };

    // 2. Purchases (Input Tax)
    const { data: purchases, error: purchaseError } = await supabase
        .from('purchase_invoices')
        .select('subtotal, tax_total')
        .eq('company_id', companyId)
        .neq('status', 'cancelled')
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

    if (purchaseError) return { data: null, error: purchaseError };

    // 3. Aggregate
    const totalSalesTaxable = sales.reduce((sum: number, inv: any) => sum + inv.subtotal, 0);
    const totalOutputTax = sales.reduce((sum: number, inv: any) => sum + inv.tax_total, 0);

    const totalPurchasesTaxable = purchases.reduce((sum: number, inv: any) => sum + inv.subtotal, 0);
    const totalInputTax = purchases.reduce((sum: number, inv: any) => sum + inv.tax_total, 0);

    const netTaxPayable = totalOutputTax - totalInputTax;

    return {
        data: {
            periodStart: startDate,
            periodEnd: endDate,
            totalSalesTaxable,
            totalOutputTax,
            totalPurchasesTaxable,
            totalInputTax,
            netTaxPayable
        },
        error: null
    };
  }
};

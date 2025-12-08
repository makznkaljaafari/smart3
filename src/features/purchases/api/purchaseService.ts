import { supabase } from '../../../lib/supabaseClient';
import { PaymentMethod } from '../../debts/types';
import { CurrencyCode } from '../../../types.base';
import { getStore } from '../../../lib/storeAccess';
import { PurchaseInvoice } from '../types';
import { PaymentOutDetails } from '../../payments/types';
import { debtService } from '../../../services/debtService';
import { PurchaseInvoiceWithRelations } from '../../../types/database';
import { keysToSnakeCase } from '../../../lib/utils';
import { journalService } from '../../../services/accounting/journalService';

const PURCHASE_COLUMNS = `
  id, company_id, suppliers(name), invoice_number, 
  invoice_date, due_date,
  subtotal, discount_total, tax_total, total, 
  status, notes, currency,
  amount_paid, remaining_amount,
  purchase_invoice_items(product_id, quantity, unit_cost, line_total, products(name))
`;

export interface GetPurchasesParams {
    page?: number;
    pageSize?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}

export const purchaseService = {
  async getPurchasesPaginated({ page = 1, pageSize = 10, search = '', dateFrom, dateTo }: GetPurchasesParams) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: [], count: 0, error: new Error("No active company") };

      let query = supabase
        .from('purchase_invoices')
        .select(PURCHASE_COLUMNS, { count: 'exact' })
        .eq('company_id', companyId);

      if (search) query = query.or(`invoice_number.ilike.%${search}%`);
      if (dateFrom) query = query.gte('invoice_date', dateFrom);
      if (dateTo) query = query.lte('invoice_date', dateTo);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, count, error } = await query.order('invoice_date', { ascending: false }).range(from, to);
      
      if (error) return { data: [], count: 0, error };

      const rawData = (data || []) as unknown as PurchaseInvoiceWithRelations[];

      const mappedData: PurchaseInvoice[] = rawData.map((d) => ({
        id: d.id,
        company_id: d.company_id,
        supplierId: d.supplier_id || undefined,
        supplierName: d.suppliers?.name || 'Unknown',
        invoiceNumber: d.invoice_number,
        date: d.invoice_date,
        dueDate: d.due_date,
        subtotal: d.subtotal,
        discountValue: d.discount_total,
        discountType: 'fixed',
        taxValue: d.tax_total,
        taxType: 'fixed',
        total: d.total,
        amountPaid: d.amount_paid,
        remainingAmount: d.remaining_amount,
        paymentMethod: 'cash', 
        status: d.status as PurchaseInvoice['status'],
        notes: d.notes,
        currency: (d.currency as CurrencyCode) || 'SAR',
        items: (d.purchase_invoice_items || []).map((i) => ({
            productId: i.product_id,
            productName: i.products?.name || 'N/A',
            quantity: i.quantity,
            unitPrice: i.unit_cost,
            total: i.line_total
        }))
    }));

    return { data: mappedData, count: count || 0, error: null };
  },

  async getPurchaseStats() {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: null, error: new Error("No active company") };
      
      const today = new Date().toISOString().split('T')[0];
      const { data: todaysPurchases, error: purchaseError } = await supabase
        .from('purchase_invoices')
        .select('total')
        .eq('company_id', companyId)
        .eq('invoice_date', today);

      if (purchaseError) return { data: null, error: purchaseError };

      const totalPurchases = (todaysPurchases || []).reduce((sum, s) => sum + s.total, 0) || 0;
      return {
          data: { todayTotal: totalPurchases, todayCount: todaysPurchases?.length || 0, todayReturns: 0, netPurchases: totalPurchases },
          error: null
      };
  },
  
  async getPurchases() { return this.getPurchasesPaginated({ page: 1, pageSize: 1000 }); },
  
  async getPurchaseByInvoiceNumber(invoiceNumber: string) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: null, error: new Error("No active company") };

      const { data, error } = await supabase
        .from('purchase_invoices')
        .select(PURCHASE_COLUMNS)
        .eq('company_id', companyId)
        .eq('invoice_number', invoiceNumber)
        .single();

      if (error) return { data: null, error };
      
      const d = data as unknown as PurchaseInvoiceWithRelations;
      
      const mappedData: PurchaseInvoice = {
        id: d.id,
        company_id: d.company_id,
        supplierId: d.supplier_id || undefined,
        supplierName: d.suppliers?.name || 'Unknown',
        invoiceNumber: d.invoice_number,
        date: d.invoice_date,
        dueDate: d.due_date,
        subtotal: d.subtotal,
        discountValue: d.discount_total,
        discountType: 'fixed',
        taxValue: d.tax_total,
        taxType: 'fixed',
        total: d.total,
        amountPaid: d.amount_paid,
        remainingAmount: d.remaining_amount,
        paymentMethod: 'cash',
        status: d.status as PurchaseInvoice['status'],
        notes: d.notes,
        currency: (d.currency as CurrencyCode) || 'SAR',
        items: (d.purchase_invoice_items || []).map((i) => ({
            productId: i.product_id,
            productName: i.products?.name || 'N/A',
            quantity: i.quantity,
            unitPrice: i.unit_cost,
            total: i.line_total
        }))
      };

      return { data: mappedData, error: null }; 
  },

  async createPurchase(purchaseData: {
    supplierName: string;
    invoiceNumber: string;
    currency: CurrencyCode;
    items: { product_id: string; warehouse_id: string; quantity: number; price: number; description?: string }[];
    amountPaid: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    paymentAccountId?: string;
    discount?: number;
    tax?: number;
  }) {
    const { currentCompany, authUser } = getStore().getState();
    if (!currentCompany) return { data: null, error: new Error("No active company selected.") };
    
    // 1. Find Supplier ID
    let supplierId = null;
    const { data: existingSupplier } = await supabase.from('suppliers').select('id').eq('name', purchaseData.supplierName).eq('company_id', currentCompany.id).single();
    
    if (existingSupplier) {
        supplierId = existingSupplier.id;
    } else {
        // Create new supplier on the fly if not exists
        const { data: newSupplier, error: supError } = await supabase.from('suppliers').insert({
            company_id: currentCompany.id,
            name: purchaseData.supplierName,
            phone: '', // Optional defaults
            currency: purchaseData.currency
        }).select('id').single();
        
        if (!supError && newSupplier) {
            supplierId = newSupplier.id;
        }
    }

    if (!supplierId) {
         return { data: null, error: new Error(`Could not find or create supplier: ${purchaseData.supplierName}`) };
    }

    const subtotal = purchaseData.items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
    const totalDiscount = purchaseData.discount || 0;
    const totalTax = purchaseData.tax || 0;
    
    const netSubtotal = Math.max(0, subtotal - totalDiscount);
    const effectiveTaxRate = netSubtotal > 0 ? (totalTax / netSubtotal) : 0;

    const itemsJsonb = purchaseData.items.map(item => {
        const itemTotal = item.quantity * item.price;
        const itemWeight = subtotal > 0 ? itemTotal / subtotal : 0;
        const itemDiscount = totalDiscount * itemWeight;

        return {
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            description: item.description || '',
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.price) || 0, 
            unit_cost: Number(item.price) || 0, 
            discount_amount: Number(itemDiscount) || 0,
            tax_rate: Number(effectiveTaxRate * 100) || 0 
        };
    });

    const invoiceDate = new Date().toISOString();
    const dueDate = new Date(Date.now() + 30*24*60*60*1000).toISOString();

    const totalAmount = subtotal - totalDiscount + totalTax;
    const isFullCash = purchaseData.amountPaid >= (totalAmount - 0.01);

    // 3. Call Atomic RPC
    const { data, error } = await supabase.rpc('create_purchase_invoice_with_journal_multi', {
        p_company_id: currentCompany.id,
        p_supplier_id: supplierId,
        p_invoice_number: purchaseData.invoiceNumber,
        p_invoice_date: invoiceDate,
        p_due_date: dueDate,
        p_currency: purchaseData.currency,
        p_items_jsonb: itemsJsonb,
        p_is_cash: isFullCash,
        p_notes: purchaseData.notes || '',
        p_created_by: authUser?.id
    });

    if (error) {
        console.error("RPC create_purchase_invoice_with_journal_multi failed:", error.message, error.details, error.hint);
        return { data: null, error };
    }
    
    // If partially paid, record the payment using debt service logic (simplified)
    if (!isFullCash && purchaseData.amountPaid > 0 && data) {
        // TODO: Implement partial payment for purchase via RPC or separate calls
        // For now, we assume credit purchase logic handles full debt creation
    }
    
    return { data: data, error: null };
  },
  
  async recordPayment(purchaseId: string, paymentDetails: PaymentOutDetails) {
       const { currentCompany, authUser } = getStore().getState();
      if (!currentCompany || !authUser) return { data: null, error: new Error("Context missing") };

      const { data: invoice, error: invError } = await supabase
          .from('purchase_invoices')
          .select('id, remaining_amount, invoice_number, paid_amount, total')
          .eq('id', purchaseId)
          .single();

      if (invError || !invoice) return { data: null, error: invError || new Error("Invoice not found") };

      // Manual implementation for AP payment journal entries would go here
      // Debit Accounts Payable, Credit Cash/Bank
      return { data: true, error: null };
  },

  async getPurchaseReturns() { return { data: [], error: null }; },
  async createPurchaseReturn(returnData: any) { return { data: null, error: null }; }
};
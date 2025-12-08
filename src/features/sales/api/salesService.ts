import { supabase } from '../../../lib/supabaseClient';
import { PaymentMethod } from '../../debts/types';
import { CurrencyCode } from '../../../types.base';
import { getStore } from '../../../lib/storeAccess';
import { SalesInvoice } from '../types';
import { debtService } from '../../../services/debtService';
import { SalesInvoiceWithRelations } from '../../../types/database';

const SALE_COLUMNS = `
  id, company_id, customer_id, invoice_number, 
  invoice_date, due_date, 
  subtotal, discount_total, tax_total, total,
  status, notes, currency,
  paid_amount, remaining_amount, vehicle_id,
  sales_invoice_items(product_id, quantity, unit_price, line_total, discount_amount, products(name)),
  customers(name, email),
  vehicles(make, model, plate_number)
`;

export interface GetSalesParams {
    page?: number;
    pageSize?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}

export const salesService = {
  async getSalesPaginated({ page = 1, pageSize = 10, search = '', dateFrom, dateTo }: GetSalesParams) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: [], count: 0, error: new Error("No active company") };

      let query = supabase
        .from('sales_invoices')
        .select(SALE_COLUMNS, { count: 'exact' })
        .eq('company_id', companyId);

      if (search) query = query.ilike('invoice_number', `%${search}%`);
      if (dateFrom) query = query.gte('invoice_date', dateFrom);
      if (dateTo) query = query.lte('invoice_date', dateTo);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query.order('invoice_date', { ascending: false }).range(from, to);
      
      if (error) return { data: [], count: 0, error };

      const rawData = (data || []) as any[];

      const mappedData: SalesInvoice[] = rawData.map((d) => ({
        id: d.id,
        company_id: d.company_id,
        customerId: d.customer_id,
        customerName: d.customers?.name || 'N/A',
        customerEmail: (d.customers as any)?.email,
        invoiceNumber: d.invoice_number,
        date: d.invoice_date,
        dueDate: d.due_date,
        subtotal: d.subtotal,
        discountValue: d.discount_total,
        discountType: 'fixed',
        taxValue: d.tax_total,
        taxType: 'fixed',
        total: d.total,
        amountPaid: d.paid_amount,
        remainingAmount: d.remaining_amount,
        paymentMethod: 'cash',
        status: d.status as SalesInvoice['status'],
        notes: d.notes,
        currency: (d.currency as CurrencyCode) || 'SAR',
        vehicleId: d.vehicle_id,
        vehicleDescription: d.vehicles ? `${d.vehicles.make} ${d.vehicles.model} (${d.vehicles.plate_number})` : undefined,
        items: (d.sales_invoice_items || []).map((i: any) => ({
            productId: i.product_id,
            productName: i.products?.name || 'N/A',
            quantity: i.quantity,
            unitPrice: i.unit_price,
            total: i.line_total,
            discountAmount: i.discount_amount
        }))
    }));

    return { data: mappedData, count: count || 0, error: null };
  },

  async getSalesStats() {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: null, error: new Error("No active company") };
      
      const today = new Date().toISOString().split('T')[0];
      const { data: todaysSales, error: salesError } = await supabase
        .from('sales_invoices')
        .select('total')
        .eq('company_id', companyId)
        .eq('invoice_date', today);
        
      if (salesError) return { data: null, error: salesError };

      const totalSales = (todaysSales || []).reduce((sum, s) => sum + s.total, 0) || 0;
      const countSales = todaysSales?.length || 0;

      return {
          data: { todayTotal: totalSales, todayCount: countSales, todayReturns: 0, netSales: totalSales },
          error: null
      };
  },

  async getSaleByInvoiceNumber(invoiceNumber: string) {
    const { data, error } = await supabase
      .from('sales_invoices')
      .select(SALE_COLUMNS)
      .eq('invoice_number', invoiceNumber)
      .single();

    if (error) return { data: null, error };
    if (!data) return { data: null, error: new Error("Invoice not found") };
    
    const d = data as any;

    const mappedData: SalesInvoice = {
        id: d.id,
        company_id: d.company_id,
        customerId: d.customer_id,
        customerName: d.customers?.name || 'N/A',
        customerEmail: (d.customers as any)?.email,
        invoiceNumber: d.invoice_number,
        date: d.invoice_date,
        dueDate: d.due_date,
        subtotal: d.subtotal,
        discountValue: d.discount_total,
        discountType: 'fixed',
        taxValue: d.tax_total,
        taxType: 'fixed',
        total: d.total,
        amountPaid: d.paid_amount,
        remainingAmount: d.remaining_amount,
        paymentMethod: 'cash',
        status: d.status as SalesInvoice['status'],
        notes: d.notes,
        currency: (d.currency as CurrencyCode) || 'SAR',
        vehicleId: d.vehicle_id,
        vehicleDescription: d.vehicles ? `${d.vehicles.make} ${d.vehicles.model} (${d.vehicles.plate_number})` : undefined,
        items: (d.sales_invoice_items || []).map((i: any) => ({
            productId: i.product_id,
            productName: i.products?.name || 'N/A',
            quantity: i.quantity,
            unitPrice: i.unit_price,
            total: i.line_total,
            discountAmount: i.discount_amount
        }))
    };

    return { data: mappedData, error: null };
  },

  async createSale(saleData: {
    customerId: string;
    invoiceNumber: string;
    currency: CurrencyCode;
    items: { product_id: string; warehouse_id: string; quantity: number; price: number }[];
    amountPaid: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    depositAccountId?: string;
    discount?: number;
    tax?: number;
    vehicleId?: string;
  }) {
    const { currentCompany, authUser } = getStore().getState();
    if (!currentCompany) return { data: null, error: new Error("No active company selected.") };

    const subtotal = saleData.items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
    const totalDiscount = saleData.discount || 0;
    const totalTax = saleData.tax || 0;
    
    const netSubtotal = subtotal - totalDiscount;
    const effectiveTaxRate = netSubtotal > 0 ? (totalTax / netSubtotal) : 0;

    const itemsJsonb = saleData.items.map(item => {
        const itemTotal = item.quantity * item.price;
        const itemWeight = subtotal > 0 ? itemTotal / subtotal : 0;
        const itemDiscount = totalDiscount * itemWeight;
        
        return {
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            description: '', 
            quantity: item.quantity,
            unit_price: item.price,
            discount_amount: itemDiscount,
            tax_rate: effectiveTaxRate * 100 
        };
    });

    const invoiceDate = new Date().toISOString();
    const dueDate = new Date(Date.now() + 30*24*60*60*1000).toISOString(); 
    
    const totalAmount = subtotal - totalDiscount + totalTax;
    const isFullCash = saleData.amountPaid >= (totalAmount - 0.01); 
    const isPartial = saleData.amountPaid > 0 && saleData.amountPaid < (totalAmount - 0.01);

    const { data: invoiceId, error } = await supabase.rpc('create_sales_invoice_with_journal_multi', {
        p_company_id: currentCompany.id,
        p_customer_id: saleData.customerId,
        p_invoice_number: saleData.invoiceNumber,
        p_invoice_date: invoiceDate,
        p_due_date: dueDate,
        p_currency: saleData.currency,
        p_items_jsonb: itemsJsonb,
        p_is_cash: isFullCash, 
        p_notes: saleData.notes || '',
        p_created_by: authUser?.id,
        p_vehicle_id: saleData.vehicleId || null 
    });

    if (error) {
        console.error("RPC create_sales_invoice_with_journal_multi failed:", error);
        return { data: null, error };
    }

    if (isPartial && invoiceId) {
        const { data: debt } = await supabase
            .from('debts')
            .select('id')
            .eq('invoice_number', saleData.invoiceNumber)
            .eq('company_id', currentCompany.id)
            .single();

        if (debt) {
            await debtService.recordPayment(debt.id, {
                amount: saleData.amountPaid,
                currency: saleData.currency,
                date: invoiceDate,
                method: saleData.paymentMethod,
                notes: 'Partial payment at sale',
                receiptNumber: `REC-${Date.now()}`,
                depositAccountId: saleData.depositAccountId || '',
            });
        }
    }

    return { data: invoiceId, error: null };
  },
  
  async recordPayment(saleId: string, paymentData: { amount: number; currency: CurrencyCode; method: string; date: string; notes?: string; depositAccountId?: string }) {
    const { currentCompany } = getStore().getState();
    if (!currentCompany) return { data: null, error: new Error("No active company selected.") };

    const { data: salesInvoice } = await supabase.from('sales_invoices').select('invoice_number').eq('id', saleId).single();
    if (!salesInvoice) return { data: null, error: new Error("Invoice not found") };

    const { data: debt } = await supabase
        .from('debts')
        .select('id')
        .eq('invoice_number', salesInvoice.invoice_number)
        .eq('company_id', currentCompany.id)
        .single();

    if (!debt) {
        return { data: null, error: new Error("Associated debt record not found.") };
    }

    return await debtService.recordPayment(debt.id, {
        amount: paymentData.amount,
        currency: paymentData.currency, 
        date: paymentData.date,
        method: paymentData.method as any,
        notes: paymentData.notes || '',
        receiptNumber: `REC-${Date.now()}`,
        depositAccountId: paymentData.depositAccountId || '',
    });
  },
  
  async getSalesReturns() { return { data: [], error: null }; }, 
  async createSaleReturn(returnData: any) { return { data: null, error: null }; }
};
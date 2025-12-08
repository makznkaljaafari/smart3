
import { CurrencyCode } from '../../types.base';
import { PaymentMethod } from '../debts/types';

export interface SalesInvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number; // Matches discount_amount
  taxRate?: number; // Matches tax_rate
  total: number; // Matches line_total
}

export interface SalesInvoice {
  id: string;
  company_id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string; // Added for mapping
  invoiceNumber: string;
  date: string; // ISO String (invoice_date)
  dueDate?: string; // ISO String (due_date)
  items: SalesInvoiceItem[];
  
  subtotal: number;
  discountValue: number; // Matches discount_total
  discountType: 'fixed' | 'percentage'; // Frontend logic
  taxValue: number; // Matches tax_total
  taxType: 'fixed' | 'percentage'; // Frontend logic
  total: number;
  
  amountPaid: number; // paid_amount
  remainingAmount: number; // remaining_amount
  paymentMethod: PaymentMethod;
  notes?: string;
  currency: CurrencyCode;
  
  // Status can be 'draft', 'sent', 'paid', 'void', etc. Typed as string for flexibility.
  status: string;
  
  // Vehicle Link
  vehicleId?: string;
  vehicleDescription?: string; // e.g. "Toyota Camry - ABC 1234"
}

export interface SalesReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; 
  total: number;
}

export interface SalesReturn {
  id: string;
  company_id: string;
  originalSalesId: string; 
  customerName: string;
  returnDate: string;
  items: SalesReturnItem[];
  totalReturnValue: number;
  refundMethod: 'cash' | 'credit_note' | 'bank_transfer';
  notes?: string;
}

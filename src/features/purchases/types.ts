
import { CurrencyCode } from '../../types.base';
import { PaymentMethod } from '../debts/types';

export interface PurchaseInvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // Cost price
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  company_id: string;
  supplierId?: string;
  supplierName: string;
  invoiceNumber: string;
  date: string; // invoice_date
  dueDate?: string; // due_date
  items: PurchaseInvoiceItem[];
  
  subtotal: number;
  discountValue: number; // discount_total
  discountType: 'fixed' | 'percentage';
  taxValue: number; // tax_total
  taxType: 'fixed' | 'percentage';
  total: number;
  
  amountPaid: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  currency?: CurrencyCode;
  
  // Status can be 'ordered', 'received', etc. Typed as string for flexibility with DB.
  status: string;
}

export interface PurchaseReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseReturn {
  id: string;
  company_id: string;
  originalPurchaseId: string;
  supplierName: string;
  returnDate: string;
  items: PurchaseReturnItem[];
  totalReturnValue: number;
  refundMethod: 'cash' | 'credit_note' | 'bank_transfer';
  notes?: string;
}

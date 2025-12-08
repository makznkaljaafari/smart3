
import { CurrencyCode } from '../../types.base';

// Corrected to match Postgres ENUM: 'cash', 'bank_transfer', 'cheque', 'credit_card', 'exchange', 'other'
export type DebtStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'credit_card' | 'exchange' | 'other' | 'credit';

export interface Payment {
  id: string;
  debt_id: string; // Foreign key to debts table
  company_id: string;
  amount: number; // The amount paid in `currency`
  currency: CurrencyCode; // The currency of the payment
  date: string;
  method: PaymentMethod;
  notes?: string;
  receiptNumber?: string;

  // New fields for multi-currency support
  exchangeRateUsed?: number; // Exchange rate from payment currency to the debt's currency
  amountInDebtCurrency: number; // The total value of the payment, converted to the debt's currency
}

export interface Debt {
  id: string;
  company_id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCompany?: string;
  amount: number;
  currency: CurrencyCode;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  createdDate: string;
  updatedDate?: string;
  status: DebtStatus;
  description: string;
  notes?: string;
  payments: Payment[]; // This will be populated by a join or separate query
  lastPaymentDate?: string;
  invoiceNumber?: string;
  category?: string;
  tags?: string[];
}

export interface DebtPaymentDetails {
  amount: number;
  currency: CurrencyCode;
  date: string;
  method: PaymentMethod;
  notes: string;
  receiptNumber: string;
  depositAccountId: string;
  exchangeRateUsed?: number;
  amountInDebtCurrency?: number;
  sendReceipt?: boolean;
}
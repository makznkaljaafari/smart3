
import { CurrencyCode } from '../../types.base';
import { RecurrenceType } from '../expenses/types';

export type { CurrencyCode };

export type IncomeCategory = 
  | 'product_sales'
  | 'service_fees'
  | 'consulting'
  | 'rentals'
  | 'refunds'
  | 'other';

// Matches DB Enum: 'draft', 'pending', 'received', 'cancelled'
export type IncomeStatus = 'draft' | 'pending' | 'received' | 'cancelled';

export interface Income {
  id: string;
  company_id: string;
  title: string;
  description: string;
  category: IncomeCategory;
  amount: number;
  currency: CurrencyCode;
  date: string; // Maps to income_date in DB
  status: IncomeStatus;
  source: string; // Legacy text field or used as fallback
  customerId?: string; // Link to customer
  customerName?: string; // For display
  invoiceNumber?: string;
  receiptNumber?: string;
  notes?: string;
  tags?: string[];
  createdDate: string;
  updatedDate?: string;
  recurrence?: RecurrenceType;
  isRecurringTemplate?: boolean;
  lastRecurrenceDate?: string;
  incomeAccountId?: string;
  depositAccountId?: string;
  projectId?: string;
}

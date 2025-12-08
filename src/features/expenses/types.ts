
import { CurrencyCode } from '../../types.base';
import { PaymentMethod } from '../debts/types';

export type { CurrencyCode, PaymentMethod };

export type ExpenseCategory = 
  | 'parts' | 'maintenance' | 'fuel' | 'salaries' | 'rent' | 'utilities' 
  | 'marketing' | 'supplies' | 'transportation' | 'equipment' | 'insurance' 
  | 'taxes' | 'others';

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
export type ExpensePriority = 'low' | 'medium' | 'high' | 'urgent';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadDate: string;
}

export interface Expense {
  id: string;
  company_id: string;
  title: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: CurrencyCode;
  date: string;
  dueDate?: string;
  paidDate?: string;
  status: ExpenseStatus;
  priority: ExpensePriority;
  paymentMethod?: PaymentMethod;
  vendor?: string; // Kept for legacy/non-supplier expenses
  supplierId?: string;
  supplierName?: string; // For display purposes
  vendorPhone?: string;
  vendorEmail?: string;
  invoiceNumber?: string;
  receiptNumber?: string;
  notes?: string;
  tags?: string[];
  attachments?: Attachment[];
  location?: string;
  assignedTo?: string;
  approvedBy?: string;
  approvalDate?: string; // Legacy frontend field
  recurrence?: RecurrenceType;
  createdDate: string;
  updatedDate?: string;
  
  // Automation Fields
  isRecurringTemplate?: boolean;
  lastRecurrenceDate?: string;
  
  // Accounting Links
  expenseAccountId?: string;
  paymentAccountId?: string;
  projectId?: string;
  
  // Backend Consistency Fields
  isVoid?: boolean;
  voidReason?: string;
  approvedAt?: string; // Matches backend timestamp
}

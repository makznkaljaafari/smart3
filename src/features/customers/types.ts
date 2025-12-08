
export type RiskLevel = 'low' | 'medium' | 'high';
export type CustomerStatus = 'active' | 'inactive' | 'blocked';

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  nationalId?: string;
  company?: string;
  notes?: string;
  status: CustomerStatus;
  riskLevel: RiskLevel;
  totalDebt: number;
  paidAmount: number;
  remainingDebt: number;
  currency: string;
  createdAt: string; // ISO string
  lastTransaction?: string;
  totalTransactions: number;
  avatar?: string;
  // Fields from backend consistency report
  updatedAt?: string;
  discountRate?: number;
  creditLimit?: number;
  paymentTerms?: string; // e.g., 'NET 30'
  totalSalesValue?: number;
}

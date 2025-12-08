export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string; // ISO string
  totalPurchasesValue: number;
  outstandingBalance: number;
  currency: string;
}
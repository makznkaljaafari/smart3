
export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'needs_review';

export interface Project {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string; // ISO String
  endDate?: string; // ISO String
  budget?: number;
  clientId?: string; // FK to customers
  clientName?: string; // for display
  createdAt: string; // ISO String
  // Calculated fields, will be populated on the client
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

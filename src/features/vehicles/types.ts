
export interface Vehicle {
  id: string;
  company_id: string;
  vin: string;
  plateNumber?: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  engineSize?: string;
  currentMileage?: number;
  notes?: string;
  customerId?: string;
  customerName?: string; // For display
  createdAt: string;
  updatedAt: string;
}

export interface VINScanResult {
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
}

export interface MaintenancePrediction {
  task: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  estimatedCostRange: string;
  recommendedAction: string;
}

import { CustomerStatus, RiskLevel } from '../types';

export const formatCurrency = (amount: number, currency: string = 'SAR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(dateString));
};

export const getRiskInfo = (risk: RiskLevel) => {
  const labels: Record<RiskLevel, string> = { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' };
  const classMap: Record<RiskLevel, string> = {
    low: 'status-success',
    medium: 'status-warning',
    high: 'status-danger'
  };
  return { label: labels[risk], className: `status-badge ${classMap[risk]}` };
};

export const getStatusInfo = (status: CustomerStatus) => {
  const labels: Record<CustomerStatus, string> = { active: 'نشط', inactive: 'غير نشط', blocked: 'محظور' };
  const classMap: Record<CustomerStatus, string> = {
    active: 'status-success',
    inactive: 'status-neutral',
    blocked: 'status-danger'
  };
  return { label: labels[status], className: `status-badge ${classMap[status]}` };
};
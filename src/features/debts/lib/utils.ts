
import { DebtStatus, PaymentMethod } from '../../../types';
import {
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  Banknote,
  CreditCard,
  Receipt,
  Wallet,
  Info,
  ArrowRightLeft,
} from 'lucide-react';

export const getStatusClass = (status: DebtStatus): string => {
  const statusMap: Record<DebtStatus, string> = {
    pending: 'status-info',
    partial: 'status-warning',
    paid: 'status-success',
    overdue: 'status-danger',
    cancelled: 'status-neutral'
  };
  return statusMap[status];
};

export const getStatusIcon = (status: DebtStatus) => {
  const icons = {
    pending: Clock,
    partial: Activity,
    paid: CheckCircle,
    overdue: AlertCircle,
    cancelled: XCircle
  };
  return icons[status] || Info;
};

export const getStatusLabel = (status: DebtStatus): string => {
  const labels = {
    pending: 'قيد الانتظار',
    partial: 'مدفوع جزئياً',
    paid: 'مدفوع بالكامل',
    overdue: 'متأخر',
    cancelled: 'ملغي'
  };
  return labels[status];
};

export const getPaymentMethodIcon = (method: PaymentMethod) => {
  const icons: Record<string, any> = {
    cash: Banknote,
    bank_transfer: CreditCard,
    cheque: Receipt,
    credit_card: CreditCard,
    credit: CreditCard,
    exchange: ArrowRightLeft,
    other: Wallet
  };
  return icons[method] || Wallet;
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<string, string> = {
    cash: 'نقداً',
    bank_transfer: 'تحويل بنكي',
    cheque: 'شيك',
    credit_card: 'بطاقة ائتمان',
    credit: 'آجل',
    exchange: 'صرافة',
    other: 'أخرى'
  };
  return labels[method] || method;
};

export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const calculateDebtAge = (createdDate: string): number => {
  const created = new Date(createdDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const isOverdue = (dueDate: string, status: DebtStatus): boolean => {
  if (status === 'paid' || status === 'cancelled') return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0,0,0,0);
  return due < today;
};

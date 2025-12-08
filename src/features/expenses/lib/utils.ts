
import React from 'react';
import { ExpenseStatus, ExpensePriority, PaymentMethod, RecurrenceType, ExpenseCategory } from '../../../types';
import { 
    Clock, CheckCircle, Banknote, XCircle, Package, Wrench, Fuel, Users, Home, Zap, TrendingUp, 
    ShoppingCart, Truck, Settings, Briefcase, Receipt, MoreVertical, FileText
} from 'lucide-react';
import { formatCurrency as globalFormatCurrency, formatDate as globalFormatDate, formatShortDate as globalFormatShortDate, formatFileSize as globalFormatFileSize } from '../../../lib/formatters';

// Re-export from central location to maintain compatibility
export const formatCurrency = globalFormatCurrency;
export const formatDate = globalFormatDate;
export const formatShortDate = globalFormatShortDate;
export const formatFileSize = globalFormatFileSize;

export const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  parts: { label: 'قطع غيار', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  maintenance: { label: 'صيانة', icon: Wrench, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  fuel: { label: 'وقود', icon: Fuel, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  salaries: { label: 'رواتب', icon: Users, color: 'text-green-600', bgColor: 'bg-green-100' },
  rent: { label: 'إيجارات', icon: Home, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  utilities: { label: 'خدمات', icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  marketing: { label: 'تسويق', icon: TrendingUp, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  supplies: { label: 'مستلزمات', icon: ShoppingCart, color: 'text-teal-600', bgColor: 'bg-teal-100' },
  transportation: { label: 'نقل ومواصلات', icon: Truck, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  equipment: { label: 'معدات', icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  insurance: { label: 'تأمينات', icon: Briefcase, color: 'text-red-600', bgColor: 'bg-red-100' },
  taxes: { label: 'ضرائب ورسوم', icon: Receipt, color: 'text-violet-600', bgColor: 'bg-violet-100' },
  others: { label: 'أخرى', icon: MoreVertical, color: 'text-gray-500', bgColor: 'bg-gray-100' }
};

// Legacy Helpers (Consider moving to StatusBadge component usage in future refactors)
export const getStatusClass = (status: ExpenseStatus) => {
  const statusMap: Record<ExpenseStatus, string> = {
    draft: 'status-neutral',
    pending: 'status-warning',
    approved: 'status-info',
    paid: 'status-success',
    rejected: 'status-danger',
    cancelled: 'status-neutral'
  };
  return `status-badge ${statusMap[status]}`;
};

export const getStatusIcon = (status: ExpenseStatus) => ({
  draft: FileText, pending: Clock, approved: CheckCircle, paid: Banknote, rejected: XCircle, cancelled: XCircle
}[status]);

export const getStatusLabel = (status: ExpenseStatus) => ({
  draft: 'مسودة', pending: 'قيد الانتظار', approved: 'تمت الموافقة', paid: 'مدفوع', rejected: 'مرفوض', cancelled: 'ملغي'
}[status]);

export const getPriorityClass = (priority: ExpensePriority) => {
  const priorityMap: Record<ExpensePriority, string> = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    urgent: 'priority-urgent'
  };
  return `priority-badge ${priorityMap[priority]}`;
};

export const getPriorityLabel = (priority: ExpensePriority) => ({
  low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة'
}[priority]);

export const getPaymentMethodLabel = (method: PaymentMethod) => ({
  cash: 'نقداً', bank_transfer: 'تحويل بنكي', check: 'شيك', card: 'بطاقة', credit: 'آجل', exchange: 'صرافة', other: 'أخرى'
}[method]);

export const getRecurrenceLabel = (recurrence: RecurrenceType) => ({
  none: 'لا يتكرر', daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري', yearly: 'سنوي'
}[recurrence]);

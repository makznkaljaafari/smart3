
import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle, FileText, Truck, RefreshCw } from 'lucide-react';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string; // The raw status string (e.g., 'paid', 'pending')
  label?: string; // The translated label to display
  variant?: StatusVariant; // Optional override for color
  className?: string;
  showIcon?: boolean;
}

// Helper to map common statuses to variants
const getVariant = (status: string): StatusVariant => {
  const s = status.toLowerCase();
  if (['paid', 'completed', 'active', 'received', 'in_stock', 'approved'].includes(s)) return 'success';
  if (['pending', 'partial', 'partially_received', 'ordered', 'in_progress', 'medium', 'low'].includes(s)) return 'warning';
  if (['overdue', 'cancelled', 'rejected', 'void', 'blocked', 'high', 'urgent', 'out_of_stock'].includes(s)) return 'danger';
  if (['draft', 'planning', 'archived'].includes(s)) return 'neutral';
  return 'info';
};

// Helper to map common statuses to icons
const getIcon = (status: string) => {
     const s = status.toLowerCase();
     if (s.includes('paid') || s === 'completed' || s === 'approved') return CheckCircle;
     if (s === 'pending' || s === 'ordered' || s === 'planning') return Clock;
     if (s === 'overdue' || s === 'high' || s === 'urgent') return AlertCircle;
     if (s === 'cancelled' || s === 'rejected' || s === 'void') return XCircle;
     if (s === 'draft') return FileText;
     if (s === 'in_progress') return RefreshCw;
     if (s.includes('received')) return Truck;
     return null;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, variant, className = '', showIcon = true }) => {
  const finalVariant = variant || getVariant(status);
  const Icon = getIcon(status);
  
  // Map variants to Tailwind classes (matching global CSS variables)
  const variantClasses = {
    success: 'status-success',
    warning: 'status-warning',
    danger: 'status-danger',
    info: 'status-info',
    neutral: 'status-neutral',
  };

  return (
    <span className={`status-badge ${variantClasses[finalVariant]} ${className}`}>
      {showIcon && Icon && <Icon size={14} />}
      {label || status}
    </span>
  );
};

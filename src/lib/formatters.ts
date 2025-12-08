
import { CurrencyCode } from '../types.base';

export const formatCurrency = (amount: number, currency: string = 'SAR'): string => {
  const safeAmount = typeof amount === 'number' ? amount : 0;
  try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'SAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeAmount);
  } catch (e) {
      // Fallback if currency code is invalid
      return `${currency} ${safeAmount.toFixed(2)}`;
  }
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
      return new Intl.DateTimeFormat('en-CA', { // YYYY-MM-DD format is standard for listing
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(new Date(dateString));
  } catch (e) {
      return dateString;
  }
};

export const formatShortDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(new Date(dateString));
  } catch (e) {
      return dateString;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

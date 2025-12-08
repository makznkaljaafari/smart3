
import { CurrencyCode } from '../../../types.base';

export const formatCurrency = (amount: number, currency: CurrencyCode): string => {
  if (amount === 0) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

export const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('en-CA').format(new Date(dateString));
};

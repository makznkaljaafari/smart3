
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, getRiskInfo, getStatusInfo } from '../utils';

describe('Customer Feature Utilities', () => {

  // --- Test formatCurrency ---
  describe('formatCurrency', () => {
    it('should format a number as SAR currency by default', () => {
      const result = formatCurrency(12345.67);
      // Note: The Intl.NumberFormat result can vary slightly by environment (e.g., non-breaking space)
      // We check for the essential parts.
      expect(result).toContain('SAR');
      expect(result).toMatch(/12,346/); // It rounds to nearest integer
    });

    it('should format a number with the specified currency', () => {
      const result = formatCurrency(500, 'USD');
      expect(result).toContain('USD');
      expect(result).toMatch(/500/);
    });

    it('should handle zero correctly', () => {
      const result = formatCurrency(0, 'YER');
      expect(result).toContain('YER');
      expect(result).toMatch(/0/);
    });
  });

  // --- Test formatDate ---
  describe('formatDate', () => {
    it('should format an ISO date string into a long form date', () => {
      const result = formatDate('2023-10-27T10:00:00Z');
      expect(result).toBe('October 27, 2023');
    });

    it('should return an empty string for undefined input', () => {
      const result = formatDate(undefined);
      expect(result).toBe('');
    });
  });

  // --- Test getRiskInfo ---
  describe('getRiskInfo', () => {
    it('should return correct label and classes for "high" risk', () => {
      const { label, className } = getRiskInfo('high');
      expect(label).toBe('مرتفع');
      expect(className).toBe('status-badge status-danger');
    });
  });

  // --- Test getStatusInfo ---
  describe('getStatusInfo', () => {
    it('should return correct label and classes for "active" status', () => {
      const { label, className } = getStatusInfo('active');
      expect(label).toBe('نشط');
      expect(className).toBe('status-badge status-success');
    });
  });

});

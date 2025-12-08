
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { getLatestRate, convertCurrency } from '../currency';
import { ExchangeRate, CurrencyCode } from '../../types';

// Mock data for testing
const sampleRates: ExchangeRate[] = [
  { id: '1', from: 'SAR', to: 'USD', rate: 0.27, date: '2023-10-26T10:00:00Z' },
  { id: '2', from: 'SAR', to: 'YER', rate: 70, date: '2023-10-25T10:00:00Z' },
  { id: '3', from: 'OMR', to: 'SAR', rate: 9.75, date: '2023-10-24T10:00:00Z' },
  // A newer rate for SAR to USD to test latest rate logic
  { id: '4', from: 'SAR', to: 'USD', rate: 0.26, date: '2023-10-27T10:00:00Z' },
];

describe('Currency Conversion Utilities', () => {

  // --- Tests for getLatestRate ---
  describe('getLatestRate', () => {
    it('should return the latest direct exchange rate', () => {
      const result = getLatestRate('SAR', 'USD', sampleRates);
      expect(result).not.toBeNull();
      expect(result?.rate).toBe(0.26); // The latest rate
      expect(result?.date).toBe('2023-10-27T10:00:00Z');
    });

    it('should calculate and return an inverse rate if direct is not available', () => {
      const result = getLatestRate('SAR', 'OMR', sampleRates);
      expect(result).not.toBeNull();
      expect(result?.rate).toBeCloseTo(1 / 9.75);
    });

    it('should return a rate of 1 when converting to the same currency', () => {
      const result = getLatestRate('SAR', 'SAR', sampleRates);
      expect(result).not.toBeNull();
      expect(result?.rate).toBe(1);
    });

    it('should return null if no direct or inverse rate is found', () => {
      const result = getLatestRate('USD', 'YER', sampleRates);
      expect(result).toBeNull();
    });
  });

  // --- Tests for convertCurrency ---
  describe('convertCurrency', () => {
    it('should correctly convert an amount using the latest direct rate', () => {
      const amount = 100; // SAR
      const converted = convertCurrency(amount, 'SAR', 'USD', sampleRates);
      expect(converted).not.toBeNull();
      expect(converted).toBeCloseTo(100 * 0.26); // 26
    });

    it('should correctly convert an amount using an inverse rate', () => {
      const amount = 10; // OMR
      const converted = convertCurrency(amount, 'OMR', 'SAR', sampleRates);
      expect(converted).not.toBeNull();
      expect(converted).toBeCloseTo(10 * 9.75); // 97.5
    });

    it('should return the same amount if currencies are the same', () => {
      const amount = 500;
      const converted = convertCurrency(amount, 'SAR', 'SAR', sampleRates);
      expect(converted).toBe(500);
    });

    it('should return null if no exchange rate is available', () => {
      const amount = 100;
      const converted = convertCurrency(amount, 'USD', 'YER', sampleRates);
      expect(converted).toBeNull();
    });
  });
});

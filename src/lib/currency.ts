import { CurrencyCode, ExchangeRate } from '../types';

/**
 * Finds the most recent exchange rate between two currencies.
 * It checks for a direct rate (e.g., SAR to USD) and an inverse rate (e.g., USD to SAR),
 * calculating the inverse if necessary.
 * @param from The source currency code.
 * @param to The target currency code.
 * @param rates An array of available exchange rates.
 * @returns An object with the calculated rate and the date of the rate, or null if no rate is found.
 */
export const getLatestRate = (
  from: CurrencyCode, 
  to: CurrencyCode, 
  rates: ExchangeRate[]
): { rate: number, date: string } | null => {
  if (from === to) return { rate: 1, date: new Date().toISOString() };

  const directRate = rates
    .filter(r => r.from === from && r.to === to)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (directRate) return { rate: directRate.rate, date: directRate.date };

  const inverseRate = rates
    .filter(r => r.from === to && r.to === from)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (inverseRate) return { rate: 1 / inverseRate.rate, date: inverseRate.date };

  return null;
};

/**
 * Converts an amount from one currency to another using the latest available exchange rate.
 * @param amount The monetary amount to convert.
 * @param from The source currency code.
 * @param to The target currency code.
 * @param rates An array of available exchange rates.
 * @returns The converted amount, or null if no exchange rate is available.
 */
export const convertCurrency = (
  amount: number, 
  from: CurrencyCode, 
  to: CurrencyCode, 
  rates: ExchangeRate[]
): number | null => {
  const rateInfo = getLatestRate(from, to, rates);
  return rateInfo ? amount * rateInfo.rate : null;
};
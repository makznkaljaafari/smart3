import { LangCode, CurrencyCode } from '../types.base';
import { translations as newTranslations } from '../locales';

export const translations = newTranslations;

export const currencyLabels: Record<CurrencyCode, Record<LangCode, string>> = {
  SAR: { ar: 'ريال سعودي', en: 'Saudi Riyal' },
  YER: { ar: 'ريال يمني', en: 'Yemeni Rial' },
  OMR: { ar: 'ريال عُماني', en: 'Omani Rial' },
  USD: { ar: 'دولار أمريكي', en: 'US Dollar' }
};
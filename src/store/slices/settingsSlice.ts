
import { StateCreator } from 'zustand';
import { SettingsState } from '../../types';

export const defaultSettings: SettingsState = {
  baseCurrency: 'SAR',
  enabledCurrencies: ['SAR', 'YER', 'OMR', 'USD'],
  customCurrencies: [],
  appearance: { 
    theme: 'dark', 
    density: 'comfortable',
    fontSize: 'normal',
    accentColor: 'cyan',
    documentAccentColor: '#06b6d4',
    font: 'system',
    glowIntensity: 'normal',
    backgroundAnimations: true,
    animationIntensity: 'full',
    tables: {
      theme: 'striped',
      headerStyle: 'bold',
      fontSize: 'normal'
    }
  },
  notifications: { whatsapp: true, telegram: true, email: false },
  profile: { name: 'User', phone: '', locale: 'ar', preferredCurrency: 'SAR', avatar: null },
  companyProfile: {
    name: 'اسم شركتك',
    address: 'عنوان شركتك هنا',
    phone1: 'رقم الهاتف 1',
    phone2: 'رقم الهاتف 2',
    logoUrl: '',
    footerText: '',
  },
  page: {
    customers: { visibleCols: ['name', 'phone', 'risk'], pageSize: 10 },
    debts: { visibleCols: ['customer', 'amount', 'currency', 'dueDate', 'status'], pageSize: 10, reminders: { beforeDays: [3, 1] } },
    expenses: { visibleCols: ['category', 'amount', 'currency', 'date'], pageSize: 10 },
    notes: { allowAudio: true, allowImages: true },
    inventory: { pageSize: 15 },
  },
  integrations: {
    whatsappWebhookUrl: '',
    whatsappApiKey: '',
    telegramBotToken: '',
    telegramChatId: '',
    ai: {
      openaiApiKey: '',
      deepseekApiKey: '',
      geminiApiKey: ''
    },
    smtp: {
      host: '',
      port: 587,
      user: '',
      pass: '',
      from: '',
    },
    bankConnections: [],
  },
  accounting: {
    defaultInventoryAccountId: '',
    defaultCogsAccountId: '',
    defaultSalesAccountId: '',
    defaultAccountsReceivableId: '',
    defaultAccountsPayableId: '',
    defaultSalariesPayableId: '',
    defaultSalariesExpenseId: '',
    defaultCashSalesAccountId: '',
    defaultGeneralExpenseAccountId: '',
    defaultInventoryAdjustmentAccountId: '',
  },
  inventory: {
    allowNegativeStock: false,
    allowSellBelowCost: false,
    allowBackdatedSales: false,
    defaultWarehouseId: '',
  },
  exchangeRates: [],
  scheduledReports: [],
  smartAlerts: {
    overdueDebt: {
      enabled: true,
      days: 30,
    },
  },
  dashboardCards: [
    { id: 'dailyBriefing', visible: true, color: 'primary', size: 'wide' },
    { id: 'financialHealth', visible: true, color: 'primary', size: 'wide' },
    { id: 'totalDebts', visible: true, color: 'primary', size: 'default' },
    { id: 'overdueDebts', visible: true, color: 'orange', size: 'default' },
    { id: 'totalIncome', visible: true, color: 'green', size: 'default' },
    { id: 'totalExpenses', visible: true, color: 'purple', size: 'default' },
  ],
  budgets: [],
};

export interface SettingsSlice {
    settings: SettingsState;
    setSettings: (settings: SettingsState) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
    settings: defaultSettings,
    setSettings: (settings) => set({ settings }),
});

import { CurrencyCode, LangCode, AppEventType } from '../types.base';
import { ExpenseCategory } from '../features/expenses/types';

export type PageSettings = {
  customers: { visibleCols: string[]; pageSize: number };
  debts: { visibleCols: string[]; pageSize: number; reminders: { beforeDays: number[] } };
  expenses: { visibleCols: string[]; pageSize: number };
  notes: { allowAudio: boolean; allowImages: boolean };
  inventory: { pageSize: number };
};

export interface ScheduledReport {
  id: string;
  reportType: 'expenseSummary' | 'debtAging' | 'customerRanking';
  frequency: 'daily' | 'weekly' | 'monthly';
  channels: ('whatsapp' | 'telegram' | 'email')[];
  lastRun?: string; // ISO string
}

export interface SmartAlerts {
  overdueDebt: {
    enabled: boolean;
    days: number;
  };
}

export interface Budget {
  id: string;
  category: ExpenseCategory;
  amount: number;
  month: string; // Format: YYYY-MM
}

export type DashboardCardColor = 'primary' | 'cyan' | 'purple' | 'green' | 'orange' | 'red' | 'yellow';

export interface DashboardCardConfig {
  id: 'totalDebts' | 'overdueDebts' | 'totalIncome' | 'totalExpenses' | 'financialHealth' | 'dailyBriefing';
  visible: boolean;
  color: DashboardCardColor;
  size?: 'default' | 'wide';
}

export type ThemeOption = 'light' | 'dark' | 'dark-midnight' | 'dark-terminal' | 'system' | 'light-corporate' | 'dark-graphite';
export type AppTheme = 'light' | 'dark' | 'dark-midnight' | 'dark-terminal' | 'light-corporate' | 'dark-graphite';

export interface BankConnection {
  id: string;
  bankName: string;
  last4: string;
  status: 'active' | 'error' | 'syncing';
  lastSync: string; // ISO string
}

export interface CustomCurrency {
  code: string;
  nameAr: string;
  nameEn: string;
}

export interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    events: AppEventType[];
    active: boolean;
    secret?: string;
    headers?: { key: string; value: string }[];
}

export type SettingsState = {
  baseCurrency: CurrencyCode;
  enabledCurrencies: CurrencyCode[];
  customCurrencies: CustomCurrency[];
  appearance: { 
    theme: ThemeOption; 
    density: 'comfortable' | 'compact';
    fontSize: 'small' | 'normal' | 'large';
    accentColor: 'cyan' | 'purple' | 'green' | 'orange' | 'red' | 'yellow';
    documentAccentColor?: string;
    font: 'system' | 'tajawal';
    glowIntensity: 'off' | 'subtle' | 'normal' | 'intense';
    backgroundAnimations: boolean;
    animationIntensity: 'full' | 'subtle' | 'off';
    tables: {
      theme: 'plain' | 'striped';
      headerStyle: 'normal' | 'bold' | 'accent';
      fontSize: 'small' | 'normal' | 'large';
    };
  };
  notifications: { whatsapp: boolean; telegram: boolean; email: boolean };
  profile: { name: string; phone?: string; locale: LangCode; preferredCurrency: CurrencyCode; avatar?: string | null };
  companyProfile: {
    name: string;
    address: string;
    phone1: string;
    phone2?: string;
    logoUrl?: string;
    footerText?: string;
  };
  page: PageSettings;
  integrations: {
    whatsappWebhookUrl?: string;
    whatsappApiKey?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
    ai?: {
      openaiApiKey?: string;
      deepseekApiKey?: string;
      geminiApiKey?: string; 
    };
    smtp?: {
      host?: string;
      port?: number;
      user?: string;
      pass?: string;
      from?: string;
    };
    bankConnections?: BankConnection[];
    webhooks?: WebhookConfig[]; 
  };
  accounting: {
    defaultInventoryAccountId: string;
    defaultCogsAccountId: string;
    defaultSalesAccountId: string;
    defaultAccountsReceivableId: string;
    defaultAccountsPayableId: string;
    defaultSalariesPayableId: string;
    defaultSalariesExpenseId: string;
    defaultCashSalesAccountId: string;
    defaultGeneralExpenseAccountId: string;
    defaultInventoryAdjustmentAccountId: string;
    
    // Added missing fields
    cashAccountId?: string;
    bankAccountId?: string;
    defaultExpenseAccountId?: string;
    taxPayableAccountId?: string;
    defaultEquityAccountId?: string; // For retained earnings
  };
  inventory: {
    allowNegativeStock: boolean;
    allowSellBelowCost: boolean;
    allowBackdatedSales: boolean;
    defaultWarehouseId?: string;
  };
  exchangeRates: any[]; 
  scheduledReports: ScheduledReport[];
  smartAlerts: SmartAlerts;
  dashboardCards: DashboardCardConfig[];
  budgets: Budget[];
};

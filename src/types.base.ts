
export type CurrencyCode = string; // Changed from union to string to allow custom currencies
export type LangCode = 'ar' | 'en';

export type AppEventType =
  | 'DEBT_CREATED'
  | 'DEBT_SETTLED'
  | 'EXPENSE_CREATED'
  | 'INCOME_CREATED'
  | 'NOTE_CREATED'
  | 'CUSTOMER_CREATED'
  | 'BACKUP_CREATED'
  | 'BACKUP_RESTORED'
  | 'SMART_ALERT'
  | 'SCHEDULED_REPORT_READY'
  | 'LOW_STOCK_ALERT'
  | 'SALES_INVOICE_SEND'
  | 'PURCHASE_INVOICE_SEND'
  | 'PAYMENT_RECEIPT_SEND'
  | 'ACCOUNT_STATEMENT_SEND'
  | 'DEBT_REMINDER_SEND'
  // Mobile Quick Add Events
  | 'SHOW_ADD_EXPENSE_MODAL'
  | 'SHOW_ADD_DEBT_MODAL'
  | 'SHOW_ADD_CUSTOMER_MODAL';

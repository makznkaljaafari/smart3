
export * from './features/customers/types';
export * from './features/debts/types';
export * from './features/expenses/types';
export * from './features/income/types';
export * from './features/notes/types';
export * from './features/accounting/types';
export * from './features/inventory/types';
export * from './features/sales/types';
export * from './features/purchases/types';
export * from './features/suppliers/types';
export * from './features/team/types';
export * from './features/payments/types';
export * from './features/projects/types';
export * from './features/vehicles/types';

// Import and re-export base types
export * from './types.base';
import { CurrencyCode, LangCode, AppEventType } from './types.base';

import { Account, JournalEntry } from './features/accounting/types';
import { Product, Warehouse } from './features/inventory/types';
import { Project } from './features/projects/types';

// Import new decentralized settings
export * from './types/settings';
import { SettingsState, AppTheme } from './types/settings';

// --- App State ---

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface ExchangeRate {
  id: string;
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  date: string; // ISO string date
}

export interface InventoryLevel {
  productId: string;
  warehouseId: string;
  quantity: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
  action?: {
    label: string;
    path: string;
  };
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  event: AppEventType;
  details: string;
  status: 'success' | 'failed';
}

export interface Company {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export type AppState = {
  // Auth state
  isAuthenticated: boolean;
  authUser: AuthUser | null;
  token: string | null;
  authLoading: boolean;
  
  // UI State
  theme: AppTheme; // Strictly typed now
  lang: LangCode;
  currency: CurrencyCode;
  sidebarWidth: number;
  sidebarPreCollapseWidth: number;
  sidebarCollapsed: boolean; 
  mobileMenuOpen: boolean;
  toasts: Toast[];
  notifications: AppNotification[];

  // Global Reference Data (Only keep essentials)
  accounts: Account[];
  products: Product[];
  warehouses: Warehouse[];
  projects: Project[];
  inventoryLevels: InventoryLevel[];
  automationLogs: AutomationLog[];
  
  // Loading States for Globals
  accountsLoading: boolean;
  productsLoading: boolean;
  warehousesLoading: boolean;
  projectsLoading: boolean;
  inventoryLevelsLoading: boolean;

  // App-level state
  isOffline: boolean;
  settings: SettingsState;
  isSyncing: boolean;
};

export type AppEvent = { id: string; type: AppEventType; payload: any; at: string; lang: LangCode };

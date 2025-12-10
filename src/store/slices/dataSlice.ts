
import { StateCreator } from 'zustand';
import { CombinedState } from '../useStore';
import { AutomationLog, InventoryLevel } from '../../types';
import { Account } from '../../features/accounting/types';
import { Warehouse, Product } from '../../features/inventory/types';
import { Project } from '../../features/projects/types';
import { Customer } from '../../features/customers/types';
import { Expense } from '../../features/expenses/types';
import { Income } from '../../features/income/types';
import { Debt } from '../../features/debts/types';
import { accountService } from '../../services/accountService';
import { inventoryService } from '../../services/inventoryService';
import { projectService } from '../../services/projectService';
import { settingsService } from '../../services/settingsService';

export interface DataSlice {
    // Global Reference Data (Small lists needed everywhere)
    accounts: Account[];
    warehouses: Warehouse[];
    projects: Project[];
    products: Product[]; 
    inventoryLevels: InventoryLevel[]; 
    
    // Core Business Entities
    customers: Customer[];
    expenses: Expense[];
    income: Income[];
    debts: Debt[];
    
    // Logs
    automationLogs: AutomationLog[];

    // Loading States for Global Data
    initialDataLoading: boolean;
    isDataReady: boolean;
    accountsLoading: boolean;
    warehousesLoading: boolean;
    projectsLoading: boolean;
    productsLoading: boolean;
    inventoryLevelsLoading: boolean;
    
    // Errors
    accountsError: string | null;
    warehousesError: string | null;
    projectsError: string | null;
    productsError: string | null;
    inventoryLevelsError: string | null;
    
    isSyncing: boolean;

    // Actions
    fetchInitialData: () => Promise<void>;
    manualSync: () => Promise<void>;
    
    // Specific Fetchers for Global Data
    fetchAccounts: () => Promise<void>;
    fetchWarehouses: () => Promise<void>;
    fetchProjects: () => Promise<void>;
    fetchProducts: () => Promise<void>;
    fetchInventoryLevels: () => Promise<void>;
    fetchExchangeRates: () => Promise<void>;
    
    // Utilities
    setAllData: (data: any) => void;
}

export const createDataSlice: StateCreator<CombinedState, [], [], DataSlice> = (set, get) => ({
    // Global Data
    accounts: [],
    warehouses: [],
    projects: [],
    products: [],
    inventoryLevels: [],
    
    // Entities (Empty by default, populated by specific views or sync)
    customers: [],
    expenses: [],
    income: [],
    debts: [],
    
    automationLogs: [],

    // Loading States
    initialDataLoading: false,
    isDataReady: false,
    accountsLoading: false,
    warehousesLoading: false,
    projectsLoading: false,
    productsLoading: false,
    inventoryLevelsLoading: false,

    // Errors
    accountsError: null,
    warehousesError: null,
    projectsError: null,
    productsError: null,
    inventoryLevelsError: null,

    isSyncing: false,
    
    setAllData: (data) => set({ ...data, isDataReady: true }),
    
    fetchInitialData: async () => {
        const { authUser, currentCompany, initialDataLoading, addToast } = get();
        if (!authUser || !currentCompany) return;
        if (initialDataLoading) return;

        set({ initialDataLoading: true, isDataReady: false });
        
        try {
            // Optimization: Only fetch lightweight reference data essential for the app shell.
            await Promise.allSettled([
                get().fetchAccounts(),
                get().fetchWarehouses(),
                get().fetchProjects(),
                get().fetchExchangeRates(), 
            ]);

        } catch (e: any) {
            console.error("Critical data fetch issue:", e);
            addToast({ message: "Some data failed to load. Please check your connection.", type: 'warning' });
        } finally {
            set({ initialDataLoading: false, isDataReady: true });
        }
    },
    
    manualSync: async () => {
        const { isOffline, addToast, fetchInitialData, isSyncing, lang } = get();
        if (isSyncing) return;
        if (isOffline) {
            addToast({ message: lang === 'ar' ? 'لا يمكن المزامنة أثناء عدم الاتصال.' : 'Cannot sync while offline.', type: 'error' });
            return;
        }

        set({ isSyncing: true });
        addToast({ message: lang === 'ar' ? 'بدء المزامنة...' : 'Syncing data...', type: 'info' });

        try {
            await fetchInitialData();
            addToast({ message: lang === 'ar' ? 'اكتملت المزامنة.' : 'Sync complete.', type: 'success' });
        } catch (error) {
            console.error("Manual sync failed:", error);
            addToast({ message: lang === 'ar' ? 'فشلت المزامنة.' : 'Sync failed.', type: 'error' });
        } finally {
            set({ isSyncing: false });
        }
    },

    fetchAccounts: async () => {
        set({ accountsLoading: true });
        const { data, error } = await accountService.getAccounts();
        set({ accounts: (data as Account[]) || [], accountsError: error?.message || null, accountsLoading: false });
    },

    fetchWarehouses: async () => {
        set({ warehousesLoading: true });
        const { data, error } = await inventoryService.getWarehouses();
        set({ warehouses: (data as Warehouse[]) || [], warehousesError: error?.message || null, warehousesLoading: false });
    },

    fetchProjects: async () => {
        set({ projectsLoading: true });
        const { data, error } = await projectService.getProjects();
        set({ projects: (data as Project[]) || [], projectsError: error?.message || null, projectsLoading: false });
    },
    
    fetchProducts: async () => {
        set({ productsLoading: true });
        const { data, error } = await inventoryService.getProducts();
        set({ products: (data as Product[]) || [], productsError: error?.message || null, productsLoading: false });
    },

    fetchInventoryLevels: async () => {
        set({ inventoryLevelsLoading: true });
        const { data, error } = await inventoryService.getInventoryLevels();
        set({ inventoryLevels: (data as InventoryLevel[]) || [], inventoryLevelsError: error?.message || null, inventoryLevelsLoading: false });
    },

    fetchExchangeRates: async () => {
        const { currentCompany, settings } = get();
        if (!currentCompany) return;
        
        const { data } = await settingsService.getExchangeRates(currentCompany.id);
        if (data) {
            set({ settings: { ...settings, exchangeRates: data } });
        }
    }
});

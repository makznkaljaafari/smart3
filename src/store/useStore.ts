
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UiSlice, createUiSlice } from './slices/uiSlice';
import { DataSlice, createDataSlice } from './slices/dataSlice';
import { SettingsSlice, createSettingsSlice, defaultSettings } from './slices/settingsSlice';
import { AuthSlice, createAuthSlice } from './slices/authSlice';
import { setStore } from '../lib/storeAccess';
import { deepMerge } from '../lib/utils';

// Key for LocalStorage
export const LS_KEY = 'smart-finance-ui-v3-production';

export type CombinedState = UiSlice & DataSlice & SettingsSlice & AuthSlice;

/**
 * The main Zustand store, combining all state slices.
 * Includes persistence logic with versioning to handle app updates safely.
 */
export const useZustandStore = create<CombinedState>()(
    persist(
        (...a) => ({
            ...createUiSlice(...a),
            ...createDataSlice(...a),
            ...createSettingsSlice(...a),
            ...createAuthSlice(...a),
        }),
        {
            name: LS_KEY,
            storage: createJSONStorage(() => localStorage),
            version: 1, // Increment this when breaking changes are made to state structure
            
            // Migration logic: Runs when version changes or on hydration
            // Ensures new default settings are added while keeping user preferences
            migrate: (persistedState: any, version: number) => {
                // console.log(`Migrating state from version ${version}...`);
                
                // Initialize with current code defaults
                let newState = {
                    ...persistedState,
                    settings: defaultSettings
                };

                // If we have persisted settings, merge them intelligently over defaults
                if (persistedState && persistedState.settings) {
                    newState.settings = deepMerge(defaultSettings, persistedState.settings);
                }

                return newState;
            },
            
            partialize: (state) => ({ 
              authUser: state.authUser,
              isAuthenticated: state.isAuthenticated,
              token: state.token,
              settings: state.settings, // Persist all settings
              lang: state.lang,
              theme: state.theme,
              sidebarWidth: state.sidebarWidth,
              sidebarPreCollapseWidth: state.sidebarPreCollapseWidth,
              notifications: state.notifications,
              userCompanies: state.userCompanies,
              currentCompany: state.currentCompany,
              userRole: state.userRole,
              companiesLoaded: state.companiesLoaded,
              // Cache key reference data to avoid flicker on load
              products: state.products,
              warehouses: state.warehouses,
              inventoryLevels: state.inventoryLevels,
            }),
            
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.authLoading = false;
                    if (state.currentCompany) {
                        state.companiesLoaded = true;
                    }
                }
            }
        }
    )
);

// Initialize the accessor for services to use
setStore(useZustandStore);

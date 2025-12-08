
import { StateCreator } from 'zustand';
import { AuthUser, Company } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { CombinedState } from '../useStore';
import { defaultSettings } from './settingsSlice';

export interface AuthSlice {
    isAuthenticated: boolean;
    authUser: AuthUser | null;
    token: string | null;
    authLoading: boolean;
    
    // Multi-company state
    currentCompany: Company | null;
    userCompanies: Company[];
    userRole: 'owner' | 'admin' | 'manager' | 'employee' | null;
    companiesLoading: boolean;
    companiesLoaded: boolean;
    companiesError: string | null;

    login: (email: string, pass: string) => Promise<void>;
    register: (name: string, email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    setSession: (user: AuthUser | null, token: string | null) => void;
    
    // Multi-company actions
    setCurrentCompany: (company: Company, role: AuthSlice['userRole']) => void;
    switchCompany: (companyId: string) => Promise<void>;
    loadUserCompanies: (user: AuthUser) => Promise<void>; // Legacy/Fallback
    addUserCompany: (company: Company, role: AuthSlice['userRole']) => void;
    resetAuthAndCompanies: () => void;
}

export const createAuthSlice: StateCreator<CombinedState, [], [], AuthSlice> = (set, get) => ({
    isAuthenticated: false,
    authUser: null,
    token: null,
    authLoading: true,
    currentCompany: null,
    userCompanies: [],
    userRole: null,
    companiesLoading: true,
    companiesLoaded: false,
    companiesError: null,

    setSession: (user, token) => {
        set({
            authUser: user,
            token,
            isAuthenticated: !!user,
            // authLoading remains true until company is loaded via bootstrap
        });
    },

    login: async (email, pass) => {
        set({ authLoading: true });
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            set({ authLoading: false });
            throw error;
        }
        // Listener in App.tsx triggers bootstrap
    },

    register: async (name, email, pass) => {
        set({ authLoading: true });
        const { error } = await supabase.auth.signUp({ 
            email, 
            password: pass,
            options: {
                data: {
                    full_name: name,
                }
            }
        });
        set({ authLoading: false });
        if (error) throw error;
    },

    logout: async () => {
        set({ authLoading: true });
        await supabase.auth.signOut();
        get().resetAuthAndCompanies();
    },
    
    resetAuthAndCompanies: () => {
        localStorage.removeItem('currentCompanyId');
        set({
            isAuthenticated: false,
            authUser: null,
            token: null,
            authLoading: false,
            currentCompany: null,
            userCompanies: [],
            userRole: null,
            companiesLoaded: false, 
            companiesError: null,
            settings: defaultSettings,
            isDataReady: false,
        });
    },

    setCurrentCompany: (company, role) => {
        // Ensure this company is in the userCompanies list (if loading via bootstrap)
        const { userCompanies } = get();
        const exists = userCompanies.find(c => c.id === company.id);
        const newCompanies = exists ? userCompanies : [company, ...userCompanies];

        set({ 
            currentCompany: company, 
            userRole: role, 
            userCompanies: newCompanies,
            companiesLoaded: true,
            authLoading: false
        });
        localStorage.setItem('currentCompanyId', company.id);
    },

    switchCompany: async (companyId) => {
        const { userCompanies, authUser } = get();
        if (!authUser) return;
        
        const company = userCompanies.find(c => c.id === companyId);
        if (company) {
            const { data } = await supabase
                .from('user_company_roles')
                .select('role')
                .eq('company_id', companyId)
                .eq('user_id', authUser.id)
                .single();
            
            get().setCurrentCompany(company, data?.role || 'employee');
            // Trigger data refresh
             setTimeout(() => {
                get().fetchInitialData();
            }, 100);
        }
    },

    loadUserCompanies: async (user: AuthUser) => {
        console.warn("loadUserCompanies called - prefer bootstrapAuthAndCompany");
    },
    
    addUserCompany: (company, role) => {
        set(state => ({
            userCompanies: [...state.userCompanies, company],
            currentCompany: company,
            userRole: role,
            companiesLoading: false,
        }));
        localStorage.setItem('currentCompanyId', company.id);
    },
});

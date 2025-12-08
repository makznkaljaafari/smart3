
import { supabase } from '../lib/supabaseClient';
import { useZustandStore } from '../store/useStore';
import { AuthUser, Company, SettingsState } from '../types';
import { deepMerge } from '../lib/utils';
import { defaultSettings } from '../store/slices/settingsSlice';

/**
 * Bootstraps the authentication state and company context.
 * 1. Gets the session.
 * 2. Calls RPC 'onboard_current_user' to ensure profile/company exist and get data.
 * 3. Updates Zustand store.
 */
export async function bootstrapAuthAndCompany() {
  const store = useZustandStore.getState();
  
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (sessionError || !session) {
      store.resetAuthAndCompanies();
      return;
    }

    const user = session.user;
    let authUser: AuthUser | null = null;
    let currentCompany: Company | null = null;
    let role: any = 'employee';
    let settingsToUse = defaultSettings;

    // 1. Try the Magic RPC first (Optimized for new users/standard flow)
    const { data: onboardData, error: rpcError } = await supabase.rpc('onboard_current_user', {
      p_full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
      p_company_name: null, // Null means "get my existing default company"
      p_base_currency: 'SAR',
      p_lang: 'ar'
    });

    if (!rpcError && onboardData && onboardData.company) {
        // RPC Success
        const { profile, company, role: roleData, settings: dbSettings } = onboardData;
        
        authUser = {
            id: user.id,
            email: user.email!,
            name: profile.full_name || user.email,
            avatar: profile.avatar_url
        };
        
        currentCompany = {
            id: company.id,
            name: company.name,
            owner_id: company.owner_id,
            created_at: company.created_at
        };
        
        role = roleData.role || roleData;
        settingsToUse = deepMerge(defaultSettings, dbSettings || {}) as SettingsState;

    } else {
        // 2. Fallback: Manual Fetch for Legacy/Existing Users where RPC might fail
        console.warn("Onboarding RPC failed or returned no company, trying manual fetch...", rpcError);

        // Fetch existing link
        const { data: roles } = await supabase
            .from('user_company_roles')
            .select('role, companies(*)')
            .eq('user_id', user.id)
            .limit(1);

        if (roles && roles.length > 0 && roles[0].companies) {
            const companyData = roles[0].companies as any;
            
            currentCompany = {
                id: companyData.id,
                name: companyData.name,
                owner_id: companyData.owner_id,
                created_at: companyData.created_at
            };
            role = roles[0].role;
            
            authUser = {
                id: user.id,
                email: user.email!,
                name: user.user_metadata?.full_name || user.email?.split('@')[0],
                avatar: user.user_metadata?.avatar_url
            };
            
            // Try to get settings from metadata, else use default
            const metaSettings = user.user_metadata?.settings;
            if (metaSettings) {
                settingsToUse = deepMerge(defaultSettings, metaSettings) as SettingsState;
            }
        }
    }

    if (!currentCompany || !authUser) {
        console.error("No company found for user after fallback.");
        // We don't error out here, we let the App render CreateCompanyView if userCompanies is empty
        store.setSession({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || '',
        }, session.access_token);
        store.authLoading = false;
        store.companiesLoaded = true;
        return;
    }

    // Override profile specifics in settings to match Auth if needed
    settingsToUse.profile.name = authUser.name;
    settingsToUse.profile.locale = settingsToUse.profile.locale || 'ar';
    settingsToUse.baseCurrency = settingsToUse.baseCurrency || 'SAR';

    // 3. Dispatch to Store
    store.setSession(authUser, session.access_token);
    store.setCurrentCompany(currentCompany, role);
    store.setSettings(settingsToUse);
    
    // 4. Update UI State directly to unblock the loader
    useZustandStore.setState({
        lang: settingsToUse.profile.locale,
        companiesLoaded: true,
        companiesLoading: false,
        authLoading: false,
    });

    // 5. Trigger data fetch immediately
    store.fetchInitialData();

  } catch (error: any) {
    console.error("Bootstrap Exception:", error);
    store.addToast({ message: "Failed to initialize application.", type: 'error' });
    store.resetAuthAndCompanies();
  }
}

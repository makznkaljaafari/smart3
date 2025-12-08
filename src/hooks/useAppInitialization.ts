
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useZustandStore } from '../store/useStore';
import { bootstrapAuthAndCompany } from '../services/authBootstrap';

export const useAppInitialization = () => {
  const { 
    isAuthenticated, 
    companiesLoaded, 
    companiesError, 
    currentCompany, 
    userCompanies,
    authLoading
  } = useZustandStore(s => ({
    isAuthenticated: s.isAuthenticated,
    companiesLoaded: s.companiesLoaded,
    companiesError: s.companiesError,
    currentCompany: s.currentCompany,
    userCompanies: s.userCompanies,
    authLoading: s.authLoading
  }));

  useEffect(() => {
    const initAuth = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            bootstrapAuthAndCompany();
        } else {
            useZustandStore.getState().resetAuthAndCompanies();
        }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
         const state = useZustandStore.getState();
         if (!state.currentCompany) {
             await bootstrapAuthAndCompany();
         }
      } else if (event === 'SIGNED_OUT') {
        useZustandStore.getState().resetAuthAndCompanies();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    isAuthenticated,
    authLoading,
    companiesLoaded,
    companiesError,
    currentCompany,
    userCompanies
  };
};

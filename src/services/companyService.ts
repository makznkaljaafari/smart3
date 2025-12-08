
import { supabase } from '../lib/supabaseClient';
import { CurrencyCode, LangCode } from '../types.base';

/**
 * Service object for company-related database operations.
 */
export const companyService = {
  /**
   * Calls a Supabase RPC function to create a new company and assign the calling user as the owner.
   * This ensures atomicity on the backend.
   * @param name The name of the new company.
   * @returns A promise that resolves to the result of the RPC call.
   */
  async createCompany(name: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return { data: null, error: userError || new Error("User not authenticated.") };
    }

    try {
        const { data: newCompanyId, error: rpcError } = await supabase.rpc('create_new_company', {
            p_name: name
        });

        if (rpcError) {
            throw rpcError;
        }

        return { data: newCompanyId, error: null };

    } catch (error) {
        console.error("createCompany failed:", error);
        return { data: null, error: error as Error };
    }
  },

  /**
   * Calls the comprehensive onboarding RPC which handles profile creation, company creation,
   * and settings initialization in one transaction.
   */
  async onboardUser(fullName: string, companyName: string, currency: CurrencyCode = 'YER', lang: LangCode = 'ar') {
      const { data, error } = await supabase.rpc('onboard_current_user', {
          p_full_name: fullName,
          p_company_name: companyName,
          p_base_currency: currency,
          p_lang: lang
      });

      return { data, error };
  }
};

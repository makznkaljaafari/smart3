
import { supabase } from '../lib/supabaseClient';
import { SettingsState, ExchangeRate } from '../types';
import { keysToSnakeCase } from '../lib/utils';

export const settingsService = {
    /**
     * Updates the company_settings table in Supabase.
     */
    async updateCompanySettings(companyId: string, settings: Partial<SettingsState>) {
        const dbPayload: any = {};
        
        if (settings.baseCurrency) dbPayload.base_currency = settings.baseCurrency;
        
        // Persist custom currencies and enabled currencies in the 'config' column if your table supports it,
        // or map them if you have specific columns. Assuming we rely on user_metadata for these for now,
        // but ideally, we should store them in a JSONB column in company_settings.
        // Let's assume company_settings has a 'settings_json' or we rely on the profile update for now.
        // If you added a JSONB column `config` to `company_settings`:
        // dbPayload.config = { customCurrencies: settings.customCurrencies, enabledCurrencies: settings.enabledCurrencies };

        if (Object.keys(dbPayload).length === 0) return { error: null };

        const { error } = await supabase
            .from('company_settings')
            .upsert({ 
                company_id: companyId, 
                ...dbPayload,
                updated_at: new Date().toISOString()
            }, { onConflict: 'company_id' });
            
        return { error };
    },
    
    /**
     * Fetches company settings.
     */
    async getCompanySettings(companyId: string) {
        const { data, error } = await supabase
            .from('company_settings')
            .select('*')
            .eq('company_id', companyId)
            .single();
            
        return { data, error };
    },

    /**
     * Fetches exchange rates from the exchange_rates table.
     */
    async getExchangeRates(companyId: string) {
        const { data, error } = await supabase
            .from('exchange_rates')
            .select('*')
            .eq('company_id', companyId);

        if (error) return { data: [], error };

        const mappedRates: ExchangeRate[] = data.map((r: any) => ({
            id: r.id,
            from: r.from_currency,
            to: r.to_currency,
            rate: r.rate,
            date: r.effective_date || r.created_at
        }));

        return { data: mappedRates, error: null };
    },

    /**
     * Inserts a new exchange rate into the database.
     */
    async addExchangeRate(companyId: string, rate: ExchangeRate) {
        const payload = {
            company_id: companyId,
            from_currency: rate.from,
            to_currency: rate.to,
            rate: rate.rate,
            effective_date: rate.date
        };

        const { data, error } = await supabase
            .from('exchange_rates')
            .insert(payload)
            .select()
            .single();
            
        if (error) return { data: null, error };

        return { 
            data: {
                id: data.id,
                from: data.from_currency,
                to: data.to_currency,
                rate: data.rate,
                date: data.effective_date
            } as ExchangeRate, 
            error: null 
        };
    }
};

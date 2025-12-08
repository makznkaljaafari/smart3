
import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// ============================================================================
// Supabase Configuration
// ============================================================================

const SUPABASE_URL = config.supabase.url;
const SUPABASE_ANON_KEY = config.supabase.anonKey;

// Check if URL is valid (basic check)
const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && isValidUrl(SUPABASE_URL));

// Changing type to any to allow v2 methods even if types match v1 in environment
let supabase: any;

if (isSupabaseConfigured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
} else {
  console.warn("Supabase is not configured or URL is invalid. Running in Mock Mode. Please check your .env file.");
  console.warn("URL:", SUPABASE_URL);
  
  // Fallback mock to prevent crash
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: new Error("Supabase not configured") }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getUser: () => Promise.resolve({ data: { user: null }, error: new Error("Supabase not configured") }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      signUp: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({ 
        select: () => ({ 
            eq: () => ({ 
                single: () => Promise.resolve({ data: null, error: null }),
                order: () => ({ range: () => Promise.resolve({ data: [], count: 0, error: null }) }) 
            }),
            order: () => ({ range: () => Promise.resolve({ data: [], count: 0, error: null }) }) 
        }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }), in: () => Promise.resolve({ error: null }) }),
    }),
    rpc: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
    functions: {
        invoke: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") })
    }
  } as any;
}

export { supabase };

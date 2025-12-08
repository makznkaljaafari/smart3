
/**
 * Configuration Module
 * 
 * This module handles the extraction of environment variables.
 * It prioritizes import.meta.env (Vite) for browser environments,
 * and falls back to process.env for Node/Test environments safely.
 */

const getEnv = (key: string, fallback: string): string => {
  let value;

  // 1. Try import.meta.env (Vite - Browser)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
         // @ts-ignore
         value = import.meta.env[key];
    }
  } catch (e) {
    // Ignore error if import.meta is not defined
  }

  if (value) return value;

  // 2. Try process.env (Node/Container/Test) safely
  try {
    // Check if process is defined to avoid ReferenceError in strict browsers
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      value = process.env[key] as string;
    }
  } catch (e) {
    // Ignore error if process is not available
  }

  return value || fallback;
};

export const config = {
  supabase: {
    // Default to the provided linked project if available, but ensure it's valid
    url: getEnv('VITE_SUPABASE_URL', 'https://bskvohonudykwczzgqog.supabase.co'),
    anonKey: getEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJza3ZvaG9udWR5a3djenpncW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDA4ODEsImV4cCI6MjA3OTY3Njg4MX0.xA62ltpfLbzTent_qtxjpigoX6haCHy9wTazK_vQXFk'),
  },
  gemini: {
    // Critical: This attempts to get the API_KEY from the environment.
    // If the Proxy (Edge Function) fails, this key is used for client-side fallback.
    apiKey: getEnv('API_KEY', ''), 
  }
};

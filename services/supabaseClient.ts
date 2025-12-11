import { createClient } from '@supabase/supabase-js';

// Access environment variables securely
// Note: In Vite, env variables are accessed via import.meta.env
// We cast to any to avoid TypeScript errors when vite types aren't explicitly loaded
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Conditional export: null if config is missing to allow graceful degradation in UI
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper to check if supabase is configured
export const isSupabaseConfigured = () => !!supabase;
import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables
const getEnvVar = (key: string) => {
  // Check for Vite's import.meta.env
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }

  // Check for process.env (Standard Node/Webpack)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore errors
  }

  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Validate that keys are not placeholders
const isValidConfig = () => {
    if (!supabaseUrl || !supabaseAnonKey) return false;
    if (supabaseUrl.includes('your-project-id')) return false;
    if (supabaseAnonKey.includes('your_supabase_anon_key')) return false;
    return true;
};

// Conditional export: null if config is missing or invalid to allow graceful degradation in UI
export const supabase = isValidConfig()
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

// Helper to check if supabase is configured
export const isSupabaseConfigured = () => !!supabase;
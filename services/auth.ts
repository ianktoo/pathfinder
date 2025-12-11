import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserProfile } from '../types';

export const AuthService = {
  
  // Helper to ensure Supabase is ready
  checkConfig: () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase connection missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
    }
  },

  signInWithPassword: async (email: string, password: string) => {
    AuthService.checkConfig();
    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signUp: async (email: string, password: string, name?: string) => {
    AuthService.checkConfig();
    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  signInWithOtp: async (email: string) => {
    AuthService.checkConfig();
    const { data, error } = await supabase!.auth.signInWithOtp({
      email,
      options: {
        // Redirect back to the app after clicking the magic link
        emailRedirectTo: window.location.origin, 
      },
    });
    if (error) throw error;
    return data;
  },

  resetPasswordForEmail: async (email: string) => {
    AuthService.checkConfig();
    const { data, error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.auth.signOut();
      if (error) throw error;
    }
  },

  getCurrentUser: async () => {
    if (!isSupabaseConfigured()) return null;
    const { data: { user } } = await supabase!.auth.getUser();
    return user;
  },

  // Map Supabase User object to our internal UserProfile type
  mapUserToProfile: (supabaseUser: any): Partial<UserProfile> => {
    if (!supabaseUser) return {};
    return {
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Explorer',
      // City and Personality would typically be fetched from the 'profiles' table
      // For now, we return partial data
    };
  }
};
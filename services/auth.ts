import { supabase } from './supabaseClient';

export const AuthService = {
  signInWithPassword: async (email: string, password: string) => {
    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signUp: async (email: string, password: string, name?: string) => {
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
    const { data, error } = await supabase!.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },

  resetPasswordForEmail: async (email: string) => {
    const { data, error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase!.auth.signOut();
    if (error) throw error;
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase!.auth.getUser();
    if (error) throw error;
    return user;
  },

  mapUserToProfile: (supabaseUser: any): Partial<import('../types').UserProfile> => {
    if (!supabaseUser) return {};
    return {
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Explorer',
    };
  }
};
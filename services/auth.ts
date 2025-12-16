import { supabase, isSupabaseConfigured, getSupabaseUrl } from './supabaseClient';
import { UserProfile } from '../types';

const AUTH_TIMEOUT_MS = 30000; // 30 seconds max wait time

// Helper to diagnose connectivity issues
const diagnoseConnection = async () => {
  const url = getSupabaseUrl();
  if (!url) return "Configuration missing";
  try {
    // Supabase projects usually respond to / with 200 or 404, but at least they respond
    // We use a short timeout for the ping
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    // Ping health check endpoint instead of root
    const healthUrl = `${url}/auth/v1/health`;
    await fetch(healthUrl, { signal: controller.signal, mode: 'no-cors' });
    clearTimeout(id);
    return "Connection reachable";
  } catch (e) {
    return "Unable to reach Supabase URL. Check your internet or if the project is paused.";
  }
};

// Helper to prevent infinite hangs
const promiseWithTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise
  ]);
};

export const AuthService = {

  // Helper to ensure Supabase is ready
  checkConfig: () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase connection missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
    }
  },

  signInWithPassword: async (email: string, password: string) => {
    AuthService.checkConfig();
    try {
      return await promiseWithTimeout(
        (async () => {
          const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
          if (error) throw error;
          return data;
        })(),
        AUTH_TIMEOUT_MS,
        'Sign In'
      );
    } catch (error: any) {
      // Enhance error with connectivity info if it's a timeout
      if (error.message && error.message.includes('timed out')) {
        const diagnosis = await diagnoseConnection();
        throw new Error(`Sign In timed out. ${diagnosis}`);
      }
      throw error;
    }
  },

  signUp: async (email: string, password: string, name?: string) => {
    AuthService.checkConfig();
    return promiseWithTimeout(
      (async () => {
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
      })(),
      AUTH_TIMEOUT_MS,
      'Sign Up'
    );
  },

  signInWithOtp: async (email: string) => {
    AuthService.checkConfig();
    return promiseWithTimeout(
      (async () => {
        const { data, error } = await supabase!.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        return data;
      })(),
      AUTH_TIMEOUT_MS,
      'OTP Request'
    );
  },

  resetPasswordForEmail: async (email: string) => {
    AuthService.checkConfig();
    return promiseWithTimeout(
      (async () => {
        const { data, error } = await supabase!.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        return data;
      })(),
      AUTH_TIMEOUT_MS,
      'Password Reset'
    );
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      // Short timeout for sign out
      const { error } = await promiseWithTimeout(supabase!.auth.signOut(), 3000, 'Sign Out') as any;
      if (error) throw error;
    }
  },

  getCurrentUser: async () => {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data: { user } } = await promiseWithTimeout(supabase!.auth.getUser(), 5000, 'Get User') as any;
      return user;
    } catch (e) {
      return null;
    }
  },

  mapUserToProfile: (supabaseUser: any): Partial<UserProfile> => {
    if (!supabaseUser) return {};
    return {
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Explorer',
    };
  }
};
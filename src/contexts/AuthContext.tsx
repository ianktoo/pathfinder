import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { UserProfile } from '../types';
import { AuthService } from '../services/auth';
import { BackendService } from '../services/storage';
import { ModelRegistry } from '../services/ai';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    login: (user: Partial<UserProfile>) => void;
    logout: () => Promise<void>;
    updateProfile: (user: UserProfile) => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleUserSession = async (sessionUser: any) => {
        console.log("Handle User Session Start", sessionUser?.email);
        try {
            if (!sessionUser) {
                console.log("No user, clearing.");
                setUser(null);
                await BackendService.clearUser();
                return;
            }

            const authProfile = AuthService.mapUserToProfile(sessionUser);
            // Try to get extended profile
            console.log("Fetching local profile...");
            const localProfile = await BackendService.getUser(sessionUser);
            console.log("Local profile fetched.");
            // Note: In a real app we might fetch from 'profiles' table via Supabase, 
            // but BackendService handles the local/db mix for now.

            const mergedUser = { ...authProfile, ...(localProfile || {}) } as UserProfile;

            // Only update if actually changed to avoid render loops (simple check)
            setUser(mergedUser);
            await BackendService.saveUser(mergedUser);
            console.log("User set and saved.");
        } catch (e) {
            console.error("Error handling user session:", e);
        } finally {
            console.log("Loading set to false.");
            setIsLoading(false);
        }
    };

    // Safety Timeout
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                console.warn("Force clearing loading state after timeout");
                setIsLoading(false);
            }
        }, 4000); // 4 seconds max load time
        return () => clearTimeout(timer);
    }, [isLoading]);

    useEffect(() => {
        let mounted = true;

        // 1. Setup Listener
        const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
            console.log(`Auth event: ${event}`);
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (mounted) await handleUserSession(session?.user);
            } else if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setUser(null);
                    await BackendService.clearUser();
                    setIsLoading(false);
                }
            }
        });

        // 2. Initial Check
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase!.auth.getSession();
                if (mounted) {
                    if (session?.user) {
                        await handleUserSession(session.user);
                    } else {
                        // If no Supabase session, check local storage fallback
                        // This supports "Remember Me" if the SDK fails to init but we have data
                        const cached = await BackendService.getUser();
                        if (cached) {
                            console.log("Restoring off-line session");
                            setUser(cached);
                        }
                        setIsLoading(false);
                    }
                }
            } catch (err) {
                console.error("Init session error", err);
                if (mounted) setIsLoading(false);
            }
        };

        initSession();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (partialUser: Partial<UserProfile>) => {
        const newUser = { ...(user || {}), ...partialUser } as UserProfile;
        setUser(newUser);
        await BackendService.saveUser(newUser);
    };

    const logout = async () => {
        try {
            // Try to sign out on server, but give up after 800ms to ensure UI responsiveness
            await Promise.race([
                AuthService.signOut(),
                new Promise(resolve => setTimeout(resolve, 800))
            ]);
        } catch (e) {
            console.error("Sign out attempt failed or timed out", e);
        }

        setUser(null);

        // Clear user-specific data from BackendService
        await BackendService.clearUser();

        // Manually clear Supabase tokens to ensure they don't persist after reload
        // This is necessary because sometimes signOut() doesn't clear storage in time or fails
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.startsWith('supabase.')) {
                localStorage.removeItem(key);
            }
        });

        window.location.href = '/';
    };

    const updateProfile = async (updatedUser: UserProfile) => {
        setUser(updatedUser);
        await BackendService.saveUser(updatedUser);
    };

    const refreshSession = async () => {
        const { data: { session } } = await supabase!.auth.getSession();
        await handleUserSession(session?.user);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateProfile, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

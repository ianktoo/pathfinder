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

    // Use a ref to track the latest user state for event listeners (avoids stale closures)
    const userRef = useRef(user);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Failsafe Timeout to prevent infinite loading screens
    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            if (isLoading) {
                console.warn("Auth initialization timed out, forcing UI render.");
                setIsLoading(false);
            }
        }, 10000); // 10s safety timeout

        return () => clearTimeout(safetyTimer);
    }, [isLoading]);

    const refreshSession = async () => {
        try {
            if (isSupabaseConfigured()) {
                // Get the session directly; assume getSession handles its own internal timeouts nicely
                // or returns null if no session.
                const { data: { session }, error } = await supabase!.auth.getSession();

                if (session?.user && !error) {
                    // We have a valid session.
                    // 1. Get basic info from Auth
                    const authProfile = AuthService.mapUserToProfile(session.user);

                    // 2. Try to fetch full profile from DB (or fallback to local cache/session)
                    const fullProfile = await BackendService.getUser();
                    // Note: BackendService.getUser() internally handles the DB/Local merge fallback logic.

                    const finalUser = (fullProfile || authProfile) as UserProfile;

                    setUser(finalUser);
                    // Ensure local storage is in sync immediately
                    await BackendService.saveUser(finalUser);
                    setIsLoading(false);
                    return;
                }
            }

            // Fallback: If no Supabase session (or not configured), check Local Storage
            const cachedUser = await BackendService.getUser();
            if (cachedUser) {
                console.log("Restoring session from local storage.");
                setUser(cachedUser);
            } else {
                setUser(null);
            }
        } catch (e) {
            console.error("Session check failed", e);
            // Even on error, we must stop loading
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        ModelRegistry.init();
        refreshSession();

        // Listen for Auth Changes from Supabase
        let authListener: any = null;
        if (isSupabaseConfigured()) {
            const { data } = supabase!.auth.onAuthStateChange(async (event, session) => {
                console.log(`Auth event: ${event}`);
                try {
                    if (event === 'SIGNED_IN' && session?.user) {
                        const currentUser = userRef.current;
                        if (currentUser && currentUser.email === session.user.email) {
                            // Already logged in, but we might want to refresh data just in case
                            return;
                        }

                        // Fresh login
                        const authProfile = AuthService.mapUserToProfile(session.user);

                        // Try to get existing profile data (e.g. from previous local session or DB)
                        const localProfile = await BackendService.getUser();

                        const mergedUser = { ...authProfile, ...(localProfile || {}) } as UserProfile;

                        setUser(mergedUser);
                        await BackendService.saveUser(mergedUser);
                        setIsLoading(false);

                    } else if (event === 'SIGNED_OUT') {
                        // Clear state
                        setUser(null);
                        await BackendService.clearUser();
                        setIsLoading(false);
                    }
                } catch (error) {
                    console.error("Auth state change error:", error);
                    setIsLoading(false);
                }
            });
            authListener = data.subscription;
        }

        return () => {
            if (authListener) authListener.unsubscribe();
        };
    }, []);

    const login = async (partialUser: Partial<UserProfile>) => {
        // If we constitute a user from a partial object (e.g. initial registration flow before full profile),
        // we update state.
        // NOTE: This usually comes from the UI "optimistically" or during onboarding.
        const newUser = { ...(user || {}), ...partialUser } as UserProfile;
        setUser(newUser);
        await BackendService.saveUser(newUser);
    };

    const logout = async () => {
        try {
            await AuthService.signOut();
        } catch (e) { console.error(e); }
        // State cleaning happens in onAuthStateChange(SIGNED_OUT), 
        // but we force it here to be responsive in case network fails.
        await BackendService.clearUser();
        setUser(null);
    };

    const updateProfile = async (updatedUser: UserProfile) => {
        setUser(updatedUser);
        await BackendService.saveUser(updatedUser);
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

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
    updateProfile: (user: UserProfile) => void;
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

    // Failsafe Timeout
    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            if (isLoading) {
                console.warn("Auth initialization timed out, forcing UI render.");
                setIsLoading(false);
            }
        }, 8000); // 8s safety timeout

        return () => clearTimeout(safetyTimer);
    }, [isLoading]);

    const refreshSession = async () => {
        try {
            if (isSupabaseConfigured()) {
                const sessionPromise = supabase!.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Supabase timeout')), 5000)
                );

                try {
                    // @ts-ignore
                    const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);

                    if (session?.user && !error) {
                        const profile = AuthService.mapUserToProfile(session.user);
                        const fullProfile = await BackendService.getUser();
                        const finalUser = (fullProfile || profile) as UserProfile;

                        setUser(finalUser);
                        setIsLoading(false);
                        return;
                    }
                } catch (err) {
                    console.warn("Backend session check issue, fallback to local.");
                }
            }

            // Fallback to Local Storage
            const cachedUser = await BackendService.getUser();
            if (cachedUser) {
                setUser(cachedUser);
            }
        } catch (e) {
            console.error("Session check failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        ModelRegistry.init();
        refreshSession();

        // Listen for Auth Changes
        let authListener: any = null;
        if (isSupabaseConfigured()) {
            const { data } = supabase!.auth.onAuthStateChange(async (event, session) => {
                try {
                    if (event === 'SIGNED_IN' && session?.user) {
                        const currentUser = userRef.current;
                        if (currentUser && currentUser.email === session.user.email) {
                            return; // Already logged in
                        }

                        const profile = AuthService.mapUserToProfile(session.user);
                        const localProfile = await BackendService.getUser();
                        setUser({ ...profile, ...localProfile } as UserProfile);
                        setIsLoading(false);
                    } else if (event === 'SIGNED_OUT') {
                        setUser(null);
                        setIsLoading(false);
                        await BackendService.clearUser();
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

    const login = (partialUser: Partial<UserProfile>) => {
        // Determine if it's a full profile or partial (needs onboarding)
        // For now we just set state, the router decides where to go
        setUser(partialUser as UserProfile);
    };

    const logout = async () => {
        try {
            await AuthService.signOut();
        } catch (e) { console.error(e); }
        await BackendService.clearUser();
        setUser(null);
    };

    const updateProfile = (updatedUser: UserProfile) => {
        setUser(updatedUser);
        BackendService.saveUser(updatedUser);
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

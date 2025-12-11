import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Loader2 } from 'lucide-react';

import { UserProfile, Itinerary, ViewState } from './types';
import { ModelRegistry } from './services/ai';
import { BackendService } from './services/storage';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { AuthService } from './services/auth';

import { LandingPage } from './components/views/LandingPage';
import { AboutPage } from './components/views/AboutPage';
import { PrivacyPage } from './components/views/PrivacyPage';
import { AuthView } from './components/views/AuthView';
import { OnboardingView } from './components/views/OnboardingView';
import { Dashboard } from './components/views/Dashboard';
import { CreateItineraryView } from './components/views/CreateItineraryView';
import { SettingsView } from './components/views/SettingsView';
import { CommunityView } from './components/views/CommunityView';
import { ProfileView } from './components/views/ProfileView';

import { ToastProvider } from './components/ui/toast';
import { CookieConsent } from './components/ui/cookie-consent';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<ViewState>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Load initial data & Auth Session
  useEffect(() => {
    ModelRegistry.init();
    
    // Initial User Check (Local or Supabase)
    const checkUser = async () => {
        try {
            // 1. Try Supabase Session first
            if (isSupabaseConfigured()) {
                // Use Promise.race to prevent hanging if Supabase client is misconfigured/blocked
                const sessionPromise = supabase!.auth.getSession();
                const { data: { session }, error } = await Promise.race([
                    sessionPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 3000))
                ]) as any;
                
                if (session?.user && !error) {
                    const profile = AuthService.mapUserToProfile(session.user);
                    
                    // Merge with locally stored profile data
                    const fullProfile = await BackendService.getUser();
                    
                    // Prefer DB profile, fallback to Auth metadata
                    const finalUser = (fullProfile || profile) as UserProfile;
                    setUser(finalUser);
                    
                    // Fetch saved itineraries for user (don't await strictly to unblock UI)
                    BackendService.getSavedItineraries().then(setSavedItineraries);
                    
                    setView('dashboard');
                    return; // Exit early
                }
            }

            // 2. Fallback to Local Storage (Offline/Demo mode)
            const cachedUser = await BackendService.getUser();
            if (cachedUser) {
                setUser(cachedUser);
                const saved = await BackendService.getSavedItineraries();
                setSavedItineraries(saved);
                setView('dashboard');
            }
        } catch (e) {
            console.error("Session check failed or timed out", e);
        } finally {
            setIsLoading(false);
        }
    };

    checkUser();

    // Listen for Auth Changes (Supabase)
    let authListener: any = null;
    if (isSupabaseConfigured()) {
        const { data } = supabase!.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const profile = AuthService.mapUserToProfile(session.user);
                const localProfile = await BackendService.getUser();
                setUser({ ...profile, ...localProfile } as UserProfile);
                
                const saved = await BackendService.getSavedItineraries();
                setSavedItineraries(saved);
                
                setView('dashboard');
                setIsLoading(false); // Ensure loading is cleared on auth change
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setSavedItineraries([]);
                setView('home');
                setIsLoading(false);
            }
        });
        authListener = data.subscription;
    }

    return () => {
        if (authListener) authListener.unsubscribe();
    };
  }, []);

  const handleLogin = async (partialUser: Partial<UserProfile>) => {
    // This is called by AuthView after successful login logic
    const existing = await BackendService.getUser();
    if (existing || (partialUser.city && partialUser.personality)) {
       setView('dashboard');
    } else {
       // New user needs onboarding details
       setView('onboarding');
    }
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    const fullProfile = { ...user, ...profile };
    setUser(fullProfile);
    await BackendService.saveUser(fullProfile);
    setView('dashboard');
  };

  const handleSaveItinerary = async (itinerary: Itinerary) => {
    await BackendService.saveItinerary(itinerary);
    // Refresh list
    const saved = await BackendService.getSavedItineraries();
    setSavedItineraries(saved);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await AuthService.signOut(); 
    await BackendService.clearUser();
    setUser(null);
    setSavedItineraries([]);
    setView('home');
  };

  const handleCloneItinerary = async (itinerary: Itinerary) => {
    const cloned = { ...itinerary, id: crypto.randomUUID(), title: `(Copy) ${itinerary.title}` };
    await handleSaveItinerary(cloned);
  };
  
  const handleRemixItinerary = async (itinerary: Itinerary) => {
    const remixed = { 
        ...itinerary, 
        id: crypto.randomUUID(), 
        title: `(Remix) ${itinerary.title}`,
        shared: false
    };
    await handleSaveItinerary(remixed);
    alert("Itinerary remixed! You can now find it in your library.");
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
      setUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-stone-50 dark:bg-neutral-950 gap-4">
        <Loader2 className="animate-spin text-orange-600 w-10 h-10" />
        <p className="text-stone-400 font-bold text-sm animate-pulse">Initializing Pathfinder...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
        <CookieConsent />
        {/* Router Logic */}
        {(() => {
            if (view === 'home') return <LandingPage onGetStarted={() => user ? setView('dashboard') : setView('auth')} onNavigate={setView} />;
            if (view === 'about') return <AboutPage onNavigate={setView} onSignIn={() => user ? setView('dashboard') : setView('auth')} />;
            if (view === 'privacy') return <PrivacyPage onNavigate={setView} onSignIn={() => user ? setView('dashboard') : setView('auth')} />;
            if (view === 'auth') return <AuthView onLogin={handleLogin} onBack={() => setView('home')} />;
            if (view === 'onboarding') return <OnboardingView onComplete={handleOnboardingComplete} />;

            // Protected Routes
            if (user) {
                return (
                <>
                    {view === 'create' ? (
                    <CreateItineraryView user={user} onClose={() => setView('dashboard')} onSave={handleSaveItinerary} />
                    ) : view === 'community' ? (
                        <CommunityView onBack={() => setView('dashboard')} onClone={handleCloneItinerary} />
                    ) : view === 'profile' ? (
                        <ProfileView user={user} onBack={() => setView('dashboard')} onUpdate={handleUpdateProfile} onLogout={handleLogout} />
                    ) : (
                    <Dashboard 
                        user={user} 
                        savedItineraries={savedItineraries} 
                        onCreateClick={() => setView('create')}
                        onLogout={handleLogout}
                        onOpenSettings={() => setShowSettings(true)}
                        onNavigate={setView}
                        onRemix={handleRemixItinerary}
                    />
                    )}
                    {showSettings && <SettingsView onClose={() => setShowSettings(false)} />}
                </>
                );
            }
            return <div />;
        })()}
    </ToastProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
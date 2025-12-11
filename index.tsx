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

  // Load initial data & Auth Session
  useEffect(() => {
    ModelRegistry.init();
    
    // Load local itineraries (will eventually be replaced by Supabase fetch)
    const saved = BackendService.getSavedItineraries();
    setSavedItineraries(saved);

    // Initial User Check (Local or Supabase)
    const checkUser = async () => {
        // 1. Try Supabase Session first
        if (isSupabaseConfigured()) {
            const { data: { session } } = await supabase!.auth.getSession();
            if (session?.user) {
                const profile = AuthService.mapUserToProfile(session.user);
                // Merge with locally stored profile data (e.g. city/personality) if available
                const localProfile = BackendService.getUser();
                setUser({ ...profile, ...localProfile } as UserProfile);
                setView('dashboard');
                setIsLoading(false);
                return;
            }
        }

        // 2. Fallback to Local Storage (Offline/Demo mode)
        const cachedUser = BackendService.getUser();
        if (cachedUser) {
            setUser(cachedUser);
        }
        setIsLoading(false);
    };

    checkUser();

    // Listen for Auth Changes (Supabase)
    let authListener: any = null;
    if (isSupabaseConfigured()) {
        const { data } = supabase!.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const profile = AuthService.mapUserToProfile(session.user);
                const localProfile = BackendService.getUser();
                setUser({ ...profile, ...localProfile } as UserProfile);
                setView('dashboard');
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setView('home');
            }
        });
        authListener = data.subscription;
    }

    return () => {
        if (authListener) authListener.unsubscribe();
    };
  }, []);

  const handleLogin = (partialUser: Partial<UserProfile>) => {
    // This is called by AuthView after successful login logic
    // We check if we have a full profile locally
    const existing = BackendService.getUser();
    if (existing || (partialUser.city && partialUser.personality)) {
       setView('dashboard');
    } else {
       // New user needs onboarding details
       setView('onboarding');
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    const fullProfile = { ...user, ...profile };
    setUser(fullProfile);
    BackendService.saveUser(fullProfile);
    setView('dashboard');
  };

  const handleSaveItinerary = (itinerary: Itinerary) => {
    const newStats = [itinerary, ...savedItineraries];
    setSavedItineraries(newStats);
    BackendService.saveItinerary(itinerary);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await AuthService.signOut(); // Signs out of Supabase
    BackendService.clearUser(); // Clears local storage
    setUser(null);
    setView('home');
  };

  const handleCloneItinerary = (itinerary: Itinerary) => {
    const cloned = { ...itinerary, id: Date.now().toString(), title: `(Copy) ${itinerary.title}` };
    handleSaveItinerary(cloned);
  };
  
  const handleRemixItinerary = (itinerary: Itinerary) => {
    const remixed = { 
        ...itinerary, 
        id: Date.now().toString(), 
        title: `(Remix) ${itinerary.title}`,
        shared: false
    };
    handleSaveItinerary(remixed);
    alert("Itinerary remixed! You can now find it in your library.");
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
      setUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50 dark:bg-neutral-950">
        <Loader2 className="animate-spin text-orange-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <ToastProvider>
        <CookieConsent />
        {/* Router Logic */}
        {(() => {
            if (view === 'home') return <LandingPage onGetStarted={() => user ? setView('dashboard') : setView('auth')} onNavigate={setView} />;
            if (view === 'about') return <AboutPage onBack={() => setView('home')} />;
            if (view === 'privacy') return <PrivacyPage onBack={() => setView('home')} />;
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

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
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

// Wrapper to handle auth protection
const RequireAuth = ({ children, user, isLoading }: { children?: React.ReactNode, user: UserProfile | null, isLoading: boolean }) => {
    if (isLoading) return null; // Let the main loader handle this
    if (!user) return <Navigate to="/auth" replace />;
    return <>{children}</>;
};

function PathfinderApp() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  // CRITICAL: Keep track of latest user state for event listeners
  const userRef = useRef(user);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Navigation Adapter for existing components
  const handleNavigate = (view: ViewState) => {
    switch(view) {
        case 'home': navigate('/'); break;
        case 'auth': navigate('/auth'); break;
        case 'dashboard': navigate('/dashboard'); break;
        case 'create': navigate('/create'); break;
        case 'community': navigate('/community'); break;
        case 'profile': navigate('/profile'); break;
        case 'about': navigate('/about'); break;
        case 'privacy': navigate('/privacy'); break;
        case 'onboarding': navigate('/onboarding'); break;
        default: navigate('/');
    }
  };

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Failsafe Timeout
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.warn("Initialization timed out, forcing UI render.");
        setIsLoading(false);
      }
    }, 2500); 

    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  // Load initial data & Auth Session
  useEffect(() => {
    ModelRegistry.init();
    
    const checkUser = async () => {
        try {
            if (isSupabaseConfigured()) {
                const sessionPromise = supabase!.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Supabase timeout')), 2000)
                );

                try {
                    // @ts-ignore
                    const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
                    
                    if (session?.user && !error) {
                        const profile = AuthService.mapUserToProfile(session.user);
                        const fullProfile = await BackendService.getUser();
                        const finalUser = (fullProfile || profile) as UserProfile;
                        
                        setUser(finalUser);
                        BackendService.getSavedItineraries().then(setSavedItineraries);
                        
                        if (location.pathname === '/' || location.pathname === '/auth') {
                            navigate('/dashboard', { replace: true });
                        }
                        
                        setIsLoading(false);
                        return; 
                    }
                } catch (err) {
                    console.warn("Backend session check issue, fallback to local.");
                }
            } else {
                console.log("Supabase not configured, using local mode.");
            }

            // Fallback to Local Storage
            const cachedUser = await BackendService.getUser();
            if (cachedUser) {
                setUser(cachedUser);
                const saved = await BackendService.getSavedItineraries();
                setSavedItineraries(saved);
                if (location.pathname === '/' || location.pathname === '/auth') {
                    navigate('/dashboard', { replace: true });
                }
            }
        } catch (e) {
            console.error("Session check failed", e);
        } finally {
            if (isLoading) setIsLoading(false);
        }
    };

    checkUser();

    // Listen for Auth Changes
    let authListener: any = null;
    if (isSupabaseConfigured()) {
        const { data } = supabase!.auth.onAuthStateChange(async (event, session) => {
            try {
                if (event === 'SIGNED_IN' && session?.user) {
                    // CRITICAL FIX: Use ref to check current user state to avoid stale closure loop
                    const currentUser = userRef.current;
                    if (currentUser && currentUser.email === session.user.email) {
                        return; // Already logged in, ignore
                    }

                    const profile = AuthService.mapUserToProfile(session.user);
                    const localProfile = await BackendService.getUser();
                    setUser({ ...profile, ...localProfile } as UserProfile);
                    
                    const saved = await BackendService.getSavedItineraries();
                    setSavedItineraries(saved);
                    
                    const currentPath = locationRef.current.pathname;
                    if (currentPath === '/' || currentPath === '/auth') {
                        navigate('/dashboard');
                    }
                    setIsLoading(false); 
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setSavedItineraries([]);
                    navigate('/');
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

  const handleLogin = (partialUser: Partial<UserProfile>) => {
    // Optimistic Login
    if (partialUser.name && (partialUser.city && partialUser.personality)) {
       setUser(partialUser as UserProfile);
       navigate('/dashboard');
    } else {
       setUser(partialUser as UserProfile);
       navigate('/onboarding');
    }
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    const fullProfile = { ...user, ...profile };
    setUser(fullProfile);
    await BackendService.saveUser(fullProfile);
    navigate('/dashboard');
  };

  const handleSaveItinerary = async (itinerary: Itinerary) => {
    await BackendService.saveItinerary(itinerary);
    const saved = await BackendService.getSavedItineraries();
    setSavedItineraries(saved);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
        await AuthService.signOut();
    } catch (e) { console.error(e); } 
    await BackendService.clearUser();
    setUser(null);
    setSavedItineraries([]);
    navigate('/');
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-stone-50 dark:bg-neutral-950 gap-4">
        <Loader2 className="animate-spin text-orange-600 w-10 h-10" />
        <div className="flex flex-col items-center gap-1">
            <p className="text-stone-400 font-bold text-sm animate-pulse">Initializing Pathfinder...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
        <CookieConsent />
        <Routes>
            <Route path="/" element={<LandingPage onGetStarted={() => user ? navigate('/dashboard') : navigate('/auth')} onNavigate={handleNavigate} />} />
            <Route path="/about" element={<AboutPage onNavigate={handleNavigate} onSignIn={() => user ? navigate('/dashboard') : navigate('/auth')} />} />
            <Route path="/privacy" element={<PrivacyPage onNavigate={handleNavigate} onSignIn={() => user ? navigate('/dashboard') : navigate('/auth')} />} />
            <Route path="/auth" element={<AuthView onLogin={handleLogin} onBack={() => navigate('/')} />} />

            <Route path="/onboarding" element={
                <RequireAuth user={user} isLoading={isLoading}>
                    <OnboardingView onComplete={handleOnboardingComplete} />
                </RequireAuth>
            } />
            <Route path="/dashboard" element={
                <RequireAuth user={user} isLoading={isLoading}>
                    <Dashboard 
                        user={user!} 
                        savedItineraries={savedItineraries} 
                        onCreateClick={() => navigate('/create')}
                        onLogout={handleLogout}
                        onOpenSettings={() => setShowSettings(true)}
                        onNavigate={handleNavigate}
                        onRemix={handleRemixItinerary}
                    />
                </RequireAuth>
            } />
            <Route path="/create" element={
                <RequireAuth user={user} isLoading={isLoading}>
                    <CreateItineraryView user={user!} onClose={() => navigate('/dashboard')} onSave={handleSaveItinerary} />
                </RequireAuth>
            } />
            <Route path="/community" element={
                <RequireAuth user={user} isLoading={isLoading}>
                    <CommunityView onBack={() => navigate('/dashboard')} onClone={handleCloneItinerary} />
                </RequireAuth>
            } />
            <Route path="/profile" element={
                <RequireAuth user={user} isLoading={isLoading}>
                    <ProfileView user={user!} onBack={() => navigate('/dashboard')} onUpdate={handleUpdateProfile} onLogout={handleLogout} />
                </RequireAuth>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {showSettings && <SettingsView onClose={() => setShowSettings(false)} />}
    </ToastProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(
    <BrowserRouter>
        <PathfinderApp />
    </BrowserRouter>
);
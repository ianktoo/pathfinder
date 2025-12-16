import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';

import { UserProfile, Itinerary, ViewState } from './types';
import { BackendService } from './services/storage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RequireAuth } from './components/auth/RequireAuth';

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
import { LoadingScreen } from './components/ui/LoadingScreen';

// Wrapper to handle auth protection
const RequireAuth = ({ children, user, isLoading }: { children?: React.ReactNode, user: UserProfile | null, isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-stone-50 dark:bg-neutral-950 gap-4">
        <Loader2 className="animate-spin text-orange-600 w-10 h-10" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
  // Helper for pages that should only be accessible when logged out
  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) return <LoadingScreen />;
    if (user) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  };

  function AppRoutes() {
    const { user, login, logout, updateProfile } = useAuth();
    const [showSettings, setShowSettings] = useState(false);
    const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>([]);

    const navigate = useNavigate();
    const location = useLocation();

    // Load Itineraries when user connects
    useEffect(() => {
      if (user) {
        BackendService.getSavedItineraries().then(setSavedItineraries);
      } else {
        setSavedItineraries([]);
      }
    }, [user]);

    // View routing handler
    const handleNavigate = (view: ViewState) => {
      switch (view) {
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

    // Logic Handlers
    const handleLogin = (partialUser: Partial<UserProfile>) => {
      login(partialUser);
      if (partialUser.name && partialUser.city && partialUser.personality) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    };
    // Theme Init
    useEffect(() => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, []);

    // Initialize & Auth Listener
    useEffect(() => {
      ModelRegistry.init();

      // 1. Initial Load Check
      const initializeApp = async () => {
        try {
          // Check Local Storage first for immediate render
          const cachedUser = await BackendService.getUser();
          if (cachedUser) {
            setUser(cachedUser);
            BackendService.getSavedItineraries().then(setSavedItineraries);
          }

          if (isSupabaseConfigured()) {
            const { data: { session } } = await supabase!.auth.getSession();
            if (session?.user) {
              const basicProfile = AuthService.mapUserToProfile(session.user);
              // Merge session data with cache to ensure freshness
              const merged = { ...cachedUser, ...basicProfile } as UserProfile;
              setUser(merged);

              // Route protection logic
              if (location.pathname === '/' || location.pathname === '/auth') {
                navigate('/dashboard', { replace: true });
              }

              // Hydrate full data in background
              BackendService.getUser().then(full => {
                if (full) setUser(prev => ({ ...prev, ...full } as UserProfile));
              });
              BackendService.getSavedItineraries().then(setSavedItineraries);
            }
          }
        } catch (e) {
          console.error("Init error", e);
        } finally {
          setIsLoading(false);
        }
      };

      initializeApp();

      // 2. Real-time Auth Listener
      let authListener: any = null;
      if (isSupabaseConfigured()) {
        const { data } = supabase!.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            // OPTIMISTIC UPDATE: Don't wait for DB
            const basicProfile = AuthService.mapUserToProfile(session.user);

            setUser(prev => {
              // Only update if actually different to avoid re-renders
              if (prev?.email === basicProfile.email) return prev;
              return { ...prev, ...basicProfile } as UserProfile;
            });

            // Immediate redirect if on auth pages
            const currentPath = locationRef.current.pathname;
            if (currentPath === '/' || currentPath === '/auth') {
              navigate('/dashboard');
            }

            setIsLoading(false);

            // Background Sync
            const fullProfile = await BackendService.getUser();
            if (fullProfile) {
              setUser(fullProfile);
            }
            const saved = await BackendService.getSavedItineraries();
            setSavedItineraries(saved);

          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSavedItineraries([]);
            navigate('/');
            setIsLoading(false);
          }
        });
        authListener = data.subscription;
      }

      return () => {
        if (authListener) authListener.unsubscribe();
      };
    }, []);

    const handleOnboardingComplete = async (profile: UserProfile) => {
      const fullProfile = { ...(user || {}), ...profile } as UserProfile;
      updateProfile(fullProfile);
      navigate('/dashboard');
    };

    const handleSaveItinerary = async (itinerary: Itinerary) => {
      await BackendService.saveItinerary(itinerary);
      // Refresh list
      const saved = await BackendService.getSavedItineraries();
      setSavedItineraries(saved);
      navigate('/dashboard');
    };

    const handleLogout = async () => {
      setIsLoading(true);
      await AuthService.signOut();
      await BackendService.clearUser();
      setUser(null);
      setSavedItineraries([]);
      navigate('/');
      setIsLoading(false);
    };

    const handleCloneItinerary = async (itinerary: Itinerary) => {
      const cloned = { ...itinerary, id: crypto.randomUUID(), title: `(Copy) ${itinerary.title}`, shared: false, bookmarked: false };
      await handleSaveItinerary(cloned);
      alert("Itinerary added to your library!");
    };

    const handleRemixItinerary = async (itinerary: Itinerary) => {
      const remixed = {
        ...itinerary,
        id: crypto.randomUUID(),
        title: `(Remix) ${itinerary.title}`,
        shared: false
    const remixed = {
          ...itinerary,
          id: crypto.randomUUID(),
          title: `(Remix) ${itinerary.title}`,
          shared: false,
          bookmarked: false
        };
        await handleSaveItinerary(remixed);
        alert("Itinerary remixed! You can now find it in your library.");
      };

      // Initialize Theme
      const handleUpdateProfile = (updatedUser: UserProfile) => {
        setUser(updatedUser);
      };

      // If loading takes too long, just show the app (failsafe)
      useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        window.scrollTo(0, 0);
      }, [location.pathname]);

      const timer = setTimeout(() => setIsLoading(false), 3000);
      return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-stone-50 dark:bg-neutral-950 gap-4">
          <Loader2 className="animate-spin text-orange-600 w-10 h-10" />
          <p className="text-stone-400 font-bold text-sm animate-pulse">Starting Pathfinder...</p>
        </div>
      );
    }

    return (
    <>
        <Routes>
          <Route path="/" element={<LandingPage onGetStarted={() => user ? navigate('/dashboard') : navigate('/auth')} onNavigate={handleNavigate} />} />
          <Route path="/about" element={<AboutPage onNavigate={handleNavigate} onSignIn={() => user ? navigate('/dashboard') : navigate('/auth')} />} />
          <Route path="/privacy" element={<PrivacyPage onNavigate={handleNavigate} onSignIn={() => user ? navigate('/dashboard') : navigate('/auth')} />} />

          <Route path="/auth" element={
            <PublicRoute>
              <AuthView onLogin={handleLogin} onBack={() => navigate('/')} />
            </PublicRoute>
          } />
          <ToastProvider>
            <CookieConsent />
            <Routes>
              <Route path="/" element={<LandingPage onGetStarted={() => user ? navigate('/dashboard') : navigate('/auth')} onNavigate={handleNavigate} />} />
              <Route path="/about" element={<AboutPage onNavigate={handleNavigate} onSignIn={() => user ? navigate('/dashboard') : navigate('/auth')} />} />
              <Route path="/privacy" element={<PrivacyPage onNavigate={handleNavigate} onSignIn={() => user ? navigate('/dashboard') : navigate('/auth')} />} />

              {/* AuthView no longer needs onLogin prop for logic, just for optimistic local updates if desired, but we rely on listener now */}
              <Route path="/auth" element={<AuthView onBack={() => navigate('/')} />} />

              <Route path="/onboarding" element={
                <RequireAuth>
                  <OnboardingView onComplete={handleOnboardingComplete} />
                </RequireAuth>
              } />

              <Route path="/dashboard" element={
                <RequireAuth>
                  <Dashboard
                    user={user!}
                    savedItineraries={savedItineraries}
                    onCreateClick={() => navigate('/create')}
                    onLogout={logout}
                    onOpenSettings={() => setShowSettings(true)}
                    onNavigate={handleNavigate}
                    onRemix={handleRemixItinerary}
                  />
                </RequireAuth>
              } />

              <Route path="/create" element={
                <RequireAuth>
                  <CreateItineraryView user={user!} onClose={() => navigate('/dashboard')} onSave={handleSaveItinerary} />
                </RequireAuth>
              } />

              <Route path="/community" element={
                <RequireAuth>
                  <CommunityView onBack={() => navigate('/dashboard')} onClone={handleCloneItinerary} />
                </RequireAuth>
              } />

              <Route path="/profile" element={
                <RequireAuth>
                  <ProfileView user={user!} onBack={() => navigate('/dashboard')} onUpdate={updateProfile} onLogout={logout} />
                </RequireAuth>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {showSettings && <SettingsView onClose={() => setShowSettings(false)} />}
          </>
          );
}

          function PathfinderApp() {
  return (
          <ToastProvider>
            <CookieConsent />
            <AuthProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>
          </ToastProvider>
          );
}

          const root = createRoot(document.getElementById('root')!);
          root.render(<PathfinderApp />);
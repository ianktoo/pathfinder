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

// Helper for pages that should only be accessible when logged out
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  const { user, isLoading, logout, updateProfile } = useAuth();
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

  // Theme Init
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
      shared: false,
      bookmarked: false
    };
    await handleSaveItinerary(remixed);
    alert("Itinerary remixed! You can now find it in your library.");
  };

  if (isLoading) {
    return <LoadingScreen message="Starting Pathfinder..." />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage onGetStarted={() => user ? navigate('/dashboard') : navigate('/auth')} onNavigate={handleNavigate} />} />
        <Route path="/about" element={<AboutPage onNavigate={handleNavigate} onSignIn={() => user ? navigate('/dashboard') : navigate('/auth')} />} />
        <Route path="/privacy" element={<PrivacyPage onNavigate={handleNavigate} onSignIn={() => user ? navigate('/dashboard') : navigate('/auth')} />} />

        {/* AuthView no longer needs onLogin prop for logic, just for optimistic local updates if desired, but we rely on listener now */}
        <Route path="/auth" element={
          <PublicRoute>
            <AuthView onBack={() => navigate('/')} onLoginSuccess={() => navigate('/dashboard')} />
          </PublicRoute>
        } />

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
            <CommunityView
              user={user!}
              onNavigate={handleNavigate}
              onLogout={logout}
              onBack={() => navigate('/dashboard')}
              onClone={handleCloneItinerary}
            />
          </RequireAuth>
        } />

        <Route path="/profile" element={
          <RequireAuth>
            <ProfileView
              user={user!}
              onBack={() => navigate('/dashboard')}
              onUpdate={updateProfile}
              onLogout={logout}
              onNavigate={handleNavigate}
            />
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
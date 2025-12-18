import React, { useState, useEffect } from 'react';
import { useRoutes, useNavigate, Navigate, useLocation } from 'react-router-dom';

import { UserProfile, Itinerary, ViewState } from './types';
import { BackendService } from './services/storage';
import { useAuth } from './contexts/AuthContext';
import { RequireAuth } from './components/auth/RequireAuth';

import { LandingPage } from './components/views/LandingPage';
import { AboutPage } from './components/views/AboutPage';
import { PrivacyPage } from './components/views/PrivacyPage';
import { AuthView } from './components/views/AuthView';
import { OnboardingView } from './components/views/OnboardingView';
import { Dashboard } from './components/views/Dashboard';
import { CreateItineraryView } from './components/views/CreateItineraryView';

import { CommunityView } from './components/views/CommunityView';
import { ProfileView } from './components/views/ProfileView';
import { ConfigureView } from './components/views/ConfigureView';

import { LoadingScreen } from './components/ui/LoadingScreen';

// Helper for pages that should only be accessible when logged out
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) return <LoadingScreen />;
    if (user) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

export function AppRoutes() {
    const { user, isLoading, logout, updateProfile } = useAuth();
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
            case 'configure': navigate('/configure'); break;
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

    const routes = useRoutes([
        {
            path: "/",
            element: <LandingPage onGetStarted={() => user ? navigate('/dashboard') : navigate('/auth')} onNavigate={handleNavigate} />
        },
        {
            path: "/about",
            element: <AboutPage onNavigate={handleNavigate} onSignIn={() => user ? navigate('/dashboard') : navigate('/auth')} />
        },
        {
            path: "/privacy",
            element: <PrivacyPage onNavigate={handleNavigate} onSignIn={() => user ? navigate('/dashboard') : navigate('/auth')} />
        },
        {
            path: "/auth",
            element: (
                <PublicRoute>
                    <AuthView onBack={() => navigate('/')} onLoginSuccess={() => navigate('/dashboard')} />
                </PublicRoute>
            )
        },
        {
            path: "/onboarding",
            element: (
                <RequireAuth>
                    <OnboardingView onComplete={handleOnboardingComplete} />
                </RequireAuth>
            )
        },
        {
            path: "/dashboard",
            element: (
                <RequireAuth>
                    <Dashboard
                        user={user!}
                        savedItineraries={savedItineraries}
                        onCreateClick={() => navigate('/create')}
                        onLogout={logout}
                        onOpenSettings={() => navigate('/configure')}
                        onNavigate={handleNavigate}
                        onRemix={handleRemixItinerary}
                    />
                </RequireAuth>
            )
        },
        {
            path: "/create",
            element: (
                <RequireAuth>
                    <CreateItineraryView
                        user={user!}
                        onClose={() => navigate('/dashboard')}
                        onSave={handleSaveItinerary}
                        onNavigate={handleNavigate}
                        onLogout={logout}
                    />
                </RequireAuth>
            )
        },
        {
            path: "/community",
            element: (
                <RequireAuth>
                    <CommunityView
                        user={user!}
                        onNavigate={handleNavigate}
                        onLogout={logout}
                        onBack={() => navigate('/dashboard')}
                        onClone={handleCloneItinerary}
                    />
                </RequireAuth>
            )
        },
        {
            path: "/profile",
            element: (
                <RequireAuth>
                    <ProfileView
                        user={user!}
                        onBack={() => navigate('/dashboard')}
                        onUpdate={updateProfile}
                        onLogout={logout}
                        onNavigate={handleNavigate}
                    />
                </RequireAuth>
            )
        },
        {
            path: "/configure",
            element: (
                <RequireAuth>
                    <ConfigureView
                        user={user!}
                        onBack={() => navigate('/dashboard')}
                        onNavigate={handleNavigate}
                        onLogout={logout}
                    />
                </RequireAuth>
            )
        },
        {
            path: "*",
            element: <Navigate to="/" replace />
        }
    ]);

    if (isLoading) {
        return <LoadingScreen message="Starting Pathfinder..." />;
    }

    return routes;
}

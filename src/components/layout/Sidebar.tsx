import React, { useState } from 'react';
import { Flame, Home, Library, Users, Settings, LogOut } from 'lucide-react';
import { UserProfile, ViewState } from '../../types';
import { SignOutModal } from '../auth/SignOutModal';

export type SidebarTab = 'home' | 'library' | 'community' | 'profile';

interface SidebarProps {
    user: UserProfile;
    activeTab: SidebarTab;
    onNavigate: (view: ViewState) => void;
    // For Dashboard internal switching
    onDashboardTabChange?: (tab: 'overview' | 'library') => void;
    onLogout: () => void;
    onOpenSettings?: () => void;
}

export const Sidebar = ({ user, activeTab, onNavigate, onDashboardTabChange, onLogout, onOpenSettings }: SidebarProps) => {
    const [showSignOut, setShowSignOut] = useState(false);

    const handleHomeClick = () => {
        if (onDashboardTabChange) {
            onDashboardTabChange('overview');
        }
        onNavigate('dashboard');
    };

    const handleLibraryClick = () => {
        if (onDashboardTabChange) {
            onDashboardTabChange('library');
        }
        // If we are on Community, we need to go to dashboard then switch tab.
        // But since onNavigate('dashboard') happens, the dashboard will mount.
        // We might need to pass state via router if we were using real routes.
        // For now, we assume if we are calling onNavigate, the parent handles it.
        // BUT: if we are in CommunityView, onDashboardTabChange is undefined.
        // So we strictly rely on onNavigate('dashboard')?
        // No, we need a way to tell Dashboard "Open Library".

        // Simpler hack: We always navigate to 'dashboard'. 
        // If we ARE on dashboard, onDashboardTabChange handles the switch.
        // If we are NOT, we navigate. Ideally pass state { tab: 'library' }.
        onNavigate('dashboard');
    };

    return (
        <>
            <aside className="hidden md:flex flex-col w-64 glass border-r-0 p-8 flex-shrink-0 h-screen sticky top-0">
                <div className="flex items-center gap-2 text-primary-600 mb-10 cursor-pointer" onClick={() => onNavigate('dashboard')}>
                    <Flame className="w-8 h-8" />
                    <span className="font-black text-xl tracking-tighter text-stone-900 dark:text-white">PATHFINDER</span>
                </div>

                <nav className="space-y-2 flex-1">
                    <button
                        onClick={handleHomeClick}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'home' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-neutral-800'}`}
                    >
                        <Home className="w-5 h-5" /> Home
                    </button>
                    <button
                        onClick={() => {
                            // If we have the handler (we are in dashboard), use it.
                            if (onDashboardTabChange) {
                                onDashboardTabChange('library');
                            } else {
                                // We are elsewhere, navigate and hope default is handled or user clicks again.
                                // Ideally we navigate state. For now, just go dashboard.
                                onNavigate('dashboard');
                            }
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'library' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-neutral-800'}`}
                    >
                        <Library className="w-5 h-5" /> My Library
                    </button>
                    <button
                        onClick={() => onNavigate('community')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'community' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-neutral-800'}`}
                    >
                        <Users className="w-5 h-5" /> Community
                    </button>
                </nav>

                <div className="pt-6 border-t border-stone-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80" onClick={() => onNavigate('profile')}>
                        <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300">
                            {user.name[0]}
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-sm font-bold text-stone-900 dark:text-white truncate">{user.name}</div>
                            <div className="text-xs text-stone-500 truncate">{user.city}</div>
                        </div>
                    </div>
                    {onOpenSettings && (
                        <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-2 py-2 text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white">
                            <Settings className="w-4 h-4" /> Engine Settings
                        </button>
                    )}
                    <button onClick={() => setShowSignOut(true)} className="w-full flex items-center gap-3 px-2 py-2 text-xs font-bold text-stone-400 hover:text-red-500">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            <SignOutModal
                isOpen={showSignOut}
                onClose={() => setShowSignOut(false)}
                onConfirm={onLogout}
            />
        </>
    );
};

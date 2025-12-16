import React, { ReactNode } from 'react';
import { Sidebar, SidebarTab } from './Sidebar';
import { UserProfile, ViewState } from '../../types';
import { Home, Library, Users } from 'lucide-react';

interface DashboardLayoutProps {
    children: ReactNode;
    user: UserProfile;
    activeTab: SidebarTab;
    onNavigate: (view: ViewState) => void;
    onLogout: () => void;
    onDashboardTabChange?: (tab: 'overview' | 'library') => void;
    onOpenSettings?: () => void;
}

export const DashboardLayout = ({
    children,
    user,
    activeTab,
    onNavigate,
    onLogout,
    onDashboardTabChange,
    onOpenSettings
}: DashboardLayoutProps) => {

    return (
        <div className="h-screen bg-stone-50 dark:bg-neutral-950 flex flex-col md:flex-row overflow-hidden">
            {/* Desktop Sidebar */}
            <Sidebar
                user={user}
                activeTab={activeTab}
                onNavigate={onNavigate}
                onLogout={onLogout}
                onDashboardTabChange={onDashboardTabChange}
                onOpenSettings={onOpenSettings}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-neutral-900 border-t border-stone-200 dark:border-neutral-800 px-6 py-4 flex justify-around items-center z-30 pb-safe">
                <button
                    onClick={() => {
                        if (onDashboardTabChange) onDashboardTabChange('overview');
                        onNavigate('dashboard');
                    }}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-orange-600' : 'text-stone-400'}`}
                >
                    <Home className="w-6 h-6" />
                </button>
                <button
                    onClick={() => {
                        // If we are calling from Dashboard, switch tab. Else navigate to dashboard (which defaults to overview usually, unless we persist state).
                        // Since we don't have global state for library tab, we rely on Dashboard handling it if active, 
                        // or just navigating to dashboard if not.
                        if (onDashboardTabChange) onDashboardTabChange('library');
                        else onNavigate('dashboard');
                    }}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'library' ? 'text-orange-600' : 'text-stone-400'}`}
                >
                    <Library className="w-6 h-6" />
                </button>
                <button
                    onClick={() => onNavigate('community')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'community' ? 'text-orange-600' : 'text-stone-400'}`}
                >
                    <Users className="w-6 h-6" />
                </button>
                <button
                    onClick={() => onNavigate('profile')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-orange-600' : 'text-stone-400'}`}
                >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${activeTab === 'profile' ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-600' : 'bg-stone-200 dark:bg-neutral-800 text-stone-500'}`}>
                        {user.name[0]}
                    </div>
                </button>
            </div>
        </div>
    );
};

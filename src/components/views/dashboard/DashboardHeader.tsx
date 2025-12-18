import React from 'react';
import { Plus } from 'lucide-react';
import { UserProfile } from '../../../types';

interface DashboardHeaderProps {
    activeTab: 'overview' | 'library';
    user: UserProfile;
    itineraryCount: number;
    onCreateClick: () => void;
}

export const DashboardHeader = ({ activeTab, user, itineraryCount, onCreateClick }: DashboardHeaderProps) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                    {activeTab === 'overview' ? 'Your Dashboard' : 'My Library'}
                </h1>
                <p className="text-stone-500 dark:text-stone-400 font-medium">
                    {activeTab === 'overview' ? `Ready for your next adventure in ${user.city}?` : `Manage your ${itineraryCount} curated plans.`}
                </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <button
                    onClick={onCreateClick}
                    className="hidden md:flex bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold items-center gap-2 shadow-lg shadow-orange-600/30 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" /> New Itinerary
                </button>
            </div>
        </div>
    );
};

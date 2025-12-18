import React from 'react';
import { Search, Filter } from 'lucide-react';

interface DashboardSearchFilterProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    moodFilter: string;
    setMoodFilter: (mood: string) => void;
    moods: string[];
}

export const DashboardSearchFilter = ({ searchQuery, setSearchQuery, moodFilter, setMoodFilter, moods }: DashboardSearchFilterProps) => {
    return (
        <div className="mb-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-stone-400" />
                <input
                    type="text"
                    placeholder="Search itineraries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:border-orange-500"
                />
            </div>
            <div className="relative min-w-[160px]">
                <Filter className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                <select
                    value={moodFilter}
                    onChange={(e) => setMoodFilter(e.target.value)}
                    className="w-full pl-9 pr-8 py-3 rounded-xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 appearance-none focus:outline-none font-bold text-sm"
                >
                    {moods.map(m => <option key={m} value={m}>{m} Mood</option>)}
                </select>
            </div>
        </div>
    );
};

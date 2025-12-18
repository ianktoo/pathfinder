import React from 'react';

interface DashboardStatsProps {
    totalPlans: number;
    vibe: string;
}

export const DashboardStats = ({ totalPlans, vibe }: DashboardStatsProps) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="glass p-4 rounded-2xl shadow-sm">
                <div className="text-2xl font-black text-stone-900 dark:text-white">{totalPlans}</div>
                <div className="text-xs font-bold text-stone-500 uppercase">Saved Plans</div>
            </div>
            <div className="glass p-4 rounded-2xl shadow-sm">
                <div className="text-2xl font-black text-stone-900 dark:text-white">{vibe}</div>
                <div className="text-xs font-bold text-stone-500 uppercase">Vibe</div>
            </div>
        </div>
    );
};

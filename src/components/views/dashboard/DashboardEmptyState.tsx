import React from 'react';
import { Plus } from 'lucide-react';

interface DashboardEmptyStateProps {
    title: string;
    message: string;
    onAction: () => void;
}

export const DashboardEmptyState = ({ title, message, onAction }: DashboardEmptyStateProps) => {
    return (
        <div onClick={onAction} className="cursor-pointer group border-2 border-dashed border-stone-300 dark:border-neutral-700 rounded-3xl h-64 flex flex-col items-center justify-center hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-white dark:bg-neutral-900">
            <div className="w-16 h-16 bg-stone-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-stone-400 group-hover:text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                {title}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm">{message}</p>
        </div>
    );
};

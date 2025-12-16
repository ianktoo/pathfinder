import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen = ({ message = "Initializing Pathfinder..." }: LoadingScreenProps) => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-stone-50 dark:bg-neutral-950 gap-4">
            <Loader2 className="animate-spin text-orange-600 w-10 h-10" />
            <div className="flex flex-col items-center gap-1">
                <p className="text-stone-400 font-bold text-sm animate-pulse">{message}</p>
            </div>
        </div>
    );
};

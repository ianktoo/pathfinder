import React from 'react';
import { Itinerary } from '../../../types';
import { ItineraryCard } from './ItineraryCard';

interface DashboardSectionProps {
    title: string;
    icon: React.ReactNode;
    itineraries: Itinerary[];
    onItineraryClick: (it: Itinerary) => void;
    onRemix: (it: Itinerary) => void;
    onShare: (it: Itinerary) => void;
}

export const DashboardSection = ({ title, icon, itineraries, onItineraryClick, onRemix, onShare }: DashboardSectionProps) => {
    return (
        <section>
            <div className="mb-4 flex items-center gap-2">
                {icon}
                <h2 className="font-black text-lg text-stone-800 dark:text-stone-200 uppercase">
                    {title}
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itineraries.map((it) => (
                    <ItineraryCard
                        key={it.id}
                        it={it}
                        onClick={onItineraryClick}
                        onRemix={onRemix}
                        onShare={onShare}
                    />
                ))}
            </div>
        </section>
    );
};

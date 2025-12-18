import React from 'react';
import { Flame, Share2, MapPin, Clock, Lock, Utensils, Coffee, Music, ShoppingBag, Camera, Copy, Globe } from 'lucide-react';
import { Itinerary } from '../../../types';

interface ItineraryCardProps {
    it: Itinerary;
    onClick: (it: Itinerary) => void;
    onRemix: (it: Itinerary) => void;
    onShare: (it: Itinerary) => void;
}

export const ItineraryCard = ({ it, onClick, onRemix, onShare }: ItineraryCardProps) => {

    const getCategoryIcon = (category: string) => {
        const c = category.toLowerCase();
        if (c.includes('food') || c.includes('dinner')) return <Utensils className="w-3 h-3" />;
        if (c.includes('drink') || c.includes('bar')) return <Coffee className="w-3 h-3" />;
        if (c.includes('nightlife') || c.includes('club')) return <Music className="w-3 h-3" />;
        if (c.includes('shop')) return <ShoppingBag className="w-3 h-3" />;
        if (c.includes('museum')) return <Camera className="w-3 h-3" />;
        return <MapPin className="w-3 h-3" />;
    };

    const getDurationTag = (tags: string[]) => tags.find(t => t.includes('Day') || t.includes('Hour') || t === 'Quick') || 'Full Day';

    return (
        <div
            onClick={() => onClick(it)}
            className="group relative bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 transition-all overflow-hidden cursor-pointer h-full flex flex-col"
        >
            <div className="h-44 relative overflow-hidden bg-stone-200 dark:bg-neutral-800">
                <img
                    src={it.items[0]?.imageUrl || `https://source.unsplash.com/random/800x400?${it.mood}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt="Cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className="absolute top-4 left-4">
                    <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {it.mood}
                    </span>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                    {it.featured && (
                        <div className="bg-purple-500/90 backdrop-blur-md text-white px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-current" /> Featured
                        </div>
                    )}
                    {it.shared ? (
                        <div className="bg-green-500/80 backdrop-blur-md text-white p-1.5 rounded-full" title="Shared with Community">
                            <Globe className="w-3.5 h-3.5" />
                        </div>
                    ) : (
                        <div className="bg-black/40 backdrop-blur-md text-white/70 p-1.5 rounded-full" title="Private">
                            <Lock className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white">
                    <div className="flex gap-3">
                        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-xs font-bold">{getDurationTag(it.tags)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
                            <MapPin className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-xs font-bold">{it.items.length} Stops</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-black text-xl text-stone-900 dark:text-white leading-tight line-clamp-2 pr-4" title={it.title}>
                        {it.title}
                    </h3>
                    <div className="flex gap-1 shrink-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemix(it); }}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-400 hover:text-orange-600 transition-colors"
                            title="Remix this plan"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onShare(it); }}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-400 hover:text-orange-600 transition-colors"
                            title="Share"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-stone-100 dark:border-neutral-800">
                    <div className="flex items-center gap-1">
                        {it.items.slice(0, 4).map((item: any, idx: number) => (
                            <React.Fragment key={idx}>
                                <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-neutral-700">
                                    {getCategoryIcon(item.category || item.activity)}
                                </div>
                                {idx < Math.min(it.items.length, 4) - 1 && (
                                    <div className="w-2 h-0.5 bg-stone-200 dark:bg-neutral-800"></div>
                                )}
                            </React.Fragment>
                        ))}
                        {it.items.length > 4 && (
                            <span className="text-xs font-bold text-stone-400 ml-1">+{it.items.length - 4}</span>
                        )}
                    </div>
                    <div className="text-xs font-bold text-stone-400">{it.date}</div>
                </div>
            </div>
        </div>
    );
};

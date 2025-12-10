
import React, { useState } from 'react';
import { Heart, ArrowLeft, Download, User } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Itinerary } from '../../types';
import { BackendService } from '../../services/storage';

interface CommunityViewProps {
  onBack: () => void;
  onClone: (itinerary: Itinerary) => void;
}

export const CommunityView = ({ onBack, onClone }: CommunityViewProps) => {
  const [feed] = useState<Itinerary[]>(BackendService.getCommunityItineraries());

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex flex-col">
      <header className="bg-white dark:bg-neutral-900 p-6 border-b border-stone-200 dark:border-neutral-800 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-500 transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
                <h1 className="text-xl md:text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <UsersIcon className="w-6 h-6 text-orange-600" />
                    Community Feed
                </h1>
                <p className="text-xs text-stone-500 font-bold hidden md:block">Discover plans curated by local experts</p>
            </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feed.map((it) => (
                <div key={it.id} className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col hover:border-orange-300 dark:hover:border-orange-800 transition-all group">
                    <div className="h-40 bg-stone-200 dark:bg-neutral-800 relative">
                        <img 
                            src={it.items[0]?.imageUrl || `https://source.unsplash.com/random/800x400?${it.mood}`} 
                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                            alt="Cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-white font-black text-xl leading-tight mb-1">{it.title}</h3>
                            <div className="flex items-center gap-2 text-white/80 text-xs font-bold">
                                <User className="w-3 h-3" />
                                <span>{it.author || 'Anonymous'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex gap-2 mb-4">
                             {it.tags.slice(0, 3).map(tag => (
                                 <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                             ))}
                        </div>
                        
                        <div className="space-y-3 mb-6 flex-1">
                            {it.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
                                    <div className="w-6 text-xs font-bold text-orange-600">{item.time}</div>
                                    <span className="truncate font-medium">{item.locationName}</span>
                                </div>
                            ))}
                            {it.items.length > 2 && (
                                <div className="text-xs text-stone-400 pl-9 font-medium">+{it.items.length - 2} more stops</div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-neutral-800">
                            <div className="flex items-center gap-1 text-red-500 font-bold text-xs">
                                <Heart className="w-4 h-4 fill-red-500" />
                                {it.likes}
                            </div>
                            <Button 
                                onClick={() => onClone(it)} 
                                variant="secondary" 
                                className="w-auto py-2 px-4 text-xs h-auto"
                                icon={Download}
                            >
                                Add to My Plans
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
};

const UsersIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

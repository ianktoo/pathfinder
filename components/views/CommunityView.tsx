import React, { useState } from 'react';
import { Heart, ArrowLeft, Download, User, Search, Filter, ShieldCheck, Flame } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'popular' | 'recent'>('popular');

  const moods = ['All', 'Adventure', 'Chill', 'Foodie', 'Cultural', 'Party', 'Romantic'];

  const filteredFeed = feed.filter(it => {
      const matchesSearch = it.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            it.items.some(i => i.locationName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesMood = moodFilter === 'All' || it.mood === moodFilter;
      return matchesSearch && matchesMood;
  }).sort((a, b) => {
      if (sortOrder === 'popular') return (b.likes || 0) - (a.likes || 0);
      return b.date.localeCompare(a.date); 
  });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex flex-col">
      <header className="bg-white dark:bg-neutral-900 p-6 border-b border-stone-200 dark:border-neutral-800 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
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
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-stone-400" />
                    <input 
                        type="text" 
                        placeholder="Search destinations, activities..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative min-w-[140px]">
                        <select 
                            value={moodFilter}
                            onChange={(e) => setMoodFilter(e.target.value)}
                            className="w-full pl-4 pr-8 py-3 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 appearance-none focus:outline-none font-bold text-sm h-full"
                        >
                            {moods.map(m => <option key={m} value={m}>{m} Mood</option>)}
                        </select>
                        <Filter className="absolute right-3 top-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                    <div className="bg-stone-100 dark:bg-neutral-800 p-1 rounded-xl flex">
                        <button 
                            onClick={() => setSortOrder('popular')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortOrder === 'popular' ? 'bg-white dark:bg-neutral-700 shadow-sm text-orange-600' : 'text-stone-500'}`}
                        >
                            Hot
                        </button>
                        <button 
                            onClick={() => setSortOrder('recent')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortOrder === 'recent' ? 'bg-white dark:bg-neutral-700 shadow-sm text-orange-600' : 'text-stone-500'}`}
                        >
                            New
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeed.map((it) => (
                <div key={it.id} className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col hover:border-orange-300 dark:hover:border-orange-800 transition-all group">
                    <div className="h-48 bg-stone-200 dark:bg-neutral-800 relative">
                        <img 
                            src={it.items[0]?.imageUrl || `https://source.unsplash.com/random/800x400?${it.mood}`} 
                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                            alt="Cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                            {it.verified_community && (
                                <div className="mb-2 inline-flex items-center gap-1 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                                    <ShieldCheck className="w-3 h-3" /> Verified
                                </div>
                            )}
                            <h3 className="text-white font-black text-xl leading-tight mb-1 line-clamp-2">{it.title}</h3>
                            <div className="flex items-center gap-2 text-white/80 text-xs font-bold">
                                <User className="w-3 h-3" />
                                <span>{it.author || 'Anonymous'}</span>
                            </div>
                        </div>
                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-white" /> {it.likes}
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex flex-wrap gap-2 mb-4">
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

                        <div className="pt-4 border-t border-stone-100 dark:border-neutral-800">
                            <Button 
                                onClick={() => onClone(it)} 
                                variant="secondary" 
                                className="w-full py-2 px-4 text-xs h-auto"
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
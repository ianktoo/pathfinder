import React, { useState, useEffect } from 'react';
import { Heart, ArrowLeft, Download, User, Search, Filter, ShieldCheck, Loader2, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Itinerary, UserProfile, ViewState } from '../../types';
import { BackendService } from '../../services/storage';
import { DashboardLayout } from '../layout/DashboardLayout';

interface CommunityViewProps {
    user: UserProfile;
    onNavigate: (view: ViewState) => void;
    onLogout: () => void;
    onBack: () => void;
    onClone: (itinerary: Itinerary) => void;
}

export const CommunityView = ({ user, onNavigate, onLogout, onBack, onClone }: CommunityViewProps) => {
    const [communityItineraries, setCommunityItineraries] = useState<Itinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const loadCommunity = async () => {
            setLoading(true);
            // Simulate network delay for effect
            await new Promise(r => setTimeout(r, 800));
            try {
                const all = await BackendService.getCommunityItineraries();
                setCommunityItineraries(all);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        loadCommunity();
    }, []);

    const filtered = communityItineraries.filter(it => {
        const matchSearch = it.title.toLowerCase().includes(searchQuery.toLowerCase()) || it.author?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchFilter = filter === 'All' || it.mood === filter;
        return matchSearch && matchFilter;
    });

    return (
        <DashboardLayout
            user={user}
            activeTab="community"
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            {/* Mobile Header */}
            <header className="md:hidden bg-white dark:bg-neutral-900 p-4 border-b border-stone-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-2" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5 text-stone-500" />
                    <span className="font-black text-lg tracking-tight text-stone-900 dark:text-white">COMMUNITY</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onNavigate('profile')} className="p-2"><div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold">{user.name[0]}</div></button>
                </div>
            </header>

            {/* Fixed Header */}
            <div className="flex-none p-6 md:p-8 border-b border-stone-100 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md z-10 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            <Users className="w-8 h-8 text-orange-600" /> Community Feed
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400 font-medium">Discover adventures curated by the Pathfinder community.</p>
                    </div>
                </div>

                {/* Search Controls */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3.5 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search by title or author..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        {['All', 'Romantic', 'Adventure', 'Chill', 'Party'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-stone-900 text-white dark:bg-white dark:text-black shadow-md' : 'bg-white text-stone-600 border border-stone-200 dark:bg-neutral-900 dark:text-stone-400 dark:border-neutral-800 hover:bg-stone-50'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32 md:pb-12 scroll-smooth">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-stone-400 animate-in fade-in">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p>Loading community plans...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-stone-400">
                        <p>No community itineraries found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                        {filtered.map(it => (
                            <div key={it.id} className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group">
                                <div className="h-48 relative bg-stone-200 overflow-hidden">
                                    <img
                                        src={it.items[0]?.imageUrl || `https://source.unsplash.com/random/800x400?${it.mood}`}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                                        alt="Cover"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 backdrop-blur text-stone-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                            {it.mood}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm">
                                            {it.author?.[0] || 'A'}
                                        </div>
                                        <span className="text-white font-bold text-shadow-sm shadow-black/50">{it.author || 'Anonymous'}</span>
                                        {it.author === 'Verified Guide' && <ShieldCheck className="w-4 h-4 text-blue-400 fill-blue-400/20" />}
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2 line-clamp-2">{it.title}</h3>
                                    <div className="flex items-center gap-4 text-xs font-bold text-stone-400 mb-6">
                                        <span>{it.items.length} Stops</span>
                                        <span>•</span>
                                        <span>{it.likes || 0} Likes</span>
                                        <span>•</span>
                                        <span>{it.downloads || 0} Clones</span>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-stone-100 dark:border-neutral-800 flex justify-between items-center">
                                        <Button variant="outline" size="sm" icon={Heart} className="rounded-full w-10 h-10 p-0 border-stone-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500" />
                                        <Button onClick={() => onClone(it)} size="sm" icon={Download} className="rounded-xl px-6">
                                            Clone
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
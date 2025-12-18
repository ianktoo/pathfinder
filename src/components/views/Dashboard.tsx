import React, { useState } from 'react';
import { Flame, Plus, Calendar, Share2, MapPin, Clock, Globe, Lock, Utensils, Coffee, Music, ShoppingBag, Camera, Search, Filter, Copy, Library, Users, Home } from 'lucide-react';
import { Badge } from '../ui/badge';
import { UserProfile, Itinerary, ViewState } from '../../types';
import { ItineraryDetailModal } from './ItineraryDetailModal';
import { BackendService } from '../../services/storage';
import { DashboardLayout } from '../layout/DashboardLayout';



interface DashboardProps {
    user: UserProfile;
    savedItineraries: Itinerary[];
    onCreateClick: () => void;
    onLogout: () => void;
    onOpenSettings: () => void;
    onNavigate: (view: ViewState) => void;
    onRemix?: (itinerary: Itinerary) => void;
}

export const Dashboard = ({ user, savedItineraries, onCreateClick, onLogout, onOpenSettings, onNavigate, onRemix }: DashboardProps) => {
    const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'library'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [moodFilter, setMoodFilter] = useState<string>('All');


    // Sync logic
    const [localItineraries, setLocalItineraries] = useState(savedItineraries);
    const [communityItineraries, setCommunityItineraries] = useState<Itinerary[]>([]);

    React.useEffect(() => {
        setLocalItineraries(savedItineraries);
    }, [savedItineraries]);

    React.useEffect(() => {
        BackendService.getCommunityItineraries().then(setCommunityItineraries);
    }, []);

    // Deep Link Logic
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sharedId = params.get('itinerary');
        if (sharedId) {
            console.log("Found shared itinerary ID:", sharedId);
            BackendService.getItineraryById(sharedId).then(itin => {
                if (itin) {
                    setSelectedItinerary(itin);
                    // Clear param so refresh doesn't re-open it? 
                    // Or keep it so they can copy URL? Keep it.
                }
            });
        }
    }, []);

    const handleShare = async (itinerary: Itinerary) => {
        const success = await BackendService.publishItinerary(itinerary, user.name);
        if (success) {
            const updated = localItineraries.map(it => it.id === itinerary.id ? { ...it, shared: true } : it);
            setLocalItineraries(updated);

            // Construct Share URL
            const url = `https://path-finder.dev?itinerary=${itinerary.id}`;
            navigator.clipboard.writeText(url).then(() => {
                alert("Published & Link Copied to Clipboard!");
            }).catch(() => {
                alert("Published! (Could not copy link automatically)");
            });
        }
    };

    const handleRemix = (itinerary: Itinerary) => {
        if (onRemix) {
            onRemix(itinerary);
        }
    };

    // Filter Logic
    const filteredItineraries = localItineraries.filter(it => {
        const matchesSearch = it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            it.items.some(item => item.locationName.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesMood = moodFilter === 'All' || it.mood === moodFilter;
        return matchesSearch && matchesMood;
    });

    const moods = ['All', 'Romantic', 'Adventure', 'Chill', 'Party', 'Culture'];

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
        <DashboardLayout
            user={user}
            activeTab={activeTab === 'overview' ? 'home' : 'library'}
            onNavigate={onNavigate}
            onLogout={onLogout}
            onDashboardTabChange={setActiveTab}
            onOpenSettings={onOpenSettings}
        >
            {selectedItinerary && (
                <ItineraryDetailModal
                    itinerary={selectedItinerary}
                    onClose={() => setSelectedItinerary(null)}
                    userCity={user.city}
                    onShare={handleShare}
                    onRemix={onRemix}
                    allowEdit={savedItineraries.some(i => i.id === selectedItinerary.id)}
                />
            )}

            {/* Mobile Header */}
            <header className="md:hidden bg-white dark:bg-neutral-900 p-4 border-b border-stone-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-2" onClick={() => onNavigate('dashboard')}>
                    <Flame className="w-6 h-6 text-orange-600" />
                    <span className="font-black text-lg tracking-tight text-stone-900 dark:text-white">PATHFINDER</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onNavigate('profile')} className="p-2"><div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold">{user.name[0]}</div></button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                            {activeTab === 'overview' ? 'Your Dashboard' : 'My Library'}
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400 font-medium">
                            {activeTab === 'overview' ? `Ready for your next adventure in ${user.city}?` : `Manage your ${localItineraries.length} curated plans.`}
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

                {/* Overview Stats (Only on Overview Tab) */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-100 dark:border-neutral-800 shadow-sm">
                            <div className="text-2xl font-black text-stone-900 dark:text-white">{localItineraries.length}</div>
                            <div className="text-xs font-bold text-stone-500 uppercase">Saved Plans</div>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-100 dark:border-neutral-800 shadow-sm">
                            <div className="text-2xl font-black text-stone-900 dark:text-white">{user.personality}</div>
                            <div className="text-xs font-bold text-stone-500 uppercase">Vibe</div>
                        </div>
                    </div>
                )}

                {/* Search & Filter Controls */}
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

                {filteredItineraries.length === 0 && searchQuery ? (
                    <div onClick={onCreateClick} className="cursor-pointer group border-2 border-dashed border-stone-300 dark:border-neutral-700 rounded-3xl h-64 flex flex-col items-center justify-center hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-white dark:bg-neutral-900">
                        <div className="w-16 h-16 bg-stone-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8 text-stone-400 group-hover:text-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                            No matching plans
                        </h3>
                        <p className="text-stone-500 dark:text-stone-400 text-sm">Tap to generate</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Upcoming Section */}
                        {filteredItineraries.length > 0 && (
                            <section>
                                <div className="mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-orange-600" />
                                    <h2 className="font-black text-lg text-stone-800 dark:text-stone-200 uppercase">
                                        Upcoming Adventures
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredItineraries.slice(0, 3).map((it) => (
                                        <ItineraryCard key={it.id} it={it} onClick={setSelectedItinerary} onRemix={handleRemix} onShare={handleShare} getCategoryIcon={getCategoryIcon} getDurationTag={getDurationTag} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Recent Section (Just the next batch for now, or reversed if we had meaningful dates) */}
                        {filteredItineraries.length > 3 && (
                            <section>
                                <div className="mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                    <h2 className="font-black text-lg text-stone-800 dark:text-stone-200 uppercase">
                                        Recent Plans
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredItineraries.slice(3, 6).map((it) => (
                                        <ItineraryCard key={it.id} it={it} onClick={setSelectedItinerary} onRemix={handleRemix} onShare={handleShare} getCategoryIcon={getCategoryIcon} getDurationTag={getDurationTag} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Community Section */}
                        {communityItineraries.length > 0 && !searchQuery && (
                            <section>
                                <div className="mb-4 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-500" />
                                    <h2 className="font-black text-lg text-stone-800 dark:text-stone-200 uppercase">
                                        Community Picks
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {communityItineraries.slice(0, 3).map((it) => (
                                        <ItineraryCard key={it.id} it={it} onClick={setSelectedItinerary} onRemix={handleRemix} onShare={handleShare} getCategoryIcon={getCategoryIcon} getDurationTag={getDurationTag} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {filteredItineraries.length === 0 && !searchQuery && (
                            <div onClick={onCreateClick} className="cursor-pointer group border-2 border-dashed border-stone-300 dark:border-neutral-700 rounded-3xl h-64 flex flex-col items-center justify-center hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-white dark:bg-neutral-900">
                                <div className="w-16 h-16 bg-stone-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Plus className="w-8 h-8 text-stone-400 group-hover:text-orange-500" />
                                </div>
                                <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                                    Create First Plan
                                </h3>
                                <p className="text-stone-500 dark:text-stone-400 text-sm">Tap to generate</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="md:hidden fixed bottom-24 right-6 z-30">
                <button onClick={onCreateClick} className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-600/40 hover:scale-105 transition-transform">
                    <Plus className="w-8 h-8" />
                </button>
            </div>
        </DashboardLayout>
    );
};

const ItineraryCard = ({ it, onClick, onRemix, onShare, getCategoryIcon, getDurationTag }: any) => (
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
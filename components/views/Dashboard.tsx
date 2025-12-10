import React, { useState } from 'react';
import { Flame, Home, Users, Settings, LogOut, Plus, Calendar, Share2, MapPin, Clock, Globe, Lock, Utensils, Coffee, Music, ShoppingBag, Camera, Search, Filter, Library, Copy } from 'lucide-react';
import { Badge } from '../ui/badge';
import { UserProfile, Itinerary, ViewState } from '../../types';
import { ItineraryDetailModal } from './ItineraryDetailModal';
import { BackendService } from '../../services/storage';

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
  React.useEffect(() => {
    setLocalItineraries(savedItineraries);
  }, [savedItineraries]);

  const handleShare = (itinerary: Itinerary) => {
    const success = BackendService.publishItinerary(itinerary, user.name);
    if (success) {
        const updated = localItineraries.map(it => it.id === itinerary.id ? { ...it, shared: true } : it);
        setLocalItineraries(updated);
        const updatedItin = { ...itinerary, shared: true };
        BackendService.saveItinerary(updatedItin);
        alert("Published to Community Feed!");
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
  <div className="h-screen bg-stone-50 dark:bg-neutral-950 flex flex-col md:flex-row overflow-hidden">
    
    {selectedItinerary && (
        <ItineraryDetailModal 
            itinerary={selectedItinerary} 
            onClose={() => setSelectedItinerary(null)} 
            userCity={user.city}
            onShare={handleShare}
            onRemix={onRemix}
            allowEdit={false} 
        />
    )}

    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-neutral-900 border-r border-stone-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-2 text-orange-600 mb-10 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <Flame className="w-8 h-8" />
            <span className="font-black text-xl tracking-tighter text-stone-900 dark:text-white">PATHFINDER</span>
        </div>
        
        <nav className="space-y-2 flex-1">
            <button 
                onClick={() => { setActiveTab('overview'); onNavigate('dashboard'); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-neutral-800'}`}
            >
                <Home className="w-5 h-5" /> Home
            </button>
            <button 
                onClick={() => { setActiveTab('library'); onNavigate('dashboard'); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'library' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-neutral-800'}`}
            >
                <Library className="w-5 h-5" /> My Library
            </button>
            <button onClick={() => onNavigate('community')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-500 dark:text-stone-400 font-bold hover:bg-stone-50 dark:hover:bg-neutral-800 transition-colors">
                <Users className="w-5 h-5" /> Community
            </button>
        </nav>

        <div className="pt-6 border-t border-stone-100 dark:border-neutral-800">
             <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80" onClick={() => onNavigate('profile')}>
                <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300">
                    {user.name[0]}
                </div>
                <div>
                    <div className="text-sm font-bold text-stone-900 dark:text-white">{user.name}</div>
                    <div className="text-xs text-stone-500">{user.city}</div>
                </div>
             </div>
             <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-2 py-2 text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white">
                <Settings className="w-4 h-4" /> Engine Settings
             </button>
             <button onClick={onLogout} className="w-full flex items-center gap-3 px-2 py-2 text-xs font-bold text-stone-400 hover:text-red-500">
                <LogOut className="w-4 h-4" /> Sign Out
             </button>
        </div>
    </aside>

    <main className="flex-1 flex flex-col h-full overflow-hidden">
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

            {/* Itinerary Grid */}
            <div className="mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h2 className="font-black text-lg text-stone-800 dark:text-stone-200 uppercase">
                    {activeTab === 'overview' ? 'Upcoming' : 'All Plans'}
                </h2>
            </div>

            {filteredItineraries.length === 0 ? (
                <div onClick={onCreateClick} className="cursor-pointer group border-2 border-dashed border-stone-300 dark:border-neutral-700 rounded-3xl h-64 flex flex-col items-center justify-center hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-white dark:bg-neutral-900">
                    <div className="w-16 h-16 bg-stone-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8 text-stone-400 group-hover:text-orange-500" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                        {searchQuery ? 'No matching plans' : 'Create First Plan'}
                    </h3>
                    <p className="text-stone-500 dark:text-stone-400 text-sm">Tap to generate</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItineraries.map((it: Itinerary) => (
                    <div 
                        key={it.id} 
                        onClick={() => setSelectedItinerary(it)} 
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
                                        onClick={(e) => { e.stopPropagation(); handleRemix(it); }} 
                                        className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-400 hover:text-orange-600 transition-colors"
                                        title="Remix this plan"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleShare(it); }} 
                                        className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-400 hover:text-orange-600 transition-colors"
                                        title="Share"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-stone-100 dark:border-neutral-800">
                                <div className="flex items-center gap-1">
                                    {it.items.slice(0, 4).map((item, idx) => (
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
                ))}
                </div>
            )}
        </div>
    </main>

    <div className="md:hidden fixed bottom-24 right-6 z-30">
        <button onClick={onCreateClick} className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-600/40 hover:scale-105 transition-transform">
            <Plus className="w-8 h-8" />
        </button>
    </div>

    <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-neutral-900 border-t border-stone-200 dark:border-neutral-800 px-6 py-4 flex justify-around items-center z-20 pb-safe">
        <button onClick={() => { setActiveTab('overview'); onNavigate('dashboard'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'overview' ? 'text-orange-600' : 'text-stone-400'}`}>
            <Home className="w-6 h-6" />
        </button>
        <button onClick={() => { setActiveTab('library'); onNavigate('dashboard'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'library' ? 'text-orange-600' : 'text-stone-400'}`}>
            <Library className="w-6 h-6" />
        </button>
        <button onClick={() => onNavigate('community')} className="flex flex-col items-center gap-1 text-stone-400">
            <Users className="w-6 h-6" />
        </button>
        <button onClick={() => onNavigate('profile')} className="flex flex-col items-center gap-1 text-stone-400">
            <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold">{user.name[0]}</div>
        </button>
    </div>
  </div>
  );
};
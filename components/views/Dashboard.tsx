import React, { useState } from 'react';
import { Flame, Home, Users, Settings, LogOut, Plus, Calendar, Share2 } from 'lucide-react';
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
}

export const Dashboard = ({ user, savedItineraries, onCreateClick, onLogout, onOpenSettings, onNavigate }: DashboardProps) => {
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);

  const handleShare = (itinerary: Itinerary) => {
    const success = BackendService.publishItinerary(itinerary, user.name);
    if (success) {
        alert("Published to Community Feed!");
    }
  };

  return (
  <div className="h-screen bg-stone-50 dark:bg-neutral-950 flex flex-col md:flex-row overflow-hidden">
    
    {/* Detail Modal integration */}
    {selectedItinerary && (
        <ItineraryDetailModal 
            itinerary={selectedItinerary} 
            onClose={() => setSelectedItinerary(null)} 
            userCity={user.city}
            onShare={handleShare}
            // Dashboard views are typically read-only for AI editing to prevent state drift, 
            // but we allow navigation and sharing.
            allowEdit={false} 
        />
    )}

    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-neutral-900 border-r border-stone-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-2 text-orange-600 mb-10 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <Flame className="w-8 h-8" />
            <span className="font-black text-xl tracking-tighter text-stone-900 dark:text-white">PATHFINDER</span>
        </div>
        
        <nav className="space-y-2 flex-1">
            <button onClick={() => onNavigate('dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-bold">
                <Home className="w-5 h-5" /> Home
            </button>
            <button onClick={() => onNavigate('community')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-500 dark:text-stone-400 font-bold hover:bg-stone-50 dark:hover:bg-neutral-800 hover:text-stone-900 dark:hover:text-white transition-colors">
                <Users className="w-5 h-5" /> Community
            </button>
        </nav>

        <div className="pt-6 border-t border-stone-100 dark:border-neutral-800">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-neutral-700 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300">
                    {user.name[0]}
                </div>
                <div>
                    <div className="text-sm font-bold text-stone-900 dark:text-white">{user.name}</div>
                    <div className="text-xs text-stone-500">{user.city}</div>
                </div>
             </div>
             <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-2 py-2 text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white">
                <Settings className="w-4 h-4" /> Settings
             </button>
             <button onClick={onLogout} className="w-full flex items-center gap-3 px-2 py-2 text-xs font-bold text-stone-400 hover:text-red-500">
                <LogOut className="w-4 h-4" /> Sign Out
             </button>
        </div>
    </aside>

    <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="md:hidden bg-white dark:bg-neutral-900 p-4 border-b border-stone-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 z-20">
            <div className="flex items-center gap-2" onClick={() => onNavigate('dashboard')}>
                <Flame className="w-6 h-6 text-orange-600" />
                <span className="font-black text-lg tracking-tight text-stone-900 dark:text-white">PATHFINDER</span>
            </div>
            <div className="flex gap-2">
                <button onClick={onOpenSettings} className="p-2"><Settings className="w-5 h-5 text-stone-500" /></button>
                <button onClick={onLogout} className="p-2"><LogOut className="w-5 h-5 text-stone-500" /></button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Your Dashboard</h1>
                    <p className="text-stone-500 dark:text-stone-400 font-medium">Ready for your next adventure in {user.city}?</p>
                </div>
                <button 
                    onClick={onCreateClick}
                    className="hidden md:flex bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold items-center gap-2 shadow-lg shadow-orange-600/30 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" /> New Itinerary
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-100 dark:border-neutral-800 shadow-sm">
                    <div className="text-2xl font-black text-stone-900 dark:text-white">{savedItineraries.length}</div>
                    <div className="text-xs font-bold text-stone-500 uppercase">Saved Plans</div>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-100 dark:border-neutral-800 shadow-sm">
                    <div className="text-2xl font-black text-stone-900 dark:text-white">{user.personality}</div>
                    <div className="text-xs font-bold text-stone-500 uppercase">Vibe</div>
                </div>
            </div>

            <div className="mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h2 className="font-black text-lg text-stone-800 dark:text-stone-200 uppercase">Upcoming</h2>
            </div>

            {savedItineraries.length === 0 ? (
                <div onClick={onCreateClick} className="cursor-pointer group border-2 border-dashed border-stone-300 dark:border-neutral-700 rounded-3xl h-64 flex flex-col items-center justify-center hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-white dark:bg-neutral-900">
                    <div className="w-16 h-16 bg-stone-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8 text-stone-400 group-hover:text-orange-500" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white">Create First Plan</h3>
                    <p className="text-stone-500 dark:text-stone-400 text-sm">Tap to generate</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedItineraries.map((it: Itinerary) => (
                    <div key={it.id} onClick={() => setSelectedItinerary(it)} className="bg-white dark:bg-neutral-900 p-5 rounded-3xl shadow-sm border border-stone-200 dark:border-neutral-800 hover:shadow-xl hover:shadow-orange-500/5 transition-all group cursor-pointer relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-yellow-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-black text-xl text-stone-900 dark:text-white leading-tight line-clamp-2">{it.title}</h3>
                            <div className="bg-stone-100 dark:bg-neutral-800 p-2 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors shrink-0 ml-2">
                                <Share2 className="w-4 h-4 text-stone-500 group-hover:text-orange-600" />
                            </div>
                        </div>
                        {it.author && (
                            <div className="mb-3 flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/10 w-fit px-2 py-1 rounded-md">
                                <span>@{it.author}</span>
                            </div>
                        )}
                        <div className="space-y-3 mb-6">
                             {it.items.slice(0, 3).map((item, idx) => (
                                 <div key={idx} className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
                                     <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                     <span className="truncate flex-1">{item.locationName}</span>
                                 </div>
                             ))}
                             {it.items.length > 3 && <div className="text-xs text-stone-400 pl-4">+{it.items.length - 3} more stops</div>}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto">
                            {it.tags?.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline">{tag}</Badge>
                            ))}
                            <Badge variant="default">{it.date}</Badge>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>
    </main>

    <div className="md:hidden fixed bottom-24 right-6 z-30">
        <button 
            onClick={onCreateClick}
            className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-600/40 hover:scale-105 transition-transform"
        >
            <Plus className="w-8 h-8" />
        </button>
    </div>

    <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-neutral-900 border-t border-stone-200 dark:border-neutral-800 px-6 py-4 flex justify-around items-center z-20 pb-safe">
        <button onClick={() => onNavigate('dashboard')} className="flex flex-col items-center gap-1 text-orange-600 dark:text-orange-500">
            <Home className="w-6 h-6" />
        </button>
        <button onClick={() => onNavigate('community')} className="flex flex-col items-center gap-1 text-stone-400 hover:text-orange-600 dark:hover:text-orange-500">
            <Users className="w-6 h-6" />
        </button>
    </div>
  </div>
  );
};
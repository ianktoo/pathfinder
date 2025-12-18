import React, { useState } from 'react';
import { Flame, Plus, Calendar, Clock, Globe } from 'lucide-react';
import { UserProfile, Itinerary, ViewState } from '../../types';
import { ItineraryDetailModal } from './ItineraryDetailModal';
import { BackendService } from '../../services/storage';
import { DashboardLayout } from '../layout/DashboardLayout';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardStats } from './dashboard/DashboardStats';
import { DashboardSearchFilter } from './dashboard/DashboardSearchFilter';
import { DashboardEmptyState } from './dashboard/DashboardEmptyState';
import { DashboardSection } from './dashboard/DashboardSection';

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

                <DashboardHeader
                    activeTab={activeTab}
                    user={user}
                    itineraryCount={localItineraries.length}
                    onCreateClick={onCreateClick}
                />

                {activeTab === 'overview' && (
                    <DashboardStats totalPlans={localItineraries.length} vibe={user.personality} />
                )}

                <DashboardSearchFilter
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    moodFilter={moodFilter}
                    setMoodFilter={setMoodFilter}
                    moods={moods}
                />

                {filteredItineraries.length === 0 && searchQuery ? (
                    <DashboardEmptyState
                        title="No matching plans"
                        message="Tap to generate"
                        onAction={onCreateClick}
                    />
                ) : (
                    <div className="space-y-12">
                        {/* Upcoming Section */}
                        {filteredItineraries.length > 0 && (
                            <DashboardSection
                                title="Upcoming Adventures"
                                icon={<Calendar className="w-5 h-5 text-orange-600" />}
                                itineraries={filteredItineraries.slice(0, 3)}
                                onItineraryClick={setSelectedItinerary}
                                onRemix={handleRemix}
                                onShare={handleShare}
                            />
                        )}

                        {/* Recent Section */}
                        {filteredItineraries.length > 3 && (
                            <DashboardSection
                                title="Recent Plans"
                                icon={<Clock className="w-5 h-5 text-purple-600" />}
                                itineraries={filteredItineraries.slice(3, 6)}
                                onItineraryClick={setSelectedItinerary}
                                onRemix={handleRemix}
                                onShare={handleShare}
                            />
                        )}

                        {/* Community Section */}
                        {communityItineraries.length > 0 && !searchQuery && (
                            <DashboardSection
                                title="Community Picks"
                                icon={<Globe className="w-5 h-5 text-blue-500" />}
                                itineraries={communityItineraries.slice(0, 3)}
                                onItineraryClick={setSelectedItinerary}
                                onRemix={handleRemix}
                                onShare={handleShare}
                            />
                        )}

                        {filteredItineraries.length === 0 && !searchQuery && (
                            <DashboardEmptyState
                                title="Create First Plan"
                                message="Tap to generate"
                                onAction={onCreateClick}
                            />
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
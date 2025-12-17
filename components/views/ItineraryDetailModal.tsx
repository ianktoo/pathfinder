import React, { useState, useRef } from 'react';
import { X, MessageSquare, Star, Share2, Map, Navigation, Copy, Clock, Calendar, Bookmark, CheckCircle, Circle, PenTool, Send, ThumbsUp, ThumbsDown, MapPin, Globe, ChevronDown, ChevronUp, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Itinerary, ItineraryItem, UserReview } from '../../types';
import { useToast } from '../ui/toast';
import { ModelRegistry } from '../../services/ai';
import { BackendService } from '../../services/storage';
import { Type } from "@google/genai";
import html2canvas from 'html2canvas';

const StarRating = ({ rating, interactive = false, onRate, size = "w-4 h-4" }: { rating: number, interactive?: boolean, onRate?: (r: number) => void, size?: string }) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                disabled={!interactive}
                type="button"
                onClick={(e) => {
                    if (interactive && onRate) {
                        e.stopPropagation();
                        onRate(star);
                    }
                }}
                className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform p-1' : 'cursor-default'}`}
            >
                <Star
                    className={`${size} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300 dark:text-neutral-600'}`}
                />
            </button>
        ))}
    </div>
);

interface ItineraryDetailModalProps {
    itinerary: Itinerary;
    onClose: () => void;
    onSave?: (itinerary: Itinerary) => Promise<boolean | void>;
    onShare?: (itinerary: Itinerary) => void;
    onRemix?: (itinerary: Itinerary) => void;
    userCity: string;
    allowEdit?: boolean;
}

export const ItineraryDetailModal = ({ itinerary, onClose, onSave, onShare, onRemix, userCity, allowEdit = false }: ItineraryDetailModalProps) => {
    const { showToast } = useToast();
    const [currentItinerary, setCurrentItinerary] = useState(itinerary);
    const [chatInput, setChatInput] = useState('');
    const [isChatMode, setIsChatMode] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPostSaveDialog, setShowPostSaveDialog] = useState(false);

    // Expanded Item State for Accordion
    const [expandedItem, setExpandedItem] = useState<number | null>(null);

    // Engagement State
    const [voteCount, setVoteCount] = useState(itinerary.likes || 0);
    const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

    // Review Modal State
    const [reviewingItemIndex, setReviewingItemIndex] = useState<number | null>(null);
    const [reviewInputs, setReviewInputs] = useState<Record<number, { text: string, rating: number, shareYelp: boolean }>>({});

    // Ref for social card generation
    const storyCardRef = useRef<HTMLDivElement>(null);

    const persistChanges = async (updated: Itinerary) => {
        setCurrentItinerary(updated);
        if (allowEdit) {
            await BackendService.saveItinerary(updated);
        }
    };

    const handleStartJourney = () => {
        if (!currentItinerary.items.length) return;
        const origin = "Current+Location";
        const destination = encodeURIComponent(`${currentItinerary.items[currentItinerary.items.length - 1].locationName} ${userCity}`);
        let waypoints = "";
        if (currentItinerary.items.length > 1) {
            const stops = currentItinerary.items.slice(0, -1).map(item => encodeURIComponent(`${item.locationName} ${userCity}`));
            waypoints = `&waypoints=${stops.join('|')}`;
        }
        const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=driving`;
        window.open(mapUrl, '_blank');
    };

    const handleDownloadCard = async () => {
        if (storyCardRef.current) {
            try {
                const canvas = await html2canvas(storyCardRef.current, {
                    useCORS: true,
                    scale: 2,
                    backgroundColor: null,
                });
                const link = document.createElement('a');
                link.download = `pathfinder-story-${currentItinerary.id}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (error) {
                console.error("Failed to generate card", error);
                alert("Could not generate image. Browser security might be blocking external images.");
            }
        }
    };

    const toggleBookmark = async () => {
        const updated = { ...currentItinerary, bookmarked: !currentItinerary.bookmarked };
        await persistChanges(updated);
    };

    const toggleComplete = async (idx: number) => {
        if (!allowEdit) return;
        const newItems = [...currentItinerary.items];
        newItems[idx] = { ...newItems[idx], completed: !newItems[idx].completed };
        const updated = { ...currentItinerary, items: newItems };
        await persistChanges(updated);
    };

    const toggleExpand = (idx: number) => {
        setExpandedItem(expandedItem === idx ? null : idx);
    };

    const handleVote = (type: 'up' | 'down') => {
        if (userVote === type) {
            setUserVote(null);
            setVoteCount(itinerary.likes || 0);
        } else {
            setUserVote(type);
            setVoteCount((itinerary.likes || 0) + (type === 'up' ? 1 : -1));
        }
    };

    const openReviewModal = (idx: number) => {
        setReviewingItemIndex(idx);
        if (!reviewInputs[idx]) {
            setReviewInputs(prev => ({ ...prev, [idx]: { text: '', rating: 5, shareYelp: false } }));
        }
    };

    const closeReviewModal = () => {
        setReviewingItemIndex(null);
    };

    const submitReview = async () => {
        if (reviewingItemIndex === null) return;
        const idx = reviewingItemIndex;
        const input = reviewInputs[idx];
        if (!input || !input.text) return;

        const newReview: UserReview = {
            rating: input.rating,
            text: input.text,
            date: new Date().toLocaleDateString(),
            postedToYelp: input.shareYelp
        };
        const newItems = [...currentItinerary.items];
        newItems[idx] = { ...newItems[idx], userReview: newReview };
        const updated = { ...currentItinerary, items: newItems };
        await persistChanges(updated);
        closeReviewModal();
        if (input.shareYelp) {
            alert(`Review posted to Yelp for ${newItems[idx].locationName}! (Mock)`);
        }
    };

    const handleRefine = async () => {
        if (!chatInput || !allowEdit) return;
        setIsLoading(true);
        try {
            const model = ModelRegistry.getProvider();
            const prompt = `
        Current Itinerary JSON: ${JSON.stringify(currentItinerary)}
        User Request: ${chatInput}
        Update the itinerary items based on the request. Maintain valid JSON structure with Yelp data fields.
      `;
            const itinerarySchema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                time: { type: Type.STRING },
                                activity: { type: Type.STRING },
                                locationName: { type: Type.STRING },
                                description: { type: Type.STRING },
                                verified: { type: Type.BOOLEAN },
                                category: { type: Type.STRING },
                                rating: { type: Type.NUMBER },
                                reviewCount: { type: Type.NUMBER },
                                price: { type: Type.STRING },
                                imageUrl: { type: Type.STRING }
                            }
                        }
                    }
                }
            };
            const responseText = await model.invoke(prompt, itinerarySchema);
            const data = JSON.parse(responseText);
            const updated = {
                ...currentItinerary,
                title: data.title || currentItinerary.title,
                items: data.items || currentItinerary.items
            };
            await persistChanges(updated);
            setChatInput('');
            setIsChatMode(false);
        } catch (e) {
            console.error(e);
            alert("Could not refine itinerary.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateItem = (idx: number, field: keyof ItineraryItem, value: string) => {
        const newItems = [...currentItinerary.items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setCurrentItinerary({ ...currentItinerary, items: newItems });
    };

    const handleRemoveItem = (idx: number) => {
        if (confirm('Remove this stop?')) {
            const newItems = currentItinerary.items.filter((_, i) => i !== idx);
            setCurrentItinerary({ ...currentItinerary, items: newItems });
        }
    };

    const saveEdits = async () => {
        await persistChanges(currentItinerary);
        setIsEditing(false);
    };

    const handleSaveClick = async () => {
        if (onSave) {
            setIsLoading(true);
            const success = await onSave(currentItinerary);
            setIsLoading(false);

            if (success === false) {
                showToast("Failed to save itinerary. Please try again.", "error");
            } else {
                setShowPostSaveDialog(true);
            }
        } else {
            handleStartJourney();
        }
    };

    // --- RENDER HELPERS ---

    const renderHeader = () => (
        <div className="relative w-full overflow-hidden bg-stone-100 dark:bg-neutral-900 shrink-0">
            {/* Ambient Background Blur */}
            <div
                className="absolute inset-0 opacity-40 dark:opacity-30 blur-3xl scale-125 pointer-events-none"
                style={{
                    backgroundImage: `url(${currentItinerary.items[0]?.imageUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200"})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover'
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-50/0 via-stone-50/60 to-stone-50 dark:via-neutral-950/60 dark:to-neutral-950 pointer-events-none" />

            <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-end max-w-5xl mx-auto">
                {/* Cover Art (Album Style) */}
                <div className="w-64 h-64 md:w-96 md:h-96 rounded-2xl shadow-2xl shrink-0 overflow-hidden group relative ring-1 ring-white/20">
                    <img
                        src={currentItinerary.items[0]?.imageUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200"}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt="Trip Cover"
                    />
                </div>

                {/* Playlist Info */}
                <div className="flex-1 text-center md:text-left space-y-4 pb-2">
                    <div className="space-y-2">
                        <Badge variant="outline" className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-transparent text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300">
                            {currentItinerary.mood} Edition
                        </Badge>
                        {isEditing ? (
                            <input
                                value={currentItinerary.title}
                                onChange={(e) => setCurrentItinerary({ ...currentItinerary, title: e.target.value })}
                                className="text-4xl md:text-6xl font-black text-stone-900 dark:text-white bg-transparent border-b border-stone-300 dark:border-stone-700 outline-none w-full text-center md:text-left"
                            />
                        ) : (
                            <h1 className="text-4xl md:text-6xl font-black text-stone-900 dark:text-white leading-tight tracking-tight drop-shadow-sm">
                                {currentItinerary.title}
                            </h1>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-semibold text-stone-700 dark:text-stone-300">
                        <div className="flex items-center gap-2 bg-white/40 dark:bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentItinerary.mood}`} className="w-5 h-5 rounded-full" alt="avatar" />
                            <span>Pathfinder AI</span>
                        </div>
                        <span className="hidden md:inline text-stone-400">•</span>
                        <span>{new Date().getFullYear()}</span>
                        <span className="hidden md:inline text-stone-400">•</span>
                        <span>{currentItinerary.items.length} stops</span>
                        <span className="hidden md:inline text-stone-400">•</span>
                        <span>{userCity}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderActionRow = () => (
        <div className="sticky top-0 z-30 bg-stone-50/90 dark:bg-neutral-950/90 backdrop-blur-xl border-b border-stone-200 dark:border-neutral-800 shadow-sm transition-all">
            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

                <div className="flex items-center gap-4">
                    {/* Primary Play/Save Button */}
                    {isEditing ? (
                        <Button onClick={saveEdits} className="rounded-full h-14 px-10 bg-green-600 hover:bg-green-500 text-white shadow-xl shadow-green-600/20 text-lg font-bold" icon={CheckCircle}>
                            Save Changes
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSaveClick}
                            isLoading={isLoading}
                            className="rounded-full h-14 px-10 bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-600/20 text-lg font-bold hover:scale-105 transition-transform"
                            icon={onSave ? undefined : Navigation}
                        >
                            {onSave ? 'SAVE ITINERARY' : 'START JOURNEY'}
                        </Button>
                    )}

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-2">
                        <button onClick={toggleBookmark} className="p-4 rounded-full hover:bg-stone-200 dark:hover:bg-neutral-800 transition-colors text-stone-500 dark:text-stone-400" title="Bookmark">
                            <Bookmark className={`w-6 h-6 ${currentItinerary.bookmarked ? 'fill-orange-600 text-orange-600' : ''}`} />
                        </button>
                        {onShare && (
                            <button onClick={() => onShare(currentItinerary)} className="p-4 rounded-full hover:bg-stone-200 dark:hover:bg-neutral-800 transition-colors text-stone-500 dark:text-stone-400" title="Share">
                                <Share2 className="w-6 h-6" />
                            </button>
                        )}
                        {allowEdit && (
                            <button onClick={() => setIsEditing(!isEditing)} className={`p-4 rounded-full hover:bg-stone-200 dark:hover:bg-neutral-800 transition-colors ${isEditing ? 'text-green-600 bg-green-100 dark:bg-green-900/20' : 'text-stone-500 dark:text-stone-400'}`} title="Edit">
                                <PenTool className="w-6 h-6" />
                            </button>
                        )}
                        <button onClick={handleDownloadCard} className="p-4 rounded-full hover:bg-stone-200 dark:hover:bg-neutral-800 transition-colors text-stone-500 dark:text-stone-400 md:hidden" title="Download">
                            <Download className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Song/Track Count or Duration Filter */}
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Total Duration</span>
                        <span className="text-sm font-bold text-stone-900 dark:text-white">~4 Hours</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-0 md:p-6">
            <div className="relative w-full h-full md:rounded-3xl bg-stone-50 dark:bg-neutral-950 flex flex-col shadow-2xl overflow-hidden md:border border-stone-200 dark:border-neutral-800 ring-1 ring-white/10">

                {/* Close Button (Floating) */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all hover:scale-110 shadow-lg border border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Main Scrollable Area */}
                <div className="flex-1 overflow-y-auto" ref={storyCardRef}>
                    <div className="min-h-full pb-32 bg-stone-50 dark:bg-neutral-950">

                        {renderHeader()}
                        {renderActionRow()}

                        {/* Playlist Content (Tracks) */}
                        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">

                            {/* Trip Brief (Description) */}
                            <div className="prose dark:prose-invert max-w-none text-stone-600 dark:text-stone-300 leading-relaxed font-medium text-lg">
                                <p>
                                    Welcome to your custom <span className="text-orange-600 dark:text-orange-400 font-bold">{currentItinerary.mood}</span> experience.
                                    This route includes {currentItinerary.items.length} carefully selected stops,
                                    perfectly timed for a {currentItinerary.tags.filter(t => t.includes('Day') || t.includes('Hour')).join(' ')} adventure.
                                </p>
                            </div>

                            {/* Timeline / Tracklist */}
                            <div className="space-y-1">
                                <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 text-xs font-bold uppercase tracking-widest text-stone-400 border-b border-stone-200 dark:border-neutral-800 mb-2 sticky top-[88px] z-20 bg-stone-50 dark:bg-neutral-950">
                                    <div className="w-8 text-center">#</div>
                                    <div>Location</div>
                                    <div className="hidden md:block">Time</div>
                                </div>

                                {currentItinerary.items.length === 0 ? (
                                    <div className="text-center py-20 bg-stone-100 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-stone-200 dark:border-neutral-800">
                                        <Map className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                                        <p className="text-stone-500 font-bold text-lg">No stops generated yet.</p>
                                        <p className="text-stone-400 text-sm">Try using the AI chat to add some!</p>
                                    </div>
                                ) : (
                                    currentItinerary.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => toggleExpand(idx)}
                                            className={`group relative grid grid-cols-[auto_1fr_auto] gap-4 items-center p-4 rounded-xl hover:bg-stone-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer ${expandedItem === idx ? 'bg-stone-100 dark:bg-white/10' : ''}`}
                                        >

                                            {/* Index / Hover Play */}
                                            <div className="w-8 text-center text-sm font-bold text-stone-400 group-hover:text-orange-600 flex justify-center">
                                                <span className="group-hover:hidden">{idx + 1}</span>
                                                <Circle className="hidden group-hover:block w-4 h-4 fill-orange-600 text-orange-600" />
                                            </div>

                                            {/* Track Info */}
                                            <div className="flex items-center gap-5 min-w-0">
                                                <img
                                                    src={item.imageUrl || `https://source.unsplash.com/random/100x100?${item.category}`}
                                                    className="w-14 h-14 rounded-lg object-cover shadow-sm bg-stone-200 dark:bg-neutral-800"
                                                    alt="thumbnail"
                                                />
                                                <div className="min-w-0">
                                                    <div className={`font-bold text-lg truncate ${item.completed ? 'opacity-50 line-through decoration-2 decoration-stone-400' : 'text-stone-900 dark:text-white'}`}>
                                                        {item.locationName}
                                                        {item.verified && <CheckCircle className="inline w-4 h-4 ml-2 text-blue-500" />}
                                                    </div>
                                                    <div className="text-sm text-stone-500 dark:text-stone-400 truncate flex items-center gap-2 mt-0.5">
                                                        <span className="font-semibold text-stone-600 dark:text-stone-300">{item.category}</span>
                                                        <span>•</span>
                                                        <span className="text-orange-600 dark:text-orange-400 md:hidden font-bold">{item.time}</span>
                                                        <span className="md:hidden">•</span>
                                                        <span>{item.price}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> {item.rating}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Duration / Actions */}
                                            <div className="flex items-center gap-6">
                                                <span className="text-sm font-bold text-stone-500 dark:text-stone-400 hidden md:block">
                                                    {item.time}
                                                </span>
                                                <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${expandedItem === idx ? 'rotate-180' : ''}`} />
                                            </div>

                                            {/* Expanded Detail View (Inline) */}
                                            {expandedItem === idx && (
                                                <div className="col-span-3 pt-4 pb-2 px-14 animate-in slide-in-from-top-2">
                                                    <p className="text-base text-stone-600 dark:text-stone-300 leading-relaxed mb-6 max-w-3xl">
                                                        {item.description}
                                                    </p>

                                                    <div className="flex flex-wrap gap-3">
                                                        {allowEdit && (
                                                            <Button
                                                                size="sm"
                                                                variant={item.completed ? "secondary" : "primary"}
                                                                onClick={(e) => { e.stopPropagation(); toggleComplete(idx); }}
                                                                className="h-10 px-6 rounded-full"
                                                            >
                                                                {item.completed ? "Mark Unvisited" : "Check In"}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => { e.stopPropagation(); openReviewModal(idx); }}
                                                            className="h-10 px-6 rounded-full border-stone-200 dark:border-neutral-700"
                                                        >
                                                            Write Review
                                                        </Button>
                                                        {allowEdit && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveItem(idx); }}
                                                                className="h-10 px-6 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                Remove Stop
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* REVIEW MODAL OVERLAY */}
            {reviewingItemIndex !== null && currentItinerary.items[reviewingItemIndex] && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 border border-stone-200 dark:border-neutral-800 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500"></div>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-stone-900 dark:text-white leading-tight mb-1">
                                    Reviewing {currentItinerary.items[reviewingItemIndex].locationName}
                                </h3>
                                <p className="text-stone-500 dark:text-stone-400 font-medium text-sm">Your feedback helps the community.</p>
                            </div>
                            <button onClick={closeReviewModal} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors">
                                <X className="w-5 h-5 text-stone-500" />
                            </button>
                        </div>
                        <div className="flex flex-col items-center mb-8">
                            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">Tap to Rate</div>
                            <StarRating
                                rating={reviewInputs[reviewingItemIndex]?.rating || 5}
                                interactive={true}
                                size="w-8 h-8"
                                onRate={(r) => setReviewInputs(prev => ({ ...prev, [reviewingItemIndex]: { ...prev[reviewingItemIndex], rating: r } }))}
                            />
                        </div>
                        <textarea
                            className="w-full text-base p-4 rounded-2xl border-2 border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 mb-6 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none font-medium text-stone-800 dark:text-stone-200 placeholder-stone-400"
                            placeholder="Share your experience (food, service, vibe)..."
                            rows={4}
                            value={reviewInputs[reviewingItemIndex]?.text || ''}
                            onChange={(e) => setReviewInputs(prev => ({ ...prev, [reviewingItemIndex]: { ...prev[reviewingItemIndex], text: e.target.value } }))}
                        />
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setReviewInputs(prev => ({ ...prev, [reviewingItemIndex]: { ...prev[reviewingItemIndex], shareYelp: !prev[reviewingItemIndex]?.shareYelp } }))}>
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${reviewInputs[reviewingItemIndex]?.shareYelp ? 'bg-white border-white' : 'border-stone-400 bg-transparent'}`}>
                                    {reviewInputs[reviewingItemIndex]?.shareYelp && <CheckCircle className="w-4 h-4 text-black" />}
                                </div>
                                <span className="text-xs font-bold text-stone-500 group-hover:text-stone-900 dark:group-hover:text-stone-300 transition-colors">Post to Yelp</span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={closeReviewModal} className="text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 dark:hover:text-white px-4 py-2 transition-colors">CANCEL</button>
                                <button onClick={submitReview} className="bg-orange-600 hover:bg-orange-500 text-white rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all active:scale-95"><Send className="w-3 h-3" /> POST</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Post-Save Navigation Dialog */}
            {showPostSaveDialog && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95 border border-stone-200 dark:border-neutral-800">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8" /></div>
                        <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-2">Trip Saved!</h3>
                        <p className="text-stone-500 dark:text-stone-400 mb-8 font-medium">Your itinerary has been secured. Where to next?</p>
                        <div className="space-y-3">
                            <button onClick={() => window.location.href = '/dashboard'} className="w-full py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold uppercase tracking-wide hover:scale-105 transition-transform">Go to Dashboard</button>
                            <button onClick={() => setShowPostSaveDialog(false)} className="w-full py-4 bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-300 rounded-xl font-bold uppercase tracking-wide hover:bg-stone-200 dark:hover:bg-neutral-700 transition-colors">Stay Here</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
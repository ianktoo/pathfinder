import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Star, Share2, Map, Navigation, Copy, Clock, Calendar, Bookmark, CheckCircle, Circle, PenTool, Send, ThumbsUp, ThumbsDown, MapPin, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Itinerary, ItineraryItem, UserReview } from '../../types';
import { ModelRegistry } from '../../services/ai';
import { BackendService } from '../../services/storage';
import { Type } from "@google/genai";

const StarRating = ({ rating, interactive = false, onRate }: { rating: number, interactive?: boolean, onRate?: (r: number) => void }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button 
        key={star} 
        disabled={!interactive}
        onClick={() => interactive && onRate && onRate(star)}
        className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
      >
        <Star 
          className={`w-3.5 h-3.5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300 dark:text-neutral-600'}`} 
        />
      </button>
    ))}
  </div>
);

interface ItineraryDetailModalProps {
  itinerary: Itinerary;
  onClose: () => void;
  onSave?: (itinerary: Itinerary) => void;
  onShare?: (itinerary: Itinerary) => void;
  onRemix?: (itinerary: Itinerary) => void;
  userCity: string;
  allowEdit?: boolean;
}

export const ItineraryDetailModal = ({ itinerary, onClose, onSave, onShare, onRemix, userCity, allowEdit = false }: ItineraryDetailModalProps) => {
  const [currentItinerary, setCurrentItinerary] = useState(itinerary);
  const [chatInput, setChatInput] = useState('');
  const [isChatMode, setIsChatMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Engagement State
  const [voteCount, setVoteCount] = useState(itinerary.likes || 0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  // Local state for review forms [itemIndex]: boolean
  const [activeReviewForms, setActiveReviewForms] = useState<Record<number, boolean>>({});
  const [reviewInputs, setReviewInputs] = useState<Record<number, { text: string, rating: number, shareYelp: boolean }>>({});

  // Persist changes immediately when check-ins or bookmarks happen
  const persistChanges = (updated: Itinerary) => {
    setCurrentItinerary(updated);
    // If we are in "view" mode (not creating), save to storage immediately
    if (!allowEdit) {
      BackendService.saveItinerary(updated);
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

  const toggleBookmark = () => {
    const updated = { ...currentItinerary, bookmarked: !currentItinerary.bookmarked };
    persistChanges(updated);
  };

  const toggleComplete = (idx: number) => {
    const newItems = [...currentItinerary.items];
    newItems[idx] = { ...newItems[idx], completed: !newItems[idx].completed };
    const updated = { ...currentItinerary, items: newItems };
    persistChanges(updated);
  };

  const handleVote = (type: 'up' | 'down') => {
      if (userVote === type) {
          setUserVote(null);
          setVoteCount(itinerary.likes || 0);
      } else {
          setUserVote(type);
          setVoteCount((itinerary.likes || 0) + (type === 'up' ? 1 : -1));
      }
      // In a real app, this would verify with backend
  };

  const toggleReviewForm = (idx: number) => {
    setActiveReviewForms(prev => ({ ...prev, [idx]: !prev[idx] }));
    if (!reviewInputs[idx]) {
        setReviewInputs(prev => ({ ...prev, [idx]: { text: '', rating: 5, shareYelp: false } }));
    }
  };

  const submitReview = (idx: number) => {
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
    
    persistChanges(updated);
    setActiveReviewForms(prev => ({ ...prev, [idx]: false })); // Close form
    
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
      setCurrentItinerary({
        ...currentItinerary,
        title: data.title || currentItinerary.title,
        items: data.items || currentItinerary.items
      });
      setChatInput('');
      setIsChatMode(false);
    } catch (e) {
      console.error(e);
      alert("Could not refine itinerary.");
    } finally {
      setIsLoading(false);
    }
  };

  const completedCount = currentItinerary.items.filter(i => i.completed).length;
  const progress = Math.round((completedCount / currentItinerary.items.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm md:p-8 animate-in fade-in duration-200">
        <div className="bg-stone-50 dark:bg-neutral-950 w-full max-w-5xl h-[95vh] md:h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 md:zoom-in-95 duration-300 border border-stone-200 dark:border-neutral-800">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-900 p-6 border-b border-stone-200 dark:border-neutral-800 sticky top-0 z-10 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex-1 mr-4">
                <h2 className="font-black text-xl text-stone-900 dark:text-white line-clamp-1">{currentItinerary.title}</h2>
                <div className="flex gap-2 mt-1 flex-wrap">
                {currentItinerary.tags.map(t => <span key={t} className="text-xs font-bold text-stone-400 uppercase">{t}</span>)}
                </div>
            </div>
            <div className="flex gap-2 shrink-0">
                <button 
                    onClick={toggleBookmark}
                    className={`p-3 rounded-xl transition-colors ${currentItinerary.bookmarked ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-neutral-800'}`}
                    title="Bookmark"
                >
                    <Bookmark className={`w-5 h-5 ${currentItinerary.bookmarked ? 'fill-orange-600 dark:fill-orange-400' : ''}`} />
                </button>
                {allowEdit && (
                    <button 
                        onClick={() => setIsChatMode(!isChatMode)} 
                        className={`p-3 rounded-xl transition-colors ${isChatMode ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-neutral-800'}`}
                        title="AI Refinement Chat"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                )}
                <button onClick={onClose} className="bg-stone-100 dark:bg-neutral-800 p-3 rounded-xl text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            </div>

            {/* Chat / Refine Mode */}
            {isChatMode && allowEdit && (
            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 border-b border-orange-100 dark:border-orange-900/30 animate-in slide-in-from-top-2 shrink-0">
                <div className="flex gap-2">
                <input 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ex: Change dinner to something spicy..."
                    className="flex-1 px-4 py-3 rounded-xl border border-orange-200 dark:border-orange-800 bg-white dark:bg-neutral-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                />
                <button onClick={handleRefine} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50">
                    {isLoading ? '...' : 'Update'}
                </button>
                </div>
            </div>
            )}
            
            {/* Content Area */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
            
            {/* Summary Section */}
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full">
                <div className="relative h-64 md:h-72 rounded-[2rem] overflow-hidden mb-8 shadow-2xl shadow-orange-500/10">
                    <img 
                        src={currentItinerary.items[0]?.imageUrl || `https://source.unsplash.com/random/1200x800?${currentItinerary.mood}`} 
                        className="w-full h-full object-cover"
                        alt="Trip Cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
                    <div className="absolute bottom-0 left-0 p-8 w-full">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className="bg-orange-500 text-white border-0 hover:bg-orange-600">
                                {currentItinerary.mood} Edition
                            </Badge>
                            {currentItinerary.shared && (
                                <Badge className="bg-green-500 text-white border-0 hover:bg-green-600 flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> Public
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white leading-none mb-4 drop-shadow-md line-clamp-2">
                            {currentItinerary.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-white/90 font-bold text-sm">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-400" />
                                <span>{currentItinerary.tags.find(t => t.includes('Day') || t.includes('Hour')) || 'Full Day'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Map className="w-4 h-4 text-orange-400" />
                                <span>{currentItinerary.items.length} Stops</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-400" />
                                <span>{currentItinerary.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-orange-400" />
                                <span>{userCity}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info & Engagement Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-2 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-stone-100 dark:border-neutral-800 shadow-sm">
                        <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-3">Trip Brief</h3>
                        <p className="text-base md:text-lg text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                            Pack your bags for a <strong>{currentItinerary.mood.toLowerCase()}</strong> vibe! 
                            This curated journey features <span className="text-orange-600 dark:text-orange-400">{currentItinerary.items.length} unique stops</span>, 
                            blending {currentItinerary.tags.filter(t => !t.includes('Day') && !t.includes('Hour')).join(', ')} into a perfect flow.
                            Starting at <span className="inline-block bg-stone-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md font-bold">{currentItinerary.items[0]?.time}</span>, 
                            you'll explore highly-rated local gems verified by Yelp.
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Activity Tracker */}
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-stone-100 dark:border-neutral-800 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-widest">Progress</h3>
                                <span className="text-xs font-bold text-orange-600">{progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-stone-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                         {/* Engagement / Voting (Placeholder) */}
                         <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-stone-100 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-widest mb-1">Community Pulse</h3>
                                <div className="text-xs text-stone-500">Do you like this plan?</div>
                            </div>
                            <div className="flex items-center gap-2 bg-stone-100 dark:bg-neutral-800 rounded-xl p-1">
                                <button onClick={() => handleVote('up')} className={`p-2 rounded-lg transition-colors ${userVote === 'up' ? 'bg-green-100 text-green-600' : 'hover:bg-white dark:hover:bg-neutral-700 text-stone-400'}`}>
                                    <ThumbsUp className="w-4 h-4" />
                                </button>
                                <span className={`text-sm font-bold w-6 text-center ${userVote === 'up' ? 'text-green-600' : userVote === 'down' ? 'text-red-600' : 'text-stone-600 dark:text-stone-400'}`}>{voteCount}</span>
                                <button onClick={() => handleVote('down')} className={`p-2 rounded-lg transition-colors ${userVote === 'down' ? 'bg-red-100 text-red-600' : 'hover:bg-white dark:hover:bg-neutral-700 text-stone-400'}`}>
                                    <ThumbsDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="h-px bg-stone-200 dark:bg-neutral-800 flex-1"></div>
                <span className="text-xs font-black text-stone-400 uppercase tracking-widest">The Timeline</span>
                <div className="h-px bg-stone-200 dark:bg-neutral-800 flex-1"></div>
            </div>

            {/* Timeline List (Vertical Layout) */}
            <div className="flex flex-col gap-6">
                {currentItinerary.items.map((item, idx) => (
                    <div key={idx} className={`bg-white dark:bg-neutral-900 rounded-3xl border shadow-sm overflow-hidden group transition-all relative flex flex-col md:flex-row h-auto md:h-56 ${item.completed ? 'border-green-500 dark:border-green-800 opacity-80' : 'border-stone-200 dark:border-neutral-800 hover:border-orange-400'}`}>
                    
                    {/* Check In Button (Top Right on Mobile, Overlay on Desktop) */}
                    <button 
                        onClick={() => toggleComplete(idx)}
                        className={`absolute top-4 right-4 z-20 p-2 rounded-full backdrop-blur-md transition-all ${item.completed ? 'bg-green-500 text-white' : 'bg-black/30 text-white hover:bg-green-500'}`}
                        title={item.completed ? "Mark as not visited" : "Check In"}
                    >
                        {item.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>

                    <div className="h-48 md:h-full md:w-1/3 bg-stone-200 dark:bg-neutral-800 relative shrink-0">
                        <img 
                            src={item.imageUrl || `https://source.unsplash.com/random/800x600?${item.category.toLowerCase()},${idx}`} 
                            className={`w-full h-full object-cover transition-all ${item.completed ? 'grayscale' : ''}`}
                            onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000')}
                            alt={item.locationName}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-3 left-4 text-white">
                            <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg mb-1 w-fit shadow-lg ${item.completed ? 'bg-green-600' : 'bg-orange-600'}`}>
                                {item.completed ? 'Visited' : item.time}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1 overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={`font-black text-xl leading-tight truncate ${item.completed ? 'text-stone-500 line-through' : 'text-stone-900 dark:text-white'}`}>{item.locationName}</h3>
                            <Badge variant="outline" className="shrink-0">{item.category}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-3">
                            <StarRating rating={item.rating || 4.5} />
                            <span className="text-xs font-bold text-stone-400">({item.reviewCount || 100})</span>
                            <span className="text-xs font-black text-stone-600 dark:text-stone-300 px-2 py-0.5 bg-stone-100 dark:bg-neutral-800 rounded-md">{item.price || '$$'}</span>
                        </div>
                        
                        <p className="text-stone-600 dark:text-stone-400 text-sm font-medium mb-4 leading-relaxed line-clamp-2 md:line-clamp-3">{item.description}</p>
                        
                        <div className="mt-auto flex items-center justify-between">
                             <div className="flex gap-2">
                                {item.verified && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg w-fit">
                                        <span className="font-black">Yelp</span> Verified
                                    </div>
                                )}
                             </div>

                            {/* Review Display or Toggle */}
                            {item.userReview ? (
                                <div className="text-[10px] bg-stone-50 dark:bg-neutral-800 px-3 py-1 rounded-lg border border-stone-100 dark:border-neutral-700 flex items-center gap-2">
                                    <span className="font-bold text-orange-600">Rated {item.userReview.rating}/5</span>
                                </div>
                            ) : (
                                !allowEdit && (
                                    <button 
                                        onClick={() => toggleReviewForm(idx)}
                                        className="text-stone-400 text-xs font-bold hover:text-orange-600 transition-colors flex items-center gap-1"
                                    >
                                        <PenTool className="w-3 h-3" /> Write Review
                                    </button>
                                )
                            )}
                        </div>

                         {/* Review Form Overlay */}
                         {activeReviewForms[idx] && (
                            <div className="absolute inset-0 bg-white dark:bg-neutral-900 p-4 z-10 flex flex-col justify-center animate-in fade-in">
                                <div className="mb-3 flex justify-center">
                                    <StarRating 
                                        rating={reviewInputs[idx]?.rating || 5} 
                                        interactive={true}
                                        onRate={(r) => setReviewInputs(prev => ({ ...prev, [idx]: { ...prev[idx], rating: r } }))}
                                    />
                                </div>
                                <textarea 
                                    className="w-full text-xs p-2 rounded-lg border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 mb-2 focus:ring-1 focus:ring-orange-500 outline-none"
                                    placeholder="How was it?"
                                    rows={2}
                                    value={reviewInputs[idx]?.text || ''}
                                    onChange={(e) => setReviewInputs(prev => ({ ...prev, [idx]: { ...prev[idx], text: e.target.value } }))}
                                />
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            id={`yelp-${idx}`}
                                            checked={reviewInputs[idx]?.shareYelp || false}
                                            onChange={(e) => setReviewInputs(prev => ({ ...prev, [idx]: { ...prev[idx], shareYelp: e.target.checked } }))}
                                            className="accent-red-500"
                                        />
                                        <label htmlFor={`yelp-${idx}`} className="text-xs font-bold text-stone-500">Post to Yelp</label>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" className="h-8 py-0 text-xs w-auto" onClick={() => toggleReviewForm(idx)}>Cancel</Button>
                                        <Button className="h-8 py-0 text-xs w-auto" onClick={() => submitReview(idx)} icon={Send}>Post</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    </div>
                ))}
            </div>
            </div>

            {/* Action Footer */}
            <div className="p-6 bg-white dark:bg-neutral-900 border-t border-stone-200 dark:border-neutral-800 sticky bottom-0 z-10 flex flex-col gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] shrink-0">
            <Button onClick={handleStartJourney} variant="outline" className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" icon={Navigation}>
                    Start Journey (Google Maps)
            </Button>
            
            <div className="flex gap-3">
                {onRemix && (
                    <Button onClick={() => onRemix(currentItinerary)} variant="secondary" icon={Copy} className="flex-1">
                        Remix
                    </Button>
                )}
                {onShare && (
                    <Button onClick={() => onShare(currentItinerary)} variant="secondary" icon={Share2} className="flex-1">
                        Share
                    </Button>
                )}
                {onSave && (
                    <Button onClick={() => onSave(currentItinerary)} variant="primary" className="flex-[2]">
                        Save Itinerary
                    </Button>
                )}
            </div>
            </div>
        </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, MessageSquare, Star, Share2, Map, Navigation, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Itinerary } from '../../types';
import { ModelRegistry } from '../../services/ai';
import { Type } from "@google/genai";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star 
        key={star} 
        className={`w-3.5 h-3.5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300 dark:text-neutral-600'}`} 
      />
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
                price: { type: Type.STRING }
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

  return (
    <div className="bg-stone-50 dark:bg-neutral-950 flex flex-col h-full animate-in slide-in-from-bottom-10 fixed inset-0 z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 p-6 border-b border-stone-200 dark:border-neutral-800 sticky top-0 z-10 flex items-center justify-between shadow-sm">
          <div className="flex-1 mr-4">
            <h2 className="font-black text-xl text-stone-900 dark:text-white line-clamp-1">{currentItinerary.title}</h2>
            <div className="flex gap-2 mt-1 flex-wrap">
              {currentItinerary.tags.map(t => <span key={t} className="text-xs font-bold text-stone-400 uppercase">{t}</span>)}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
             {allowEdit && (
                <button 
                    onClick={() => setIsChatMode(!isChatMode)} 
                    className={`p-3 rounded-xl transition-colors ${isChatMode ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-neutral-800'}`}
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
          <div className="bg-orange-50 dark:bg-orange-900/10 p-4 border-b border-orange-100 dark:border-orange-900/30 animate-in slide-in-from-top-2">
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
        
        {/* Itinerary Items */}
        <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto pb-32">
          {currentItinerary.items.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200 dark:border-neutral-800 shadow-sm overflow-hidden group hover:border-orange-400 transition-colors relative">
              {idx !== currentItinerary.items.length - 1 && (
                  <div className="absolute left-8 bottom-0 top-16 w-0.5 bg-stone-200 dark:bg-neutral-800 -z-10 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30"></div>
              )}
              <div className="flex flex-col md:flex-row">
                  <div className="h-48 md:h-auto md:w-1/3 bg-stone-200 dark:bg-neutral-800 relative">
                    <img 
                        src={`https://source.unsplash.com/random/800x600?${item.category.toLowerCase()},${idx}`} 
                        className="w-full h-full object-cover" 
                        onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000')}
                        alt={item.locationName}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r"></div>
                    <div className="absolute bottom-3 left-4 text-white md:top-4 md:left-4 md:bottom-auto">
                        <div className="text-xs font-bold uppercase tracking-wider bg-orange-600 px-2 py-1 rounded-lg mb-1 w-fit shadow-lg">{item.time}</div>
                    </div>
                  </div>
                  <div className="p-5 md:p-6 md:w-2/3 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-xl leading-tight text-stone-900 dark:text-white">{item.locationName}</h3>
                        <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <StarRating rating={item.rating || 4.5} />
                        <span className="text-xs font-bold text-stone-400">({item.reviewCount || 100} reviews)</span>
                        <span className="text-xs font-black text-stone-600 dark:text-stone-300 px-2 py-0.5 bg-stone-100 dark:bg-neutral-800 rounded-md">{item.price || '$$'}</span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 text-sm font-medium mb-4 leading-relaxed">{item.description}</p>
                    {item.verified && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg w-fit">
                            <span className="font-black">Yelp</span> Verified Business
                        </div>
                    )}
                  </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-white dark:bg-neutral-900 border-t border-stone-200 dark:border-neutral-800 sticky bottom-0 z-10 flex flex-col gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
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
  );
};

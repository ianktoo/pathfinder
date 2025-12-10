import React, { useState } from 'react';
import { Type } from "@google/genai";
import { X, Check, MapPin, ShoppingBag, Coffee, Utensils, Music, Camera } from 'lucide-react';
import { Button } from '../ui/button';
import { Itinerary, UserProfile } from '../../types';
import { ModelRegistry, PromptTemplate, RunnableSequence } from '../../services/ai';
import { ItineraryDetailModal } from './ItineraryDetailModal';
import { BackendService } from '../../services/storage';

interface CreateItineraryViewProps {
  user: UserProfile;
  onClose: () => void;
  onSave: (itinerary: Itinerary) => void;
}

export const CreateItineraryView = ({ user, onClose, onSave }: CreateItineraryViewProps) => {
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Itinerary | null>(null);

  // Curation Options
  const [budget, setBudget] = useState('$$');
  const [duration, setDuration] = useState('Full Day');
  const [groupSize, setGroupSize] = useState('Couple');
  
  // New Options
  const [stopCount, setStopCount] = useState(4);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const moods = ['Romantic', 'Adventure', 'Chill', 'Party', 'Culture'];
  const budgets = ['$', '$$', '$$$', '$$$$'];
  const durations = ['Quick', 'Half Day', 'Full Day'];
  const groups = ['Solo', 'Couple', 'Group', 'Family'];

  const placeTypes = [
    { id: 'Restaurant', icon: Utensils, label: 'Dining' },
    { id: 'Bar', icon: Coffee, label: 'Drinks' },
    { id: 'Shopping', icon: ShoppingBag, label: 'Shopping' },
    { id: 'Museum', icon: Camera, label: 'Culture' },
    { id: 'Park', icon: MapPin, label: 'Nature' },
    { id: 'Club', icon: Music, label: 'Nightlife' },
  ];

  const toggleType = (id: string) => {
    if (selectedTypes.includes(id)) {
        setSelectedTypes(selectedTypes.filter(t => t !== id));
    } else {
        setSelectedTypes([...selectedTypes, id]);
    }
  };

  const generateItinerary = async () => {
    if (!mood) return;
    setLoading(true);

    try {
      const typeConstraint = selectedTypes.length > 0 
        ? `Ensure you visit these types of places: ${selectedTypes.join(', ')}.` 
        : '';

      const template = new PromptTemplate(
        `Create a ${stopCount}-stop itinerary for a {groupSize} in {city}. 
         User Personality: "{personality}". Mood: "{mood}". Budget: {budget}.
         Duration context: {duration}.
         ${typeConstraint}
         
         IMPORTANT: You must act as a Yelp Data wrapper. 
         For each item, hallucinate realistic "Yelp" data:
         - rating (between 3.5 and 5.0)
         - reviewCount (random realistic number)
         - price (matching the budget)
         - verified: true
         
         The itinerary should flow logically by time.`
      );
      
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

      const model = ModelRegistry.getProvider();
      const chain = new RunnableSequence(template, model, itinerarySchema);

      const data = await chain.invoke({
        duration,
        groupSize,
        city: user.city,
        personality: user.personality,
        mood: mood,
        budget
      });

      const newItinerary: Itinerary = {
        id: Date.now().toString(),
        title: data.title || `${mood} in ${user.city}`,
        date: new Date().toLocaleDateString(),
        mood,
        tags: [groupSize, budget, duration, ...selectedTypes],
        items: data.items || []
      };

      setResult(newItinerary);
    } catch (error) {
      console.error(error);
      alert("Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (itinerary: Itinerary) => {
      const success = BackendService.publishItinerary(itinerary, user.name);
      if (success) {
          alert("Published to Community Feed!");
      }
      onSave(itinerary); // Auto save when shared
  };

  if (result) {
    return (
        <ItineraryDetailModal 
            itinerary={result} 
            onClose={() => setResult(null)} 
            onSave={onSave}
            onShare={handleShare}
            userCity={user.city}
            allowEdit={true}
        />
    );
  }

  // Input Form
  return (
    <div className="h-full flex flex-col p-6 md:p-12 overflow-y-auto bg-stone-50 dark:bg-neutral-950">
      <div className="max-w-2xl mx-auto w-full pb-20">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Curate<br/>Adventure</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-neutral-800"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Mood Selector */}
            <section>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Vibe & Mood</label>
                <div className="flex flex-wrap gap-3">
                    {moods.map(m => (
                    <button
                        key={m}
                        onClick={() => setMood(m)}
                        className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                        mood === m 
                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 scale-105' 
                            : 'bg-white dark:bg-neutral-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-neutral-700 hover:border-orange-500'
                        }`}
                    >
                        {m}
                    </button>
                    ))}
                </div>
            </section>

            {/* Must Haves Selector */}
            <section>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Must Include (Select Multiple)</label>
                <div className="grid grid-cols-3 gap-3">
                    {placeTypes.map((type) => {
                        const isSelected = selectedTypes.includes(type.id);
                        return (
                            <button
                                key={type.id}
                                onClick={() => toggleType(type.id)}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                                    isSelected 
                                    ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' 
                                    : 'border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-stone-500 hover:border-orange-300'
                                }`}
                            >
                                <type.icon className={`w-6 h-6 ${isSelected ? 'stroke-2' : 'stroke-1'}`} />
                                <span className="text-xs font-bold">{type.label}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Stop Count Slider */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Number of Stops</label>
                    <span className="text-sm font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-lg">{stopCount} Places</span>
                </div>
                <input 
                    type="range" 
                    min="2" 
                    max="8" 
                    value={stopCount} 
                    onChange={(e) => setStopCount(parseInt(e.target.value))} 
                    className="w-full h-2 bg-stone-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <div className="flex justify-between text-xs font-bold text-stone-400 mt-2">
                    <span>Quick Trip</span>
                    <span>Full Day</span>
                </div>
            </section>

            <div className="grid grid-cols-2 gap-6">
                <section>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Timeframe</label>
                    <div className="space-y-2">
                        {durations.map(d => (
                             <button key={d} onClick={() => setDuration(d)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${duration === d ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : 'border-stone-100 dark:border-neutral-800 bg-white dark:bg-neutral-900'}`}>{d}</button>
                        ))}
                    </div>
                </section>
                <section>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Group Size</label>
                    <div className="space-y-2">
                        {groups.map(g => (
                             <button key={g} onClick={() => setGroupSize(g)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${groupSize === g ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : 'border-stone-100 dark:border-neutral-800 bg-white dark:bg-neutral-900'}`}>{g}</button>
                        ))}
                    </div>
                </section>
            </div>

            <section>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Price Point</label>
                <div className="flex rounded-xl bg-stone-100 dark:bg-neutral-800 p-1">
                    {budgets.map(b => (
                        <button 
                            key={b}
                            onClick={() => setBudget(b)}
                            className={`flex-1 py-3 rounded-lg text-sm font-black transition-all ${budget === b ? 'bg-white dark:bg-neutral-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400'}`}
                        >
                            {b}
                        </button>
                    ))}
                </div>
            </section>

            <div className="pt-6">
                <Button onClick={generateItinerary} disabled={!mood || loading} isLoading={loading}>
                    {loading ? 'Consulting the Oracle...' : 'Generate Itinerary'}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};
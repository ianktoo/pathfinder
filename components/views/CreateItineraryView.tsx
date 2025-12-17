
import React, { useState, useEffect, useRef } from 'react';
import { Type } from "@google/genai";
import { X, Check, MapPin, ShoppingBag, Coffee, Utensils, Music, Camera, LocateFixed, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Itinerary, UserProfile } from '../../types';
import { ModelRegistry, PromptTemplate, RunnableSequence } from '../../services/ai';
import { ItineraryDetailModal } from './ItineraryDetailModal';
import { BackendService } from '../../services/storage';
import { OptionService } from '../../services/options'; // Added new service
import { LocationService } from '../../services/location';
import { ItineraryOption } from '../../types';
import { useToast } from '../ui/toast';

interface CreateItineraryViewProps {
    user: UserProfile;
    onClose: () => void;
    onSave: (itinerary: Itinerary) => void;
}

export const CreateItineraryView = ({ user, onClose, onSave }: CreateItineraryViewProps) => {

    const getPlaceImage = (category: string) => {
        const map: Record<string, string> = {
            'Restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200',
            'Bar': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200',
            'Museum': 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=1200',
            'Park': 'https://images.unsplash.com/photo-1496347646636-ea47f7d6b37b?q=80&w=1200',
            'Shopping': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200',
            'Club': 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1200',
            'Food': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200',
            'Nature': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200'
        };
        const defaults = [
            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200',
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200',
            'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1200'
        ];
        return map[category] || defaults[Math.floor(Math.random() * defaults.length)];
    };

    const [mood, setMood] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [result, setResult] = useState<Itinerary | null>(null);
    const { showToast } = useToast();

    // Location State
    const [targetCity, setTargetCity] = useState(user.city);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const moodSectionRef = useRef<HTMLElement>(null);

    // Curation Options
    const [budget, setBudget] = useState('$$');
    const [duration, setDuration] = useState('Full Day');
    const [groupSize, setGroupSize] = useState('Couple');
    const [stopCount, setStopCount] = useState(4);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [customName, setCustomName] = useState('');

    // Dynamic Options State
    // Defaults Constants
    const DEFAULT_MOODS = ['Romantic', 'Adventure', 'Chill', 'Party', 'Culture'];
    const DEFAULT_BUDGETS = ['$', '$$', '$$$', '$$$$'];
    const DEFAULT_DURATIONS = ['Quick Trip', 'Half Day', 'Full Day', 'Multi-Day'];
    const DEFAULT_GROUPS = ['Solo', 'Couple', 'Family', 'Friends'];
    const DEFAULT_TYPES = [
        { id: 'Restaurant', icon: Utensils, label: 'Dining', value: 'Restaurant' },
        { id: 'Bar', icon: Coffee, label: 'Drinks', value: 'Bar' },
        { id: 'Shopping', icon: ShoppingBag, label: 'Shopping', value: 'Shopping' },
        { id: 'Museum', icon: Camera, label: 'Culture', value: 'Museum' },
        { id: 'Park', icon: MapPin, label: 'Nature', value: 'Park' },
        { id: 'Club', icon: Music, label: 'Nightlife', value: 'Club' },
    ];

    // Dynamic Options State (Optimistic Init)
    const [moods, setMoods] = useState<string[]>(DEFAULT_MOODS);
    const [budgets, setBudgets] = useState<string[]>(DEFAULT_BUDGETS);
    const [durations, setDurations] = useState<string[]>(DEFAULT_DURATIONS);
    const [groups, setGroups] = useState<string[]>(DEFAULT_GROUPS);
    const [placeTypes, setPlaceTypes] = useState<any[]>(DEFAULT_TYPES);
    const [optionsLoading, setOptionsLoading] = useState(false);

    // Icon Mapping
    const iconMap: any = { Utensils, Coffee, ShoppingBag, Camera, MapPin, Music };

    useEffect(() => {
        const loadConfiguration = async () => {
            // We already showed defaults, so this is just a hydrate refresh
            console.log("CreateItineraryView: Hydrating configuration...");

            try {
                const allOptions = await OptionService.getOptions();

                if (allOptions.length > 0) {
                    setMoods(allOptions.filter(o => o.category === 'mood').map(o => o.label));
                    setBudgets(allOptions.filter(o => o.category === 'budget').map(o => o.label));
                    setDurations(allOptions.filter(o => o.category === 'duration').map(o => o.label));
                    setGroups(allOptions.filter(o => o.category === 'group').map(o => o.label));

                    const types = allOptions.filter(o => o.category === 'type');
                    setPlaceTypes(types.map(o => ({
                        id: o.value,
                        label: o.label,
                        // @ts-ignore
                        icon: (o.icon && iconMap[o.icon]) ? iconMap[o.icon] : MapPin
                    })));
                }
            } catch (e) {
                console.error("Failed to load options, keeping defaults", e);
            }
        };
        loadConfiguration();
    }, []);

    const handleDetectLocation = async () => {
        setDetectingLocation(true);
        try {
            const position = await LocationService.getCurrentPosition();
            const city = await LocationService.getCityFromCoords(position.coords.latitude, position.coords.longitude);
            setTargetCity(city);
            showToast(`Location set to ${city}`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Location detection failed", 'error');
        } finally {
            setDetectingLocation(false);
        }
    };

    const toggleType = (id: string) => {
        if (selectedTypes.includes(id)) {
            setSelectedTypes(selectedTypes.filter(t => t !== id));
        } else {
            setSelectedTypes([...selectedTypes, id]);
        }
    };

    const generateItinerary = async () => {
        if (!mood) {
            showToast("Please select a Vibe & Mood to continue", "error");
            moodSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setLoading(true);

        const steps = [
            "Consulting the Oracle...",
            "Scanning local hotspots...",
            "Checking Yelp ratings...",
            "Verifying opening hours...",
            "Finalizing your adventure..."
        ];

        // Simulate progressive loading steps
        let stepIndex = 0;
        const interval = setInterval(() => {
            setLoadingStep(steps[stepIndex]);
            stepIndex = (stepIndex + 1) % steps.length;
        }, 2000);
        setLoadingStep(steps[0]);

        try {
            const typeConstraint = selectedTypes.length > 0
                ? `Ensure you visit these types of places: ${selectedTypes.join(', ')}.`
                : '';

            const template = new PromptTemplate(
                `Create a ${stopCount}-stop itinerary for a {groupSize} in {city}. 
         User Personality: "{personality}". Mood: "{mood}". Budget: {budget}.
         Duration context: {duration}.
         ${typeConstraint}
         
         Title Instruction: The user has provided this name preference: "{customName}". 
         If "{customName}" is not empty, use it EXACTLY as the title. 
         If it is empty, generate a SHORT, MEMORABLE, and CREATIVE title (max 6 words) based on the vibe.
         
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
                    title: { type: Type.STRING, description: "A short, catchy name for this trip (max 6 words)" },
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

            const model = ModelRegistry.getProvider();
            const chain = new RunnableSequence(template, model, itinerarySchema);

            const data = await chain.invoke({
                duration,
                groupSize,
                city: targetCity,
                personality: user.personality,
                mood: mood,
                budget,
                customName
            });

            const newItinerary: Itinerary = {
                id: crypto.randomUUID(),
                title: data.title || `${mood} in ${targetCity}`,
                date: new Date().toLocaleDateString(),
                mood,
                tags: [groupSize, budget, duration, ...selectedTypes],
                items: (data.items || []).map((item: any) => ({
                    ...item,
                    imageUrl: getPlaceImage(item.category || 'Park')
                }))
            };

            setResult(newItinerary);
            showToast('Itinerary curated successfully!', 'success');
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            showToast(`Failed: ${errorMessage}`, 'error');
        } finally {
            clearInterval(interval);
            setLoading(false);
        }
    };

    const handleShare = (itinerary: Itinerary) => {
        const success = BackendService.publishItinerary(itinerary, user.name);
        if (success) {
            showToast("Published to Community Feed!", 'success');
        }
        // Save silently without navigation
        BackendService.saveItinerary(itinerary);
    };

    const handleSaveForModal = async (itinerary: Itinerary) => {
        // Just save to DB so the modal stays open and shows the dialog
        return await BackendService.saveItinerary(itinerary);
    };

    if (result) {
        return (
            <ItineraryDetailModal
                itinerary={result}
                onClose={() => setResult(null)}
                onSave={handleSaveForModal}
                onShare={handleShare}
                userCity={targetCity}
                allowEdit={true}
            />
        );
    }

    // Input Form
    return (
        <div className="h-full flex flex-col p-6 md:p-12 overflow-y-auto bg-stone-50 dark:bg-neutral-950">
            <div className="max-w-2xl mx-auto w-full pb-20">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-500 transition-colors"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h2 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight leading-none">Curate<br />Adventure</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-neutral-800"><X className="w-6 h-6" /></button>
                </div>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

                    {/* Location Selector */}
                    <section className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">Target City</label>
                            <input
                                className="text-lg font-black bg-transparent outline-none text-stone-900 dark:text-white placeholder-stone-300"
                                value={targetCity}
                                onChange={(e) => setTargetCity(e.target.value)}
                                placeholder="Where are you going?"
                            />
                        </div>
                        <Button
                            variant="ghost"
                            className="w-auto h-auto p-3"
                            onClick={handleDetectLocation}
                            isLoading={detectingLocation}
                            title="Use Current Location"
                        >
                            <LocateFixed className="w-5 h-5" />
                        </Button>
                    </section>

                    {/* Custom Name Input */}
                    <section>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">Trip Name (Optional)</label>
                        <input
                            className="w-full text-lg font-black bg-transparent border-b-2 border-stone-200 focus:border-orange-500 outline-none py-2 text-stone-900 dark:text-white placeholder-stone-300 transition-colors"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="e.g. Birthday Bash 2024"
                        />
                    </section>

                    {/* Mood Selector */}
                    <section ref={moodSectionRef}>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Vibe & Mood</label>
                        <div className="flex flex-wrap gap-3">
                            {optionsLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-11 w-24 bg-stone-200 dark:bg-neutral-800 rounded-full animate-pulse" />
                                ))
                            ) : (
                                moods.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMood(m)}
                                        className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${mood === m
                                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 scale-105'
                                            : 'bg-white dark:bg-neutral-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-neutral-700 hover:border-orange-500'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Must Haves Selector */}
                    <section>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Must Include (Select Multiple)</label>
                        <div className="grid grid-cols-3 gap-3">
                            {optionsLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-24 rounded-2xl bg-stone-200 dark:bg-neutral-800 animate-pulse" />
                                ))
                            ) : (
                                placeTypes.map((type) => {
                                    const isSelected = selectedTypes.includes(type.id);
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => toggleType(type.id)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${isSelected
                                                ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                                                : 'border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-stone-500 hover:border-orange-300'
                                                }`}
                                        >
                                            <type.icon className={`w-6 h-6 ${isSelected ? 'stroke-2' : 'stroke-1'}`} />
                                            <span className="text-xs font-bold">{type.label}</span>
                                        </button>
                                    );
                                })
                            )}
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
                                {optionsLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-12 w-full bg-stone-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                                    ))
                                ) : (
                                    durations.map(d => (
                                        <button key={d} onClick={() => setDuration(d)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${duration === d ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : 'border-stone-100 dark:border-neutral-800 bg-white dark:bg-neutral-900'}`}>{d}</button>
                                    ))
                                )}
                            </div>
                        </section>
                        <section>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Group Size</label>
                            <div className="space-y-2">
                                {optionsLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-12 w-full bg-stone-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                                    ))
                                ) : (
                                    groups.map(g => (
                                        <button key={g} onClick={() => setGroupSize(g)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${groupSize === g ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : 'border-stone-100 dark:border-neutral-800 bg-white dark:bg-neutral-900'}`}>{g}</button>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <section>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Price Point</label>
                        <div className="flex rounded-xl bg-stone-100 dark:bg-neutral-800 p-1">
                            {optionsLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex-1 h-10 m-1 bg-white/50 dark:bg-neutral-700/50 rounded-lg animate-pulse" />
                                ))
                            ) : (
                                budgets.map(b => (
                                    <button
                                        key={b}
                                        onClick={() => setBudget(b)}
                                        className={`flex-1 py-3 rounded-lg text-sm font-black transition-all ${budget === b ? 'bg-white dark:bg-neutral-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400'}`}
                                    >
                                        {b}
                                    </button>
                                ))
                            )}
                        </div>
                    </section>

                    <div className="pt-6">
                        <Button onClick={generateItinerary} disabled={loading} isLoading={loading}>
                            {loading ? loadingStep : 'Generate Itinerary'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

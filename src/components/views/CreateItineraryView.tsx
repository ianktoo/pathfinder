
import React, { useState, useEffect, useRef } from 'react';
import { Type } from "@google/genai";
import { X, Check, MapPin, ShoppingBag, Coffee, Utensils, Music, Camera, LocateFixed, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Itinerary, UserProfile } from '../../types';
import { ModelRegistry, PromptTemplate, RunnableSequence } from '../../services/ai';
import { ItineraryDetailModal } from './ItineraryDetailModal';
import { BackendService } from '../../services/storage';
import { OptionService } from '../../services/options';
import { LocationService } from '../../services/location';
import { ItineraryOption, ViewState } from '../../types';
import { useToast } from '../ui/toast';
import { DashboardLayout } from '../layout/DashboardLayout';

interface CreateItineraryViewProps {
    user: UserProfile;
    onClose: () => void;
    onSave: (itinerary: Itinerary) => void;
    onNavigate: (view: ViewState) => void;
    onLogout: () => void;
}

export const CreateItineraryView = ({ user, onClose, onSave, onNavigate, onLogout }: CreateItineraryViewProps) => {

    // ... (keep helper functions like getPlaceImage the same)

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
        <DashboardLayout
            user={user}
            activeTab="home" // Default or create a 'create' tab? For now 'home' or no highlight.
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            {/* Fixed Header */}
            <div className="flex-none p-6 md:p-8 border-b border-stone-100 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md z-10 flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-white uppercase tracking-tight leading-none">Curate<br />Adventure</h2>
                </div>
                {/* Close button not strictly needed if we have sidebar, but good for modal feel? 
                    Actually, if it's a page, maybe we don't need 'Close' since we have sidebar nav. 
                    But let's keep it consistent if user wants 'Back'. 
                    Wait, previous code had 'Back to Dashboard' AND 'Close'. 
                    I'll keep the logic simple: Just the title here. The inputs are below.
                */}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32 space-y-8 scroll-smooth">
                <div className="max-w-3xl mx-auto w-full pb-20 space-y-10">

                    {/* Location Selector */}
                    <section className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-sm flex items-center justify-between group hover:border-orange-500/30 transition-colors">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">Target City</label>
                            <input
                                className="text-2xl md:text-3xl font-black bg-transparent outline-none text-stone-900 dark:text-white placeholder-stone-300 w-full"
                                value={targetCity}
                                onChange={(e) => setTargetCity(e.target.value)}
                                placeholder="Where are you going?"
                            />
                        </div>
                        <Button
                            variant="ghost"
                            className="w-12 h-12 p-0 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/40"
                            onClick={handleDetectLocation}
                            isLoading={detectingLocation}
                            title="Use Current Location"
                        >
                            <LocateFixed className="w-6 h-6" />
                        </Button>
                    </section>

                    {/* Custom Name Input */}
                    <section>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">Trip Name (Optional)</label>
                        <input
                            className="w-full text-xl font-bold bg-transparent border-b-2 border-stone-200 focus:border-orange-500 outline-none py-3 text-stone-900 dark:text-white placeholder-stone-300 transition-colors"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="e.g. Birthday Bash 2024"
                        />
                    </section>

                    {/* Mood Selector */}
                    <section ref={moodSectionRef} className="space-y-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Vibe & Mood</label>
                        <div className="flex flex-wrap gap-3">
                            {optionsLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-12 w-28 bg-stone-200 dark:bg-neutral-800 rounded-full animate-pulse" />
                                ))
                            ) : (
                                moods.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMood(m)}
                                        className={`px-8 py-4 rounded-full text-base font-bold transition-all transform hover:scale-105 ${mood === m
                                            ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20 scale-105'
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
                    <section className="space-y-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Must Include (Select Multiple)</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {optionsLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-28 rounded-2xl bg-stone-200 dark:bg-neutral-800 animate-pulse" />
                                ))
                            ) : (
                                placeTypes.map((type) => {
                                    const isSelected = selectedTypes.includes(type.id);
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => toggleType(type.id)}
                                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3 h-32 ${isSelected
                                                ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 shadow-md'
                                                : 'border-stone-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-stone-500 hover:border-orange-300 dark:hover:border-orange-900/50'
                                                }`}
                                        >
                                            <type.icon className={`w-8 h-8 ${isSelected ? 'stroke-2' : 'stroke-1'}`} />
                                            <span className="text-sm font-bold">{type.label}</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    {/* Stop Count Slider */}
                    <section className="space-y-4 bg-stone-50 dark:bg-neutral-900/50 p-6 rounded-2xl border border-stone-100 dark:border-neutral-800">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Length of Trip</label>
                            <span className="text-sm font-black text-orange-600 dark:text-orange-400 bg-white dark:bg-orange-900/20 px-4 py-2 rounded-lg shadow-sm border border-stone-100 dark:border-none">{stopCount} Places</span>
                        </div>
                        <input
                            type="range"
                            min="2"
                            max="8"
                            value={stopCount}
                            onChange={(e) => setStopCount(parseInt(e.target.value))}
                            className="w-full h-3 bg-stone-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                        <div className="flex justify-between text-xs font-bold text-stone-400 pt-1">
                            <span>Quick Trip (2)</span>
                            <span>Full Day (8)</span>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="space-y-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Timeframe</label>
                            <div className="space-y-2">
                                {optionsLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-12 w-full bg-stone-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                                    ))
                                ) : (
                                    durations.map(d => (
                                        <button key={d} onClick={() => setDuration(d)} className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold border-2 transition-all ${duration === d ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : 'border-stone-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-stone-50'}`}>{d}</button>
                                    ))
                                )}
                            </div>
                        </section>
                        <section className="space-y-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Group Size</label>
                            <div className="space-y-2">
                                {optionsLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-12 w-full bg-stone-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                                    ))
                                ) : (
                                    groups.map(g => (
                                        <button key={g} onClick={() => setGroupSize(g)} className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold border-2 transition-all ${groupSize === g ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : 'border-stone-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-stone-50'}`}>{g}</button>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <section className="space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Price Point</label>
                        <div className="flex rounded-2xl bg-stone-100 dark:bg-neutral-900 p-1.5 border border-stone-200 dark:border-neutral-800">
                            {optionsLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex-1 h-12 m-1 bg-white/50 dark:bg-neutral-700/50 rounded-lg animate-pulse" />
                                ))
                            ) : (
                                budgets.map(b => (
                                    <button
                                        key={b}
                                        onClick={() => setBudget(b)}
                                        className={`flex-1 py-4 rounded-xl text-base font-black transition-all ${budget === b ? 'bg-white dark:bg-neutral-800 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                                    >
                                        {b}
                                    </button>
                                ))
                            )}
                        </div>
                    </section>

                    <div className="pt-8 sticky bottom-0 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent dark:from-neutral-950 dark:via-neutral-950 pb-6 -mx-4 px-4">
                        <Button
                            onClick={generateItinerary}
                            disabled={loading}
                            isLoading={loading}
                            className="w-full py-6 text-xl rounded-2xl shadow-xl shadow-orange-600/20"
                        >
                            {loading ? loadingStep : <><Sparkles className="w-5 h-5 mr-2" /> Generate Itinerary</>}
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

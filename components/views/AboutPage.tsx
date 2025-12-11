import React from 'react';
import { ChevronLeft, Map, Star, Zap, Calendar, Shuffle, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { PublicNavbar } from '../layout/PublicNavbar';
import { ViewState } from '../../types';

interface AboutPageProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
}

export const AboutPage = ({ onNavigate, onSignIn }: AboutPageProps) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex flex-col font-sans">
      <PublicNavbar onNavigate={onNavigate} onSignIn={onSignIn} />
      
      {/* Header */}
      <div className="pt-32 pb-12 px-6 flex-none">
        <div className="max-w-4xl mx-auto">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-16 hover:text-orange-600 dark:hover:text-orange-500 font-bold uppercase tracking-wider text-xs transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Home
            </button>
            <h1 className="text-5xl md:text-7xl font-black text-stone-900 dark:text-white mb-8 leading-tight tracking-tighter">
              WE CURATE THE <span className="text-orange-600">CHAOS.</span>
            </h1>
            <p className="text-xl md:text-2xl text-stone-600 dark:text-stone-300 leading-relaxed font-medium max-w-2xl">
                Pathfinder is the intelligent concierge for the modern urban explorer. We combine generative AI with real-world data to turn "I don't know, what do you want to do?" into an unforgettable night.
            </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 flex-grow w-full">
        
        {/* Section 1: Itinerary Management */}
        <div className="mb-32 flex flex-col md:flex-row gap-12 items-start">
            <div className="md:w-1/3 pt-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                    <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">Master Your Plan</h2>
            </div>
            <div className="md:w-2/3">
                <p className="text-lg text-stone-600 dark:text-stone-400 mb-8 leading-relaxed">
                    Planning shouldn't be painful. Pathfinder gives you a command center for your social life. It's not just a list; it's a dynamic agenda that adapts to you.
                </p>
                <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                        <div className="mt-1 p-1 bg-stone-200 dark:bg-neutral-800 rounded-full"><Shuffle className="w-4 h-4" /></div>
                        <div>
                            <strong className="block text-stone-900 dark:text-white mb-1">Drag, Drop, Remix</strong>
                            <span className="text-stone-500 dark:text-stone-400">Don't like the dinner spot? Ask the AI to swap it for tacos instantly.</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <div className="mt-1 p-1 bg-stone-200 dark:bg-neutral-800 rounded-full"><ShieldCheck className="w-4 h-4" /></div>
                        <div>
                            <strong className="block text-stone-900 dark:text-white mb-1">Offline Resilience</strong>
                            <span className="text-stone-500 dark:text-stone-400">Your plans are cached locally. No signal? No problem. We built this for the subway and the trail.</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        {/* Section 2: Fun Activities */}
        <div className="mb-32 flex flex-col md:flex-row gap-12 items-start border-t border-stone-200 dark:border-neutral-800 pt-20">
            <div className="md:w-1/3 pt-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-6">
                    <Zap className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">Curated for Fun</h2>
            </div>
            <div className="md:w-2/3">
                <p className="text-lg text-stone-600 dark:text-stone-400 mb-8 leading-relaxed">
                    We don't just find "places". We find experiences that match your specific mood and vibe. Whether you need a high-energy rave or a quiet bookstore, we categorize the city by <strong>Vibe</strong>, not just category.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200 dark:border-neutral-800">
                        <div className="text-orange-500 font-black text-xl mb-1">Nightlife</div>
                        <div className="text-xs text-stone-500 uppercase font-bold">Speakeasies to Rooftops</div>
                    </div>
                    <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200 dark:border-neutral-800">
                        <div className="text-purple-500 font-black text-xl mb-1">Culture</div>
                        <div className="text-xs text-stone-500 uppercase font-bold">Museums & Galleries</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Section 3: Origin Story */}
        <div className="bg-stone-900 text-white rounded-[3rem] p-10 md:p-16 relative overflow-hidden mb-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600 rounded-full blur-[120px] opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600 rounded-full blur-[100px] opacity-20"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-white/10">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Integrity
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">Inspired by the Yelp Hackathon</h2>
                <p className="text-lg text-stone-300 mb-12 leading-relaxed">
                    Pathfinder was born from a simple realization during the Yelp Fusion Hackathon: 
                    <br/><br/>
                    <strong className="text-white">AI hallucinates, but data doesn't.</strong>
                    <br/><br/>
                    We built a hybrid engine. Google's Gemini provides the "Vibe" and creativity, while the Yelp Fusion API provides the "Truth"—verifying open hours, ratings, and existence in real-time.
                </p>
                <div className="flex justify-center">
                    <Button onClick={() => onNavigate('create')} className="bg-white text-stone-900 hover:bg-stone-200 w-auto px-10">Start Your Journey</Button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
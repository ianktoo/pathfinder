import React from 'react';
import { ChevronRight, Map, Star, Zap, Calendar, Shuffle, ShieldCheck } from 'lucide-react';
import { PublicNavbar } from '../layout/PublicNavbar';
import { ViewState } from '../../types';

interface AboutPageProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
}

export const AboutPage = ({ onNavigate, onSignIn }: AboutPageProps) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950">
      <PublicNavbar onNavigate={onNavigate} onSignIn={onSignIn} />
      
      {/* Breadcrumb / Header */}
      <div className="pt-32 pb-12 px-6 bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">
                <span className="cursor-pointer hover:text-orange-600" onClick={() => onNavigate('home')}>Home</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-stone-900 dark:text-white">About Us</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-stone-900 dark:text-white mb-6 leading-tight">
                WE CURATE THE <span className="text-orange-600">CHAOS.</span>
            </h1>
            <p className="text-xl text-stone-600 dark:text-stone-300 max-w-2xl font-medium leading-relaxed">
                Pathfinder is the intelligent concierge for the modern urban explorer. We combine generative AI with real-world data to turn "I don't know, what do you want to do?" into an unforgettable night.
            </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        
        {/* Section 1: Itinerary Management */}
        <div className="mb-32">
            <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1">
                    <div className="inline-block p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-stone-900 dark:text-white mb-4">Master Your Itinerary</h2>
                    <p className="text-lg text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
                        Planning shouldn't be painful. Pathfinder gives you a command center for your social life.
                    </p>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <div className="mt-1 bg-stone-200 dark:bg-neutral-800 p-1 rounded-full"><ChevronRight className="w-3 h-3" /></div>
                            <span className="font-bold text-stone-700 dark:text-stone-300">Drag, Drop, Remix:</span> 
                            <span className="text-stone-500 ml-1">Don't like the dinner spot? Ask the AI to swap it for tacos instantly.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="mt-1 bg-stone-200 dark:bg-neutral-800 p-1 rounded-full"><ChevronRight className="w-3 h-3" /></div>
                            <span className="font-bold text-stone-700 dark:text-stone-300">Offline Resilience:</span> 
                            <span className="text-stone-500 ml-1">Your plans are cached locally. No signal? No problem.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="mt-1 bg-stone-200 dark:bg-neutral-800 p-1 rounded-full"><ChevronRight className="w-3 h-3" /></div>
                            <span className="font-bold text-stone-700 dark:text-stone-300">Social Export:</span> 
                            <span className="text-stone-500 ml-1">Turn your plan into a beautiful story card for Instagram or TikTok in one click.</span>
                        </li>
                    </ul>
                </div>
                <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-3xl transform rotate-3 opacity-20 blur-xl"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1000&auto=format&fit=crop" 
                        alt="Planning" 
                        className="relative rounded-3xl shadow-2xl border-4 border-white dark:border-neutral-800 w-full object-cover h-96"
                    />
                </div>
            </div>
        </div>

        {/* Section 2: Fun Activities */}
        <div className="mb-32">
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
                <div className="flex-1">
                    <div className="inline-block p-3 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mb-6">
                        <Zap className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-stone-900 dark:text-white mb-4">Curated for Fun</h2>
                    <p className="text-lg text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
                        We don't just find "places". We find experiences that match your specific mood and vibe.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800">
                            <div className="text-orange-500 font-black text-xl mb-1">Nightlife</div>
                            <div className="text-xs text-stone-500">Speakeasies to Rooftops</div>
                        </div>
                        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800">
                            <div className="text-green-500 font-black text-xl mb-1">Nature</div>
                            <div className="text-xs text-stone-500">Urban Parks & Hikes</div>
                        </div>
                        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800">
                            <div className="text-purple-500 font-black text-xl mb-1">Culture</div>
                            <div className="text-xs text-stone-500">Museums & Galleries</div>
                        </div>
                        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800">
                            <div className="text-red-500 font-black text-xl mb-1">Foodie</div>
                            <div className="text-xs text-stone-500">Michelin to Street Food</div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-tl from-yellow-500 to-orange-500 rounded-3xl transform -rotate-3 opacity-20 blur-xl"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1000&auto=format&fit=crop" 
                        alt="Fun Activities" 
                        className="relative rounded-3xl shadow-2xl border-4 border-white dark:border-neutral-800 w-full object-cover h-96"
                    />
                </div>
            </div>
        </div>

        {/* Section 3: Yelp Origin Story */}
        <div className="bg-stone-900 text-white rounded-[3rem] p-8 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full blur-[100px] opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600 rounded-full blur-[100px] opacity-20"></div>
            
            <div className="relative z-10 text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-white/10">
                    <ShieldCheck className="w-4 h-4" />
                    Verified Integrity
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-6">Inspired by the Yelp Hackathon</h2>
                <p className="text-lg md:text-xl text-stone-300 mb-10 leading-relaxed">
                    Pathfinder was born from a simple realization during the Yelp Fusion Hackathon: 
                    <strong> AI hallucinates, but data doesn't.</strong>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <h3 className="font-bold text-xl mb-2 text-red-400">The Problem</h3>
                        <p className="text-stone-400 text-sm">LLMs are great at creativity but terrible at facts. They invent restaurants that closed 3 years ago or suggest sushi places for breakfast.</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <h3 className="font-bold text-xl mb-2 text-green-400">The Solution</h3>
                        <p className="text-stone-400 text-sm">We built a hybrid engine. Google's Gemini provides the "Vibe", while the Yelp Fusion API provides the "Truth"—verifying open hours, ratings, and existence in real-time.</p>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
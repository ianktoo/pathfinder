import React from 'react';
import { Flame, ArrowRight, Cpu, Star, WifiOff, Menu, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { ViewState } from '../../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onNavigate: (view: ViewState) => void;
}

export const LandingPage = ({ onGetStarted, onNavigate }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex flex-col transition-colors duration-200">
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-stone-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 text-orange-600">
            <Flame className="w-8 h-8 fill-orange-600" />
            <span className="font-black text-2xl tracking-tighter text-stone-900 dark:text-white">PATHFINDER</span>
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <button onClick={() => onNavigate('about')} className="text-sm font-bold text-stone-600 hover:text-orange-600 dark:text-stone-300 transition-colors">About</button>
            <button onClick={() => onNavigate('privacy')} className="text-sm font-bold text-stone-600 hover:text-orange-600 dark:text-stone-300 transition-colors">Privacy</button>
            <button onClick={onGetStarted} className="bg-stone-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-orange-600 transition-colors dark:bg-white dark:text-stone-900 dark:hover:bg-orange-500 dark:hover:text-white">
              Sign In
            </button>
          </div>
          <button onClick={onGetStarted} className="md:hidden text-stone-900 dark:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop" 
            alt="City Nightlife" 
            className="w-full h-full object-cover opacity-10 dark:opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-50/80 to-stone-50 dark:via-neutral-950/80 dark:to-neutral-950"></div>
        </div>

        <main className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-stone-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-8 shadow-lg shadow-yellow-400/20 transform rotate-1">
            <Zap className="w-4 h-4 fill-stone-900" />
            Hackathon Winner
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-stone-900 dark:text-white mb-8 leading-[0.9] tracking-tight">
            IGNITE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">NIGHT OUT.</span>
          </h1>
          <p className="text-xl md:text-2xl text-stone-600 dark:text-stone-300 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Stop searching, start exploring. AI-curated itineraries powered by local data, verified for quality, and built for the bold.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
            <Button onClick={onGetStarted} icon={ArrowRight} className="h-14 text-lg">Start Adventure</Button>
          </div>
        </main>
      </div>

      <section className="px-6 py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 bg-stone-50 dark:bg-neutral-800 rounded-3xl border-2 border-transparent hover:border-orange-500 transition-all hover:shadow-2xl hover:shadow-orange-500/10">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-3">Hyper-Local AI</h3>
              <p className="text-stone-500 dark:text-stone-400 font-medium">
                Our engine doesn't just list places; it crafts a narrative. Based on your mood, budget, and vibe.
              </p>
            </div>
            <div className="group p-8 bg-stone-50 dark:bg-neutral-800 rounded-3xl border-2 border-transparent hover:border-orange-500 transition-all hover:shadow-2xl hover:shadow-orange-500/10">
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-500 mb-6 group-hover:scale-110 transition-transform">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-3">Yelp Intelligence</h3>
              <p className="text-stone-500 dark:text-stone-400 font-medium">
                We verify every spot against the Yelp API to ensure open hours, high ratings, and correct pricing.
              </p>
            </div>
            <div className="group p-8 bg-stone-50 dark:bg-neutral-800 rounded-3xl border-2 border-transparent hover:border-orange-500 transition-all hover:shadow-2xl hover:shadow-orange-500/10">
              <div className="w-14 h-14 bg-stone-200 dark:bg-neutral-700 rounded-2xl flex items-center justify-center text-stone-600 dark:text-stone-300 mb-6 group-hover:scale-110 transition-transform">
                <WifiOff className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-3">Offline Resilient</h3>
              <p className="text-stone-500 dark:text-stone-400 font-medium">
                Subway tunnel? Remote hike? Your itinerary is cached locally so the adventure never stops.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-stone-100 dark:bg-neutral-950 border-t border-stone-200 dark:border-neutral-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-stone-900 dark:text-white">
            <Flame className="w-6 h-6 text-orange-600" />
            <span className="font-black text-xl tracking-tighter">PATHFINDER</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-stone-500 dark:text-stone-400">
            <button onClick={() => onNavigate('about')} className="hover:text-orange-600 transition-colors">About</button>
            <button onClick={() => onNavigate('privacy')} className="hover:text-orange-600 transition-colors">Privacy Policy</button>
            <a href="#" className="hover:text-orange-600 transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

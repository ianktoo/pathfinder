import React, { useEffect, useState } from 'react';
import { Flame, ArrowRight, Cpu, Star, WifiOff, Menu, Zap, MapPin, Clock, User, Heart } from 'lucide-react';
import { Button } from '../ui/button';
import { ViewState, Itinerary } from '../../types';
import { PublicNavbar } from '../layout/PublicNavbar';
import { BackendService } from '../../services/storage';

interface LandingPageProps {
  onGetStarted: () => void;
  onNavigate: (view: ViewState) => void;
}

export const LandingPage = ({ onGetStarted, onNavigate }: LandingPageProps) => {
  const [featured, setFeatured] = useState<Itinerary[]>([]);

  useEffect(() => {
    const loadFeatured = async () => {
        const data = await BackendService.getCommunityItineraries();
        setFeatured(data.slice(0, 3));
    };
    loadFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex flex-col transition-colors duration-200 font-sans selection:bg-orange-500 selection:text-white">
      {/* Navigation */}
      <PublicNavbar onNavigate={onNavigate} onSignIn={onGetStarted} transparent={true} />

      {/* Hero Section */}
      <div className="relative pt-40 pb-32 lg:pt-64 lg:pb-48 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop" 
            alt="City Nightlife" 
            className="w-full h-full object-cover opacity-[0.03] dark:opacity-[0.15] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-50/90 to-stone-50 dark:via-neutral-950/90 dark:to-neutral-950"></div>
        </div>

        <main className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 text-yellow-600 dark:text-yellow-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-10 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap className="w-3 h-3 fill-current" />
            Yelp Hackathon Winner
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-stone-900 dark:text-white mb-10 leading-[0.85] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            IGNITE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-500 dark:from-orange-500 dark:to-yellow-400">NIGHT OUT.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-stone-600 dark:text-stone-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Stop searching, start exploring. AI-curated itineraries powered by verified local data, built for the bold.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <button 
                onClick={onGetStarted} 
                className="w-full sm:w-auto h-14 px-8 rounded-full bg-orange-600 text-white font-bold text-lg hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 group"
            >
                Start Adventure <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
                onClick={() => onNavigate('about')}
                className="w-full sm:w-auto h-14 px-8 rounded-full border-2 border-stone-200 dark:border-neutral-800 text-stone-600 dark:text-stone-300 font-bold text-lg hover:border-stone-900 dark:hover:border-white hover:text-stone-900 dark:hover:text-white transition-all bg-transparent"
            >
                Learn More
            </button>
          </div>
        </main>
      </div>

      {/* Featured Itineraries (Negative Space Emphasis) */}
      <section className="px-6 py-32 bg-stone-100 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div>
                    <h2 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">Trending Now</h2>
                    <p className="text-stone-500 dark:text-stone-400 text-lg max-w-md">See what the community is exploring this weekend.</p>
                </div>
                <button onClick={() => onNavigate('community')} className="text-orange-600 font-bold uppercase tracking-wider text-sm hover:text-orange-500 flex items-center gap-2">
                    View All <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featured.map((it) => (
                    <div key={it.id} className="group cursor-pointer" onClick={() => onNavigate('community')}>
                        <div className="relative h-[400px] mb-6 overflow-hidden rounded-3xl">
                            <img 
                                src={it.items[0]?.imageUrl || `https://source.unsplash.com/random/800x1200?${it.mood}`} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                alt={it.title}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                            
                            <div className="absolute top-6 left-6">
                                <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                    {it.mood}
                                </span>
                            </div>

                            <div className="absolute bottom-6 left-6 right-6">
                                <h3 className="text-2xl font-black text-white leading-tight mb-2 group-hover:underline decoration-orange-500 underline-offset-4">{it.title}</h3>
                                <div className="flex items-center gap-4 text-white/80 text-sm font-bold">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-orange-500" />
                                        <span>{it.tags[2] || 'Full Day'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-orange-500" />
                                        <span>{it.items.length} Stops</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-black text-stone-500">
                                    {it.author ? it.author[0] : 'P'}
                                </div>
                                <span className="text-sm font-bold text-stone-600 dark:text-stone-400">{it.author || 'Pathfinder'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-stone-400">
                                <Heart className="w-4 h-4 fill-stone-300 dark:fill-neutral-700" /> {it.likes || 0}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-32 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            <div className="group">
              <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/10 rounded-3xl flex items-center justify-center text-orange-600 dark:text-orange-500 mb-8 group-hover:scale-110 transition-transform duration-300">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">Hyper-Local AI</h3>
              <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed">
                Our engine doesn't just list places; it crafts a narrative based on your mood, budget, and real-time vibe.
              </p>
            </div>
            <div className="group">
              <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/10 rounded-3xl flex items-center justify-center text-yellow-600 dark:text-yellow-500 mb-8 group-hover:scale-110 transition-transform duration-300">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">Yelp Intelligence</h3>
              <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed">
                We verify every spot against the Yelp API to ensure open hours, high ratings, and correct pricing.
              </p>
            </div>
            <div className="group">
              <div className="w-16 h-16 bg-stone-100 dark:bg-neutral-900 rounded-3xl flex items-center justify-center text-stone-600 dark:text-stone-300 mb-8 group-hover:scale-110 transition-transform duration-300">
                <WifiOff className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">Offline Resilient</h3>
              <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed">
                Subway tunnel? Remote hike? Your itinerary is cached locally so the adventure never stops.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-stone-50 dark:bg-neutral-950 border-t border-stone-200 dark:border-neutral-900 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2 text-stone-900 dark:text-white">
            <Flame className="w-8 h-8 text-orange-600" />
            <span className="font-black text-2xl tracking-tighter">PATHFINDER</span>
          </div>
          <div className="flex gap-10 text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">
            <button onClick={() => onNavigate('about')} className="hover:text-orange-600 transition-colors">About</button>
            <button onClick={() => onNavigate('privacy')} className="hover:text-orange-600 transition-colors">Privacy</button>
            <a href="#" className="hover:text-orange-600 transition-colors">Instagram</a>
          </div>
          <p className="text-stone-400 text-xs font-bold">
            © 2024 Pathfinder Inc.
          </p>
        </div>
      </footer>
    </div>
  );
};
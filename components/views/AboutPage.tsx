import React from 'react';
import { ChevronLeft } from 'lucide-react';

export const AboutPage = ({ onBack }: { onBack: () => void }) => (
  <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 p-6 flex flex-col items-center">
    <div className="w-full max-w-3xl">
      <button onClick={onBack} className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-12 hover:text-orange-600 dark:hover:text-orange-500 font-bold transition-colors">
        <ChevronLeft className="w-5 h-5" /> Back to Home
      </button>
      
      <div>
        <h1 className="text-4xl md:text-6xl font-black text-stone-900 dark:text-white mb-8">
          BUILT FOR THE <span className="text-orange-600">BOLD.</span>
        </h1>
        
        <div className="prose prose-lg prose-stone dark:prose-invert">
          <p className="text-xl font-medium leading-relaxed">
            Pathfinder isn't just a map. It's a decision engine. We built this platform for the urban explorer who hates the question "What should we do tonight?"
          </p>
          
          <img src="https://images.unsplash.com/photo-1527631746610-bca5439511b3?q=80&w=2070&auto=format&fit=crop" className="w-full h-64 object-cover rounded-3xl my-8 grayscale hover:grayscale-0 transition-all duration-500" alt="Adventure" />

          <h3>The Technology</h3>
          <p>
            We leverage <strong>Google's Gemini 2.5 Flash</strong> and <strong>Gemini 3.0 Pro</strong> to understand context, nuance, and vibe. We combine this generative power with structured data from the <strong>Yelp Fusion API</strong> to ensure that every recommendation is currently open, highly rated, and fits your budget.
          </p>
          
          <h3>Resilience First</h3>
          <p>
            Adventures don't always happen where the wifi is strong. Pathfinder is built as a "Local-First" web application. Once your itinerary is loaded, it's yours. Forever. No signal required.
          </p>
        </div>
      </div>
    </div>
  </div>
);

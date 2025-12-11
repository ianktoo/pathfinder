import React from 'react';
import { ChevronRight } from 'lucide-react';
import { PublicNavbar } from '../layout/PublicNavbar';
import { ViewState } from '../../types';

interface PrivacyPageProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
}

export const PrivacyPage = ({ onNavigate, onSignIn }: PrivacyPageProps) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex flex-col">
      <PublicNavbar onNavigate={onNavigate} onSignIn={onSignIn} />

      <div className="pt-32 pb-12 px-6 bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">
                <span className="cursor-pointer hover:text-orange-600" onClick={() => onNavigate('home')}>Home</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-stone-900 dark:text-white">Privacy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-6">
                DATA & PRIVACY
            </h1>
            <p className="text-xl text-stone-600 dark:text-stone-300 max-w-2xl font-medium">
                We believe in radical transparency. Here is exactly how your data is handled, stored, and protected.
            </p>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-sm border border-stone-200 dark:border-neutral-800 space-y-8">
            <section>
                <h2 className="text-xl font-black text-stone-900 dark:text-white mb-4">1. Data Collection</h2>
                <ul className="list-disc pl-5 space-y-2 text-stone-600 dark:text-stone-400 leading-relaxed">
                    <li><strong>Location Data:</strong> Used strictly to query venues near you via the Location API. Coordinates are sent to OpenStreetMap for reverse geocoding and to our AI service to generate context. We do not store historical location traces.</li>
                    <li><strong>Preferences:</strong> Your "Moods", "Vibes", and "Interests" are stored locally on your device via `localStorage` and synced to Supabase if you create an account.</li>
                    <li><strong>Auth Data:</strong> We use Supabase Auth for secure login. We only store your email and an encrypted password hash.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-black text-stone-900 dark:text-white mb-4">2. AI & Third Parties</h2>
                <ul className="list-disc pl-5 space-y-2 text-stone-600 dark:text-stone-400 leading-relaxed">
                    <li><strong>Google Gemini:</strong> Your itinerary prompts are sent to Google's Gemini API for processing. We do not allow your data to be used to train their models.</li>
                    <li><strong>Yelp Fusion:</strong> We verify business details against the Yelp public API. No personal user data is shared with Yelp.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-black text-stone-900 dark:text-white mb-4">3. Data Deletion</h2>
                <p className="text-stone-600 dark:text-stone-400">
                    You have the right to be forgotten. You can delete your account and all associated data instantly from the "Profile & Settings" page within the application. This action wipes your database records and clears your local cache.
                </p>
            </section>
        </div>
      </div>
    </div>
  );
};
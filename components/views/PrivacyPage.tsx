import React from 'react';
import { ChevronLeft } from 'lucide-react';

export const PrivacyPage = ({ onBack }: { onBack: () => void }) => (
  <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 p-6 flex flex-col items-center">
    <div className="w-full max-w-3xl">
      <button onClick={onBack} className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-12 hover:text-orange-600 dark:hover:text-orange-500 font-bold transition-colors">
        <ChevronLeft className="w-5 h-5" /> Back to Home
      </button>
      
      <h1 className="text-4xl font-black text-stone-900 dark:text-white mb-8">Data & Privacy</h1>
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-sm border border-stone-200 dark:border-neutral-800 space-y-6">
        <p className="text-stone-600 dark:text-stone-300">
          We believe in transparency. Here is exactly how your data is handled.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-stone-600 dark:text-stone-400">
            <li><strong>Location Data:</strong> Used only to query venues near you. Not stored on our servers.</li>
            <li><strong>Preferences:</strong> Stored locally on your device (localStorage).</li>
            <li><strong>AI Processing:</strong> Your prompts are sent to Google Gemini for processing but are not used to train their models in this context.</li>
            <li><strong>Yelp Data:</strong> We access public business information to verify venues.</li>
        </ul>
      </div>
    </div>
  </div>
);

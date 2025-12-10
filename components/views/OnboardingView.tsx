import React, { useState } from 'react';
import { MapPin, Coffee, Star, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { UserProfile } from '../../types';

export const OnboardingView = ({ onComplete }: { onComplete: (profile: UserProfile) => void }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [personality, setPersonality] = useState<UserProfile['personality']>('Chill');

  const personalities = [
    { id: 'Adventurous', icon: MapPin, desc: 'Exploration & Hidden Gems' },
    { id: 'Chill', icon: Coffee, desc: 'Relaxed vibes & Comfort' },
    { id: 'Foodie', icon: Star, desc: 'Culinary experiences' },
    { id: 'Party', icon: Moon, desc: 'Nightlife & Socializing' },
  ];

  const handleNext = () => {
    if (step === 1 && name && city) setStep(2);
    else if (step === 2) onComplete({ name, email: '', city, personality });
  };

  return (
    <div className="min-h-screen p-6 bg-stone-50 dark:bg-neutral-950 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex gap-2 mb-10">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-orange-600' : 'bg-stone-200 dark:bg-neutral-800'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-orange-600' : 'bg-stone-200 dark:bg-neutral-800'}`} />
        </div>

        {step === 1 ? (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300">
            <h2 className="text-3xl font-black mb-2 text-stone-900 dark:text-white uppercase">Who are you?</h2>
            <p className="text-stone-500 dark:text-stone-400 mb-8 font-medium">Let's get the basics down.</p>
            <Input label="First Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Indiana" />
            <Input label="Base City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Chicago, IL" />
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300">
            <h2 className="text-3xl font-black mb-2 text-stone-900 dark:text-white uppercase">Your Vibe?</h2>
            <p className="text-stone-500 dark:text-stone-400 mb-8 font-medium">This shapes our recommendations.</p>
            <div className="grid grid-cols-1 gap-4">
              {personalities.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersonality(p.id as any)}
                  className={`p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${
                    personality === p.id 
                      ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/10' 
                      : 'border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-300'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${personality === p.id ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-stone-100 text-stone-500 dark:bg-neutral-800'}`}>
                    <p.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 dark:text-white text-lg">{p.id}</div>
                    <div className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">{p.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8">
          <Button onClick={handleNext}>Continue</Button>
        </div>
      </div>
    </div>
  );
};

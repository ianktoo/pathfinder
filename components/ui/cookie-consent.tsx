
import React, { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import { Button } from './button';

export const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setTimeout(() => setShow(true), 1000); // Delay for animation effect
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="max-w-4xl mx-auto bg-stone-900 text-white p-6 rounded-3xl shadow-2xl border border-stone-800 flex flex-col md:flex-row items-center gap-6">
        <div className="p-3 bg-stone-800 rounded-2xl">
            <Cookie className="w-8 h-8 text-orange-500" />
        </div>
        <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-black mb-1">We Bake Cookies 🍪</h3>
            <p className="text-sm text-stone-300">
                We use local storage cookies to save your itineraries and preferences offline. 
                No tracking ads, just pure functionality.
            </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <Button onClick={handleAccept} className="bg-white text-stone-900 hover:bg-stone-200">
                Sounds Good
            </Button>
        </div>
      </div>
    </div>
  );
};

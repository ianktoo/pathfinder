import React, { useState } from 'react';
import { ChevronLeft, Flame } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { UserProfile } from '../../types';

interface AuthViewProps {
  onLogin: (user: Partial<UserProfile>) => void;
  onBack: () => void;
}

export const AuthView = ({ onLogin, onBack }: AuthViewProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ email });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-stone-50 dark:bg-neutral-950">
      <div className="w-full max-w-md mx-auto relative">
        <button onClick={onBack} className="absolute -top-24 left-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="mb-10 text-center">
          <Flame className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight uppercase">Welcome Back</h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium">Your next journey begins here.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="explorer@example.com"
          />
          <Input 
            label="Password" 
            type="password" 
            value="password" 
            onChange={() => {}} 
            placeholder="••••••••"
          />
          <div className="pt-4">
             <Button onClick={handleSubmit}>{isLogin ? 'Sign In' : 'Join the Club'}</Button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-stone-500 hover:text-orange-600 dark:text-stone-400 dark:hover:text-orange-400 font-bold"
          >
            {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

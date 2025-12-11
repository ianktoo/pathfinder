import React, { useState } from 'react';
import { ChevronLeft, Flame, Mail, Lock, KeyRound, ArrowRight, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { UserProfile } from '../../types';
import { useToast } from '../ui/toast';
import { AuthService } from '../../services/auth';
import { isSupabaseConfigured } from '../../services/supabaseClient';

interface AuthViewProps {
  onLogin: (user: Partial<UserProfile>) => void;
  onBack: () => void;
}

type AuthMode = 'login' | 'register' | 'otp' | 'reset';

export const AuthView = ({ onLogin, onBack }: AuthViewProps) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Config Check
    if (!isSupabaseConfigured()) {
        showToast('System Error: Backend not connected. Please check .env configuration.', 'error');
        console.error("Supabase keys are missing.");
        return;
    }

    if (!email) {
        showToast('Please enter your email address', 'error');
        return;
    }

    setIsLoading(true);

    try {
        if (mode === 'reset') {
            await AuthService.resetPasswordForEmail(email);
            showToast('Password reset link sent to your email!', 'success');
            setMode('login');
        } else if (mode === 'otp') {
            await AuthService.signInWithOtp(email);
            showToast('Magic link sent! Check your inbox to sign in.', 'success');
        } else if (mode === 'register') {
            const { user } = await AuthService.signUp(email, password, name);
            if (user && !user.email_confirmed_at) {
                showToast('Account created! Please confirm your email.', 'info');
            } else {
                showToast('Welcome to Pathfinder!', 'success');
                onLogin(AuthService.mapUserToProfile(user));
            }
        } else {
            // Login
            const { user } = await AuthService.signInWithPassword(email, password);
            if (user) {
                showToast(`Welcome back!`, 'success');
                onLogin(AuthService.mapUserToProfile(user));
            }
        }
    } catch (error: any) {
        console.error("Auth Error:", error);
        // Supabase error messages are usually descriptive
        showToast(error.message || 'Authentication failed. Please try again.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  if (!isSupabaseConfigured()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-neutral-950 p-6">
            <div className="max-w-md w-full bg-white dark:bg-neutral-900 p-8 rounded-3xl border-2 border-red-100 dark:border-red-900/30 text-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <Info className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-stone-900 dark:text-white mb-2">Backend Connection Missing</h2>
                <p className="text-stone-500 dark:text-stone-400 mb-6 text-sm">
                    The application cannot connect to Supabase. Please ensure your <code>.env</code> file contains the correct <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong>.
                </p>
                <Button onClick={onBack} variant="outline">Go Back Home</Button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-stone-50 dark:bg-neutral-950">
      <div className="w-full max-w-md mx-auto relative animate-in zoom-in-95 duration-300">
        <button onClick={onBack} className="absolute -top-24 left-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>

        <div className="mb-10 text-center">
          <div className="inline-block p-4 rounded-full bg-orange-100 dark:bg-orange-900/20 mb-6">
            <Flame className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight uppercase mb-2">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Start Exploring'}
            {mode === 'otp' && 'Magic Login'}
            {mode === 'reset' && 'Reset Password'}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium">
            {mode === 'login' && 'Your next adventure is waiting.'}
            {mode === 'register' && 'Join the community of travelers.'}
            {mode === 'otp' && 'We\'ll email you a one-time link.'}
            {mode === 'reset' && 'Don\'t worry, happens to the best of us.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'register' && (
             <div className="animate-in slide-in-from-top-2 fade-in">
                <Input 
                    label="Full Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Indiana Jones"
                    required
                />
             </div>
          )}

          <Input 
            label="Email Address" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="explorer@example.com"
            required
          />
          
          {(mode === 'login' || mode === 'register') && (
              <div className="animate-in slide-in-from-top-2 fade-in">
                <Input 
                    label="Password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    required
                />
              </div>
          )}

          <div className="pt-2">
             <Button isLoading={isLoading} onClick={handleSubmit}>
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'otp' && 'Send Magic Link'}
                {mode === 'reset' && 'Send Reset Link'}
             </Button>
          </div>
        </form>

        <div className="mt-8 space-y-4 text-center">
            {mode === 'login' && (
                <>
                    <div className="flex justify-between text-sm font-bold text-stone-500">
                        <button onClick={() => setMode('otp')} className="hover:text-orange-600 transition-colors">Use Magic Code</button>
                        <button onClick={() => setMode('reset')} className="hover:text-orange-600 transition-colors">Forgot Password?</button>
                    </div>
                    <div className="border-t border-stone-200 dark:border-neutral-800 pt-6">
                        <p className="text-sm text-stone-400 mb-2">New here?</p>
                        <button onClick={() => setMode('register')} className="text-orange-600 font-black hover:underline">Create an Account</button>
                    </div>
                </>
            )}

            {(mode === 'otp' || mode === 'reset' || mode === 'register') && (
                <button 
                    onClick={() => setMode('login')} 
                    className="text-sm font-bold text-stone-500 hover:text-orange-600 flex items-center justify-center gap-2 w-full"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Login
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

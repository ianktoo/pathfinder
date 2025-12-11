import React from 'react';
import { Flame, Menu } from 'lucide-react';
import { ViewState } from '../../types';
import { ThemeToggle } from '../ui/theme-toggle';

interface PublicNavbarProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
  transparent?: boolean;
}

export const PublicNavbar = ({ onNavigate, onSignIn, transparent = false }: PublicNavbarProps) => {
  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${transparent ? 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-transparent' : 'bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        {/* Logo */}
        <div 
            className="flex items-center gap-2 text-orange-600 cursor-pointer"
            onClick={() => onNavigate('home')}
        >
          <Flame className="w-8 h-8 fill-orange-600" />
          <span className="font-black text-2xl tracking-tighter text-stone-900 dark:text-white">PATHFINDER</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => onNavigate('about')} className="text-sm font-bold text-stone-600 hover:text-orange-600 dark:text-stone-300 transition-colors">
            About
          </button>
          <button onClick={() => onNavigate('privacy')} className="text-sm font-bold text-stone-600 hover:text-orange-600 dark:text-stone-300 transition-colors">
            Privacy
          </button>
          
          <div className="h-6 w-px bg-stone-300 dark:bg-neutral-700 mx-2"></div>
          
          <ThemeToggle />
          
          <button 
            onClick={onSignIn} 
            className="bg-stone-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-orange-600 transition-colors dark:bg-white dark:text-stone-900 dark:hover:bg-orange-500 dark:hover:text-white shadow-lg shadow-orange-500/10"
          >
            Sign In
          </button>
        </div>

        {/* Mobile Toggle (Simple) */}
        <div className="flex md:hidden items-center gap-4">
            <ThemeToggle />
            <button onClick={onSignIn} className="text-stone-900 dark:text-white">
                <Menu className="w-6 h-6" />
            </button>
        </div>
      </div>
    </nav>
  );
};
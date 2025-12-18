import React from 'react';
import { Flame } from 'lucide-react';
import { ViewState } from '../../types';

interface FooterProps {
    onNavigate: (view: ViewState) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
    return (
        <footer className="bg-stone-50 dark:bg-neutral-950 border-t border-stone-200 dark:border-neutral-900 py-20 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex items-center gap-2 text-stone-900 dark:text-white cursor-pointer" onClick={() => onNavigate('home')}>
                    <Flame className="w-8 h-8 text-orange-600" />
                    <span className="font-black text-2xl tracking-tighter">PATHFINDER</span>
                </div>
                <div className="flex gap-10 text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">
                    <button onClick={() => onNavigate('about')} className="hover:text-orange-600 transition-colors">About</button>
                    <button onClick={() => onNavigate('privacy')} className="hover:text-orange-600 transition-colors">Privacy</button>
                    <a href="https://github.com/iankt/pathfinder" className="hover:text-orange-600 transition-colors">Github</a>
                </div>
                <p className="text-stone-400 text-xs font-bold">
                    © 2025 Pathfinder Inc. | Made for Humans
                </p>
            </div>
        </footer>
    );
};

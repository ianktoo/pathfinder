import React, { useEffect, useState } from 'react';
import { LogOut, X } from 'lucide-react';

interface SignOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const SignOutModal = ({ isOpen, onClose, onConfirm }: SignOutModalProps) => {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (!isOpen) {
            setCountdown(5);
            return;
        }

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onConfirm();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm border border-stone-200 dark:border-neutral-800 p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">

                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6 text-red-600 dark:text-red-500 relative">
                    <LogOut className="w-8 h-8" />
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-red-200 dark:text-red-900/30"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray="176"
                            strokeDashoffset={176 - (176 * (5 - countdown)) / 5}
                            className="text-red-600 dark:text-red-500 transition-all duration-1000 ease-linear"
                        />
                    </svg>
                </div>

                <h2 className="text-xl font-black text-stone-900 dark:text-white mb-2 uppercase tracking-tight">
                    Signing Out...
                </h2>

                <p className="text-stone-500 dark:text-stone-400 font-medium mb-8">
                    See you on your next adventure in <span className="text-stone-900 dark:text-white font-bold text-lg inline-block w-4">{countdown}</span> seconds.
                </p>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-stone-900 dark:text-white rounded-xl font-bold transition-colors"
                    >
                        Stay Logged In
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full py-3 px-4 text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400 font-bold text-sm transition-colors"
                    >
                        Sign Out Immediately
                    </button>
                </div>
            </div>
        </div>
    );
};

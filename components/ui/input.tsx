import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = ({ label, className, ...props }: InputProps) => (
  <div className="mb-4">
    {label && (
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
        {label}
      </label>
    )}
    <input
      className={cn(
        "w-full px-4 py-3.5 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-stone-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-all placeholder-stone-400 dark:placeholder-neutral-500 font-medium",
        className
      )}
      {...props}
    />
  </div>
);

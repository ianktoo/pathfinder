import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
  isLoading?: boolean;
  children?: React.ReactNode;
  // Explicitly defining standard props
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  title?: string;
}

export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  isLoading,
  disabled,
  ...props
}: ButtonProps) => {
  const styles = {
    primary: "bg-orange-600 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 hover:shadow-orange-500/40 active:scale-95",
    secondary: "bg-white text-stone-800 border-2 border-stone-200 hover:border-orange-500 hover:text-orange-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:border-orange-500",
    ghost: "bg-transparent text-stone-500 hover:text-orange-600 hover:bg-orange-50 dark:text-stone-400 dark:hover:text-orange-400 dark:hover:bg-neutral-800",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400",
    outline: "border border-stone-300 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-stone-700 dark:text-stone-300"
  };

  const sizes = {
    sm: "py-2 px-4 text-xs h-9",
    md: "py-3.5 px-6 text-sm",
    lg: "py-4 px-8 text-base"
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "w-full rounded-xl font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed",
        styles[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (Icon && <Icon className="w-5 h-5" />)}
      {children}
    </button>
  );
};
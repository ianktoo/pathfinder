import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'outline' | 'yelp';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className, ...props }: BadgeProps) => {
  const styles = {
    default: "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
    success: "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    outline: "border border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-400",
    yelp: "bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900"
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider", styles[variant], className)} {...props}>
      {children}
    </span>
  );
};
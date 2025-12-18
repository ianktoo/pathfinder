import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getIsDev = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.DEV;
    }
  } catch (error) {
    // Ignore errors accessing import.meta
  }
  
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development';
    }
  } catch (error) {
    // Ignore errors accessing process
  }

  return false;
};

export const isDev = getIsDev();

export const logError = (...args: any[]) => {
  if (isDev) {
    console.error(...args);
  }
};
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ToastMessage, ToastType } from '../../types';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider = ({ children }: { children?: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 md:px-0">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`
              flex items-center gap-3 p-4 rounded-xl shadow-lg border animate-in slide-in-from-top-5 fade-in duration-300
              ${toast.type === 'success' ? 'bg-white dark:bg-neutral-900 border-green-500 text-green-700 dark:text-green-400' : ''}
              ${toast.type === 'error' ? 'bg-white dark:bg-neutral-900 border-red-500 text-red-700 dark:text-red-400' : ''}
              ${toast.type === 'info' ? 'bg-white dark:bg-neutral-900 border-blue-500 text-blue-700 dark:text-blue-400' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
            
            <p className="text-sm font-bold flex-1">{toast.message}</p>
            
            <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
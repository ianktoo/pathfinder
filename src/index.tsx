import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './Routes';

import { ToastProvider } from './components/ui/toast';
import { CookieConsent } from './components/ui/cookie-consent';


function PathfinderApp() {
  return (
    <ToastProvider>
      <CookieConsent />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<PathfinderApp />);
import React, { useState } from 'react';
import { Flame, Menu, User, LogOut, LayoutDashboard } from 'lucide-react';
import { ViewState } from '../../types';
import { ThemeToggle } from '../ui/theme-toggle';
import { useAuth } from '../../contexts/AuthContext';
import { SignOutModal } from '../auth/SignOutModal';

interface PublicNavbarProps {
  onNavigate: (view: ViewState) => void;
  onSignIn: () => void;
  transparent?: boolean;
}

export const PublicNavbar = ({ onNavigate, onSignIn, transparent = false }: PublicNavbarProps) => {
  const { user, logout } = useAuth();
  const [showSignOut, setShowSignOut] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${transparent ? 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-transparent' : 'bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center relative">
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

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-stone-100 dark:bg-neutral-800 py-1.5 px-3 pr-4 rounded-full hover:bg-stone-200 dark:hover:bg-neutral-700 transition-all border border-transparent hover:border-stone-300 dark:hover:border-neutral-600"
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-500 font-bold border border-orange-200 dark:border-orange-900/50">
                  {user.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </div>
                <span className="text-sm font-bold text-stone-700 dark:text-stone-300 max-w-[100px] truncate">
                  {user.name?.split(' ')[0] || 'Explorer'}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-stone-200 dark:border-neutral-800 py-2 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-stone-100 dark:border-neutral-800 mb-1 bg-stone-50/50 dark:bg-neutral-900/50">
                    <p className="font-bold text-stone-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => onNavigate('dashboard')}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-orange-600 dark:hover:text-orange-500 flex items-center gap-3 rounded-xl transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setShowSignOut(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-500 flex items-center gap-3 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}

              {showUserMenu && (
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowUserMenu(false)}></div>
              )}
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="bg-stone-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-orange-600 transition-colors dark:bg-white dark:text-stone-900 dark:hover:bg-orange-500 dark:hover:text-white shadow-lg shadow-orange-500/10"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center text-stone-900 dark:text-white border border-stone-200 dark:border-neutral-700 active:scale-95 transition-transform"
              >
                {user.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <button onClick={onSignIn} className="text-stone-900 dark:text-white">
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {user && showUserMenu && (
        <div className="md:hidden absolute top-20 right-4 w-64 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-stone-200 dark:border-neutral-800 py-2 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-stone-100 dark:border-neutral-800 mb-1 bg-stone-50/50 dark:bg-neutral-900/50">
            <p className="font-bold text-stone-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user.email}</p>
          </div>
          <div className="p-1">
            <button
              onClick={() => {
                onNavigate('dashboard');
                setShowUserMenu(false);
              }}
              className="w-full text-left px-3 py-3 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-orange-600 dark:hover:text-orange-500 flex items-center gap-3 rounded-xl transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" /> Go to Dashboard
            </button>
            <button
              onClick={() => {
                setShowSignOut(true);
                setShowUserMenu(false);
              }}
              className="w-full text-left px-3 py-3 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-500 flex items-center gap-3 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Mobile Backdrop */}
      {user && showUserMenu && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/5" onClick={() => setShowUserMenu(false)}></div>
      )}

      <SignOutModal
        isOpen={showSignOut}
        onClose={() => setShowSignOut(false)}
        onConfirm={() => {
          setShowSignOut(false);
          logout();
        }}
      />
    </nav>
  );
};
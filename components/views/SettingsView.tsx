import React, { useState } from 'react';
import { Settings, X, Cpu, Bot, ShieldCheck, AlertCircle, CheckCircle, Copy, Key } from 'lucide-react';
import { Button } from '../ui/button';
import { ModelID } from '../../types';
import { ModelRegistry } from '../../services/ai';
import { isSupabaseConfigured } from '../../services/supabaseClient';

export const SettingsView = ({ onClose }: { onClose: () => void }) => {
  const [model, setModel] = useState<ModelID>(ModelRegistry.currentModelId);

  const handleSave = () => {
    ModelRegistry.setModel(model);
    onClose();
  };

  const hasGeminiKey = ModelRegistry.hasApiKey();
  const hasSupabase = isSupabaseConfigured();

  const copyEnvSnippet = () => {
      const text = `API_KEY=your_gemini_api_key_here\nVITE_SUPABASE_URL=your_project_url\nVITE_SUPABASE_ANON_KEY=your_anon_key`;
      navigator.clipboard.writeText(text);
      alert("Config snippet copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-8 animate-in zoom-in-95 border border-stone-200 dark:border-neutral-800 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2 text-stone-900 dark:text-white uppercase">
            <Settings className="w-6 h-6" /> Engine Settings
          </h2>
          <button onClick={onClose}><X className="w-6 h-6 text-stone-400" /></button>
        </div>

        {/* System Status Section */}
        <div className="mb-8 bg-stone-50 dark:bg-neutral-950 rounded-2xl p-5 border border-stone-200 dark:border-neutral-800">
             <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-4 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4" /> System Status (API Keys)
             </h3>
             <div className="space-y-3">
                 <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Gemini AI</span>
                        <span className="text-[10px] text-stone-400 font-mono">env: API_KEY</span>
                     </div>
                     {hasGeminiKey ? (
                         <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                             <CheckCircle className="w-3 h-3" /> Ready
                         </div>
                     ) : (
                         <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                             <AlertCircle className="w-3 h-3" /> Missing
                         </div>
                     )}
                 </div>
                 <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Supabase</span>
                        <span className="text-[10px] text-stone-400 font-mono">env: VITE_SUPABASE_*</span>
                     </div>
                     {hasSupabase ? (
                         <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                             <CheckCircle className="w-3 h-3" /> Ready
                         </div>
                     ) : (
                         <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                             <AlertCircle className="w-3 h-3" /> Missing
                         </div>
                     )}
                 </div>
             </div>
             
             {(!hasGeminiKey || !hasSupabase) && (
                 <div className="mt-4 pt-4 border-t border-stone-200 dark:border-neutral-800">
                     <p className="text-xs text-stone-500 mb-2">
                        Add these keys to a <code>.env</code> file in your project root to activate features.
                     </p>
                     <div className="bg-stone-200 dark:bg-neutral-900 p-3 rounded-lg text-[10px] font-mono text-stone-600 dark:text-stone-400 overflow-x-auto whitespace-pre border border-stone-300 dark:border-neutral-800">
                         API_KEY=AIzaSy...<br/>
                         VITE_SUPABASE_URL=https://...<br/>
                         VITE_SUPABASE_ANON_KEY=eyJh...
                     </div>
                     <button onClick={copyEnvSnippet} className="mt-2 w-full py-1.5 bg-white dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 rounded text-xs font-bold flex items-center justify-center gap-2 hover:bg-stone-100 dark:hover:bg-neutral-700">
                         <Copy className="w-3 h-3" /> Copy Snippet
                     </button>
                 </div>
             )}
        </div>
        
        <div className="mb-8">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">AI Model Provider</label>
          <div className="space-y-3">
            <button
              onClick={() => setModel('gemini-2.5-flash')}
              className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                model === 'gemini-2.5-flash' 
                  ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' 
                  : 'border-stone-200 dark:border-neutral-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              <Cpu className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold">Gemini 2.5 Flash</div>
                <div className="text-xs font-medium opacity-70">Lightning Fast (Recommended)</div>
              </div>
            </button>
            <button
              onClick={() => setModel('gemini-3-pro-preview')}
              className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                model === 'gemini-3-pro-preview' 
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300' 
                  : 'border-stone-200 dark:border-neutral-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              <Bot className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold">Gemini 3.0 Pro</div>
                <div className="text-xs font-medium opacity-70">Deep Reasoning</div>
              </div>
            </button>
          </div>
        </div>

        <Button onClick={handleSave}>Save Configuration</Button>
      </div>
    </div>
  );
};
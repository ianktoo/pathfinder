import React, { useState } from 'react';
import { Settings, X, Cpu, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import { ModelID } from '../../types';
import { ModelRegistry } from '../../services/ai';

export const SettingsView = ({ onClose }: { onClose: () => void }) => {
  const [model, setModel] = useState<ModelID>(ModelRegistry.currentModelId);

  const handleSave = () => {
    ModelRegistry.setModel(model);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-8 animate-in zoom-in-95 border border-stone-200 dark:border-neutral-800 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2 text-stone-900 dark:text-white uppercase">
            <Settings className="w-6 h-6" /> Engine Settings
          </h2>
          <button onClick={onClose}><X className="w-6 h-6 text-stone-400" /></button>
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

import React, { useState } from 'react';
import Button from './Button';

interface ApiKeyModalProps {
  onSubmit: (apiKey: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSubmit }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-2xl shadow-2xl p-8 m-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
             <h2 className="text-2xl font-bold text-slate-100">
              ورود کلید API جمینای
            </h2>
            <p className="text-slate-400 mt-2">
              برای استفاده از «آوای پارسی»، لطفاً کلید API خود را از 
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors mx-1"
              >
                Google AI Studio
              </a>
               دریافت و در کادر زیر وارد کنید.
            </p>
          </div>
          <div>
            <label htmlFor="api-key-input" className="sr-only">
              کلید API
            </label>
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-center focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
              placeholder="AIzaSy... "
              required
            />
          </div>
          <Button type="submit" disabled={!apiKey.trim()} className="w-full">
            ذخیره و ادامه
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;

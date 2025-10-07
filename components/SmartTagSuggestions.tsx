import React, { useState, useEffect, useRef } from 'react';
import { enhancePrompt } from '../services/geminiService';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import Spinner from './Spinner';

interface SmartTagSuggestionsProps {
  currentPrompt: string;
  onPromptUpdate: (newPrompt: string) => void;
  disabled: boolean;
  onUpgradeClick: () => void;
}

const SmartTagSuggestions: React.FC<SmartTagSuggestionsProps> = ({ currentPrompt, onPromptUpdate, disabled, onUpgradeClick }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { plan } = useSubscriptionContext();
  
  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (plan !== 'pro' || currentPrompt.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    setIsLoading(true);
    debounceTimeout.current = window.setTimeout(async () => {
      try {
        const result = await enhancePrompt(currentPrompt);
        setSuggestions(result);
      } catch (error) {
        console.error("Failed to fetch prompt suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 750); // 750ms debounce

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [currentPrompt, plan]);

  const handleSuggestionClick = (suggestion: string) => {
    const trimmedPrompt = currentPrompt.trim();
    // Avoid adding duplicate tags
    if (trimmedPrompt.toLowerCase().includes(suggestion.toLowerCase())) {
        return;
    }
    const separator = trimmedPrompt.length > 0 && !trimmedPrompt.endsWith(',') ? ', ' : ' ';
    onPromptUpdate(`${trimmedPrompt}${separator}${suggestion}`);
  };

  if (plan === 'free') {
    return (
      <div className="relative p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-center overflow-hidden">
        <div className="blur-sm select-none">
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="px-3 py-1 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-transparent rounded-full">+ cinematic</div>
            <div className="px-3 py-1 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-transparent rounded-full">+ hyperrealistic</div>
            <div className="px-3 py-1 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-transparent rounded-full">+ vibrant colors</div>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-800/70 p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500 mb-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
          <p className="font-semibold text-gray-800 dark:text-gray-200">Unlock AI Smart Tags</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Get suggestions to perfect your prompt.</p>
          <button
            onClick={onUpgradeClick}
            className="px-4 py-1.5 text-xs font-bold text-white bg-purple-500 rounded-md hover:bg-purple-600 transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }
  
  if (suggestions.length === 0 && !isLoading) {
    return null; // Don't show anything if there are no suggestions and not loading
  }

  return (
    <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 min-h-[76px]">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
          AI Suggestions ✨
        </h4>
        {isLoading && <Spinner className="w-4 h-4 text-cyan-500" />}
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={disabled}
            className="px-2.5 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-900/50 hover:text-cyan-800 dark:hover:text-cyan-200 transition-colors disabled:opacity-50"
          >
            + {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SmartTagSuggestions;
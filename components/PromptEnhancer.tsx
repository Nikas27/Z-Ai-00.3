import React, { useState } from 'react';
import { enhancePrompt } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';

interface PromptEnhancerProps {
  currentPrompt: string;
  onPromptUpdate: (newPrompt: string) => void;
  disabled: boolean;
  onUpgradeClick: () => void;
}

const PromptEnhancer: React.FC<PromptEnhancerProps> = ({ currentPrompt, onPromptUpdate, disabled, onUpgradeClick }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const showToast = useToast();
  const { plan } = useSubscriptionContext();

  const handleFetchSuggestions = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    setSuggestions([]); // Clear old suggestions while fetching new ones

    try {
      const result = await enhancePrompt(currentPrompt);
      setSuggestions(result);
      if (result.length === 0) {
        showToast('info', 'No Suggestions', 'We couldn\'t find any suggestions for this prompt.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Prompt enhancement failed:", err);
      // Now that it's a manual action, we should show an error toast.
      showToast('error', 'Suggestion Failed', errorMessage);
      setSuggestions([]); // Ensure suggestions are cleared on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const trimmedPrompt = currentPrompt.trim();
    const separator = trimmedPrompt.length > 0 && !trimmedPrompt.endsWith(',') ? ', ' : ' ';
    onPromptUpdate(`${trimmedPrompt}${separator}${suggestion}`);
  };

  if (plan === 'free') {
    return (
      <div className="flex flex-col gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
            Prompt Assistant
          </h4>
          <button
            type="button"
            onClick={onUpgradeClick}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-500 rounded-md hover:bg-purple-600 transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Upgrade for Ideas</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700/50 pt-3">
            Get AI-powered prompt suggestions with a Pro membership to perfect your creations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
          Prompt Assistant
        </h4>
        <button
          type="button"
          onClick={handleFetchSuggestions}
          disabled={disabled || isLoading || currentPrompt.trim().length < 5}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isLoading ? (
            <>
              <Spinner className="w-4 h-4" />
              <span>Getting...</span>
            </>
          ) : (
            <>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3.5a1.5 1.5 0 011.5 1.5v1.416a3.502 3.502 0 012.25 3.084V12.5a1.5 1.5 0 01-1.5 1.5h-1.875a.375.375 0 00-.375.375v1.875a1.5 1.5 0 01-3 0V14.375a.375.375 0 00-.375-.375H4.5a1.5 1.5 0 01-1.5-1.5V9.5a3.502 3.502 0 012.25-3.084V5a1.5 1.5 0 011.5-1.5h3zm-3.5 6a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h7a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-7z" />
             </svg>
             <span>Get Ideas</span>
            </>
          )}
        </button>
      </div>
      
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700/50 animate-[fadeIn_0.3s_ease-in-out]">
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
      )}
    </div>
  );
};

export default PromptEnhancer;
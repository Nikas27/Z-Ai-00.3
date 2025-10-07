import React, { useState } from 'react';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { useToast } from '../contexts/ToastContext';
import { generateMagicPrompt } from '../services/geminiService';
import Spinner from './Spinner';

interface MagicPromptButtonProps {
  currentPrompt: string;
  onPromptUpdate: (newPrompt: string) => void;
  disabled: boolean;
}

const MagicPromptButton: React.FC<MagicPromptButtonProps> = ({ currentPrompt, onPromptUpdate, disabled }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { plan } = useSubscriptionContext();
  const showToast = useToast();

  const handleGenerate = async () => {
    if (isLoading || disabled || plan !== 'pro') return;
    setIsLoading(true);
    try {
      const enhancedPrompt = await generateMagicPrompt(currentPrompt);
      onPromptUpdate(enhancedPrompt);
      showToast('success', 'Prompt Enhanced!', 'Your prompt has been magically enhanced.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      showToast('error', 'Magic Prompt Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const isButtonDisabled = disabled || isLoading || currentPrompt.trim().length < 3 || plan === 'free';

  return (
    <div className="relative group flex-shrink-0">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        className="w-full px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-md hover:from-purple-600 hover:to-pink-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        aria-label="Enhance prompt with AI"
      >
        {isLoading ? (
          <>
            <Spinner className="w-4 h-4" />
            <span>Working...</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w.3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /><path d="M12.736 3.97a6 6 0 00-8.485 8.485l-2.071 2.071 1.414 1.414 2.071-2.071a6 6 0 008.485-8.485zM10 5a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3A.5.5 0 0110 5z" clipRule="evenodd" /><path d="M10.5 10a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5z" /></svg>
            <span>Magic Prompt</span>
          </>
        )}
      </button>
      {plan === 'free' && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 dark:bg-black text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
          Upgrade to Pro to use the AI-powered Magic Prompt assistant!
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900 dark:border-t-black"></div>
        </div>
      )}
    </div>
  );
};

export default MagicPromptButton;

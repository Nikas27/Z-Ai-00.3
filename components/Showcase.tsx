import React, { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/databaseService';
import { Design } from '../types';
import { useToast } from '../contexts/ToastContext';

const Showcase: React.FC = () => {
  const [creations, setCreations] = useState<Design[]>([]);
  const showToast = useToast();

  const fetchCreations = useCallback(() => {
    const allCreations = databaseService.getAllCreations();
    // Filter for images only, as they are more general-purpose for inspiration
    setCreations(allCreations.filter(c => c.type === 'image').slice(0, 10));
  }, []);

  useEffect(() => {
    fetchCreations(); // Initial fetch
    
    databaseService.subscribe('data_changed', fetchCreations);
    
    return () => {
      databaseService.unsubscribe('data_changed', fetchCreations);
    };
  }, [fetchCreations]);

  const handleUsePrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    showToast('success', 'Prompt Copied!', 'The prompt has been copied to your clipboard.');
  };

  if (creations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center text-gray-800 dark:text-gray-200">
        Daily Inspirations
      </h3>
      <div className="relative">
         <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {creations.map((creation) => (
            <div 
                key={creation.id}
                className="group relative flex-shrink-0 w-48 h-48 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md"
            >
                <img src={creation.resultDataUrl} alt={creation.prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                <p className="text-xs font-medium leading-tight line-clamp-3 mb-2">{creation.prompt}</p>
                <button
                    onClick={() => handleUsePrompt(creation.prompt)}
                    className="w-full px-2 py-1 text-xs font-bold text-gray-900 bg-white/90 rounded-md hover:bg-white transition-colors"
                >
                    Use Prompt
                </button>
                </div>
            </div>
            ))}
        </div>
         <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-gray-50 dark:from-gray-900 pointer-events-none"></div>
         <div className="absolute top-0 left-0 h-full w-12 bg-gradient-to-r from-gray-50 dark:from-gray-900 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Showcase;


import React from 'react';
import { GeneratorMode } from '../types';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';

interface TabSelectorProps {
  selectedMode: GeneratorMode;
  onSelectMode: (mode: GeneratorMode) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({ selectedMode, onSelectMode }) => {
  const { plan } = useSubscriptionContext();
  const isPro = plan === 'pro';

  const getTabClass = (mode: GeneratorMode) => {
    const isActive = selectedMode === mode;
    let activeClass = 'bg-cyan-500 shadow-md text-white';
    if (isPro) {
        activeClass = 'bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg text-white ring-2 ring-purple-500/70 ring-offset-2 ring-offset-gray-200 dark:ring-offset-gray-800';
    }
     if (mode === GeneratorMode.SCENE) {
        activeClass = 'bg-gradient-to-r from-orange-500 to-red-500 shadow-lg text-white ring-2 ring-red-500/70 ring-offset-2 ring-offset-gray-200 dark:ring-offset-gray-800';
    }

    const inactiveClass = 'text-gray-500 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-700/50';
    return isActive ? activeClass : inactiveClass;
  };
  
  const buttonWidth = isPro ? "w-1/3" : "w-1/2";

  return (
    <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1.5 max-w-md mx-auto">
      <button
        onClick={() => onSelectMode(GeneratorMode.IMAGE)}
        className={`${buttonWidth} p-2 rounded-md transition-all duration-300 text-sm font-semibold flex items-center justify-center gap-2 ${
          getTabClass(GeneratorMode.IMAGE)
        }`}
      >
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
        Image
      </button>
      <button
        onClick={() => onSelectMode(GeneratorMode.VIDEO)}
        className={`${buttonWidth} p-2 rounded-md transition-all duration-300 text-sm font-semibold flex items-center justify-center gap-2 ${
          getTabClass(GeneratorMode.VIDEO)
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
        Video
      </button>
       {isPro && (
        <button
            onClick={() => onSelectMode(GeneratorMode.SCENE)}
            className={`${buttonWidth} p-2 rounded-md transition-all duration-300 text-sm font-semibold flex items-center justify-center gap-2 ${
            getTabClass(GeneratorMode.SCENE)
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 4a1 1 0 00-1-1H6a1 1 0 00-1 1v2H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1h-1V4zM9 12a1 1 0 112 0 1 1 0 01-2 0z" /></svg>
            Scene Studio
        </button>
      )}
    </div>
  );
};

export default TabSelector;

import React from 'react';
import ThemeToggle from './ThemeToggle';
import UserProfile from './UserProfile';

interface HeaderProps {
    onUpgradeClick: () => void;
    onViewDesignsClick: () => void;
    onViewPurchaseHistoryClick: () => void;
    view: 'user' | 'admin';
    setView: (view: 'user' | 'admin') => void;
}

const Header: React.FC<HeaderProps> = ({ onUpgradeClick, onViewDesignsClick, onViewPurchaseHistoryClick, view, setView }) => {
  
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <svg className="w-9 h-9" viewBox="0 0 24 24" fill="url(#logo-gradient)" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                </defs>
                <path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2ZM12 4.47L19.53 9.5L12 14.53L4.47 9.5L12 4.47Z" />
            </svg>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-400">
              Z-Ai
            </h1>
          </div>
          <div className="flex items-center gap-4">
              <UserProfile 
                onViewDesignsClick={onViewDesignsClick} 
                onViewPurchaseHistoryClick={onViewPurchaseHistoryClick}
                onUpgradeClick={onUpgradeClick}
                setView={setView} 
              />
              <ThemeToggle />
              <button 
                onClick={() => setView(view === 'user' ? 'admin' : 'user')}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-white transition-colors"
                aria-label={view === 'user' ? "Go to Admin Dashboard" : "Go back to App"}
              >
                  {view === 'user' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                  )}
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
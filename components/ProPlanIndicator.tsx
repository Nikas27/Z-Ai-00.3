import React, { useState, useEffect, useCallback } from 'react';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { databaseService } from '../services/databaseService';

interface ProPlanIndicatorProps {
  onViewDesignsClick: () => void;
}

const ProPlanIndicator: React.FC<ProPlanIndicatorProps> = ({ onViewDesignsClick }) => {
  const { currentUser } = useSubscriptionContext();
  const [designCount, setDesignCount] = useState(0);

  const updateUserDesignCount = useCallback(() => {
    if (currentUser) {
      const allDesigns = databaseService.getAllDesigns();
      const userDesigns = allDesigns.filter(d => d.userId === currentUser.id);
      setDesignCount(userDesigns.length);
    }
  }, [currentUser]);

  useEffect(() => {
    // Initial count load
    updateUserDesignCount();
    
    // Subscribe to design changes
    // FIX: Changed event from 'designs_changed' to 'data_changed' to match the available event type in databaseService.
    databaseService.subscribe('data_changed', updateUserDesignCount);
    
    // Unsubscribe on cleanup
    return () => {
      // FIX: Changed event from 'designs_changed' to 'data_changed' to match the available event type in databaseService.
      databaseService.unsubscribe('data_changed', updateUserDesignCount);
    };
  }, [currentUser, updateUserDesignCount]);

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-white via-purple-100/50 to-white dark:from-gray-900 dark:via-purple-900/50 dark:to-gray-900 border border-purple-300 dark:border-purple-500/50 rounded-lg animate-[fadeIn_0.5s_ease-in-out]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-4">
                <span className="text-3xl transform -translate-y-1 hidden sm:block">✨</span>
                <div>
                    <h3 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500 dark:from-purple-400 dark:to-cyan-400">
                        Welcome, Pro Member!
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        You've created <strong className="text-gray-700 dark:text-gray-200">{designCount}</strong> amazing designs. Keep the creativity flowing!
                    </p>
                </div>
            </div>
            <button
              onClick={onViewDesignsClick}
              className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-md hover:from-purple-600 hover:to-cyan-600 transition-all shadow-md flex-shrink-0"
            >
              View My Designs
            </button>
        </div>
    </div>
  );
};

export default ProPlanIndicator;
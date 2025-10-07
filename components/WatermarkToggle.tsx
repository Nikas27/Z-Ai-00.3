import React from 'react';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';

interface WatermarkToggleProps {
  withWatermark: boolean;
  setWithWatermark: (value: boolean) => void;
  disabled: boolean;
}

const WatermarkToggle: React.FC<WatermarkToggleProps> = ({ withWatermark, setWithWatermark, disabled }) => {
  const { plan, credits } = useSubscriptionContext();

  if (plan === 'pro') {
    return (
        <div className="flex items-center justify-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-purple-500/30 text-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          <span className="text-sm font-medium text-purple-300">
            Watermark-Free Exports
          </span>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <label htmlFor="watermark-toggle" className="flex items-center cursor-pointer">
            <span className="mr-3 text-gray-300 text-sm font-medium">Add Watermark</span>
            <div className="relative">
                <input 
                    id="watermark-toggle" 
                    type="checkbox" 
                    checked={withWatermark} 
                    onChange={(e) => setWithWatermark(e.target.checked)} 
                    className="sr-only" 
                    disabled={disabled} 
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${
                    withWatermark ? 'bg-cyan-500' : 'bg-gray-600'
                }`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                    withWatermark ? 'translate-x-full' : ''
                }`}></div>
            </div>
        </label>
        {!withWatermark && (
            <div className="text-xs text-center text-yellow-400 bg-yellow-900/40 px-2 py-1 rounded-md flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Uses 1 of your {credits.noWatermark} watermark-free credits.</span>
            </div>
        )}
    </div>
  );
};

export default WatermarkToggle;

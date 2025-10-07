import React from 'react';
import { AspectRatio } from '../types';

const formats: {
  name: string;
  platforms: string;
  ratio: AspectRatio;
  icon: React.ReactNode;
}[] = [
  {
    name: 'Story / Reel',
    platforms: 'TikTok, Instagram',
    ratio: '9:16',
    icon: <div className="w-5 h-8 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>,
  },
  {
    name: 'Portrait',
    platforms: 'Facebook, Pinterest',
    ratio: '3:4',
    icon: <div className="w-6 h-8 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>,
  },
  {
    name: 'Square Post',
    platforms: 'Instagram, Facebook',
    ratio: '1:1',
    icon: <div className="w-7 h-7 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>,
  },
  {
    name: 'Landscape',
    platforms: 'X / Twitter, Ads',
    ratio: '4:3',
    icon: <div className="w-8 h-6 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>,
  },
  {
    name: 'Widescreen',
    platforms: 'YouTube, Web',
    ratio: '16:9',
    icon: <div className="w-9 h-5 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>,
  },
];

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio;
  onRatioChange: (ratio: AspectRatio) => void;
  disabled: boolean;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, onRatioChange, disabled }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
        Format / Aspect Ratio
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {formats.map(({ name, platforms, ratio, icon }) => {
          const isSelected = selectedRatio === ratio;
          return (
            <button
              key={ratio}
              type="button"
              onClick={() => onRatioChange(ratio)}
              disabled={disabled}
              className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all duration-200 h-28 text-center
                ${isSelected ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 shadow-md' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50'}
                ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-400 dark:hover:border-gray-600'}`}
            >
              <div className={`flex items-center justify-center h-8 mb-1 ${isSelected ? 'text-cyan-500 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {icon}
              </div>
              <span className={`block text-xs font-semibold leading-tight ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{name}</span>
              <span className="block text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{platforms}</span>
              <span className="block text-xs text-gray-500 mt-1">{ratio}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AspectRatioSelector;
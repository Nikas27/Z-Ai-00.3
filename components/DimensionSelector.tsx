import React from 'react';
import { AspectRatio, CustomDimensions } from '../types';
import AspectRatioSelector from './AspectRatioSelector';

interface DimensionSelectorProps {
  // Aspect ratio props
  selectedRatio: AspectRatio;
  onRatioChange: (ratio: AspectRatio) => void;
  // Custom dimensions props
  customDimensions: CustomDimensions;
  onCustomDimensionsChange: (dims: CustomDimensions) => void;
  // Mode props
  dimensionMode: 'aspectRatio' | 'custom';
  onDimensionModeChange: (mode: 'aspectRatio' | 'custom') => void;
  // General props
  disabled: boolean;
}

const DimensionSelector: React.FC<DimensionSelectorProps> = ({
  selectedRatio,
  onRatioChange,
  customDimensions,
  onCustomDimensionsChange,
  dimensionMode,
  onDimensionModeChange,
  disabled
}) => {
  
  const handleDimChange = (field: 'width' | 'height', value: string) => {
    // Allow only numeric input, preventing non-digit characters
    if (/^\d*$/.test(value)) {
      onCustomDimensionsChange({
        ...customDimensions,
        [field]: value,
      });
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCustomDimensionsChange({
        ...customDimensions,
        unit: e.target.value as 'px' | 'cm',
      });
  };

  const isAspectRatioMode = dimensionMode === 'aspectRatio';

  return (
    <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Output Size
        </label>
        <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1 max-w-sm mb-4">
            <button
                onClick={() => onDimensionModeChange('aspectRatio')}
                disabled={disabled}
                className={`w-1/2 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${isAspectRatioMode ? 'bg-cyan-500 shadow-md text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'}`}
            >
                Presets
            </button>
            <button
                onClick={() => onDimensionModeChange('custom')}
                disabled={disabled}
                className={`w-1/2 p-2 rounded-md transition-all duration-300 text-sm font-semibold ${!isAspectRatioMode ? 'bg-cyan-500 shadow-md text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'}`}
            >
                Custom Size
            </button>
        </div>

        {isAspectRatioMode ? (
            <div className="animate-[fadeIn_0.3s_ease-in-out]">
                <AspectRatioSelector
                    selectedRatio={selectedRatio}
                    onRatioChange={onRatioChange}
                    disabled={disabled}
                />
            </div>
        ) : (
            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-300 dark:border-gray-700 space-y-3 animate-[fadeIn_0.3s_ease-in-out]">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="width" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Width</label>
                        <input
                            id="width"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={customDimensions.width}
                            onChange={(e) => handleDimChange('width', e.target.value)}
                            placeholder="e.g., 1024"
                            className="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500"
                            disabled={disabled}
                        />
                    </div>
                     <div>
                        <label htmlFor="height" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Height</label>
                        <input
                            id="height"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={customDimensions.height}
                            onChange={(e) => handleDimChange('height', e.target.value)}
                            placeholder="e.g., 1024"
                            className="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500"
                            disabled={disabled}
                        />
                    </div>
                </div>
                <div>
                     <label htmlFor="unit" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Unit</label>
                    <select
                        id="unit"
                        value={customDimensions.unit}
                        onChange={handleUnitChange}
                        disabled={disabled}
                        className="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="px">Pixels (px)</option>
                        <option value="cm">Centimeters (cm)</option>
                    </select>
                </div>
                 <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
                    Note: The image will be generated using the closest supported aspect ratio and then resized to your exact dimensions.
                 </p>
            </div>
        )}
    </div>
  );
};

export default DimensionSelector;

import React, { useState, useEffect } from 'react';
import { generateImage } from '../services/geminiService';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { AspectRatio, CustomDimensions, GeneratorMode } from '../types';
import Spinner from './Spinner';
import ResultDisplay from './ResultDisplay';
import ImageUploader from './ImageUploader';
import WatermarkToggle from './WatermarkToggle';
import { useToast } from '../contexts/ToastContext';
import { databaseService } from '../services/databaseService';
import DimensionSelector from './DimensionSelector';
import { convertCmToPx, findClosestAspectRatio, resizeImage } from '../utils/dimensionUtils';
import GenerationLoading from './GenerationLoading';
import SmartTagSuggestions from './SmartTagSuggestions';
import StylePicker from './StylePicker';
import PromptHistory, { addPromptToHistory } from './PromptHistory';

interface ImageGeneratorProps {
  onUpgradeClick: () => void;
  sourceImage: { base64: string; mime: string; dataUrl: string; } | null;
  onImageUpload: (imageData: { base64: string; mime: string; dataUrl: string } | null) => void;
}

const getImageAspectRatio = (dataUrl: string): Promise<AspectRatio> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      if (ratio > 1.7) resolve('16:9');      // ~1.77
      else if (ratio > 1.3) resolve('4:3');  // ~1.33
      else if (ratio > 0.85) resolve('1:1'); // 1.0
      else if (ratio > 0.65) resolve('3:4'); // 0.75
      else resolve('9:16');                  // ~0.56
    };
    img.onerror = () => resolve('1:1'); // Default on error
    img.src = dataUrl;
  });
};


const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onUpgradeClick, sourceImage, onImageUpload }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [dimensionMode, setDimensionMode] = useState<'aspectRatio' | 'custom'>('aspectRatio');
  const [customDimensions, setCustomDimensions] = useState<CustomDimensions>({ width: '', height: '', unit: 'px' });
  const [withWatermark, setWithWatermark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [imageQuality, setImageQuality] = useState(50);

  const { plan, consumeOnGenerate, canGenerate, currentUser } = useSubscriptionContext();
  const showToast = useToast();
  
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('imageGeneratorState');
      if (savedState) {
        const { prompt: savedPrompt, aspectRatio: savedAspectRatio, imageQuality: savedQuality } = JSON.parse(savedState);
        setPrompt(savedPrompt || '');
        setAspectRatio(savedAspectRatio || '1:1');
        setImageQuality(savedQuality || 50);
      }
    } catch (e) {
      console.error("Failed to parse saved generator state.", e);
    }
  }, []);

  useEffect(() => {
    try {
      const stateToSave = { prompt, aspectRatio, imageQuality };
      localStorage.setItem('imageGeneratorState', JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save generator state.", e);
    }
  }, [prompt, aspectRatio, imageQuality]);

  useEffect(() => {
    if (plan === 'pro') {
      setWithWatermark(false);
    } else {
      setWithWatermark(true);
    }
  }, [plan]);
  
  useEffect(() => {
    if (resultUrl) {
      setResultUrl(null);
    }
  }, [sourceImage]);
  
  const handleImageUpload = async (imageData: { base64: string; mime: string; dataUrl: string } | null) => {
    onImageUpload(imageData);
    if (imageData) {
        // When an image is uploaded, automatically detect and lock its aspect ratio.
        const imageAspectRatio = await getImageAspectRatio(imageData.dataUrl);
        setAspectRatio(imageAspectRatio);
        setDimensionMode('aspectRatio'); // Ensure we are in aspect ratio mode.
    } else {
        // Clear prompt if image is removed
        setPrompt('');
    }
  };
  
  const handleStyleSelect = (keyword: string) => {
    const trimmedPrompt = prompt.trim();
    const separator = trimmedPrompt.length > 0 && !trimmedPrompt.endsWith(',') ? ', ' : ' ';
    setPrompt(`${trimmedPrompt}${separator}${keyword}`);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    if (!canGenerate(GeneratorMode.IMAGE, !withWatermark)) {
      showToast('error', 'Insufficient Resources', 'You do not have enough credits or tokens to perform this action.');
      onUpgradeClick();
      return;
    }

    addPromptToHistory(prompt);
    setIsLoading(true);
    setError(null);
    
    try {
      let finalImageUrl: string;
      let generationAspectRatio = aspectRatio;
      let requiresResize = false;
      let finalWidth = 0;
      let finalHeight = 0;

      if (dimensionMode === 'custom' && !sourceImage) {
        const width = parseInt(customDimensions.width, 10);
        const height = parseInt(customDimensions.height, 10);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            setError('Please enter valid, non-zero width and height.');
            setIsLoading(false);
            return;
        }

        finalWidth = customDimensions.unit === 'cm' ? convertCmToPx(width) : width;
        finalHeight = customDimensions.unit === 'cm' ? convertCmToPx(height) : height;

        if (finalWidth > 4096 || finalHeight > 4096) {
            setError('Maximum dimension is 4096px.');
            setIsLoading(false);
            return;
        }

        generationAspectRatio = findClosestAspectRatio(finalWidth, finalHeight);
        requiresResize = true;
        showToast('info', 'Using Closest Ratio', `Generating at ${generationAspectRatio}, then resizing to ${finalWidth}x${finalHeight}px.`);
      }
      
      if (sourceImage) {
        finalImageUrl = await generateImage(prompt, sourceImage.base64, sourceImage.mime, withWatermark, aspectRatio);
      } else {
        finalImageUrl = await generateImage(prompt, null, null, withWatermark, generationAspectRatio);
      }
      
      if (requiresResize) {
        finalImageUrl = await resizeImage(finalImageUrl, finalWidth, finalHeight);
      }
      
      setResultUrl(finalImageUrl);
      consumeOnGenerate(GeneratorMode.IMAGE, !withWatermark);
      
      if (currentUser) {
        databaseService.addCreation({
            id: `creation-${Date.now()}`,
            userId: currentUser.id,
            type: GeneratorMode.IMAGE,
            prompt,
            createdAt: new Date().toISOString(),
            resultDataUrl: finalImageUrl,
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      showToast('error', 'Generation Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefine = () => {
    setResultUrl(null);
  };

  const handleStartOver = () => {
    setResultUrl(null);
    setPrompt('');
    onImageUpload(null);
  };

  if (isLoading) {
    return <GenerationLoading prompt={prompt} />;
  }
  
  if (resultUrl) {
    return <ResultDisplay 
              type={GeneratorMode.IMAGE} 
              dataUrl={resultUrl} 
              prompt={prompt} 
              onGenerateVariation={handleSubmit}
              onRefine={handleRefine}
              onStartOver={handleStartOver}
           />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              {sourceImage ? 'Source Image' : 'Start with an Image (Optional)'}
          </label>
          <ImageUploader 
            onImageUpload={handleImageUpload} 
            disabled={isLoading} 
            persistedPreviewUrl={sourceImage?.dataUrl || null}
          />
        </div>
        <div className="md:col-span-2 space-y-4">
           <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                {sourceImage ? 'Describe your edits or changes' : 'Describe what you want to create'}
              </label>
              <div className="relative">
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A cute cat wearing a wizard hat, cinematic lighting..."
                  className="w-full h-28 p-3 pr-12 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors duration-300 resize-none"
                  disabled={isLoading}
                />
                <div className="absolute top-1 right-1">
                  <PromptHistory onSelect={setPrompt} />
                </div>
              </div>
            </div>
            <SmartTagSuggestions
                currentPrompt={prompt}
                onPromptUpdate={setPrompt}
                disabled={isLoading}
                onUpgradeClick={onUpgradeClick}
            />
        </div>
      </div>
      
      <StylePicker onStyleSelect={handleStyleSelect} disabled={isLoading} />
      
       <div>
        <label htmlFor="quality-slider" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Image Quality <span className="text-xs text-gray-400">(Note: API support pending)</span>
        </label>
        <div className="flex items-center gap-4">
            <input
                id="quality-slider"
                type="range"
                min="10"
                max="100"
                step="10"
                value={imageQuality}
                onChange={(e) => setImageQuality(parseInt(e.target.value, 10))}
                disabled={isLoading}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-sm font-semibold w-20 text-right">{
                {10: 'Low', 40: 'Standard', 70: 'High', 100: 'Ultra'}[imageQuality] || 'Custom'
            }</span>
        </div>
      </div>

      <DimensionSelector
        selectedRatio={aspectRatio}
        onRatioChange={setAspectRatio}
        customDimensions={customDimensions}
        onCustomDimensionsChange={setCustomDimensions}
        dimensionMode={dimensionMode}
        onDimensionModeChange={setDimensionMode}
        disabled={isLoading || !!sourceImage}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-1">
            <WatermarkToggle withWatermark={withWatermark} setWithWatermark={setWithWatermark} disabled={isLoading} />
          </div>
          <div className="md:col-span-2">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !prompt.trim()}
              className="w-full px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-lg hover:from-purple-700 hover:to-cyan-600 transition-transform transform active:scale-95 duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Spinner className="w-6 h-6" />
                  <span>Generating...</span>
                </>
              ) : (
                sourceImage ? 'Generate' : 'Generate Image'
              )}
            </button>
          </div>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-sm text-center mt-4">{error}</p>}
    </div>
  );
};

export default ImageGenerator;

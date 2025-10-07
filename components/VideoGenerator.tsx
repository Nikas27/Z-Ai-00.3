import React, { useState } from 'react';
import { generateVideo } from '../services/geminiService';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { GeneratorMode, NarrationSettings } from '../types';
import Spinner from './Spinner';
import ResultDisplay from './ResultDisplay';
import ImageUploader from './ImageUploader';
import NarratorControls from './NarratorControls';
import { useToast } from '../contexts/ToastContext';
import { databaseService } from '../services/databaseService';
import SmartTagSuggestions from './SmartTagSuggestions';
import StylePicker from './StylePicker';
import PromptHistory, { addPromptToHistory } from './PromptHistory';

interface VideoGeneratorProps {
  onUpgradeClick: () => void;
  sourceImage: { base64: string; mime: string; dataUrl: string; } | null;
  onImageUpload: (imageData: { base64: string; mime: string; dataUrl: string } | null) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onUpgradeClick, sourceImage, onImageUpload }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Generating video...');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(4);
  const [narrationSettings, setNarrationSettings] = useState<NarrationSettings>({
    isEnabled: false,
    mode: 'tts',
    text: '',
    voiceURI: null,
    volume: 0.8,
    pitch: 1,
    rate: 1,
    audioUrl: null,
  });

  const { consumeOnGenerate, canGenerate, currentUser } = useSubscriptionContext();
  const showToast = useToast();

  const isEditing = !!sourceImage;

  const handleStyleSelect = (keyword: string) => {
    const trimmedPrompt = prompt.trim();
    const separator = trimmedPrompt.length > 0 && !trimmedPrompt.endsWith(',') ? ', ' : ' ';
    setPrompt(`${trimmedPrompt}${separator}${keyword}`);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    if (!canGenerate(GeneratorMode.VIDEO, false)) { // watermarks not applicable for video
      showToast('error', 'Insufficient Resources', 'You do not have enough video credits or tokens.');
      onUpgradeClick();
      return;
    }

    addPromptToHistory(prompt);
    setIsLoading(true);
    setError(null);
    setResultUrl(null);

    const messages = [
        "Warming up the animation engine...",
        "Composing the digital scenes...",
        "Applying visual effects and lighting...",
        "This is a complex creation, thanks for your patience!",
        "Rendering the final frames, almost there...",
    ];
    let messageIndex = 0;
    setLoadingMessage(messages[messageIndex]);
    const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setLoadingMessage(messages[messageIndex]);
    }, 8000);

    try {
      const videoUrl = await generateVideo(
        prompt, 
        sourceImage?.base64 || null, 
        sourceImage?.mime || null,
        videoDuration
      );
      setResultUrl(videoUrl);
      consumeOnGenerate(GeneratorMode.VIDEO, false);

      if (currentUser) {
        databaseService.addCreation({
            id: `creation-${Date.now()}`,
            userId: currentUser.id,
            type: GeneratorMode.VIDEO,
            prompt,
            createdAt: new Date().toISOString(),
            resultDataUrl: videoUrl,
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      showToast('error', 'Generation Failed', errorMessage);
    } finally {
      setIsLoading(false);
      clearInterval(messageInterval);
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
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-100 dark:bg-gray-800/50 rounded-lg min-h-[400px]">
            <Spinner className="w-20 h-20 text-purple-500" />
            <h3 className="text-xl font-bold mt-6 text-gray-800 dark:text-gray-200">Creating Your Masterpiece</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{loadingMessage}</p>
        </div>
    );
  }

  if (resultUrl) {
    return <ResultDisplay 
              type={GeneratorMode.VIDEO} 
              dataUrl={resultUrl} 
              prompt={prompt} 
              onGenerateVariation={handleGenerate}
              onRefine={handleRefine}
              onStartOver={handleStartOver}
            />;
  }

  return (
    <div className="space-y-6">
      <div className="p-3 text-center bg-gray-100 dark:bg-gray-800/50 rounded-lg text-sm text-gray-600 dark:text-gray-300">
        <strong>Note:</strong> Video aspect ratio is determined by the source image. If no image is provided, it defaults to widescreen (16:9). Custom dimensions are not currently supported for video generation.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
           <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              {isEditing ? 'Source Image' : 'Start with an Image (Optional)'}
          </label>
          <ImageUploader onImageUpload={onImageUpload} disabled={isLoading} persistedPreviewUrl={sourceImage?.dataUrl || null} />
        </div>
        <div className="md:col-span-2 space-y-4">
           <div>
              <label htmlFor="prompt-video" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Describe the video or animation
              </label>
              <div className="relative">
                <textarea
                  id="prompt-video"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A majestic eagle soaring over a mountain range, golden hour..."
                  className="w-full h-28 p-3 pr-12 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors duration-300 resize-none"
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
        <label htmlFor="duration-slider" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Video Duration: <span className="font-bold text-gray-800 dark:text-gray-100">{videoDuration} seconds</span>
        </label>
        <input
            id="duration-slider"
            type="range"
            min="1"
            max="60"
            step="1"
            value={videoDuration}
            onChange={(e) => setVideoDuration(parseInt(e.target.value, 10))}
            disabled={isLoading}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1s</span>
            <span>60s</span>
        </div>
      </div>

      <NarratorControls settings={narrationSettings} onNarrationChange={setNarrationSettings} disabled={isLoading} />
      
      <div className="pt-4">
        <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg hover:from-purple-700 hover:to-pink-600 transition-transform transform active:scale-95 duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
            {isLoading ? (
                <>
                <Spinner className="w-6 h-6" />
                <span>Generating...</span>
                </>
            ) : (
                isEditing ? 'Animate Image' : 'Generate Video'
            )}
        </button>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-sm text-center mt-4">{error}</p>}
    </div>
  );
};

export default VideoGenerator;

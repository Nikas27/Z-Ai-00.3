import React, { useState, useEffect } from 'react';
import { generateSceneFromScript } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { GeneratedShot, GeneratorMode } from '../types';
import Spinner from './Spinner';
import ScenePlayer from './ScenePlayer';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { databaseService } from '../services/databaseService';

const SceneGenerator: React.FC = () => {
  const [script, setScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ message: '', current: 0, total: 0 });
  const [generatedScene, setGeneratedScene] = useState<GeneratedShot[] | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { currentUser } = useSubscriptionContext();
  const showToast = useToast();
  
  useEffect(() => {
    const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleProgressUpdate = (message: string, current: number, total: number) => {
    setProgress({ message, current, total });
  };

  const handleGenerateScene = async () => {
    if (!script.trim()) {
      setError('Please enter a script.');
      return;
    }
    
    if (voices.length === 0) {
        showToast('error', 'TTS Not Ready', 'Text-to-speech voices are not yet available. Please try again in a moment.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedScene(null);
    setProgress({ message: 'Starting scene generation...', current: 0, total: 0 });

    try {
      const sceneResult = await generateSceneFromScript(script, voices, handleProgressUpdate);
      setGeneratedScene(sceneResult);
      
      // Log each generated shot to the live creations feed
      if (currentUser) {
        sceneResult.forEach(shot => {
            databaseService.addCreation({
                id: `creation-shot-${shot.shotNumber}-${Date.now()}`,
                userId: currentUser.id,
                type: GeneratorMode.VIDEO, // Scenes are composed of videos
                prompt: `Scene Shot #${shot.shotNumber}: ${shot.description}`,
                createdAt: new Date().toISOString(),
                resultDataUrl: shot.videoUrl,
            });
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      showToast('error', 'Scene Generation Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNew = () => {
    setGeneratedScene(null);
    setScript('');
    setError(null);
    setProgress({ message: '', current: 0, total: 0 });
  };

  if (isLoading) {
    const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-100 dark:bg-gray-800/50 rounded-lg min-h-[400px]">
            <Spinner className="w-20 h-20 text-red-500" />
            <h3 className="text-xl font-bold mt-6 text-gray-800 dark:text-gray-200">Directing Your Scene...</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{progress.message}</p>
            {progress.total > 0 && (
                <div className="w-full max-w-md mt-4">
                    <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  if (generatedScene) {
    return <ScenePlayer scene={generatedScene} onStartNew={handleStartNew} />;
  }

  return (
    <div className="space-y-6">
       <div className="p-4 text-center bg-red-900/10 border border-red-500/20 rounded-lg text-sm text-red-300">
            <strong className="font-bold text-red-200">Welcome to the Scene Studio (Beta)</strong><br/>
            Enter a short script, and our AI Director will generate a full scene with consistent characters and voices. Character consistency is a complex challenge, and results may vary.
        </div>
      <div>
        <label htmlFor="script-input" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Your Screenplay
        </label>
        <textarea
          id="script-input"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder={`INT. COFFEE SHOP - DAY\n\nSunlight streams in. ANNA (20s) sips her coffee, looking thoughtful.\n\nMARK (40s) approaches her table.\n\nMARK\nIs this seat taken?\n\nANNA\n(Smiling)\nIt is now.`}
          className="w-full h-64 p-3 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition-colors duration-300 resize-y font-mono"
          disabled={isLoading}
        />
      </div>
      <div className="pt-4">
        <button
          onClick={handleGenerateScene}
          disabled={isLoading || !script.trim()}
          className="w-full px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-orange-600 to-red-500 rounded-lg hover:from-orange-700 hover:to-red-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <Spinner className="w-6 h-6" />
              <span>Generating...</span>
            </>
          ) : (
            'Generate Scene'
          )}
        </button>
      </div>
      {error && <p className="text-red-500 dark:text-red-400 text-sm text-center mt-4">{error}</p>}
    </div>
  );
};

export default SceneGenerator;
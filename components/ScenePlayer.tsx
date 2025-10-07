
import React, { useState, useEffect, useRef } from 'react';
import { GeneratedShot } from '../types';
import Spinner from './Spinner';

interface ScenePlayerProps {
  scene: GeneratedShot[];
  onStartNew: () => void;
}

const ScenePlayer: React.FC<ScenePlayerProps> = ({ scene, onStartNew }) => {
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentShot = scene[currentShotIndex];
  
  // Effect to handle video playback and TTS
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !currentShot) return;

    // Load the new video source
    videoElement.src = currentShot.videoUrl;
    videoElement.load();
    
    const playVideo = () => {
      videoElement.play().catch(e => console.error("Video play failed:", e));
      speakDialogue();
    }
    
    // An event listener to play as soon as the video can be played.
    videoElement.addEventListener('canplay', playVideo);

    const speakDialogue = () => {
        if (currentShot.dialogue && currentShot.character?.voiceURI) {
            window.speechSynthesis.cancel(); // Cancel any previous speech
            const utterance = new SpeechSynthesisUtterance(currentShot.dialogue.line);
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.voiceURI === currentShot.character!.voiceURI);
            if (voice) {
                utterance.voice = voice;
            }
            window.speechSynthesis.speak(utterance);
        }
    };

    // Handler to move to the next shot when the current one ends
    const handleVideoEnded = () => {
      if (currentShotIndex < scene.length - 1) {
        setCurrentShotIndex(currentShotIndex + 1);
      } else {
        setIsPlaying(false); // Scene finished
      }
    };
    
    videoElement.addEventListener('ended', handleVideoEnded);

    return () => {
      videoElement.removeEventListener('canplay', playVideo);
      videoElement.removeEventListener('ended', handleVideoEnded);
      window.speechSynthesis.cancel(); // Stop any speech on cleanup
    };
  }, [currentShot, currentShotIndex, scene.length]);

  const handleThumbnailClick = (index: number) => {
    setCurrentShotIndex(index);
    setIsPlaying(true);
  };

  if (!currentShot) {
    return <div className="text-center p-8">Error: Scene data is missing.</div>;
  }

  return (
    <div className="space-y-4 animate-[fadeIn_0.5s_ease-in-out]">
      <div className="relative aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden">
        <video ref={videoRef} key={currentShot.videoUrl} muted autoPlay playsInline className="max-w-full max-h-full object-contain" />
      </div>
      
      <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
        <p className="font-semibold text-gray-800 dark:text-gray-200">
            Shot {currentShot.shotNumber}: <span className="text-gray-600 dark:text-gray-400 font-normal">{currentShot.description}</span>
        </p>
        {currentShot.dialogue && (
             <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                <strong className="text-gray-700 dark:text-gray-100">{currentShot.dialogue.character}:</strong> "{currentShot.dialogue.line}"
             </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Scene Timeline</h3>
        <div className="flex items-center gap-3 overflow-x-auto p-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
            {scene.map((shot, index) => (
                <button 
                    key={shot.shotNumber} 
                    onClick={() => handleThumbnailClick(index)}
                    className={`relative w-28 h-16 flex-shrink-0 bg-black rounded-md overflow-hidden ring-2 transition-all ${currentShotIndex === index ? 'ring-red-500 scale-105' : 'ring-transparent hover:ring-red-500/50'}`}
                >
                    <video src={shot.videoUrl} muted className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30"></div>
                    <span className="absolute bottom-1 right-1 text-xs font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">
                        #{shot.shotNumber}
                    </span>
                </button>
            ))}
        </div>
      </div>
      
      <div className="pt-4">
        <button onClick={onStartNew} className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-semibold">
          Create New Scene
        </button>
      </div>
    </div>
  );
};

export default ScenePlayer;
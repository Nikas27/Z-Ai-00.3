import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NarrationSettings } from '../types';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';

interface NarratorControlsProps {
  settings: NarrationSettings;
  onNarrationChange: (settings: NarrationSettings) => void;
  disabled: boolean;
}

const GenderButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    disabled: boolean;
}> = ({ label, isActive, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-1 text-sm rounded-md transition-colors font-medium ${
            isActive
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        } disabled:opacity-50`}
    >
        {label}
    </button>
);

// --- START: Greatly Expanded Voice Filtering Logic ---

// Expanded keywords in multiple languages for better gender matching.
const MALE_KEYWORDS = [
    'male', 'man', 'homme', 'hombre', 'mann', 'mężczyzna', 'homem', 
    'männlich', 'masculino', 'voix masculine', 'męski'
];
const FEMALE_KEYWORDS = [
    'female', 'woman', 'femme', 'mujer', 'frau', 'kobieta', 'mulher', 
    'weiblich', 'femenino', 'femenina', 'voix féminine', 'żeński'
];

// A more comprehensive list of common names used in TTS voices across different platforms and languages.
const MALE_NAMES = [
    // English
    'aaron', 'alex', 'arthur', 'daniel', 'david', 'george', 'james', 'kevin', 'lee', 'mark', 
    'oliver', 'ryan', 'rishi', 'sam', 'tom', 'william',
    // Spanish
    'alejandro', 'antonio', 'carlos', 'diego', 'enrique', 'fernando', 'javier', 'jorge', 'josé', 
    'juan', 'miguel', 'pablo', 'raul', 'rodrigo', 'sergio',
    // French
    'antoine', 'etienne', 'hugo', 'louis', 'luca', 'nicolas', 'paul', 'philippe', 'thomas',
    // German
    'andreas', 'hans', 'klaus', 'markus', 'michael', 'stephan', 'yannick',
    // Italian
    'alessandro', 'fabio', 'giovanni', 'luca', 'marco', 'paolo', 'simone', 'vittorio',
    // Japanese
    'ichiro', 'otojirou',
    // Russian
    'dimitri', 'ivan', 'maxim', 'yuri',
    // Polish
    'krzysztof', 'mateusz', 'piotr',
    // Portuguese
    'felipe', 'joão', 'lucas', 'pedro', 'tiago',
    // Chinese
    'yunfeng', 'yunxi', 'yunyang'
];
const FEMALE_NAMES = [
    // English
    'allison', 'ava', 'catherine', 'charlotte', 'claire', 'emily', 'fiona', 'hazel', 'joanna', 
    'karen', 'kate', 'lauren', 'mia', 'moira', 'samantha', 'serena', 'stephanie', 'susan', 'tessa', 'zira',
    // Spanish
    'camila', 'carmen', 'elena', 'elvira', 'isabel', 'isabella', 'laura', 'lucia', 'marisol', 
    'monica', 'paulina', 'sabina', 'sofia', 'valentina',
    // French
    'alice', 'amelie', 'camille', 'chantal', 'claire', 'chloé', 'léa', 'manon', 'marie',
    // German
    'anna', 'helga', 'julia', 'katja', 'nicole', 'petra', 'sabine', 'steffi',
    // Italian
    'alice', 'chiara', 'elisa', 'francesca', 'giulia', 'laura', 'paola', 'sofia',
    // Japanese
    'kyoko', 'sakura', 'yumi',
    // Russian
    'ekaterina', 'milena', 'olga', 'svetlana',
    // Polish
    'agnieszka', 'ewa', 'katarzyna', 'zofia',
    // Portuguese
    'ana', 'camila', 'isabela', 'joana', 'maria',
    // Chinese
    'hui', 'xiaoxiao', 'xiaoyou'
];

const MALE_HINTS = [...MALE_KEYWORDS, ...MALE_NAMES];
const FEMALE_HINTS = [...FEMALE_KEYWORDS, ...FEMALE_NAMES];

// Helper function for more accurate matching. It checks for whole words.
const hasWord = (text: string, word: string): boolean => {
    // Creates a regular expression to match the word as a whole word, case-insensitive.
    // \b is a word boundary.
    return new RegExp(`\\b${word}\\b`, 'i').test(text);
};

// --- END: Greatly Expanded Voice Filtering Logic ---


const NarratorControls: React.FC<NarratorControlsProps> = ({ settings, onNarrationChange, disabled }) => {
  const { plan } = useSubscriptionContext();
  const isPro = plan === 'pro';
  
  const { isEnabled, mode, text, voiceURI, volume, pitch, rate, audioUrl } = settings;

  // Local state for UI and browser-derived data
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Centralized cleanup for the audio blob URL.
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Effect to load browser voices. Runs once on mount.
  useEffect(() => {
    let isMounted = true;
    const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (isMounted && availableVoices.length > 0) {
            setVoices(availableVoices);
            // Once loaded, we can remove the listener.
            window.speechSynthesis.onvoiceschanged = null;
        }
    };
    
    // Attempt to load voices immediately.
    loadVoices();
    // If they aren't ready, set a listener.
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => { 
        isMounted = false;
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const isPremiumVoice = (voice: SpeechSynthesisVoice): boolean => {
    const name = voice.name.toLowerCase();
    return name.includes('google') || name.includes('microsoft') || name.includes('neural') || name.includes('studio') || name.includes('premium');
  };

  const filteredVoices = useMemo(() => {
    if (genderFilter === 'all') {
      return voices;
    }
    return voices.filter(voice => {
      const name = voice.name;
      const hasMaleHint = MALE_HINTS.some(hint => hasWord(name, hint));
      const hasFemaleHint = FEMALE_HINTS.some(hint => hasWord(name, hint));

      if (genderFilter === 'male') return hasMaleHint && !hasFemaleHint;
      if (genderFilter === 'female') return hasFemaleHint && !hasMaleHint;
      return false;
    });
  }, [voices, genderFilter]);

  // Effect to set a default voice or update it if the filter changes.
  useEffect(() => {
    if (voices.length === 0) return; // Wait for voices to load.

    const isSelectedVoiceValid = filteredVoices.some(v => v.voiceURI === voiceURI);
    
    // If no voice is selected, or the selected one is now filtered out, pick a new one.
    if ((!voiceURI && filteredVoices.length > 0) || !isSelectedVoiceValid) {
        // Filter out premium voices if user is free
        const usableVoices = isPro ? filteredVoices : filteredVoices.filter(v => !isPremiumVoice(v));
        
        if (usableVoices.length === 0) {
            if (voiceURI) {
                 // FIX: Pass a NarrationSettings object instead of an updater function to match prop type.
                 onNarrationChange({ ...settings, voiceURI: null });
            }
            return;
        }

        const newVoice = usableVoices.find(v => v.default) || usableVoices[0];
        if (newVoice) {
            // FIX: Pass a NarrationSettings object instead of an updater function to match prop type.
            onNarrationChange({ ...settings, voiceURI: newVoice.voiceURI });
        }
    }
    // FIX: Add `settings` to dependency array as it's used in the effect.
  }, [voices, filteredVoices, voiceURI, onNarrationChange, isPro, settings]);


  const handlePreviewTTS = useCallback(() => {
    if (!text || !voiceURI || !isEnabled) return;
    window.speechSynthesis.cancel(); // Cancel any ongoing speech first
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.voiceURI === voiceURI);
    if (voice) {
        utterance.voice = voice;
    }
    utterance.volume = volume;
    utterance.pitch = pitch;
    utterance.rate = rate;
    // Use a small timeout to help with race conditions in some browsers
    setTimeout(() => window.speechSynthesis.speak(utterance), 100);
  }, [text, voiceURI, volume, pitch, rate, voices, isEnabled]);

  const handleAudioFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newUrl = URL.createObjectURL(file);
      onNarrationChange({ ...settings, audioUrl: newUrl });
    }
  }, [onNarrationChange, settings]);

  const handleClearAudio = useCallback(() => {
    onNarrationChange({ ...settings, audioUrl: null });
    if (audioInputRef.current) {
        audioInputRef.current.value = '';
    }
  }, [onNarrationChange, settings]);
  
  const voiceGroups = useMemo(() => {
    const groups: Record<string, SpeechSynthesisVoice[]> = {};
    filteredVoices.forEach((voice) => {
        const langTag = voice.lang || 'Unknown';
        let groupName = langTag;
        try {
            const locale = new Intl.Locale(langTag);
            const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(locale.language || langTag);
            const regionName = locale.region ? new Intl.DisplayNames(['en'], { type: 'region' }).of(locale.region) : null;
            groupName = regionName ? `${langName} (${regionName})` : (langName || langTag);
        } catch (e) {
            groupName = langTag;
        }

        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(voice);
    });
    
    const sortedGroups: Record<string, SpeechSynthesisVoice[]> = {};
    Object.keys(groups).sort().forEach(key => {
        sortedGroups[key] = groups[key];
    });
    return sortedGroups;
  }, [filteredVoices]);


  return (
    <div className={`flex flex-col gap-4 p-4 border rounded-lg transition-all duration-300 ${isEnabled ? 'border-green-500/50 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50'}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Narrator Assistant</h3>
            </div>
            <label htmlFor="narrator-toggle" className="flex items-center cursor-pointer">
                <span className="mr-3 text-gray-700 dark:text-gray-300 text-sm">Enable</span>
                <div className="relative">
                    <input id="narrator-toggle" type="checkbox" checked={isEnabled} onChange={(e) => onNarrationChange({ ...settings, isEnabled: e.target.checked })} className="sr-only" disabled={disabled} />
                    <div className="block bg-gray-300 dark:bg-gray-600 w-14 h-8 rounded-full"></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isEnabled ? 'translate-x-full bg-green-400' : ''}`}></div>
                </div>
            </label>
        </div>

        {isEnabled && (
            <div className='flex flex-col gap-4 animate-[fadeIn_0.3s_ease-in-out]'>
                 <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                    <button onClick={() => onNarrationChange({ ...settings, mode: 'tts' })} disabled={disabled} className={`w-1/2 p-2 rounded-md transition-colors text-sm ${mode === 'tts' ? 'bg-green-500 text-white font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} disabled:opacity-50`}>Text-to-Speech</button>
                    <button onClick={() => onNarrationChange({ ...settings, mode: 'upload' })} disabled={disabled} className={`w-1/2 p-2 rounded-md transition-colors text-sm ${mode === 'upload' ? 'bg-green-500 text-white font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'} disabled:opacity-50`}>Upload Audio</button>
                </div>

                {mode === 'tts' && (
                    <div className='flex flex-col gap-3'>
                        <textarea
                            value={text}
                            onChange={(e) => onNarrationChange({ ...settings, text: e.target.value })}
                            placeholder="Enter text for the narrator to speak..."
                            className="w-full h-24 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-300 resize-none"
                            disabled={disabled}
                        />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Voice Gender:</span>
                                    <GenderButton label="All" isActive={genderFilter === 'all'} onClick={() => setGenderFilter('all')} disabled={disabled} />
                                    <GenderButton label="Male" isActive={genderFilter === 'male'} onClick={() => setGenderFilter('male')} disabled={disabled} />
                                    <GenderButton label="Female" isActive={genderFilter === 'female'} onClick={() => setGenderFilter('female')} disabled={disabled} />
                                </div>
                                <select value={voiceURI || ''} onChange={e => onNarrationChange({ ...settings, voiceURI: e.target.value })} disabled={disabled || filteredVoices.length === 0} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none">
                                    {filteredVoices.length === 0 && <option>No {genderFilter !== 'all' ? genderFilter : ''} voices found</option>}
                                    {Object.keys(voiceGroups).map((groupName) => (
                                        <optgroup label={groupName} key={groupName}>
                                            {voiceGroups[groupName].map(voice => {
                                                const premium = isPremiumVoice(voice);
                                                const canUse = isPro || !premium;
                                                return (
                                                    <option key={voice.voiceURI} value={voice.voiceURI} disabled={!canUse}>
                                                        {voice.name} {premium ? '(Premium ✨)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <button type="button" onClick={handlePreviewTTS} disabled={disabled || !text} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed self-end">Preview Voice</button>
                         </div>
                    </div>
                )}
                {mode === 'upload' && (
                     <div className="text-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        {!audioUrl ? (
                            <>
                                <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioFileChange} className="hidden" id="audio-upload" disabled={disabled} />
                                <label htmlFor="audio-upload" className={`cursor-pointer text-green-500 dark:text-green-400 font-semibold ${disabled ? 'cursor-not-allowed text-gray-500' : ''}`}>Choose an audio file</label>
                                <p className="text-xs text-gray-500 mt-1">MP3, WAV, OGG, etc.</p>
                            </>
                        ) : (
                            <div className='flex items-center justify-between'>
                                <p className='text-sm text-gray-700 dark:text-gray-300 truncate'>Audio ready for playback.</p>
                                <button onClick={handleClearAudio} disabled={disabled} className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50">Remove</button>
                            </div>
                        )}
                    </div>
                )}
                 
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700/50 mt-2 ${mode === 'upload' ? 'hidden' : ''}`}>
                    <div>
                        <label htmlFor="speed" className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Speed
                            {!isPro && <span className="text-xs font-bold text-purple-500 bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 rounded-full">PRO</span>}
                        </label>
                        <input type="range" id="speed" min="0.5" max="2" step="0.1" value={rate} onChange={e => onNarrationChange({ ...settings, rate: parseFloat(e.target.value) })} disabled={disabled || !isPro} className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500 disabled:opacity-50" />
                    </div>
                    <div>
                        <label htmlFor="pitch" className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Pitch
                            {!isPro && <span className="text-xs font-bold text-purple-500 bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 rounded-full">PRO</span>}
                        </label>
                        <input type="range" id="pitch" min="0.5" max="2" step="0.1" value={pitch} onChange={e => onNarrationChange({ ...settings, pitch: parseFloat(e.target.value) })} disabled={disabled || !isPro} className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500 disabled:opacity-50" />
                    </div>
                     <div>
                        <label htmlFor="volume" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Volume</label>
                        <input type="range" id="volume" min="0" max="1" step="0.05" value={volume} onChange={e => onNarrationChange({ ...settings, volume: parseFloat(e.target.value)})} disabled={disabled} className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500" />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default NarratorControls;

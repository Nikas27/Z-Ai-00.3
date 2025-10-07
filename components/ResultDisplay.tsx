import React from 'react';
import { GeneratorMode } from '../types';
import { databaseService } from '../services/databaseService';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { useToast } from '../contexts/ToastContext';
import { useUserActivityContext } from '../contexts/UserActivityContext';

interface ResultDisplayProps {
  type: GeneratorMode;
  dataUrl: string;
  prompt: string;
  onGenerateVariation: () => void;
  onRefine: () => void;
  onStartOver: () => void;
}

const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string, className?: string }> = ({ onClick, icon, label, className }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-2 p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors duration-200 ${className}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);


const ResultDisplay: React.FC<ResultDisplayProps> = ({ type, dataUrl, prompt, onGenerateVariation, onRefine, onStartOver }) => {
    const { currentUser, plan } = useSubscriptionContext();
    const showToast = useToast();
    const { logActivity } = useUserActivityContext();

    const handleDownload = () => {
        const fileExtension = type === GeneratorMode.IMAGE ? 'png' : 'mp4';
        const cleanPrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${cleanPrompt || 'generated'}.${fileExtension}`;
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSave = () => {
        if (!currentUser || plan !== 'pro') {
            showToast('info', 'Pro Feature', 'Saving designs is available for Pro members.');
            return;
        }

        const newDesign = {
            id: `design-${Date.now()}`,
            userId: currentUser.id,
            type,
            prompt,
            createdAt: new Date().toISOString(),
            resultDataUrl: dataUrl,
        };

        databaseService.addDesign(newDesign);
        
        logActivity({
            type: 'design',
            userId: currentUser.id,
            userEmail: currentUser.email,
            details: `saved a new ${type}`,
        });
        
        showToast('success', 'Design Saved', 'Your design has been saved to "My Designs".');
    };

    return (
        <div className="space-y-4 animate-[fadeIn_0.5s_ease-in-out]">
            <div className="relative aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden">
                {type === GeneratorMode.IMAGE ? (
                    <img src={dataUrl} alt={prompt} className="max-w-full max-h-full object-contain" />
                ) : (
                    <video src={dataUrl} controls autoPlay loop className="max-w-full max-h-full object-contain" />
                )}
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                <p className="font-semibold text-gray-800 dark:text-gray-200">Your Prompt:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{prompt}</p>
            </div>
            
            <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
              <h3 className="font-semibold text-center mb-3 text-gray-800 dark:text-gray-200">Next Steps</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ActionButton 
                    onClick={onGenerateVariation}
                    label="Generate Variation"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5"/></svg>}
                  />
                  <ActionButton 
                    onClick={onRefine}
                    label="Refine Prompt"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"/></svg>}
                  />
                   <ActionButton 
                    onClick={onStartOver}
                    label="Start Over"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>}
                  />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={handleSave} className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" disabled={plan !== 'pro'}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12l-5-3-5 3V4z" /></svg>
                    Save to My Designs
                </button>
                <button onClick={handleDownload} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Download
                </button>
            </div>
        </div>
    );
};

export default ResultDisplay;

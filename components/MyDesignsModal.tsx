
import React, { useState, useEffect, useMemo } from 'react';
import { Design, GeneratorMode } from '../types';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { databaseService } from '../services/databaseService';
import Spinner from './Spinner';
import { dataURLtoFile } from '../utils/fileUtils';

interface MyDesignsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DetailView: React.FC<{ design: Design; onBack: () => void }> = ({ design, onBack }) => {
    
    const handleDownload = () => {
        const fileExtension = design.type === 'image' ? 'png' : 'mp4';
        const cleanPrompt = design.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${cleanPrompt || 'generated'}.${fileExtension}`;
        const link = document.createElement('a');
        link.href = design.resultDataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(design.prompt);
    };

    return (
        <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
            <div className="flex-shrink-0 mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Back to Gallery
                </button>
            </div>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto">
                <div className="flex items-center justify-center bg-black/30 rounded-lg">
                    {design.type === GeneratorMode.IMAGE ? (
                        <img src={design.resultDataUrl} alt={design.prompt} className="max-w-full max-h-full object-contain rounded-md" />
                    ) : (
                        <video src={design.resultDataUrl} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-md" />
                    )}
                </div>
                <div className="flex flex-col gap-4 text-gray-300">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase">Prompt</h3>
                        <p className="mt-1 p-3 bg-gray-800/50 rounded-md text-base">{design.prompt}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase">Details</h3>
                        <p className="mt-1 text-base">Type: <span className="font-medium capitalize">{design.type}</span></p>
                        <p className="text-base">Created: <span className="font-medium">{new Date(design.createdAt).toLocaleString()}</span></p>
                    </div>
                    <div className="flex items-center gap-3 mt-auto pt-4">
                        <button onClick={handleCopyPrompt} className="flex-1 px-4 py-2 bg-gray-700/80 hover:bg-gray-700 rounded-md transition-colors">Copy Prompt</button>
                        <button onClick={handleDownload} className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors">Download</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const MyDesignsModal: React.FC<MyDesignsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useSubscriptionContext();
  const [allDesigns, setAllDesigns] = useState<Design[]>([]);
  const [filter, setFilter] = useState<GeneratorMode | 'all'>('all');
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      const userDesigns = databaseService.getAllDesigns()
        .filter(d => d.userId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllDesigns(userDesigns);
    } else {
        // Reset when closed
        setAllDesigns([]);
        setSelectedDesign(null);
        setFilter('all');
    }
  }, [isOpen, currentUser]);

  const filteredDesigns = useMemo(() => {
    if (filter === 'all') return allDesigns;
    return allDesigns.filter(d => d.type === filter);
  }, [allDesigns, filter]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-in-out]" onClick={onClose}>
      <div className="bg-gray-900/80 border border-gray-700 text-white rounded-xl shadow-2xl w-full max-w-6xl m-4 h-[90vh] transform transition-all duration-300 animate-[slideInUp_0.3s_ease-out] flex flex-col p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
        {selectedDesign ? (
            <DetailView design={selectedDesign} onBack={() => setSelectedDesign(null)} />
        ) : (
            <>
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                <h2 className="text-2xl font-bold">My Designs</h2>
                <div className="flex items-center gap-2 p-1 bg-gray-800/50 rounded-lg">
                    {/* FIX: Use GeneratorMode enum members to ensure type correctness with the filter state. */}
                    {(['all', GeneratorMode.IMAGE, GeneratorMode.VIDEO] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === f ? 'bg-cyan-600 text-white' : 'hover:bg-gray-700'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}s</button>
                    ))}
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2">
                {filteredDesigns.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredDesigns.map(design => (
                        <div key={design.id} className="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer animate-[fadeIn_0.5s_ease-out]" onClick={() => setSelectedDesign(design)}>
                        {design.type === GeneratorMode.IMAGE ? (
                            <img src={design.resultDataUrl} alt={design.prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        ) : (
                            <video src={design.resultDataUrl} loop muted className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                            <p className="text-xs text-white truncate">{design.prompt}</p>
                        </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <p>No designs found.</p>
                        <p className="text-sm">Start creating to see your gallery here!</p>
                    </div>
                )}
            </div>
            </>
        )}
      </div>
    </div>
  );
};

export default MyDesignsModal;
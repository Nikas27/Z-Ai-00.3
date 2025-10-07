import React from 'react';
import WorldMap from './WorldMap';
import { useLiveUserContext } from '../contexts/LiveUserContext';

interface LiveUserMapModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LiveUserMapModal: React.FC<LiveUserMapModalProps> = ({ isOpen, onClose }) => {
    const { usersByCountry } = useLiveUserContext();

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-in-out]"
            onClick={onClose}
        >
            <div 
                className="bg-white/10 dark:bg-gray-900/50 rounded-xl shadow-2xl w-full max-w-6xl m-4 h-[85vh] transform transition-all duration-300 animate-[slideInUp_0.3s_ease-out] flex flex-col p-4 md:p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                     <h2 className="text-xl font-bold text-white">
                        Live Global Activity
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-300 hover:text-white transition"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-grow overflow-hidden">
                     <WorldMap usersByCountry={usersByCountry} />
                </div>
            </div>
        </div>
    );
};

export default LiveUserMapModal;

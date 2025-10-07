import React from 'react';
import LiveUserTracker from './LiveUserTracker';
import LiveUserMapModal from './LiveUserMapModal';

interface FooterProps {
    isMapOpen: boolean;
    setIsMapOpen: (isOpen: boolean) => void;
}

const Footer: React.FC<FooterProps> = ({ isMapOpen, setIsMapOpen }) => {
    return (
        <>
            <footer className="container mx-auto p-4 md:p-6 lg:p-8 mt-auto border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} Z-Ai. All rights reserved.</p>
                    <button 
                        onClick={() => setIsMapOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="View live user map"
                    >
                        <LiveUserTracker mode="compact" />
                    </button>
                </div>
            </footer>
            <LiveUserMapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />
        </>
    );
};

export default Footer;
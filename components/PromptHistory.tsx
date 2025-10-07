import React, { useState, useEffect, useRef } from 'react';

const HISTORY_KEY = 'z-ai-prompt-history';
export const MAX_HISTORY_SIZE = 10;

export const addPromptToHistory = (prompt: string) => {
    if (!prompt || prompt.trim().length < 5) return;
    const trimmedPrompt = prompt.trim();
    try {
        const rawHistory = localStorage.getItem(HISTORY_KEY);
        const history = rawHistory ? JSON.parse(rawHistory) : [];
        // Remove existing entry to move it to the top
        const filteredHistory = history.filter((p: string) => p.toLowerCase() !== trimmedPrompt.toLowerCase());
        const newHistory = [trimmedPrompt, ...filteredHistory].slice(0, MAX_HISTORY_SIZE);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
        console.error("Failed to update prompt history", e);
    }
};

interface PromptHistoryProps {
  onSelect: (prompt: string) => void;
}

const PromptHistory: React.FC<PromptHistoryProps> = ({ onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            try {
                const rawHistory = localStorage.getItem(HISTORY_KEY);
                setHistory(rawHistory ? JSON.parse(rawHistory) : []);
            } catch (e) {
                setHistory([]);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (prompt: string) => {
        onSelect(prompt);
        setIsOpen(false);
    };
    
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        localStorage.removeItem(HISTORY_KEY);
        setHistory([]);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors"
                aria-label="Prompt history"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 animate-[fadeIn_0.1s_ease-out]">
                    <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent Prompts</p>
                        {history.length > 0 && <button onClick={handleClear} className="text-xs text-red-500 hover:underline">Clear</button>}
                    </div>
                    <ul className="py-1 max-h-60 overflow-y-auto">
                        {history.length > 0 ? history.map((p, i) => (
                            <li key={i}>
                                <button onClick={() => handleSelect(p)} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 truncate" title={p}>
                                    {p}
                                </button>
                            </li>
                        )) : <p className="px-3 py-4 text-center text-sm text-gray-500">No history yet.</p>}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PromptHistory;

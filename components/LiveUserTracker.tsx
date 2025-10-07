import React, { useState, useEffect, useRef } from 'react';
import { useLiveUserContext } from '../contexts/LiveUserContext';

interface LiveUserTrackerProps {
    mode: 'compact' | 'full';
}

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValueRef = useRef(value);

    useEffect(() => {
        const startValue = prevValueRef.current;
        const endValue = value;
        const duration = 500; // Animation duration in ms
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            const nextValue = Math.floor(startValue + (endValue - startValue) * percentage);
            setDisplayValue(nextValue);

            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(endValue);
                prevValueRef.current = endValue;
            }
        };

        requestAnimationFrame(animate);

    }, [value]);

    return <>{displayValue.toLocaleString()}</>;
};


const LiveUserTracker: React.FC<LiveUserTrackerProps> = ({ mode }) => {
    const { liveUserCount, usersByCountry } = useLiveUserContext();

    if (mode === 'compact') {
        return (
            <div className="flex items-center gap-2 text-center text-sm text-gray-500 dark:text-gray-400">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span>
                    <strong className="font-semibold text-gray-700 dark:text-gray-200 mx-1"><AnimatedCounter value={liveUserCount} /></strong> Users Online from 
                    <strong className="font-semibold text-gray-700 dark:text-gray-200 mx-1">{usersByCountry.length}</strong> Countries
                </span>
            </div>
        );
    }
    
    // Full mode for Admin Dashboard
    return (
        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-md">
            <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Users Online</h4>
            <p className="text-3xl font-bold text-gray-900 dark:text-white transition-all duration-300">
                <AnimatedCounter value={liveUserCount} />
            </p>
            <div className="space-y-2 mt-3 text-sm h-48 overflow-y-auto pr-2">
                {usersByCountry.map(c => (
                    <div key={c.name} className="flex items-center justify-between gap-2 animate-[fadeIn_0.5s_ease-out]">
                        <div className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span className="text-gray-600 dark:text-gray-300">{c.name}</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-100 transition-all duration-300">
                            <AnimatedCounter value={c.count} />
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveUserTracker;
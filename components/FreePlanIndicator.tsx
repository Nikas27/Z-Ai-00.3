import React from 'react';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';

interface CreditMeterProps {
    label: string;
    value: number;
    max: number;
    icon: React.ReactNode;
}

const CreditMeter: React.FC<CreditMeterProps> = ({ label, value, max, icon }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{value} / {max}</span>
            </div>
            <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

interface FreePlanIndicatorProps {
    onUpgradeClick: () => void;
}

const FreePlanIndicator: React.FC<FreePlanIndicatorProps> = ({ onUpgradeClick }) => {
    const { plan, credits, tierCreditLimits } = useSubscriptionContext();

    if (plan === 'pro') {
        return null;
    }

    return (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg animate-[fadeIn_0.5s_ease-in-out]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-3">
                    <CreditMeter 
                        label="Image Generations" 
                        value={credits.image} 
                        max={tierCreditLimits.image} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500 dark:text-cyan-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>}
                    />
                    <CreditMeter 
                        label="Video Animations" 
                        value={credits.video} 
                        max={tierCreditLimits.video} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500 dark:text-cyan-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>}
                    />
                     <CreditMeter 
                        label="Watermark-Free Exports" 
                        value={credits.noWatermark} 
                        max={tierCreditLimits.noWatermark} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l3.59 3.59M21 21L3 3" /></svg>}
                    />
                </div>
                <div className="flex flex-col items-center justify-center bg-gray-200/50 dark:bg-gray-900/50 p-4 rounded-md text-center">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">You are on the Free Plan</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">Unlock unlimited generations and remove all watermarks by upgrading.</p>
                    <button 
                        onClick={onUpgradeClick}
                        className="w-full max-w-xs px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-md hover:from-purple-600 hover:to-cyan-600 transition-all shadow-md"
                    >
                        Upgrade to Pro
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FreePlanIndicator;
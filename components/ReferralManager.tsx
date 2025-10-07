import React, { useState, useEffect, useMemo } from 'react';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { TokenTransaction } from '../types';
import { databaseService } from '../services/databaseService';
import { useToast } from '../contexts/ToastContext';

// Helper components
const StatBox: React.FC<{ value: string; label: string; icon: React.ReactNode }> = ({ value, label, icon }) => (
    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex-1">
        <div className="text-3xl mx-auto w-fit mb-2 text-cyan-500">{icon}</div>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
);

const SocialShareButton: React.FC<{ network: 'twitter' | 'whatsapp' | 'email', link: string }> = ({ network, link }) => {
    const text = "Join me on Z-Ai and get free credits to create amazing AI images and videos!";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + link)}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent("Invitation to Z-Ai")}&body=${encodeURIComponent(text + '\n\n' + link)}`;

    const ICONS = {
        twitter: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.67.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.22-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21c7.35 0 11.37-6.08 11.37-11.37 0-.17 0-.34-.01-.51.78-.57 1.45-1.28 1.98-2.08z"></path></svg>,
        whatsapp: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M20.1 3.9C17.9 1.7 15 .5 12 .5 5.8.5.7 5.6.7 11.9c0 2 .5 3.9 1.5 5.6L.6 23.4l6-1.6c1.6.9 3.5 1.5 5.4 1.5h.1c6.3 0 11.4-5.1 11.4-11.4-.1-2.8-1.2-5.7-3.3-7.8zM12 21.4c-1.7 0-3.3-.5-4.8-1.3l-.4-.2-3.5 1 1-3.4L4 17c-1-1.5-1.5-3.2-1.5-5.1 0-5.2 4.2-9.4 9.4-9.4 2.5 0 4.9 1 6.7 2.8 1.8 1.8 2.8 4.2 2.8 6.7-.1 5.2-4.3 9.4-9.5 9.4zm5.1-7.1c-.3-.1-1.7-.9-1.9-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1s-1.2-.5-2.3-1.4c-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6s.3-.3.4-.5c.2-.1.3-.3.4-.5.1-.2 0-.4 0-.5C10 9 9.3 7.6 9 7c-.3-.5-.6-.6-.8-.6s-.6-.1-1-.1-1.1.2-1.6.7c-.5.5-.9 1.1-1.2 1.8-.3.7-.4 1.4-.4 2.1 0 .8.2 1.5.3 2.1.1.6 1.3 3.3 4.2 5.9 3.5 3.1 4.2 2.8 5 2.6.8-.2 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.3-.3-.4-.6-.5z"></path></svg>,
        email: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path></svg>,
    };
    const urls = { twitter: twitterUrl, whatsapp: whatsappUrl, email: emailUrl };

    return (
        <a href={urls[network]} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors">
            <div className="w-5 h-5">{ICONS[network]}</div>
        </a>
    );
};


const ReferralManager: React.FC = () => {
    const { referralCode, currentUser } = useSubscriptionContext();
    const [isCopied, setIsCopied] = useState(false);
    const [allUserTransactions, setAllUserTransactions] = useState<TokenTransaction[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'signup' | 'upgrade'>('all');
    const showToast = useToast();

    useEffect(() => {
        if (currentUser) {
            const transactions = databaseService.getTokenTransactionsByUserId(currentUser.id);
            setAllUserTransactions(transactions);
        }
    }, [currentUser]);

    const referralLink = `${window.location.origin}${window.location.pathname}?ref=${referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const parseReferredUser = (description: string): string => {
        const match = description.match(/user (.*)/i);
        const email = match ? match[1] : 'A user';
        // Basic email masking
        if (email.includes('@')) {
            return email.replace(/(?<=.{2}).(?=[^@]*?@)/g, "*");
        }
        return email;
    };

    const filteredTransactions = useMemo(() => {
        const refTransactions = allUserTransactions.filter(
            t => t.type === 'earn_referral_signup' || t.type === 'earn_referral_upgrade'
        );
        if (activeTab === 'all') return refTransactions;
        return refTransactions.filter(t => t.type.includes(activeTab));
    }, [activeTab, allUserTransactions]);

    const signupsCount = useMemo(() => allUserTransactions.filter(t => t.type === 'earn_referral_signup').length, [allUserTransactions]);
    const proUpgradesCount = useMemo(() => allUserTransactions.filter(t => t.type === 'earn_referral_upgrade').length, [allUserTransactions]);
    const tokensEarned = useMemo(() => 
        allUserTransactions
            .filter(t => t.type === 'earn_referral_signup' || t.type === 'earn_referral_upgrade')
            .reduce((acc, curr) => acc + curr.amount, 0), 
        [allUserTransactions]
    );
    const dollarValue = useMemo(() => (tokensEarned * 0.01).toFixed(2), [tokensEarned]);
    
    // Gamification Goal
    const PRO_GOAL = 5;
    const BONUS_AMOUNT = 50;
    const progressPercentage = Math.min((proUpgradesCount / PRO_GOAL) * 100, 100);

    // Effect to check for goal completion and award bonus
    useEffect(() => {
        if (!currentUser || allUserTransactions.length === 0) return;

        const hasBeenAwarded = allUserTransactions.some(
            t => t.type === 'earn_goal_bonus'
        );

        if (proUpgradesCount >= PRO_GOAL && !hasBeenAwarded) {
            databaseService.addTokenTransaction({
                userId: currentUser.id,
                type: 'earn_goal_bonus',
                amount: BONUS_AMOUNT,
                description: `Bonus for referring ${PRO_GOAL} Pro users!`,
                createdAt: new Date().toISOString(),
            });
            // Notify the user of their reward
            showToast('success', 'Goal Reached!', `You've earned a ${BONUS_AMOUNT} token bonus for referring ${PRO_GOAL} Pro users!`);
        }
    }, [proUpgradesCount, currentUser, allUserTransactions, showToast]);


    return (
        <div className="mt-8 p-4 md:p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg animate-[fadeIn_0.5s_ease-in-out] space-y-6">
            <div className="text-center">
                <h4 className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-500">
                    Invite Friends, Earn Rewards
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg mx-auto">
                    Share your unique link. You'll get <span className="font-bold text-cyan-500">1 token</span> for every friend who signs up, and a <span className="font-bold text-purple-500">10 token bonus</span> when they upgrade to Pro!
                </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                <input type="text" readOnly value={referralLink} className="flex-1 block w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md focus:outline-none border border-transparent"/>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleCopy} 
                        className={`px-4 py-2 text-sm font-medium text-white transition-colors rounded-md w-24 ${isCopied ? 'bg-green-600' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                    >
                        {isCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <SocialShareButton network="twitter" link={referralLink} />
                    <SocialShareButton network="whatsapp" link={referralLink} />
                    <SocialShareButton network="email" link={referralLink} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatBox value={signupsCount.toString()} label="Total Referrals" icon={<span>👋</span>} />
                <StatBox value={proUpgradesCount.toString()} label="Pro Upgrades" icon={<span>✨</span>} />
                <StatBox value={`${tokensEarned} 💎 ($${dollarValue})`} label="Total Earnings" icon={<span>💰</span>} />
            </div>

            <div>
                <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Goal: Refer {PRO_GOAL} Pro Users</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Reach this goal for a {BONUS_AMOUNT} token bonus!</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 text-center text-white text-xs font-bold flex items-center justify-center" style={{ width: `${progressPercentage}%` }}>
                       {progressPercentage > 15 && <span>{proUpgradesCount}/{PRO_GOAL}</span>}
                    </div>
                </div>
            </div>

            <div>
                <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Referral History</h5>
                <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-900 rounded-lg mb-3">
                    <button onClick={() => setActiveTab('all')} className={`flex-1 py-1.5 text-sm rounded-md ${activeTab === 'all' ? 'bg-white dark:bg-gray-700 shadow font-semibold text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>All</button>
                    <button onClick={() => setActiveTab('signup')} className={`flex-1 py-1.5 text-sm rounded-md ${activeTab === 'signup' ? 'bg-white dark:bg-gray-700 shadow font-semibold text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Signups</button>
                    <button onClick={() => setActiveTab('upgrade')} className={`flex-1 py-1.5 text-sm rounded-md ${activeTab === 'upgrade' ? 'bg-white dark:bg-gray-700 shadow font-semibold text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Upgrades</button>
                </div>
                <div className="space-y-2 h-40 overflow-y-auto pr-2 text-sm">
                    {filteredTransactions.length > 0 ? filteredTransactions.map(t => {
                        const isUpgrade = t.type === 'earn_referral_upgrade';
                        return (
                             <div key={t.id} className="flex justify-between items-center bg-white dark:bg-gray-800/60 p-2 px-3 rounded-md">
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{parseReferredUser(t.description)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${isUpgrade ? 'text-purple-700 bg-purple-100 dark:text-purple-200 dark:bg-purple-900/50' : 'text-cyan-700 bg-cyan-100 dark:text-cyan-200 dark:bg-cyan-900/50'}`}>
                                    +{t.amount} {isUpgrade ? '✨' : ''}
                                </span>
                            </div>
                        );
                    }) : <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-12">No activity in this category yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default ReferralManager;
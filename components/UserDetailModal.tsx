import React, { useState, useEffect } from 'react';
import { ExtendedUser, TokenTransaction, Email } from '../types';
import { emailService } from '../services/emailService';

interface UserDetailModalProps {
  user: ExtendedUser | null;
  onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string | number | null }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{value ?? 'N/A'}</span>
    </div>
);

const TransactionType: React.FC<{ type: TokenTransaction['type'] }> = ({ type }) => {
    const isEarn = type.startsWith('earn');
    const text = type.replace(/_/g, ' ').replace('earn', 'Earn:').replace('spend', 'Spend:');
    return (
        <span className={`font-semibold ${isEarn ? 'text-green-500' : 'text-red-500'}`}>
            {text}
        </span>
    );
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'tokens' | 'emails'>('details');
  const [userEmails, setUserEmails] = useState<Email[]>([]);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
        const allEmails = emailService.getSentEmails();
        const emailsForUser = allEmails
            .filter(e => e.to === user.email)
            .sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        setUserEmails(emailsForUser);
    } else {
        // Reset state when modal is closed or user is null
        setActiveTab('details');
        setUserEmails([]);
        setExpandedEmailId(null);
    }
  }, [user]);

  if (!user) return null;

  const TabButton: React.FC<{ tab: string; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg border-b-2 ${activeTab === tab ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-in-out]" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800/95 rounded-xl shadow-2xl w-full max-w-2xl m-4 transform transition-all duration-300 animate-[slideInUp_0.3s_ease-out] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.email}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${user.plan === 'pro' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>{user.plan}</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex mt-4 -mb-px">
            <TabButton tab="details" label="Details" />
            <TabButton tab="tokens" label="Tokens" />
            <TabButton tab="emails" label="Emails" />
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeIn_0.3s]">
                    <div className="space-y-2">
                        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">User Info</h4>
                        <DetailRow label="Country" value={user.country} />
                        <DetailRow label="Phone" value={user.phone} />
                        <DetailRow label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
                        <DetailRow label="Plan Expires" value={user.planExpirationDate ? new Date(user.planExpirationDate).toLocaleDateString() : 'N/A'} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">Referral Stats</h4>
                        <DetailRow label="Sponsor" value={user.referrerEmail} />
                        <DetailRow label="Free Referrals" value={user.freeReferralsCount} />
                        <DetailRow label="Pro Referrals" value={user.proReferralsCount} />
                    </div>
                </div>
            )}
            
            {activeTab === 'tokens' && (
                 <div className="animate-[fadeIn_0.3s]">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                         <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Current Balance</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{user.currentTokenBalance} 💎</p>
                         </div>
                         <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Earned</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{user.totalTokensEarned} 💎</p>
                         </div>
                    </div>
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Transaction History</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                        {user.tokenTransactions.length > 0 ? user.tokenTransactions.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                <div>
                                    <p className="text-sm capitalize"><TransactionType type={t.type} /></p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(t.createdAt).toLocaleString()}</p>
                                </div>
                                <span className={`font-bold text-sm ${t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {t.amount > 0 ? '+' : ''}{t.amount} 💎
                                </span>
                            </div>
                        )) : (
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No token transactions found.</p>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'emails' && (
                <div className="animate-[fadeIn_0.3s]">
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Sent Emails</h4>
                     <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {userEmails.length > 0 ? userEmails.map(email => (
                            <div key={email.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                <button onClick={() => setExpandedEmailId(prevId => prevId === email.id ? null : email.id)} className="w-full text-left p-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{email.subject}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(email.sentAt).toLocaleString()}</p>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${expandedEmailId === email.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                                {expandedEmailId === email.id && (
                                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                        <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans">{email.body}</pre>
                                    </div>
                                )}
                            </div>
                        )) : (
                             <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No emails have been sent to this user.</p>
                        )}
                     </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
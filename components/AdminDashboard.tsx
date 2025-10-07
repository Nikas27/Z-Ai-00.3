import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { databaseService } from '../services/databaseService';
import { User, Payment, Design, PaymentMethod, TokenTransaction, ExtendedUser } from '../types';
import { useToast } from '../contexts/ToastContext';
import LiveUserTracker from './LiveUserTracker';
import PaymentDetailModal from './PaymentDetailModal';
import PaymentMethodEditModal from './PaymentMethodEditModal';
import Spinner from './Spinner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import UserDetailModal from './UserDetailModal';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { useUserActivityContext } from '../contexts/UserActivityContext';
import { emailService } from '../services/emailService';

// --- Re-usable Components ---
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm flex items-center gap-4">
        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg text-cyan-500">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string; count?: number }> = ({ active, onClick, label, count }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg border-b-2 ${active ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
    >
        {label} {count !== undefined && <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${active ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200'}`}>{count}</span>}
    </button>
);

const statusDisplayMap = new Map<Payment['status'], { icon: React.ReactNode; className: string; text: string }>([
    ['approved', {
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
        text: 'Approved'
    }],
    ['pending', {
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
        text: 'Pending'
    }],
    ['rejected', {
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 101.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
        text: 'Rejected'
    }]
]);


// --- Main Dashboard Component ---
const AdminDashboard: React.FC = () => {
    // --- State Management ---
    const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'users' | 'settings'>('dashboard');
    
    // Data states
    const [users, setUsers] = useState<User[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [creations, setCreations] = useState<Design[]>([]);
    const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [planPrice, setPlanPrice] = useState<number>(9.99);
    
    // UI states
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    
    // Payments Tab states
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    const showToast = useToast();
    const { upgradeToPro } = useSubscriptionContext();
    const { verifyPaymentImmediately } = useUserActivityContext();

    // --- Data Fetching and Subscriptions ---
    const fetchData = useCallback(() => {
        try {
            setUsers(databaseService.getAllUsers());
            setPayments(databaseService.getAllPayments());
            setCreations(databaseService.getAllCreations());
            setTokenTransactions(databaseService.getAllTokenTransactions());
            setPaymentMethods(databaseService.getPaymentMethods());
            setPlanPrice(databaseService.getPlanPrice());
        } catch (error) {
            console.error("Failed to fetch admin data", error);
            showToast('error', 'Data Load Failed', 'Could not load data from the database.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
        databaseService.subscribe('data_changed', fetchData);
        return () => databaseService.unsubscribe('data_changed', fetchData);
    }, [fetchData]);
    
    // Effect to keep the selected user's details modal reactive to data changes
    useEffect(() => {
        if (!selectedUser) return;

        const latestUser = users.find(u => u.id === selectedUser.id);
        if (latestUser) {
            const userTokenTransactions = tokenTransactions.filter(t => t.userId === latestUser.id);
            const currentTokenBalance = userTokenTransactions.reduce((acc, t) => acc + t.amount, 0);

            // Only update if there's a meaningful change to prevent re-render loops
            if (latestUser.plan !== selectedUser.plan || currentTokenBalance !== selectedUser.currentTokenBalance) {
                const totalTokensEarned = userTokenTransactions
                    .filter(t => t.amount > 0)
                    .reduce((acc, t) => acc + t.amount, 0);
                    
                let referrerEmail: string | null = null;
                if (latestUser.referredBy) {
                    const referrer = users.find(u => u.id === latestUser.referredBy);
                    referrerEmail = referrer ? referrer.email : 'Unknown';
                }

                const referrals = users.filter(u => u.referredBy === latestUser.id);
                const freeReferralsCount = referrals.filter(r => r.plan === 'free').length;
                const proReferralsCount = referrals.filter(r => r.plan === 'pro').length;
                
                setSelectedUser({
                    ...latestUser,
                    currentTokenBalance,
                    totalTokensEarned,
                    referrerEmail,
                    tokenTransactions: userTokenTransactions,
                    freeReferralsCount,
                    proReferralsCount,
                });
            }
        } else {
            // User might have been deleted, close the modal
            setSelectedUser(null);
        }
    }, [users, tokenTransactions, selectedUser]);
    
    // --- Payment Handlers for Manual Actions ---
    const handleApprovePayment = (paymentId: string) => {
        const payment = payments.find(p => p.id === paymentId);
        const user = payment ? users.find(u => u.id === payment.userId) : null;
        if (!payment || !user) return;
        
        try {
            upgradeToPro(payment.userId, payment.tokensDebited, payment.id);
            databaseService.updatePayment(payment.id, { status: 'approved' });
            emailService.sendPaymentSuccessEmail(user, payment);
            showToast('success', 'Payment Approved', `User ${payment.userEmail} has been upgraded to Pro.`);
        } catch (error) {
            showToast('error', 'Upgrade Failed', 'There was an issue upgrading the user.');
        }
        setSelectedPayment(null);
    };

    const handleRejectPayment = (paymentId: string) => {
        const reason = window.prompt('Please provide a reason for rejection (optional):');
        const payment = payments.find(p => p.id === paymentId);
        if (!payment) return;
    
        const user = users.find(u => u.id === payment.userId);
        
        // If user is 'pro' and payment was approved, rejecting it must trigger a full reversal.
        if (user && user.plan === 'pro' && payment.status === 'approved') {
            try {
                // 1. Downgrade user
                databaseService.updateUser(user.id, {
                    plan: 'free',
                    subscriptionStartDate: null,
                    planExpirationDate: null,
                });
    
                // 2. Refund tokens if they were spent
                if (payment.tokensDebited > 0) {
                    databaseService.addTokenTransaction({
                        userId: user.id,
                        type: 'admin_grant',
                        amount: payment.tokensDebited,
                        description: `Refund for rejected/reverted Pro upgrade (Payment ID: ${payment.id.slice(-6)}).`,
                        createdAt: new Date().toISOString(),
                    });
                }
    
                // 3. Revert referrer's bonus
                if (user.referredBy) {
                    const allTxs = databaseService.getAllTokenTransactions();
                    const bonusIdentifier = `for payment ${payment.id}`;
                    const reversalIdentifier = `reversal for payment ${payment.id}`;
                    const bonusTx = allTxs.find(tx => tx.userId === user.referredBy && tx.type === 'earn_referral_upgrade' && tx.description.includes(bonusIdentifier));
                    const alreadyReverted = allTxs.some(tx => tx.userId === user.referredBy && tx.type === 'admin_grant' && tx.amount < 0 && tx.description.includes(reversalIdentifier));
                    
                    if (bonusTx && !alreadyReverted) {
                         databaseService.addTokenTransaction({
                            userId: user.referredBy,
                            type: 'admin_grant',
                            amount: -10,
                            description: `Bonus ${reversalIdentifier} reverted.`,
                            createdAt: new Date().toISOString(),
                        });
                    }
                }
                
                // 4. Update the payment status to 'rejected'
                const rejectionReason = reason || 'Payment reverted by administrator.';
                const rejectedPayment = databaseService.updatePayment(payment.id, {
                    status: 'rejected',
                    verificationError: rejectionReason,
                });
                if(rejectedPayment) emailService.sendPaymentRejectedEmail(user, rejectedPayment, rejectionReason);
    
                showToast('success', 'Payment Rejected & Reverted', `User ${user.email} has been downgraded to the Free plan.`);
            } catch (error) {
                console.error("Failed to reject and revert:", error);
                showToast('error', 'Action Failed', 'An unexpected error occurred during the reversion process.');
            }
        } else if (user) {
            // Standard rejection for a non-pro user or pending payment
            const rejectionReason = reason || 'Manually rejected by admin.';
            const rejectedPayment = databaseService.updatePayment(payment.id, { status: 'rejected', verificationError: rejectionReason });
            if (rejectedPayment) emailService.sendPaymentRejectedEmail(user, rejectedPayment, rejectionReason);
            showToast('info', 'Payment Rejected', `Payment from ${payment.userEmail} has been rejected.`);
        }
    
        setSelectedPayment(null);
    };

    const handleDeletePayment = (paymentId: string) => {
        if (window.confirm('Are you sure you want to permanently delete this payment record? This action cannot be undone.')) {
            try {
                const paymentToDelete = payments.find(p => p.id === paymentId);
                databaseService.deletePayment(paymentId);
                showToast('info', 'Payment Deleted', `Payment from ${paymentToDelete?.userEmail || 'user'} has been removed.`);
            } catch (error) {
                console.error("Failed to delete payment:", error);
                showToast('error', 'Deletion Failed', 'There was an issue deleting the payment record.');
            }
            setSelectedPayment(null);
        }
    };
    
    const handleRequeuePayment = (paymentId: string) => {
        const payment = payments.find(p => p.id === paymentId);
        if (!payment || payment.status !== 'approved') {
            showToast('error', 'Action Failed', 'Payment not found or is not approved.');
            return;
        }

        try {
            databaseService.updatePayment(paymentId, { status: 'pending', verificationError: 'Marked as pending for re-validation by admin.' });
            showToast('info', 'Payment Re-queued', `Payment from ${payment.userEmail} is now pending review.`);
            setSelectedPayment(null);
        } catch (error) {
            console.error("Failed to re-queue payment:", error);
            showToast('error', 'Re-queue Failed', 'An error occurred.');
        }
    };


    const handleValidatePayment = (paymentId: string) => {
        const payment = payments.find(p => p.id === paymentId);
        if (!payment || payment.status !== 'rejected') {
            showToast('error', 'Validation Failed', 'Payment not found or is not in a rejected state.');
            return;
        }

        try {
            databaseService.updatePayment(paymentId, { status: 'pending', verificationError: '' });
            showToast('info', 'Payment Re-queued', `Payment from ${payment.userEmail} is now pending validation.`);
            
            // If it's a bank transfer, the background worker will pick it up.
            if(payment.methodType === 'bank') {
                verifyPaymentImmediately(paymentId);
            }
            setSelectedPayment(null); // Close the modal
        } catch (error) {
            console.error("Failed to re-validate payment:", error);
            showToast('error', 'Validation Failed', 'An unexpected error occurred.');
        }
    };


    // --- Settings Handlers ---
    const handleSaveMethod = (updatedMethod: PaymentMethod) => {
        const updatedMethods = paymentMethods.map(m => m.id === updatedMethod.id ? updatedMethod : m);
        databaseService.savePaymentMethods(updatedMethods);
        showToast('success', 'Method Saved', `${updatedMethod.name} has been updated.`);
        setEditingMethod(null);
    };

    const handlePriceChange = (newPrice: string) => {
        const price = parseFloat(newPrice);
        if (!isNaN(price) && price > 0) {
            databaseService.savePlanPrice(price);
        }
    };
    
    const handleUserRowClick = (user: User) => {
        const userTokenTransactions = tokenTransactions.filter(t => t.userId === user.id);
        const currentTokenBalance = userTokenTransactions.reduce((acc, t) => acc + t.amount, 0);
        const totalTokensEarned = userTokenTransactions
            .filter(t => t.amount > 0)
            .reduce((acc, t) => acc + t.amount, 0);
            
        let referrerEmail: string | null = null;
        if (user.referredBy) {
            const referrer = users.find(u => u.id === user.referredBy);
            referrerEmail = referrer ? referrer.email : 'Unknown';
        }

        const referrals = users.filter(u => u.referredBy === user.id);
        const freeReferralsCount = referrals.filter(r => r.plan === 'free').length;
        const proReferralsCount = referrals.filter(r => r.plan === 'pro').length;

        setSelectedUser({
            ...user,
            currentTokenBalance,
            totalTokensEarned,
            referrerEmail,
            tokenTransactions: userTokenTransactions,
            freeReferralsCount,
            proReferralsCount,
        });
    };

    // --- Memoized Data for Charts & Tables ---
    const dashboardStats = useMemo(() => {
        const approvedPayments = payments.filter(p => p.status === 'approved');
        const totalCashRevenue = approvedPayments.reduce((acc, p) => acc + p.amountPaid, 0);
        const totalTokenRevenue = approvedPayments.reduce((acc, p) => acc + p.tokenDiscount, 0);

        return {
            totalUsers: users.length,
            proUsers: users.filter(u => u.plan === 'pro').length,
            imagesCreated: creations.filter(c => c.type === 'image').length,
            videosCreated: creations.filter(c => c.type !== 'image').length,
            totalCashRevenue,
            totalTokenRevenue,
            totalRevenue: totalCashRevenue + totalTokenRevenue,
        };
    }, [users, payments, creations]);

    const revenueBySource = useMemo(() => {
        const sources: { [key: string]: number } = {};
        payments.filter(p => p.status === 'approved').forEach(p => {
            sources[p.methodName] = (sources[p.methodName] || 0) + p.amountPaid;
        });
        return Object.entries(sources).map(([name, value]) => ({ name, value }));
    }, [payments]);
    
    const userMap = useMemo(() => new Map<string, User>(users.map(u => [u.id, u])), [users]);
    const allActivity = useMemo(() => {
        const creationActivity = creations.map(c => ({...c, activityType: 'creation'}));
        const paymentActivity = payments.filter(p => p.status === 'approved').map(p => ({...p, activityType: 'upgrade'}));
        const signupActivity = users.map(u => ({...u, activityType: 'signup'}));

        return [...creationActivity, ...paymentActivity, ...signupActivity]
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    }, [creations, payments, users]);
    
    const filteredPayments = useMemo(() => {
        return payments
            .filter(p => {
                const statusMatch = paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
                const searchMatch = !paymentSearch || p.userEmail.toLowerCase().includes(paymentSearch.toLowerCase()) || p.id.includes(paymentSearch);
                return statusMatch && searchMatch;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [payments, paymentStatusFilter, paymentSearch]);

    // --- Render Logic ---
    if (loading) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }
    
    const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-in-out]">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h2>
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Dashboard" />
                <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} label="Payments" count={payments.filter(p=>p.status === 'pending').length} />
                <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Users" />
                <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Settings" />
            </div>

            {/* --- DASHBOARD TAB --- */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard title="Total Users" value={dashboardStats.totalUsers} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197" /></svg>} />
                        <StatCard title="Pro Members" value={dashboardStats.proUsers} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>} />
                        <StatCard title="Cash Revenue" value={`$${dashboardStats.totalCashRevenue.toFixed(2)}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                        <StatCard title="Token Revenue" value={`$${dashboardStats.totalTokenRevenue.toFixed(2)}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
                        <StatCard title="Images Created" value={dashboardStats.imagesCreated} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                        <StatCard title="Videos Created" value={dashboardStats.videosCreated} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm">
                             <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Cash Revenue Sources</h4>
                             {revenueBySource.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={revenueBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {revenueBySource.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.5rem' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                             ) : <p className="text-sm text-center text-gray-500 dark:text-gray-400 pt-20">No payment data yet.</p>}
                        </div>
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm">
                            <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Live Activity</h4>
                            <div className="h-[250px] overflow-hidden relative">
                                <div className="absolute top-0 w-full animate-scroll-y">
                                    <div className="space-y-2">
                                        {allActivity.concat(allActivity).map((activity, index) => {
                                            const user = userMap.get(activity.userId);
                                            if (!user) return null;
                                            let actionText = '';
                                            switch (activity.activityType) {
                                                case 'creation': actionText = `created a ${activity.type}`; break;
                                                case 'upgrade': actionText = `upgraded to Pro`; break;
                                                case 'signup': actionText = `joined the platform`; break;
                                            }
                                            return (
                                                <div key={`${activity.id}-${index}`} className="flex items-center gap-3 p-2 text-sm">
                                                    <span>{user.country === 'USA' ? '🇺🇸' : user.country === 'Brazil' ? '🇧🇷' : '🌐'}</span>
                                                    <span className="font-semibold text-gray-700 dark:text-gray-200">{user.email.replace(/(?<=.{2}).(?=[^@]*?@)/g, "*")}</span>
                                                    <span className="text-gray-500 dark:text-gray-400">{actionText}</span>
                                                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${user.plan === 'pro' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{user.plan}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- PAYMENTS TAB --- */}
            {activeTab === 'payments' && (
                <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Search by user email or ID..."
                            value={paymentSearch}
                            onChange={e => setPaymentSearch(e.target.value)}
                            className="flex-grow p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500"
                        />
                        <select
                            value={paymentStatusFilter}
                            onChange={e => setPaymentStatusFilter(e.target.value as any)}
                            className="p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Method</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                                {filteredPayments.map(p => {
                                    const statusDisplay = statusDisplayMap.get(p.status) || { icon: null, className: '', text: p.status };
                                    return (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{p.userEmail}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${p.amountPaid.toFixed(2)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{p.methodName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                             <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusDisplay.className}`}>
                                                {statusDisplay.icon}
                                                {statusDisplay.text}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm space-x-2">
                                            <button onClick={() => setSelectedPayment(p)} className="text-cyan-500 hover:underline">View</button>
                                            {p.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleApprovePayment(p.id)} className="px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Approve</button>
                                                    <button onClick={() => handleRejectPayment(p.id)} className="px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Reject</button>
                                                </>
                                            )}
                                            {p.status === 'approved' && (
                                                <button onClick={() => handleRejectPayment(p.id)} className="px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Reject</button>
                                            )}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                         {filteredPayments.length === 0 && <p className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">No payments match your criteria.</p>}
                    </div>
                </div>
            )}
            
            {/* --- USERS TAB --- */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Plan</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Expires</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Join Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Country</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                            {users.map(u => {
                                const expDate = u.planExpirationDate ? new Date(u.planExpirationDate) : null;
                                const now = new Date();
                                const daysLeft = expDate ? Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                                let rowClass = 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30';
                                if (daysLeft !== null) {
                                    if (daysLeft <= 0) rowClass += ' bg-red-100/50 dark:bg-red-900/20';
                                    else if (daysLeft <= 7) rowClass += ' bg-yellow-100/50 dark:bg-yellow-900/20';
                                }
                                return (
                                <tr key={u.id} className={rowClass} onClick={() => handleUserRowClick(u)}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{u.email}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm"><span className={`px-2 py-0.5 text-xs rounded-full ${u.plan === 'pro' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>{u.plan}</span></td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{expDate ? expDate.toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{u.country}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Payment Methods</h3>
                        <div className="space-y-2">
                            {paymentMethods.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                    <div className="flex items-center gap-2"><span dangerouslySetInnerHTML={{ __html: m.icon }} /><span className="text-sm font-medium text-gray-800 dark:text-gray-200">{m.name}</span></div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setEditingMethod(m)} className="text-xs text-cyan-500 hover:underline">Edit</button>
                                        <label className="flex items-center cursor-pointer"><div className="relative"><input type="checkbox" checked={m.isEnabled} onChange={() => handleSaveMethod({ ...m, isEnabled: !m.isEnabled })} className="sr-only" /><div className="block bg-gray-300 dark:bg-gray-600 w-10 h-6 rounded-full"></div><div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${m.isEnabled ? 'translate-x-full bg-green-400' : ''}`}></div></div></label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm">
                         <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Pricing</h3>
                        <div>
                            <label htmlFor="plan-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pro Plan Price (USD)</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span></div>
                                <input type="number" id="plan-price" className="focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-md" defaultValue={planPrice} onBlur={(e) => handlePriceChange(e.target.value)} step="0.01" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <PaymentDetailModal 
                payment={selectedPayment} 
                onClose={() => setSelectedPayment(null)}
                onApprove={handleApprovePayment}
                onReject={handleRejectPayment}
                onDelete={handleDeletePayment}
                onRequeue={handleRequeuePayment}
                onValidate={handleValidatePayment}
            />
            <PaymentMethodEditModal method={editingMethod} onClose={() => setEditingMethod(null)} onSave={handleSaveMethod} />
            <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        </div>
    );
};

export default AdminDashboard;
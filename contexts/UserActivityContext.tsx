import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { ActivityEvent, GeneratorMode, PaymentMethod, User } from '../types';
import { databaseService } from '../services/databaseService';
import { useSubscriptionContext } from './SubscriptionContext';
import { useToast } from './ToastContext';
import { bankTransferService } from '../services/bankTransferService';
import { emailService } from '../services/emailService';

interface UserActivityContextData {
  recentActivity: ActivityEvent[];
  logActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  verifyPaymentImmediately: (paymentId: string) => Promise<void>;
}

const UserActivityContext = createContext<UserActivityContextData | undefined>(undefined);

const MAX_ACTIVITY_EVENTS = 20;

const mockPrompts = [
    'a futuristic cityscape, cinematic lighting', 
    'a serene forest clearing at dawn, hyperrealistic', 
    'an astronaut riding a space-whale, fantasy art', 
    'a hyperrealistic portrait of a wise old wizard',
    'a cyberpunk city street at night, raining, neon signs',
    'a cute robot tending to a garden of glowing flowers',
    'a majestic dragon flying over a mountain range'
];
const mockCountries = ['USA', 'Brazil', 'Germany', 'Japan', 'India', 'Canada', 'Australia', 'Nigeria', 'South Korea'];


export const UserActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
    const [verifyingPayments, setVerifyingPayments] = useState<Set<string>>(new Set());
    
    const { upgradeToPro } = useSubscriptionContext();
    const showToast = useToast();


    const logActivity = useCallback((eventData: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
        const newEvent: ActivityEvent = {
            ...eventData,
            id: `activity-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
        };
        setRecentActivity(prev => [newEvent, ...prev.slice(0, MAX_ACTIVITY_EVENTS - 1)]);
    }, []);

    const verifySinglePayment = useCallback(async (paymentId: string) => {
        if (verifyingPayments.has(paymentId)) return;

        const allPayments = databaseService.getAllPayments();
        const payment = allPayments.find(p => p.id === paymentId);
        
        // This function now only handles pending bank transfers. Card and crypto are instant.
        if (!payment || payment.status !== 'pending' || payment.methodType !== 'bank') {
            return;
        }

        const user = databaseService.findUserById(payment.userId);
        if (!user) {
            console.error(`User not found for payment ${payment.id}`);
            return;
        }

        setVerifyingPayments(prev => new Set(prev).add(payment.id));
        
        try {
            // Only bank verification is needed here.
            await bankTransferService.verifyBankPayment(payment);
            
            // Only upgrade if the user is not already pro (e.g. from a previous valid payment)
            if (user.plan !== 'pro') {
                upgradeToPro(payment.userId, payment.tokensDebited, payment.id);
            }
            databaseService.updatePayment(payment.id, { status: 'approved' });
            emailService.sendPaymentSuccessEmail(user, payment);

            const currentUser = databaseService.getCurrentUser();
            if (currentUser && currentUser.id === payment.userId) {
                showToast('success', 'Payment Approved!', `Your Pro plan is now active.`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown verification error.';
            databaseService.updatePayment(payment.id, { status: 'rejected', verificationError: errorMessage });
            emailService.sendPaymentRejectedEmail(user, payment, errorMessage);
            
            const currentUser = databaseService.getCurrentUser();
            if (currentUser && currentUser.id === payment.userId) {
                showToast('error', `Payment Failed`, errorMessage);
            }
        } finally {
            setVerifyingPayments(prev => {
                const newSet = new Set(prev);
                newSet.delete(payment.id);
                return newSet;
            });
        }
    }, [verifyingPayments, upgradeToPro, showToast]);


    // Effect to run background verification for asynchronous payments (bank only).
    useEffect(() => {
        const verificationInterval = setInterval(() => {
            const pendingBankPayments = databaseService.getAllPayments()
                .filter(p => p.status === 'pending' && p.methodType === 'bank');

            pendingBankPayments.forEach(payment => {
                verifySinglePayment(payment.id);
            });
        }, 5000); // check every 5 seconds

        return () => clearInterval(verificationInterval);
    }, [verifySinglePayment]);
    
    // Load initial data and start live simulation
    useEffect(() => {
        // This effect runs once to kickstart the simulation.
        // It does not depend on any external state, ensuring it's stable.
        
        const interval = setInterval(() => {
            const allUsers = databaseService.getAllUsers();
            const allPaymentMethods = databaseService.getPaymentMethods();

            const actionRoll = Math.random();

            // --- ACTION 1: SIMULATE A NEW USER SIGNUP (10% chance) ---
            if (actionRoll < 0.1) {
                databaseService._addSimulatedUser({
                    id: `sim-user-${Date.now()}`,
                    email: `visitor${Math.floor(Math.random() * 90000) + 10000}@example.com`,
                    plan: 'free',
                    createdAt: new Date().toISOString(),
                    referredBy: null,
                });
            
            // --- ACTION 2: SIMULATE AN APPROVED CARD PAYMENT (10% chance) ---
            } else if (actionRoll < 0.2) {
                const freeUsers = allUsers.filter(u => u.plan === 'free');
                const cardMethod = allPaymentMethods.find(m => m.type === 'card' && m.isEnabled);
                if (freeUsers.length > 0 && cardMethod) {
                    const randomUser = freeUsers[Math.floor(Math.random() * freeUsers.length)];
                    const planPrice = databaseService.getPlanPrice();

                    const approvedPayment = {
                        id: `payment-sim-approved-${Date.now()}`,
                        userId: randomUser.id,
                        userEmail: randomUser.email,
                        methodName: cardMethod.name,
                        methodType: cardMethod.type,
                        proof: { transactionId: `sim_ch_${Date.now().toString(36)}` },
                        status: 'approved' as const,
                        createdAt: new Date().toISOString(),
                        planPrice: planPrice,
                        tokenDiscount: 0,
                        amountPaid: planPrice,
                        tokensDebited: 0,
                        cardholderName: randomUser.email.split('@')[0].replace(/[0-9]/g, '').replace('.', ' '),
                        maskedCardNumber: `**** **** **** ${Math.floor(Math.random() * 9000) + 1000}`,
                    };
                    databaseService.addPayment(approvedPayment);

                    // Also upgrade the user to Pro
                    const expirationDate = new Date();
                    expirationDate.setDate(expirationDate.getDate() + 30);
                    databaseService.updateUser(randomUser.id, {
                        plan: 'pro',
                        subscriptionStartDate: new Date().toISOString(),
                        planExpirationDate: expirationDate.toISOString(),
                    });
                }

            // --- ACTION 3: SIMULATE A REJECTED CARD PAYMENT (10% chance) ---
            } else if (actionRoll < 0.3) {
                const freeUsers = allUsers.filter(u => u.plan === 'free');
                const cardMethod = allPaymentMethods.find(m => m.type === 'card' && m.isEnabled);
                if (freeUsers.length > 0 && cardMethod) {
                    const randomUser = freeUsers[Math.floor(Math.random() * freeUsers.length)];
                    const planPrice = databaseService.getPlanPrice();
                    const errorMessages = [
                        'Card declined by the bank.', 
                        'Insufficient funds.', 
                        'Transaction blocked for suspected fraud.'
                    ];
                    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];

                    const rejectedPayment = {
                        id: `payment-sim-rejected-${Date.now()}`,
                        userId: randomUser.id,
                        userEmail: randomUser.email,
                        methodName: cardMethod.name,
                        methodType: cardMethod.type,
                        proof: {},
                        status: 'rejected' as const,
                        createdAt: new Date().toISOString(),
                        planPrice: planPrice,
                        tokenDiscount: 0,
                        amountPaid: planPrice,
                        tokensDebited: 0,
                        verificationError: randomError,
                    };
                    databaseService.addPayment(rejectedPayment);
                }
            
            // --- ACTION 4: SIMULATE AN ASYNC PAYMENT (10% chance) ---
            } else if (actionRoll < 0.4) {
                const freeUsers = allUsers.filter(u => u.plan === 'free');
                if (freeUsers.length > 0) {
                    const randomUser = freeUsers[Math.floor(Math.random() * freeUsers.length)];
                    const enabledAsyncMethods = allPaymentMethods.filter(m => m.isEnabled && (m.type === 'bank'));
                    
                    if (enabledAsyncMethods.length > 0) {
                        const randomMethod = enabledAsyncMethods[Math.floor(Math.random() * enabledAsyncMethods.length)];
                        const planPrice = databaseService.getPlanPrice();

                        const newPayment = {
                            id: `payment-sim-${Date.now()}`,
                            userId: randomUser.id,
                            userEmail: randomUser.email,
                            methodName: randomMethod.name,
                            methodType: randomMethod.type,
                            proof: { hash: `sim_hash_${Date.now()}` }, // Crypto needs hash, bank needs file but this is ok for sim
                            status: 'pending' as const,
                            createdAt: new Date().toISOString(),
                            planPrice: planPrice,
                            tokenDiscount: 0,
                            amountPaid: planPrice,
                            tokensDebited: 0,
                        };
                        databaseService.addPayment(newPayment);
                    }
                }
            
            // --- ACTION 5: SIMULATE A CREATION (60% chance, default) ---
            } else {
                 if (allUsers.length > 0) {
                    const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
                    const randomPrompt = mockPrompts[Math.floor(Math.random() * mockPrompts.length)];
                    const randomType = Math.random() < 0.7 ? GeneratorMode.IMAGE : GeneratorMode.VIDEO;

                    databaseService.addCreation({
                        id: `creation-sim-${Date.now()}`,
                        userId: randomUser.id,
                        type: randomType,
                        prompt: randomPrompt,
                        createdAt: new Date().toISOString(),
                        // Using a placeholder image/video for simulation to avoid hitting generation APIs
                        resultDataUrl: 'https://via.placeholder.com/256/000000/FFFFFF/?text=Simulated',
                    });
                }
            }
        }, 3500); // Add a new activity every 3.5 seconds for a lively feel

        return () => clearInterval(interval); // Cleanup on unmount
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        <UserActivityContext.Provider value={{ recentActivity, logActivity, verifyPaymentImmediately: verifySinglePayment }}>
            {children}
        </UserActivityContext.Provider>
    );
};

export const useUserActivityContext = (): UserActivityContextData => {
    const context = useContext(UserActivityContext);
    if (!context) {
        throw new Error('useUserActivityContext must be used within a UserActivityProvider');
    }
    return context;
};
import { useState, useEffect, useCallback } from 'react';
// FIX: Import Plan from types.ts to avoid circular dependencies
import { GeneratorMode, User, Plan, Credits, TokenTransaction } from '../types';
import { databaseService } from '../services/databaseService';
import { useToast } from '../contexts/ToastContext';

export const IMAGE_TOKEN_COST = 10;
export const VIDEO_TOKEN_COST = 20;

export interface SubscriptionData {
  plan: Plan;
  credits: Credits;
  referralCode: string;
  subscriptionStartDate?: string | null;
  currentUser: User | null;
  tokens: number;
  referrals: string[];
  billingBalance: number;
  tierCreditLimits: Credits;
  consumeOnGenerate: (type: GeneratorMode, withoutWatermark: boolean) => void;
  upgradeToPro: (userId: string, tokensToDebit: number, paymentId?: string) => void;
  canGenerate: (type: GeneratorMode, withoutWatermark: boolean) => boolean;
  addTestTokens: (userId: string, amount: number) => void;
}

export const FREE_TIER_CREDITS: Credits = {
  image: 5,
  video: 2,
  noWatermark: 2,
};

const PRO_TIER_CREDITS: Credits = {
    image: 9999,
    video: 9999,
    noWatermark: 9999,
};

const generateReferralCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const useSubscription = (): SubscriptionData => {
  const [plan, setPlan] = useState<Plan>('free');
  const [credits, setCredits] = useState<Credits>(FREE_TIER_CREDITS);
  const [referralCode, setReferralCode] = useState<string>('');
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<number>(0);
  const [referrals, setReferrals] = useState<string[]>([]); // Array of referred user IDs
  const showToast = useToast();

  const billingBalance = tokens * 0.01;
  
  const calculateTokenBalance = useCallback((userId: string): number => {
    const transactions = databaseService.getTokenTransactionsByUserId(userId);
    return transactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, []);

  const saveCredits = useCallback((userId: string, newCredits: Credits) => {
      localStorage.setItem(`qc_credits_${userId}`, JSON.stringify(newCredits));
  }, []);

  useEffect(() => {
    const loadDataAndCreateUserIfNeeded = () => {
      let user = databaseService.getCurrentUser();
      
      if (!user) {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        
        const newUserId = `user-${Date.now()}`;
        let referredBy: string | null = null;

        if (refCode) {
            const referrer = databaseService.findUserByReferralCode(refCode);
            if (referrer) {
                referredBy = referrer.id;
                // Award token and log transaction for the referrer
                 databaseService.addTokenTransaction({
                    userId: referrer.id,
                    type: 'earn_referral_signup',
                    amount: 1,
                    description: `Referred new user ${newUserId}`,
                    createdAt: new Date().toISOString(),
                });
                
                const referrerReferrals = JSON.parse(localStorage.getItem(`qc_referrals_${referrer.id}`) || '[]');
                localStorage.setItem(`qc_referrals_${referrer.id}`, JSON.stringify([...referrerReferrals, newUserId]));
            }
        }
        
        const newCode = generateReferralCode();
        
        databaseService.addUser({
            id: newUserId,
            email: `user${Math.floor(Math.random() * 10000)}@example.com`, // Mock email
            plan: 'free',
            createdAt: new Date().toISOString(),
            referredBy: referredBy,
        });
        
        user = databaseService.getCurrentUser(); // Re-fetch the newly created user

        if (user) {
          localStorage.setItem(`qc_credits_${user.id}`, JSON.stringify(FREE_TIER_CREDITS));
          localStorage.setItem(`qc_referral_code_${user.id}`, newCode);
          localStorage.setItem(`qc_referrals_${user.id}`, '[]');
        }
      }
      
      if (user) {
        // Check for plan expiration before loading the rest of the state
        const expirationDate = user.planExpirationDate ? new Date(user.planExpirationDate) : null;
        const now = new Date();

        if (user.plan === 'pro' && expirationDate && expirationDate < now) {
            // Plan has expired, downgrade the user.
            databaseService.updateUser(user.id, { 
                plan: 'free', 
                planExpirationDate: null, 
                subscriptionStartDate: null 
            });
            // To ensure the current render cycle uses the correct data,
            // we'll mutate the local copy of the user object.
            user.plan = 'free'; 
            
            showToast('info', 'Plan Expired', 'Your Pro plan has expired. You are now on the Free plan.');
        }
        
        setPlan(user.plan);
        setSubscriptionStartDate(user.subscriptionStartDate || null);
        setCurrentUser(user);

        // Robustly set credits based on the final plan status
        if (user.plan === 'pro') {
            setCredits(PRO_TIER_CREDITS);
        } else { // Plan is 'free'
            const savedCreditsString = localStorage.getItem(`qc_credits_${user.id}`);
            const savedCreditsData = savedCreditsString ? JSON.parse(savedCreditsString) : null;
            
            // If saved credits are pro-tier (from an expired plan) or don't exist, reset to free tier.
            if (!savedCreditsData || savedCreditsData.image > FREE_TIER_CREDITS.image) {
                setCredits(FREE_TIER_CREDITS);
                saveCredits(user.id, FREE_TIER_CREDITS);
            } else {
                setCredits(savedCreditsData);
            }
        }

        const savedReferralCode = localStorage.getItem(`qc_referral_code_${user.id}`);
        const savedReferrals = localStorage.getItem(`qc_referrals_${user.id}`);
        
        if (savedReferralCode) setReferralCode(savedReferralCode);
        if (savedReferrals) setReferrals(JSON.parse(savedReferrals));

        // Calculate token balance from transaction history
        const userTokenBalance = calculateTokenBalance(user.id);
        setTokens(userTokenBalance);
      }
    };
    
    // Initial load and user creation if necessary
    loadDataAndCreateUserIfNeeded();

    // The simulation logic must run only once after the initial user is established.
    const userForSim = databaseService.getCurrentUser();
    if (userForSim) {
      const simulationFlag = `qc_referral_simulation_done_${userForSim.id}`;
      const hasRunSimulation = localStorage.getItem(simulationFlag);

      if (!hasRunSimulation) {
          const allUsers = databaseService.getAllUsers();
          const newReferrals: User[] = [];
          const newReferralIds: string[] = [];
          const mockDate = new Date();

          // Simulate 20 Pro referrals
          for (let i = 0; i < 20; i++) {
              mockDate.setMinutes(mockDate.getMinutes() - i * 10);
              const proUserId = `sim_pro_user_${Date.now()}_${i}`;
              const newUser: User = {
                  id: proUserId,
                  email: `pro.referral.${i}@example.com`,
                  plan: 'pro',
                  createdAt: mockDate.toISOString(),
                  subscriptionStartDate: mockDate.toISOString(),
                  referredBy: userForSim.id,
                  country: 'USA',
                  phone: '555-1234'
              };
              newReferrals.push(newUser);
              newReferralIds.push(proUserId);
              // Log transactions for the main user
              databaseService.addTokenTransaction({ userId: userForSim.id, type: 'earn_referral_signup', amount: 1, description: `Referred user ${newUser.email}`, createdAt: mockDate.toISOString() });
              databaseService.addTokenTransaction({ userId: userForSim.id, type: 'earn_referral_upgrade', amount: 10, description: `Referral upgrade bonus for user ${newUser.id}`, createdAt: mockDate.toISOString() });
          }

          // Simulate 280 Free referrals
          for (let i = 0; i < 280; i++) {
              mockDate.setMinutes(mockDate.getMinutes() - i * 2);
              const freeUserId = `sim_free_user_${Date.now()}_${i}`;
              const newUser: User = {
                  id: freeUserId,
                  email: `free.referral.${i}@example.com`,
                  plan: 'free',
                  createdAt: mockDate.toISOString(),
                  referredBy: userForSim.id,
                  country: 'Brazil',
                  phone: '555-5678'
              };
              newReferrals.push(newUser);
              newReferralIds.push(freeUserId);
              databaseService.addTokenTransaction({ userId: userForSim.id, type: 'earn_referral_signup', amount: 1, description: `Referred user ${newUser.email}`, createdAt: mockDate.toISOString() });
          }

          // Create one "spend" transaction for realism
          databaseService.addTokenTransaction({ userId: userForSim.id, type: 'spend_upgrade', amount: -20, description: `Discount on Pro Plan renewal`, createdAt: new Date().toISOString() });


          const updatedUsers = [...allUsers, ...newReferrals];
          databaseService._dangerouslySetAllUsers(updatedUsers);
          
          localStorage.setItem(`qc_referrals_${userForSim.id}`, JSON.stringify(newReferralIds));
          localStorage.setItem(simulationFlag, 'true');
      }
    }
    
    // Subscribe to future data changes
    databaseService.subscribe('data_changed', loadDataAndCreateUserIfNeeded);

    return () => {
        databaseService.unsubscribe('data_changed', loadDataAndCreateUserIfNeeded);
    };
  }, [calculateTokenBalance, saveCredits, showToast]);


  /**
   * Debits a specific number of tokens from a user's balance by logging a transaction.
   */
  const debitTokensForUpgrade = useCallback((userId: string, tokensToDebit: number) => {
    if (tokensToDebit > 0) {
        databaseService.addTokenTransaction({
            userId,
            type: 'spend_upgrade',
            amount: -tokensToDebit,
            description: `Discount on Pro Plan upgrade/renewal`,
            createdAt: new Date().toISOString(),
        });

        if (currentUser?.id === userId) {
            setTokens(prev => prev - tokensToDebit);
        }
    }
  }, [currentUser]);

  const consumeOnGenerate = useCallback((type: GeneratorMode, withoutWatermark: boolean) => {
    if (plan === 'pro' || !currentUser) return;

    // Create a mutable copy of the current credits state to determine changes
    const newCredits = { ...credits };
    let usedResource = false;
    let tokenCostApplied = 0;

    // --- Step 1: Handle watermark credit consumption (this is separate) ---
    // This is only consumed if the user is on the free plan and chooses a watermark-free export
    if (withoutWatermark && newCredits.noWatermark > 0) {
      newCredits.noWatermark -= 1;
      usedResource = true;
    }
    
    // --- Step 2: Determine primary resource consumption (credit first, then token) ---
    if (type === GeneratorMode.IMAGE && newCredits.image > 0) {
      newCredits.image -= 1;
      usedResource = true;
    } else if (type !== GeneratorMode.IMAGE && newCredits.video > 0) {
      newCredits.video -= 1;
      usedResource = true;
    } else {
        // --- Step 3: If no credit was used, consume tokens ---
        const tokenCost = type === GeneratorMode.IMAGE ? IMAGE_TOKEN_COST : VIDEO_TOKEN_COST;
        if (tokens >= tokenCost) {
            tokenCostApplied = tokenCost;
            usedResource = true; // Mark that a resource (token) was consumed
        }
    }
    
    // --- Step 4: Update state and storage only if a change occurred ---
    if (usedResource) {
      // Only update if the credits object has actually changed
      if (JSON.stringify(newCredits) !== JSON.stringify(credits)) {
        setCredits(newCredits);
        saveCredits(currentUser.id, newCredits);
      }
      
      if (tokenCostApplied > 0) {
         databaseService.addTokenTransaction({
          userId: currentUser.id,
          type: type === GeneratorMode.IMAGE ? 'spend_image' : 'spend_video',
          amount: -tokenCostApplied,
          description: `Generated a ${type}`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }, [plan, currentUser, credits, tokens, saveCredits]);

  const canGenerate = useCallback((type: GeneratorMode, withoutWatermark: boolean): boolean => {
    if (plan === 'pro') return true;
    
    if (withoutWatermark && credits.noWatermark <= 0) {
        return false;
    }

    const hasGenerationCredit = (type === GeneratorMode.IMAGE ? credits.image : credits.video) > 0;
    
    const tokenCost = type === GeneratorMode.IMAGE ? IMAGE_TOKEN_COST : VIDEO_TOKEN_COST;
    const hasEnoughTokens = tokens >= tokenCost;

    return hasGenerationCredit || hasEnoughTokens;
  }, [plan, credits, tokens]);

  const upgradeToPro = useCallback((userId: string, tokensToDebit: number, paymentId?: string) => {
      const userToUpgrade = databaseService.findUserById(userId);
      if (!userToUpgrade) return;

      // Award 10 bonus tokens to referrer if applicable
      if (userToUpgrade.referredBy) {
          const referrerId = userToUpgrade.referredBy;
          const referrer = databaseService.findUserById(referrerId);
          if (referrer) {
              const description = paymentId
                ? `Referral upgrade bonus for payment ${paymentId}`
                : `Referral upgrade bonus for user ${userToUpgrade.id}`; // Fallback

              databaseService.addTokenTransaction({
                  userId: referrerId,
                  type: 'earn_referral_upgrade',
                  amount: 10,
                  description: description,
                  createdAt: new Date().toISOString(),
              });
          }
      }

      // Conditionally debit the specified number of tokens
      if (tokensToDebit > 0) {
        debitTokensForUpgrade(userId, tokensToDebit);
      }
      
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30); // Set expiration to 30 days from now

      // This call will trigger the 'data_changed' event, which is handled
      // by the main useEffect to reload state and update the UI.
      databaseService.updateUser(userId, {
          plan: 'pro',
          subscriptionStartDate: new Date().toISOString(),
          planExpirationDate: expirationDate.toISOString(),
      });
      
      // We must also update the credits in storage so they are correct
      // when the state reloads.
      const proCredits = PRO_TIER_CREDITS;
      saveCredits(userId, proCredits);

  }, [debitTokensForUpgrade, saveCredits]);
  
  const addTestTokens = useCallback((userId: string, amount: number) => {
    databaseService.addTokenTransaction({
      userId,
      type: 'admin_grant',
      amount,
      description: `Admin grant of ${amount} tokens for testing.`,
      createdAt: new Date().toISOString(),
    });
  }, []);
  

  return { 
    plan, 
    credits, 
    referralCode, 
    subscriptionStartDate, 
    currentUser, 
    tokens,
    referrals,
    billingBalance,
    tierCreditLimits: plan === 'pro' ? PRO_TIER_CREDITS : FREE_TIER_CREDITS,
    consumeOnGenerate, 
    upgradeToPro, 
    canGenerate,
    addTestTokens,
  };
};
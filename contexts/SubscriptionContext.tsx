import React, { createContext, useContext, ReactNode } from 'react';
import { useSubscription, SubscriptionData } from '../hooks/useSubscription';
import { GeneratorMode, Credits } from '../types';
import { FREE_TIER_CREDITS } from '../hooks/useSubscription';


const defaultState: SubscriptionData = {
  plan: 'free',
  credits: {
    image: 0,
    video: 0,
    noWatermark: 0,
  },
  referralCode: '',
  currentUser: null,
  tokens: 0,
  referrals: [],
  billingBalance: 0,
  tierCreditLimits: FREE_TIER_CREDITS,
  consumeOnGenerate: (type: GeneratorMode, withoutWatermark: boolean) => {},
  upgradeToPro: (userId: string, tokensToDebit: number, paymentId?: string) => {},
  canGenerate: (type: GeneratorMode, withoutWatermark: boolean) => false,
  addTestTokens: (userId: string, amount: number) => {},
};

const SubscriptionContext = createContext<SubscriptionData>(defaultState);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const subscription = useSubscription();
  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => useContext(SubscriptionContext);
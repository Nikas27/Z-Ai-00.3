
import React, { useState, useEffect } from 'react';
import PaymentForm from './PaymentForm';
import { PaymentMethod, ProPlanPrice } from '../types';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { databaseService } from '../services/databaseService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [proPrice, setProPrice] = useState<ProPlanPrice | null>(null);
  const [isUsingBalance, setIsUsingBalance] = useState(false);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const { billingBalance, tokens, currentUser } = useSubscriptionContext();

  // Effect to load data and check for pending payments
  useEffect(() => {
    if (isOpen) {
      // Check for pending payments first
      if (currentUser) {
        const allPayments = databaseService.getAllPayments();
        const isPending = allPayments.some(
          p => p.userId === currentUser.id && p.status === 'pending'
        );
        setHasPendingPayment(isPending);
      }

      // Load payment methods and dynamic price
      try {
        const allMethods = databaseService.getPaymentMethods();
        const enabledMethods = allMethods.filter(m => m.isEnabled);
        const basePrice = databaseService.getPlanPrice();
        
        setProPrice({ amount: basePrice, currency: 'USD' });
        setPaymentMethods(enabledMethods);

      } catch (error) {
        console.error("Failed to load payment data from database", error);
        // Fallback to defaults
        const basePrice = 9.99;
        setPaymentMethods(databaseService.getPaymentMethods().filter(m => m.isEnabled));
        setProPrice({ amount: basePrice, currency: 'USD' });
      }
    } else {
      // Reset state on close
      setIsUsingBalance(false);
      setHasPendingPayment(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) {
    return null;
  }
  
  const originalPrice = proPrice ? proPrice.amount : 9.99;

  // The maximum discount allowed is 50% of the plan's price.
  const maxDiscountFromPlan = originalPrice * 0.5;
  // The actual discount is the lesser of the user's balance or the max allowed discount.
  const discountAmount = Math.min(billingBalance, maxDiscountFromPlan);

  // Ensure the final price is at least $0.01 after discount
  const discountedPrice = Math.max(0.01, originalPrice - discountAmount);
  
  // Calculate the actual tokens to be used, corresponding to the real discount applied
  const actualDiscountApplied = originalPrice - discountedPrice;
  const tokensToDebit = Math.floor(actualDiscountApplied / 0.01);

  const hasBalanceToUse = tokens > 0 && discountAmount > 0.01;
  const finalPrice = isUsingBalance ? discountedPrice : originalPrice;
  
  const paymentDetails = {
    planPrice: originalPrice,
    tokenDiscount: isUsingBalance ? actualDiscountApplied : 0,
    amountPaid: finalPrice,
    tokensToUse: isUsingBalance ? tokensToDebit : 0,
  };


  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-in-out]"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 animate-[slideInUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {hasPendingPayment ? (
             <div className="text-center p-8 flex flex-col items-center justify-center min-h-[400px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Payment Under Review
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                  Your recent payment is currently being verified. We'll notify you as soon as your Pro plan is activated. Thank you for your patience!
                </p>
             </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500">
                  Upgrade to Pro
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Join for <span className={`font-bold text-gray-700 dark:text-gray-200 ${isUsingBalance ? 'line-through' : ''}`}>${originalPrice.toFixed(2)}</span>
                  {isUsingBalance && <span className="font-bold text-xl text-green-500 ml-2">${discountedPrice.toFixed(2)}</span>} and unlock your full creative potential.
                </p>
                {isUsingBalance && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md text-sm text-green-600 dark:text-green-400 font-semibold flex items-center justify-center gap-2">
                        <span>Discount of ${actualDiscountApplied.toFixed(2)} applied!</span>
                        <button onClick={() => setIsUsingBalance(false)} className="text-xs text-red-500 hover:underline font-bold">(Remove)</button>
                    </div>
                )}
              </div>
              
              {hasBalanceToUse && !isUsingBalance && (
                <div className="p-4 mb-6 bg-green-50 dark:bg-green-900/20 border border-green-500/30 rounded-lg text-center">
                    <p className="font-semibold text-green-800 dark:text-green-200">
                        You have {tokens} tokens (${billingBalance.toFixed(2)} value)!
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Use your balance to cover up to 50% of the plan cost.
                    </p>
                    <button 
                        onClick={() => setIsUsingBalance(true)}
                        className="mt-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all shadow-md"
                    >
                        Apply for a ${discountAmount.toFixed(2)} discount
                    </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-lg">
                    <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">Pro Plan Features</h3>
                    <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                        <li className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            <span><strong className="text-gray-700 dark:text-gray-200">Unlimited</strong> Image Generations</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            <span><strong className="text-gray-700 dark:text-gray-200">Unlimited</strong> Video Animations</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            <span><strong className="text-gray-700 dark:text-gray-200">No Watermarks</strong> on any exports</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            <span>Access to all <strong className="text-gray-700 dark:text-gray-200">Pro features</strong> & aspect ratios</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            <span>Priority Support</span>
                        </li>
                    </ul>
                </div>
                <div>
                  <PaymentForm 
                    onPaymentSuccess={onClose}
                    paymentMethods={paymentMethods}
                    paymentDetails={paymentDetails}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
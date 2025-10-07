import React, { useState, useEffect, useCallback } from 'react';
import { PaymentMethod, PaymentProof, CardDetails, Payment } from '../types';
import QRCode from './QRCode';
import { cryptoPriceService } from '../services/cryptoPriceService';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { databaseService } from '../services/databaseService';
import { useToast } from '../contexts/ToastContext';
import { useUserActivityContext } from '../contexts/UserActivityContext';
import { paymentGatewayService } from '../services/paymentGatewayService';
import { blockchainService } from '../services/blockchainService';
import { emailService } from '../services/emailService';

interface PaymentFormProps {
  onPaymentSuccess: () => void;
  paymentMethods: PaymentMethod[];
  paymentDetails: {
    planPrice: number;
    tokenDiscount: number;
    amountPaid: number;
    tokensToUse: number;
  };
}

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const PaymentForm: React.FC<PaymentFormProps> = ({ onPaymentSuccess, paymentMethods, paymentDetails }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentProof, setPaymentProof] = useState<PaymentProof>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
  });
  
  const [liveCryptoAmount, setLiveCryptoAmount] = useState<number | null>(null);
  
  const { currentUser, upgradeToPro } = useSubscriptionContext();
  const { logActivity } = useUserActivityContext();
  const showToast = useToast();

  useEffect(() => {
    if (!selectedMethod && paymentMethods.length > 0) {
      const cardMethod = paymentMethods.find(m => m.type === 'card') || paymentMethods[0];
      setSelectedMethod(cardMethod || null);
    }
  }, [paymentMethods, selectedMethod]);
  
  const updateLiveCryptoPrice = useCallback(() => {
    if (selectedMethod?.type === 'crypto' && selectedMethod.cryptoSymbol) {
        const usdAmount = paymentDetails.amountPaid;
        const newAmount = cryptoPriceService.convertUsdToCrypto(usdAmount, selectedMethod.cryptoSymbol);
        setLiveCryptoAmount(newAmount);
    } else {
      setLiveCryptoAmount(null);
    }
  }, [selectedMethod, paymentDetails.amountPaid]);
  
  useEffect(() => {
    updateLiveCryptoPrice();
    window.addEventListener('cryptoRatesUpdated', updateLiveCryptoPrice);
    return () => {
      window.removeEventListener('cryptoRatesUpdated', updateLiveCryptoPrice);
    };
  }, [updateLiveCryptoPrice]);


  /**
   * Handles manual submission for review (e.g., Bank Transfers).
   */
  const handleBankPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMethod || !currentUser || selectedMethod.type !== 'bank') {
      setError('An error occurred. Please try again.');
      return;
    }
    
    if (selectedMethod.type === 'bank' && !paymentProof.file) {
      setError('Please upload proof of payment.');
      return;
    }

    setIsSubmitting(true);
    
    let proofForDb: PaymentProof = {};
    if (paymentProof.file) {
        proofForDb.fileDataUrl = await fileToDataUrl(paymentProof.file);
    }

    const newPayment = databaseService.addPayment({
      id: `payment-${Date.now()}`,
      userId: currentUser.id,
      userEmail: currentUser.email,
      methodName: selectedMethod.name,
      methodType: selectedMethod.type,
      proof: proofForDb,
      status: 'pending',
      createdAt: new Date().toISOString(),
      planPrice: paymentDetails.planPrice,
      tokenDiscount: paymentDetails.tokenDiscount,
      amountPaid: paymentDetails.amountPaid,
      tokensDebited: paymentDetails.tokensToUse,
    });
    
    logActivity({
      type: 'payment',
      userId: currentUser.id,
      userEmail: currentUser.email,
      details: `submitted a ${selectedMethod.name} payment`,
    });

    emailService.sendPaymentPendingEmail(currentUser, newPayment);

    setTimeout(() => {
      showToast('success', 'Payment Submitted!', 'Your payment is being verified. You will be notified once your Pro plan is active.');
      setIsSubmitting(false);
      onPaymentSuccess();
    }, 1500);
  };
  
  /**
   * Handles instant verification and approval for card payments.
   */
  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedMethod) return;

    setIsSubmitting(true);
    setError(null);
    
    const paymentId = `payment-${Date.now()}`;
    const paymentData: Omit<Payment, 'id' | 'createdAt'> & {id?:string, createdAt?:string} = {
      userId: currentUser.id,
      userEmail: currentUser.email,
      methodName: selectedMethod.name,
      methodType: selectedMethod.type,
      proof: {},
      status: 'pending' as const,
      planPrice: paymentDetails.planPrice,
      tokenDiscount: paymentDetails.tokenDiscount,
      amountPaid: paymentDetails.amountPaid,
      tokensDebited: paymentDetails.tokensToUse,
    };

    try {
        const result = await paymentGatewayService.verifyCardPayment(paymentData as Payment, cardDetails);
        const maskedCardNumber = `**** **** **** ${cardDetails.cardNumber.slice(-4)}`;

        const approvedPayment = databaseService.addPayment({
            ...paymentData,
            id: paymentId,
            createdAt: new Date().toISOString(),
            status: 'approved',
            proof: { transactionId: result.transactionId },
            cardholderName: cardDetails.cardholderName,
            maskedCardNumber: maskedCardNumber,
        });

        upgradeToPro(currentUser.id, paymentDetails.tokensToUse, paymentId);
        logActivity({ type: 'upgrade', userId: currentUser.id, userEmail: currentUser.email, details: 'upgraded to Pro via Card' });
        emailService.sendPaymentSuccessEmail(currentUser, approvedPayment);
        showToast('success', 'Payment Approved!', 'Your Pro plan is now active.');
        onPaymentSuccess();

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        showToast('error', 'Payment Failed', errorMessage);
        
        const rejectedPayment = databaseService.addPayment({
            ...paymentData,
            id: `payment-err-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'rejected',
            verificationError: errorMessage,
        });
        emailService.sendPaymentRejectedEmail(currentUser, rejectedPayment, errorMessage);

    } finally {
        setIsSubmitting(false);
    }
  };

  /**
   * Handles instant verification and approval for crypto payments.
   */
  const handleCryptoPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedMethod || selectedMethod.type !== 'crypto') return;

    if (!paymentProof.hash?.trim()) {
      setError('Please provide the transaction hash.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    const paymentId = `payment-${Date.now()}`;
    const paymentDataForVerification: Payment = {
      id: paymentId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      methodName: selectedMethod.name,
      methodType: selectedMethod.type,
      proof: { hash: paymentProof.hash },
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      planPrice: paymentDetails.planPrice,
      tokenDiscount: paymentDetails.tokenDiscount,
      amountPaid: paymentDetails.amountPaid,
      tokensDebited: paymentDetails.tokensToUse,
    };

    try {
        const allPayments = databaseService.getAllPayments();
        const recipientAddress = selectedMethod.address;
        if (!recipientAddress) {
            throw new Error(`Recipient address for ${selectedMethod.name} is not configured.`);
        }

        await blockchainService.verifyPayment(paymentDataForVerification, recipientAddress, allPayments);

        const approvedPayment = databaseService.addPayment({
            ...paymentDataForVerification,
            status: 'approved',
        });

        upgradeToPro(currentUser.id, paymentDetails.tokensToUse, paymentId);
        logActivity({ type: 'upgrade', userId: currentUser.id, userEmail: currentUser.email, details: `upgraded to Pro via ${selectedMethod.name}` });
        emailService.sendPaymentSuccessEmail(currentUser, approvedPayment);
        showToast('success', 'Payment Approved!', 'Your Pro plan is now active.');
        onPaymentSuccess();

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        showToast('error', 'Payment Verification Failed', errorMessage);
        
        const rejectedPayment = databaseService.addPayment({
            ...paymentDataForVerification,
            id: `payment-err-${Date.now()}`, // Use a different ID for the failed record
            status: 'rejected',
            verificationError: errorMessage,
        });
        emailService.sendPaymentRejectedEmail(currentUser, rejectedPayment, errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setError(null);
    setPaymentProof({});
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === 'cardNumber') {
        formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
    } else if (name === 'expiryDate') {
        formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 / ');
    } else if (name === 'cvc') {
        formattedValue = value.replace(/\D/g, '');
    }

    setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
  };

  const renderPaymentDetails = () => {
    if (!selectedMethod) {
      return <p className="text-center text-gray-500 dark:text-gray-400">Please select a payment method.</p>;
    }
    
    const usdPrice = paymentDetails.amountPaid;
    const isCrypto = selectedMethod.type === 'crypto';
    const finalCryptoAmount = liveCryptoAmount ?? (isCrypto && selectedMethod.cryptoSymbol ? cryptoPriceService.convertUsdToCrypto(usdPrice, selectedMethod.cryptoSymbol) : usdPrice);

    const usdReferenceDisplay = isCrypto ? `(≈ $${usdPrice.toFixed(2)} USD)` : '';
    
    let displayPrice: string;
    if (isCrypto && finalCryptoAmount !== null) {
        const cryptoSymbol = selectedMethod.cryptoSymbol;
        if (cryptoSymbol === 'BTC') {
            displayPrice = `${Math.round(finalCryptoAmount * 100_000_000).toLocaleString()} sats`;
        } else {
            displayPrice = `${finalCryptoAmount} ${cryptoSymbol}`;
        }
    } else {
        displayPrice = `$${usdPrice.toFixed(2)}`;
    }


    switch (selectedMethod.type) {
      case 'card':
        return (
          <form onSubmit={handleCardPayment} className="space-y-4 animate-[fadeIn_0.3s_ease-in-out]">
            <input type="text" name="cardholderName" value={cardDetails.cardholderName} onChange={handleCardInputChange} placeholder="Cardholder Name" required className="w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500" />
            <input type="text" name="cardNumber" value={cardDetails.cardNumber} onChange={handleCardInputChange} placeholder="Card Number" required maxLength={19} className="w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500" />
            <div className="flex gap-4">
                <input type="text" name="expiryDate" value={cardDetails.expiryDate} onChange={handleCardInputChange} placeholder="MM / YY" required maxLength={7} className="w-1/2 p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500" />
                <input type="text" name="cvc" value={cardDetails.cvc} onChange={handleCardInputChange} placeholder="CVC" required maxLength={4} className="w-1/2 p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500" />
            </div>
             <button type="submit" disabled={isSubmitting} className="w-full py-3 mt-4 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Verifying...</span>
                  </>
              ) : `Pay ${displayPrice} & Upgrade`}
            </button>
          </form>
        );
      case 'crypto':
        return (
          <form onSubmit={handleCryptoPayment} className="space-y-4 text-center animate-[fadeIn_0.3s_ease-in-out]">
            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedMethod.description}</p>
            {selectedMethod.address && (
                 <div className="flex justify-center"><QRCode value={selectedMethod.address} /></div>
            )}
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                <div className="flex items-center justify-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Please send exactly</p>
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                </div>
                <p className="font-bold text-lg text-gray-800 dark:text-gray-200">{displayPrice} <span className="font-normal text-gray-500 dark:text-gray-400">{usdReferenceDisplay}</span></p>
                <p className="text-xs font-mono break-all mt-1 text-gray-600 dark:text-gray-300">{selectedMethod.address}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Hash/ID</label>
              <input type="text" placeholder="Enter a valid transaction hash (e.g., 0xreal-...)" value={paymentProof.hash || ''} onChange={e => setPaymentProof({ ...paymentProof, hash: e.target.value})} className="w-full mt-1 p-2 text-center bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500" required />
            </div>
            
            <button type="submit" disabled={isSubmitting} className="w-full py-3 mt-2 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Verifying on Blockchain...</span>
                  </>
              ) : `I've Sent The Crypto`}
            </button>
          </form>
        );
      case 'bank':
        return (
          <form onSubmit={handleBankPayment} className="space-y-4 text-center animate-[fadeIn_0.3s_ease-in-out]">
            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedMethod.description}</p>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">Please send exactly</p>
                <p className="font-bold text-lg text-gray-800 dark:text-gray-200">{displayPrice} <span className="font-normal text-gray-500 dark:text-gray-400">{usdReferenceDisplay}</span></p>
                
                <div className="text-left text-xs mt-2 space-y-0.5 text-gray-600 dark:text-gray-300">
                    <p><strong>Holder:</strong> {selectedMethod.accountHolder}</p>
                    <p><strong>Account:</strong> {selectedMethod.accountNumber}</p>
                    <p><strong>IBAN:</strong> {selectedMethod.iban}</p>
                </div>
            </div>
            
            <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Proof of Payment</label>
                <input type="file" onChange={e => setPaymentProof({...paymentProof, file: e.target.files?.[0]})} required className="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 dark:file:bg-cyan-900/50 file:text-cyan-700 dark:file:text-cyan-300 hover:file:bg-cyan-100 dark:hover:file:bg-cyan-900" />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-3 mt-2 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Submitting for Review...</span>
                  </>
              ) : 'Confirm & Submit for Review'}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div>
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
            {paymentMethods.map(method => (
                <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors text-sm font-medium whitespace-nowrap text-gray-800 dark:text-gray-200 ${selectedMethod?.id === method.id ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30' : 'border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <span dangerouslySetInnerHTML={{ __html: method.icon }} />
                    <span>{method.name}</span>
                </button>
            ))}
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[200px]">
            {renderPaymentDetails()}
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>
    </div>
  );
};

export default PaymentForm;
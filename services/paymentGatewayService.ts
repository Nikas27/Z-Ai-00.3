// services/paymentGatewayService.ts

import { Payment, CardDetails } from '../types';

/**
 * Simulates a request to a third-party payment gateway like Stripe or Braintree.
 * This function now acts as the "AI" validator for card payments.
 * @param payment The payment object containing amount details.
 * @param cardDetails The sensitive card details for verification.
 * @returns A promise that resolves on success with a transaction ID and rejects on failure with a specific reason.
 */
const verifyCardPayment = (payment: Payment, cardDetails: CardDetails): Promise<{ success: true; transactionId: string; }> => {
  return new Promise((resolve, reject) => {
    // Simulate a faster network delay of 1-2 seconds for a snappier UX
    const delay = 1000 + Math.random() * 1000;

    setTimeout(() => {
      // --- Start of "AI" Validation Logic ---

      // 1. Check for complete information
      if (!cardDetails.cardholderName.trim() || !cardDetails.cardNumber.trim() || !cardDetails.expiryDate.trim() || !cardDetails.cvc.trim()) {
        reject(new Error('Incomplete card details provided.'));
        return;
      }

      // 2. Check Expiry Date (MM/YY format)
      const [month, year] = cardDetails.expiryDate.split('/').map(s => parseInt(s.trim(), 10));
      if (!month || !year || month < 1 || month > 12) {
        reject(new Error('Invalid expiration date format.'));
        return;
      }
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear() % 100; // Get last two digits of the year
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        reject(new Error('Card has expired.'));
        return;
      }

      // 3. Check CVC length
      if (cardDetails.cvc.length < 3 || cardDetails.cvc.length > 4) {
          reject(new Error('Invalid CVC.'));
          return;
      }
      
      // 4. Check Card Number (basic format check)
      const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');
      if (!/^\d{13,16}$/.test(cardNumber)) {
        reject(new Error('Invalid card number format.'));
        return;
      }

      // 5. Simulate declines based on specific test numbers
      if (cardNumber.endsWith('4242')) { // Common test card number
         // Always approve this one
      } else if (Math.random() < 0.15) { // Simulate a 15% failure rate for other numbers
        const errorMessages = [
            'Card declined by the bank.', 
            'Insufficient funds.', 
            'Transaction blocked for suspected fraud.'
        ];
        const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        reject(new Error(randomError));
        return;
      }
      
      // 6. Check that the amount is valid
      if (payment.amountPaid <= 0) {
        reject(new Error('Payment amount must be greater than zero.'));
        return;
      }
      
      // --- End of "AI" Validation Logic ---

      // If all checks pass, the payment is successful.
      const transactionId = `ch_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
      resolve({ success: true, transactionId });

    }, delay);
  });
};


export const paymentGatewayService = {
  verifyCardPayment,
};
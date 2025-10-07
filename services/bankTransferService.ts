// services/bankTransferService.ts
import { Payment } from '../types';

/**
 * Simulates a request to a bank's system to verify a transfer.
 * This process is typically slower than card or crypto verification.
 * @param payment The payment object containing amount and proof details.
 * @returns A promise that resolves on success and rejects on failure.
 */
const verifyBankPayment = (payment: Payment): Promise<{ success: true; reference: string; }> => {
  return new Promise((resolve, reject) => {
    // Simulate a longer network delay for bank transfers (5-10 seconds)
    const delay = 5000 + Math.random() * 5000;

    setTimeout(() => {
      // Check if proof of payment was uploaded
      if (!payment.proof.fileDataUrl) {
        reject(new Error('Verification failed: No proof of payment was uploaded.'));
        return;
      }
      
      // Simulate a higher failure rate for manual bank transfers (e.g., wrong reference, amount mismatch)
      if (Math.random() < 0.15) {
        const errorMessages = [
            'Bank transfer rejected: Amount did not match invoice.',
            'Bank transfer rejected: Reference number not found.',
            'Unable to confirm deposit from provided proof.'
        ];
        const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        reject(new Error(randomError));
        return;
      }
      
      // If all checks pass, the payment is considered successful.
      const reference = `BANK_TXN_${Date.now()}`;
      resolve({ success: true, reference });

    }, delay);
  });
};

export const bankTransferService = {
  verifyBankPayment,
};
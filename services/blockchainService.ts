// services/blockchainService.ts

import { Payment } from '../types';
import { cryptoPriceService } from './cryptoPriceService';

export interface VerifiedTransaction {
  amount: number;
  recipient: string;
  timestamp: string;
}

// --- SIMULATION HELPERS ---

// Simulates a network request delay
const simulateApiCall = (durationMs: number = 1500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, durationMs + Math.random() * 1000));
};


// Simulates checking if the received amount is sufficient, allowing for a small tolerance.
const isAmountSufficient = (received: number, expected: number): boolean => {
    // Allow for a 1% tolerance for price fluctuations or minor user errors
    const tolerance = 0.99; 
    return received >= (expected * tolerance);
};


// --- VERIFICATION FUNCTIONS ---

const verifyGenericTransaction = async (
  hash: string,
  expectedAddress: string,
  expectedAmount: number,
  cryptoSymbol: string
): Promise<VerifiedTransaction> => {
  await simulateApiCall();

  // The new format check in the main function already handles intentional failures.
  // This function now only simulates the "happy path" for a correctly formatted hash.

  // Simulate a successful API response from a blockchain explorer
  const mockTransaction: VerifiedTransaction = {
    // Simulate receiving slightly more to account for price fluctuation, ensuring it passes.
    amount: expectedAmount * (1 + Math.random() * 0.01), 
    recipient: expectedAddress.toLowerCase(), // Normalize address for comparison
    timestamp: new Date().toISOString(),
  };

  if (mockTransaction.recipient !== expectedAddress.toLowerCase()) {
      throw new Error(`Recipient mismatch. Funds were sent to an incorrect address.`);
  }

  if (!isAmountSufficient(mockTransaction.amount, expectedAmount)) {
      const decimals = cryptoSymbol === 'BTC' ? 8 : (cryptoSymbol === 'ETH' ? 6 : 4);
      throw new Error(`Underpayment detected. Expected ~${expectedAmount.toFixed(decimals)} ${cryptoSymbol}, but transaction was for ${mockTransaction.amount.toFixed(decimals)} ${cryptoSymbol}.`);
  }

  return mockTransaction;
};


// --- PUBLIC API ---

export const blockchainService = {
  /**
   * Verifies a cryptocurrency payment against a simulated blockchain with strict rules.
   * @param payment The payment object from the database.
   * @param recipientAddress The address the funds should have been sent to.
   * @param allPayments A list of all historical payments to check for duplicates.
   * @returns A promise that resolves with the verified transaction details or rejects with an error.
   */
  async verifyPayment(payment: Payment, recipientAddress: string, allPayments: Payment[]): Promise<VerifiedTransaction> {
    if (payment.methodType !== 'crypto' || !payment.proof.hash) {
      throw new Error('This payment is not a verifiable crypto transaction.');
    }
    
    const hash = payment.proof.hash.trim();

    // 1. NEW: Strict format validation. Only "real-looking" hashes are processed.
    if (!hash.toLowerCase().startsWith('0xreal-') || hash.length < 25) {
        throw new Error('Invalid transaction format. Please provide a real transaction hash from a blockchain explorer.');
    }

    // 2. Check for duplicate transaction hashes across all previous approved/pending payments.
    const duplicatePayment = allPayments.find(p => 
        p.id !== payment.id && 
        p.proof.hash?.trim().toLowerCase() === hash.toLowerCase() &&
        p.status !== 'rejected' // A hash from a rejected payment could be re-submitted
    );
    if (duplicatePayment) {
        throw new Error(`Duplicate transaction hash. This hash was already used for payment ID ${duplicatePayment.id.slice(-6)}.`);
    }

    const methodToSymbol: { [key: string]: string } = {
        'Bitcoin': 'BTC',
        'Ethereum': 'ETH',
        'Tether': 'USDT',
        'Solana': 'SOL',
        'Litecoin': 'LTC'
    };
    const cryptoSymbol = methodToSymbol[payment.methodName];

    if (!cryptoSymbol) {
        throw new Error(`Verification for ${payment.methodName} is not supported.`);
    }

    // 3. Get the expected crypto amount based on the USD price at the time of payment
    const expectedCryptoAmount = cryptoPriceService.convertUsdToCrypto(payment.amountPaid, cryptoSymbol);

    if (expectedCryptoAmount === null) {
        throw new Error(`Could not determine crypto conversion rate for ${cryptoSymbol}.`);
    }

    // 4. Call the generic "explorer" verification function
    return verifyGenericTransaction(hash, recipientAddress, expectedCryptoAmount, cryptoSymbol);
  },
};
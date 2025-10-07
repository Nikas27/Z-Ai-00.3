
import { PaymentMethod } from '../types';

// --- ICONS FOR PAYMENT METHODS ---
export const btcIcon = `<svg class="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.658 6.711c.21-.13.43-.25.65-.36a3.29 3.29 0 00-3.32-2.99c-1.35 0-2.5.82-3 1.95h-1.9v-1.2h-1.39v1.2h-1.3v1.39h1.3v6.95h-1.3v1.4h1.3v1.19h1.39v-1.19h1.9c.5 1.13 1.64 1.95 2.99 1.95a3.29 3.29 0 003.32-2.99c.22-.11.44-.23.65-.36a4.68 4.68 0 001.35-3.31c0-1.8-1-3.34-2.36-4.09zm-3.33 5.48c-.9 0-1.63-.73-1.63-1.63s.73-1.64 1.63-1.64h.7v3.27h-.7zm1.04-4.66c-.9 0-1.63-.73-1.63-1.63s.73-1.64 1.63-1.64h.35v3.27h-.35z"/></svg>`;
export const ethIcon = `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22.75L11.83 22.58L3.5 14.25L12 18.25L20.5 14.25L12.17 22.58L12 22.75Z" fill="#8C8C8C"/><path d="M12 1.25L3.5 12.75L12 16.75L20.5 12.75L12 1.25Z" fill="#3C3C3B"/></svg>`;
export const usdtIcon = `<svg class="w-8 h-8" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16 32c8.837 0 16-7.163 16-16S24.837 0 16 0 0 7.163 0 16s7.163 16 16 16z" fill="#26A17B"/><path d="M17.81 18.213V19.98h7.957v-1.768h-3.11v-6.915h-1.768v6.915h-3.08zm-9.577-3.666h9.578v1.768h-3.908v1.898h3.908v1.768H8.232v-5.434z" fill="#fff"/></svg>`;
export const cardIcon = `<svg class="w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zM4 6h16v2H4V6zm0 12v-6h16.001l.001 6H4z"/><path d="M6 14h6v2H6z"/></svg>`;
export const bankIcon = `<svg class="w-8 h-8 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 11.5h-1V15h1v-3.5zm3 0h-1V15h1v-3.5zm-6 0h-1V15h1v-3.5zM21 6H3v2h18V6zM3 18h18v1H3v-1zM20 9H4v1.5h16V9zM3 20.5h18V22H3v-1.5zM4 11h16v5H4v-5zm17-7H3a1 1 0 00-1 1v14a1 1 0 001 1h18a1 1 0 001-1V5a1 1 0 00-1-1z"/></svg>`;
export const solIcon = `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="solGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#9945FF"/><stop offset="100%" stop-color="#14F195"/></linearGradient></defs><path d="M4 12.28c0-2.35 1.9-4.28 4.25-4.28h1.5c2.35 0 4.25 1.93 4.25 4.28v3.44c0 2.35-1.9 4.28-4.25 4.28h-1.5c-2.35 0-4.25-1.93-4.25-4.28V12.28ZM5.5 12.28c0 1.52 1.23 2.78 2.75 2.78h1.5c1.52 0 2.75-1.26 2.75-2.78v-3.44c0-1.52-1.23-2.78-2.75-2.78h-1.5c-1.52 0-2.75 1.26-2.75 2.78v3.44Z" fill="url(#solGradient)"/><path d="M15.75 4h1.5c2.35 0 4.25 1.93 4.25 4.28v3.44c0 2.35-1.9 4.28-4.25 4.28h-1.5c-2.35 0-4.25-1.93-4.25-4.28V8c0-1.52 1.23-2.78 2.75-2.78h1.5c1.52 0 2.75 1.26 2.75 2.78v3.44c0 1.52-1.23 2.78-2.75 2.78h-1.5a.75.75 0 0 1 0-1.5h1.5c.69 0 1.25-.56 1.25-1.28V8.28c0-.69-.56-1.28-1.25-1.28h-1.5a.75.75 0 0 1 0-1.5Z" fill="url(#solGradient)"/></svg>`;
export const ltcIcon = `<svg class="w-8 h-8" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#bfbbbb"/><path d="m14.42 22.8-1.52-3.14-5.26-2.04.4-1.04 4.98 1.94 2.76-6.94h-4.22V10.5h10.42v1.12L16.2 18.2l-2.72 5.64.94.36 3.1-6.42 1.42.7-4.52 9.32h-1.1z" fill="#fff"/></svg>`;

export const defaultPaymentMethods: PaymentMethod[] = [
  { 
    id: 'card_default', 
    name: 'Credit Card', 
    icon: cardIcon, 
    type: 'card', 
    description: 'Pay with Visa, Mastercard, etc.',
    isEnabled: true,
  },
  { 
    id: 'bank_default', 
    name: 'Bank Transfer', 
    icon: bankIcon, 
    type: 'bank',
    accountHolder: 'Z-Ai Inc.',
    accountNumber: '1234567890',
    iban: 'US12345678901234567890',
    swift: 'ZAIIUS33',
    description: 'Transfer funds to the account below. Use your email as reference.',
    isEnabled: true,
  },
  { 
    id: 'btc_default', 
    name: 'Bitcoin', 
    icon: btcIcon, 
    type: 'crypto', 
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 
    network: 'Bitcoin', 
    cryptoSymbol: 'BTC',
    description: 'Send the exact amount of BTC to the address. After sending, paste the real transaction hash from the blockchain explorer below to verify.',
    isEnabled: true,
  },
  { 
    id: 'eth_default', 
    name: 'Ethereum', 
    icon: ethIcon, 
    type: 'crypto', 
    address: '0x321a42321a42321a42321a42321a42321a42321a', 
    network: 'ERC-20', 
    cryptoSymbol: 'ETH',
    description: 'Send the exact amount of ETH to the address (ERC-20 Network). After sending, paste the real transaction hash from the blockchain explorer below to verify.',
    isEnabled: true,
  },
  { 
    id: 'usdt_default', 
    name: 'Tether', 
    icon: usdtIcon, 
    type: 'crypto', 
    address: '0x987b654987b654987b654987b654987b654987b6', 
    network: 'ERC-20', 
    cryptoSymbol: 'USDT',
    description: 'Send the exact amount of USDT to the address (ERC-20 Network). After sending, paste the real transaction hash from the blockchain explorer below to verify.',
    isEnabled: true,
  },
  { 
    id: 'sol_default', 
    name: 'Solana', 
    icon: solIcon, 
    type: 'crypto', 
    address: 'So11111111111111111111111111111111111111112', 
    network: 'Solana',
    cryptoSymbol: 'SOL',
    description: 'Send the exact amount of SOL to the address. After sending, paste the real transaction hash from the blockchain explorer below to verify.',
    isEnabled: true,
  },
   { 
    id: 'ltc_default', 
    name: 'Litecoin', 
    icon: ltcIcon, 
    type: 'crypto', 
    address: 'ltc1qcl8935fu7wzfxsk3j2s5un4pfde8pcgwd9arty', 
    network: 'Litecoin', 
    cryptoSymbol: 'LTC',
    description: 'Send the exact amount of LTC to the address. After sending, paste the real transaction hash from the blockchain explorer below to verify.',
    isEnabled: true,
  },
];

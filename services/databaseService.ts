import { User, Design, Payment, TokenTransaction, PaymentMethod } from '../types';
import { defaultPaymentMethods } from '../data/paymentMethods';

// In a real app, this would be a backend service. For this demo, we use localStorage.

const USERS_KEY = 'z-ai-users';
const CURRENT_USER_ID_KEY = 'z-ai-current-user-id';
const DESIGNS_KEY = 'z-ai-designs'; // User-saved designs
const CREATIONS_KEY = 'z-ai-creations'; // All generated content for the live feed
const PAYMENTS_KEY = 'z-ai-payments';
const TOKEN_TRANSACTIONS_KEY = 'z-ai-token-transactions';
const PAYMENT_METHODS_KEY = 'z-ai-payment-methods';
const PLAN_PRICE_KEY = 'z-ai-plan-price';

const MAX_DESIGNS_IN_STORAGE = 15;
const MAX_CREATIONS_IN_STORAGE = 50; // Keep a larger buffer for the live feed

// Helper functions to safely interact with localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
};

const saveToStorage = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
};

const getUsers = (): User[] => getFromStorage<User[]>(USERS_KEY, []);
const saveUsers = (users: User[]) => {
    saveToStorage(USERS_KEY, users);
    notify('data_changed');
};

const getDesigns = (): Design[] => getFromStorage<Design[]>(DESIGNS_KEY, []);
const saveDesigns = (designs: Design[]) => {
    saveToStorage(DESIGNS_KEY, designs);
    notify('data_changed');
};

const getCreations = (): Design[] => getFromStorage<Design[]>(CREATIONS_KEY, []);
const saveCreations = (creations: Design[]) => {
    saveToStorage(CREATIONS_KEY, creations);
    notify('data_changed');
};

const getPayments = (): Payment[] => getFromStorage<Payment[]>(PAYMENTS_KEY, []);
const savePayments = (payments: Payment[]) => {
    saveToStorage(PAYMENTS_KEY, payments);
    notify('data_changed');
};

const getTokenTransactions = (): TokenTransaction[] => getFromStorage<TokenTransaction[]>(TOKEN_TRANSACTIONS_KEY, []);
const saveTokenTransactions = (transactions: TokenTransaction[]) => {
    saveToStorage(TOKEN_TRANSACTIONS_KEY, transactions);
    notify('data_changed');
};

const getPaymentMethods = (): PaymentMethod[] => {
    let methods = getFromStorage<PaymentMethod[]>(PAYMENT_METHODS_KEY, []);
    if (methods.length === 0) {
        methods = defaultPaymentMethods;
        saveToStorage(PAYMENT_METHODS_KEY, methods);
    }
    return methods;
};
const savePaymentMethods = (methods: PaymentMethod[]) => {
    saveToStorage(PAYMENT_METHODS_KEY, methods);
    notify('data_changed');
};

const mockCountries = ['USA', 'Brazil', 'Germany', 'Japan', 'India', 'Canada', 'Australia'];
const getRandomPhoneNumber = () => `+${Math.floor(Math.random() * 90) + 1} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`;

// --- START: Pub/Sub implementation for real-time updates ---
type EventType = 'data_changed';

const listeners: Record<EventType, Array<() => void>> = {
    data_changed: [],
};

const subscribe = (event: EventType, callback: () => void) => {
    listeners[event].push(callback);
};

const unsubscribe = (event: EventType, callback: () => void) => {
    listeners[event] = listeners[event].filter(l => l !== callback);
};

const notify = (event: EventType) => {
    listeners[event].forEach(callback => callback());
};
// --- END: Pub/Sub implementation ---


export const databaseService = {
  // Expose subscription methods
  subscribe,
  unsubscribe,

  // Special function for test data simulation to ensure reactivity
  _dangerouslySetAllUsers: (users: User[]) => {
    saveUsers(users);
  },
  _dangerouslySetAllDesigns: (designs: Design[]) => {
    saveDesigns(designs);
  },
  
  _addSimulatedUser: (userData: Omit<User, 'country' | 'phone'>): User => {
    const users = getUsers();
    if (users.some(u => u.id === userData.id)) {
        return users.find(u => u.id === userData.id)!;
    }

    const newUser: User = {
        ...userData,
        country: mockCountries[Math.floor(Math.random() * mockCountries.length)],
        phone: getRandomPhoneNumber()
    };
    
    users.push(newUser);
    saveUsers(users);
    // CRITICAL FIX: Do NOT set the current user ID for simulated users.
    return newUser;
  },

  findUserByReferralCode: (code: string): User | null => {
    const users = getUsers();
    for (const user of users) {
        const userCode = localStorage.getItem(`qc_referral_code_${user.id}`);
        if (userCode === code) {
            return user;
        }
    }
    return null;
  },

  findUserById: (userId: string): User | null => {
      const users = getUsers();
      return users.find(u => u.id === userId) || null;
  },
  
  getCurrentUser: (): User | null => {
    const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
    if (!userId) return null;
    const users = getUsers();
    return users.find(u => u.id === userId) || null;
  },

  addUser: (userData: Omit<User, 'country' | 'phone'>): User => {
    const users = getUsers();
    if (users.some(u => u.id === userData.id)) {
        return users.find(u => u.id === userData.id)!;
    }

    const newUser: User = {
        ...userData,
        country: mockCountries[Math.floor(Math.random() * mockCountries.length)],
        phone: getRandomPhoneNumber()
    };
    
    users.push(newUser);
    saveUsers(users);
    localStorage.setItem(CURRENT_USER_ID_KEY, newUser.id);
    return newUser;
  },

  updateUser: (userId: string, updates: Partial<Omit<User, 'id'>>): User | null => {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;
    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);
    return users[userIndex];
  },
  
  addDesign: (designData: Design) => {
      let designs = getDesigns();
      designs.unshift(designData); 
      if (designs.length > MAX_DESIGNS_IN_STORAGE) {
          designs = designs.slice(0, MAX_DESIGNS_IN_STORAGE);
      }
      saveDesigns(designs);
  },

  addCreation: (creationData: Design) => {
    let creations = getCreations();
    creations.unshift(creationData);
    if (creations.length > MAX_CREATIONS_IN_STORAGE) {
        creations = creations.slice(0, MAX_CREATIONS_IN_STORAGE);
    }
    saveCreations(creations);
  },

  addPayment: (paymentData: Payment): Payment => {
      const payments = getPayments();
      payments.push(paymentData);
      savePayments(payments);
      return paymentData;
  },

  updatePayment: (paymentId: string, updates: Partial<Omit<Payment, 'id'>>): Payment | null => {
    let payments = getPayments();
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    if (paymentIndex === -1) return null;
    payments[paymentIndex] = { ...payments[paymentIndex], ...updates };
    savePayments(payments);
    return payments[paymentIndex];
  },

  deletePayment: (paymentId: string): void => {
    const payments = getPayments();
    const updatedPayments = payments.filter(p => p.id !== paymentId);
    savePayments(updatedPayments);
  },

  // --- Token Transaction Methods ---
  addTokenTransaction: (transactionData: Omit<TokenTransaction, 'id'>): TokenTransaction => {
      const transactions = getTokenTransactions();
      const newTransaction: TokenTransaction = {
          ...transactionData,
          id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };
      transactions.push(newTransaction);
      saveTokenTransactions(transactions);
      return newTransaction;
  },
  
  getTokenTransactionsByUserId: (userId: string): TokenTransaction[] => {
      const transactions = getTokenTransactions();
      return transactions.filter(t => t.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getAllTokenTransactions: (): TokenTransaction[] => getTokenTransactions(),

  // --- Dynamic Plan Pricing ---
  getPlanPrice: (): number => {
      return getFromStorage<number>(PLAN_PRICE_KEY, 9.99);
  },
  savePlanPrice: (price: number) => {
      if (price > 0) {
        saveToStorage(PLAN_PRICE_KEY, price);
        notify('data_changed');
      }
  },

  // For Admin dashboard
  getAllUsers: (): User[] => getUsers(),
  getAllDesigns: (): Design[] => getDesigns(),
  getAllCreations: (): Design[] => getCreations(),
  getAllPayments: (): Payment[] => getPayments(),
  getPaymentMethods,
  savePaymentMethods,
};

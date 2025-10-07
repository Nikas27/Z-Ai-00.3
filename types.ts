import { Modality } from "@google/genai";

export interface Payment {
    id:string;
    userId: string;
    userEmail: string;
    methodName: string;
    methodType: 'card' | 'crypto' | 'bank';
    proof: PaymentProof;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    // --- Financial Details (all in USD for consistent reporting) ---
    planPrice: number;       // The price of the plan at the time of purchase (e.g., 9.99)
    tokenDiscount: number;   // The value of the discount in USD (e.g., 5.00)
    amountPaid: number;      // The final amount paid via the method (e.g., 4.99)
    tokensDebited: number;   // The number of tokens used (e.g., 500)
    verificationError?: string; // Reason for automated rejection
    // --- Card-specific details ---
    cardholderName?: string;
    maskedCardNumber?: string;
}

export enum GeneratorMode {
    IMAGE = 'image',
    VIDEO = 'video',
    SCENE = 'scene',
}

export type AspectRatio = '1:1' | '9:16' | '3:4' | '4:3' | '16:9';
export type Plan = 'free' | 'pro';

// New types for custom dimensions
export type DimensionUnit = 'px' | 'cm';
export interface CustomDimensions {
  width: string; // Using string to allow for empty input fields
  height: string;
  unit: DimensionUnit;
}


export interface NarrationSettings {
  isEnabled: boolean;
  mode: 'tts' | 'upload';
  text: string;
  voiceURI: string | null;
  volume: number;
  pitch: number;
  rate: number;
  audioUrl: string | null;
}

export interface Credits {
  image: number;
  video: number;
  noWatermark: number;
}

export interface User {
    id: string;
    email: string;
    plan: Plan;
    createdAt: string;
    subscriptionStartDate?: string | null;
    planExpirationDate?: string | null; // Added for tracking Pro plan expiry
    country: string;
    phone: string;
    referredBy: string | null; // ID of the user who referred this user
    tokenBalance?: number;
}

export interface ExtendedUser extends User {
    currentTokenBalance: number;
    totalTokensEarned: number;
    referrerEmail: string | null;
    tokenTransactions: TokenTransaction[];
    freeReferralsCount: number;
    proReferralsCount: number;
}

export interface Design {
    id: string;
    userId: string;
    type: GeneratorMode;
    prompt: string;
    createdAt: string;
    resultDataUrl: string;
}

export interface ProPlanPrice {
    amount: number;
    currency: string;
}

export interface PaymentMethod {
    id: string;
    name: string;
    icon: string;
    type: 'card' | 'crypto' | 'bank';
    description: string;
    isEnabled: boolean;
    // For bank
    accountHolder?: string;
    accountNumber?: string;
    iban?: string;
    swift?: string;
    // For crypto
    address?: string;
    network?: string;
    cryptoSymbol?: string; // e.g., 'BTC', 'ETH'
}

export interface PaymentProof {
    hash?: string;
    file?: File;
    fileDataUrl?: string;
    transactionId?: string; // For card payments
}

export interface CardDetails {
    cardholderName: string;
    cardNumber: string;
    expiryDate: string; // MM/YY
    cvc: string;
}

export interface ActivityEvent {
  id: string;
  type: 'design' | 'payment' | 'upgrade' | 'referral';
  userId: string;
  userEmail: string;
  timestamp: string;
  details: string;
}

export interface CountryUserData {
  name: string;
  flag: string;
  count: number;
}

export interface LiveUserData {
  liveUserCount: number;
  usersByCountry: CountryUserData[];
}

export interface TokenTransaction {
    id: string;
    userId: string;
    type: 'earn_referral_signup' | 'earn_referral_upgrade' | 'spend_upgrade' | 'spend_image' | 'spend_video' | 'initial_balance' | 'earn_goal_bonus' | 'admin_grant';
    amount: number; // positive for earning, negative for spending
    description: string;
    createdAt: string;
}

// --- Types for Scene Generator ---
export interface SceneCharacter {
  name: string;
  description: string;
  voiceURI?: string; // Will be added by the client
}

export interface SceneDialogue {
  character: string;
  line: string;
}

export interface SceneShot {
  shotNumber: number;
  description: string;
  dialogue: SceneDialogue | null;
}

export interface ParsedScene {
  characters: SceneCharacter[];
  shots: SceneShot[];
}

export interface GeneratedShot {
    shotNumber: number;
    description: string;
    videoUrl: string;
    dialogue: SceneDialogue | null;
    character?: SceneCharacter;
}

export interface Email {
    id: string;
    to: string;
    subject: string;
    body: string;
    sentAt: string;
}
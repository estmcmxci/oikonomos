/**
 * Meta-Treasury Provider Types
 *
 * Type definitions for the strategy provider worker.
 */

import type { Address } from 'viem';

/**
 * Environment variables for the worker
 */
export interface Env {
  // Provider's private key for signing transactions
  PROVIDER_PRIVATE_KEY: string;
  // Base Sepolia RPC URL
  BASE_SEPOLIA_RPC_URL: string;
  // Optional: Moltbook API key for Clawnch integration
  MOLTBOOK_API_KEY?: string;
}

/**
 * Provider capabilities response
 */
export interface Capabilities {
  type: 'meta-treasury-manager';
  version: string;
  supportedPlatforms: string[];
  strategies: {
    claiming: {
      frequency: string[];
      minThreshold: string;
    };
    wethManagement: {
      compound: boolean;
      toStables: boolean;
      hold: boolean;
      customSplit: boolean;
    };
    tokenManagement: {
      holdWinners: boolean;
      exitLosers: boolean;
      rebalance: boolean;
    };
  };
  pricing: {
    type: 'percentage';
    value: string;
    basis: string;
  };
  supportedChains: number[];
  description: string;
}

/**
 * Quote request from user
 */
export interface QuoteRequest {
  userWallet: Address;
  tokens: Address[];
  policy: ManagementPolicy;
}

/**
 * Quote response
 */
export interface QuoteResponse {
  quoteId: string;
  estimatedWethFees: string;
  estimatedProviderFee: string;
  estimatedGasCost: string;
  validUntil: number;
  tokens: TokenQuote[];
}

/**
 * Individual token quote
 */
export interface TokenQuote {
  token: Address;
  estimatedWethFees: string;
  estimatedTokenFees: string;
}

/**
 * Management policy from user
 */
export interface ManagementPolicy {
  claimFrequency: 'daily' | 'weekly' | 'monthly' | 'threshold';
  minClaimThreshold?: string;
  wethStrategy: {
    compound: number; // Percentage (0-100)
    toStables: number;
    hold: number;
  };
  tokenStrategy: {
    winners: 'hold' | 'compound';
    losers: 'hold' | 'sell-to-weth';
    winnerThreshold: number; // Percentage gain to be considered winner
    loserThreshold: number; // Percentage loss to be considered loser
  };
  maxSlippageBps: number;
}

/**
 * Execute request
 */
export interface ExecuteRequest {
  userWallet: Address;
  tokens: Address[];
  policy: ManagementPolicy;
  delegationSignature: `0x${string}`;
  deadline: number;
}

/**
 * Execute response
 */
export interface ExecuteResponse {
  success: boolean;
  transactionHash?: `0x${string}`;
  totalWethClaimed?: string;
  providerFee?: string;
  error?: string;
}

/**
 * Token fee info
 */
export interface TokenFeeInfo {
  token: Address;
  symbol?: string;
  wethFees: bigint;
  tokenFees: bigint;
  priceChange24h?: number;
}

/**
 * Aggregate fee info across tokens
 */
export interface AggregateFeeInfo {
  totalWethFees: bigint;
  tokens: TokenFeeInfo[];
}

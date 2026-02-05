import type { Address } from 'viem';

export interface TokenAllocation {
  address: Address;
  symbol: string;
  targetPercentage: number;
  decimals?: number;
}

export interface Policy {
  type: 'stablecoin-rebalance' | 'threshold-rebalance' | 'periodic-rebalance';
  tokens: TokenAllocation[];
  driftThreshold: number; // Percentage drift before triggering rebalance
  maxSlippageBps: number; // Maximum slippage in basis points
  maxDailyUsd?: number; // Maximum daily trading volume in USD
  rebalanceInterval?: number; // For periodic: interval in seconds
}

// Phase 2: Unified Policy Types

export type PolicyType =
  | 'stablecoin-rebalance'
  | 'threshold-rebalance'
  | 'periodic-rebalance'
  | 'agent-fee-claim'
  | 'agent-compound'
  | 'agent-exit'
  | 'unified';

/**
 * Unified policy that combines stablecoin rebalancing with agent token management
 */
export interface UnifiedPolicy {
  type: 'unified';

  /** Stablecoin rebalancing configuration (optional) */
  stablecoinRebalance?: {
    enabled: boolean;
    tokens: TokenAllocation[];
    driftThreshold: number; // e.g., 5 = 5%
  };

  /** Agent token fee claiming configuration (optional) */
  feeClaiming?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'threshold';
    minThresholdWeth: string; // e.g., "0.1" WETH
    tokens: Address[]; // Which agent tokens to manage
  };

  /** WETH distribution strategy after claiming fees */
  wethStrategy?: {
    compound: number; // % to add back to LP (0-100)
    toStables: number; // % to convert to USDC (0-100)
    hold: number; // % to keep as WETH (0-100)
    // Must sum to 100
  };

  /** Agent token exit strategy */
  tokenStrategy?: {
    enabled: boolean;
    sellLosers: boolean;
    loserThreshold: number; // e.g., 30 = sell if down >30%
    holdWinners: boolean;
    winnerThreshold: number; // e.g., 20 = hold if up >20%
  };

  /** Shared constraints */
  maxSlippageBps: number;
  maxDailyUsd?: number;
}

/**
 * Check if a policy is a unified policy
 */
export function isUnifiedPolicy(policy: Policy | UnifiedPolicy): policy is UnifiedPolicy {
  return policy.type === 'unified';
}

/**
 * Validate WETH strategy percentages sum to 100
 */
export function validateWethStrategy(strategy: UnifiedPolicy['wethStrategy']): boolean {
  if (!strategy) return true;
  return strategy.compound + strategy.toStables + strategy.hold === 100;
}

export const DEFAULT_STABLECOIN_POLICY: Policy = {
  type: 'stablecoin-rebalance',
  tokens: [
    {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      symbol: 'USDC',
      targetPercentage: 50,
      decimals: 6,
    },
  ],
  driftThreshold: 5, // 5% drift
  maxSlippageBps: 50, // 0.5% max slippage
  maxDailyUsd: 100000, // $100k daily limit
};

export const POLICY_TEMPLATES: Record<string, Partial<Policy>> = {
  'conservative': {
    driftThreshold: 10,
    maxSlippageBps: 25,
    maxDailyUsd: 50000,
  },
  'moderate': {
    driftThreshold: 5,
    maxSlippageBps: 50,
    maxDailyUsd: 100000,
  },
  'aggressive': {
    driftThreshold: 2,
    maxSlippageBps: 100,
    maxDailyUsd: 500000,
  },
};

export function applyTemplate(policy: Partial<Policy>, templateName: string): Policy {
  const template = POLICY_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Unknown template: ${templateName}`);
  }

  return {
    type: policy.type || 'stablecoin-rebalance',
    tokens: policy.tokens || [],
    driftThreshold: policy.driftThreshold ?? template.driftThreshold ?? 5,
    maxSlippageBps: policy.maxSlippageBps ?? template.maxSlippageBps ?? 50,
    maxDailyUsd: policy.maxDailyUsd ?? template.maxDailyUsd,
  };
}

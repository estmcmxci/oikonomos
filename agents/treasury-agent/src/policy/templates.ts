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

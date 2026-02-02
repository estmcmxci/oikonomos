// OIK-33: Policy Matcher
// Matches portfolio composition to optimal policy template

import type { Address } from 'viem';
import type { Policy, TokenAllocation } from '../policy/templates';
import { POLICY_TEMPLATES } from '../policy/templates';
import type { PortfolioComposition } from './classifier';
import type { PoolMatch } from './pools';

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export interface PolicyMatch {
  policy: Policy;
  template: RiskProfile;
  reasoning: string;
  confidence: number; // 0-100
}

interface MatchContext {
  composition: PortfolioComposition;
  compatiblePools: PoolMatch[];
  tokens: Array<{ address: Address; symbol: string; percentage: number }>;
}

export function matchPolicy(context: MatchContext): PolicyMatch {
  const { composition, compatiblePools, tokens } = context;

  // Determine policy type based on composition
  let policyType: Policy['type'];
  let template: RiskProfile;
  let reasoning: string;
  let confidence: number;

  // Build token allocations from current portfolio
  const tokenAllocations: TokenAllocation[] = tokens
    .filter(t => t.percentage > 0)
    .map(t => ({
      address: t.address,
      symbol: t.symbol,
      targetPercentage: Math.round(t.percentage),
    }));

  if (composition.stablecoinPercentage >= 90) {
    // Pure stablecoin portfolio
    policyType = 'stablecoin-rebalance';
    template = 'conservative';
    confidence = 95;
    reasoning = buildStablecoinReasoning(composition, compatiblePools);
  } else if (composition.stablecoinPercentage >= 60) {
    // Mostly stablecoins with some volatile
    policyType = 'stablecoin-rebalance';
    template = 'moderate';
    confidence = 85;
    reasoning = buildMixedStableReasoning(composition, compatiblePools);
  } else if (composition.ethPercentage >= 50) {
    // ETH-heavy portfolio
    policyType = 'threshold-rebalance';
    template = 'moderate';
    confidence = 80;
    reasoning = buildETHReasoning(composition, compatiblePools);
  } else {
    // Mixed volatile portfolio
    policyType = 'threshold-rebalance';
    template = 'aggressive';
    confidence = 70;
    reasoning = buildVolatileReasoning(composition, compatiblePools);
  }

  // Get template parameters
  const templateParams = POLICY_TEMPLATES[template];

  const policy: Policy = {
    type: policyType,
    tokens: tokenAllocations,
    driftThreshold: templateParams.driftThreshold ?? 5,
    maxSlippageBps: templateParams.maxSlippageBps ?? 50,
    maxDailyUsd: templateParams.maxDailyUsd,
  };

  return {
    policy,
    template,
    reasoning,
    confidence,
  };
}

function buildStablecoinReasoning(
  composition: PortfolioComposition,
  pools: PoolMatch[]
): string {
  const parts: string[] = [];

  parts.push(
    `Your portfolio is ${composition.stablecoinPercentage.toFixed(0)}% stablecoins.`
  );

  parts.push(
    'Stablecoin rebalancing with conservative settings is recommended to maintain tight allocation bounds with minimal slippage.'
  );

  if (pools.length > 0) {
    parts.push(
      `Found ${pools.length} compatible pool(s) for your tokens with fees as low as ${pools[0]?.feeFormatted || '0.05%'}.`
    );
  }

  parts.push(
    'Recommended: 10% drift threshold, 25 bps max slippage, $50k daily limit.'
  );

  return parts.join(' ');
}

function buildMixedStableReasoning(
  composition: PortfolioComposition,
  pools: PoolMatch[]
): string {
  const parts: string[] = [];

  parts.push(
    `Your portfolio is ${composition.stablecoinPercentage.toFixed(0)}% stablecoins and ${composition.volatilePercentage.toFixed(0)}% volatile assets.`
  );

  parts.push(
    'A moderate stablecoin rebalancing policy is recommended to balance stability with flexibility.'
  );

  if (pools.length > 0) {
    parts.push(`Found ${pools.length} compatible trading pool(s).`);
  }

  parts.push(
    'Recommended: 5% drift threshold, 50 bps max slippage, $100k daily limit.'
  );

  return parts.join(' ');
}

function buildETHReasoning(
  composition: PortfolioComposition,
  pools: PoolMatch[]
): string {
  const parts: string[] = [];

  parts.push(
    `Your portfolio has ${composition.ethPercentage.toFixed(0)}% in ETH/WETH.`
  );

  parts.push(
    'A threshold-based rebalancing policy is recommended to manage ETH exposure with moderate risk parameters.'
  );

  if (pools.length > 0) {
    parts.push(`Found ${pools.length} ETH trading pool(s).`);
  }

  parts.push(
    'Recommended: 5% drift threshold, 50 bps max slippage for volatility protection.'
  );

  return parts.join(' ');
}

function buildVolatileReasoning(
  composition: PortfolioComposition,
  pools: PoolMatch[]
): string {
  const parts: string[] = [];

  parts.push(
    `Your portfolio is ${composition.volatilePercentage.toFixed(0)}% volatile assets.`
  );

  parts.push(
    'An aggressive threshold-based rebalancing policy is recommended to actively manage volatile positions.'
  );

  if (pools.length > 0) {
    parts.push(`Found ${pools.length} compatible trading pool(s).`);
  } else {
    parts.push(
      'Note: Limited pool availability detected. Some rebalances may require multi-hop routing.'
    );
  }

  parts.push(
    'Recommended: 2% drift threshold, 100 bps max slippage to capture opportunities.'
  );

  return parts.join(' ');
}

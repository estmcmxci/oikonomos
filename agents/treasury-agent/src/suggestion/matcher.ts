// OIK-33: Policy Matcher
// Matches portfolio composition to optimal policy template
// Extended for Phase 2: Unified Policy matching

import type { Address } from 'viem';
import type { Policy, TokenAllocation, UnifiedPolicy } from '../policy/templates';
import { POLICY_TEMPLATES } from '../policy/templates';
import type { PortfolioComposition } from './classifier';
import type { PoolMatch } from './pools';
import type { AgentToken, DiscoveredPortfolio, PortfolioToken } from './clawnch';

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

// ============================================================================
// Phase 2: Unified Policy Matching
// ============================================================================

export interface UnifiedPolicyMatch {
  policy: UnifiedPolicy;
  reasoning: string;
  confidence: number;
}

interface UnifiedMatchContext {
  stablecoins: PortfolioToken[];
  volatile: PortfolioToken[];
  agentTokens: AgentToken[];
  totalUnclaimedWeth: number;
}

/**
 * Match a unified portfolio (stablecoins + agent tokens) to a unified policy
 */
export function matchUnifiedPolicy(
  context: UnifiedMatchContext
): UnifiedPolicyMatch {
  const policies: Partial<UnifiedPolicy> = { type: 'unified' };
  const reasoning: string[] = [];
  let confidence = 0.5;

  // 1. Stablecoin rebalancing (if significant stablecoin holdings)
  if (context.stablecoins.length >= 2) {
    const totalStablePercent = context.stablecoins.reduce(
      (sum, t) => sum + t.percentage,
      0
    );

    if (totalStablePercent > 20) {
      policies.stablecoinRebalance = {
        enabled: true,
        tokens: context.stablecoins.map(t => ({
          address: t.address,
          symbol: t.symbol,
          targetPercentage: Math.round(100 / context.stablecoins.length),
        })),
        driftThreshold: 5,
      };
      reasoning.push(
        `${totalStablePercent.toFixed(0)}% stablecoins detected - enabling drift rebalancing`
      );
      confidence += 0.15;
    }
  }

  // 2. Fee claiming (if agent tokens with fees)
  if (context.agentTokens.length > 0) {
    if (context.totalUnclaimedWeth > 0.01) {
      policies.feeClaiming = {
        enabled: true,
        frequency: context.totalUnclaimedWeth > 1 ? 'daily' : 'weekly',
        minThresholdWeth: '0.05',
        tokens: context.agentTokens.map(t => t.address),
      };
      reasoning.push(
        `${context.totalUnclaimedWeth.toFixed(3)} WETH in unclaimed fees - enabling auto-claim`
      );
      confidence += 0.15;
    }

    // 3. WETH strategy (default distribution)
    policies.wethStrategy = {
      compound: 50,
      toStables: 30,
      hold: 20,
    };
    reasoning.push('WETH strategy: 50% compound, 30% to stables, 20% hold');

    // 4. Token exit strategy (if any losers)
    const losers = context.agentTokens.filter(
      t => t.priceChange24h !== undefined && t.priceChange24h < -20
    );

    if (losers.length > 0) {
      policies.tokenStrategy = {
        enabled: true,
        sellLosers: true,
        loserThreshold: 30,
        holdWinners: true,
        winnerThreshold: 20,
      };
      reasoning.push(
        `${losers.length} underperforming token(s) - enabling exit strategy`
      );
      confidence += 0.1;
    }
  }

  // Set defaults
  policies.maxSlippageBps = 50;
  policies.maxDailyUsd = 100000;

  return {
    policy: policies as UnifiedPolicy,
    reasoning: reasoning.length > 0 ? reasoning.join('. ') + '.' : 'No specific strategies recommended.',
    confidence: Math.min(confidence, 0.95),
  };
}

/**
 * Convert stablecoin portfolio tokens to the format needed for unified matching
 */
export function prepareUnifiedContext(
  stablecoins: PortfolioToken[],
  volatile: PortfolioToken[],
  agentTokens: AgentToken[]
): UnifiedMatchContext {
  const totalUnclaimedWeth = agentTokens.reduce(
    (sum, t) => sum + parseFloat(t.unclaimedWethFees || '0'),
    0
  );

  return {
    stablecoins,
    volatile,
    agentTokens,
    totalUnclaimedWeth,
  };
}

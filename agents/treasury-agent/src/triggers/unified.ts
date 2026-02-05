// Phase 4: Unified Trigger System
// Checks all trigger conditions: stablecoin drift, fee thresholds, token exit conditions

import { createPublicClient, http, parseEther, type Address } from 'viem';
import { base } from 'viem/chains';
import type { Env } from '../index';
import type { UnifiedPolicy } from '../policy/templates';
import { checkThresholds, calculateThresholds } from './threshold';
import { discoverAgentTokens, getAgentWallets, type AgentToken } from '../suggestion/clawnch';

// FeeLocker on Base
const FEE_LOCKER_ADDRESS = '0xF3622742b1E446D92e45E22923Ef11C2fcD55D68' as const;

const FeeLockerABI = [
  {
    name: 'availableWethFees',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * Action to be executed based on trigger
 */
export interface TriggerAction {
  type: 'rebalance' | 'claim-fees' | 'exit-token' | 'compound';
  params: Record<string, unknown>;
  priority: number; // Lower = higher priority
}

/**
 * Result of checking all triggers
 */
export interface TriggerResult {
  triggered: boolean;
  reason: string;
  actions: TriggerAction[];
  timestamp: number;
}

/**
 * Result of checking fee threshold
 */
export interface FeeThresholdResult {
  shouldClaim: boolean;
  claimableTokens: Address[];
  totalWeth: string;
  totalWethWei: bigint;
}

/**
 * Result of checking exit conditions
 */
export interface ExitConditionResult {
  shouldExit: boolean;
  tokensToExit: Array<{
    address: Address;
    symbol: string;
    priceChange: number;
    reason: string;
  }>;
}

/**
 * Check all triggers based on unified policy
 */
export async function checkAllTriggers(
  env: Env,
  userAddress: Address,
  policy: UnifiedPolicy
): Promise<TriggerResult> {
  const actions: TriggerAction[] = [];
  const reasons: string[] = [];
  const timestamp = Date.now();

  // 1. Check stablecoin drift
  if (policy.stablecoinRebalance?.enabled) {
    const driftResult = await checkDriftTrigger(env, userAddress, policy);
    if (driftResult.hasDrift) {
      actions.push({
        type: 'rebalance',
        params: {
          drifts: driftResult.drifts,
          tokens: policy.stablecoinRebalance.tokens,
        },
        priority: 2,
      });
      reasons.push(`Drift threshold exceeded for ${driftResult.drifts.length} token(s)`);
    }
  }

  // 2. Check fee claiming threshold
  if (policy.feeClaiming?.enabled) {
    const feeResult = await checkFeeThreshold(env, userAddress, policy.feeClaiming);
    if (feeResult.shouldClaim) {
      actions.push({
        type: 'claim-fees',
        params: {
          tokens: feeResult.claimableTokens,
          totalWeth: feeResult.totalWeth,
        },
        priority: 1, // Fee claiming is high priority
      });
      reasons.push(`Fee threshold met: ${feeResult.totalWeth} WETH claimable`);
    }
  }

  // 3. Check token exit conditions
  if (policy.tokenStrategy?.enabled && policy.tokenStrategy.sellLosers) {
    const exitResult = await checkExitConditions(env, userAddress, policy.tokenStrategy);
    if (exitResult.shouldExit) {
      actions.push({
        type: 'exit-token',
        params: {
          tokens: exitResult.tokensToExit,
        },
        priority: 3,
      });
      reasons.push(`Exit trigger: ${exitResult.tokensToExit.length} underperforming token(s)`);
    }
  }

  // Sort actions by priority
  actions.sort((a, b) => a.priority - b.priority);

  return {
    triggered: actions.length > 0,
    reason: reasons.join('; ') || 'No triggers fired',
    actions,
    timestamp,
  };
}

/**
 * Check stablecoin drift trigger
 */
async function checkDriftTrigger(
  env: Env,
  userAddress: Address,
  policy: UnifiedPolicy
): Promise<{
  hasDrift: boolean;
  drifts: Array<{ token: Address; symbol: string; drift: number }>;
}> {
  if (!policy.stablecoinRebalance?.enabled) {
    return { hasDrift: false, drifts: [] };
  }

  // TODO: Implement actual balance checking
  // For now, return no drift
  return { hasDrift: false, drifts: [] };
}

/**
 * Check fee claiming threshold
 */
export async function checkFeeThreshold(
  env: Env,
  userAddress: Address,
  config: NonNullable<UnifiedPolicy['feeClaiming']>
): Promise<FeeThresholdResult> {
  // Get user's agent wallets
  const agentWallets = await getAgentWallets(env.TREASURY_KV, userAddress);

  if (agentWallets.length === 0 && config.tokens.length === 0) {
    return {
      shouldClaim: false,
      claimableTokens: [],
      totalWeth: '0',
      totalWethWei: 0n,
    };
  }

  const publicClient = createPublicClient({
    chain: base,
    transport: http(env.RPC_URL?.includes('base') ? env.RPC_URL : 'https://mainnet.base.org'),
  });

  let totalWethWei = 0n;
  const claimableTokens: Address[] = [];
  const tokensToCheck = config.tokens.length > 0 ? config.tokens : [];

  // Get tokens from agent discovery if not specified
  if (tokensToCheck.length === 0 && agentWallets.length > 0) {
    const discoveredTokens = await discoverAgentTokens(env, userAddress, agentWallets);
    tokensToCheck.push(...discoveredTokens.map(t => t.address));
  }

  // Check fees for each token
  for (const token of tokensToCheck) {
    for (const agentWallet of agentWallets) {
      try {
        const wethFees = await publicClient.readContract({
          address: FEE_LOCKER_ADDRESS,
          abi: FeeLockerABI,
          functionName: 'availableWethFees',
          args: [token, agentWallet],
        });

        if (wethFees > 0n) {
          totalWethWei += wethFees;
          if (!claimableTokens.includes(token)) {
            claimableTokens.push(token);
          }
        }
      } catch (error) {
        console.warn(`[trigger] Error checking fees for ${token}:`, error);
      }
    }
  }

  const threshold = parseEther(config.minThresholdWeth || '0.1');

  return {
    shouldClaim: totalWethWei >= threshold,
    claimableTokens,
    totalWeth: (Number(totalWethWei) / 1e18).toFixed(4),
    totalWethWei,
  };
}

/**
 * Check token exit conditions (sell losers)
 */
export async function checkExitConditions(
  env: Env,
  userAddress: Address,
  config: NonNullable<UnifiedPolicy['tokenStrategy']>
): Promise<ExitConditionResult> {
  if (!config.enabled || !config.sellLosers) {
    return { shouldExit: false, tokensToExit: [] };
  }

  // Get user's agent tokens with analytics
  const agentWallets = await getAgentWallets(env.TREASURY_KV, userAddress);
  const agentTokens = await discoverAgentTokens(env, userAddress, agentWallets);

  const tokensToExit: ExitConditionResult['tokensToExit'] = [];

  for (const token of agentTokens) {
    if (token.priceChange24h !== undefined) {
      // Check if token is down more than threshold
      if (token.priceChange24h < -config.loserThreshold) {
        tokensToExit.push({
          address: token.address,
          symbol: token.symbol,
          priceChange: token.priceChange24h,
          reason: `Down ${Math.abs(token.priceChange24h).toFixed(1)}% (threshold: ${config.loserThreshold}%)`,
        });
      }
    }
  }

  return {
    shouldExit: tokensToExit.length > 0,
    tokensToExit,
  };
}

/**
 * Check if it's time to claim based on frequency
 */
export function shouldClaimByFrequency(
  frequency: 'daily' | 'weekly' | 'monthly' | 'threshold',
  lastClaimTime: number | undefined
): boolean {
  if (frequency === 'threshold') {
    return true; // Always check threshold, actual decision is based on amount
  }

  if (!lastClaimTime) {
    return true; // Never claimed, should claim
  }

  const now = Date.now();
  const elapsed = now - lastClaimTime;

  switch (frequency) {
    case 'daily':
      return elapsed >= 24 * 60 * 60 * 1000; // 24 hours
    case 'weekly':
      return elapsed >= 7 * 24 * 60 * 60 * 1000; // 7 days
    case 'monthly':
      return elapsed >= 30 * 24 * 60 * 60 * 1000; // 30 days
    default:
      return false;
  }
}

/**
 * Get last claim time from KV
 */
export async function getLastClaimTime(
  kv: KVNamespace,
  userAddress: Address
): Promise<number | undefined> {
  const key = `lastClaim:${userAddress.toLowerCase()}`;
  const data = await kv.get(key);
  return data ? parseInt(data, 10) : undefined;
}

/**
 * Save last claim time to KV
 */
export async function saveLastClaimTime(
  kv: KVNamespace,
  userAddress: Address,
  timestamp: number
): Promise<void> {
  const key = `lastClaim:${userAddress.toLowerCase()}`;
  await kv.put(key, timestamp.toString());
}

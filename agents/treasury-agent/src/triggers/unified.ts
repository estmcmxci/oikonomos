// Phase 4: Unified Trigger System
// Checks all trigger conditions: stablecoin drift, fee thresholds, token exit conditions

import { createPublicClient, http, parseEther, formatUnits, type Address } from 'viem';
import { base } from 'viem/chains';
import type { Env } from '../index';
import type { UnifiedPolicy, TokenAllocation } from '../policy/templates';
import { checkThresholds, calculateThresholds } from './threshold';
import { discoverAgentTokens, getAgentWallets, type AgentToken } from '../suggestion/clawnch';

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

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
 * Drift information for a single token
 */
interface DriftInfo {
  token: Address;
  symbol: string;
  drift: number;
  actual: number;
  target: number;
  balanceRaw: string;
  balanceNormalized: string;
}

/**
 * Check stablecoin drift trigger
 *
 * Compares actual token balances against target allocations and returns
 * tokens that have drifted beyond the threshold.
 */
async function checkDriftTrigger(
  env: Env,
  userAddress: Address,
  policy: UnifiedPolicy
): Promise<{
  hasDrift: boolean;
  drifts: DriftInfo[];
}> {
  if (!policy.stablecoinRebalance?.enabled) {
    return { hasDrift: false, drifts: [] };
  }

  const { tokens, driftThreshold } = policy.stablecoinRebalance;

  if (!tokens || tokens.length === 0) {
    return { hasDrift: false, drifts: [] };
  }

  const client = createPublicClient({
    chain: base,
    transport: http(env.RPC_URL?.includes('base') ? env.RPC_URL : 'https://mainnet.base.org'),
  });

  // 1. Get balances for all tokens with decimal normalization
  const balancePromises = tokens.map(async (token) => {
    try {
      const balance = await client.readContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      });

      // Get decimals (use provided or fetch from chain)
      let decimals = token.decimals;
      if (decimals === undefined) {
        try {
          decimals = await client.readContract({
            address: token.address,
            abi: ERC20_ABI,
            functionName: 'decimals',
          });
        } catch {
          decimals = 18; // Default to 18 if fetch fails
        }
      }

      // Normalize to 18 decimals for consistent comparison
      // This allows comparing USDC (6 decimals) with DAI (18 decimals)
      const normalizedBalance = decimals < 18
        ? balance * BigInt(10 ** (18 - decimals))
        : decimals > 18
          ? balance / BigInt(10 ** (decimals - 18))
          : balance;

      return {
        token: token.address,
        symbol: token.symbol,
        targetPercentage: token.targetPercentage,
        balanceRaw: balance,
        balanceNormalized: normalizedBalance,
        decimals,
      };
    } catch (error) {
      console.warn(`[drift] Error fetching balance for ${token.symbol}:`, error);
      return {
        token: token.address,
        symbol: token.symbol,
        targetPercentage: token.targetPercentage,
        balanceRaw: 0n,
        balanceNormalized: 0n,
        decimals: token.decimals || 18,
      };
    }
  });

  const balances = await Promise.all(balancePromises);

  // 2. Calculate total value (normalized)
  const totalValue = balances.reduce((sum, b) => sum + b.balanceNormalized, 0n);

  if (totalValue === 0n) {
    console.log(`[drift] No stablecoin balance found for ${userAddress}`);
    return { hasDrift: false, drifts: [] };
  }

  // 3. Calculate drift for each token
  const drifts: DriftInfo[] = [];

  for (const balance of balances) {
    // Calculate actual percentage (0-100 scale)
    const actualPercent = Number((balance.balanceNormalized * 10000n) / totalValue) / 100;
    const targetPercent = balance.targetPercentage;
    const drift = Math.abs(actualPercent - targetPercent);

    console.log(
      `[drift] ${balance.symbol}: actual=${actualPercent.toFixed(2)}%, target=${targetPercent}%, drift=${drift.toFixed(2)}%`
    );

    // Check if drift exceeds threshold
    if (drift > driftThreshold) {
      drifts.push({
        token: balance.token,
        symbol: balance.symbol,
        drift,
        actual: actualPercent,
        target: targetPercent,
        balanceRaw: balance.balanceRaw.toString(),
        balanceNormalized: formatUnits(balance.balanceNormalized, 18),
      });
    }
  }

  return {
    hasDrift: drifts.length > 0,
    drifts,
  };
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

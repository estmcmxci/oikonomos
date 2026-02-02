import type { Address, Hex } from 'viem';
import type { Env } from '../index';
import type { Policy } from '../policy/templates';
import { checkDrift } from '../triggers/drift';
import { buildAndSignIntent, submitIntent, getNonce } from '../modes/intentMode';

// KV key prefixes
const STATE_PREFIX = 'state:';
const POLICY_PREFIX = 'policy:';
const AUTH_PREFIX = 'auth:';

// Cooldown period between evaluations (60 seconds)
const EVALUATION_COOLDOWN_MS = 60_000;

// Daily reset hour (UTC)
const DAILY_RESET_HOUR = 0;

export interface EvaluationState {
  lastEvaluationAt: number;
  lastExecutionAt: number | null;
  lastEventId: string | null;
  // Execution tracking
  dailyExecutionCount: number;
  dailyVolumeUsd: number;
  dailyResetAt: number; // Timestamp of last daily reset
  lastExecutionTxHash: string | null;
}

export interface UserAuthorization {
  signature: string;
  expiry: number; // Unix timestamp
  maxDailyUsd: number;
  allowedTokens: Address[];
  createdAt: number;
}

export interface EvaluationContext {
  trigger: 'cron' | 'webhook';
  eventId?: string;
  eventType?: string;
}

export interface EvaluationResult {
  evaluated: boolean;
  skipped: boolean;
  skipReason?: 'cooldown' | 'duplicate_event' | 'no_policy' | 'no_authorization' | 'auth_expired' | 'daily_limit_exceeded';
  hasDrift?: boolean;
  driftDetails?: {
    drifts: Array<{
      symbol: string;
      drift: number;
      action: 'buy' | 'sell';
    }>;
  };
  // Execution results (when auto-execution is enabled)
  executed?: boolean;
  executionResult?: {
    success: boolean;
    txHash?: string;
    error?: string;
  };
}

/**
 * Load user's evaluation state from KV
 */
export async function loadState(
  kv: KVNamespace,
  userAddress: Address
): Promise<EvaluationState | null> {
  const key = `${STATE_PREFIX}${userAddress.toLowerCase()}`;
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EvaluationState;
  } catch {
    return null;
  }
}

/**
 * Save user's evaluation state to KV
 */
export async function saveState(
  kv: KVNamespace,
  userAddress: Address,
  state: EvaluationState
): Promise<void> {
  const key = `${STATE_PREFIX}${userAddress.toLowerCase()}`;
  // TTL of 30 days
  await kv.put(key, JSON.stringify(state), { expirationTtl: 30 * 24 * 60 * 60 });
}

/**
 * Load user's policy from KV
 */
export async function loadPolicy(
  kv: KVNamespace,
  userAddress: Address
): Promise<Policy | null> {
  const key = `${POLICY_PREFIX}${userAddress.toLowerCase()}`;
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Policy;
  } catch {
    return null;
  }
}

/**
 * Save user's policy to KV
 */
export async function savePolicy(
  kv: KVNamespace,
  userAddress: Address,
  policy: Policy
): Promise<void> {
  const key = `${POLICY_PREFIX}${userAddress.toLowerCase()}`;
  // No TTL for policies - they persist until explicitly deleted
  await kv.put(key, JSON.stringify(policy));
}

/**
 * List all user addresses with active policies
 */
export async function listPolicyUsers(kv: KVNamespace): Promise<Address[]> {
  const result = await kv.list({ prefix: POLICY_PREFIX });
  return result.keys.map((k) => k.name.replace(POLICY_PREFIX, '') as Address);
}

/**
 * Load user's authorization from KV
 */
export async function loadAuthorization(
  kv: KVNamespace,
  userAddress: Address
): Promise<UserAuthorization | null> {
  const key = `${AUTH_PREFIX}${userAddress.toLowerCase()}`;
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserAuthorization;
  } catch {
    return null;
  }
}

/**
 * Save user's authorization to KV
 */
export async function saveAuthorization(
  kv: KVNamespace,
  userAddress: Address,
  auth: UserAuthorization
): Promise<void> {
  const key = `${AUTH_PREFIX}${userAddress.toLowerCase()}`;
  // TTL based on expiry
  const ttlSeconds = Math.max(0, Math.floor((auth.expiry - Date.now()) / 1000));
  if (ttlSeconds > 0) {
    await kv.put(key, JSON.stringify(auth), { expirationTtl: ttlSeconds });
  }
}

/**
 * Delete user's authorization from KV
 */
export async function deleteAuthorization(
  kv: KVNamespace,
  userAddress: Address
): Promise<void> {
  const key = `${AUTH_PREFIX}${userAddress.toLowerCase()}`;
  await kv.delete(key);
}

/**
 * Check if authorization is valid
 */
function isAuthorizationValid(auth: UserAuthorization): boolean {
  return auth.expiry > Date.now();
}

/**
 * Check if we need to reset daily counters
 */
function shouldResetDaily(state: EvaluationState): boolean {
  const now = new Date();
  const lastReset = new Date(state.dailyResetAt || 0);

  // Reset if it's a new day (UTC)
  return now.getUTCDate() !== lastReset.getUTCDate() ||
         now.getUTCMonth() !== lastReset.getUTCMonth() ||
         now.getUTCFullYear() !== lastReset.getUTCFullYear();
}

/**
 * Get default pool key for token pair
 */
function getPoolKeyForPair(tokenIn: Address, tokenOut: Address) {
  const DEFAULT_POOL_KEY = {
    fee: 3000,
    tickSpacing: 60,
    hooks: '0x15d3b7CbC9463f92a88cE7B1B384277DA741C040' as Address,
  };

  const isToken0First = tokenIn.toLowerCase() < tokenOut.toLowerCase();
  return {
    currency0: isToken0First ? tokenIn : tokenOut,
    currency1: isToken0First ? tokenOut : tokenIn,
    fee: DEFAULT_POOL_KEY.fee,
    tickSpacing: DEFAULT_POOL_KEY.tickSpacing,
    hooks: DEFAULT_POOL_KEY.hooks,
  };
}

/**
 * Unified evaluation pipeline - called by both cron and webhook triggers
 */
export async function evaluate(
  env: Env,
  kv: KVNamespace,
  userAddress: Address,
  context: EvaluationContext
): Promise<EvaluationResult> {
  const now = Date.now();

  // 1. Load existing state
  let state = await loadState(kv, userAddress);
  if (!state) {
    state = {
      lastEvaluationAt: 0,
      lastExecutionAt: null,
      lastEventId: null,
      dailyExecutionCount: 0,
      dailyVolumeUsd: 0,
      dailyResetAt: now,
      lastExecutionTxHash: null,
    };
  }

  // Reset daily counters if needed
  if (shouldResetDaily(state)) {
    state.dailyExecutionCount = 0;
    state.dailyVolumeUsd = 0;
    state.dailyResetAt = now;
  }

  // 2. Check cooldown (skip if evaluated within last 60s)
  if (now - state.lastEvaluationAt < EVALUATION_COOLDOWN_MS) {
    console.log(`[evaluate] Cooldown active for ${userAddress}, skipping`);
    return { evaluated: false, skipped: true, skipReason: 'cooldown' };
  }

  // 3. Check event deduplication (for webhook triggers)
  if (context.trigger === 'webhook' && context.eventId) {
    if (state.lastEventId === context.eventId) {
      console.log(`[evaluate] Duplicate event ${context.eventId} for ${userAddress}, skipping`);
      return { evaluated: false, skipped: true, skipReason: 'duplicate_event' };
    }
  }

  // 4. Load user's policy
  const policy = await loadPolicy(kv, userAddress);
  if (!policy) {
    console.log(`[evaluate] No policy found for ${userAddress}, skipping`);
    return { evaluated: false, skipped: true, skipReason: 'no_policy' };
  }

  // 5. Run drift check
  console.log(`[evaluate] Running drift check for ${userAddress} (trigger: ${context.trigger})`);
  const driftResult = await checkDrift(env, userAddress, policy);

  // 6. Update state
  state.lastEvaluationAt = now;
  if (context.eventId) {
    state.lastEventId = context.eventId;
  }

  // Build base result
  const baseResult: EvaluationResult = {
    evaluated: true,
    skipped: false,
    hasDrift: driftResult.hasDrift,
    driftDetails: driftResult.hasDrift
      ? {
          drifts: driftResult.drifts.map((d) => ({
            symbol: d.symbol,
            drift: d.drift,
            action: d.action,
          })),
        }
      : undefined,
  };

  // 7. If drift detected, attempt auto-execution
  if (driftResult.hasDrift) {
    console.log(`[evaluate] Drift detected for ${userAddress}:`, driftResult.drifts);

    // Load authorization
    const auth = await loadAuthorization(kv, userAddress);

    if (!auth) {
      console.log(`[evaluate] No authorization for ${userAddress}, skipping execution`);
      await saveState(kv, userAddress, state);
      return { ...baseResult, executed: false, executionResult: { success: false, error: 'No authorization' } };
    }

    if (!isAuthorizationValid(auth)) {
      console.log(`[evaluate] Authorization expired for ${userAddress}, skipping execution`);
      await saveState(kv, userAddress, state);
      return { ...baseResult, executed: false, executionResult: { success: false, error: 'Authorization expired' } };
    }

    // Check daily limit (rough estimate - in production use price oracle)
    // For now, assume each execution is ~$100 USD equivalent
    const estimatedTradeUsd = 100;
    if (state.dailyVolumeUsd + estimatedTradeUsd > auth.maxDailyUsd) {
      console.log(`[evaluate] Daily limit exceeded for ${userAddress} (${state.dailyVolumeUsd}/${auth.maxDailyUsd})`);
      await saveState(kv, userAddress, state);
      return { ...baseResult, executed: false, executionResult: { success: false, error: 'Daily limit exceeded' } };
    }

    // Execute the rebalance
    const executionResult = await executeAutoRebalance(env, userAddress, policy, driftResult, auth);

    // Update state with execution info
    if (executionResult.success) {
      state.lastExecutionAt = now;
      state.dailyExecutionCount += 1;
      state.dailyVolumeUsd += estimatedTradeUsd;
      state.lastExecutionTxHash = executionResult.txHash || null;
    }

    await saveState(kv, userAddress, state);
    return { ...baseResult, executed: true, executionResult };
  }

  // 8. Save updated state (no drift case)
  await saveState(kv, userAddress, state);
  return baseResult;
}

/**
 * Execute auto-rebalance when drift is detected and authorization is valid
 */
async function executeAutoRebalance(
  env: Env,
  userAddress: Address,
  policy: Policy,
  driftResult: Awaited<ReturnType<typeof checkDrift>>,
  auth: UserAuthorization
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  console.log(`[executeAutoRebalance] Starting for ${userAddress}`);

  // Find the first sell/buy pair
  const sellDrift = driftResult.drifts.find((d) => d.action === 'sell');
  const buyDrift = driftResult.drifts.find((d) => d.action === 'buy');

  if (!sellDrift || !buyDrift) {
    return { success: false, error: 'No valid sell/buy pair found' };
  }

  // Check if tokens are in allowed list
  if (auth.allowedTokens.length > 0) {
    const sellAllowed = auth.allowedTokens.some(
      (t) => t.toLowerCase() === sellDrift.token.toLowerCase()
    );
    const buyAllowed = auth.allowedTokens.some(
      (t) => t.toLowerCase() === buyDrift.token.toLowerCase()
    );

    if (!sellAllowed || !buyAllowed) {
      return { success: false, error: 'Token not in allowed list' };
    }
  }

  try {
    // Get nonce for user
    const nonce = await getNonce(env, userAddress);

    // Build and sign intent
    const signedIntent = await buildAndSignIntent(env, {
      user: userAddress,
      tokenIn: sellDrift.token,
      tokenOut: buyDrift.token,
      amountIn: BigInt(sellDrift.amount),
      maxSlippageBps: policy.maxSlippageBps,
      strategyId: (env.STRATEGY_ID || '0x0000000000000000000000000000000000000000000000000000000000000001') as Hex,
      nonce,
      ttlSeconds: 3600,
    });

    // Get pool key for the pair
    const poolKey = getPoolKeyForPair(sellDrift.token, buyDrift.token);

    // Generate a quote ID (in production, get from strategy agent)
    const quoteId = `0x${Date.now().toString(16).padStart(64, '0')}` as Hex;

    // Submit intent
    const txHash = await submitIntent(env, signedIntent, poolKey, quoteId);

    console.log(`[executeAutoRebalance] Success for ${userAddress}: ${txHash}`);
    return { success: true, txHash };
  } catch (error) {
    console.error(`[executeAutoRebalance] Failed for ${userAddress}:`, error);
    return { success: false, error: String(error) };
  }
}

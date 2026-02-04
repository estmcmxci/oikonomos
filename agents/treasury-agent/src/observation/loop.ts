import type { Address, Hex } from 'viem';
import type { Env } from '../index';
import type { Policy } from '../policy/templates';
import { checkDrift } from '../triggers/drift';
import { buildAndSignIntent, submitIntent, getNonce } from '../modes/intentMode';
import { executeWithSessionKey } from '../modes/sessionMode';
import { getSessionKey } from '../session/storage';
import { requirePoolForPair } from '../config/pools';

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
    userOpHash?: string; // OIK-10: UserOperation hash for session key execution
    executionMode?: 'intent' | 'session-key'; // OIK-10: Which execution mode was used
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
 * Get pool key for token pair from the pool registry.
 * Only pools initialized with ReceiptHook are supported.
 *
 * @see agents/treasury-agent/src/config/pools.ts (OIK-39)
 */
function getPoolKeyForPair(tokenIn: Address, tokenOut: Address) {
  return requirePoolForPair(tokenIn, tokenOut);
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

    // Execute the rebalance (OIK-10: Now passes kv for session key lookup)
    const executionResult = await executeAutoRebalance(env, kv, userAddress, policy, driftResult, auth);

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
 * OIK-10: Now supports both Mode A (intent) and Mode B (session key) execution
 */
async function executeAutoRebalance(
  env: Env,
  kv: KVNamespace,
  userAddress: Address,
  policy: Policy,
  driftResult: Awaited<ReturnType<typeof checkDrift>>,
  auth: UserAuthorization
): Promise<{ success: boolean; txHash?: string; userOpHash?: string; executionMode?: 'intent' | 'session-key'; error?: string }> {
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

  // OIK-10: Check for active session key
  const sessionKey = await getSessionKey(kv, userAddress);

  if (sessionKey) {
    // Mode B: Execute via session key (autonomous)
    console.log(`[executeAutoRebalance] Using session key for ${userAddress} (Mode B)`);
    return await executeWithSessionKeyMode(env, userAddress, policy, sellDrift, buyDrift, sessionKey);
  } else {
    // Mode A: Execute via signed intent
    console.log(`[executeAutoRebalance] Using signed intent for ${userAddress} (Mode A)`);
    return await executeWithIntentMode(env, userAddress, policy, sellDrift, buyDrift);
  }
}

/**
 * Mode A: Execute via signed intent (user signs each trade)
 */
async function executeWithIntentMode(
  env: Env,
  userAddress: Address,
  policy: Policy,
  sellDrift: { token: Address; amount: string; symbol: string; drift: number; action: 'buy' | 'sell' },
  buyDrift: { token: Address; amount: string; symbol: string; drift: number; action: 'buy' | 'sell' }
): Promise<{ success: boolean; txHash?: string; executionMode?: 'intent' | 'session-key'; error?: string }> {
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

    console.log(`[executeWithIntentMode] Success for ${userAddress}: ${txHash}`);
    return { success: true, txHash, executionMode: 'intent' };
  } catch (error) {
    console.error(`[executeWithIntentMode] Failed for ${userAddress}:`, error);
    return { success: false, error: String(error), executionMode: 'intent' };
  }
}

/**
 * Mode B: Execute via session key (autonomous execution)
 * OIK-10: Uses ZeroDev session keys for ERC-4337 UserOperation submission
 */
async function executeWithSessionKeyMode(
  env: Env,
  userAddress: Address,
  policy: Policy,
  sellDrift: { token: Address; amount: string; symbol: string; drift: number; action: 'buy' | 'sell' },
  buyDrift: { token: Address; amount: string; symbol: string; drift: number; action: 'buy' | 'sell' },
  sessionKey: Awaited<ReturnType<typeof getSessionKey>>
): Promise<{ success: boolean; txHash?: string; userOpHash?: string; executionMode?: 'intent' | 'session-key'; error?: string }> {
  if (!sessionKey) {
    return { success: false, error: 'No session key provided', executionMode: 'session-key' };
  }

  try {
    // Get nonce for user's smart account (not EOA)
    const nonce = await getNonce(env, sessionKey.smartAccountAddress as Address);

    // Build intent struct
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const intent = {
      user: sessionKey.smartAccountAddress as Address,
      tokenIn: sellDrift.token,
      tokenOut: buyDrift.token,
      amountIn: BigInt(sellDrift.amount),
      maxSlippage: BigInt(policy.maxSlippageBps),
      deadline,
      strategyId: (env.STRATEGY_ID || '0x0000000000000000000000000000000000000000000000000000000000000001') as Hex,
      nonce,
    };

    // Get pool key for the pair
    const poolKey = getPoolKeyForPair(sellDrift.token, buyDrift.token);

    // Note: For session key execution, we don't need user signature
    // The session key validator authorizes the agent to execute
    const signature = '0x' as Hex; // Empty signature - session key provides authorization

    // Execute via session key
    const result = await executeWithSessionKey(env, {
      sessionKey,
      intent,
      signature,
      poolKey,
      strategyData: `0x${Date.now().toString(16).padStart(64, '0')}` as Hex,
    });

    if (result.success) {
      console.log(`[executeWithSessionKeyMode] Success for ${userAddress}: userOp=${result.userOpHash}, tx=${result.txHash}`);
      return {
        success: true,
        txHash: result.txHash,
        userOpHash: result.userOpHash,
        executionMode: 'session-key',
      };
    } else {
      console.error(`[executeWithSessionKeyMode] Failed for ${userAddress}:`, result.error);
      return { success: false, error: result.error, executionMode: 'session-key' };
    }
  } catch (error) {
    console.error(`[executeWithSessionKeyMode] Failed for ${userAddress}:`, error);
    return { success: false, error: String(error), executionMode: 'session-key' };
  }
}

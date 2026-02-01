import type { Address } from 'viem';
import type { Env } from '../index';
import type { Policy } from '../policy/templates';
import { checkDrift } from '../triggers/drift';

// KV key prefixes
const STATE_PREFIX = 'state:';
const POLICY_PREFIX = 'policy:';

// Cooldown period between evaluations (60 seconds)
const EVALUATION_COOLDOWN_MS = 60_000;

export interface EvaluationState {
  lastEvaluationAt: number;
  lastExecutionAt: number | null;
  lastEventId: string | null;
}

export interface EvaluationContext {
  trigger: 'cron' | 'webhook';
  eventId?: string;
  eventType?: string;
}

export interface EvaluationResult {
  evaluated: boolean;
  skipped: boolean;
  skipReason?: 'cooldown' | 'duplicate_event' | 'no_policy';
  hasDrift?: boolean;
  driftDetails?: {
    drifts: Array<{
      symbol: string;
      drift: number;
      action: 'buy' | 'sell';
    }>;
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
    };
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

  // 7. If drift detected, log it (actual execution is handled separately)
  if (driftResult.hasDrift) {
    console.log(`[evaluate] Drift detected for ${userAddress}:`, driftResult.drifts);
    state.lastExecutionAt = now;
  }

  // 8. Save updated state
  await saveState(kv, userAddress, state);

  return {
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
}

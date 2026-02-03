/**
 * Daily spending tracker for authorization limits
 * OIK-42: Authorization validation during rebalance execution
 */

import type { Address } from 'viem';

const SPENDING_PREFIX = 'spending:';
const SPENDING_TTL = 86400; // 24 hours in seconds

/**
 * Get the current date key in YYYY-MM-DD format (UTC)
 */
function getDateKey(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get the KV key for a user's daily spending
 */
function getSpendingKey(userAddress: Address): string {
  const dateKey = getDateKey();
  return `${SPENDING_PREFIX}${userAddress.toLowerCase()}:${dateKey}`;
}

/**
 * Get the daily spent amount for a user
 */
export async function getDailySpent(
  kv: KVNamespace,
  userAddress: Address
): Promise<number> {
  const key = getSpendingKey(userAddress);
  const raw = await kv.get(key);

  if (!raw) {
    return 0;
  }

  return parseFloat(raw);
}

/**
 * Track spending for a user (add to daily total)
 */
export async function trackSpending(
  kv: KVNamespace,
  userAddress: Address,
  amountUsd: number
): Promise<void> {
  const key = getSpendingKey(userAddress);
  const currentSpent = await getDailySpent(kv, userAddress);
  const newTotal = currentSpent + amountUsd;

  await kv.put(key, newTotal.toString(), {
    expirationTtl: SPENDING_TTL,
  });
}

/**
 * Check if a user can spend a given amount without exceeding their daily limit
 */
export async function canSpend(
  kv: KVNamespace,
  userAddress: Address,
  amountUsd: number,
  maxDailyUsd: number
): Promise<{ allowed: boolean; currentSpent: number; remaining: number }> {
  const currentSpent = await getDailySpent(kv, userAddress);
  const remaining = maxDailyUsd - currentSpent;
  const allowed = currentSpent + amountUsd <= maxDailyUsd;

  return { allowed, currentSpent, remaining };
}

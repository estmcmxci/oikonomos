import type { Address } from 'viem';
import type { FeeEarning } from './types';

/**
 * Fee Analytics for Strategy Providers
 *
 * Tracks fee earnings for monetization analytics
 */

const FEE_EARNINGS_PREFIX = 'fee:';
const FEE_TOTALS_KEY = 'fee:totals';

interface FeeTotals {
  totalEarnings: string;
  totalExecutions: number;
  lastUpdated: number;
}

/**
 * Record a fee earning
 */
export async function recordFeeEarning(
  kv: KVNamespace,
  earning: FeeEarning
): Promise<void> {
  // Store individual earning
  const key = `${FEE_EARNINGS_PREFIX}${earning.quoteId}`;
  await kv.put(key, JSON.stringify(earning), {
    expirationTtl: 86400 * 30, // Keep for 30 days
  });

  // Update totals
  await updateFeeTotals(kv, earning.feeAmount);
}

/**
 * Update cumulative fee totals
 */
async function updateFeeTotals(kv: KVNamespace, feeAmount: string): Promise<void> {
  const existingData = await kv.get(FEE_TOTALS_KEY);
  let totals: FeeTotals;

  if (existingData) {
    totals = JSON.parse(existingData);
    totals.totalEarnings = (BigInt(totals.totalEarnings) + BigInt(feeAmount)).toString();
    totals.totalExecutions += 1;
  } else {
    totals = {
      totalEarnings: feeAmount,
      totalExecutions: 1,
      lastUpdated: Date.now(),
    };
  }

  totals.lastUpdated = Date.now();
  await kv.put(FEE_TOTALS_KEY, JSON.stringify(totals));
}

/**
 * Get fee analytics summary
 */
export async function getFeeAnalytics(kv: KVNamespace): Promise<FeeTotals | null> {
  const data = await kv.get(FEE_TOTALS_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Get recent fee earnings (last N)
 */
export async function getRecentEarnings(
  kv: KVNamespace,
  limit: number = 10
): Promise<FeeEarning[]> {
  const list = await kv.list({ prefix: FEE_EARNINGS_PREFIX, limit });
  const earnings: FeeEarning[] = [];

  for (const key of list.keys) {
    if (key.name === FEE_TOTALS_KEY) continue;
    const data = await kv.get(key.name);
    if (data) {
      earnings.push(JSON.parse(data));
    }
  }

  return earnings.sort((a, b) => b.timestamp - a.timestamp);
}

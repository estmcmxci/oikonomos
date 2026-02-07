// Claim History Tracker
// Stores and retrieves fee claim history per user in KV

export interface ClaimHistoryEntry {
  agentName: string;
  tokenAddress: string;
  wethClaimed: string;
  deployerAmount: string;
  serviceFee: string;
  claimTxHash?: string;
  distributionTxHash?: string;
  timestamp: number;
  mode: 'auto' | 'manual';
}

const MAX_ENTRIES = 50;
const TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

function kvKey(userAddress: string): string {
  return `claimHistory:${userAddress.toLowerCase()}`;
}

/**
 * Record a new claim in the user's history.
 * Prepends the entry and caps at MAX_ENTRIES.
 */
export async function recordClaim(
  kv: KVNamespace,
  userAddress: string,
  entry: ClaimHistoryEntry
): Promise<void> {
  const key = kvKey(userAddress);
  const existing = await kv.get(key);

  let entries: ClaimHistoryEntry[] = [];
  if (existing) {
    try {
      entries = JSON.parse(existing) as ClaimHistoryEntry[];
    } catch {
      entries = [];
    }
  }

  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(0, MAX_ENTRIES);
  }

  await kv.put(key, JSON.stringify(entries), { expirationTtl: TTL_SECONDS });
}

/**
 * Get recent claim history for a user.
 */
export async function getClaimHistory(
  kv: KVNamespace,
  userAddress: string,
  limit?: number
): Promise<ClaimHistoryEntry[]> {
  const key = kvKey(userAddress);
  const data = await kv.get(key);

  if (!data) return [];

  try {
    const entries = JSON.parse(data) as ClaimHistoryEntry[];
    return limit ? entries.slice(0, limit) : entries;
  } catch {
    return [];
  }
}

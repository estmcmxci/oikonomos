import type { Address, Hex } from 'viem';

const SESSION_KEY_PREFIX = 'session:';

// Inline types from SDK to avoid dependency
export interface SessionKeyConfig {
  agentAddress: Address;
  allowedTargets: Address[];
  allowedFunctions: string[];
  validAfter: number;
  validUntil: number;
  maxGasCost?: bigint;
  maxDailyUsd?: number;
}

export interface SessionKey {
  address: Address;
  serialized: Hex;
  config: SessionKeyConfig;
  smartAccountAddress: Address;
}

export interface StoredSessionKey {
  /** The session key address (agent address) */
  address: `0x${string}`;
  /** Serialized session key account for deserialization */
  serialized: string;
  /** Configuration used to create the key */
  config: SessionKeyConfig;
  /** Smart account address this key is bound to */
  smartAccountAddress: `0x${string}`;
  /** When the session was created */
  createdAt: number;
}

/**
 * Stores a session key in KV with automatic expiration
 */
export async function storeSessionKey(
  kv: KVNamespace,
  userAddress: string,
  sessionKey: SessionKey
): Promise<void> {
  const key = `${SESSION_KEY_PREFIX}${userAddress.toLowerCase()}`;
  const now = Math.floor(Date.now() / 1000);
  const ttl = sessionKey.config.validUntil - now;

  // Don't store if already expired
  if (ttl <= 0) {
    throw new Error('Session key has already expired');
  }

  const stored: StoredSessionKey = {
    address: sessionKey.address,
    serialized: sessionKey.serialized,
    config: sessionKey.config,
    smartAccountAddress: sessionKey.smartAccountAddress,
    createdAt: now,
  };

  await kv.put(key, JSON.stringify(stored), {
    expirationTtl: ttl,
  });
}

/**
 * Retrieves a session key from KV
 */
export async function getSessionKey(
  kv: KVNamespace,
  userAddress: string
): Promise<StoredSessionKey | null> {
  const key = `${SESSION_KEY_PREFIX}${userAddress.toLowerCase()}`;
  const data = await kv.get(key);

  if (!data) return null;

  const stored = JSON.parse(data) as StoredSessionKey;

  // Double-check expiration (defense in depth)
  const now = Math.floor(Date.now() / 1000);
  if (stored.config.validUntil <= now) {
    // Expired, delete and return null
    await kv.delete(key);
    return null;
  }

  return stored;
}

/**
 * Revokes (deletes) a session key from KV
 */
export async function revokeSessionKey(
  kv: KVNamespace,
  userAddress: string
): Promise<void> {
  const key = `${SESSION_KEY_PREFIX}${userAddress.toLowerCase()}`;
  await kv.delete(key);
}

/**
 * Lists all active session keys (for admin/debugging)
 */
export async function listSessionKeys(
  kv: KVNamespace,
  limit: number = 100
): Promise<{ userAddress: string; session: StoredSessionKey }[]> {
  const keys = await kv.list({ prefix: SESSION_KEY_PREFIX, limit });
  const results: { userAddress: string; session: StoredSessionKey }[] = [];

  for (const key of keys.keys) {
    const data = await kv.get(key.name);
    if (data) {
      const session = JSON.parse(data) as StoredSessionKey;
      const userAddress = key.name.replace(SESSION_KEY_PREFIX, '');
      results.push({ userAddress, session });
    }
  }

  return results;
}

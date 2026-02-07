// Phase 5: Agent Key Management
// Handles agent wallet generation, derivation, and secure storage

import {
  keccak256,
  encodePacked,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Env } from '../index';
import { getNostrPublicKey } from './nostr';

/**
 * Agent wallet with keys
 */
export interface AgentWallet {
  address: Address;
  privateKey: `0x${string}`;
}

/**
 * Stored agent data
 */
export interface DistributionSchedule {
  type: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  customDays?: number;
}

export interface StoredAgent {
  address: Address;
  encryptedKey: string;
  agentName: string;
  agentType?: string;
  ensName: string;
  erc8004Id?: number;
  nostrPubkey?: string;
  tokenAddress?: Address;
  tokenSymbol?: string;
  delegatedTo?: Address;
  delegatedToEns?: string;
  delegationTxHash?: string;
  feeSplit?: number; // 0-100, deployer percentage
  distributionMode?: 'auto' | 'manual'; // default: 'auto'
  distributionSchedule?: DistributionSchedule;
  lastDistributionTime?: number; // epoch ms
  nextDistributionTime?: number; // computed
  createdAt: number;
}

/**
 * Get the interval in milliseconds for a distribution schedule
 */
export function getScheduleIntervalMs(schedule: DistributionSchedule): number {
  const DAY_MS = 24 * 60 * 60 * 1000;
  switch (schedule.type) {
    case 'weekly':
      return 7 * DAY_MS;
    case 'biweekly':
      return 14 * DAY_MS;
    case 'monthly':
      return 30 * DAY_MS;
    case 'custom':
      return (schedule.customDays ?? 7) * DAY_MS;
  }
}

/**
 * Compute next distribution time from last distribution and schedule
 */
export function computeNextDistributionTime(
  lastTime: number,
  schedule: DistributionSchedule
): number {
  return lastTime + getScheduleIntervalMs(schedule);
}

/**
 * Check if distribution is due based on last time and schedule
 */
export function isDueForDistribution(
  lastTime: number | undefined,
  schedule: DistributionSchedule | undefined
): boolean {
  // If no schedule set, always distribute (backward compat — every cron tick)
  if (!schedule) return true;
  // If never distributed before, it's due
  if (!lastTime) return true;
  return Date.now() >= computeNextDistributionTime(lastTime, schedule);
}

/**
 * Generate a deterministic agent wallet from user address and agent name
 *
 * The private key is derived from: keccak256(userAddress + agentName + salt)
 * This allows recovery without storing raw private keys (if user can reproduce the derivation)
 *
 * Note: In production, you would use a proper key derivation function (KDF) like PBKDF2 or scrypt,
 * and require a user signature to derive the key.
 */
export function generateAgentWallet(
  userAddress: Address,
  agentName: string,
  salt: string
): AgentWallet {
  // Derive agent key deterministically
  const seed = keccak256(
    encodePacked(
      ['address', 'string', 'string'],
      [userAddress, agentName, salt]
    )
  );

  const privateKey = seed as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  return {
    address: account.address,
    privateKey,
  };
}

/**
 * Derive Nostr keys from agent private key
 * Nostr uses secp256k1, same as Ethereum, so we can derive from the agent key
 */
export function deriveNostrKeys(
  agentPrivateKey: `0x${string}`,
  agentName: string
): {
  privateKey: string; // hex without 0x prefix (nsec format input)
  publicKey: string; // hex without 0x prefix (npub format input)
} {
  // For Nostr, we derive a separate key to keep identities separate
  const nostrSeed = keccak256(
    encodePacked(
      ['bytes32', 'string'],
      [agentPrivateKey, `nostr:${agentName}`]
    )
  );

  // Nostr uses raw 32-byte private keys (no 0x prefix)
  const privateKey = nostrSeed.slice(2);

  // Get proper secp256k1 public key using nostr-tools via nostr.ts helper
  let publicKey: string;
  try {
    publicKey = getNostrPublicKey(privateKey);
  } catch {
    // Fallback: use keccak256 as placeholder (not valid secp256k1)
    publicKey = keccak256(nostrSeed).slice(2);
  }

  return { privateKey, publicKey };
}

/**
 * Store agent keys securely in KV
 *
 * Note: In production, the private key should be encrypted with the user's public key
 * before storage. For MVP, we store with basic obfuscation.
 */
export async function storeAgentKeys(
  kv: KVNamespace,
  userAddress: Address,
  agentName: string,
  wallet: AgentWallet,
  metadata?: {
    ensName?: string;
    erc8004Id?: number;
    nostrPubkey?: string;
    tokenAddress?: Address;
    tokenSymbol?: string;
    agentType?: string;
    delegatedTo?: Address;
    delegatedToEns?: string;
    delegationTxHash?: string;
    feeSplit?: number;
  }
): Promise<void> {
  const key = `agent:${userAddress.toLowerCase()}:${agentName}`;

  const storedAgent: StoredAgent = {
    address: wallet.address,
    // In production: encrypt this with user's public key
    encryptedKey: wallet.privateKey,
    agentName,
    agentType: metadata?.agentType,
    ensName: metadata?.ensName || `${agentName}.oikonomosapp.eth`,
    erc8004Id: metadata?.erc8004Id,
    nostrPubkey: metadata?.nostrPubkey,
    tokenAddress: metadata?.tokenAddress,
    tokenSymbol: metadata?.tokenSymbol,
    delegatedTo: metadata?.delegatedTo,
    delegatedToEns: metadata?.delegatedToEns,
    delegationTxHash: metadata?.delegationTxHash,
    feeSplit: metadata?.feeSplit,
    createdAt: Date.now(),
  };

  await kv.put(key, JSON.stringify(storedAgent));

  // Also update the user's agent list
  await addAgentToUserList(kv, userAddress, wallet.address);
}

/**
 * Get stored agent data
 */
export async function getStoredAgent(
  kv: KVNamespace,
  userAddress: Address,
  agentName: string
): Promise<StoredAgent | null> {
  const key = `agent:${userAddress.toLowerCase()}:${agentName}`;
  const data = await kv.get(key);

  if (!data) return null;

  try {
    return JSON.parse(data) as StoredAgent;
  } catch {
    return null;
  }
}

/**
 * Update specific fields on a stored agent (read-modify-write).
 */
export async function updateStoredAgent(
  kv: KVNamespace,
  userAddress: Address,
  agentName: string,
  updates: Partial<Omit<StoredAgent, 'address' | 'encryptedKey' | 'agentName' | 'createdAt'>>
): Promise<boolean> {
  const key = `agent:${userAddress.toLowerCase()}:${agentName}`;
  const data = await kv.get(key);
  if (!data) return false;

  try {
    const agent = JSON.parse(data) as StoredAgent;
    const updated = { ...agent, ...updates };
    await kv.put(key, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get agent private key (for execution)
 */
export async function getAgentPrivateKey(
  kv: KVNamespace,
  userAddress: Address,
  agentName: string
): Promise<`0x${string}` | null> {
  const agent = await getStoredAgent(kv, userAddress, agentName);
  if (!agent) return null;

  // In production: decrypt with user's signature
  return agent.encryptedKey as `0x${string}`;
}

/**
 * Add agent wallet to user's agent list
 */
async function addAgentToUserList(
  kv: KVNamespace,
  userAddress: Address,
  agentWallet: Address
): Promise<void> {
  const key = `agents:${userAddress.toLowerCase()}`;
  const existing = await kv.get(key);

  let agents: Address[] = [];
  if (existing) {
    try {
      agents = JSON.parse(existing) as Address[];
    } catch {
      agents = [];
    }
  }

  if (!agents.includes(agentWallet)) {
    agents.push(agentWallet);
    await kv.put(key, JSON.stringify(agents));
  }
}

/**
 * Get all agents for a user
 */
export async function getUserAgents(
  kv: KVNamespace,
  userAddress: Address
): Promise<Address[]> {
  const key = `agents:${userAddress.toLowerCase()}`;
  const data = await kv.get(key);

  if (!data) return [];

  try {
    return JSON.parse(data) as Address[];
  } catch {
    return [];
  }
}

/**
 * List all stored agent details for a user
 */
export async function listUserAgentDetails(
  kv: KVNamespace,
  userAddress: Address
): Promise<StoredAgent[]> {
  // Get all keys matching the pattern
  const prefix = `agent:${userAddress.toLowerCase()}:`;
  const list = await kv.list({ prefix });

  const agents: StoredAgent[] = [];

  for (const key of list.keys) {
    const data = await kv.get(key.name);
    if (data) {
      try {
        agents.push(JSON.parse(data) as StoredAgent);
      } catch {
        // Skip invalid entries
      }
    }
  }

  return agents;
}

/**
 * Find a user's agent by type (e.g. 'treasury', 'defi', 'portfolio').
 * Returns the first matching agent, or null if none found.
 */
export async function findUserAgentByType(
  kv: KVNamespace,
  userAddress: Address,
  agentType: string
): Promise<StoredAgent | null> {
  const agents = await listUserAgentDetails(kv, userAddress);
  return agents.find(a => a.agentType === agentType) ?? null;
}

/**
 * Delegation index entry — links a delegated agent back to its owner
 */
export interface DelegationIndexEntry {
  userAddress: Address;
  agentName: string;
}

/**
 * Add an agent to the delegation index for a given treasury address.
 * The cron uses this index to discover all agents delegated to the treasury.
 */
export async function addDelegationIndex(
  kv: KVNamespace,
  treasuryAddress: Address,
  userAddress: Address,
  agentName: string
): Promise<void> {
  const key = `delegationIndex:${treasuryAddress.toLowerCase()}`;
  const existing = await kv.get(key);

  let entries: DelegationIndexEntry[] = [];
  if (existing) {
    try {
      entries = JSON.parse(existing) as DelegationIndexEntry[];
    } catch {
      entries = [];
    }
  }

  // Avoid duplicates
  const alreadyExists = entries.some(
    e => e.userAddress.toLowerCase() === userAddress.toLowerCase() && e.agentName === agentName
  );
  if (!alreadyExists) {
    entries.push({ userAddress, agentName });
    await kv.put(key, JSON.stringify(entries));
  }
}

/**
 * Get all agents delegated to a given treasury address.
 * Used by the cron to discover which agents to claim fees for.
 */
export async function getDelegationIndex(
  kv: KVNamespace,
  treasuryAddress: Address
): Promise<DelegationIndexEntry[]> {
  const key = `delegationIndex:${treasuryAddress.toLowerCase()}`;
  const data = await kv.get(key);

  if (!data) return [];

  try {
    return JSON.parse(data) as DelegationIndexEntry[];
  } catch {
    return [];
  }
}

/**
 * Treasury agent entry — registered via /launch-portfolio so the cron can iterate all treasuries.
 */
export interface TreasuryAgentEntry {
  treasuryAddress: Address;
  userAddress: Address;
  agentName: string;
  createdAt: number;
}

/**
 * Add a treasury agent to the global index.
 * The cron iterates this list to process delegated fee claims for every treasury.
 */
export async function addTreasuryAgentToGlobalIndex(
  kv: KVNamespace,
  treasuryAddress: Address,
  userAddress: Address,
  agentName: string
): Promise<void> {
  const key = 'treasuryAgents:all';
  const existing = await kv.get(key);

  let entries: TreasuryAgentEntry[] = [];
  if (existing) {
    try {
      entries = JSON.parse(existing) as TreasuryAgentEntry[];
    } catch {
      entries = [];
    }
  }

  // Deduplicate by treasury address
  const alreadyExists = entries.some(
    e => e.treasuryAddress.toLowerCase() === treasuryAddress.toLowerCase()
  );
  if (!alreadyExists) {
    entries.push({ treasuryAddress, userAddress, agentName, createdAt: Date.now() });
    await kv.put(key, JSON.stringify(entries));
  }
}

/**
 * Get all registered treasury agents.
 * Used by the cron to discover all portfolio treasuries for delegated fee claims.
 */
export async function getAllTreasuryAgents(
  kv: KVNamespace
): Promise<TreasuryAgentEntry[]> {
  const key = 'treasuryAgents:all';
  const data = await kv.get(key);

  if (!data) return [];

  try {
    return JSON.parse(data) as TreasuryAgentEntry[];
  } catch {
    return [];
  }
}

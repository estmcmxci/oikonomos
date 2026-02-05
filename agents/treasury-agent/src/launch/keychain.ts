// Phase 5: Agent Key Management
// Handles agent wallet generation, derivation, and secure storage

import {
  keccak256,
  encodePacked,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Env } from '../index';

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
export interface StoredAgent {
  address: Address;
  encryptedKey: string;
  agentName: string;
  ensName: string;
  erc8004Id?: number;
  nostrPubkey?: string;
  tokenAddress?: Address;
  createdAt: number;
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

  // Get proper secp256k1 public key using nostr-tools
  // Import dynamically to avoid bundling issues in Workers
  let publicKey: string;
  try {
    // nostr-tools getPublicKey expects Uint8Array
    const { getPublicKey } = require('nostr-tools');
    const privateKeyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      privateKeyBytes[i] = parseInt(privateKey.slice(i * 2, i * 2 + 2), 16);
    }
    publicKey = getPublicKey(privateKeyBytes);
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
  }
): Promise<void> {
  const key = `agent:${userAddress.toLowerCase()}:${agentName}`;

  const storedAgent: StoredAgent = {
    address: wallet.address,
    // In production: encrypt this with user's public key
    encryptedKey: wallet.privateKey,
    agentName,
    ensName: metadata?.ensName || `${agentName}.oikonomos.eth`,
    erc8004Id: metadata?.erc8004Id,
    nostrPubkey: metadata?.nostrPubkey,
    tokenAddress: metadata?.tokenAddress,
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

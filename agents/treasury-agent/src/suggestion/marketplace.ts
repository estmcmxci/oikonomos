// OIK-34: Multi-Agent Marketplace Discovery
// Fetches registered agents, resolves ENS marketplace records, filters & ranks

import { createPublicClient, http, namehash, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import type { Env } from '../index';

// ENS Public Resolver on Sepolia
const ENS_PUBLIC_RESOLVER = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';

// Marketplace ENS record keys
const MARKETPLACE_RECORDS = [
  'agent:type',
  'agent:mode',
  'agent:version',
  'agent:chainId',
  'agent:entrypoint',
  'agent:a2a',
  'agent:erc8004',
  'agent:supportedTokens',
  'agent:policyTypes',
  'agent:pricing',
  'agent:description',
] as const;

export interface IndexerAgent {
  id: string;
  owner: string;
  agentURI: string;
  agentWallet: string;
  ens: string | null;
  registeredAt: string;
}

export interface MarketplaceRecords {
  type?: string;
  mode?: string;
  version?: string;
  chainId?: string;
  entrypoint?: string;
  a2a?: string;
  erc8004?: string;
  supportedTokens?: string[];
  policyTypes?: string[];
  pricing?: string;
  description?: string;
}

export interface MarketplaceAgent extends IndexerAgent {
  records: MarketplaceRecords;
  trustScore: number;
}

export interface MarketplaceFilter {
  tokens?: string[]; // Token symbols to match (e.g., ['USDC', 'DAI'])
  policyType?: string; // Policy type to match (e.g., 'stablecoin-rebalance')
}

/**
 * Fetch registered agents from the indexer
 */
export async function fetchAgentsFromIndexer(env: Env): Promise<IndexerAgent[]> {
  const indexerUrl = env.INDEXER_URL || 'https://oikonomos-indexer.ponder.sh';

  try {
    const response = await fetch(`${indexerUrl}/agents?limit=100`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[marketplace] Failed to fetch agents: ${response.status}`);
      return [];
    }

    const agents = await response.json() as IndexerAgent[];
    return agents;
  } catch (error) {
    console.error('[marketplace] Error fetching agents from indexer:', error);
    return [];
  }
}

/**
 * Resolve ENS marketplace text records for an agent
 */
export async function resolveMarketplaceRecords(
  env: Env,
  ensName: string
): Promise<MarketplaceRecords> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  const node = namehash(ensName);
  const records: MarketplaceRecords = {};

  // Fetch all records in parallel
  const results = await Promise.allSettled(
    MARKETPLACE_RECORDS.map(async (key) => {
      try {
        const value = await client.readContract({
          address: ENS_PUBLIC_RESOLVER,
          abi: [
            {
              name: 'text',
              type: 'function',
              stateMutability: 'view',
              inputs: [
                { name: 'node', type: 'bytes32' },
                { name: 'key', type: 'string' },
              ],
              outputs: [{ name: '', type: 'string' }],
            },
          ],
          functionName: 'text',
          args: [node, key],
        });
        return { key, value };
      } catch {
        return { key, value: '' };
      }
    })
  );

  // Parse results
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.value) {
      const { key, value } = result.value;
      const recordKey = key.replace('agent:', '') as keyof MarketplaceRecords;

      // Parse comma-separated values for arrays
      if (recordKey === 'supportedTokens' || recordKey === 'policyTypes') {
        records[recordKey] = value.split(',').map((s: string) => s.trim());
      } else {
        (records as Record<string, string>)[recordKey] = value;
      }
    }
  }

  return records;
}

/**
 * Calculate trust score for an agent from indexer metrics
 */
export async function calculateTrustScore(
  env: Env,
  agentId: string
): Promise<number> {
  const indexerUrl = env.INDEXER_URL || 'https://oikonomos-indexer.ponder.sh';

  try {
    // For now, return a default score
    // TODO: Fetch actual metrics from ReputationRegistry or indexer
    // const response = await fetch(`${indexerUrl}/reputation/${agentId}`);

    // Return a base score of 50 + some variance based on agentId
    const hash = agentId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return 50 + (hash % 50); // Score between 50-99
  } catch {
    return 50; // Default score
  }
}

/**
 * Discover compatible marketplace agents for a user's portfolio
 */
export async function discoverMarketplaceAgents(
  env: Env,
  filter: MarketplaceFilter
): Promise<MarketplaceAgent[]> {
  // 1. Fetch registered agents from indexer
  const agents = await fetchAgentsFromIndexer(env);

  if (agents.length === 0) {
    console.log('[marketplace] No agents found in indexer');
    return [];
  }

  // 2. Filter to agents with ENS names
  const agentsWithENS = agents.filter((a) => a.ens);

  if (agentsWithENS.length === 0) {
    console.log('[marketplace] No agents with ENS names found');
    return [];
  }

  // 3. Resolve ENS marketplace records for each agent
  const agentsWithRecords = await Promise.all(
    agentsWithENS.map(async (agent) => {
      const records = await resolveMarketplaceRecords(env, agent.ens!);
      const trustScore = await calculateTrustScore(env, agent.id);
      return { ...agent, records, trustScore };
    })
  );

  // 4. Filter by token compatibility
  let filtered = agentsWithRecords;

  if (filter.tokens && filter.tokens.length > 0) {
    filtered = filtered.filter((agent) => {
      const agentTokens = agent.records.supportedTokens || [];
      // Agent must support at least one of the user's tokens
      return filter.tokens!.some((t) =>
        agentTokens.some((at) => at.toUpperCase() === t.toUpperCase())
      );
    });
  }

  // 5. Filter by policy type compatibility
  if (filter.policyType) {
    filtered = filtered.filter((agent) => {
      const agentPolicies = agent.records.policyTypes || [];
      return agentPolicies.some(
        (p) => p.toLowerCase() === filter.policyType!.toLowerCase()
      );
    });
  }

  // 6. Rank by trust score (descending)
  filtered.sort((a, b) => b.trustScore - a.trustScore);

  return filtered;
}

/**
 * Format marketplace agents for API response
 */
export function formatMatchedAgents(agents: MarketplaceAgent[]): Array<{
  ens: string;
  agentId: string;
  trustScore: number;
  pricing: string | undefined;
  supportedTokens: string[];
  policyTypes: string[];
  description: string | undefined;
  entrypoint: string | undefined;
}> {
  return agents.map((agent) => ({
    ens: agent.ens!,
    agentId: agent.id,
    trustScore: agent.trustScore,
    pricing: agent.records.pricing,
    supportedTokens: agent.records.supportedTokens || [],
    policyTypes: agent.records.policyTypes || [],
    description: agent.records.description,
    entrypoint: agent.records.a2a || agent.records.entrypoint,
  }));
}

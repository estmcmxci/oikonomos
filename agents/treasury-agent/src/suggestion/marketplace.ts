// OIK-34: Multi-Agent Marketplace Discovery
// Fetches registered agents, resolves ENS marketplace records, filters & ranks

import { createPublicClient, http, namehash, type Address } from 'viem';
import type { Env } from '../index';
import { getChain } from '../config/chain';

// ENS Public Resolver on Sepolia (from oikonomos.eth subnames)
const ENS_PUBLIC_RESOLVER = '0xe99638b40e4fff0129d56f03b55b6bbc4bbe49b5';

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

// A2A /capabilities response structure
export interface AgentCapabilities {
  supportedTokens?: string[];
  policyTypes?: string[];
  pricing?: string;
  version?: string;
  chainIds?: number[];
  description?: string;
}

// Known agents for MVP fallback (when indexer is empty or unavailable)
// These are agents registered on Sepolia with ENS records
const KNOWN_AGENTS: IndexerAgent[] = [
  {
    id: '642',
    owner: '0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21',
    agentURI: 'treasury.oikonomos.eth',
    agentWallet: '0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21',
    ens: 'treasury.oikonomos.eth',
    registeredAt: '1706745600',
  },
  {
    id: '643',
    owner: '0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21',
    agentURI: 'alice-treasury.oikonomos.eth',
    agentWallet: '0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21',
    ens: 'alice-treasury.oikonomos.eth',
    registeredAt: '1706745600',
  },
  {
    id: '644',
    owner: '0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21',
    agentURI: 'bob-strategy.oikonomos.eth',
    agentWallet: '0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21',
    ens: 'bob-strategy.oikonomos.eth',
    registeredAt: '1706745600',
  },
];

/**
 * Fetch registered agents from the indexer
 * Falls back to known agents if indexer is empty or unavailable
 */
export async function fetchAgentsFromIndexer(env: Env): Promise<IndexerAgent[]> {
  const indexerUrl = env.INDEXER_URL || 'https://indexer-production-323e.up.railway.app';

  try {
    const response = await fetch(`${indexerUrl}/agents?limit=100`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[marketplace] Failed to fetch agents: ${response.status}`);
      console.log('[marketplace] Using known agents fallback');
      return KNOWN_AGENTS;
    }

    const agents = await response.json() as IndexerAgent[];

    // Fallback to known agents if indexer returns empty
    if (agents.length === 0) {
      console.log('[marketplace] Indexer returned empty, using known agents fallback');
      return KNOWN_AGENTS;
    }

    return agents;
  } catch (error) {
    console.error('[marketplace] Error fetching agents from indexer:', error);
    console.log('[marketplace] Using known agents fallback');
    return KNOWN_AGENTS;
  }
}

/**
 * Fetch live capabilities from an agent's A2A endpoint
 * Returns null on error/timeout for graceful degradation
 */
export async function fetchAgentCapabilities(
  a2aEndpoint: string
): Promise<AgentCapabilities | null> {
  try {
    // Normalize endpoint URL
    const baseUrl = a2aEndpoint.endsWith('/') ? a2aEndpoint.slice(0, -1) : a2aEndpoint;
    const capabilitiesUrl = `${baseUrl}/capabilities`;

    const response = await fetch(capabilitiesUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      console.log(`[marketplace] Failed to fetch capabilities from ${capabilitiesUrl}: ${response.status}`);
      return null;
    }

    const capabilities = await response.json() as AgentCapabilities;

    // Validate response has expected structure
    if (!capabilities || typeof capabilities !== 'object') {
      console.log(`[marketplace] Invalid capabilities response from ${capabilitiesUrl}`);
      return null;
    }

    console.log(`[marketplace] Fetched live capabilities from ${a2aEndpoint}:`, {
      supportedTokens: capabilities.supportedTokens?.length ?? 0,
      policyTypes: capabilities.policyTypes?.length ?? 0,
      pricing: capabilities.pricing,
    });

    return capabilities;
  } catch (error) {
    // Log but don't throw - graceful degradation
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.log(`[marketplace] Timeout fetching capabilities from ${a2aEndpoint}`);
    } else {
      console.log(`[marketplace] Error fetching capabilities from ${a2aEndpoint}:`, error);
    }
    return null;
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
    chain: getChain(env),
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
 * Score formula (from EED.md):
 *   35% slippage (lower is better)
 *   25% compliance rate
 *   25% volume (log scale)
 *   15% execution count (log scale)
 */
export async function calculateTrustScore(
  env: Env,
  agentId: string,
  ensName?: string
): Promise<number> {
  const indexerUrl = env.INDEXER_URL || 'https://oikonomos-indexer.ponder.sh';

  try {
    // strategyId is the keccak256 hash of the ENS name
    // We need to compute this to lookup metrics
    if (!ensName) {
      return 50; // No ENS name, return default
    }

    // Compute strategyId from ENS name (same as contracts do)
    const encoder = new TextEncoder();
    const data = encoder.encode(ensName);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const strategyId = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const response = await fetch(`${indexerUrl}/strategies/${strategyId}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // No metrics yet - return base score for new agents
      return 50;
    }

    const metrics = await response.json() as {
      totalExecutions: string;
      totalVolume: string;
      avgSlippage: string;
      complianceRate: string;
    };

    // Parse metrics (they come as strings from BigInt serialization)
    const executions = parseInt(metrics.totalExecutions) || 0;
    const volume = parseInt(metrics.totalVolume) || 0;
    const avgSlippage = parseInt(metrics.avgSlippage) || 0; // basis points
    const complianceRate = parseInt(metrics.complianceRate) || 0; // basis points (10000 = 100%)

    // Calculate score components
    // Slippage: 35 points max, lower is better (0 bps = 35, 100 bps = 0)
    const slippageScore = Math.max(0, 35 - Math.floor(avgSlippage / 3));

    // Compliance: 25 points max (10000 bps = 25 points)
    const complianceScore = Math.floor((complianceRate / 10000) * 25);

    // Volume: 25 points max (log scale, $1M = 25 points)
    const volumeScore = volume > 0 ? Math.min(25, Math.floor(Math.log10(volume) * 4)) : 0;

    // Executions: 15 points max (log scale, 1000 executions = 15 points)
    const executionScore = executions > 0 ? Math.min(15, Math.floor(Math.log10(executions) * 5)) : 0;

    const totalScore = slippageScore + complianceScore + volumeScore + executionScore;

    return Math.min(100, Math.max(0, totalScore));
  } catch (error) {
    console.error('[marketplace] Error calculating trust score:', error);
    return 50; // Default score on error
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
  // 3a. Then fetch live capabilities from A2A endpoints and merge
  const agentsWithRecords = await Promise.all(
    agentsWithENS.map(async (agent) => {
      const records = await resolveMarketplaceRecords(env, agent.ens!);

      // If agent has A2A endpoint, fetch live capabilities and merge
      const a2aEndpoint = records.a2a || records.entrypoint;
      if (a2aEndpoint) {
        const liveCapabilities = await fetchAgentCapabilities(a2aEndpoint);
        if (liveCapabilities) {
          // Merge live capabilities into records (live takes precedence)
          if (liveCapabilities.supportedTokens?.length) {
            records.supportedTokens = liveCapabilities.supportedTokens;
          }
          if (liveCapabilities.policyTypes?.length) {
            records.policyTypes = liveCapabilities.policyTypes;
          }
          if (liveCapabilities.pricing) {
            records.pricing = liveCapabilities.pricing;
          }
          if (liveCapabilities.description) {
            records.description = liveCapabilities.description;
          }
          if (liveCapabilities.version) {
            records.version = liveCapabilities.version;
          }
        }
      }

      const trustScore = await calculateTrustScore(env, agent.id, agent.ens!);
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

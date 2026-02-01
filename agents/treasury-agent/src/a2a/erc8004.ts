/**
 * ERC-8004 Agent Identity Registry Types and Utilities
 * Spec: https://howto8004.com
 * Registry: 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
 */

// ERC-8004 Service Types
export type ERC8004ServiceType = 'web' | 'ENS' | 'A2A' | 'MCP' | 'email' | 'DID';

export interface ERC8004Service {
  type: ERC8004ServiceType;
  url?: string;
  value?: string;
}

// ERC-8004 Agent Metadata Schema
export interface ERC8004AgentMetadata {
  type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
  name: string;
  description: string;
  image: string;
  active: boolean;
  x402Support: boolean;
  services?: ERC8004Service[];
}

// Registry contract address (Ethereum mainnet)
export const ERC8004_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const;

// Registry ABI (minimal for registration)
export const ERC8004_REGISTRY_ABI = [
  {
    name: 'register',
    type: 'function',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'tokenURI',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    name: 'ownerOf',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

/**
 * Encode agent metadata as a data URI for registration
 */
export function encodeAgentURI(metadata: ERC8004AgentMetadata): string {
  const json = JSON.stringify(metadata);
  const base64 = Buffer.from(json).toString('base64');
  return `data:application/json;base64,${base64}`;
}

/**
 * Decode agent metadata from a data URI
 */
export function decodeAgentURI(uri: string): ERC8004AgentMetadata | null {
  try {
    if (uri.startsWith('data:application/json;base64,')) {
      const base64 = uri.replace('data:application/json;base64,', '');
      const json = Buffer.from(base64, 'base64').toString('utf-8');
      return JSON.parse(json);
    }
    // Handle IPFS or HTTP URIs
    return null; // Would need to fetch
  } catch {
    return null;
  }
}

/**
 * Build ERC-8004 compliant metadata for an Oikonomos agent
 */
export function buildAgentMetadata(opts: {
  name: string;
  description: string;
  image?: string;
  active?: boolean;
  x402Support?: boolean;
  a2aUrl?: string;
  ens?: string;
  webUrl?: string;
  mcpUrl?: string;
}): ERC8004AgentMetadata {
  const services: ERC8004Service[] = [];

  if (opts.a2aUrl) {
    services.push({ type: 'A2A', url: opts.a2aUrl });
  }
  if (opts.ens) {
    services.push({ type: 'ENS', value: opts.ens });
  }
  if (opts.webUrl) {
    services.push({ type: 'web', url: opts.webUrl });
  }
  if (opts.mcpUrl) {
    services.push({ type: 'MCP', url: opts.mcpUrl });
  }

  return {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: opts.name,
    description: opts.description,
    image: opts.image || '',
    active: opts.active ?? true,
    x402Support: opts.x402Support ?? false,
    services: services.length > 0 ? services : undefined,
  };
}

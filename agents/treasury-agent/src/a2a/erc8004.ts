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

// Registry contract address (Sepolia)
export const ERC8004_REGISTRY_SEPOLIA = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const;

// Default to Sepolia for now
export const ERC8004_REGISTRY = ERC8004_REGISTRY_SEPOLIA;

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
 * Encode string to base64 (works in Workers and Node)
 */
function toBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Decode base64 to string (works in Workers and Node)
 */
function fromBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Encode agent metadata as a data URI for registration
 */
export function encodeAgentURI(metadata: ERC8004AgentMetadata): string {
  const json = JSON.stringify(metadata);
  const base64 = toBase64(json);
  return `data:application/json;base64,${base64}`;
}

/**
 * Decode agent metadata from a data URI
 */
export function decodeAgentURI(uri: string): ERC8004AgentMetadata | null {
  try {
    if (uri.startsWith('data:application/json;base64,')) {
      const base64 = uri.replace('data:application/json;base64,', '');
      const json = fromBase64(base64);
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

/**
 * Discovered agent information
 */
export interface DiscoveredAgent {
  tokenId: bigint;
  owner: string;
  metadata: ERC8004AgentMetadata | null;
  rawUri: string;
}

/**
 * Fetch agent metadata from registry by tokenId
 * Note: This is a helper that returns the call parameters - actual execution
 * requires a viem client in the calling context
 */
export function getAgentQueryParams(tokenId: bigint) {
  return {
    address: ERC8004_REGISTRY,
    abi: ERC8004_REGISTRY_ABI,
    functionName: 'tokenURI' as const,
    args: [tokenId] as const,
  };
}

/**
 * Get owner query params for a tokenId
 */
export function getOwnerQueryParams(tokenId: bigint) {
  return {
    address: ERC8004_REGISTRY,
    abi: ERC8004_REGISTRY_ABI,
    functionName: 'ownerOf' as const,
    args: [tokenId] as const,
  };
}

/**
 * Parse a discovered agent from registry responses
 */
export function parseDiscoveredAgent(
  tokenId: bigint,
  owner: string,
  tokenUri: string
): DiscoveredAgent {
  return {
    tokenId,
    owner,
    metadata: decodeAgentURI(tokenUri),
    rawUri: tokenUri,
  };
}

/**
 * Find A2A endpoint URL from agent metadata
 */
export function getA2AEndpoint(metadata: ERC8004AgentMetadata): string | null {
  const a2aService = metadata.services?.find((s) => s.type === 'A2A');
  return a2aService?.url || null;
}

/**
 * Find ENS name from agent metadata
 */
export function getENSName(metadata: ERC8004AgentMetadata): string | null {
  const ensService = metadata.services?.find((s) => s.type === 'ENS');
  return ensService?.value || null;
}

/**
 * Check if agent supports a specific service type
 */
export function hasServiceType(
  metadata: ERC8004AgentMetadata,
  serviceType: ERC8004ServiceType
): boolean {
  return metadata.services?.some((s) => s.type === serviceType) ?? false;
}

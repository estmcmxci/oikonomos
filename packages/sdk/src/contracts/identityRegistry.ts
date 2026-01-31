import { type Address, type PublicClient, type WalletClient, decodeEventLog, type Log } from 'viem';
import { IdentityRegistryABI, getERC8004Addresses } from '@oikonomos/shared';

export { IdentityRegistryABI };

// ERC-8004 Registration v1 format (per howto8004.com)
export interface ERC8004Service {
  name: 'web' | 'ENS' | 'A2A' | 'MCP' | 'email' | 'DID' | string;
  endpoint: string;
  version?: string; // Required for A2A and MCP
}

export interface ERC8004Registration {
  type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
  name: string;
  description: string;
  image?: string;
  active: boolean;
  x402Support?: boolean;
  services?: ERC8004Service[];
}

export interface AgentData {
  agentId: bigint;
  agentURI: string;
  owner: Address;
}

// Creates a base64-encoded data URI for ERC-8004 registration
export function createAgentURI(registration: ERC8004Registration): string {
  const json = JSON.stringify(registration);
  const base64 = Buffer.from(json).toString('base64');
  return `data:application/json;base64,${base64}`;
}

// Parses an agent URI back to registration data
export function parseAgentURI(agentURI: string): ERC8004Registration | null {
  try {
    if (agentURI.startsWith('data:application/json;base64,')) {
      const base64 = agentURI.replace('data:application/json;base64,', '');
      const json = Buffer.from(base64, 'base64').toString('utf-8');
      return JSON.parse(json);
    }
    // Try direct JSON parsing for non-data-URI formats
    return JSON.parse(agentURI);
  } catch {
    return null;
  }
}

// Get canonical registry address for the current chain
export function getIdentityRegistryAddress(chainId: number): Address {
  return getERC8004Addresses(chainId).IDENTITY_REGISTRY as Address;
}

// Register agent with canonical ERC-8004 IdentityRegistry
export async function registerAgent(
  walletClient: WalletClient,
  registration: ERC8004Registration
): Promise<{ hash: `0x${string}`; agentURI: string }> {
  const account = walletClient.account;
  if (!account) throw new Error('WalletClient must have an account');

  const chainId = walletClient.chain?.id;
  if (!chainId) throw new Error('Chain ID not available');

  const registryAddress = getIdentityRegistryAddress(chainId);
  const agentURI = createAgentURI(registration);

  const hash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: registryAddress,
    abi: IdentityRegistryABI,
    functionName: 'register',
    args: [agentURI],
  });

  return { hash, agentURI };
}

// Register agent with custom registry address (for testing/custom deployments)
export async function registerAgentWithAddress(
  walletClient: WalletClient,
  registryAddress: Address,
  agentURI: string
): Promise<`0x${string}`> {
  const account = walletClient.account;
  if (!account) throw new Error('WalletClient must have an account');

  const hash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: registryAddress,
    abi: IdentityRegistryABI,
    functionName: 'register',
    args: [agentURI],
  });

  return hash;
}

// Get agent token URI
export async function getAgentURI(
  client: PublicClient,
  agentId: bigint,
  registryAddress?: Address
): Promise<string> {
  const chainId = await client.getChainId();
  const address = registryAddress ?? getIdentityRegistryAddress(chainId);

  const result = await client.readContract({
    address,
    abi: IdentityRegistryABI,
    functionName: 'tokenURI',
    args: [agentId],
  });

  return result as string;
}

// Get agent owner
export async function getAgentOwner(
  client: PublicClient,
  agentId: bigint,
  registryAddress?: Address
): Promise<Address> {
  const chainId = await client.getChainId();
  const address = registryAddress ?? getIdentityRegistryAddress(chainId);

  const result = await client.readContract({
    address,
    abi: IdentityRegistryABI,
    functionName: 'ownerOf',
    args: [agentId],
  });

  return result as Address;
}

// Get agent wallet address
export async function getAgentWallet(
  client: PublicClient,
  agentId: bigint,
  registryAddress?: Address
): Promise<Address> {
  const chainId = await client.getChainId();
  const address = registryAddress ?? getIdentityRegistryAddress(chainId);

  const result = await client.readContract({
    address,
    abi: IdentityRegistryABI,
    functionName: 'getAgentWallet',
    args: [agentId],
  });

  return result as Address;
}

// Update agent URI
export async function setAgentURI(
  walletClient: WalletClient,
  agentId: bigint,
  newURI: string,
  registryAddress?: Address
): Promise<`0x${string}`> {
  const account = walletClient.account;
  if (!account) throw new Error('WalletClient must have an account');

  const chainId = walletClient.chain?.id;
  if (!chainId) throw new Error('Chain ID not available');

  const address = registryAddress ?? getIdentityRegistryAddress(chainId);

  const hash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address,
    abi: IdentityRegistryABI,
    functionName: 'setAgentURI',
    args: [agentId, newURI],
  });

  return hash;
}

// Decode Registered event from transaction log
export function decodeRegisteredLog(log: Log): {
  agentId: bigint;
  owner: Address;
  agentURI: string;
} {
  const decoded = decodeEventLog({
    abi: IdentityRegistryABI,
    eventName: 'Registered',
    data: log.data,
    topics: log.topics,
  });

  return {
    agentId: decoded.args.agentId as bigint,
    owner: decoded.args.owner as Address,
    agentURI: decoded.args.agentURI as string,
  };
}

// Extract agentId from Transfer event (minting creates a Transfer from 0x0)
export function extractAgentIdFromTransferLog(log: Log): bigint | null {
  try {
    const decoded = decodeEventLog({
      abi: IdentityRegistryABI,
      eventName: 'Transfer',
      data: log.data,
      topics: log.topics,
    });

    // Check if this is a mint (from address is zero)
    if (decoded.args.from === '0x0000000000000000000000000000000000000000') {
      return decoded.args.tokenId as bigint;
    }
    return null;
  } catch {
    return null;
  }
}

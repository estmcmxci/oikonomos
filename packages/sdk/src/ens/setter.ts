/**
 * ENS Text Record Setter
 *
 * Sets ENS text records for agent registration.
 * Uses the ENS Public Resolver contract.
 */

import { type WalletClient, type Address, namehash, encodeFunctionData } from 'viem';
import { normalize } from 'viem/ens';
import { getERC8004Addresses } from '@oikonomos/shared';

// ENS Public Resolver addresses by chain
const ENS_PUBLIC_RESOLVER: Record<number, Address> = {
  1: '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63', // Mainnet
  11155111: '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63', // Sepolia
};

// Minimal ABI for setText function
const PublicResolverABI = [
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    name: 'setText',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
    ],
    name: 'text',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Get the ENS Public Resolver address for a chain
 */
export function getPublicResolverAddress(chainId: number): Address {
  const address = ENS_PUBLIC_RESOLVER[chainId];
  if (!address) {
    throw new Error(`No ENS Public Resolver known for chain ${chainId}`);
  }
  return address;
}

/**
 * Set any ENS text record
 *
 * @param walletClient - Viem wallet client with account
 * @param ensName - ENS name (e.g., "treasury.oikonomos.eth")
 * @param key - Text record key (e.g., "agent:erc8004")
 * @param value - Text record value
 * @returns Transaction hash
 *
 * @example
 * const hash = await setEnsText(
 *   walletClient,
 *   "treasury.oikonomos.eth",
 *   "agent:erc8004",
 *   "eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e:42"
 * );
 */
export async function setEnsText(
  walletClient: WalletClient,
  ensName: string,
  key: string,
  value: string
): Promise<`0x${string}`> {
  const chainId = walletClient.chain?.id;
  if (!chainId) {
    throw new Error('Chain ID not available on wallet client');
  }

  const accounts = await walletClient.getAddresses();
  if (!accounts.length) {
    throw new Error('No accounts available in wallet client');
  }
  const account = accounts[0];

  const resolverAddress = getPublicResolverAddress(chainId);
  const normalizedName = normalize(ensName);
  const node = namehash(normalizedName);

  const hash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: resolverAddress,
    abi: PublicResolverABI,
    functionName: 'setText',
    args: [node, key, value],
  });

  return hash;
}

/**
 * Generate the ERC-8004 text record value
 *
 * @param chainId - Chain ID (e.g., 11155111 for Sepolia)
 * @param agentId - Agent ID from IdentityRegistry
 * @returns Formatted record value: "eip155:{chainId}:{registryAddress}:{agentId}"
 */
export function formatERC8004Record(chainId: number, agentId: bigint): string {
  const { identity } = getERC8004Addresses(chainId);
  return `eip155:${chainId}:${identity}:${agentId.toString()}`;
}

/**
 * Set the agent:erc8004 ENS text record after registration
 *
 * This creates a link between an ENS name and an ERC-8004 agent ID,
 * enabling discovery via ENS resolution.
 *
 * @param walletClient - Viem wallet client with account
 * @param ensName - ENS name (e.g., "treasury.oikonomos.eth")
 * @param chainId - Chain ID where agent is registered
 * @param agentId - Agent ID from IdentityRegistry
 * @returns Transaction hash
 *
 * @example
 * // After registering agent and getting agentId=42
 * const hash = await setAgentERC8004Record(
 *   walletClient,
 *   "treasury.oikonomos.eth",
 *   11155111,
 *   42n
 * );
 * // Sets: agent:erc8004 = "eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e:42"
 */
export async function setAgentERC8004Record(
  walletClient: WalletClient,
  ensName: string,
  chainId: number,
  agentId: bigint
): Promise<`0x${string}`> {
  const recordValue = formatERC8004Record(chainId, agentId);
  return setEnsText(walletClient, ensName, 'agent:erc8004', recordValue);
}

/**
 * Build the calldata for setText without executing
 *
 * Useful for batching with multicall or Safe transactions.
 */
export function buildSetTextCalldata(
  ensName: string,
  key: string,
  value: string
): `0x${string}` {
  const normalizedName = normalize(ensName);
  const node = namehash(normalizedName);

  return encodeFunctionData({
    abi: PublicResolverABI,
    functionName: 'setText',
    args: [node, key, value],
  });
}

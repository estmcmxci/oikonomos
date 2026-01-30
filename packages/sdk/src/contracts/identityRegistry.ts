import { type Address, type PublicClient, type WalletClient, decodeEventLog, type Log } from 'viem';
import { IdentityRegistryABI } from '@oikonomos/shared';

export { IdentityRegistryABI };

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

/**
 * Get the first account from a wallet client, with validation
 * @throws WalletError if no accounts are available
 */
async function getAccount(walletClient: WalletClient): Promise<Address> {
  const accounts = await walletClient.getAddresses();
  if (!accounts.length) {
    throw new WalletError('No accounts available in wallet client');
  }
  return accounts[0];
}

export const IdentityRegistryExtendedABI = [
  ...IdentityRegistryABI,
  {
    type: 'function',
    name: 'getAgent',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'agentURI', type: 'string' },
          { name: 'agentWallet', type: 'address' },
          { name: 'registeredAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'AgentRegistered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'agentURI', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AgentWalletUpdated',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'oldWallet', type: 'address', indexed: false },
      { name: 'newWallet', type: 'address', indexed: false },
    ],
  },
] as const;

export interface AgentData {
  agentURI: string;
  agentWallet: Address;
  registeredAt: bigint;
}

export async function registerAgent(
  walletClient: WalletClient,
  registryAddress: Address,
  agentURI: string,
  metadata: `0x${string}` = '0x'
): Promise<`0x${string}`> {
  const account = await getAccount(walletClient);
  const hash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: registryAddress,
    abi: IdentityRegistryABI,
    functionName: 'register',
    args: [agentURI, metadata],
  });

  return hash;
}

export async function getAgent(
  client: PublicClient,
  registryAddress: Address,
  agentId: bigint
): Promise<AgentData> {
  const result = await client.readContract({
    address: registryAddress,
    abi: IdentityRegistryExtendedABI,
    functionName: 'getAgent',
    args: [agentId],
  });

  return result as AgentData;
}

export async function updateAgentWallet(
  walletClient: WalletClient,
  registryAddress: Address,
  agentId: bigint,
  newWallet: Address,
  signature: `0x${string}`
): Promise<`0x${string}`> {
  const account = await getAccount(walletClient);
  const hash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: registryAddress,
    abi: IdentityRegistryABI,
    functionName: 'updateAgentWallet',
    args: [agentId, newWallet, signature],
  });

  return hash;
}

export function decodeAgentRegisteredLog(log: Log): {
  agentId: bigint;
  owner: Address;
  agentURI: string;
} {
  const decoded = decodeEventLog({
    abi: IdentityRegistryExtendedABI,
    eventName: 'AgentRegistered',
    data: log.data,
    topics: log.topics,
  });

  return {
    agentId: decoded.args.agentId as bigint,
    owner: decoded.args.owner as Address,
    agentURI: decoded.args.agentURI as string,
  };
}

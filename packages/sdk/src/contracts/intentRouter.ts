import { type Address, type PublicClient, type WalletClient } from 'viem';
import { type Intent, type PoolKey, IntentRouterABI } from '@oikonomos/shared';

export { IntentRouterABI };

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

export const IntentRouterExtendedABI = [
  ...IntentRouterABI,
  {
    type: 'function',
    name: 'getNonce',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'DOMAIN_SEPARATOR',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'executeIntent',
    inputs: [
      {
        name: 'intent',
        type: 'tuple',
        components: [
          { name: 'user', type: 'address' },
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'maxSlippage', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'strategyId', type: 'bytes32' },
          { name: 'nonce', type: 'uint256' },
        ],
      },
      { name: 'signature', type: 'bytes' },
      {
        name: 'poolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
      },
      { name: 'strategyData', type: 'bytes' },
    ],
    outputs: [{ name: 'amountOut', type: 'int256' }],
    stateMutability: 'nonpayable',
  },
] as const;

export async function getNonce(
  client: PublicClient,
  routerAddress: Address,
  user: Address
): Promise<bigint> {
  return await client.readContract({
    address: routerAddress,
    abi: IntentRouterExtendedABI,
    functionName: 'getNonce',
    args: [user],
  });
}

export async function getDomainSeparator(
  client: PublicClient,
  routerAddress: Address
): Promise<`0x${string}`> {
  return await client.readContract({
    address: routerAddress,
    abi: IntentRouterExtendedABI,
    functionName: 'DOMAIN_SEPARATOR',
  });
}

export async function executeIntent(
  walletClient: WalletClient,
  routerAddress: Address,
  intent: Intent,
  signature: `0x${string}`,
  poolKey: PoolKey,
  strategyData: `0x${string}` = '0x'
): Promise<`0x${string}`> {
  const account = await getAccount(walletClient);
  const hash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: routerAddress,
    abi: IntentRouterExtendedABI,
    functionName: 'executeIntent',
    args: [intent, signature, poolKey, strategyData],
  });

  return hash;
}

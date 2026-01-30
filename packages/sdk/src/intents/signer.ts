import { type WalletClient, type Address } from 'viem';
import { type Intent } from '@oikonomos/shared';

export const INTENT_TYPES = {
  Intent: [
    { name: 'user', type: 'address' },
    { name: 'tokenIn', type: 'address' },
    { name: 'tokenOut', type: 'address' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'maxSlippage', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'strategyId', type: 'bytes32' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

export function getIntentDomain(routerAddress: Address, chainId: number) {
  return {
    name: 'OikonomosIntentRouter',
    version: '1',
    chainId,
    verifyingContract: routerAddress,
  } as const;
}

export async function signIntent(
  walletClient: WalletClient,
  routerAddress: Address,
  chainId: number,
  intent: Intent
): Promise<`0x${string}`> {
  const [account] = await walletClient.getAddresses();
  const signature = await walletClient.signTypedData({
    account,
    domain: getIntentDomain(routerAddress, chainId),
    types: INTENT_TYPES,
    primaryType: 'Intent',
    message: {
      user: intent.user,
      tokenIn: intent.tokenIn,
      tokenOut: intent.tokenOut,
      amountIn: intent.amountIn,
      maxSlippage: intent.maxSlippage,
      deadline: intent.deadline,
      strategyId: intent.strategyId,
      nonce: intent.nonce,
    },
  });

  return signature;
}

export function getIntentTypedData(
  routerAddress: Address,
  chainId: number,
  intent: Intent
) {
  return {
    domain: getIntentDomain(routerAddress, chainId),
    types: INTENT_TYPES,
    primaryType: 'Intent' as const,
    message: {
      user: intent.user,
      tokenIn: intent.tokenIn,
      tokenOut: intent.tokenOut,
      amountIn: intent.amountIn,
      maxSlippage: intent.maxSlippage,
      deadline: intent.deadline,
      strategyId: intent.strategyId,
      nonce: intent.nonce,
    },
  };
}

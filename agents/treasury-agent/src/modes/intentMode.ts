import { createWalletClient, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import type { Env } from '../index';

interface IntentParams {
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  maxSlippageBps: number;
  ttlSeconds: number;
  strategyId: `0x${string}`;
  nonce: bigint;
}

interface SignedIntentData extends IntentParams {
  deadline: bigint;
}

interface SignedIntent {
  intent: SignedIntentData;
  signature: `0x${string}`;
}

export async function buildAndSignIntent(
  env: Env,
  params: IntentParams
): Promise<SignedIntent> {
  const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  const deadline = BigInt(Math.floor(Date.now() / 1000) + params.ttlSeconds);

  const intent = {
    ...params,
    deadline,
  };

  // Sign the intent using EIP-712
  const signature = await walletClient.signTypedData({
    account,
    domain: {
      name: 'OikonomosIntentRouter',
      version: '1',
      chainId: parseInt(env.CHAIN_ID),
      verifyingContract: env.INTENT_ROUTER as `0x${string}`,
    },
    types: {
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
    },
    primaryType: 'Intent',
    message: {
      user: intent.user,
      tokenIn: intent.tokenIn,
      tokenOut: intent.tokenOut,
      amountIn: intent.amountIn,
      maxSlippage: BigInt(intent.maxSlippageBps),
      deadline: intent.deadline,
      strategyId: intent.strategyId,
      nonce: intent.nonce,
    },
  });

  return {
    intent: { ...params, deadline },
    signature,
  };
}

export async function submitIntent(
  env: Env,
  signedIntent: SignedIntent,
  poolKey: {
    currency0: Address;
    currency1: Address;
    fee: number;
    tickSpacing: number;
    hooks: Address;
  },
  strategyData: `0x${string}` = '0x'
): Promise<`0x${string}`> {
  const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  // In production: Call IntentRouter.executeIntent
  // This would require the full contract ABI and proper encoding

  // For MVP: Return a placeholder
  console.log('Would submit intent:', signedIntent);
  return '0x0000000000000000000000000000000000000000000000000000000000000000';
}

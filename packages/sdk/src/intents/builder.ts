import { type Address, keccak256, toBytes } from 'viem';
import { type Intent } from '@oikonomos/shared';

export interface BuildIntentParams {
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  maxSlippageBps: number; // basis points (100 = 1%)
  ttlSeconds: number;
  strategyEns: string;
  nonce: bigint;
}

export function buildIntent(params: BuildIntentParams): Intent {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + params.ttlSeconds);
  const strategyId = keccak256(toBytes(params.strategyEns));

  return {
    user: params.user,
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    maxSlippage: BigInt(params.maxSlippageBps),
    deadline,
    strategyId,
    nonce: params.nonce,
  };
}

export function buildIntentWithStrategyId(params: {
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  maxSlippageBps: number;
  ttlSeconds: number;
  strategyId: `0x${string}`;
  nonce: bigint;
}): Intent {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + params.ttlSeconds);

  return {
    user: params.user,
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    maxSlippage: BigInt(params.maxSlippageBps),
    deadline,
    strategyId: params.strategyId,
    nonce: params.nonce,
  };
}

export function isIntentExpired(intent: Intent): boolean {
  return BigInt(Math.floor(Date.now() / 1000)) > intent.deadline;
}

export function getIntentHash(intent: Intent): `0x${string}` {
  return keccak256(
    toBytes(
      JSON.stringify({
        user: intent.user,
        tokenIn: intent.tokenIn,
        tokenOut: intent.tokenOut,
        amountIn: intent.amountIn.toString(),
        maxSlippage: intent.maxSlippage.toString(),
        deadline: intent.deadline.toString(),
        strategyId: intent.strategyId,
        nonce: intent.nonce.toString(),
      })
    )
  );
}

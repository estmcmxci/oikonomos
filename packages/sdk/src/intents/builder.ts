import { type Address, keccak256, toBytes, encodeAbiParameters, parseAbiParameters } from 'viem';
import { type Intent } from '@oikonomos/shared';

// Constants for validation
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const MAX_SLIPPAGE_BPS = 10000; // 100%
const MIN_TTL_SECONDS = 60; // 1 minute minimum
const MAX_TTL_SECONDS = 86400 * 7; // 1 week maximum

// EIP-712 typehash for Intent struct (must match contract)
const INTENT_TYPEHASH = keccak256(
  toBytes('Intent(address user,address tokenIn,address tokenOut,uint256 amountIn,uint256 maxSlippage,uint256 deadline,bytes32 strategyId,uint256 nonce)')
);

export class IntentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntentValidationError';
  }
}

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

/**
 * Validates intent parameters
 * @throws IntentValidationError if validation fails
 */
function validateIntentParams(params: {
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  maxSlippageBps: number;
  ttlSeconds: number;
}): void {
  if (params.user === ZERO_ADDRESS) {
    throw new IntentValidationError('User address cannot be zero address');
  }
  if (params.tokenIn === ZERO_ADDRESS) {
    throw new IntentValidationError('tokenIn address cannot be zero address');
  }
  if (params.tokenOut === ZERO_ADDRESS) {
    throw new IntentValidationError('tokenOut address cannot be zero address');
  }
  if (params.tokenIn.toLowerCase() === params.tokenOut.toLowerCase()) {
    throw new IntentValidationError('tokenIn and tokenOut cannot be the same');
  }
  if (params.amountIn <= 0n) {
    throw new IntentValidationError('amountIn must be greater than 0');
  }
  if (params.maxSlippageBps < 0 || params.maxSlippageBps > MAX_SLIPPAGE_BPS) {
    throw new IntentValidationError(`maxSlippageBps must be between 0 and ${MAX_SLIPPAGE_BPS}`);
  }
  if (params.ttlSeconds < MIN_TTL_SECONDS || params.ttlSeconds > MAX_TTL_SECONDS) {
    throw new IntentValidationError(`ttlSeconds must be between ${MIN_TTL_SECONDS} and ${MAX_TTL_SECONDS}`);
  }
}

export function buildIntent(params: BuildIntentParams): Intent {
  validateIntentParams(params);

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
  validateIntentParams(params);

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

/**
 * Compute the EIP-712 struct hash for an intent.
 * This matches the on-chain _hashIntent() function in IntentRouter.sol.
 *
 * @param intent The intent to hash
 * @returns The EIP-712 compliant struct hash
 */
export function getIntentHash(intent: Intent): `0x${string}` {
  // EIP-712 struct hash: keccak256(abi.encode(typehash, ...fields))
  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes32, address, address, address, uint256, uint256, uint256, bytes32, uint256'),
    [
      INTENT_TYPEHASH,
      intent.user,
      intent.tokenIn,
      intent.tokenOut,
      intent.amountIn,
      intent.maxSlippage,
      intent.deadline,
      intent.strategyId,
      intent.nonce,
    ]
  );

  return keccak256(encoded);
}

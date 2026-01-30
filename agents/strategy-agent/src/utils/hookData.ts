import { keccak256, toBytes, encodeAbiParameters, parseAbiParameters } from 'viem';

export function generateStrategyId(ensName: string): `0x${string}` {
  return keccak256(toBytes(ensName));
}

export function encodeHookData(
  strategyId: `0x${string}`,
  quoteId: `0x${string}`,
  maxSlippageBps: number
): `0x${string}` {
  // ABI encode (bytes32 strategyId, bytes32 quoteId, uint256 maxSlippage)
  return encodeAbiParameters(
    parseAbiParameters('bytes32, bytes32, uint256'),
    [strategyId, quoteId, BigInt(maxSlippageBps)]
  );
}

export function decodeHookData(hookData: `0x${string}`): {
  strategyId: `0x${string}`;
  quoteId: `0x${string}`;
  maxSlippage: bigint;
} {
  // Manual decoding - hookData is 3 x 32 bytes
  const data = hookData.slice(2); // Remove 0x prefix

  if (data.length !== 192) { // 3 * 64 hex chars
    throw new Error('Invalid hookData length');
  }

  return {
    strategyId: `0x${data.slice(0, 64)}` as `0x${string}`,
    quoteId: `0x${data.slice(64, 128)}` as `0x${string}`,
    maxSlippage: BigInt(`0x${data.slice(128, 192)}`),
  };
}

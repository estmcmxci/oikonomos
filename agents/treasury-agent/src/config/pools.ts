/**
 * Pool Configuration Registry
 *
 * Maintains a registry of Uniswap v4 pools initialized with our ReceiptHook.
 * Only pools in this registry can be used for agent-executed swaps, ensuring
 * all trades emit ExecutionReceipt events for reputation tracking.
 *
 * @see OIK-39: Pool Discovery and Registry for IntentRouter
 */

import type { Address } from 'viem';

export interface PoolConfig {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}

// OIK-50: ReceiptHook deployment on Base Sepolia
const RECEIPT_HOOK = '0x906E3e24C04f6b6B5b6743BB77d0FCBE4d87C040' as Address;

// OIK-51: Permit-enabled token addresses on Base Sepolia
export const TOKENS = {
  USDC: '0x944a6D90b3111884CcCbfcc45B381b7C864D7943' as Address, // MockUSDC (EIP-2612 permit)
  DAI: '0xCE728786975c72711e810aDCD9BC233A2a55d7C1' as Address,  // MockDAI (EIP-2612 permit)
  WETH: '0x4200000000000000000000000000000000000006' as Address, // Canonical Base WETH
} as const;

// Legacy Sepolia tokens (for reference)
// const SEPOLIA_TOKENS = {
//   USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
//   DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
//   WETH: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c',
// };

/**
 * Registry of pools initialized with ReceiptHook on Base Sepolia.
 * OIK-51: Updated with permit-enabled tokens
 * Key format: sorted lowercase addresses joined by '-'
 *
 * To add a new pool:
 * 1. Initialize the pool on-chain with ReceiptHook
 * 2. Add entry here with the pool parameters used during initialization
 */
export const SUPPORTED_POOLS: Record<string, PoolConfig> = {
  // USDC/DAI - 0.05% fee tier (stablecoin pair)
  // Note: USDC (0x944a...) < DAI (0xCE72...) lexicographically, so USDC is currency0
  '0x944a6d90b3111884cccbfcc45b381b7c864d7943-0xce728786975c72711e810adcd9bc233a2a55d7c1': {
    currency0: TOKENS.USDC,
    currency1: TOKENS.DAI,
    fee: 500, // 0.05%
    tickSpacing: 10,
    hooks: RECEIPT_HOOK,
  },
  // WETH/USDC - 0.3% fee tier (volatile pair)
  // Note: WETH (0x4200...) < USDC (0x944a...) lexicographically
  '0x4200000000000000000000000000000000000006-0x944a6d90b3111884cccbfcc45b381b7c864d7943': {
    currency0: TOKENS.WETH,
    currency1: TOKENS.USDC,
    fee: 3000, // 0.3%
    tickSpacing: 60,
    hooks: RECEIPT_HOOK,
  },
};

/**
 * Sort two token addresses (required by Uniswap v4: currency0 < currency1)
 */
function sortTokens(tokenA: Address, tokenB: Address): [Address, Address] {
  return tokenA.toLowerCase() < tokenB.toLowerCase()
    ? [tokenA, tokenB]
    : [tokenB, tokenA];
}

/**
 * Generate pool registry key from token pair
 */
function getPoolKey(tokenA: Address, tokenB: Address): string {
  const [token0, token1] = sortTokens(tokenA, tokenB);
  return `${token0.toLowerCase()}-${token1.toLowerCase()}`;
}

/**
 * Look up pool configuration for a token pair.
 * Returns null if no pool is configured for the pair.
 *
 * @param tokenA First token address (order doesn't matter)
 * @param tokenB Second token address (order doesn't matter)
 * @returns Pool configuration or null if not found
 */
export function getPoolForPair(tokenA: Address, tokenB: Address): PoolConfig | null {
  const key = getPoolKey(tokenA, tokenB);
  return SUPPORTED_POOLS[key] || null;
}

/**
 * Get pool configuration for a token pair, throwing if not configured.
 * Use this when a pool MUST exist for the operation to proceed.
 *
 * @param tokenA First token address (order doesn't matter)
 * @param tokenB Second token address (order doesn't matter)
 * @throws Error if no pool is configured for the pair
 */
export function requirePoolForPair(tokenA: Address, tokenB: Address): PoolConfig {
  const pool = getPoolForPair(tokenA, tokenB);
  if (!pool) {
    throw new Error(
      `No pool configured for pair: ${tokenA}/${tokenB}. ` +
        `Available pairs: ${listSupportedPairs().join(', ')}`
    );
  }
  return pool;
}

/**
 * List all supported token pairs.
 * Returns human-readable pair descriptions.
 */
export function listSupportedPairs(): string[] {
  return Object.entries(SUPPORTED_POOLS).map(([key, config]) => {
    // Try to resolve token symbols
    const token0Symbol = getTokenSymbol(config.currency0);
    const token1Symbol = getTokenSymbol(config.currency1);
    return `${token0Symbol}/${token1Symbol} (${config.fee / 10000}%)`;
  });
}

/**
 * Check if a token pair is supported
 */
export function isPairSupported(tokenA: Address, tokenB: Address): boolean {
  return getPoolForPair(tokenA, tokenB) !== null;
}

/**
 * Get token symbol from address (best effort)
 */
function getTokenSymbol(address: Address): string {
  const symbols: Record<string, string> = {
    [TOKENS.USDC.toLowerCase()]: 'USDC',
    [TOKENS.DAI.toLowerCase()]: 'DAI',
    [TOKENS.WETH.toLowerCase()]: 'WETH',
  };
  return symbols[address.toLowerCase()] || address.slice(0, 10);
}

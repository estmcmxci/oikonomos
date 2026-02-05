/**
 * Pool Configuration Registry
 *
 * PIVOT NOTE: This file has been updated for the meta-treasury manager pivot.
 * Previously maintained a registry of custom ReceiptHook pools.
 * Now prepared for Clanker pool integration where pools are discovered dynamically.
 *
 * Key changes:
 * - Removed ReceiptHook address (using Clanker's ClankerHook instead)
 * - Tokens will be discovered via Clawnch API per user's launched tokens
 * - Pool configuration retrieved from Clanker pool data
 *
 * @see PIVOT_SUMMARY.md
 * @see INTEGRATION_REFACTORING_PLAN.md Phase 2
 */

import type { Address } from 'viem';

// ======== Clanker Contract Addresses (Base Sepolia) ========
export const CLANKER_CONTRACTS = {
  PoolManager: '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408' as Address,
  Clanker: '0xE85A59c628F7d27878ACeB4bf3b35733630083a9' as Address,
  ClankerFeeLocker: '0x42A95190B4088C88Dd904d930c79deC1158bF09D' as Address,
  ClankerHook: '0xE63b0A59100698f379F9B577441A561bAF9828cc' as Address,
} as const;

// ======== Common Token Addresses (Base Sepolia) ========
export const TOKENS = {
  WETH: '0x4200000000000000000000000000000000000006' as Address,
  // Clanker tokens are discovered dynamically via Clawnch API
} as const;

/**
 * Clanker pool configuration (discovered from on-chain or API)
 */
export interface ClankerPoolConfig {
  token: Address;          // The Clanker-launched token
  tokenSymbol: string;     // Token symbol (e.g., "$ALPHA")
  poolId: `0x${string}`;   // Uniswap V4 pool ID
  currency0: Address;      // Sorted token address 0
  currency1: Address;      // Sorted token address 1
  fee: number;             // Pool fee in basis points
  tickSpacing: number;     // Tick spacing
  hooks: Address;          // ClankerHook address
  launchedAt: number;      // Timestamp when launched
  platform: string;        // moltbook, 4claw, clawstr, moltx
}

/**
 * Sort two token addresses (required by Uniswap v4: currency0 < currency1)
 */
export function sortTokens(tokenA: Address, tokenB: Address): [Address, Address] {
  return tokenA.toLowerCase() < tokenB.toLowerCase()
    ? [tokenA, tokenB]
    : [tokenB, tokenA];
}

/**
 * Check if a token is WETH
 */
export function isWETH(token: Address): boolean {
  return token.toLowerCase() === TOKENS.WETH.toLowerCase();
}

/**
 * Get the Clanker pool key for a token paired with WETH
 * All Clanker tokens are paired with WETH
 */
export function getClankerPoolKey(token: Address): string {
  const [token0, token1] = sortTokens(token, TOKENS.WETH);
  return `${token0.toLowerCase()}-${token1.toLowerCase()}`;
}

/**
 * Default Clanker pool parameters
 * Clanker uses standard parameters for all launched tokens
 */
export const DEFAULT_CLANKER_POOL_PARAMS = {
  fee: 10000,      // 1% fee (Clanker standard)
  tickSpacing: 200,
  hooks: CLANKER_CONTRACTS.ClankerHook,
} as const;

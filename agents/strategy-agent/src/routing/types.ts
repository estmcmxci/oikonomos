/**
 * OIK-22: Multi-Pool Routing Types
 *
 * Type definitions for multi-hop route discovery and execution.
 */

import type { Address } from 'viem';

/**
 * Known tokens on Sepolia with human-readable symbols
 */
export const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': { symbol: 'USDC', decimals: 6 }, // Circle
  '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8': { symbol: 'aUSDC', decimals: 6 }, // Aave
  '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357': { symbol: 'aDAI', decimals: 18 }, // Aave
  '0x7b79995e5f793a07bc00c21412e50ecae098e7f9': { symbol: 'WETH', decimals: 18 }, // Sepolia
  '0xc558dbdd856501fcd9aaf1e62eae57a9f0629a3c': { symbol: 'aWETH', decimals: 18 }, // Aave
};

/**
 * Pool representation in the routing graph
 */
export interface Pool {
  /** Pool identifier (poolId from PoolManager) */
  id: string;
  /** Token0 address (lower address) */
  token0: Address;
  /** Token1 address (higher address) */
  token1: Address;
  /** Fee tier in hundredths of a bip (e.g., 3000 = 0.3%) */
  fee: number;
  /** Tick spacing */
  tickSpacing: number;
  /** Hook address (if any) */
  hook: Address;
  /** Current sqrtPriceX96 */
  sqrtPriceX96?: bigint;
  /** Current liquidity */
  liquidity?: bigint;
}

/**
 * Edge in the routing graph (connection between two tokens)
 */
export interface PoolEdge {
  /** Target token address */
  token: Address;
  /** Pool to use for this edge */
  pool: Pool;
  /** Fee for this hop */
  fee: number;
}

/**
 * Adjacency list representation of the pool graph
 */
export type PoolGraph = Map<Address, PoolEdge[]>;

/**
 * A single hop in a multi-hop route
 */
export interface RouteHop {
  /** Pool used for this hop */
  pool: Pool;
  /** Token going into this hop */
  tokenIn: Address;
  /** Token coming out of this hop */
  tokenOut: Address;
  /** Fee for this hop (basis points) */
  fee: number;
}

/**
 * Complete route from tokenIn to tokenOut
 */
export interface Route {
  /** Ordered list of hops */
  hops: RouteHop[];
  /** Total path: [tokenIn, intermediate..., tokenOut] */
  path: Address[];
  /** Sum of all fees (basis points) */
  totalFee: number;
  /** Number of hops */
  hopCount: number;
}

/**
 * Quote for a single hop
 */
export interface HopQuote {
  /** The hop this quote is for */
  hop: RouteHop;
  /** Amount going into this hop */
  amountIn: bigint;
  /** Expected amount out from this hop */
  amountOut: bigint;
  /** Estimated slippage for this hop (basis points) */
  slippageBps: number;
  /** Price impact for this hop (basis points) */
  priceImpactBps: number;
}

/**
 * Complete quote for a multi-hop route
 */
export interface MultiHopQuote {
  /** The route being quoted */
  route: Route;
  /** Total amount in */
  amountIn: bigint;
  /** Expected total amount out */
  amountOut: bigint;
  /** Quotes for each individual hop */
  hopQuotes: HopQuote[];
  /** Total slippage across all hops (basis points) */
  totalSlippageBps: number;
  /** Total price impact (basis points) */
  totalPriceImpactBps: number;
  /** Estimated gas for the full route */
  gasEstimate: bigint;
}

/**
 * Request for finding routes
 */
export interface RouteRequest {
  /** Starting token */
  tokenIn: Address;
  /** Target token */
  tokenOut: Address;
  /** Amount to swap */
  amountIn: bigint;
  /** Maximum number of hops allowed (default: 3) */
  maxHops?: number;
  /** Only return routes through pools with our hook */
  requireReceiptHook?: boolean;
}

/**
 * Response from route finding
 */
export interface RouteResponse {
  /** Best route found */
  bestRoute: Route | null;
  /** Alternative routes */
  alternatives: Route[];
  /** Whether a direct route exists */
  hasDirectRoute: boolean;
}

/**
 * OIK-22: Multi-Pool Route Finding
 *
 * Updated to support multi-hop routes using the routing module.
 */

import type { Address } from 'viem';
import type { Env } from '../index';
import {
  findRoutes,
  quoteMultiHop,
  getDefaultPoolGraph,
  hasDirectPool,
  type Route,
  type MultiHopQuote,
} from '../routing';

/**
 * Route result returned to quote handler
 */
export interface RouteResult {
  /** Expected output amount */
  expectedAmountOut: bigint;
  /** Estimated slippage in basis points */
  estimatedSlippageBps: number;
  /** Individual route steps */
  steps: RouteStep[];
  /** Whether this is a multi-hop route */
  isMultiHop: boolean;
  /** Full multi-hop quote details (if applicable) */
  multiHopQuote?: MultiHopQuote;
}

/**
 * Single step in a route (for API response compatibility)
 */
export interface RouteStep {
  pool: string;
  tokenIn: string;
  tokenOut: string;
  fee: number;
}

/**
 * Find the optimal route between two tokens.
 *
 * This function:
 * 1. Searches the pool graph for all possible routes
 * 2. Quotes each route using the Uniswap v4 Quoter
 * 3. Returns the best route by expected output
 *
 * @param env - Worker environment with RPC_URL
 * @param tokenIn - Source token address
 * @param tokenOut - Destination token address
 * @param amountIn - Amount to swap
 * @returns Route result with expected output and steps
 */
export async function findOptimalRoute(
  env: Env,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint
): Promise<RouteResult> {
  const tokenInAddr = tokenIn.toLowerCase() as Address;
  const tokenOutAddr = tokenOut.toLowerCase() as Address;

  // Check if tokens are the same
  if (tokenInAddr === tokenOutAddr) {
    throw new Error('Cannot swap token to itself');
  }

  const graph = getDefaultPoolGraph();

  // Find all possible routes
  const routeResponse = findRoutes(
    { tokenIn: tokenInAddr, tokenOut: tokenOutAddr, amountIn },
    graph
  );

  // No route found
  if (!routeResponse.bestRoute) {
    throw new Error(`No route found from ${tokenIn} to ${tokenOut}`);
  }

  // Get all routes to quote (best + alternatives)
  const routesToQuote = [
    routeResponse.bestRoute,
    ...routeResponse.alternatives.slice(0, 2), // Top 2 alternatives
  ].filter(Boolean) as Route[];

  // Quote all routes in parallel
  const quotes = await Promise.all(
    routesToQuote.map(route => quoteMultiHop(env.RPC_URL, route, amountIn))
  );

  // Find best quote by output amount
  quotes.sort((a, b) => {
    if (b.amountOut > a.amountOut) return 1;
    if (b.amountOut < a.amountOut) return -1;
    return 0;
  });

  const bestQuote = quotes[0];
  const isMultiHop = bestQuote.route.hopCount > 1;

  // Convert to RouteStep format for API compatibility
  const steps: RouteStep[] = bestQuote.route.hops.map(hop => ({
    pool: hop.pool.id,
    tokenIn: hop.tokenIn,
    tokenOut: hop.tokenOut,
    fee: hop.fee,
  }));

  return {
    expectedAmountOut: bestQuote.amountOut,
    estimatedSlippageBps: bestQuote.totalSlippageBps,
    steps,
    isMultiHop,
    multiHopQuote: bestQuote,
  };
}

/**
 * Check if a route exists between two tokens.
 */
export function canRoute(tokenIn: string, tokenOut: string): boolean {
  const graph = getDefaultPoolGraph();
  const routeResponse = findRoutes({
    tokenIn: tokenIn.toLowerCase() as Address,
    tokenOut: tokenOut.toLowerCase() as Address,
    amountIn: 0n,
  }, graph);

  return routeResponse.bestRoute !== null;
}

/**
 * Check if a direct (single-hop) route exists.
 */
export function hasDirectRoute(tokenIn: string, tokenOut: string): boolean {
  const graph = getDefaultPoolGraph();
  return hasDirectPool(
    tokenIn.toLowerCase() as Address,
    tokenOut.toLowerCase() as Address,
    graph
  );
}

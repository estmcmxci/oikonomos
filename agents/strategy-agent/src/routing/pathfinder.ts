/**
 * OIK-22: Multi-Hop Pathfinder
 *
 * Uses BFS to find all possible routes between two tokens,
 * then ranks them by total fee.
 */

import type { Address } from 'viem';
import type { Route, RouteHop, RouteRequest, RouteResponse, PoolGraph } from './types';
import { getDefaultPoolGraph, hasDirectPool, getBestDirectPool } from './pools';

/**
 * Maximum number of hops to consider (gas cost tradeoff)
 */
const DEFAULT_MAX_HOPS = 3;

/**
 * Maximum number of routes to return
 */
const MAX_ROUTES = 5;

/**
 * Find all routes between tokenIn and tokenOut using BFS.
 *
 * @param request - Route finding parameters
 * @param graph - Pool graph to search (defaults to global graph)
 * @returns Best route and alternatives
 */
export function findRoutes(
  request: RouteRequest,
  graph: PoolGraph = getDefaultPoolGraph()
): RouteResponse {
  const {
    tokenIn,
    tokenOut,
    maxHops = DEFAULT_MAX_HOPS,
  } = request;

  const tokenInLower = tokenIn.toLowerCase() as Address;
  const tokenOutLower = tokenOut.toLowerCase() as Address;

  // Check for same token
  if (tokenInLower === tokenOutLower) {
    return {
      bestRoute: null,
      alternatives: [],
      hasDirectRoute: false,
    };
  }

  const routes: Route[] = [];
  const hasDirectPoolResult = hasDirectPool(tokenInLower, tokenOutLower, graph);

  // BFS to find all paths up to maxHops
  interface QueueItem {
    currentToken: Address;
    path: Address[];
    hops: RouteHop[];
    totalFee: number;
    visited: Set<string>;
  }

  const queue: QueueItem[] = [{
    currentToken: tokenInLower,
    path: [tokenInLower],
    hops: [],
    totalFee: 0,
    visited: new Set([tokenInLower]),
  }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Check if we've reached the destination
    if (current.currentToken === tokenOutLower) {
      routes.push({
        hops: current.hops,
        path: current.path,
        totalFee: current.totalFee,
        hopCount: current.hops.length,
      });
      continue;
    }

    // Don't explore further if we've hit max hops
    if (current.hops.length >= maxHops) {
      continue;
    }

    // Explore neighbors
    const edges = graph.get(current.currentToken);
    if (!edges) continue;

    for (const edge of edges) {
      const nextToken = edge.token.toLowerCase() as Address;

      // Don't revisit tokens (avoid cycles)
      if (current.visited.has(nextToken)) {
        continue;
      }

      const hop: RouteHop = {
        pool: edge.pool,
        tokenIn: current.currentToken,
        tokenOut: nextToken,
        fee: edge.fee,
      };

      const newVisited = new Set(current.visited);
      newVisited.add(nextToken);

      queue.push({
        currentToken: nextToken,
        path: [...current.path, nextToken],
        hops: [...current.hops, hop],
        totalFee: current.totalFee + edge.fee,
        visited: newVisited,
      });
    }
  }

  // Sort routes by total fee (lowest first)
  routes.sort((a, b) => a.totalFee - b.totalFee);

  // Take top routes
  const topRoutes = routes.slice(0, MAX_ROUTES);

  return {
    bestRoute: topRoutes[0] ?? null,
    alternatives: topRoutes.slice(1),
    hasDirectRoute: hasDirectPoolResult,
  };
}

/**
 * Find the single best route between two tokens.
 * Convenience wrapper around findRoutes.
 */
export function findBestRoute(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
  graph: PoolGraph = getDefaultPoolGraph()
): Route | null {
  const response = findRoutes({ tokenIn, tokenOut, amountIn }, graph);
  return response.bestRoute;
}

/**
 * Check if any route exists between two tokens.
 */
export function routeExists(
  tokenIn: Address,
  tokenOut: Address,
  graph: PoolGraph = getDefaultPoolGraph()
): boolean {
  const response = findRoutes({ tokenIn, tokenOut, amountIn: 0n, maxHops: DEFAULT_MAX_HOPS }, graph);
  return response.bestRoute !== null;
}

/**
 * Get the shortest route (fewest hops) between two tokens.
 */
export function findShortestRoute(
  tokenIn: Address,
  tokenOut: Address,
  graph: PoolGraph = getDefaultPoolGraph()
): Route | null {
  const response = findRoutes({ tokenIn, tokenOut, amountIn: 0n }, graph);

  if (!response.bestRoute && response.alternatives.length === 0) {
    return null;
  }

  // Find route with fewest hops
  const allRoutes = [response.bestRoute, ...response.alternatives].filter(Boolean) as Route[];
  allRoutes.sort((a, b) => a.hopCount - b.hopCount);

  return allRoutes[0] ?? null;
}

/**
 * Format a route as a human-readable string.
 */
export function formatRoute(route: Route): string {
  return route.path
    .map(token => token.slice(0, 10))
    .join(' → ');
}

/**
 * Get route summary for logging/debugging.
 */
export function getRouteSummary(route: Route): {
  path: string;
  hops: number;
  totalFeeBps: number;
  fees: number[];
} {
  return {
    path: formatRoute(route),
    hops: route.hopCount,
    totalFeeBps: route.totalFee,
    fees: route.hops.map(h => h.fee),
  };
}

/**
 * OIK-22: Pool Graph Management
 *
 * Builds and manages an adjacency graph of available Uniswap v4 pools
 * for multi-hop route discovery.
 */

import type { Address } from 'viem';
import type { Pool, PoolEdge, PoolGraph } from './types';

/**
 * ReceiptHook address - only pools with this hook emit ExecutionReceipts
 */
export const RECEIPT_HOOK_ADDRESS: Address = '0x41a75f07bA1958EcA78805D8419C87a393764040';

/**
 * Known pools on Sepolia that are relevant for portfolio rebalancing.
 * These are pools between major tokens (ETH, USDC, DAI, WETH).
 *
 * In production, this would be fetched dynamically from:
 * 1. PoolManager.Initialize events via the indexer
 * 2. On-chain pool registry
 */
const KNOWN_POOLS: Pool[] = [
  // ETH/USDC (Circle) - 0.3%
  {
    id: 'eth-usdc-3000',
    token0: '0x0000000000000000000000000000000000000000',
    token1: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
    fee: 3000,
    tickSpacing: 60,
    hook: RECEIPT_HOOK_ADDRESS,
  },
  // USDC (Aave) / DAI (Aave) - 0.05%
  {
    id: 'ausdc-adai-500',
    token0: '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8',
    token1: '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357',
    fee: 500,
    tickSpacing: 10,
    hook: RECEIPT_HOOK_ADDRESS,
  },
  // USDC (Aave) / DAI (Aave) - 0.01% (stablecoin optimized)
  {
    id: 'ausdc-adai-100',
    token0: '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8',
    token1: '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357',
    fee: 100,
    tickSpacing: 1,
    hook: RECEIPT_HOOK_ADDRESS,
  },
  // ETH/WETH (Sepolia) - wrap/unwrap equivalent
  {
    id: 'eth-weth-500',
    token0: '0x0000000000000000000000000000000000000000',
    token1: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
    fee: 500,
    tickSpacing: 10,
    hook: RECEIPT_HOOK_ADDRESS,
  },
  // WETH (Sepolia) / USDC (Circle) - 0.3%
  {
    id: 'weth-usdc-3000',
    token0: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
    token1: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
    fee: 3000,
    tickSpacing: 60,
    hook: RECEIPT_HOOK_ADDRESS,
  },
  // USDC (Circle) / DAI (Aave) - bridge between Circle and Aave stables
  {
    id: 'usdc-adai-500',
    token0: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
    token1: '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357',
    fee: 500,
    tickSpacing: 10,
    hook: RECEIPT_HOOK_ADDRESS,
  },
  // USDC (Circle) / USDC (Aave) - 0.01% (same asset, different wrapper)
  {
    id: 'usdc-ausdc-100',
    token0: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
    token1: '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8',
    fee: 100,
    tickSpacing: 1,
    hook: RECEIPT_HOOK_ADDRESS,
  },
];

/**
 * Build adjacency graph from pool list.
 * Each token maps to a list of edges (other tokens it can swap to).
 */
export function buildPoolGraph(
  pools: Pool[] = KNOWN_POOLS,
  requireReceiptHook = true
): PoolGraph {
  const graph: PoolGraph = new Map();

  for (const pool of pools) {
    // Filter by hook if required
    if (requireReceiptHook && pool.hook.toLowerCase() !== RECEIPT_HOOK_ADDRESS.toLowerCase()) {
      continue;
    }

    const token0 = pool.token0.toLowerCase() as Address;
    const token1 = pool.token1.toLowerCase() as Address;

    // Add edge from token0 -> token1
    if (!graph.has(token0)) {
      graph.set(token0, []);
    }
    graph.get(token0)!.push({
      token: token1,
      pool,
      fee: pool.fee,
    });

    // Add edge from token1 -> token0 (bidirectional)
    if (!graph.has(token1)) {
      graph.set(token1, []);
    }
    graph.get(token1)!.push({
      token: token0,
      pool,
      fee: pool.fee,
    });
  }

  return graph;
}

/**
 * Get all pools containing a specific token
 */
export function getPoolsForToken(token: Address, graph: PoolGraph): PoolEdge[] {
  return graph.get(token.toLowerCase() as Address) ?? [];
}

/**
 * Check if a direct pool exists between two tokens
 */
export function hasDirectPool(tokenIn: Address, tokenOut: Address, graph: PoolGraph): boolean {
  const edges = graph.get(tokenIn.toLowerCase() as Address);
  if (!edges) return false;

  return edges.some(edge => edge.token.toLowerCase() === tokenOut.toLowerCase());
}

/**
 * Get the best direct pool between two tokens (lowest fee)
 */
export function getBestDirectPool(
  tokenIn: Address,
  tokenOut: Address,
  graph: PoolGraph
): Pool | null {
  const edges = graph.get(tokenIn.toLowerCase() as Address);
  if (!edges) return null;

  const matchingEdges = edges.filter(
    edge => edge.token.toLowerCase() === tokenOut.toLowerCase()
  );

  if (matchingEdges.length === 0) return null;

  // Return pool with lowest fee
  matchingEdges.sort((a, b) => a.fee - b.fee);
  return matchingEdges[0].pool;
}

/**
 * Get all tokens in the graph
 */
export function getAllTokens(graph: PoolGraph): Address[] {
  return Array.from(graph.keys());
}

/**
 * Default pool graph instance (lazy initialized)
 */
let defaultGraph: PoolGraph | null = null;

export function getDefaultPoolGraph(): PoolGraph {
  if (!defaultGraph) {
    defaultGraph = buildPoolGraph();
  }
  return defaultGraph;
}

/**
 * Refresh the pool graph (e.g., after new pools are added)
 */
export function refreshPoolGraph(pools?: Pool[]): PoolGraph {
  defaultGraph = buildPoolGraph(pools);
  return defaultGraph;
}

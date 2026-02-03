/**
 * OIK-22: Multi-Pool Routing Module
 *
 * Exports for multi-hop route discovery and quote calculation.
 */

// Types
export type {
  Pool,
  PoolEdge,
  PoolGraph,
  RouteHop,
  Route,
  HopQuote,
  MultiHopQuote,
  RouteRequest,
  RouteResponse,
} from './types';

export { KNOWN_TOKENS } from './types';

// Pool graph management
export {
  RECEIPT_HOOK_ADDRESS,
  buildPoolGraph,
  getPoolsForToken,
  hasDirectPool,
  getBestDirectPool,
  getAllTokens,
  getDefaultPoolGraph,
  refreshPoolGraph,
} from './pools';

// Route discovery
export {
  findRoutes,
  findBestRoute,
  routeExists,
  findShortestRoute,
  formatRoute,
  getRouteSummary,
} from './pathfinder';

// Quote calculation
export {
  quoteMultiHop,
  getBestQuote,
  formatQuoteResponse,
} from './quotes';

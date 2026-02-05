/**
 * Capabilities Route Handler
 *
 * Returns the provider's capabilities for the A2A protocol.
 */

import type { Capabilities } from '../types';

/**
 * Provider capabilities
 */
const CAPABILITIES: Capabilities = {
  type: 'meta-treasury-manager',
  version: '1.0.0',
  supportedPlatforms: ['moltbook', '4claw', 'clawstr', 'moltx'],
  strategies: {
    claiming: {
      frequency: ['daily', 'weekly', 'monthly', 'threshold'],
      minThreshold: '0.01 WETH',
    },
    wethManagement: {
      compound: true,
      toStables: true,
      hold: true,
      customSplit: true,
    },
    tokenManagement: {
      holdWinners: true,
      exitLosers: true,
      rebalance: true,
    },
  },
  pricing: {
    type: 'percentage',
    value: '2%',
    basis: 'claimed fees',
  },
  supportedChains: [84532], // Base Sepolia
  description: 'Reference implementation of meta-treasury management for Clawnch-launched AI agent tokens',
};

/**
 * Handle GET /capabilities
 */
export async function handleCapabilities(): Promise<Response> {
  return new Response(JSON.stringify(CAPABILITIES), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

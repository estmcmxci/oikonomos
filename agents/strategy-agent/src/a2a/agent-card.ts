import type { Env } from '../index';

export function handleAgentCard(env: Env, corsHeaders: Record<string, string>): Response {
  const agentCard = {
    name: 'Oikonomos Routing Strategy',
    description: 'Optimized swap routing for Uniswap v4 with MEV protection',
    version: '0.1.0',
    chainId: parseInt(env.CHAIN_ID),

    capabilities: ['swap', 'quote', 'route-optimization'],

    endpoints: {
      quote: '/quote',
      execute: '/execute',
      pricing: '/pricing',
      health: '/health',
    },

    supportedTokens: [
      '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
      '0x0000000000000000000000000000000000000000', // ETH
    ],

    constraints: {
      maxSlippageBps: 100, // 1% max
      minAmountUsd: 10,
      maxAmountUsd: 1000000,
    },

    pricing: {
      model: 'per-quote',
      feesBps: 0, // Free for MVP
    },

    contact: {
      ens: 'strategy.router.oikonomos.eth',
    },
  };

  return new Response(JSON.stringify(agentCard, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

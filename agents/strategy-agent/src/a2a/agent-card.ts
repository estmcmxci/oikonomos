import type { Env } from '../index';
import type { ERC8004AgentMetadata, ERC8004Service } from './erc8004';

// Extended agent card with both ERC-8004 compliance and Oikonomos-specific fields
interface OikonomosStrategyCard extends ERC8004AgentMetadata {
  // Oikonomos extensions
  version: string;
  chainId: number;
  capabilities: string[];
  endpoints: Record<string, string>;
  supportedTokens: string[];
  constraints: {
    maxSlippageBps: number;
    minAmountUsd: number;
    maxAmountUsd: number;
  };
  pricing: {
    model: string;
    feesBps: number;
  };
}

export function handleAgentCard(env: Env, corsHeaders: Record<string, string>): Response {
  // Build ERC-8004 compliant services array
  const services: ERC8004Service[] = [
    { type: 'A2A', url: '/.well-known/agent-card.json' },
    { type: 'ENS', value: 'strategy.oikonomos.eth' },
    { type: 'web', url: 'https://oikonomos.app' },
  ];

  const agentCard: OikonomosStrategyCard = {
    // ERC-8004 required fields
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'Oikonomos Routing Strategy',
    description: 'Optimized swap routing for Uniswap v4 with MEV protection',
    image: '', // Optional: Add agent avatar URL
    active: true,
    x402Support: false,
    services,

    // Oikonomos-specific extensions
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
      '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // USDC (Aave Sepolia)
      '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', // DAI (Aave Sepolia)
      '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c', // WETH (Aave Sepolia)
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
  };

  return new Response(JSON.stringify(agentCard, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * ERC-8004 Agent Card
 *
 * Returns metadata about this agent for discovery and verification.
 */

import type { Env } from '../index';
import { TEMPLATE_CONFIG } from '../index';

interface AgentCard {
  // ERC-8004 required fields
  type: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
  x402Support: boolean;
  services: Array<{ type: string; url?: string; value?: string }>;

  // Oikonomos extensions
  version: string;
  chainId: number;
  capabilities: string[];
  endpoints: Record<string, string>;
  supportedTokens: string[];
  pricing: {
    model: string;
    feesBps: number;
    feeType: string;
  };
  constraints: {
    maxSlippageBps: number;
    minAmountUsd: number;
    maxAmountUsd: number;
  };
}

export function handleAgentCard(env: Env, corsHeaders: Record<string, string>): Response {
  const agentCard: AgentCard = {
    // ERC-8004 required fields
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: TEMPLATE_CONFIG.name,
    description: TEMPLATE_CONFIG.description,
    image: '', // Add your agent avatar URL
    active: true,
    x402Support: true, // Enable x402 payments

    // Service discovery
    services: [
      { type: 'A2A', url: '/.well-known/agent-card.json' },
      { type: 'ENS', value: TEMPLATE_CONFIG.ensName },
    ],

    // Oikonomos extensions
    version: TEMPLATE_CONFIG.version,
    chainId: parseInt(env.CHAIN_ID),

    capabilities: ['quote', 'execute', 'swap'],

    endpoints: {
      agentCard: '/.well-known/agent-card.json',
      capabilities: '/capabilities',
      quote: '/quote',
      execute: '/execute',
      pricing: '/pricing',
      health: '/health',
    },

    supportedTokens: TEMPLATE_CONFIG.supportedTokens.map((t) => t.address),

    pricing: {
      model: 'per-execution',
      feesBps: TEMPLATE_CONFIG.feeBps,
      feeType: TEMPLATE_CONFIG.feeType,
    },

    constraints: {
      maxSlippageBps: TEMPLATE_CONFIG.maxSlippageBps,
      minAmountUsd: TEMPLATE_CONFIG.minAmountUsd,
      maxAmountUsd: TEMPLATE_CONFIG.maxAmountUsd,
    },
  };

  return new Response(JSON.stringify(agentCard, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

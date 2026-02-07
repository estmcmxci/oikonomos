import type { Env } from '../index';
import type { ERC8004AgentMetadata, ERC8004Service } from './erc8004';

// Extended agent card with both ERC-8004 compliance and Oikonomos-specific fields
interface OikonomosAgentCard extends ERC8004AgentMetadata {
  // Oikonomos extensions
  version: string;
  chainId: number;
  mode: string;
  capabilities: string[];
  endpoints: Record<string, string>;
  supportedTokens: string[];
  policyTemplates: Array<{
    name: string;
    description: string;
    params: string[];
  }>;
}

export function handleAgentCard(env: Env, corsHeaders: Record<string, string>): Response {
  // Build ERC-8004 compliant services array
  const services: ERC8004Service[] = [
    { type: 'A2A', url: '/.well-known/agent-card.json' },
    { type: 'ENS', value: 'treasury.oikonomosapp.eth' },
    { type: 'web', url: 'https://oikonomos.app' },
  ];

  const agentCard: OikonomosAgentCard = {
    // ERC-8004 required fields
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'Oikonomos Treasury Agent',
    description: 'Automated stablecoin treasury rebalancing with policy enforcement',
    image: '', // Optional: Add agent avatar URL
    active: true,
    x402Support: true,
    services,

    // Oikonomos-specific extensions
    version: '0.1.0',
    chainId: parseInt(env.CHAIN_ID),
    mode: 'intent-only', // or 'safe-roles' for DAO mode

    capabilities: [
      'rebalance',
      'drift-detection',
      'policy-enforcement',
      'multi-token',
    ],

    endpoints: {
      configure: '/configure',
      checkTriggers: '/check-triggers',
      rebalance: '/rebalance',
      portfolio: '/portfolio',
      authorize: '/authorize',
      events: '/events',
      health: '/health',
      quote: '/quote',
      execute: '/execute',
      analytics: '/analytics',
    },

    supportedTokens: [
      '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // USDC (Aave Sepolia)
      '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', // DAI (Aave Sepolia)
      '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c', // WETH (Aave Sepolia)
    ],

    policyTemplates: [
      {
        name: 'stablecoin-rebalance',
        description: 'Maintain target allocation across stablecoins',
        params: ['targetAllocations', 'driftThreshold', 'maxSlippage', 'maxDaily'],
      },
      {
        name: 'threshold-rebalance',
        description: 'Rebalance when any token exceeds threshold',
        params: ['thresholds', 'maxSlippage'],
      },
    ],
  };

  return new Response(JSON.stringify(agentCard, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

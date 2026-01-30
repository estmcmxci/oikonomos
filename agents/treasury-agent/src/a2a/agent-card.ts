import type { Env } from '../index';

export function handleAgentCard(env: Env, corsHeaders: Record<string, string>): Response {
  const agentCard = {
    name: 'Oikonomos Treasury Agent',
    description: 'Automated stablecoin treasury rebalancing with policy enforcement',
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
      health: '/health',
    },

    supportedTokens: [
      '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
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

    contact: {
      ens: 'treasury.oikonomos.eth',
    },
  };

  return new Response(JSON.stringify(agentCard, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * x402 Pricing Endpoint
 *
 * Returns pricing information for this agent's services.
 */

import type { Env } from '../index';
import { TEMPLATE_CONFIG } from '../index';

interface PricingResponse {
  agent: string;
  version: string;
  pricing: {
    feeType: string;
    feeBps: number;
    feePercentage: string;
    description: string;
  };
  payment: {
    acceptedTokens: Array<{ address: string; symbol: string }>;
    paymentAddress: string;
    network: string;
  };
}

export function handlePricing(env: Env, corsHeaders: Record<string, string>): Response {
  const pricing: PricingResponse = {
    agent: TEMPLATE_CONFIG.name,
    version: TEMPLATE_CONFIG.version,
    pricing: {
      feeType: TEMPLATE_CONFIG.feeType,
      feeBps: TEMPLATE_CONFIG.feeBps,
      feePercentage: `${TEMPLATE_CONFIG.feeBps / 100}%`,
      description: `${TEMPLATE_CONFIG.feeBps / 100}% of trade volume, paid in input token`,
    },
    payment: {
      acceptedTokens: TEMPLATE_CONFIG.supportedTokens,
      paymentAddress: env.AGENT_WALLET || '0x0000000000000000000000000000000000000000',
      network: `eip155:${env.CHAIN_ID}`,
    },
  };

  return new Response(JSON.stringify(pricing, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

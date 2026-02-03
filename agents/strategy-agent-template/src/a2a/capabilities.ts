/**
 * Capabilities Endpoint
 *
 * Returns what this agent can do - used for marketplace discovery.
 */

import { TEMPLATE_CONFIG } from '../index';

interface CapabilitiesResponse {
  supportedTokens: Array<{ address: string; symbol: string }>;
  policyTypes: string[];
  pricing: {
    type: string;
    value: string;
  };
  description: string;
  version: string;
  constraints: {
    maxSlippageBps: number;
    minAmountUsd: number;
    maxAmountUsd: number;
  };
}

export function handleCapabilities(corsHeaders: Record<string, string>): Response {
  const capabilities: CapabilitiesResponse = {
    supportedTokens: TEMPLATE_CONFIG.supportedTokens,
    policyTypes: TEMPLATE_CONFIG.policyTypes,
    pricing: {
      type: TEMPLATE_CONFIG.feeType,
      value: `${TEMPLATE_CONFIG.feeBps / 100}%`, // Convert bps to percentage string
    },
    description: TEMPLATE_CONFIG.description,
    version: TEMPLATE_CONFIG.version,
    constraints: {
      maxSlippageBps: TEMPLATE_CONFIG.maxSlippageBps,
      minAmountUsd: TEMPLATE_CONFIG.minAmountUsd,
      maxAmountUsd: TEMPLATE_CONFIG.maxAmountUsd,
    },
  };

  return new Response(JSON.stringify(capabilities, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

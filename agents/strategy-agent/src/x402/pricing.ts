import type { Env } from '../index';

interface PricingResponse {
  model: string;
  feesBps: number;
  freeQuota: {
    quotesPerDay: number;
    executionsPerDay: number;
  };
  premium: {
    enabled: boolean;
    priceUsdc: number;
    features: string[];
  };
}

export function handlePricing(env: Env, corsHeaders: Record<string, string>): Response {
  const pricing: PricingResponse = {
    model: 'freemium',
    feesBps: 0, // Free for MVP
    freeQuota: {
      quotesPerDay: 1000,
      executionsPerDay: 100,
    },
    premium: {
      enabled: false, // Coming soon
      priceUsdc: 0,
      features: [
        'Priority execution',
        'Advanced MEV protection',
        'Multi-hop routing',
        'Custom fee tiers',
      ],
    },
  };

  return new Response(JSON.stringify(pricing, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

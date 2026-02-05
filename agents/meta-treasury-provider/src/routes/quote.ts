/**
 * Quote Route Handler
 *
 * Provides fee estimates for management operations.
 */

import { formatEther, type Address } from 'viem';
import type { Env, QuoteRequest, QuoteResponse, TokenQuote } from '../types';
import { createFeeChecker } from '../services/feeChecker';

// Provider fee in basis points (2%)
const PROVIDER_FEE_BPS = 200;

// Estimated gas cost in ETH
const ESTIMATED_GAS_ETH = '0.001';

/**
 * Handle POST /quote
 */
export async function handleQuote(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as QuoteRequest;

    // Validate request
    if (!body.userWallet || !body.tokens || body.tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userWallet, tokens' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create fee checker
    const feeChecker = createFeeChecker(env.BASE_SEPOLIA_RPC_URL);

    // Get fees for all tokens
    const aggregateFees = await feeChecker.getAggregateFees(
      body.tokens as Address[],
      body.userWallet as Address
    );

    // Calculate provider fee
    const providerFee = (aggregateFees.totalWethFees * BigInt(PROVIDER_FEE_BPS)) / 10000n;

    // Build token quotes
    const tokenQuotes: TokenQuote[] = aggregateFees.tokens.map(info => ({
      token: info.token,
      estimatedWethFees: formatEther(info.wethFees),
      estimatedTokenFees: info.tokenFees.toString(),
    }));

    // Generate quote ID
    const quoteId = generateQuoteId(body.userWallet, body.tokens);

    // Quote valid for 5 minutes
    const validUntil = Math.floor(Date.now() / 1000) + 300;

    const response: QuoteResponse = {
      quoteId,
      estimatedWethFees: formatEther(aggregateFees.totalWethFees),
      estimatedProviderFee: formatEther(providerFee),
      estimatedGasCost: ESTIMATED_GAS_ETH,
      validUntil,
      tokens: tokenQuotes,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[quote] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate quote' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Generate a deterministic quote ID
 */
function generateQuoteId(userWallet: string, tokens: string[]): string {
  const timestamp = Date.now();
  const data = `${userWallet}-${tokens.sort().join('-')}-${timestamp}`;
  // Simple hash - in production use a proper hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `quote-${Math.abs(hash).toString(16)}-${timestamp}`;
}

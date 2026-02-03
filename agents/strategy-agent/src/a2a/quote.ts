/**
 * OIK-22: Multi-Hop Quote Handler
 *
 * Updated to return multi-hop route details in quote response.
 */

import type { Address, Hex } from 'viem';
import type { Env } from '../index';
import { findOptimalRoute } from '../strategy/router';
import { generateQuoteId } from '../utils/quoteId';
import { encodeHookData, generateStrategyId } from '../utils/hookData';

interface QuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  maxSlippageBps?: number;
  sender?: string;
}

interface RouteStep {
  pool: string;
  tokenIn: string;
  tokenOut: string;
  fee: number;
}

/**
 * OIK-22: Extended quote response with multi-hop details
 */
interface QuoteResponse {
  quoteId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  estimatedSlippageBps: number;
  route: RouteStep[];
  hookData: string;
  expiresAt: number;
  // OIK-22: Multi-hop additions
  isMultiHop: boolean;
  hopCount: number;
  path: string[];
  slippageByHop: number[];
  priceImpactBps: number;
  gasEstimate: string;
}

/**
 * OIK-37: Stored quote for execute validation
 */
interface StoredQuote {
  quoteId: string;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  expectedAmountOut: string;
  estimatedSlippageBps: number;
  hookData: Hex;
  expiresAt: number;
  route: RouteStep[];
  // OIK-22: Multi-hop additions
  isMultiHop: boolean;
  hopCount: number;
  path: string[];
}

export async function handleQuote(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: QuoteRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate request
  if (!body.tokenIn || !body.tokenOut || !body.amountIn) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: tokenIn, tokenOut, amountIn' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const maxSlippage = body.maxSlippageBps ?? 50; // Default 0.5%

  try {
    // Find optimal route (now supports multi-hop)
    const routeResult = await findOptimalRoute(
      env,
      body.tokenIn,
      body.tokenOut,
      BigInt(body.amountIn)
    );

    // Generate quote ID for attribution
    const quoteId = generateQuoteId();

    // Build hookData for ReceiptHook
    const strategyId = generateStrategyId('strategy.router.oikonomos.eth');
    const hookData = encodeHookData(strategyId, quoteId, maxSlippage);

    const expiresAt = Date.now() + 60000; // 1 minute expiry

    // Build path array from route steps
    const path = routeResult.steps.length > 0
      ? [routeResult.steps[0].tokenIn, ...routeResult.steps.map(s => s.tokenOut)]
      : [body.tokenIn, body.tokenOut];

    // Get slippage by hop from multi-hop quote
    const slippageByHop = routeResult.multiHopQuote
      ? routeResult.multiHopQuote.hopQuotes.map(h => h.slippageBps)
      : [routeResult.estimatedSlippageBps];

    // Get price impact from multi-hop quote
    const priceImpactBps = routeResult.multiHopQuote
      ? routeResult.multiHopQuote.totalPriceImpactBps
      : 0;

    // Get gas estimate from multi-hop quote
    const gasEstimate = routeResult.multiHopQuote
      ? routeResult.multiHopQuote.gasEstimate.toString()
      : '150000';

    const response: QuoteResponse = {
      quoteId,
      tokenIn: body.tokenIn,
      tokenOut: body.tokenOut,
      amountIn: body.amountIn,
      expectedAmountOut: routeResult.expectedAmountOut.toString(),
      estimatedSlippageBps: routeResult.estimatedSlippageBps,
      route: routeResult.steps,
      hookData,
      expiresAt,
      // OIK-22: Multi-hop details
      isMultiHop: routeResult.isMultiHop,
      hopCount: routeResult.steps.length,
      path,
      slippageByHop,
      priceImpactBps,
      gasEstimate,
    };

    // OIK-37: Store quote in KV for execute endpoint validation
    const storedQuote: StoredQuote = {
      quoteId,
      tokenIn: body.tokenIn as Address,
      tokenOut: body.tokenOut as Address,
      amountIn: body.amountIn,
      expectedAmountOut: routeResult.expectedAmountOut.toString(),
      estimatedSlippageBps: routeResult.estimatedSlippageBps,
      hookData: hookData as Hex,
      expiresAt,
      route: routeResult.steps,
      // OIK-22: Multi-hop additions
      isMultiHop: routeResult.isMultiHop,
      hopCount: routeResult.steps.length,
      path,
    };

    await env.STRATEGY_KV.put(`quote:${quoteId}`, JSON.stringify(storedQuote), {
      expirationTtl: 120, // 2 minutes TTL (slightly longer than quote expiry)
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Quote error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate quote', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

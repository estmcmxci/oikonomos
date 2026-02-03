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
    // Find optimal route
    const route = await findOptimalRoute(
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

    const response: QuoteResponse = {
      quoteId,
      tokenIn: body.tokenIn,
      tokenOut: body.tokenOut,
      amountIn: body.amountIn,
      expectedAmountOut: route.expectedAmountOut.toString(),
      estimatedSlippageBps: route.estimatedSlippageBps,
      route: route.steps,
      hookData,
      expiresAt,
    };

    // OIK-37: Store quote in KV for execute endpoint validation
    const storedQuote: StoredQuote = {
      quoteId,
      tokenIn: body.tokenIn as Address,
      tokenOut: body.tokenOut as Address,
      amountIn: body.amountIn,
      expectedAmountOut: route.expectedAmountOut.toString(),
      estimatedSlippageBps: route.estimatedSlippageBps,
      hookData: hookData as Hex,
      expiresAt,
      route: route.steps,
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

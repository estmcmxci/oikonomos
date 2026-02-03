/**
 * Quote Handler
 *
 * Generates quotes for swap requests with x402 pricing information.
 */

import { keccak256, toHex, encodeAbiParameters, parseAbiParameters } from 'viem';
import type { Env } from '../index';
import { TEMPLATE_CONFIG } from '../index';

interface QuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  maxSlippageBps?: number;
  user?: string;
}

interface QuoteResponse {
  quoteId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  estimatedSlippageBps: number;
  validUntil: number;
  pricing: {
    feeType: string;
    feeValue: string;
    feeAmount: string;
    paymentToken: string;
    paymentAddress: string;
    network: string;
  };
}

/**
 * Generate a unique quote ID
 */
function generateQuoteId(): string {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).slice(2, 10);
  return `0x${timestamp}${random}`;
}

/**
 * Generate strategy ID from ENS name (for ReceiptHook attribution)
 */
function generateStrategyId(ensName: string): `0x${string}` {
  return keccak256(toHex(ensName));
}

/**
 * Encode hookData for ReceiptHook
 */
function encodeHookData(
  strategyId: `0x${string}`,
  quoteId: string,
  maxSlippageBps: number
): `0x${string}` {
  const quoteIdBytes32 = quoteId.padEnd(66, '0').slice(0, 66) as `0x${string}`;
  return encodeAbiParameters(
    parseAbiParameters('bytes32 strategyId, bytes32 quoteId, uint256 maxSlippageBps'),
    [strategyId, quoteIdBytes32, BigInt(maxSlippageBps)]
  );
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

  // Validate required fields
  if (!body.tokenIn || !body.tokenOut || !body.amountIn) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: tokenIn, tokenOut, amountIn' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate tokens are supported
  const supportedAddresses = TEMPLATE_CONFIG.supportedTokens.map((t) => t.address.toLowerCase());
  if (!supportedAddresses.includes(body.tokenIn.toLowerCase())) {
    return new Response(
      JSON.stringify({ error: `Token ${body.tokenIn} is not supported` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (!supportedAddresses.includes(body.tokenOut.toLowerCase())) {
    return new Response(
      JSON.stringify({ error: `Token ${body.tokenOut} is not supported` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const maxSlippage = body.maxSlippageBps ?? 50;
    const quoteId = generateQuoteId();

    // ─────────────────────────────────────────────────────────────────────────
    // TODO: Implement your quote logic here
    // This is where you calculate the expected output amount based on your strategy
    // ─────────────────────────────────────────────────────────────────────────

    // For stablecoins, assume 1:1 with small slippage
    // Replace this with your actual quoting logic
    const amountIn = BigInt(body.amountIn);
    const estimatedSlippage = 5; // 5 bps estimated slippage
    const expectedAmountOut = amountIn - (amountIn * BigInt(estimatedSlippage)) / 10000n;

    // Calculate fee amount (for x402 pricing display)
    const feeAmount = (amountIn * BigInt(TEMPLATE_CONFIG.feeBps)) / 10000n;

    // Quote expires in 60 seconds
    const validUntil = Date.now() + 60000;

    // Build hookData for ReceiptHook
    const strategyId = generateStrategyId(TEMPLATE_CONFIG.ensName);
    const hookData = encodeHookData(strategyId, quoteId, maxSlippage);

    // Store quote in KV for execute endpoint validation
    await env.STRATEGY_KV.put(
      `quote:${quoteId}`,
      JSON.stringify({
        quoteId,
        tokenIn: body.tokenIn,
        tokenOut: body.tokenOut,
        amountIn: body.amountIn,
        expectedAmountOut: expectedAmountOut.toString(),
        estimatedSlippageBps: estimatedSlippage,
        hookData,
        validUntil,
        user: body.user,
      }),
      { expirationTtl: 120 } // 2 minutes TTL
    );

    const response: QuoteResponse = {
      quoteId,
      tokenIn: body.tokenIn,
      tokenOut: body.tokenOut,
      amountIn: body.amountIn,
      expectedAmountOut: expectedAmountOut.toString(),
      estimatedSlippageBps: estimatedSlippage,
      validUntil,
      pricing: {
        feeType: TEMPLATE_CONFIG.feeType,
        feeValue: `${TEMPLATE_CONFIG.feeBps / 100}%`,
        feeAmount: feeAmount.toString(),
        paymentToken: body.tokenIn, // Fee paid in input token
        paymentAddress: env.AGENT_WALLET || '0x0000000000000000000000000000000000000000',
        network: `eip155:${env.CHAIN_ID}`,
      },
    };

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

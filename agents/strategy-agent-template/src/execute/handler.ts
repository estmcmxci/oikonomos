/**
 * Execute Handler
 *
 * Executes trades based on quotes. Gated by x402 payment requirement.
 */

import type { Address, Hex } from 'viem';
import type { Env } from '../index';
import { TEMPLATE_CONFIG } from '../index';

interface ExecuteRequest {
  quoteId: string;
  intent: {
    user: Address;
    tokenIn: Address;
    tokenOut: Address;
    amountIn: string;
    minAmountOut: string;
    deadline: number;
    nonce: number;
  };
  signature: Hex;
  x402Payment?: {
    receipt: string;
  };
}

interface StoredQuote {
  quoteId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  estimatedSlippageBps: number;
  hookData: string;
  validUntil: number;
  user?: string;
}

interface ExecuteResponse {
  success: boolean;
  txHash?: string;
  receiptId?: string;
  actualSlippage?: number;
  amountOut?: string;
  error?: string;
}

export async function handleExecute(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: ExecuteRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate required fields
  if (!body.quoteId || !body.signature || !body.intent) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing required fields: quoteId, signature, intent',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // x402 Payment Gate
  // ─────────────────────────────────────────────────────────────────────────

  if (!body.x402Payment?.receipt) {
    // Return 402 Payment Required with pricing information
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Payment required',
        x402: {
          accepts: [
            {
              scheme: 'exact',
              network: `eip155:${env.CHAIN_ID}`,
              maxAmountRequired: calculateFee(body.intent.amountIn),
              resource: `/execute`,
              payTo: env.AGENT_WALLET,
              token: body.intent.tokenIn,
              description: `Execution fee for ${TEMPLATE_CONFIG.name}`,
            },
          ],
        },
      }),
      {
        status: 402,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Payment-Required': 'true',
        },
      }
    );
  }

  try {
    // Validate quote exists and hasn't expired
    const storedQuote = await validateQuote(env, body.quoteId);
    if (!storedQuote) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired quoteId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify quote parameters match intent
    if (
      storedQuote.tokenIn.toLowerCase() !== body.intent.tokenIn.toLowerCase() ||
      storedQuote.tokenOut.toLowerCase() !== body.intent.tokenOut.toLowerCase() ||
      storedQuote.amountIn !== body.intent.amountIn
    ) {
      return new Response(
        JSON.stringify({ success: false, error: 'Intent parameters do not match quote' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TODO: Implement your execution logic here
    // This is where you execute the swap via IntentRouter
    // ─────────────────────────────────────────────────────────────────────────

    // For the template, we return a mock successful execution
    // Replace this with actual IntentRouter integration
    const mockTxHash = `0x${Date.now().toString(16)}${'0'.repeat(48)}`;

    // Mark quote as used
    await env.STRATEGY_KV.delete(`quote:${body.quoteId}`);

    const response: ExecuteResponse = {
      success: true,
      txHash: mockTxHash,
      receiptId: `${body.quoteId.slice(0, 18)}-${Date.now()}`,
      actualSlippage: storedQuote.estimatedSlippageBps,
      amountOut: storedQuote.expectedAmountOut,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Execute error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Execution failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Calculate fee amount based on input amount
 */
function calculateFee(amountIn: string): string {
  const amount = BigInt(amountIn);
  const fee = (amount * BigInt(TEMPLATE_CONFIG.feeBps)) / 10000n;
  return fee.toString();
}

/**
 * Validate quote from KV storage
 */
async function validateQuote(env: Env, quoteId: string): Promise<StoredQuote | null> {
  const stored = await env.STRATEGY_KV.get(`quote:${quoteId}`);
  if (!stored) return null;

  const quote: StoredQuote = JSON.parse(stored);

  // Check expiry
  if (quote.validUntil < Date.now()) {
    await env.STRATEGY_KV.delete(`quote:${quoteId}`);
    return null;
  }

  return quote;
}

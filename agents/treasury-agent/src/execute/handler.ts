import type { Address, Hex } from 'viem';
import type { Env } from '../index';
import type { ExecuteRequest, ExecuteResponse, X402PricingInfo } from '../x402/types';
import { validateQuote } from '../quote/handler';
import {
  validateX402Payment,
  buildPaymentRequirement,
  create402Response,
} from '../x402/middleware';
import { recordFeeEarning } from '../x402/analytics';
import { getPaymentAddress, NETWORK, PAYMENT_TOKEN } from '../x402/config';
import { buildAndSignIntent, submitIntent, getNonce } from '../modes/intentMode';
import { requirePoolForPair } from '../config/pools';

/**
 * Handle POST /execute requests
 *
 * Validates x402 payment and executes the quoted trade.
 *
 * Flow:
 * 1. Validate quoteId exists and is not expired
 * 2. Check for x402 payment header
 * 3. If no payment, return 402 with payment requirements
 * 4. If payment present, verify with facilitator
 * 5. Execute the trade via IntentRouter
 * 6. Record fee earnings for analytics
 */
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

  if (!body.quoteId || !body.userAddress) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields: quoteId, userAddress' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 1. Validate quote exists and is not expired
  const quote = await validateQuote(env, body.quoteId);

  if (!quote) {
    return new Response(
      JSON.stringify({ success: false, error: 'Quote not found or expired' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 2. Get agent's payment address
  const paymentAddress = getPaymentAddress(env as { AGENT_WALLET?: string });

  // 3. Check for x402 payment
  const paymentResult = await validateX402Payment(
    request,
    quote.pricing.feeAmount,
    paymentAddress,
    `/execute?quoteId=${body.quoteId}`
  );

  // 4. If no valid payment, return 402 Payment Required
  if (!paymentResult.valid) {
    const requirement = buildPaymentRequirement(
      quote.pricing.feeAmount,
      paymentAddress,
      `/execute?quoteId=${body.quoteId}`,
      `Execution fee for swap ${quote.tokenIn} → ${quote.tokenOut}`
    );

    return create402Response(requirement, corsHeaders);
  }

  // 5. Execute the trade
  try {
    const result = await executeQuotedTrade(env, body, quote);

    // 6. Record fee earnings
    if (result.success && paymentResult.txHash) {
      await recordFeeEarning(env.TREASURY_KV, {
        quoteId: body.quoteId,
        userAddress: body.userAddress,
        feeAmount: quote.pricing.feeAmount,
        paymentToken: PAYMENT_TOKEN,
        txHash: paymentResult.txHash,
        timestamp: Date.now(),
      });
    }

    return new Response(JSON.stringify(result), {
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
 * Execute a quoted trade via IntentRouter
 */
async function executeQuotedTrade(
  env: Env,
  request: ExecuteRequest,
  quote: Awaited<ReturnType<typeof validateQuote>> & { tokenIn: Address; tokenOut: Address; amountIn: string }
): Promise<ExecuteResponse> {
  if (!quote) {
    return { success: false, error: 'Invalid quote' };
  }

  try {
    // Get current nonce for user
    const nonce = await getNonce(env, request.userAddress);

    // Build and sign intent
    const signedIntent = await buildAndSignIntent(env, {
      user: request.userAddress,
      tokenIn: quote.tokenIn,
      tokenOut: quote.tokenOut,
      amountIn: BigInt(quote.amountIn),
      maxSlippageBps: quote.slippage,
      strategyId: (env.STRATEGY_ID ||
        '0x0000000000000000000000000000000000000000000000000000000000000001') as Hex,
      nonce,
      ttlSeconds: 3600,
    });

    // Get pool configuration
    const poolKey = requirePoolForPair(quote.tokenIn, quote.tokenOut);

    // Submit intent to IntentRouter
    const txHash = await submitIntent(env, signedIntent, poolKey, quote.quoteId as Hex);

    return {
      success: true,
      txHash,
      receipt: {
        strategyId: env.STRATEGY_ID || 'default',
        quoteId: quote.quoteId,
        amountIn: quote.amountIn,
        amountOut: quote.amountOut,
      },
    };
  } catch (error) {
    console.error('Trade execution failed:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get pricing info for a quote (used by /quote endpoint)
 */
export function buildPricingInfo(
  feeAmount: string,
  paymentAddress: Address
): X402PricingInfo {
  return {
    feeType: 'percentage',
    feeValue: '0.1%',
    feeAmount,
    paymentToken: PAYMENT_TOKEN,
    paymentAddress,
    network: NETWORK,
  };
}

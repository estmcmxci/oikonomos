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
import { submitIntent, getNonce, buildIntentMessage } from '../modes/intentMode';
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
  // Global error handler to catch unhandled exceptions
  try {
    return await handleExecuteInternal(request, env, corsHeaders);
  } catch (error) {
    console.error('[execute] Unhandled error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleExecuteInternal(
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

  if (!body.quoteId || !body.userAddress || !body.signature) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields: quoteId, userAddress, signature' }),
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

  // 5. Log payment verification for audit trail (OIK-49)
  const paymentAuditLog = {
    event: 'x402_payment_verified',
    timestamp: new Date().toISOString(),
    quoteId: body.quoteId,
    payer: body.userAddress,
    recipient: paymentAddress,
    amount: quote.pricing.feeAmount,
    currency: PAYMENT_TOKEN,
    network: NETWORK,
    txHash: paymentResult.txHash || null,
  };
  console.log('[payment-audit]', JSON.stringify(paymentAuditLog));

  // 6. Execute the trade
  try {
    const result = await executeQuotedTrade(env, body, quote);

    // 7. Record fee earnings
    if (result.success && paymentResult.txHash) {
      await recordFeeEarning(env.TREASURY_KV, {
        quoteId: body.quoteId,
        userAddress: body.userAddress,
        feeAmount: quote.pricing.feeAmount,
        paymentToken: PAYMENT_TOKEN,
        txHash: paymentResult.txHash,
        timestamp: Date.now(),
      });

      // Log successful execution for audit trail
      console.log('[execution-audit]', JSON.stringify({
        event: 'trade_executed',
        timestamp: new Date().toISOString(),
        quoteId: body.quoteId,
        userAddress: body.userAddress,
        txHash: result.txHash,
        paymentTxHash: paymentResult.txHash,
      }));
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
 * Uses the user's pre-signed intent signature
 */
async function executeQuotedTrade(
  env: Env,
  request: ExecuteRequest,
  quote: Awaited<ReturnType<typeof validateQuote>> & { tokenIn: Address; tokenOut: Address; amountIn: string }
): Promise<ExecuteResponse> {
  if (!quote) {
    return { success: false, error: 'Invalid quote' };
  }

  if (!request.signature) {
    return { success: false, error: 'User signature is required' };
  }

  try {
    // Retrieve the stored intent (created during /prepare-execute)
    // This ensures we use the exact same values (including deadline) that the user signed
    const storedIntentJson = await env.TREASURY_KV.get(`intent:${quote.quoteId}`);

    if (!storedIntentJson) {
      return { success: false, error: 'Intent not found - call /prepare-execute first' };
    }

    const storedIntent = JSON.parse(storedIntentJson) as {
      user: Address;
      tokenIn: Address;
      tokenOut: Address;
      amountIn: string;
      maxSlippage: string;
      deadline: string;
      strategyId: Hex;
      nonce: string;
    };

    // Build the intent struct with the exact values the user signed
    const intent = {
      user: storedIntent.user,
      tokenIn: storedIntent.tokenIn,
      tokenOut: storedIntent.tokenOut,
      amountIn: BigInt(storedIntent.amountIn),
      maxSlippageBps: parseInt(storedIntent.maxSlippage),
      deadline: BigInt(storedIntent.deadline),
      strategyId: storedIntent.strategyId,
      nonce: BigInt(storedIntent.nonce),
      ttlSeconds: 0, // Not used since deadline is already set
    };

    // Use the user's signature (they signed the intent client-side)
    const signedIntent = {
      intent,
      signature: request.signature as Hex,
    };

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

interface PrepareExecuteRequest {
  quoteId: string;
  userAddress: Address;
}

/**
 * Handle POST /prepare-execute requests
 *
 * Returns the EIP-712 typed data that the user must sign before calling /execute.
 * This allows clients to sign the intent locally before submitting.
 */
export async function handlePrepareExecute(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: PrepareExecuteRequest;

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

  // Validate quote exists and is not expired
  const quote = await validateQuote(env, body.quoteId);

  if (!quote) {
    return new Response(
      JSON.stringify({ success: false, error: 'Quote not found or expired' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get current nonce for user
    const nonce = await getNonce(env, body.userAddress);

    // Build intent message (returns EIP-712 typed data for signing)
    const { intent, typedData } = buildIntentMessage(env, {
      user: body.userAddress,
      tokenIn: quote.tokenIn,
      tokenOut: quote.tokenOut,
      amountIn: BigInt(quote.amountIn),
      maxSlippageBps: quote.slippage,
      strategyId: (env.STRATEGY_ID ||
        '0x0000000000000000000000000000000000000000000000000000000000000001') as Hex,
      nonce,
      ttlSeconds: 3600,
    });

    // Store the intent data keyed by quoteId for retrieval during execute
    // This ensures the same deadline is used when verifying the signature
    const intentData = {
      user: intent.user,
      tokenIn: intent.tokenIn,
      tokenOut: intent.tokenOut,
      amountIn: intent.amountIn.toString(),
      maxSlippage: intent.maxSlippageBps.toString(),
      deadline: intent.deadline.toString(),
      strategyId: intent.strategyId,
      nonce: intent.nonce.toString(),
    };

    await env.TREASURY_KV.put(`intent:${body.quoteId}`, JSON.stringify(intentData), {
      expirationTtl: 300, // 5 minutes - same as quote
    });

    // Return the EIP-712 typed data for client-side signing
    return new Response(
      JSON.stringify({
        success: true,
        quoteId: body.quoteId,
        intent: intentData,
        typedData: {
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: {
            ...typedData.message,
            amountIn: typedData.message.amountIn.toString(),
            maxSlippage: typedData.message.maxSlippage.toString(),
            deadline: typedData.message.deadline.toString(),
            nonce: typedData.message.nonce.toString(),
          },
        },
        pricing: quote.pricing,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Prepare execute error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to prepare execute data', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

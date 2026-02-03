import type { Address } from 'viem';
import type { X402PaymentPayload, X402PaymentRequirement, X402SettleResponse } from './types';
import { FACILITATOR_URL, NETWORK, PAYMENT_TOKEN, PAYMENT_TIMEOUT_SECONDS } from './config';

/**
 * x402 Payment Middleware for Cloudflare Workers
 *
 * Validates x402 payments by:
 * 1. Checking for PAYMENT-SIGNATURE header
 * 2. Verifying payment with facilitator
 * 3. Returning 402 if payment required
 */

export interface PaymentValidationResult {
  valid: boolean;
  payer?: Address;
  txHash?: string;
  error?: string;
}

/**
 * Build x402 payment requirement for 402 response
 */
export function buildPaymentRequirement(
  feeAmount: string,
  payTo: Address,
  resource: string,
  description: string
): X402PaymentRequirement {
  return {
    scheme: 'exact',
    network: NETWORK,
    maxAmountRequired: feeAmount,
    resource,
    description,
    mimeType: 'application/json',
    payTo,
    maxTimeoutSeconds: PAYMENT_TIMEOUT_SECONDS,
    asset: 'USDC',
  };
}

/**
 * Create 402 Payment Required response
 */
export function create402Response(
  requirement: X402PaymentRequirement,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Payment Required',
      paymentRequirements: requirement,
    }),
    {
      status: 402,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Payment-Requirements': JSON.stringify(requirement),
      },
    }
  );
}

/**
 * Extract payment payload from request headers
 */
export function extractPaymentPayload(request: Request): X402PaymentPayload | null {
  // Try new header format first, then legacy
  const paymentHeader =
    request.headers.get('PAYMENT-SIGNATURE') || request.headers.get('X-PAYMENT');

  if (!paymentHeader) {
    return null;
  }

  try {
    return JSON.parse(paymentHeader) as X402PaymentPayload;
  } catch {
    console.error('Failed to parse payment header');
    return null;
  }
}

/**
 * Verify payment with x402 facilitator
 */
export async function verifyPayment(
  payload: X402PaymentPayload,
  requirement: X402PaymentRequirement
): Promise<X402SettleResponse> {
  try {
    const response = await fetch(`${FACILITATOR_URL}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentPayload: payload,
        paymentRequirements: requirement,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Facilitator error:', errorText);
      return { success: false, error: `Facilitator error: ${response.status}` };
    }

    return (await response.json()) as X402SettleResponse;
  } catch (error) {
    console.error('Payment verification failed:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Validate x402 payment from request
 *
 * @returns PaymentValidationResult with validity status
 */
export async function validateX402Payment(
  request: Request,
  feeAmount: string,
  payTo: Address,
  resource: string
): Promise<PaymentValidationResult> {
  const payload = extractPaymentPayload(request);

  if (!payload) {
    return { valid: false, error: 'No payment header provided' };
  }

  // Validate payload structure
  if (payload.scheme !== 'exact' || !payload.payload?.signature) {
    return { valid: false, error: 'Invalid payment payload structure' };
  }

  // Build requirement for verification
  const requirement = buildPaymentRequirement(
    feeAmount,
    payTo,
    resource,
    'Strategy execution fee'
  );

  // Verify with facilitator
  const result = await verifyPayment(payload, requirement);

  if (!result.success) {
    return { valid: false, error: result.error || 'Payment verification failed' };
  }

  return {
    valid: true,
    payer: result.payer,
    txHash: result.transaction,
  };
}

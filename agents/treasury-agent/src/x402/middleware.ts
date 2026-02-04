import type { Address } from 'viem';
import type { X402PaymentPayload, X402PaymentRequirement, X402SettleResponse } from './types';
import { FACILITATOR_URL, NETWORK, PAYMENT_TOKEN, PAYMENT_TIMEOUT_SECONDS, PAYMENT_TOKEN_NAME, PAYMENT_TOKEN_VERSION } from './config';

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
 * Build x402 payment requirement for 402 response and facilitator verification
 * Includes EIP-712 domain parameters for permit-enabled tokens (OIK-51/OIK-52)
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
    asset: PAYMENT_TOKEN,
    // EIP-712 domain params required by facilitator for permit verification
    extra: {
      name: PAYMENT_TOKEN_NAME,
      version: PAYMENT_TOKEN_VERSION,
    },
  };
}

/**
 * Create 402 Payment Required response
 * Compatible with @x402/fetch SDK which expects either:
 * 1. PAYMENT-REQUIRED header with base64 encoded JSON
 * 2. Body with x402Version: 1 and accepts array
 *
 * OIK-51: Includes EIP-712 domain parameters (name, version) for permit tokens
 * The x402 SDK expects these inside the `extra` object
 */
export function create402Response(
  requirement: X402PaymentRequirement,
  corsHeaders: Record<string, string>
): Response {
  // Build x402 SDK compatible response body
  // OIK-52: Include EIP-712 domain params (name, version) in extra field for permit support
  const x402Body = {
    x402Version: 1,
    accepts: [
      {
        scheme: requirement.scheme,
        network: requirement.network,
        maxAmountRequired: requirement.maxAmountRequired,
        resource: requirement.resource,
        description: requirement.description,
        mimeType: requirement.mimeType,
        payTo: requirement.payTo,
        maxTimeoutSeconds: requirement.maxTimeoutSeconds,
        asset: requirement.asset, // Token address for x402 SDK
        // EIP-712 domain parameters for permit (OIK-51/OIK-52)
        extra: requirement.extra,
      },
    ],
    error: 'Payment Required',
  };

  // Encode for PAYMENT-REQUIRED header (base64 JSON)
  // Use TextEncoder for UTF-8 support in Workers
  const jsonString = JSON.stringify(x402Body);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(jsonString);
  const paymentRequiredHeader = btoa(String.fromCharCode(...bytes));

  return new Response(JSON.stringify(x402Body), {
    status: 402,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'PAYMENT-REQUIRED': paymentRequiredHeader,
      // Legacy header for backwards compatibility
      'X-Payment-Requirements': JSON.stringify(requirement),
    },
  });
}

/**
 * Extract payment payload from request headers
 * x402 SDK sends PAYMENT-SIGNATURE as Base64-encoded JSON
 */
export function extractPaymentPayload(request: Request): X402PaymentPayload | null {
  // Try new header format first, then legacy
  const paymentHeader =
    request.headers.get('PAYMENT-SIGNATURE') || request.headers.get('X-PAYMENT');

  if (!paymentHeader) {
    return null;
  }

  try {
    // First try Base64 decode (new SDK format)
    const decoded = atob(paymentHeader);
    return JSON.parse(decoded) as X402PaymentPayload;
  } catch {
    // Fallback to raw JSON (legacy format)
    try {
      return JSON.parse(paymentHeader) as X402PaymentPayload;
    } catch {
      console.error('[x402] Failed to parse payment header');
      return null;
    }
  }
}

/**
 * Verify payment with x402 facilitator
 */
export async function verifyPayment(
  payload: X402PaymentPayload,
  requirement: X402PaymentRequirement
): Promise<X402SettleResponse> {
  console.log('[x402] Verifying with facilitator:', FACILITATOR_URL);
  console.log('[x402] Payment payload:', JSON.stringify(payload));
  console.log('[x402] Requirement:', JSON.stringify(requirement));

  try {
    const response = await fetch(`${FACILITATOR_URL}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentPayload: payload,
        paymentRequirements: requirement,
      }),
    });

    console.log('[x402] Facilitator response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[x402] Facilitator error:', errorText);
      return { success: false, error: `Facilitator error: ${response.status}` };
    }

    const result = (await response.json()) as X402SettleResponse;
    console.log('[x402] Facilitator result:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('[x402] Payment verification failed:', error);
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
  console.log('[x402] Validating payment...');

  // OIK-52 Debug: Log all headers to see what we're receiving
  const headersObj = Object.fromEntries(request.headers.entries());
  console.log('[x402] All headers:', JSON.stringify(headersObj));

  // Check specific payment headers
  const paymentSig = request.headers.get('PAYMENT-SIGNATURE');
  const xPayment = request.headers.get('X-PAYMENT');
  console.log('[x402] PAYMENT-SIGNATURE header:', paymentSig ? 'present' : 'missing');
  console.log('[x402] X-PAYMENT header:', xPayment ? 'present' : 'missing');

  const payload = extractPaymentPayload(request);
  console.log('[x402] Extracted payload:', payload ? 'found' : 'null');

  if (!payload) {
    return { valid: false, error: 'No payment header provided' };
  }

  // Validate payload structure - x402 SDK sends {scheme, network, payload: {signature, ...}}
  if (!payload.scheme || !payload.payload) {
    console.log('[x402] Invalid payload structure - missing scheme or payload');
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

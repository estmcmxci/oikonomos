import type { Address } from 'viem';

/**
 * x402 Payment Protocol Types
 * @see https://docs.cdp.coinbase.com/x402
 */

export interface X402PaymentRequirement {
  scheme: 'exact';
  network: string; // CAIP-2 format, e.g., "eip155:11155111" (Sepolia)
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: Address;
  maxTimeoutSeconds: number;
  asset: string; // Token address, e.g., "0x944a6D90b3111884CcCbfcc45B381b7C864D7943"
  // EIP-712 domain parameters for permit tokens (OIK-51)
  // x402 SDK expects name/version inside `extra` object
  extra?: {
    name: string; // Token name for EIP-712 domain, e.g., "Mock USDC"
    version: string; // EIP-712 domain version, typically "1"
    [key: string]: unknown;
  };
}

export interface X402PaymentPayload {
  x402Version: number;
  scheme: 'exact';
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: Address;
      to: Address;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

export interface X402SettleRequest {
  paymentPayload: X402PaymentPayload;
  paymentRequirements: X402PaymentRequirement;
}

export interface X402SettleResponse {
  success: boolean;
  transaction?: string;
  network?: string;
  payer?: Address;
  error?: string;
}

export interface X402PricingInfo {
  feeType: 'percentage' | 'fixed';
  feeValue: string; // e.g., "0.1%" or "1000000" (1 USDC in 6 decimals)
  feeAmount: string; // Calculated fee amount in token units
  paymentToken: Address;
  paymentAddress: Address;
  network: string; // CAIP-2 format
}

export interface ExecuteRequest {
  quoteId: string;
  userAddress: Address;
  signature?: string; // EIP-712 intent signature
}

export interface ExecuteResponse {
  success: boolean;
  txHash?: string;
  receipt?: {
    strategyId: string;
    quoteId: string;
    amountIn: string;
    amountOut: string;
  };
  error?: string;
}

export interface FeeEarning {
  quoteId: string;
  userAddress: Address;
  feeAmount: string;
  paymentToken: Address;
  txHash: string;
  timestamp: number;
}

import type { Address } from 'viem';

/**
 * x402 Configuration for Treasury Agent
 */

// Sepolia USDC (Aave testnet)
export const PAYMENT_TOKEN: Address = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8';

// Network in CAIP-2 format
export const NETWORK = 'eip155:11155111'; // Sepolia

// x402 Facilitator URL (use x402.org public facilitator for testnet)
export const FACILITATOR_URL = 'https://x402.org/facilitator';

// Default fee percentage (0.1% = 10 bps)
export const DEFAULT_FEE_BPS = 10;

// Payment timeout (5 minutes)
export const PAYMENT_TIMEOUT_SECONDS = 300;

/**
 * Get the agent's payment address from environment or default
 */
export function getPaymentAddress(env: { AGENT_WALLET?: string }): Address {
  // Use configured agent wallet or derive from PRIVATE_KEY
  return (env.AGENT_WALLET || '0x0000000000000000000000000000000000000000') as Address;
}

/**
 * Calculate fee amount from trade value
 */
export function calculateFee(amountIn: bigint, feeBps: number = DEFAULT_FEE_BPS): bigint {
  return (amountIn * BigInt(feeBps)) / BigInt(10000);
}

import type { Address } from 'viem';

/**
 * x402 Configuration for Treasury Agent
 * OIK-50: Updated for Base Sepolia (x402 native support)
 */

// Official Base Sepolia USDC with EIP-2612 permit support (OIK-52)
export const PAYMENT_TOKEN: Address = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// EIP-712 domain params for official USDC (required by x402 SDK)
export const PAYMENT_TOKEN_NAME = 'USDC';
export const PAYMENT_TOKEN_VERSION = '2';

// Network identifier - use human-readable format for x402 SDK compatibility
// The x402 SDK uses 'base-sepolia' internally, not CAIP-2 'eip155:84532'
export const NETWORK = 'base-sepolia'; // Base Sepolia

// Legacy Sepolia (for reference)
// export const PAYMENT_TOKEN: Address = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8';
// export const NETWORK = 'eip155:11155111'; // Sepolia

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

import { type Chain } from 'viem';
import { sepolia, baseSepolia } from 'viem/chains';
import type { Env } from '../index';

/**
 * Get the appropriate chain based on CHAIN_ID environment variable
 *
 * OIK-52: Centralized chain selection to support both Ethereum Sepolia
 * and Base Sepolia deployments.
 */
export function getChain(env: Env): Chain {
  const chainId = parseInt(env.CHAIN_ID);
  switch (chainId) {
    case 84532:
      return baseSepolia;
    case 11155111:
    default:
      return sepolia;
  }
}

/**
 * Chain IDs for supported networks
 */
export const CHAIN_IDS = {
  SEPOLIA: 11155111,
  BASE_SEPOLIA: 84532,
} as const;

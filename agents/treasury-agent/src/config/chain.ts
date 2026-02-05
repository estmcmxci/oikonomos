import { type Chain } from 'viem';
import { sepolia, baseSepolia, base } from 'viem/chains';
import type { Env } from '../index';

/**
 * Get the appropriate chain based on CHAIN_ID environment variable
 *
 * OIK-52: Centralized chain selection to support Ethereum Sepolia,
 * Base Sepolia, and Base Mainnet deployments.
 */
export function getChain(env: Env): Chain {
  const chainId = parseInt(env.CHAIN_ID);
  switch (chainId) {
    case 8453:
      return base;
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
  BASE_MAINNET: 8453,
} as const;

/**
 * Check if chain is a Base chain (mainnet or sepolia)
 */
export function isBaseChain(chainId: number): boolean {
  return chainId === CHAIN_IDS.BASE_MAINNET || chainId === CHAIN_IDS.BASE_SEPOLIA;
}

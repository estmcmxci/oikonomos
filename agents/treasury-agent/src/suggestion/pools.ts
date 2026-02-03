// OIK-33: Pool Availability Lookup
// OIK-39: Consolidated to use canonical pool config
// Checks which Uniswap V4 pools are available for user's token pairs

import type { Address } from 'viem';
import { SUPPORTED_POOLS, TOKENS, type PoolConfig } from '../config/pools';

export interface PoolMatch {
  pair: string;
  poolId: string;
  currency0: Address;
  currency1: Address;
  fee: number;
  feeFormatted: string;
  tickSpacing: number;
  hooks: Address;
  hasLiquidity: boolean;
}

// Build KNOWN_POOLS from canonical config (OIK-39)
const KNOWN_POOLS: Array<{
  id: string;
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}> = Object.entries(SUPPORTED_POOLS).map(([key, pool]) => ({
  id: key,
  currency0: pool.currency0,
  currency1: pool.currency1,
  fee: pool.fee,
  tickSpacing: pool.tickSpacing,
  hooks: pool.hooks,
}));

// Token symbol mapping for display
const TOKEN_SYMBOLS: Record<string, string> = {
  '0x0000000000000000000000000000000000000000': 'ETH',
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': 'USDC',
  [TOKENS.USDC.toLowerCase()]: 'USDC',
  [TOKENS.DAI.toLowerCase()]: 'DAI',
  '0x7b79995e5f793a07bc00c21412e50ecae098e7f9': 'WETH',
  [TOKENS.WETH.toLowerCase()]: 'WETH',
};

function getTokenSymbol(address: Address): string {
  return TOKEN_SYMBOLS[address.toLowerCase()] || address.slice(0, 10);
}

function formatFee(fee: number): string {
  return `${(fee / 10000).toFixed(2)}%`;
}

export function findCompatiblePools(
  tokenAddresses: Address[]
): PoolMatch[] {
  const matches: PoolMatch[] = [];
  const normalizedAddresses = tokenAddresses.map(a => a.toLowerCase());

  for (const pool of KNOWN_POOLS) {
    const currency0Lower = pool.currency0.toLowerCase();
    const currency1Lower = pool.currency1.toLowerCase();

    // Check if both currencies are in user's tokens
    const hasCurrency0 = normalizedAddresses.includes(currency0Lower);
    const hasCurrency1 = normalizedAddresses.includes(currency1Lower);

    if (hasCurrency0 && hasCurrency1) {
      const symbol0 = getTokenSymbol(pool.currency0);
      const symbol1 = getTokenSymbol(pool.currency1);

      matches.push({
        pair: `${symbol0}/${symbol1}`,
        poolId: pool.id,
        currency0: pool.currency0,
        currency1: pool.currency1,
        fee: pool.fee,
        feeFormatted: formatFee(pool.fee),
        tickSpacing: pool.tickSpacing,
        hooks: pool.hooks,
        hasLiquidity: true, // Assume liquidity for known pools
      });
    }
  }

  return matches;
}

export function hasReceiptHookPool(pools: PoolMatch[]): boolean {
  const receiptHook = '0x41a75f07bA1958EcA78805D8419C87a393764040'.toLowerCase();
  return pools.some(p => p.hooks.toLowerCase() === receiptHook);
}

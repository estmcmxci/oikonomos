// OIK-33: Pool Availability Lookup
// Checks which Uniswap V4 pools are available for user's token pairs

import type { Address } from 'viem';

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

// Known pools on Sepolia with our tokens
// Extracted from pools_raw.json - focusing on USDC, DAI, WETH pairs
const KNOWN_POOLS: Array<{
  id: string;
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}> = [
  // USDC (Aave) / DAI (Aave) - Our test pool
  {
    id: '0x...',
    currency0: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    currency1: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
    fee: 500,
    tickSpacing: 10,
    hooks: '0x41a75f07bA1958EcA78805D8419C87a393764040', // ReceiptHook
  },
  // ETH / USDC (Circle) pairs
  {
    id: '0x...',
    currency0: '0x0000000000000000000000000000000000000000',
    currency1: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    fee: 3000,
    tickSpacing: 60,
    hooks: '0x0000000000000000000000000000000000000000',
  },
  // ETH / WETH (Sepolia) pairs
  {
    id: '0x...',
    currency0: '0x0000000000000000000000000000000000000000',
    currency1: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    fee: 500,
    tickSpacing: 10,
    hooks: '0x0000000000000000000000000000000000000000',
  },
];

// Token symbol mapping for display
const TOKEN_SYMBOLS: Record<string, string> = {
  '0x0000000000000000000000000000000000000000': 'ETH',
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': 'USDC',
  '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8': 'USDC',
  '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357': 'DAI',
  '0x7b79995e5f793a07bc00c21412e50ecae098e7f9': 'WETH',
  '0xc558dbdd856501fcd9aaf1e62eae57a9f0629a3c': 'WETH',
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

/**
 * Check specific pools on Sepolia and their pricing
 */
import { createPublicClient, http, type Address, type Hex, keccak256, encodeAbiParameters } from 'viem';
import { sepolia } from 'viem/chains';

const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/MIpa-idKGvSRwUYBT9gAr';
const POOL_MANAGER = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543' as Address;

const client = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

// Known tokens
const TOKENS = {
  'USDC (Aave)': '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
  'DAI (Aave)': '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
  'WETH (Aave)': '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c',
  'USDC (Circle)': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  'WETH': '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
  'LINK': '0x779877A7B0D9E8603169DdbD7836e478b4624789',
};

const HOOKS = {
  'None': '0x0000000000000000000000000000000000000000',
  'ReceiptHook': '0x15d3b7CbC9463f92a88cE7B1B384277DA741C040',
};

// PoolManager ABI for getSlot0
const PoolManagerABI = [
  {
    type: 'function',
    name: 'getSlot0',
    inputs: [{ name: 'id', type: 'bytes32' }],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'protocolFee', type: 'uint24' },
      { name: 'lpFee', type: 'uint24' },
    ],
    stateMutability: 'view',
  },
] as const;

function computePoolId(
  currency0: Address,
  currency1: Address,
  fee: number,
  tickSpacing: number,
  hooks: Address
): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: 'address' },
        { type: 'address' },
        { type: 'uint24' },
        { type: 'int24' },
        { type: 'address' },
      ],
      [currency0, currency1, fee, tickSpacing, hooks]
    )
  );
}

function sqrtPriceToPrice(sqrtPriceX96: bigint, decimals0: number, decimals1: number): number {
  const price = Number(sqrtPriceX96) / Number(2n ** 96n);
  const priceSquared = price * price;
  // Adjust for decimals: price = token1/token0, so adjust by 10^(decimals0 - decimals1)
  return priceSquared * Math.pow(10, decimals0 - decimals1);
}

interface PoolCheck {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  hook: string;
  exists: boolean;
  sqrtPriceX96?: string;
  tick?: number;
  price?: string;
  priceLabel?: string;
}

async function checkPool(
  token0Name: string,
  token1Name: string,
  fee: number,
  tickSpacing: number,
  hookName: string,
  decimals0: number,
  decimals1: number
): Promise<PoolCheck> {
  const token0 = TOKENS[token0Name as keyof typeof TOKENS] as Address;
  const token1 = TOKENS[token1Name as keyof typeof TOKENS] as Address;
  const hooks = HOOKS[hookName as keyof typeof HOOKS] as Address;

  // Ensure correct ordering
  const [c0, c1, d0, d1] = token0.toLowerCase() < token1.toLowerCase()
    ? [token0, token1, decimals0, decimals1]
    : [token1, token0, decimals1, decimals0];

  const poolId = computePoolId(c0, c1, fee, tickSpacing, hooks);

  try {
    const result = await client.readContract({
      address: POOL_MANAGER,
      abi: PoolManagerABI,
      functionName: 'getSlot0',
      args: [poolId],
    });

    const [sqrtPriceX96, tick] = result;

    if (sqrtPriceX96 === 0n) {
      return { token0: token0Name, token1: token1Name, fee, tickSpacing, hook: hookName, exists: false };
    }

    const price = sqrtPriceToPrice(sqrtPriceX96, d0, d1);
    let priceLabel = price.toFixed(6);
    if (price > 1000000) priceLabel = '>1M (broken)';
    if (price < 0.000001) priceLabel = '<0.000001 (broken)';

    return {
      token0: token0Name,
      token1: token1Name,
      fee,
      tickSpacing,
      hook: hookName,
      exists: true,
      sqrtPriceX96: sqrtPriceX96.toString(),
      tick,
      price: price.toString(),
      priceLabel,
    };
  } catch (e) {
    return { token0: token0Name, token1: token1Name, fee, tickSpacing, hook: hookName, exists: false };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('UNISWAP V4 POOLS ON SEPOLIA');
  console.log('='.repeat(80));
  console.log('PoolManager:', POOL_MANAGER);
  console.log('');

  const poolsToCheck = [
    // Stablecoin pairs (what we care about)
    { t0: 'USDC (Aave)', t1: 'DAI (Aave)', fee: 100, tick: 1, d0: 6, d1: 18, hook: 'None' },
    { t0: 'USDC (Aave)', t1: 'DAI (Aave)', fee: 500, tick: 10, d0: 6, d1: 18, hook: 'None' },
    { t0: 'USDC (Aave)', t1: 'DAI (Aave)', fee: 3000, tick: 60, d0: 6, d1: 18, hook: 'None' },
    { t0: 'USDC (Aave)', t1: 'DAI (Aave)', fee: 10000, tick: 200, d0: 6, d1: 18, hook: 'None' },
    { t0: 'USDC (Aave)', t1: 'DAI (Aave)', fee: 3000, tick: 60, d0: 6, d1: 18, hook: 'ReceiptHook' },

    // USDC/WETH pairs
    { t0: 'USDC (Aave)', t1: 'WETH (Aave)', fee: 500, tick: 10, d0: 6, d1: 18, hook: 'None' },
    { t0: 'USDC (Aave)', t1: 'WETH (Aave)', fee: 3000, tick: 60, d0: 6, d1: 18, hook: 'None' },
    { t0: 'USDC (Aave)', t1: 'WETH (Aave)', fee: 10000, tick: 200, d0: 6, d1: 18, hook: 'None' },
    { t0: 'USDC (Aave)', t1: 'WETH', fee: 3000, tick: 60, d0: 6, d1: 18, hook: 'None' },
    { t0: 'USDC (Circle)', t1: 'WETH', fee: 500, tick: 10, d0: 6, d1: 18, hook: 'None' },
    { t0: 'USDC (Circle)', t1: 'WETH', fee: 3000, tick: 60, d0: 6, d1: 18, hook: 'None' },

    // DAI/WETH pairs
    { t0: 'DAI (Aave)', t1: 'WETH (Aave)', fee: 500, tick: 10, d0: 18, d1: 18, hook: 'None' },
    { t0: 'DAI (Aave)', t1: 'WETH (Aave)', fee: 3000, tick: 60, d0: 18, d1: 18, hook: 'None' },
    { t0: 'DAI (Aave)', t1: 'WETH', fee: 3000, tick: 60, d0: 18, d1: 18, hook: 'None' },

    // LINK pairs
    { t0: 'USDC (Circle)', t1: 'LINK', fee: 100, tick: 1, d0: 6, d1: 18, hook: 'None' },
    { t0: 'USDC (Circle)', t1: 'LINK', fee: 3000, tick: 60, d0: 6, d1: 18, hook: 'None' },
    { t0: 'WETH (Aave)', t1: 'LINK', fee: 3000, tick: 60, d0: 18, d1: 18, hook: 'None' },
    { t0: 'WETH', t1: 'LINK', fee: 3000, tick: 60, d0: 18, d1: 18, hook: 'None' },
  ];

  const results: PoolCheck[] = [];

  for (const p of poolsToCheck) {
    const result = await checkPool(p.t0, p.t1, p.fee, p.tick, p.hook, p.d0, p.d1);
    results.push(result);
  }

  // Print results
  console.log('### EXISTING POOLS ###\n');
  const existing = results.filter(r => r.exists);
  if (existing.length === 0) {
    console.log('No pools found!\n');
  } else {
    for (const p of existing) {
      const feeStr = (p.fee / 10000).toFixed(2) + '%';
      console.log(`${p.token0} / ${p.token1}`);
      console.log(`  Fee: ${feeStr} | TickSpacing: ${p.tickSpacing} | Hook: ${p.hook}`);
      console.log(`  Price: ${p.priceLabel} | Tick: ${p.tick}`);
      console.log('');
    }
  }

  console.log('### POOLS NOT FOUND ###\n');
  const notFound = results.filter(r => !r.exists);
  for (const p of notFound) {
    console.log(`  ${p.token0}/${p.token1} fee:${p.fee} hook:${p.hook}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Pools found: ${existing.length}`);
  console.log(`Pools not found: ${notFound.length}`);

  const stablePools = existing.filter(p =>
    (p.token0.includes('USDC') || p.token0.includes('DAI')) &&
    (p.token1.includes('USDC') || p.token1.includes('DAI'))
  );
  console.log(`\nStablecoin pools (USDC/DAI): ${stablePools.length}`);
  for (const p of stablePools) {
    console.log(`  Fee: ${p.fee} | Price: ${p.priceLabel} | Hook: ${p.hook}`);
  }
}

main().catch(console.error);

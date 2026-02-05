/**
 * List ALL Uniswap v4 pools on Sepolia
 */
import { decodeAbiParameters, formatUnits, type Address, type Hex } from 'viem';

const POOL_MANAGER = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543';
const ETHERSCAN_API = 'https://api-sepolia.etherscan.io/api';

// Known token addresses for labeling
const TOKEN_LABELS: Record<string, string> = {
  '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8': 'USDC (Aave)',
  '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357': 'DAI (Aave)',
  '0xc558dbdd856501fcd9aaf1e62eae57a9f0629a3c': 'WETH (Aave)',
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': 'USDC (Circle)',
  '0x7b79995e5f793a07bc00c21412e50ecae098e7f9': 'WETH',
  '0x779877a7b0d9e8603169ddbd7836e478b4624789': 'LINK',
  '0x0000000000000000000000000000000000000000': 'ETH',
  '0x15d3b7cbc9463f92a88ce7b1b384277da741c040': 'ReceiptHook',
};

function getTokenLabel(address: string): string {
  const lower = address.toLowerCase();
  return TOKEN_LABELS[lower] || address.slice(0, 10) + '...';
}

function getHookLabel(address: string): string {
  if (address === '0x0000000000000000000000000000000000000000') return 'None';
  const lower = address.toLowerCase();
  return TOKEN_LABELS[lower] || address.slice(0, 10) + '...';
}

// sqrtPriceX96 for 1:1 price (adjusted for decimals)
const SQRT_PRICE_1_1 = 79228162514264337593543950336n; // 2^96

function estimatePrice(sqrtPriceX96: bigint): string {
  // Price = (sqrtPriceX96 / 2^96)^2
  const price = Number(sqrtPriceX96) / Number(2n ** 96n);
  const priceSquared = price * price;
  if (priceSquared > 1000000) return '>1M';
  if (priceSquared < 0.000001) return '<0.000001';
  return priceSquared.toFixed(6);
}

interface PoolInfo {
  id: string;
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
  sqrtPriceX96: bigint;
  tick: number;
  price: string;
  blockNumber: number;
}

async function main() {
  console.log('Fetching all Initialize events from PoolManager...\n');

  // Fetch from Etherscan API
  const response = await fetch(
    `${ETHERSCAN_API}?module=logs&action=getLogs&address=${POOL_MANAGER}&topic0=0xdd466e674ea557f56295e2d0218a125ea4b4f9f9f338ec7b0ca91a4234c7b819&fromBlock=0&toBlock=latest&apikey=YourApiKeyToken`
  );
  const data = await response.json() as { result: Array<{ topics: string[]; data: string; blockNumber: string }> };

  if (!data.result || !Array.isArray(data.result)) {
    console.error('Failed to fetch events');
    return;
  }

  console.log(`Found ${data.result.length} pools\n`);
  console.log('='.repeat(100));

  const pools: PoolInfo[] = [];

  for (const log of data.result) {
    // Topics: [event sig, poolId, currency0, currency1]
    const poolId = log.topics[1];
    const currency0 = '0x' + log.topics[2].slice(26);
    const currency1 = '0x' + log.topics[3].slice(26);

    // Data: fee (uint24), tickSpacing (int24), hooks (address), sqrtPriceX96 (uint160), tick (int24)
    // Decode the data field
    const decoded = decodeAbiParameters(
      [
        { name: 'fee', type: 'uint24' },
        { name: 'tickSpacing', type: 'int24' },
        { name: 'hooks', type: 'address' },
        { name: 'sqrtPriceX96', type: 'uint160' },
        { name: 'tick', type: 'int24' },
      ],
      log.data as Hex
    );

    pools.push({
      id: poolId,
      currency0,
      currency1,
      fee: decoded[0],
      tickSpacing: decoded[1],
      hooks: decoded[2],
      sqrtPriceX96: decoded[3],
      tick: decoded[4],
      price: estimatePrice(decoded[3]),
      blockNumber: parseInt(log.blockNumber, 16),
    });
  }

  // Sort by block number (most recent first)
  pools.sort((a, b) => b.blockNumber - a.blockNumber);

  // Group by token pair
  const pairGroups: Record<string, PoolInfo[]> = {};
  for (const pool of pools) {
    const key = `${getTokenLabel(pool.currency0)}/${getTokenLabel(pool.currency1)}`;
    if (!pairGroups[key]) pairGroups[key] = [];
    pairGroups[key].push(pool);
  }

  // Print grouped results
  for (const [pair, pairPools] of Object.entries(pairGroups)) {
    console.log(`\n### ${pair}`);
    console.log('-'.repeat(80));
    for (const pool of pairPools) {
      const feePercent = (pool.fee / 10000).toFixed(2);
      console.log(`  Fee: ${feePercent}% | TickSpacing: ${pool.tickSpacing} | Hook: ${getHookLabel(pool.hooks)}`);
      console.log(`  Price: ${pool.price} | Tick: ${pool.tick} | Block: ${pool.blockNumber}`);
      console.log(`  currency0: ${pool.currency0}`);
      console.log(`  currency1: ${pool.currency1}`);
      console.log('');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(100));
  console.log('SUMMARY BY TOKEN PAIR');
  console.log('='.repeat(100));

  const sortedPairs = Object.entries(pairGroups).sort((a, b) => b[1].length - a[1].length);
  for (const [pair, pairPools] of sortedPairs) {
    const hooks = [...new Set(pairPools.map(p => getHookLabel(p.hooks)))];
    console.log(`${pair}: ${pairPools.length} pool(s) | Hooks: ${hooks.join(', ')}`);
  }

  // Find stablecoin pools
  console.log('\n' + '='.repeat(100));
  console.log('STABLECOIN POOLS (USDC/DAI)');
  console.log('='.repeat(100));

  const stablePools = pools.filter(p => {
    const c0 = p.currency0.toLowerCase();
    const c1 = p.currency1.toLowerCase();
    const stables = ['0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8', '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357'];
    return stables.includes(c0) && stables.includes(c1);
  });

  if (stablePools.length === 0) {
    console.log('No USDC/DAI pools found!');
  } else {
    for (const pool of stablePools) {
      console.log(`\nFee: ${(pool.fee / 10000).toFixed(2)}% | Hook: ${getHookLabel(pool.hooks)}`);
      console.log(`Price: ${pool.price} | Tick: ${pool.tick}`);
      console.log(`sqrtPriceX96: ${pool.sqrtPriceX96}`);
      console.log(`Expected 1:1 sqrtPriceX96: ~79228162514264337593543950336 (adjusting for decimals)`);
    }
  }
}

main().catch(console.error);

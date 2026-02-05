/**
 * Fetch ALL 111 pools from Sepolia PoolManager
 */
import { createPublicClient, http, decodeEventLog, type Address, type Hex } from 'viem';
import { sepolia } from 'viem/chains';

const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/MIpa-idKGvSRwUYBT9gAr';
const POOL_MANAGER = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543' as Address;

const client = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

// Initialize event ABI
const InitializeEventABI = {
  type: 'event',
  name: 'Initialize',
  inputs: [
    { indexed: true, name: 'id', type: 'bytes32' },
    { indexed: true, name: 'currency0', type: 'address' },
    { indexed: true, name: 'currency1', type: 'address' },
    { indexed: false, name: 'fee', type: 'uint24' },
    { indexed: false, name: 'tickSpacing', type: 'int24' },
    { indexed: false, name: 'hooks', type: 'address' },
    { indexed: false, name: 'sqrtPriceX96', type: 'uint160' },
    { indexed: false, name: 'tick', type: 'int24' },
  ],
} as const;

// Known tokens for labeling
const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8': { symbol: 'USDC', decimals: 6 },
  '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357': { symbol: 'DAI', decimals: 18 },
  '0xc558dbdd856501fcd9aaf1e62eae57a9f0629a3c': { symbol: 'WETH', decimals: 18 },
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': { symbol: 'USDC2', decimals: 6 },
  '0x7b79995e5f793a07bc00c21412e50ecae098e7f9': { symbol: 'WETH2', decimals: 18 },
  '0x779877a7b0d9e8603169ddbd7836e478b4624789': { symbol: 'LINK', decimals: 18 },
  '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
};

function getTokenInfo(address: string): { symbol: string; decimals: number } {
  const lower = address.toLowerCase();
  return KNOWN_TOKENS[lower] || { symbol: address.slice(0, 8), decimals: 18 };
}

function sqrtPriceToPrice(sqrtPriceX96: bigint): number {
  const price = Number(sqrtPriceX96) / Number(2n ** 96n);
  return price * price;
}

interface Pool {
  id: string;
  currency0: string;
  currency1: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
  sqrtPriceX96: bigint;
  tick: number;
  price: number;
  blockNumber: bigint;
}

async function main() {
  console.log('Fetching all Initialize events from PoolManager...');
  console.log('This may take a while due to API rate limits...\n');

  const currentBlock = await client.getBlockNumber();
  console.log(`Current block: ${currentBlock}`);

  const pools: Pool[] = [];
  const CHUNK_SIZE = 9n; // Alchemy free tier limit

  // Scan backwards from current block in chunks
  let toBlock = currentBlock;
  let totalEventsFound = 0;
  let emptyChunks = 0;

  while (emptyChunks < 1000 && toBlock > 0n) { // Stop after 1000 empty chunks
    const fromBlock = toBlock - CHUNK_SIZE > 0n ? toBlock - CHUNK_SIZE : 0n;

    try {
      const logs = await client.getLogs({
        address: POOL_MANAGER,
        event: InitializeEventABI,
        fromBlock,
        toBlock,
      });

      if (logs.length > 0) {
        totalEventsFound += logs.length;
        emptyChunks = 0;
        process.stdout.write(`\rFound ${totalEventsFound} pools (scanning block ${fromBlock})...`);

        for (const log of logs) {
          const { args } = log;
          if (args) {
            const token0Info = getTokenInfo(args.currency0);
            const token1Info = getTokenInfo(args.currency1);

            pools.push({
              id: args.id,
              currency0: args.currency0,
              currency1: args.currency1,
              token0: token0Info.symbol,
              token1: token1Info.symbol,
              fee: args.fee,
              tickSpacing: args.tickSpacing,
              hooks: args.hooks,
              sqrtPriceX96: args.sqrtPriceX96,
              tick: args.tick,
              price: sqrtPriceToPrice(args.sqrtPriceX96),
              blockNumber: log.blockNumber,
            });
          }
        }
      } else {
        emptyChunks++;
      }
    } catch (e: any) {
      if (e.message?.includes('rate limit')) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      emptyChunks++;
    }

    toBlock = fromBlock - 1n;

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n\nTotal pools found: ${pools.length}\n`);

  // Sort by block number (most recent first)
  pools.sort((a, b) => Number(b.blockNumber - a.blockNumber));

  // Print all pools
  console.log('='.repeat(100));
  console.log('ALL POOLS ON SEPOLIA');
  console.log('='.repeat(100));

  // Group by unique token pairs
  const pairMap = new Map<string, Pool[]>();
  for (const pool of pools) {
    const key = `${pool.token0}/${pool.token1}`;
    if (!pairMap.has(key)) pairMap.set(key, []);
    pairMap.get(key)!.push(pool);
  }

  // Sort pairs by number of pools
  const sortedPairs = [...pairMap.entries()].sort((a, b) => b[1].length - a[1].length);

  for (const [pair, pairPools] of sortedPairs) {
    console.log(`\n### ${pair} (${pairPools.length} pool${pairPools.length > 1 ? 's' : ''})`);
    console.log('-'.repeat(80));

    for (const p of pairPools) {
      const feePercent = (p.fee / 10000).toFixed(2);
      const hookLabel = p.hooks === '0x0000000000000000000000000000000000000000' ? 'None' : p.hooks.slice(0, 10) + '...';
      let priceStr = p.price.toFixed(6);
      if (p.price > 1e12) priceStr = 'MAX (broken)';
      if (p.price < 1e-12 && p.price > 0) priceStr = 'MIN (broken)';

      console.log(`  Fee: ${feePercent}% | Tick: ${p.tickSpacing} | Hook: ${hookLabel} | Price: ${priceStr}`);
      console.log(`    currency0: ${p.currency0}`);
      console.log(`    currency1: ${p.currency1}`);
    }
  }

  // Summary table
  console.log('\n\n' + '='.repeat(100));
  console.log('SUMMARY TABLE');
  console.log('='.repeat(100));
  console.log('\nPair                    | Pools | Fee Tiers           | Hooks');
  console.log('-'.repeat(80));

  for (const [pair, pairPools] of sortedPairs) {
    const fees = [...new Set(pairPools.map(p => (p.fee / 10000).toFixed(2) + '%'))].join(', ');
    const hooks = [...new Set(pairPools.map(p =>
      p.hooks === '0x0000000000000000000000000000000000000000' ? 'None' : 'Custom'
    ))].join(', ');
    console.log(`${pair.padEnd(23)} | ${String(pairPools.length).padEnd(5)} | ${fees.padEnd(19)} | ${hooks}`);
  }

  // List unique tokens
  console.log('\n\n' + '='.repeat(100));
  console.log('UNIQUE TOKENS');
  console.log('='.repeat(100));

  const allTokens = new Set<string>();
  for (const pool of pools) {
    allTokens.add(pool.currency0.toLowerCase());
    allTokens.add(pool.currency1.toLowerCase());
  }

  console.log(`\nTotal unique tokens: ${allTokens.size}\n`);
  for (const token of [...allTokens].sort()) {
    const info = getTokenInfo(token);
    console.log(`${info.symbol.padEnd(10)} ${token}`);
  }
}

main().catch(console.error);

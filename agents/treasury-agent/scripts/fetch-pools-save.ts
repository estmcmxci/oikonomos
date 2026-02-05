/**
 * Fetch ALL pools and SAVE incrementally to file
 */
import { createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { appendFileSync, writeFileSync } from 'fs';

const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/MIpa-idKGvSRwUYBT9gAr';
const POOL_MANAGER = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543' as Address;
const OUTPUT_FILE = '/Users/oakgroup/Desktop/webdev/ethglobal/oikonomos/agents/pools_raw.json';

const client = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

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

async function main() {
  console.log('Fetching all pools and saving to', OUTPUT_FILE);

  const currentBlock = await client.getBlockNumber();
  console.log(`Current block: ${currentBlock}`);

  // Initialize output file
  writeFileSync(OUTPUT_FILE, '[\n');

  let toBlock = currentBlock;
  let totalFound = 0;
  let emptyChunks = 0;
  let first = true;
  const CHUNK_SIZE = 9n;

  while (emptyChunks < 500 && toBlock > 0n) {
    const fromBlock = toBlock - CHUNK_SIZE > 0n ? toBlock - CHUNK_SIZE : 0n;

    try {
      const logs = await client.getLogs({
        address: POOL_MANAGER,
        event: InitializeEventABI,
        fromBlock,
        toBlock,
      });

      if (logs.length > 0) {
        emptyChunks = 0;
        for (const log of logs) {
          if (log.args) {
            totalFound++;
            const pool = {
              id: log.args.id,
              currency0: log.args.currency0,
              currency1: log.args.currency1,
              fee: log.args.fee,
              tickSpacing: log.args.tickSpacing,
              hooks: log.args.hooks,
              sqrtPriceX96: log.args.sqrtPriceX96.toString(),
              tick: log.args.tick,
              blockNumber: log.blockNumber.toString(),
            };

            // Append to file
            const prefix = first ? '' : ',\n';
            first = false;
            appendFileSync(OUTPUT_FILE, prefix + JSON.stringify(pool, null, 2));
          }
        }
        process.stdout.write(`\rFound ${totalFound} pools...`);
      } else {
        emptyChunks++;
      }
    } catch (e: any) {
      if (e.message?.includes('rate')) {
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      emptyChunks++;
    }

    toBlock = fromBlock - 1n;
    await new Promise(r => setTimeout(r, 30));
  }

  // Close JSON array
  appendFileSync(OUTPUT_FILE, '\n]');

  console.log(`\n\nDone! Total pools: ${totalFound}`);
  console.log(`Saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);

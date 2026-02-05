/**
 * Find Uniswap v4 pools on Sepolia with proper pricing
 */
import { createPublicClient, http, formatUnits, parseUnits, type Address, type Hex } from 'viem';
import { sepolia } from 'viem/chains';

const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/MIpa-idKGvSRwUYBT9gAr';
const POOL_MANAGER = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543' as Address;
const QUOTER = '0x61b3f2011a92d183c7dbadbda940a7555ccf9227' as Address;

// Known test tokens on Sepolia
const TOKENS: Record<string, { address: Address; decimals: number; name: string }> = {
  // Aave test tokens
  USDC_AAVE: { address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', decimals: 6, name: 'USDC (Aave)' },
  DAI_AAVE: { address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', decimals: 18, name: 'DAI (Aave)' },
  WETH_AAVE: { address: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c', decimals: 18, name: 'WETH (Aave)' },

  // Circle USDC
  USDC_CIRCLE: { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6, name: 'USDC (Circle)' },

  // Other common test tokens
  WETH: { address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', decimals: 18, name: 'WETH (Standard)' },
  LINK: { address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', decimals: 18, name: 'LINK' },
};

// Common fee tiers to check
const FEE_TIERS = [
  { fee: 100, tickSpacing: 1 },    // 0.01%
  { fee: 500, tickSpacing: 10 },   // 0.05%
  { fee: 3000, tickSpacing: 60 },  // 0.3%
  { fee: 10000, tickSpacing: 200 }, // 1%
];

// Common hooks (including no hook)
const HOOKS = [
  '0x0000000000000000000000000000000000000000' as Address, // No hook
  '0x15d3b7CbC9463f92a88cE7B1B384277DA741C040' as Address, // ReceiptHook
];

const client = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

// Quoter ABI for quoteExactInputSingle
const QuoterABI = [
  {
    type: 'function',
    name: 'quoteExactInputSingle',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'poolKey', type: 'tuple', components: [
            { name: 'currency0', type: 'address' },
            { name: 'currency1', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'tickSpacing', type: 'int24' },
            { name: 'hooks', type: 'address' },
          ]},
          { name: 'zeroForOne', type: 'bool' },
          { name: 'exactAmount', type: 'uint128' },
          { name: 'hookData', type: 'bytes' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'int128' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
] as const;

interface PoolResult {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  hook: string;
  amountIn: string;
  amountOut: string;
  rate: number;
  status: 'OK' | 'BAD_PRICE' | 'NO_POOL';
}

async function checkPool(
  token0Key: string,
  token1Key: string,
  fee: number,
  tickSpacing: number,
  hook: Address
): Promise<PoolResult | null> {
  const token0 = TOKENS[token0Key];
  const token1 = TOKENS[token1Key];

  // Ensure correct ordering (currency0 < currency1)
  const [currency0, currency1, zeroForOne] = token0.address.toLowerCase() < token1.address.toLowerCase()
    ? [token0, token1, true]
    : [token1, token0, false];

  const amountIn = parseUnits('100', zeroForOne ? currency0.decimals : currency1.decimals);

  try {
    // Use staticCall to simulate the quote
    const result = await client.simulateContract({
      address: QUOTER,
      abi: QuoterABI,
      functionName: 'quoteExactInputSingle',
      args: [{
        poolKey: {
          currency0: currency0.address,
          currency1: currency1.address,
          fee,
          tickSpacing,
          hooks: hook,
        },
        zeroForOne,
        exactAmount: amountIn,
        hookData: '0x' as Hex,
      }],
    });

    const amountOut = result.result[0];
    const outDecimals = zeroForOne ? currency1.decimals : currency0.decimals;
    const inDecimals = zeroForOne ? currency0.decimals : currency1.decimals;

    // Calculate rate (normalized to same decimals)
    const normalizedIn = Number(amountIn) / 10 ** inDecimals;
    const normalizedOut = Number(amountOut) / 10 ** outDecimals;
    const rate = normalizedOut / normalizedIn;

    // For stablecoins, rate should be close to 1
    const isStablePair = (token0Key.includes('USDC') || token0Key.includes('DAI')) &&
                         (token1Key.includes('USDC') || token1Key.includes('DAI'));

    let status: 'OK' | 'BAD_PRICE' | 'NO_POOL' = 'OK';
    if (isStablePair && (rate < 0.9 || rate > 1.1)) {
      status = 'BAD_PRICE';
    }

    return {
      token0: token0Key,
      token1: token1Key,
      fee,
      tickSpacing,
      hook: hook === '0x0000000000000000000000000000000000000000' ? 'None' : hook.slice(0, 10) + '...',
      amountIn: `${normalizedIn} ${zeroForOne ? currency0.name : currency1.name}`,
      amountOut: `${normalizedOut.toFixed(6)} ${zeroForOne ? currency1.name : currency0.name}`,
      rate,
      status,
    };
  } catch (error: any) {
    // Pool doesn't exist or error
    return null;
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('UNISWAP V4 POOL DISCOVERY - SEPOLIA');
  console.log('='.repeat(70));
  console.log('\nPoolManager:', POOL_MANAGER);
  console.log('Quoter:', QUOTER);
  console.log('\nSearching for pools...\n');

  const results: PoolResult[] = [];
  const tokenKeys = Object.keys(TOKENS);

  // Check all token pairs
  for (let i = 0; i < tokenKeys.length; i++) {
    for (let j = i + 1; j < tokenKeys.length; j++) {
      const token0Key = tokenKeys[i];
      const token1Key = tokenKeys[j];

      for (const { fee, tickSpacing } of FEE_TIERS) {
        for (const hook of HOOKS) {
          const result = await checkPool(token0Key, token1Key, fee, tickSpacing, hook);
          if (result) {
            results.push(result);
            const statusIcon = result.status === 'OK' ? '✅' : '⚠️';
            console.log(`${statusIcon} ${result.token0}/${result.token1} (fee: ${fee}, hook: ${result.hook})`);
            console.log(`   ${result.amountIn} → ${result.amountOut} (rate: ${result.rate.toFixed(6)})`);
          }
        }
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const okPools = results.filter(r => r.status === 'OK');
  const badPools = results.filter(r => r.status === 'BAD_PRICE');

  console.log(`\nTotal pools found: ${results.length}`);
  console.log(`Pools with OK pricing: ${okPools.length}`);
  console.log(`Pools with BAD pricing: ${badPools.length}`);

  if (okPools.length > 0) {
    console.log('\n--- POOLS WITH GOOD PRICING ---');
    okPools.forEach(p => {
      console.log(`\n${p.token0}/${p.token1}`);
      console.log(`  Fee: ${p.fee} (${p.fee / 10000}%)`);
      console.log(`  TickSpacing: ${p.tickSpacing}`);
      console.log(`  Hook: ${p.hook}`);
      console.log(`  Rate: ${p.rate.toFixed(6)}`);
      console.log(`  Token0: ${TOKENS[p.token0].address}`);
      console.log(`  Token1: ${TOKENS[p.token1].address}`);
    });
  }

  if (badPools.length > 0) {
    console.log('\n--- POOLS WITH BAD PRICING (avoid) ---');
    badPools.forEach(p => {
      console.log(`  ${p.token0}/${p.token1} fee:${p.fee} hook:${p.hook} rate:${p.rate.toFixed(6)}`);
    });
  }
}

main().catch(console.error);

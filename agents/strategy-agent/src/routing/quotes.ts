/**
 * OIK-22: Multi-Hop Quote Calculator
 *
 * Calculates expected output amounts for multi-hop routes
 * by calling the Uniswap v4 Quoter contract for each hop.
 */

import { createPublicClient, http, encodeFunctionData, decodeFunctionResult, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import type { Route, HopQuote, MultiHopQuote } from './types';

/**
 * Uniswap v4 Quoter address on Sepolia
 */
const QUOTER_ADDRESS: Address = '0x61b3f2011a92d183c7dbadbda940a7555ccf9227';

/**
 * Simplified Quoter ABI for quoteExactInputSingle
 */
const QUOTER_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'nonpayable',
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
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
          { name: 'hookData', type: 'bytes' },
        ],
      },
    ],
    outputs: [
      { name: 'deltaAmounts', type: 'int128[]' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
    ],
  },
] as const;

/**
 * Gas estimate per hop (approximate)
 */
const GAS_PER_HOP = 150000n;

/**
 * Get a quote for a single hop using the Quoter contract.
 */
async function quoteSingleHop(
  rpcUrl: string,
  tokenIn: Address,
  tokenOut: Address,
  fee: number,
  tickSpacing: number,
  hook: Address,
  amountIn: bigint
): Promise<{ amountOut: bigint; priceImpactBps: number }> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // Determine token order and swap direction
  const token0 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenIn : tokenOut;
  const token1 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenOut : tokenIn;
  const zeroForOne = tokenIn.toLowerCase() === token0.toLowerCase();

  // Build pool key
  const poolKey = {
    currency0: token0,
    currency1: token1,
    fee: fee,
    tickSpacing: tickSpacing,
    hooks: hook,
  };

  // sqrtPriceLimitX96: 0 means no limit
  const sqrtPriceLimitX96 = zeroForOne
    ? 4295128739n + 1n // MIN_SQRT_RATIO + 1
    : 1461446703485210103287273052203988822378723970342n - 1n; // MAX_SQRT_RATIO - 1

  try {
    // Call quoter (this is a static call, reverts with result)
    const result = await client.simulateContract({
      address: QUOTER_ADDRESS,
      abi: QUOTER_ABI,
      functionName: 'quoteExactInputSingle',
      args: [{
        poolKey,
        zeroForOne,
        exactAmount: amountIn,
        sqrtPriceLimitX96,
        hookData: '0x',
      }],
    });

    const deltaAmounts = result.result[0];

    // deltaAmounts[0] is token0 delta, deltaAmounts[1] is token1 delta
    // For zeroForOne=true: we send token0 (negative), receive token1 (positive)
    // For zeroForOne=false: we send token1 (negative), receive token0 (positive)
    const amountOutIndex = zeroForOne ? 1 : 0;
    const amountOut = deltaAmounts[amountOutIndex] < 0n
      ? -deltaAmounts[amountOutIndex]
      : deltaAmounts[amountOutIndex];

    // Calculate price impact (simplified)
    // Price impact = (amountIn - amountOut) / amountIn * 10000 (in bps)
    // This is a rough approximation; real price impact depends on pool liquidity
    const priceImpactBps = amountIn > 0n
      ? Number((amountIn - amountOut) * 10000n / amountIn)
      : 0;

    return {
      amountOut: amountOut < 0n ? -amountOut : amountOut,
      priceImpactBps: Math.max(0, priceImpactBps),
    };
  } catch (error) {
    console.error('Quoter call failed:', error);

    // Fallback: estimate based on fee
    const feeMultiplier = 10000n - BigInt(fee / 100);
    const estimatedAmountOut = (amountIn * feeMultiplier) / 10000n;

    return {
      amountOut: estimatedAmountOut,
      priceImpactBps: fee / 100, // Use fee as rough price impact estimate
    };
  }
}

/**
 * Get quotes for each hop in a multi-hop route.
 */
export async function quoteMultiHop(
  rpcUrl: string,
  route: Route,
  amountIn: bigint
): Promise<MultiHopQuote> {
  const hopQuotes: HopQuote[] = [];
  let currentAmountIn = amountIn;
  let totalSlippageBps = 0;
  let totalPriceImpactBps = 0;

  for (const hop of route.hops) {
    const { amountOut, priceImpactBps } = await quoteSingleHop(
      rpcUrl,
      hop.tokenIn,
      hop.tokenOut,
      hop.fee,
      hop.pool.tickSpacing,
      hop.pool.hook,
      currentAmountIn
    );

    // Slippage = fee + price impact
    const slippageBps = Math.round(hop.fee / 100) + priceImpactBps;

    hopQuotes.push({
      hop,
      amountIn: currentAmountIn,
      amountOut,
      slippageBps,
      priceImpactBps,
    });

    totalSlippageBps += slippageBps;
    totalPriceImpactBps += priceImpactBps;
    currentAmountIn = amountOut;
  }

  const finalAmountOut = hopQuotes.length > 0
    ? hopQuotes[hopQuotes.length - 1].amountOut
    : amountIn;

  return {
    route,
    amountIn,
    amountOut: finalAmountOut,
    hopQuotes,
    totalSlippageBps,
    totalPriceImpactBps,
    gasEstimate: GAS_PER_HOP * BigInt(route.hopCount),
  };
}

/**
 * Get the best quote among multiple routes.
 */
export async function getBestQuote(
  rpcUrl: string,
  routes: Route[],
  amountIn: bigint
): Promise<MultiHopQuote | null> {
  if (routes.length === 0) return null;

  const quotes = await Promise.all(
    routes.map(route => quoteMultiHop(rpcUrl, route, amountIn))
  );

  // Sort by amountOut (highest first)
  quotes.sort((a, b) => {
    if (b.amountOut > a.amountOut) return 1;
    if (b.amountOut < a.amountOut) return -1;
    return 0;
  });

  return quotes[0];
}

/**
 * Format quote for API response.
 */
export function formatQuoteResponse(quote: MultiHopQuote): {
  route: {
    path: string[];
    hops: number;
    pools: string[];
  };
  amountIn: string;
  amountOut: string;
  slippageByHop: number[];
  totalSlippageBps: number;
  priceImpactBps: number;
  gasEstimate: string;
} {
  return {
    route: {
      path: quote.route.path,
      hops: quote.route.hopCount,
      pools: quote.route.hops.map(h => h.pool.id),
    },
    amountIn: quote.amountIn.toString(),
    amountOut: quote.amountOut.toString(),
    slippageByHop: quote.hopQuotes.map(h => h.slippageBps),
    totalSlippageBps: quote.totalSlippageBps,
    priceImpactBps: quote.totalPriceImpactBps,
    gasEstimate: quote.gasEstimate.toString(),
  };
}

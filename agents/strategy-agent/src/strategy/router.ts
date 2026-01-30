import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import type { Env } from '../index';

interface RouteResult {
  expectedAmountOut: bigint;
  estimatedSlippageBps: number;
  steps: RouteStep[];
}

interface RouteStep {
  pool: string;
  tokenIn: string;
  tokenOut: string;
  fee: number;
}

export async function findOptimalRoute(
  env: Env,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint
): Promise<RouteResult> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  // For MVP: Direct swap route
  // In production: Multi-hop optimization, liquidity analysis, MEV protection

  try {
    // Check if tokens are the same
    if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
      throw new Error('Cannot swap token to itself');
    }

    // Determine the fee tier (simplified - in production would query pools)
    const feeTier = selectFeeTier(tokenIn, tokenOut);

    // Direct pool route
    const directRoute: RouteStep = {
      pool: `${tokenIn.slice(0, 10)}-${tokenOut.slice(0, 10)}-${feeTier}`,
      tokenIn,
      tokenOut,
      fee: feeTier,
    };

    // Estimate output using a simple model
    // In production: Call Quoter contract for accurate quote
    const estimatedSlippageBps = calculateEstimatedSlippage(amountIn, feeTier);
    const slippageFactor = 10000n - BigInt(estimatedSlippageBps);
    const expectedAmountOut = (amountIn * slippageFactor) / 10000n;

    return {
      expectedAmountOut,
      estimatedSlippageBps,
      steps: [directRoute],
    };
  } catch (error) {
    console.error('Route finding error:', error);
    throw new Error(`Failed to find route: ${String(error)}`);
  }
}

function selectFeeTier(tokenIn: string, tokenOut: string): number {
  // Simplified fee tier selection
  // Stablecoin pairs: 0.01% (100)
  // Standard pairs: 0.3% (3000)
  // Exotic pairs: 1% (10000)

  const stablecoins = [
    '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // USDC
    '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0', // USDT (example)
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI (example)
  ];

  const isStablePair =
    stablecoins.includes(tokenIn.toLowerCase()) &&
    stablecoins.includes(tokenOut.toLowerCase());

  if (isStablePair) {
    return 100; // 0.01%
  }

  return 3000; // 0.3% default
}

function calculateEstimatedSlippage(amountIn: bigint, feeTier: number): number {
  // Simplified slippage estimation
  // In production: Based on pool liquidity, trade size, etc.

  const baseFee = feeTier / 100; // Fee in bps

  // Add price impact estimation based on amount
  // Larger amounts = more slippage
  const amountInNumber = Number(amountIn / 10n ** 12n); // Normalize to avoid overflow
  const priceImpact = Math.min(Math.log10(Math.max(amountInNumber, 1)) * 5, 50);

  return Math.round(baseFee + priceImpact);
}

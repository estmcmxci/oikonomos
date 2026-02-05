// Phase 3: WETH Distribution
// Distributes claimed WETH according to policy (compound, toStables, hold)

import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  formatUnits,
  parseEther,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import type { Env } from '../index';
import type { UnifiedPolicy } from '../policy/templates';

// Token addresses on Base
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as const;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// IntentRouter for swaps (on Base - use Base Sepolia address as placeholder)
const INTENT_ROUTER_ADDRESS = '0x87FC6810C2f9851B43570CdC8b655C21210A155d' as const;

// ERC20 ABI for approvals
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * Distribution result for WETH
 */
export interface DistributionResult {
  /** Amount compounded back to LP */
  compounded: {
    amount: string;
    txHash?: `0x${string}`;
    success: boolean;
    error?: string;
  };
  /** Amount swapped to stables */
  toStables: {
    amount: string;
    usdcReceived: string;
    txHash?: `0x${string}`;
    success: boolean;
    error?: string;
  };
  /** Amount held as WETH */
  held: {
    amount: string;
  };
  /** Total WETH distributed */
  totalDistributed: string;
}

/**
 * Distribute WETH according to policy strategy
 *
 * @param env Environment
 * @param agentPrivateKey Agent's private key for signing
 * @param wethAmount Total WETH amount to distribute (in wei)
 * @param strategy Distribution percentages (compound, toStables, hold)
 */
export async function distributeWeth(
  env: Env,
  agentPrivateKey: `0x${string}`,
  wethAmount: bigint,
  strategy: NonNullable<UnifiedPolicy['wethStrategy']>
): Promise<DistributionResult> {
  const account = privateKeyToAccount(agentPrivateKey);

  const publicClient = createPublicClient({
    chain: base,
    transport: http(env.RPC_URL?.includes('base') ? env.RPC_URL : 'https://mainnet.base.org'),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(env.RPC_URL?.includes('base') ? env.RPC_URL : 'https://mainnet.base.org'),
  });

  // Calculate distribution amounts
  const compoundAmount = (wethAmount * BigInt(strategy.compound)) / 100n;
  const stableAmount = (wethAmount * BigInt(strategy.toStables)) / 100n;
  const holdAmount = wethAmount - compoundAmount - stableAmount;

  const result: DistributionResult = {
    compounded: {
      amount: formatEther(compoundAmount),
      success: true,
    },
    toStables: {
      amount: formatEther(stableAmount),
      usdcReceived: '0',
      success: true,
    },
    held: {
      amount: formatEther(holdAmount),
    },
    totalDistributed: formatEther(wethAmount),
  };

  // 1. Compound - Add to LP (placeholder - requires PositionManager integration)
  if (compoundAmount > 0n) {
    // TODO: Implement LP add liquidity via Uniswap V4 PositionManager
    // For now, just log the intent
    console.log(`[wethDistribution] Would compound ${formatEther(compoundAmount)} WETH to LP`);
    result.compounded.error = 'LP compounding not yet implemented';
    result.compounded.success = false;
  }

  // 2. To Stables - Swap WETH → USDC
  if (stableAmount > 0n) {
    try {
      // Get quote and execute swap via IntentRouter
      const swapResult = await executeWethToUsdcSwap(
        env,
        publicClient,
        walletClient,
        account.address,
        stableAmount
      );

      result.toStables.txHash = swapResult.txHash;
      result.toStables.usdcReceived = swapResult.usdcReceived;
      result.toStables.success = swapResult.success;
      if (!swapResult.success) {
        result.toStables.error = swapResult.error;
      }
    } catch (error) {
      result.toStables.success = false;
      result.toStables.error = String(error);
    }
  }

  // 3. Hold - No action needed, WETH stays in wallet
  // (amount already calculated)

  return result;
}

/**
 * Execute WETH to USDC swap via IntentRouter
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeWethToUsdcSwap(
  env: Env,
  publicClient: any,
  walletClient: any,
  sender: Address,
  wethAmount: bigint
): Promise<{
  success: boolean;
  txHash?: `0x${string}`;
  usdcReceived: string;
  error?: string;
}> {
  // For MVP, we'll use a simple swap approach
  // In production, this would go through the IntentRouter with proper quotes

  try {
    // 1. Check WETH balance
    const wethBalance = await publicClient.readContract({
      address: WETH_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [sender],
    });

    if (wethBalance < wethAmount) {
      return {
        success: false,
        usdcReceived: '0',
        error: `Insufficient WETH balance: have ${formatEther(wethBalance)}, need ${formatEther(wethAmount)}`,
      };
    }

    // 2. Approve IntentRouter to spend WETH
    // Note: This is a placeholder - real implementation would use permit2 or check existing allowance
    console.log(`[wethDistribution] Would approve and swap ${formatEther(wethAmount)} WETH to USDC`);

    // For now, return a placeholder result
    // Real implementation would:
    // - Get quote from strategy-agent
    // - Build swap transaction
    // - Execute via IntentRouter
    return {
      success: false,
      usdcReceived: '0',
      error: 'Direct swap not yet implemented - use /execute endpoint with proper quote',
    };
  } catch (error) {
    return {
      success: false,
      usdcReceived: '0',
      error: String(error),
    };
  }
}

/**
 * Calculate distribution amounts from strategy
 */
export function calculateDistribution(
  totalWeth: bigint,
  strategy: NonNullable<UnifiedPolicy['wethStrategy']>
): {
  compound: bigint;
  toStables: bigint;
  hold: bigint;
} {
  const compound = (totalWeth * BigInt(strategy.compound)) / 100n;
  const toStables = (totalWeth * BigInt(strategy.toStables)) / 100n;
  const hold = totalWeth - compound - toStables;

  return { compound, toStables, hold };
}

/**
 * Validate that strategy percentages sum to 100
 */
export function validateStrategy(
  strategy: NonNullable<UnifiedPolicy['wethStrategy']>
): boolean {
  return strategy.compound + strategy.toStables + strategy.hold === 100;
}

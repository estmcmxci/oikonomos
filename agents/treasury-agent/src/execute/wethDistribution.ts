// Phase 3: WETH Distribution
// Distributes claimed WETH according to policy (compound, toStables, hold)
// Uses Uniswap V4 Universal Router (NOT V3)

import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  formatUnits,
  encodeFunctionData,
  encodeAbiParameters,
  parseAbiParameters,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import type { Env } from '../index';
import type { UnifiedPolicy } from '../policy/templates';
import {
  UNISWAP_V4_ADDRESSES,
  CLANKER_ADDRESSES,
  getUniswapV4Addresses,
} from '../../../../packages/shared/src/constants';
import { getChain, CHAIN_IDS } from '../config/chain';

// Token addresses on Base mainnet
const WETH_ADDRESS = CLANKER_ADDRESSES.BASE_MAINNET.WETH;
const USDC_ADDRESS = CLANKER_ADDRESSES.BASE_MAINNET.USDC;

// ERC20 ABI for approvals and balance checks
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
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Uniswap V4 Universal Router ABI (execute function)
const UNIVERSAL_ROUTER_ABI = [
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'commands', type: 'bytes' },
      { name: 'inputs', type: 'bytes[]' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

// V4 Universal Router Command IDs
// See: https://docs.uniswap.org/contracts/universal-router/technical-reference
const Commands = {
  V4_SWAP: 0x10, // V4 swap command
  WRAP_ETH: 0x0b, // Wrap ETH to WETH
  UNWRAP_WETH: 0x0c, // Unwrap WETH to ETH
  PERMIT2_PERMIT: 0x0a, // Permit2 approval
  PERMIT2_TRANSFER_FROM: 0x02, // Transfer via Permit2
  SWEEP: 0x04, // Sweep tokens to recipient
} as const;

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
  const chainId = parseInt(env.CHAIN_ID || '8453');
  const chain = chainId === CHAIN_IDS.BASE_MAINNET ? base : baseSepolia;

  const publicClient = createPublicClient({
    chain,
    transport: http(env.RPC_URL || 'https://mainnet.base.org'),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(env.RPC_URL || 'https://mainnet.base.org'),
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
    result.compounded.error = 'LP compounding not yet implemented - Phase 2';
    result.compounded.success = false;
  }

  // 2. To Stables - Swap WETH → USDC via V4 Universal Router
  if (stableAmount > 0n) {
    try {
      const swapResult = await executeWethToUsdcSwapV4(
        env,
        publicClient,
        walletClient,
        account.address,
        stableAmount,
        chainId
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
 * Execute WETH to USDC swap via Uniswap V4 Universal Router
 *
 * Uses V4's Universal Router with the V4_SWAP command
 */
async function executeWethToUsdcSwapV4(
  env: Env,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publicClient: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletClient: any,
  sender: Address,
  wethAmount: bigint,
  chainId: number
): Promise<{
  success: boolean;
  txHash?: `0x${string}`;
  usdcReceived: string;
  error?: string;
}> {
  try {
    const v4Addresses = getUniswapV4Addresses(chainId);
    const universalRouter = v4Addresses.UNIVERSAL_ROUTER;
    const permit2 = v4Addresses.PERMIT2;

    if (!universalRouter) {
      return {
        success: false,
        usdcReceived: '0',
        error: `Universal Router not available on chain ${chainId}`,
      };
    }

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

    // 2. Approve Permit2 to spend WETH (if needed)
    const permit2Allowance = await publicClient.readContract({
      address: WETH_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [sender, permit2],
    });

    if (permit2Allowance < wethAmount) {
      console.log(`[wethDistribution] Approving Permit2 to spend WETH`);
      const approveHash = await walletClient.writeContract({
        address: WETH_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [permit2, wethAmount * 2n], // Approve extra for future swaps
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log(`[wethDistribution] Permit2 approval confirmed: ${approveHash}`);
    }

    // 3. Get USDC balance before swap
    const usdcBalanceBefore = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [sender],
    });

    // 4. Calculate minimum output with 1% slippage
    // Assuming ~$3000/ETH (should use oracle in production)
    const estimatedUsdcOut = (wethAmount * 3000n * 1_000_000n) / 10n ** 18n;
    const minAmountOut = (estimatedUsdcOut * 99n) / 100n;

    console.log(`[wethDistribution] V4 Swap: ${formatEther(wethAmount)} WETH → min ${formatUnits(minAmountOut, 6)} USDC`);

    // 5. Build V4 swap path
    // For V4, we need to encode the swap path with PoolKey
    // WETH → USDC direct path
    const poolKey = buildWethUsdcPoolKey(chainId);

    // 6. Encode Universal Router commands
    // Command: V4_SWAP (0x10)
    // Input: encoded V4SwapExactIn params
    const { commands, inputs } = encodeV4SwapCommand(
      sender,
      WETH_ADDRESS,
      USDC_ADDRESS,
      wethAmount,
      minAmountOut,
      poolKey
    );

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 min deadline

    // 7. Execute via Universal Router
    const txHash = await walletClient.writeContract({
      address: universalRouter,
      abi: UNIVERSAL_ROUTER_ABI,
      functionName: 'execute',
      args: [commands, inputs, deadline],
    });

    // 8. Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === 'reverted') {
      return {
        success: false,
        txHash,
        usdcReceived: '0',
        error: 'V4 swap transaction reverted',
      };
    }

    // 9. Get USDC balance after swap to calculate actual received
    const usdcBalanceAfter = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [sender],
    });

    const actualUsdcReceived = BigInt(usdcBalanceAfter) - BigInt(usdcBalanceBefore);
    const usdcReceived = formatUnits(actualUsdcReceived, 6);

    console.log(`[wethDistribution] V4 Swap successful: ${txHash}, received ${usdcReceived} USDC`);

    return {
      success: true,
      txHash,
      usdcReceived,
    };
  } catch (error) {
    console.error('[wethDistribution] V4 Swap failed:', error);
    return {
      success: false,
      usdcReceived: '0',
      error: String(error),
    };
  }
}

/**
 * Build PoolKey for WETH/USDC pool on V4
 *
 * Note: This uses standard Uniswap V4 pool params.
 * For Clanker-launched tokens, the hook address would be different.
 */
function buildWethUsdcPoolKey(chainId: number): {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
} {
  // Sort tokens (V4 requires currency0 < currency1)
  const [currency0, currency1] = WETH_ADDRESS.toLowerCase() < USDC_ADDRESS.toLowerCase()
    ? [WETH_ADDRESS, USDC_ADDRESS]
    : [USDC_ADDRESS, WETH_ADDRESS];

  return {
    currency0,
    currency1,
    fee: 3000, // 0.3% fee tier for WETH/USDC
    tickSpacing: 60,
    hooks: '0x0000000000000000000000000000000000000000' as Address, // No hooks for standard pools
  };
}

/**
 * Encode V4 swap command for Universal Router
 *
 * Uses V4_SWAP command (0x10) with exactIn swap
 */
function encodeV4SwapCommand(
  recipient: Address,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
  minAmountOut: bigint,
  poolKey: ReturnType<typeof buildWethUsdcPoolKey>
): { commands: Hex; inputs: Hex[] } {
  // V4_SWAP command ID
  const commands = '0x10' as Hex;

  // Determine swap direction based on token order
  const zeroForOne = tokenIn.toLowerCase() === poolKey.currency0.toLowerCase();

  // Encode V4 swap params
  // struct ExactInputSingleParams {
  //   PoolKey poolKey;
  //   bool zeroForOne;
  //   uint128 amountIn;
  //   uint128 amountOutMinimum;
  //   uint160 sqrtPriceLimitX96;
  //   bytes hookData;
  // }
  const swapParams = encodeAbiParameters(
    parseAbiParameters([
      '(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey',
      'bool zeroForOne',
      'uint128 amountIn',
      'uint128 amountOutMinimum',
      'uint160 sqrtPriceLimitX96',
      'bytes hookData',
    ]),
    [
      {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks,
      },
      zeroForOne,
      amountIn,
      minAmountOut,
      0n, // No price limit
      '0x' as Hex, // No hook data
    ]
  );

  // Wrap in Actions format for Universal Router V4_SWAP
  // The input format is: abi.encode(Actions, params)
  // For simple exactInputSingle, we encode the action type and params
  const input = encodeAbiParameters(
    parseAbiParameters(['bytes actions', 'bytes[] params']),
    [
      '0x00' as Hex, // SWAP_EXACT_IN action
      [swapParams],
    ]
  );

  return {
    commands,
    inputs: [input],
  };
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

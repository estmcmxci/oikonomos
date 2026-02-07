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

// Token addresses (same WETH on both networks)
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as Address;

// USDC differs per network
const USDC_ADDRESSES = {
  [CHAIN_IDS.BASE_MAINNET]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
  [CHAIN_IDS.BASE_SEPOLIA]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address,
} as const;

function getUsdcAddress(chainId: number): Address {
  return USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES] || USDC_ADDRESSES[CHAIN_IDS.BASE_MAINNET];
}

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

// V4 Router Actions (for V4_SWAP command)
// See: https://docs.uniswap.org/contracts/v4/quickstart/swap
const Actions = {
  SWAP_EXACT_IN_SINGLE: 0x06,
  SWAP_EXACT_IN: 0x07,
  SWAP_EXACT_OUT_SINGLE: 0x08,
  SWAP_EXACT_OUT: 0x09,
  SETTLE_ALL: 0x0c,
  SETTLE: 0x0b,
  TAKE_ALL: 0x01,
  TAKE: 0x00,
  TAKE_PORTION: 0x02,
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
    console.log(`[wethDistribution] Checking WETH balance for ${sender} at ${WETH_ADDRESS}`);
    const wethBalanceRaw = await publicClient.readContract({
      address: WETH_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [sender],
    });
    const wethBalance = BigInt(wethBalanceRaw);
    console.log(`[wethDistribution] WETH balance: ${wethBalance} (${formatEther(wethBalance)})`);

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
    const usdcAddress = getUsdcAddress(chainId);
    const usdcBalanceBefore = await publicClient.readContract({
      address: usdcAddress,
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
      usdcAddress,
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
      address: usdcAddress,
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
  const usdcAddress = getUsdcAddress(chainId);

  // Sort tokens (V4 requires currency0 < currency1)
  const [currency0, currency1] = WETH_ADDRESS.toLowerCase() < usdcAddress.toLowerCase()
    ? [WETH_ADDRESS, usdcAddress]
    : [usdcAddress, WETH_ADDRESS];

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
 * Format: abi.encode(actions, params[])
 * Actions: SWAP_EXACT_IN_SINGLE + SETTLE_ALL + TAKE_ALL
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

  // Determine currency order for settle/take based on swap direction
  const currencyIn = zeroForOne ? poolKey.currency0 : poolKey.currency1;
  const currencyOut = zeroForOne ? poolKey.currency1 : poolKey.currency0;

  // Actions: SWAP_EXACT_IN_SINGLE (0x06) + SETTLE_ALL (0x0c) + TAKE_ALL (0x01)
  // Encoded as abi.encodePacked(uint8, uint8, uint8)
  const actionsHex = `0x${Actions.SWAP_EXACT_IN_SINGLE.toString(16).padStart(2, '0')}${Actions.SETTLE_ALL.toString(16).padStart(2, '0')}${Actions.TAKE_ALL.toString(16).padStart(2, '0')}` as Hex;

  // Param 0: ExactInputSingleParams for SWAP_EXACT_IN_SINGLE
  const swapParams = encodeAbiParameters(
    parseAbiParameters([
      '(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey',
      'bool zeroForOne',
      'uint128 amountIn',
      'uint128 amountOutMinimum',
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
      '0x' as Hex, // No hook data
    ]
  );

  // Param 1: SETTLE_ALL params (currency, maxAmount)
  // SETTLE_ALL settles the input currency - pays what's owed to the pool
  const settleParams = encodeAbiParameters(
    parseAbiParameters(['address currency', 'uint256 maxAmount']),
    [currencyIn, amountIn]
  );

  // Param 2: TAKE_ALL params (currency, minAmount)
  // TAKE_ALL takes the output currency - receives from the pool
  const takeParams = encodeAbiParameters(
    parseAbiParameters(['address currency', 'uint256 minAmount']),
    [currencyOut, minAmountOut]
  );

  // Encode the full V4_SWAP input: abi.encode(bytes actions, bytes[] params)
  const input = encodeAbiParameters(
    parseAbiParameters(['bytes actions', 'bytes[] params']),
    [
      actionsHex,
      [swapParams, settleParams, takeParams],
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

// ERC-20 transfer ABI
const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * Result of distributing WETH to deployer with 85/15 split
 */
export interface DeployerDistributionResult {
  deployerAmount: string;
  serviceFee: string;
  txHash?: string;
  serviceFeeTxHash?: string;
  success: boolean;
  error?: string;
}

/**
 * Distribute claimed WETH with 85/15 deployer split.
 *
 * The on-chain DelegationRouter caps providerFeeBps at 1000 (10%),
 * so the full 85/15 split is done off-chain via WETH ERC-20 transfers:
 * - 85% to the deployer (user who launched the agent)
 * - 15% kept as treasury agent service fee
 */
export async function distributeToDeployer(
  env: Env,
  agentPrivateKey: `0x${string}`,
  wethAmount: bigint,
  deployerAddress: Address,
  treasuryAddress: Address,
  feeSplitPct: number = 85
): Promise<DeployerDistributionResult> {
  const deployerAmount = (wethAmount * BigInt(feeSplitPct)) / 100n;
  const serviceFee = wethAmount - deployerAmount;

  if (deployerAmount === 0n) {
    return {
      deployerAmount: '0',
      serviceFee: formatEther(serviceFee),
      success: true,
    };
  }

  const account = privateKeyToAccount(agentPrivateKey);
  const chainId = parseInt(env.CHAIN_ID || '8453');
  const chain = chainId === CHAIN_IDS.BASE_MAINNET ? base : baseSepolia;
  const rpcUrl = env.RPC_URL || 'https://mainnet.base.org';

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  try {
    // 1. Transfer 85% WETH to deployer
    const deployerTxHash = await walletClient.writeContract({
      address: WETH_ADDRESS,
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [deployerAddress, deployerAmount],
    });

    await publicClient.waitForTransactionReceipt({ hash: deployerTxHash });
    console.log(`[distributeToDeployer] Sent ${formatEther(deployerAmount)} WETH to deployer ${deployerAddress}: ${deployerTxHash}`);

    // 2. Transfer 15% WETH to treasury agent (service fee)
    let serviceFeeTxHash: string | undefined;
    if (serviceFee > 0n) {
      const feeTxHash = await walletClient.writeContract({
        address: WETH_ADDRESS,
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [treasuryAddress, serviceFee],
      });

      await publicClient.waitForTransactionReceipt({ hash: feeTxHash });
      serviceFeeTxHash = feeTxHash;
      console.log(`[distributeToDeployer] Sent ${formatEther(serviceFee)} WETH service fee to treasury ${treasuryAddress}: ${feeTxHash}`);
    }

    return {
      deployerAmount: formatEther(deployerAmount),
      serviceFee: formatEther(serviceFee),
      txHash: deployerTxHash,
      serviceFeeTxHash,
      success: true,
    };
  } catch (error) {
    console.error('[distributeToDeployer] Error:', error);
    return {
      deployerAmount: formatEther(deployerAmount),
      serviceFee: formatEther(serviceFee),
      success: false,
      error: String(error),
    };
  }
}

/**
 * Withdraw accumulated WETH service fee to the deployer on demand.
 *
 * The cron sends 85% of claimed WETH to the deployer automatically.
 * The remaining 15% accumulates in the agent wallet as a service fee.
 * This function lets deployers drain that accumulated balance.
 */
/**
 * Withdraw native ETH from agent wallet to deployer.
 */
export async function withdrawEthToDeployer(
  env: Env,
  agentPrivateKey: `0x${string}`,
  agentAddress: Address,
  deployerAddress: Address,
  requestedAmount?: bigint
): Promise<{ txHash?: string; amount: string; success: boolean; error?: string }> {
  const account = privateKeyToAccount(agentPrivateKey);
  const chainId = parseInt(env.CHAIN_ID || '8453');
  const chain = chainId === CHAIN_IDS.BASE_MAINNET ? base : baseSepolia;
  const rpcUrl = env.RPC_URL || 'https://mainnet.base.org';

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  try {
    const balance = await publicClient.getBalance({ address: agentAddress });

    if (balance === 0n) {
      return { amount: '0', success: false, error: 'No ETH balance to withdraw' };
    }

    // Reserve gas for the transfer (~21000 gas * 0.1 gwei = small buffer)
    const gasBuffer = 100_000n * 1_000_000_000n; // 0.0001 ETH buffer for gas
    const available = balance > gasBuffer ? balance - gasBuffer : 0n;

    if (available === 0n) {
      return { amount: '0', success: false, error: `ETH balance too low to cover gas (${formatEther(balance)} ETH)` };
    }

    const transferAmount = requestedAmount ? (requestedAmount > available ? available : requestedAmount) : available;

    const txHash = await walletClient.sendTransaction({
      to: deployerAddress,
      value: transferAmount,
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`[withdrawEthToDeployer] Sent ${formatEther(transferAmount)} ETH to ${deployerAddress}: ${txHash}`);

    return { txHash, amount: formatEther(transferAmount), success: true };
  } catch (error) {
    console.error('[withdrawEthToDeployer] Error:', error);
    return { amount: '0', success: false, error: String(error) };
  }
}

export async function withdrawToDeployer(
  env: Env,
  agentPrivateKey: `0x${string}`,
  agentAddress: Address,
  deployerAddress: Address,
  requestedAmount?: bigint
): Promise<{ txHash?: string; amount: string; success: boolean; error?: string }> {
  const account = privateKeyToAccount(agentPrivateKey);
  const chainId = parseInt(env.CHAIN_ID || '8453');
  const chain = chainId === CHAIN_IDS.BASE_MAINNET ? base : baseSepolia;
  const rpcUrl = env.RPC_URL || 'https://mainnet.base.org';

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  try {
    // 1. Read WETH balance of the treasury agent
    const balanceRaw = await publicClient.readContract({
      address: WETH_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [agentAddress],
    });
    const balance = BigInt(balanceRaw);

    if (balance === 0n) {
      return { amount: '0', success: false, error: 'No WETH balance to withdraw' };
    }

    // 2. Determine transfer amount
    const transferAmount = requestedAmount ?? balance;

    if (transferAmount > balance) {
      return {
        amount: '0',
        success: false,
        error: `Insufficient WETH balance: have ${formatEther(balance)}, requested ${formatEther(transferAmount)}`,
      };
    }

    // 3. Transfer WETH to deployer
    const txHash = await walletClient.writeContract({
      address: WETH_ADDRESS,
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [deployerAddress, transferAmount],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`[withdrawToDeployer] Sent ${formatEther(transferAmount)} WETH to ${deployerAddress}: ${txHash}`);

    return { txHash, amount: formatEther(transferAmount), success: true };
  } catch (error) {
    console.error('[withdrawToDeployer] Error:', error);
    return { amount: '0', success: false, error: String(error) };
  }
}

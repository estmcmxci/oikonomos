// Phase 3: Fee Claiming Execution
// Executes fee claims from ClankerFeeLocker for agent tokens

import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import type { Env } from '../index';

// ClankerFeeLocker on Base mainnet
const FEE_LOCKER_ADDRESS = '0xF3622742b1E446D92e45E22923Ef11C2fcD55D68' as const;

// FeeLocker ABI
const FeeLockerABI = [
  {
    name: 'availableWethFees',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'availableTokenFees',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
  {
    name: 'claimAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokens', type: 'address[]' }],
    outputs: [],
  },
] as const;

/**
 * Result of claiming fees for a single token
 */
export interface ClaimResult {
  token: Address;
  symbol?: string;
  wethClaimed: string;
  tokensClaimed: string;
  txHash: `0x${string}`;
  success: boolean;
  error?: string;
}

/**
 * Aggregate result of claiming fees for multiple tokens
 */
export interface ClaimAllResult {
  totalWethClaimed: string;
  totalTokensClaimed: number;
  claims: ClaimResult[];
  txHash?: `0x${string}`;
}

/**
 * Execute fee claim for a single token
 */
export async function executeFeeClaim(
  env: Env,
  agentPrivateKey: `0x${string}`,
  token: Address,
  symbol?: string
): Promise<ClaimResult> {
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

  try {
    // Check available fees before claiming
    // Note: FeeLocker may revert if token has never been traded
    let wethFees = 0n;
    try {
      wethFees = await publicClient.readContract({
        address: FEE_LOCKER_ADDRESS,
        abi: FeeLockerABI,
        functionName: 'availableWethFees',
        args: [token, account.address],
      });
    } catch (checkError: any) {
      // FeeLocker reverts when token hasn't been traded yet
      // This is normal for newly launched tokens
      const errorMsg = String(checkError);
      if (errorMsg.includes('revert') || errorMsg.includes('execution reverted')) {
        console.log(`[feeClaim] Token ${token} not yet traded (FeeLocker revert)`);
        return {
          token,
          symbol,
          wethClaimed: '0',
          tokensClaimed: '0',
          txHash: '0x0' as `0x${string}`,
          success: true,
          error: 'No fees available - token has not been traded yet',
        };
      }
      throw checkError; // Re-throw unexpected errors
    }

    if (wethFees === 0n) {
      return {
        token,
        symbol,
        wethClaimed: '0',
        tokensClaimed: '0',
        txHash: '0x0' as `0x${string}`,
        success: true,
        error: 'No fees to claim',
      };
    }

    // Execute claim
    const txHash = await walletClient.writeContract({
      address: FEE_LOCKER_ADDRESS,
      abi: FeeLockerABI,
      functionName: 'claim',
      args: [token],
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return {
      token,
      symbol,
      wethClaimed: formatEther(wethFees),
      tokensClaimed: '0', // TODO: Get token fees from event
      txHash,
      success: true,
    };
  } catch (error) {
    return {
      token,
      symbol,
      wethClaimed: '0',
      tokensClaimed: '0',
      txHash: '0x0' as `0x${string}`,
      success: false,
      error: String(error),
    };
  }
}

/**
 * Execute fee claims for multiple tokens
 * Uses claimAll for gas efficiency when claiming multiple tokens
 */
export async function executeClaimAll(
  env: Env,
  agentPrivateKey: `0x${string}`,
  tokens: Address[]
): Promise<ClaimAllResult> {
  console.log('[feeClaim] executeClaimAll START - tokens:', tokens);

  if (tokens.length === 0) {
    console.log('[feeClaim] No tokens to process');
    return {
      totalWethClaimed: '0',
      totalTokensClaimed: 0,
      claims: [],
    };
  }

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

  // Get fees for each token before claiming
  // Note: FeeLocker may revert for tokens that haven't been traded yet
  console.log('[feeClaim] About to check fees for each token');
  const feePromises = tokens.map(async (token) => {
    console.log(`[feeClaim] Checking token ${token}...`);
    try {
      const wethFees = await publicClient.readContract({
        address: FEE_LOCKER_ADDRESS,
        abi: FeeLockerABI,
        functionName: 'availableWethFees',
        args: [token, account.address],
      });
      return { token, wethFees, error: undefined };
    } catch (error: any) {
      // FeeLocker reverts when token hasn't been traded yet
      const errorMsg = String(error);
      if (errorMsg.includes('revert') || errorMsg.includes('execution reverted')) {
        console.log(`[feeClaim] Token ${token} not yet traded (FeeLocker revert)`);
        return { token, wethFees: 0n, error: 'Token not yet traded' };
      }
      return { token, wethFees: 0n, error: errorMsg };
    }
  });

  const fees = await Promise.all(feePromises);
  const tokensWithFees = fees.filter(f => f.wethFees > 0n);

  if (tokensWithFees.length === 0) {
    return {
      totalWethClaimed: '0',
      totalTokensClaimed: 0,
      claims: fees.map(f => ({
        token: f.token,
        wethClaimed: '0',
        tokensClaimed: '0',
        txHash: '0x0' as `0x${string}`,
        success: true,
        error: f.error || 'No fees to claim',
      })),
    };
  }

  try {
    // Use claimAll for multiple tokens
    const txHash = await walletClient.writeContract({
      address: FEE_LOCKER_ADDRESS,
      abi: FeeLockerABI,
      functionName: 'claimAll',
      args: [tokensWithFees.map(f => f.token)],
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    let totalWeth = 0n;
    const claims: ClaimResult[] = fees.map(f => {
      const claimed = f.wethFees > 0n;
      if (claimed) totalWeth += f.wethFees;
      return {
        token: f.token,
        wethClaimed: formatEther(f.wethFees),
        tokensClaimed: '0',
        txHash: claimed ? txHash : ('0x0' as `0x${string}`),
        success: true,
      };
    });

    return {
      totalWethClaimed: formatEther(totalWeth),
      totalTokensClaimed: tokensWithFees.length,
      claims,
      txHash,
    };
  } catch (error) {
    return {
      totalWethClaimed: '0',
      totalTokensClaimed: 0,
      claims: tokens.map(token => ({
        token,
        wethClaimed: '0',
        tokensClaimed: '0',
        txHash: '0x0' as `0x${string}`,
        success: false,
        error: String(error),
      })),
    };
  }
}

/**
 * Get agent private key from KV storage
 */
export async function getAgentPrivateKey(
  kv: KVNamespace,
  userAddress: Address,
  agentName: string
): Promise<`0x${string}` | null> {
  const key = `agent:${userAddress.toLowerCase()}:${agentName}`;
  const data = await kv.get(key);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data) as { encryptedKey?: string };
    // In production, decrypt the key here
    return parsed.encryptedKey as `0x${string}` | undefined ?? null;
  } catch {
    return null;
  }
}

// Minimal DelegationRouter ABI for executeManagement
const DelegationRouterManagementABI = [
  {
    name: 'executeManagement',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'compound', type: 'uint8' },
          { name: 'toStables', type: 'uint8' },
          { name: 'hold', type: 'uint8' },
          { name: 'maxSlippage', type: 'uint16' },
        ],
      },
    ],
    outputs: [],
  },
] as const;

/**
 * Call DelegationRouter.executeManagement() for on-chain audit trail.
 *
 * This is best-effort — the direct claim + off-chain 85/15 split is the
 * primary mechanism. If executeManagement reverts (e.g., TooSoon, no
 * delegation), we log and continue.
 */
export async function executeManagementOnChain(
  env: Env,
  treasuryPrivateKey: `0x${string}`,
  defiAgentAddress: Address
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const delegationRouter = env.DELEGATION_ROUTER as Address | undefined;
  if (!delegationRouter) {
    return { success: false, error: 'DELEGATION_ROUTER not configured' };
  }

  try {
    const account = privateKeyToAccount(treasuryPrivateKey);
    const rpcUrl = env.RPC_URL || 'https://mainnet.base.org';

    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(rpcUrl),
    });

    const txHash = await walletClient.writeContract({
      address: delegationRouter,
      abi: DelegationRouterManagementABI,
      functionName: 'executeManagement',
      args: [
        defiAgentAddress,
        { compound: 0, toStables: 0, hold: 100, maxSlippage: 0 },
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === 'reverted') {
      return { success: false, txHash, error: 'Transaction reverted' };
    }

    console.log(`[executeManagement] Audit trail for ${defiAgentAddress}: ${txHash}`);
    return { success: true, txHash };
  } catch (error) {
    // Best-effort — log and continue
    console.warn(`[executeManagement] Failed for ${defiAgentAddress}:`, error);
    return { success: false, error: String(error) };
  }
}

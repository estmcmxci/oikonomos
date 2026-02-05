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
    const wethFees = await publicClient.readContract({
      address: FEE_LOCKER_ADDRESS,
      abi: FeeLockerABI,
      functionName: 'availableWethFees',
      args: [token, account.address],
    });

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
  if (tokens.length === 0) {
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
  const feePromises = tokens.map(async (token) => {
    const wethFees = await publicClient.readContract({
      address: FEE_LOCKER_ADDRESS,
      abi: FeeLockerABI,
      functionName: 'availableWethFees',
      args: [token, account.address],
    });
    return { token, wethFees };
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
        error: 'No fees to claim',
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

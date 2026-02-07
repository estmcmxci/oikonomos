// Phase 1: Clawnch Integration for Portfolio Discovery
// Discovers user's agent tokens and unclaimed fees from Clawnch + FeeLocker

import { createPublicClient, http, formatEther, type Address } from 'viem';
import { base } from 'viem/chains';
import type { Env } from '../index';

// Clawnch API base URL
const CLAWNCH_API_URL = 'https://clawn.ch/api';

// ClankerFeeLocker on Base mainnet
const FEE_LOCKER_ADDRESS = '0xF3622742b1E446D92e45E22923Ef11C2fcD55D68' as const;

// FeeLocker ABI (minimal)
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
] as const;

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * Agent token discovered from Clawnch with fee information
 */
export interface AgentToken {
  /** Token contract address */
  address: Address;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Agent wallet that launched the token */
  agentWallet: Address;
  /** Platform where token was launched */
  platform: 'moltbook' | '4claw' | 'clawstr' | 'moltx';
  /** User's token balance (formatted) */
  balance: string;
  /** Unclaimed WETH fees (formatted) */
  unclaimedWethFees: string;
  /** Unclaimed token fees (formatted) */
  unclaimedTokenFees: string;
  /** 24h price change percentage */
  priceChange24h?: number;
  /** Market cap in USD */
  marketCapUsd?: string;
  /** Optional ENS name of the agent */
  agentEns?: string;
}

/**
 * Unified portfolio including stablecoins, volatile assets, and agent tokens
 */
export interface DiscoveredPortfolio {
  /** Traditional stablecoin holdings */
  stablecoins: PortfolioToken[];
  /** Volatile asset holdings (ETH, etc.) */
  volatile: PortfolioToken[];
  /** Agent tokens from Clawnch */
  agentTokens: AgentToken[];
  /** Aggregate unclaimed fees */
  unclaimedFees: {
    /** Total unclaimed WETH (formatted) */
    weth: string;
    /** Total unclaimed WETH in wei */
    wethRaw: string;
    /** Per-token fee breakdown */
    tokens: Array<{
      address: Address;
      symbol: string;
      wethAmount: string;
      tokenAmount: string;
    }>;
  };
}

export interface PortfolioToken {
  address: Address;
  symbol: string;
  balance: string;
  balanceRaw: string;
  percentage: number;
}

interface ClawnchLaunch {
  contractAddress: string;
  name: string;
  symbol: string;
  agentWallet: string;
  source?: string;
  platform?: string;
  launchedAt?: number;
  agentEns?: string;
}

interface ClawnchAnalytics {
  priceChange24h?: number;
  marketCapUsd?: string;
}

/**
 * Discover agent tokens for a user's wallets from Clawnch API
 */
export async function discoverAgentTokens(
  env: Env,
  userWallet: Address,
  agentWallets: Address[]
): Promise<AgentToken[]> {
  // Only query with agent wallets - NOT the deployer address
  // Deployer creates agent wallets, agent wallets launch tokens
  if (agentWallets.length === 0) {
    return []; // No agent wallets registered yet
  }
  const walletsToQuery = agentWallets;
  const allTokens: AgentToken[] = [];

  // Create Base mainnet client for FeeLocker queries
  const baseClient = createPublicClient({
    chain: base,
    transport: http(env.RPC_URL?.includes('base') ? env.RPC_URL : 'https://mainnet.base.org'),
  });

  for (const wallet of walletsToQuery) {
    try {
      // 1. Query Clawnch API for launched tokens
      const response = await fetch(
        `${CLAWNCH_API_URL}/launches?wallet=${wallet}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        console.warn(`[clawnch] Failed to fetch launches for ${wallet}: ${response.status}`);
        continue;
      }

      const data = await response.json() as ClawnchLaunch[] | { launches: ClawnchLaunch[] };
      const launches: ClawnchLaunch[] = Array.isArray(data) ? data : data.launches || [];

      // 2. For each token, get fees from FeeLocker and token balance
      for (const launch of launches) {
        const tokenAddress = launch.contractAddress as Address;
        const agentWallet = (launch.agentWallet || wallet) as Address;

        // Get unclaimed fees and token balance in parallel
        const [wethFees, tokenFees, tokenBalance] = await Promise.all([
          getAvailableWethFees(baseClient, tokenAddress, agentWallet),
          getAvailableTokenFees(baseClient, tokenAddress, agentWallet),
          getTokenBalance(baseClient, tokenAddress, agentWallet),
        ]);

        // Get analytics (optional)
        const analytics = await getTokenAnalytics(tokenAddress);

        allTokens.push({
          address: tokenAddress,
          symbol: launch.symbol,
          name: launch.name,
          agentWallet,
          platform: (launch.source || launch.platform || 'moltbook') as AgentToken['platform'],
          balance: formatEther(tokenBalance),
          unclaimedWethFees: formatEther(wethFees),
          unclaimedTokenFees: formatEther(tokenFees),
          priceChange24h: analytics?.priceChange24h,
          marketCapUsd: analytics?.marketCapUsd,
          agentEns: launch.agentEns,
        });
      }
    } catch (error) {
      console.warn(`[clawnch] Error fetching tokens for ${wallet}:`, error);
    }
  }

  return allTokens;
}

/**
 * Get aggregate unclaimed fees across all agent tokens
 */
export async function getAggregateFees(
  env: Env,
  agentTokens: AgentToken[]
): Promise<DiscoveredPortfolio['unclaimedFees']> {
  let totalWethWei = 0n;
  const tokenBreakdown: DiscoveredPortfolio['unclaimedFees']['tokens'] = [];

  for (const token of agentTokens) {
    const wethWei = BigInt(Math.floor(parseFloat(token.unclaimedWethFees) * 1e18));
    totalWethWei += wethWei;

    if (parseFloat(token.unclaimedWethFees) > 0 || parseFloat(token.unclaimedTokenFees) > 0) {
      tokenBreakdown.push({
        address: token.address,
        symbol: token.symbol,
        wethAmount: token.unclaimedWethFees,
        tokenAmount: token.unclaimedTokenFees,
      });
    }
  }

  return {
    weth: formatEther(totalWethWei),
    wethRaw: totalWethWei.toString(),
    tokens: tokenBreakdown,
  };
}

/**
 * Get user's agent wallets from KV storage
 */
export async function getAgentWallets(
  kv: KVNamespace,
  userAddress: Address
): Promise<Address[]> {
  try {
    const key = `agents:${userAddress.toLowerCase()}`;
    const data = await kv.get(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save user's agent wallets to KV storage
 */
export async function saveAgentWallets(
  kv: KVNamespace,
  userAddress: Address,
  agentWallets: Address[]
): Promise<void> {
  const key = `agents:${userAddress.toLowerCase()}`;
  await kv.put(key, JSON.stringify(agentWallets));
}

// Helper functions

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTokenBalance(
  client: any,
  token: Address,
  wallet: Address
): Promise<bigint> {
  try {
    const result = await client.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [wallet],
    });
    return result as bigint;
  } catch (error) {
    console.warn(`[clawnch] Error getting balance for ${token}:`, error);
    return 0n;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAvailableWethFees(
  client: any,
  token: Address,
  wallet: Address
): Promise<bigint> {
  try {
    const result = await client.readContract({
      address: FEE_LOCKER_ADDRESS,
      abi: FeeLockerABI,
      functionName: 'availableWethFees',
      args: [token, wallet],
    });
    return result as bigint;
  } catch (error) {
    console.warn(`[feeLocker] Error getting WETH fees for ${token}:`, error);
    return 0n;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAvailableTokenFees(
  client: any,
  token: Address,
  wallet: Address
): Promise<bigint> {
  try {
    const result = await client.readContract({
      address: FEE_LOCKER_ADDRESS,
      abi: FeeLockerABI,
      functionName: 'availableTokenFees',
      args: [token, wallet],
    });
    return result as bigint;
  } catch (error) {
    console.warn(`[feeLocker] Error getting token fees for ${token}:`, error);
    return 0n;
  }
}

async function getTokenAnalytics(tokenAddress: Address): Promise<ClawnchAnalytics | null> {
  try {
    const response = await fetch(
      `${CLAWNCH_API_URL}/analytics/token?address=${tokenAddress}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) return null;

    const data = await response.json() as { priceChange24h?: number; marketCapUsd?: string };
    return {
      priceChange24h: data.priceChange24h,
      marketCapUsd: data.marketCapUsd,
    };
  } catch {
    return null;
  }
}

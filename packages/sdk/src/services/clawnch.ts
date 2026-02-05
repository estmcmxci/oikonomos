/**
 * Clawnch Service
 *
 * Integration with Clawnch platform for discovering user's AI agents
 * and their launched tokens across Moltbook, 4claw, Clawstr, and Moltx.
 *
 * @see PIVOT_SUMMARY.md - Meta-treasury manager pivot
 * @see https://clawn.ch - Clawnch platform
 */

import type { Address } from 'viem';

// Clawnch API base URL
const CLAWNCH_API_URL = 'https://clawn.ch/api';

/**
 * Launched token information from Clawnch
 */
export interface LaunchedToken {
  /** Token contract address */
  contractAddress: Address;
  /** Token name */
  name: string;
  /** Token symbol (e.g., "$ALPHA") */
  symbol: string;
  /** Total supply */
  totalSupply: string;
  /** Agent wallet that launched the token */
  agentWallet: Address;
  /** Platform where token was launched */
  platform: 'moltbook' | '4claw' | 'clawstr' | 'moltx';
  /** Timestamp when launched */
  launchedAt: number;
  /** Optional ENS name of the agent */
  agentEns?: string;
  /** Clanker pool info */
  pool?: {
    poolId: `0x${string}`;
    lpTokenAddress: Address;
  };
}

/**
 * Token analytics from Clawnch
 */
export interface TokenAnalytics {
  /** Token contract address */
  contractAddress: Address;
  /** Current price in ETH */
  priceEth: string;
  /** Current price in USD */
  priceUsd: string;
  /** Market cap in USD */
  marketCapUsd: string;
  /** 24h trading volume in USD */
  volume24hUsd: string;
  /** 24h price change percentage */
  priceChange24h: number;
  /** Number of holders */
  holderCount: number;
  /** Total fees accumulated (WETH) */
  totalFeesWeth?: string;
}

/**
 * Token launch parameters
 */
export interface LaunchParams {
  /** Token name */
  name: string;
  /** Token symbol (without $) */
  symbol: string;
  /** Agent wallet address */
  wallet: Address;
  /** Token description */
  description: string;
  /** Platform to launch on */
  platform: 'moltbook' | '4claw' | 'clawstr' | 'moltx';
  /** Optional image URL */
  imageUrl?: string;
}

/**
 * Token launch result
 */
export interface LaunchResult {
  /** Token contract address */
  contractAddress: Address;
  /** Clanker pool URL */
  clankerUrl: string;
  /** Transaction hash */
  transactionHash: `0x${string}`;
  /** Pool ID */
  poolId: `0x${string}`;
}

/**
 * ClawnchService provides integration with the Clawnch platform
 * for discovering and managing AI agent tokens.
 */
export class ClawnchService {
  private moltbookKey?: string;

  /**
   * Create a new ClawnchService instance
   * @param moltbookKey Optional Moltbook API key for authenticated requests
   */
  constructor(moltbookKey?: string) {
    this.moltbookKey = moltbookKey;
  }

  /**
   * Discover all tokens launched by a user's agents
   *
   * @param wallet User's wallet address (or array of agent wallets)
   * @returns Array of launched tokens
   */
  async discoverUserAgents(wallet: Address | Address[]): Promise<LaunchedToken[]> {
    const wallets = Array.isArray(wallet) ? wallet : [wallet];

    // Query for each wallet and combine results
    const allTokens: LaunchedToken[] = [];

    for (const w of wallets) {
      try {
        const response = await fetch(
          `${CLAWNCH_API_URL}/launches?wallet=${w}`,
          {
            headers: this.getHeaders(),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!response.ok) {
          console.warn(`[clawnch] Failed to fetch launches for ${w}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const tokens = this.parseTokensResponse(data, w);
        allTokens.push(...tokens);
      } catch (error) {
        console.warn(`[clawnch] Error fetching launches for ${w}:`, error);
      }
    }

    return allTokens;
  }

  /**
   * Get analytics for a specific token
   *
   * @param tokenAddress Token contract address
   * @returns Token analytics or null if not found
   */
  async getTokenAnalytics(tokenAddress: Address): Promise<TokenAnalytics | null> {
    try {
      const response = await fetch(
        `${CLAWNCH_API_URL}/analytics/token?address=${tokenAddress}`,
        {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAnalyticsResponse(data, tokenAddress);
    } catch (error) {
      console.warn(`[clawnch] Error fetching analytics for ${tokenAddress}:`, error);
      return null;
    }
  }

  /**
   * Get analytics for multiple tokens in batch
   *
   * @param tokenAddresses Array of token addresses
   * @returns Map of address to analytics
   */
  async getBatchTokenAnalytics(
    tokenAddresses: Address[]
  ): Promise<Map<Address, TokenAnalytics>> {
    const results = new Map<Address, TokenAnalytics>();

    // Fetch in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < tokenAddresses.length; i += batchSize) {
      const batch = tokenAddresses.slice(i, i + batchSize);
      const promises = batch.map(addr => this.getTokenAnalytics(addr));
      const batchResults = await Promise.all(promises);

      batch.forEach((addr, idx) => {
        const analytics = batchResults[idx];
        if (analytics) {
          results.set(addr, analytics);
        }
      });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < tokenAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Launch a new token via Clawnch
   * Requires Moltbook API key for authenticated requests
   *
   * @param params Launch parameters
   * @returns Launch result
   * @throws Error if Moltbook API key not configured
   */
  async launchToken(params: LaunchParams): Promise<LaunchResult> {
    if (!this.moltbookKey) {
      throw new Error('Moltbook API key required to launch tokens');
    }

    const response = await fetch(`${CLAWNCH_API_URL}/launch`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: params.name,
        symbol: params.symbol,
        wallet: params.wallet,
        description: params.description,
        platform: params.platform,
        imageUrl: params.imageUrl,
      }),
      signal: AbortSignal.timeout(30000), // Longer timeout for launch
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to launch token: ${error}`);
    }

    const data = await response.json();
    return {
      contractAddress: data.contractAddress as Address,
      clankerUrl: data.clankerUrl,
      transactionHash: data.transactionHash as `0x${string}`,
      poolId: data.poolId as `0x${string}`,
    };
  }

  /**
   * Get aggregate stats for all user's tokens
   *
   * @param tokens Array of launched tokens
   * @returns Aggregate stats
   */
  async getAggregateStats(tokens: LaunchedToken[]): Promise<{
    totalTokens: number;
    totalMarketCapUsd: number;
    totalVolume24hUsd: number;
    platforms: string[];
  }> {
    const addresses = tokens.map(t => t.contractAddress);
    const analyticsMap = await this.getBatchTokenAnalytics(addresses);

    let totalMarketCapUsd = 0;
    let totalVolume24hUsd = 0;
    const platforms = new Set<string>();

    for (const token of tokens) {
      platforms.add(token.platform);
      const analytics = analyticsMap.get(token.contractAddress);
      if (analytics) {
        totalMarketCapUsd += parseFloat(analytics.marketCapUsd) || 0;
        totalVolume24hUsd += parseFloat(analytics.volume24hUsd) || 0;
      }
    }

    return {
      totalTokens: tokens.length,
      totalMarketCapUsd,
      totalVolume24hUsd,
      platforms: Array.from(platforms),
    };
  }

  // Private helpers

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (this.moltbookKey) {
      headers['X-Moltbook-Key'] = this.moltbookKey;
    }

    return headers;
  }

  private parseTokensResponse(data: any, wallet: Address): LaunchedToken[] {
    // Handle various API response formats
    const launches = Array.isArray(data) ? data : data.launches || [];

    return launches.map((item: any) => ({
      contractAddress: item.contractAddress || item.address,
      name: item.name,
      symbol: item.symbol,
      totalSupply: item.totalSupply || '0',
      agentWallet: item.agentWallet || wallet,
      platform: item.source || item.platform || 'moltbook',
      launchedAt: item.launchedAt || Date.now(),
      agentEns: item.agentEns,
      pool: item.pool
        ? {
            poolId: item.pool.poolId,
            lpTokenAddress: item.pool.lpTokenAddress,
          }
        : undefined,
    }));
  }

  private parseAnalyticsResponse(data: any, address: Address): TokenAnalytics {
    return {
      contractAddress: address,
      priceEth: data.priceEth || '0',
      priceUsd: data.priceUsd || '0',
      marketCapUsd: data.marketCapUsd || '0',
      volume24hUsd: data.volume24hUsd || '0',
      priceChange24h: data.priceChange24h || 0,
      holderCount: data.holderCount || 0,
      totalFeesWeth: data.totalFeesWeth,
    };
  }
}

/**
 * Create a ClawnchService instance
 */
export function createClawnchService(moltbookKey?: string): ClawnchService {
  return new ClawnchService(moltbookKey);
}

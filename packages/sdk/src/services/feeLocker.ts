/**
 * ClankerFeeLocker Service
 *
 * Service for interacting with Clanker's FeeLocker contract to check and claim
 * accumulated trading fees for tokens launched via Clawnch.
 *
 * Fee Structure:
 * - WETH fees: From LP trading activity (80% to token launcher, 20% to Clawnch)
 * - Token fees: In the token's native units
 *
 * @see PIVOT_SUMMARY.md - Meta-treasury manager pivot
 */

import {
  type Address,
  type PublicClient,
  type WalletClient,
  getContract,
  formatEther,
} from 'viem';

// ClankerFeeLocker contract address on Base Sepolia
export const FEE_LOCKER_ADDRESS = '0x42A95190B4088C88Dd904d930c79deC1158bF09D' as const;

// WETH address on Base
export const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as const;

/**
 * ClankerFeeLocker ABI (minimal interface for fee operations)
 */
export const ClankerFeeLockerABI = [
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
  // Events
  {
    name: 'FeesClaimed',
    type: 'event',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'wallet', type: 'address', indexed: true },
      { name: 'wethAmount', type: 'uint256', indexed: false },
      { name: 'tokenAmount', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * Fee information for a single token
 */
export interface TokenFeeInfo {
  /** Token contract address */
  token: Address;
  /** Token symbol */
  symbol?: string;
  /** Available WETH fees (wei) */
  wethFees: bigint;
  /** Available WETH fees (formatted) */
  wethFeesFormatted: string;
  /** Available token fees (wei) */
  tokenFees: bigint;
  /** Estimated USD value of WETH fees */
  wethFeesUsd?: string;
}

/**
 * Aggregate fee information across multiple tokens
 */
export interface AggregateFeeInfo {
  /** Total WETH fees across all tokens (wei) */
  totalWethFees: bigint;
  /** Total WETH fees (formatted) */
  totalWethFeesFormatted: string;
  /** Estimated total USD value */
  totalWethFeesUsd?: string;
  /** Number of tokens with fees */
  tokensWithFees: number;
  /** Individual token fee info */
  tokens: TokenFeeInfo[];
}

/**
 * Claim result
 */
export interface ClaimResult {
  /** Transaction hash */
  transactionHash: `0x${string}`;
  /** Tokens claimed */
  tokensClaimed: Address[];
  /** Total WETH claimed (estimated) */
  totalWethClaimed?: bigint;
}

/**
 * FeeLockerService provides methods to check and claim fees from ClankerFeeLocker
 */
export class FeeLockerService {
  private publicClient: PublicClient;
  private walletClient?: WalletClient;
  private contract: ReturnType<typeof getContract>;
  private ethPriceUsd: number = 3000; // Default ETH price, can be updated

  /**
   * Create a new FeeLockerService instance
   *
   * @param publicClient Viem public client for read operations
   * @param walletClient Optional wallet client for write operations (claiming)
   * @param feeLockerAddress Optional custom FeeLocker address (defaults to Base Sepolia)
   */
  constructor(
    publicClient: PublicClient,
    walletClient?: WalletClient,
    feeLockerAddress: Address = FEE_LOCKER_ADDRESS
  ) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.contract = getContract({
      address: feeLockerAddress,
      abi: ClankerFeeLockerABI,
      client: { public: publicClient, wallet: walletClient },
    });
  }

  /**
   * Set ETH price in USD for fee estimation
   */
  setEthPrice(priceUsd: number): void {
    this.ethPriceUsd = priceUsd;
  }

  /**
   * Get available WETH fees for a token
   *
   * @param token Token contract address
   * @param wallet Wallet that receives the fees
   * @returns WETH fees in wei
   */
  async getAvailableWethFees(token: Address, wallet: Address): Promise<bigint> {
    return this.contract.read.availableWethFees([token, wallet]) as Promise<bigint>;
  }

  /**
   * Get available token fees for a token
   *
   * @param token Token contract address
   * @param wallet Wallet that receives the fees
   * @returns Token fees in wei
   */
  async getAvailableTokenFees(token: Address, wallet: Address): Promise<bigint> {
    return this.contract.read.availableTokenFees([token, wallet]) as Promise<bigint>;
  }

  /**
   * Get fee info for a single token
   *
   * @param token Token contract address
   * @param wallet Wallet that receives the fees
   * @param symbol Optional token symbol for display
   * @returns Token fee information
   */
  async getTokenFeeInfo(
    token: Address,
    wallet: Address,
    symbol?: string
  ): Promise<TokenFeeInfo> {
    const [wethFees, tokenFees] = await Promise.all([
      this.getAvailableWethFees(token, wallet),
      this.getAvailableTokenFees(token, wallet),
    ]);

    const wethFeesFormatted = formatEther(wethFees);
    const wethFeesUsd = (parseFloat(wethFeesFormatted) * this.ethPriceUsd).toFixed(2);

    return {
      token,
      symbol,
      wethFees,
      wethFeesFormatted,
      tokenFees,
      wethFeesUsd: `$${wethFeesUsd}`,
    };
  }

  /**
   * Get aggregate fees across multiple tokens
   *
   * @param tokens Array of token addresses (or objects with address and symbol)
   * @param wallet Wallet that receives the fees
   * @returns Aggregate fee information
   */
  async getAggregateFees(
    tokens: (Address | { address: Address; symbol?: string })[],
    wallet: Address
  ): Promise<AggregateFeeInfo> {
    const tokenInfoPromises = tokens.map(t => {
      const address = typeof t === 'string' ? t : t.address;
      const symbol = typeof t === 'string' ? undefined : t.symbol;
      return this.getTokenFeeInfo(address, wallet, symbol);
    });

    const tokenInfos = await Promise.all(tokenInfoPromises);

    let totalWethFees = 0n;
    let tokensWithFees = 0;

    for (const info of tokenInfos) {
      totalWethFees += info.wethFees;
      if (info.wethFees > 0n || info.tokenFees > 0n) {
        tokensWithFees++;
      }
    }

    const totalWethFeesFormatted = formatEther(totalWethFees);
    const totalWethFeesUsd = (parseFloat(totalWethFeesFormatted) * this.ethPriceUsd).toFixed(2);

    return {
      totalWethFees,
      totalWethFeesFormatted,
      totalWethFeesUsd: `$${totalWethFeesUsd}`,
      tokensWithFees,
      tokens: tokenInfos,
    };
  }

  /**
   * Claim fees for a single token
   * Requires wallet client to be configured
   *
   * @param token Token contract address
   * @returns Transaction hash
   * @throws Error if wallet client not configured
   */
  async claimFees(token: Address): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for claiming fees');
    }

    const hash = await this.contract.write.claim([token]);
    return hash as `0x${string}`;
  }

  /**
   * Claim fees for multiple tokens in a single transaction
   * Requires wallet client to be configured
   *
   * @param tokens Array of token addresses
   * @returns Claim result with transaction hash
   * @throws Error if wallet client not configured
   */
  async claimAllFees(tokens: Address[]): Promise<ClaimResult> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for claiming fees');
    }

    // Get current fees before claiming (for reporting)
    const wallet = this.walletClient.account?.address;
    let totalWethClaimed: bigint | undefined;

    if (wallet) {
      const aggregate = await this.getAggregateFees(tokens, wallet);
      totalWethClaimed = aggregate.totalWethFees;
    }

    const hash = await this.contract.write.claimAll([tokens]);

    return {
      transactionHash: hash as `0x${string}`,
      tokensClaimed: tokens,
      totalWethClaimed,
    };
  }

  /**
   * Check if any tokens have claimable fees above a threshold
   *
   * @param tokens Array of token addresses
   * @param wallet Wallet that receives the fees
   * @param minWethThreshold Minimum WETH threshold in wei (default: 0.01 WETH)
   * @returns Tokens with fees above threshold
   */
  async getClaimableTokens(
    tokens: Address[],
    wallet: Address,
    minWethThreshold: bigint = 10n ** 16n // 0.01 WETH
  ): Promise<Address[]> {
    const claimable: Address[] = [];

    for (const token of tokens) {
      const wethFees = await this.getAvailableWethFees(token, wallet);
      if (wethFees >= minWethThreshold) {
        claimable.push(token);
      }
    }

    return claimable;
  }
}

/**
 * Create a FeeLockerService instance
 */
export function createFeeLockerService(
  publicClient: PublicClient,
  walletClient?: WalletClient,
  feeLockerAddress?: Address
): FeeLockerService {
  return new FeeLockerService(publicClient, walletClient, feeLockerAddress);
}

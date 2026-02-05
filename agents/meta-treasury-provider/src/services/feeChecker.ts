/**
 * Fee Checker Service
 *
 * Checks available fees from ClankerFeeLocker for user's tokens.
 */

import { createPublicClient, http, type Address, type PublicClient } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { TokenFeeInfo, AggregateFeeInfo } from '../types';

// ClankerFeeLocker contract address on Base Sepolia
const FEE_LOCKER_ADDRESS = '0x42A95190B4088C88Dd904d930c79deC1158bF09D' as const;

// Minimal ABI for fee checking
const FEE_LOCKER_ABI = [
  {
    name: 'availableWethFees',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'availableTokenFees',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;

/**
 * FeeChecker service for checking available fees
 */
export class FeeChecker {
  private client: PublicClient;

  constructor(rpcUrl: string) {
    this.client = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });
  }

  /**
   * Get available WETH fees for a token
   */
  async getAvailableWethFees(token: Address, wallet: Address): Promise<bigint> {
    try {
      const result = await this.client.readContract({
        address: FEE_LOCKER_ADDRESS,
        abi: FEE_LOCKER_ABI,
        functionName: 'availableWethFees',
        args: [token, wallet],
      });
      return result;
    } catch (error) {
      console.error(`[FeeChecker] Error getting WETH fees for ${token}:`, error);
      return 0n;
    }
  }

  /**
   * Get available token fees
   */
  async getAvailableTokenFees(token: Address, wallet: Address): Promise<bigint> {
    try {
      const result = await this.client.readContract({
        address: FEE_LOCKER_ADDRESS,
        abi: FEE_LOCKER_ABI,
        functionName: 'availableTokenFees',
        args: [token, wallet],
      });
      return result;
    } catch (error) {
      console.error(`[FeeChecker] Error getting token fees for ${token}:`, error);
      return 0n;
    }
  }

  /**
   * Get fee info for a single token
   */
  async getTokenFeeInfo(token: Address, wallet: Address): Promise<TokenFeeInfo> {
    const [wethFees, tokenFees] = await Promise.all([
      this.getAvailableWethFees(token, wallet),
      this.getAvailableTokenFees(token, wallet),
    ]);

    return {
      token,
      wethFees,
      tokenFees,
    };
  }

  /**
   * Get aggregate fee info for multiple tokens
   */
  async getAggregateFees(tokens: Address[], wallet: Address): Promise<AggregateFeeInfo> {
    const feeInfos = await Promise.all(
      tokens.map(token => this.getTokenFeeInfo(token, wallet))
    );

    const totalWethFees = feeInfos.reduce(
      (sum, info) => sum + info.wethFees,
      0n
    );

    return {
      totalWethFees,
      tokens: feeInfos,
    };
  }

  /**
   * Filter tokens that have fees above threshold
   */
  async getClaimableTokens(
    tokens: Address[],
    wallet: Address,
    minWethThreshold: bigint = 10n ** 16n // 0.01 WETH default
  ): Promise<Address[]> {
    const feeInfos = await Promise.all(
      tokens.map(token => this.getTokenFeeInfo(token, wallet))
    );

    return feeInfos
      .filter(info => info.wethFees >= minWethThreshold)
      .map(info => info.token);
  }
}

/**
 * Create a FeeChecker instance
 */
export function createFeeChecker(rpcUrl: string): FeeChecker {
  return new FeeChecker(rpcUrl);
}

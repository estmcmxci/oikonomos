/**
 * Policy Executor Service
 *
 * Executes management policies by calling the DelegationRouter contract.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type PublicClient,
  type WalletClient,
  type Account,
  parseEther,
  formatEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import type { ManagementPolicy, ExecuteResponse } from '../types';

// DelegationRouter contract address (to be updated after deployment)
const DELEGATION_ROUTER_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// DelegationRouter ABI (minimal for execution)
const DELEGATION_ROUTER_ABI = [
  {
    name: 'executeManagement',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      {
        name: 'policy',
        type: 'tuple',
        components: [
          { name: 'compoundPercentage', type: 'uint256' },
          { name: 'toStablesPercentage', type: 'uint256' },
          { name: 'holdPercentage', type: 'uint256' },
          { name: 'maxSlippageBps', type: 'uint256' },
        ],
      },
    ],
    outputs: [],
  },
  {
    name: 'canExecuteManagement',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'isDelegationActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * PolicyExecutor service for executing management policies
 */
export class PolicyExecutor {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private account: Account;
  private routerAddress: Address;

  constructor(rpcUrl: string, privateKey: string, routerAddress?: Address) {
    this.account = privateKeyToAccount(privateKey as `0x${string}`);
    this.routerAddress = routerAddress || DELEGATION_ROUTER_ADDRESS;

    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });
  }

  /**
   * Get provider wallet address
   */
  getProviderAddress(): Address {
    return this.account.address;
  }

  /**
   * Check if delegation is active for a user
   */
  async isDelegationActive(userWallet: Address): Promise<boolean> {
    try {
      const result = await this.publicClient.readContract({
        address: this.routerAddress,
        abi: DELEGATION_ROUTER_ABI,
        functionName: 'isDelegationActive',
        args: [userWallet],
      });
      return result;
    } catch (error) {
      console.error('[PolicyExecutor] Error checking delegation:', error);
      return false;
    }
  }

  /**
   * Check if management can be executed for a user
   */
  async canExecuteManagement(userWallet: Address): Promise<boolean> {
    try {
      const result = await this.publicClient.readContract({
        address: this.routerAddress,
        abi: DELEGATION_ROUTER_ABI,
        functionName: 'canExecuteManagement',
        args: [userWallet],
      });
      return result;
    } catch (error) {
      console.error('[PolicyExecutor] Error checking canExecute:', error);
      return false;
    }
  }

  /**
   * Execute management policy for a user
   */
  async executeManagement(
    userWallet: Address,
    policy: ManagementPolicy
  ): Promise<ExecuteResponse> {
    try {
      // Convert policy to contract format
      const contractPolicy = {
        compoundPercentage: BigInt(policy.wethStrategy.compound),
        toStablesPercentage: BigInt(policy.wethStrategy.toStables),
        holdPercentage: BigInt(policy.wethStrategy.hold),
        maxSlippageBps: BigInt(policy.maxSlippageBps),
      };

      // Validate percentages add up to 100
      const total =
        policy.wethStrategy.compound +
        policy.wethStrategy.toStables +
        policy.wethStrategy.hold;

      if (total !== 100) {
        return {
          success: false,
          error: `Policy percentages must sum to 100, got ${total}`,
        };
      }

      // Check if we can execute
      const canExecute = await this.canExecuteManagement(userWallet);
      if (!canExecute) {
        return {
          success: false,
          error: 'Cannot execute management: delegation inactive or too soon',
        };
      }

      // Simulate the transaction first
      const { request } = await this.publicClient.simulateContract({
        address: this.routerAddress,
        abi: DELEGATION_ROUTER_ABI,
        functionName: 'executeManagement',
        args: [userWallet, contractPolicy],
        account: this.account,
      });

      // Execute the transaction
      const hash = await this.walletClient.writeContract(request);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === 'success') {
        return {
          success: true,
          transactionHash: hash,
          // TODO: Parse logs to get actual claimed amounts
        };
      } else {
        return {
          success: false,
          transactionHash: hash,
          error: 'Transaction reverted',
        };
      }
    } catch (error) {
      console.error('[PolicyExecutor] Error executing management:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Estimate gas for management execution
   */
  async estimateGas(
    userWallet: Address,
    policy: ManagementPolicy
  ): Promise<bigint> {
    try {
      const contractPolicy = {
        compoundPercentage: BigInt(policy.wethStrategy.compound),
        toStablesPercentage: BigInt(policy.wethStrategy.toStables),
        holdPercentage: BigInt(policy.wethStrategy.hold),
        maxSlippageBps: BigInt(policy.maxSlippageBps),
      };

      const gas = await this.publicClient.estimateContractGas({
        address: this.routerAddress,
        abi: DELEGATION_ROUTER_ABI,
        functionName: 'executeManagement',
        args: [userWallet, contractPolicy],
        account: this.account,
      });

      return gas;
    } catch (error) {
      console.error('[PolicyExecutor] Error estimating gas:', error);
      // Return a reasonable default
      return 500000n;
    }
  }
}

/**
 * Create a PolicyExecutor instance
 */
export function createPolicyExecutor(
  rpcUrl: string,
  privateKey: string,
  routerAddress?: Address
): PolicyExecutor {
  return new PolicyExecutor(rpcUrl, privateKey, routerAddress);
}

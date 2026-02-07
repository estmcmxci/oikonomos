// OIK-67: EIP-712 Delegation Signing + DelegationRouter Submission
// Signs a delegation allowing the treasury agent to claim fees on behalf of a DeFi agent

import {
  createWalletClient,
  createPublicClient,
  http,
  getContract,
  keccak256,
  encodePacked,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Env } from '../index';
import { getChain } from '../config/chain';

// Minimal DelegationRouter ABI
const DelegationRouterABI = [
  {
    name: 'createDelegation',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'provider', type: 'address' },
      { name: 'tokens', type: 'address[]' },
      { name: 'claimFrequency', type: 'uint256' },
      { name: 'providerFeeBps', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'nonces',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export interface DelegationParams {
  agentPrivateKey: Hex;
  agentAddress: Address;
  providerAddress: Address;
  tokens: Address[];
  claimFrequency?: number;   // Default: 300 (5 min, matches cron)
  providerFeeBps?: number;   // Default: 1000 (10%, contract MAX_PROVIDER_FEE_BPS)
  deadlineSeconds?: number;  // Default: 30 days
}

export interface DelegationResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Sign an EIP-712 delegation and submit it to the DelegationRouter contract.
 *
 * The DeFi agent (user) delegates fee-claiming rights to the treasury agent (provider).
 * The contract's DELEGATION_TYPEHASH uses `bytes32 tokensHash` (pre-hashed), not `address[] tokens`.
 */
export async function signAndSubmitDelegation(
  env: Env,
  params: DelegationParams
): Promise<DelegationResult> {
  const {
    agentPrivateKey,
    agentAddress,
    providerAddress,
    tokens,
    claimFrequency = 300,
    providerFeeBps = 1000,
    deadlineSeconds = 30 * 24 * 60 * 60, // 30 days
  } = params;

  const delegationRouter = env.DELEGATION_ROUTER as Address;
  if (!delegationRouter) {
    return { success: false, error: 'DELEGATION_ROUTER not configured' };
  }

  try {
    const chain = getChain(env);
    const chainId = parseInt(env.CHAIN_ID);
    const account = privateKeyToAccount(agentPrivateKey);

    const publicClient = createPublicClient({
      chain,
      transport: http(env.RPC_URL),
    });

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(env.RPC_URL),
    });

    const contract = getContract({
      address: delegationRouter,
      abi: DelegationRouterABI,
      client: { public: publicClient, wallet: walletClient },
    });

    // 1. Read current nonce
    const nonce = await contract.read.nonces([agentAddress]);

    // 2. Compute deadline
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineSeconds);

    // 3. Compute tokensHash = keccak256(abi.encodePacked(tokens))
    const tokensHash = keccak256(
      encodePacked(
        tokens.map(() => 'address' as const),
        tokens
      )
    );

    // 4. Build EIP-712 typed data
    const typedData = {
      domain: {
        name: 'OikonomosDelegation',
        version: '1',
        chainId,
        verifyingContract: delegationRouter,
      },
      types: {
        Delegation: [
          { name: 'user', type: 'address' },
          { name: 'provider', type: 'address' },
          { name: 'tokensHash', type: 'bytes32' },
          { name: 'claimFrequency', type: 'uint256' },
          { name: 'providerFeeBps', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
        ],
      },
      primaryType: 'Delegation' as const,
      message: {
        user: agentAddress,
        provider: providerAddress,
        tokensHash,
        claimFrequency: BigInt(claimFrequency),
        providerFeeBps: BigInt(providerFeeBps),
        deadline,
        nonce,
      },
    };

    // 5. Sign with agent's key
    const signature = await walletClient.signTypedData({
      account,
      ...typedData,
    });

    console.log(`[delegation] Signing delegation: user=${agentAddress}, provider=${providerAddress}, tokens=${tokens.join(',')}`);

    // 6. Submit to DelegationRouter
    const txHash = await contract.write.createDelegation([
      agentAddress,
      providerAddress,
      tokens,
      BigInt(claimFrequency),
      BigInt(providerFeeBps),
      deadline,
      signature,
    ]);

    // 7. Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === 'reverted') {
      return { success: false, txHash, error: 'Transaction reverted' };
    }

    console.log(`[delegation] Delegation created: tx=${txHash}`);

    return { success: true, txHash };
  } catch (error) {
    console.error('[delegation] Error:', error);
    return { success: false, error: String(error) };
  }
}

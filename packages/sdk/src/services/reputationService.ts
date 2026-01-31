import { type Address, type PublicClient, type WalletClient } from 'viem';
import { giveFeedback, type FeedbackParams } from '../contracts/reputationRegistry';
import { getERC8004Addresses } from '@oikonomos/shared';

export interface ExecutionReceiptData {
  strategyId: `0x${string}`;
  quoteId: `0x${string}`;
  sender: Address;
  amount0: bigint;
  amount1: bigint;
  actualSlippage: bigint;
  policyCompliant: boolean;
  timestamp: bigint;
  transactionHash: `0x${string}`;
}

export interface ReputationServiceConfig {
  chainId: number;
  walletClient: WalletClient;
  publicClient: PublicClient;
  resolveAgentId: (strategyId: `0x${string}`) => Promise<bigint | null>;
}

export function calculateSlippageScore(actualSlippage: bigint, maxSlippage: bigint = 1000n): number {
  if (actualSlippage === 0n) return 100;
  if (actualSlippage >= maxSlippage) return 0;
  const score = Number(100n - (actualSlippage * 100n / maxSlippage));
  return Math.max(0, Math.min(100, score));
}

export async function submitReceiptFeedback(
  config: ReputationServiceConfig,
  receipt: ExecutionReceiptData
): Promise<{ slippageTx: `0x${string}`; complianceTx: `0x${string}` } | null> {
  const agentId = await config.resolveAgentId(receipt.strategyId);
  if (agentId === null) {
    console.warn(`No agentId found for strategyId ${receipt.strategyId}`);
    return null;
  }

  const addresses = getERC8004Addresses(config.chainId);
  const registryAddress = addresses.REPUTATION_REGISTRY as Address;

  const slippageScore = calculateSlippageScore(receipt.actualSlippage);

  const slippageTx = await giveFeedback(config.walletClient, registryAddress, {
    agentId,
    value: BigInt(slippageScore),
    valueDecimals: 0,
    tag1: 'execution',
    tag2: 'slippage',
    feedbackURI: `tx:${receipt.transactionHash}`,
  });

  const complianceTx = await giveFeedback(config.walletClient, registryAddress, {
    agentId,
    value: receipt.policyCompliant ? 100n : 0n,
    valueDecimals: 0,
    tag1: 'compliance',
    tag2: 'policy',
    feedbackURI: `tx:${receipt.transactionHash}`,
  });

  return { slippageTx, complianceTx };
}

export async function batchSubmitReceiptFeedback(
  config: ReputationServiceConfig,
  receipts: ExecutionReceiptData[]
): Promise<Map<`0x${string}`, { slippageTx: `0x${string}`; complianceTx: `0x${string}` } | null>> {
  const results = new Map<`0x${string}`, { slippageTx: `0x${string}`; complianceTx: `0x${string}` } | null>();

  for (const receipt of receipts) {
    const result = await submitReceiptFeedback(config, receipt);
    results.set(receipt.transactionHash, result);
  }

  return results;
}

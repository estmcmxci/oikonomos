import { type Address, type PublicClient, type WalletClient, decodeEventLog, type Log, keccak256, toBytes } from 'viem';
import { ReputationRegistryABI } from '@oikonomos/shared';

export { ReputationRegistryABI };

export interface FeedbackSummary {
  count: bigint;
  summaryValue: bigint;
  summaryValueDecimals: number;
}

export interface FeedbackEntry {
  value: bigint;
  valueDecimals: number;
  tag1: string;
  tag2: string;
  isRevoked: boolean;
}

export interface FeedbackParams {
  agentId: bigint;
  value: bigint;
  valueDecimals: number;
  tag1: string;
  tag2: string;
  endpoint?: string;
  feedbackURI?: string;
  feedbackHash?: `0x${string}`;
}

export async function giveFeedback(
  walletClient: WalletClient,
  registryAddress: Address,
  params: FeedbackParams
): Promise<`0x${string}`> {
  const [account] = await walletClient.getAddresses();

  const feedbackHash = params.feedbackHash ??
    keccak256(toBytes(`${params.agentId}-${params.tag1}-${params.tag2}-${Date.now()}`));

  const hash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: registryAddress,
    abi: ReputationRegistryABI,
    functionName: 'giveFeedback',
    args: [
      params.agentId,
      params.value,
      params.valueDecimals,
      params.tag1,
      params.tag2,
      params.endpoint ?? '',
      params.feedbackURI ?? '',
      feedbackHash,
    ],
  });

  return hash;
}

export async function getSummary(
  client: PublicClient,
  registryAddress: Address,
  agentId: bigint,
  clientAddresses: Address[],
  tag1: string,
  tag2: string
): Promise<FeedbackSummary> {
  const result = await client.readContract({
    address: registryAddress,
    abi: ReputationRegistryABI,
    functionName: 'getSummary',
    args: [agentId, clientAddresses, tag1, tag2],
  }) as [bigint, bigint, number];

  return {
    count: result[0],
    summaryValue: result[1],
    summaryValueDecimals: result[2],
  };
}

export async function readFeedback(
  client: PublicClient,
  registryAddress: Address,
  agentId: bigint,
  clientAddress: Address,
  feedbackIndex: bigint
): Promise<FeedbackEntry> {
  const result = await client.readContract({
    address: registryAddress,
    abi: ReputationRegistryABI,
    functionName: 'readFeedback',
    args: [agentId, clientAddress, feedbackIndex],
  }) as [bigint, number, string, string, boolean];

  return {
    value: result[0],
    valueDecimals: result[1],
    tag1: result[2],
    tag2: result[3],
    isRevoked: result[4],
  };
}

export async function getClients(
  client: PublicClient,
  registryAddress: Address,
  agentId: bigint
): Promise<Address[]> {
  const result = await client.readContract({
    address: registryAddress,
    abi: ReputationRegistryABI,
    functionName: 'getClients',
    args: [agentId],
  });

  return result as Address[];
}

export async function revokeFeedback(
  walletClient: WalletClient,
  registryAddress: Address,
  agentId: bigint,
  feedbackIndex: bigint
): Promise<`0x${string}`> {
  const [account] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address: registryAddress,
    abi: ReputationRegistryABI,
    functionName: 'revokeFeedback',
    args: [agentId, feedbackIndex],
  });

  return hash;
}

export function decodeNewFeedbackLog(log: Log): {
  agentId: bigint;
  clientAddress: Address;
  feedbackIndex: bigint;
  value: bigint;
  valueDecimals: number;
  tag1: string;
  tag2: string;
} {
  const decoded = decodeEventLog({
    abi: ReputationRegistryABI,
    eventName: 'NewFeedback',
    data: log.data,
    topics: log.topics,
  });

  return {
    agentId: decoded.args.agentId as bigint,
    clientAddress: decoded.args.clientAddress as Address,
    feedbackIndex: decoded.args.feedbackIndex as bigint,
    value: decoded.args.value as bigint,
    valueDecimals: decoded.args.valueDecimals as number,
    tag1: decoded.args.tag1 as string,
    tag2: decoded.args.tag2 as string,
  };
}

export interface ExecutionFeedbackParams {
  agentId: bigint;
  slippageScore: number;
  policyCompliant: boolean;
  feedbackURI?: string;
  feedbackHash?: `0x${string}`;
}

export async function submitExecutionFeedback(
  walletClient: WalletClient,
  registryAddress: Address,
  params: ExecutionFeedbackParams
): Promise<{ slippageTx: `0x${string}`; complianceTx: `0x${string}` }> {
  const slippageTx = await giveFeedback(walletClient, registryAddress, {
    agentId: params.agentId,
    value: BigInt(params.slippageScore),
    valueDecimals: 0,
    tag1: 'execution',
    tag2: 'slippage',
    feedbackURI: params.feedbackURI,
    feedbackHash: params.feedbackHash,
  });

  const complianceTx = await giveFeedback(walletClient, registryAddress, {
    agentId: params.agentId,
    value: params.policyCompliant ? 100n : 0n,
    valueDecimals: 0,
    tag1: 'compliance',
    tag2: 'policy',
    feedbackURI: params.feedbackURI,
  });

  return { slippageTx, complianceTx };
}

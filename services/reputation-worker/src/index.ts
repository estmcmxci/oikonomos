/**
 * Reputation Submission Worker
 *
 * Polls the Ponder indexer for new ExecutionReceipt events and submits
 * feedback to the canonical ERC-8004 ReputationRegistry.
 *
 * Architecture:
 * - Cron trigger every 5 minutes
 * - Fetches unprocessed receipts from indexer
 * - Resolves strategyId → agentId
 * - Submits slippage + compliance feedback
 * - Tracks processed receipts in KV
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
  keccak256,
  toBytes,
} from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { ReputationRegistryABI } from './abi';

export interface Env {
  CHAIN_ID: string;
  INDEXER_URL: string;
  REPUTATION_REGISTRY: string;
  TREASURY_AGENT_ID: string;
  STRATEGY_AGENT_ID: string;
  PRIVATE_KEY: string;
  RPC_URL: string;
  REPUTATION_KV: KVNamespace;
}

interface ExecutionReceipt {
  id: string;
  strategyId: Hex;
  quoteId: Hex;
  user: Address;
  router: Address;
  amount0: string;
  amount1: string;
  actualSlippage: string;
  policyCompliant: boolean;
  timestamp: string;
  blockNumber: string;
  transactionHash: Hex;
}

interface IndexerResponse {
  items: ExecutionReceipt[];
}

const STRATEGY_ID_TO_AGENT: Record<string, string> = {
  // Default strategy IDs used by treasury-agent
  '0x0000000000000000000000000000000000000000000000000000000000000001': '731', // Treasury
  '0x0000000000000000000000000000000000000000000000000000000000000002': '732', // Strategy
};

function calculateSlippageScore(actualSlippage: bigint, maxSlippage: bigint = 1000n): number {
  if (actualSlippage === 0n) return 100;
  if (actualSlippage >= maxSlippage) return 0;
  const score = Number(100n - (actualSlippage * 100n) / maxSlippage);
  return Math.max(0, Math.min(100, score));
}

async function fetchUnprocessedReceipts(
  env: Env,
  lastProcessedId: string | null
): Promise<ExecutionReceipt[]> {
  const url = new URL(`${env.INDEXER_URL}/receipts`);
  url.searchParams.set('limit', '50');
  url.searchParams.set('orderDirection', 'asc');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Indexer request failed: ${response.status}`);
  }

  const data = (await response.json()) as IndexerResponse;

  // Filter out already processed receipts
  if (lastProcessedId) {
    const lastIndex = data.items.findIndex((r) => r.id === lastProcessedId);
    if (lastIndex !== -1) {
      return data.items.slice(lastIndex + 1);
    }
  }

  return data.items;
}

async function submitFeedback(
  env: Env,
  receipt: ExecutionReceipt
): Promise<{ slippageTx: Hex; complianceTx: Hex } | null> {
  // Resolve strategyId to agentId
  const agentIdStr = STRATEGY_ID_TO_AGENT[receipt.strategyId.toLowerCase()];
  if (!agentIdStr) {
    console.warn(`Unknown strategyId: ${receipt.strategyId}`);
    return null;
  }

  const agentId = BigInt(agentIdStr);
  const account = privateKeyToAccount(env.PRIVATE_KEY as Hex);

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  const registryAddress = env.REPUTATION_REGISTRY as Address;
  const slippageScore = calculateSlippageScore(BigInt(receipt.actualSlippage));

  // Submit slippage feedback
  const slippageFeedbackHash = keccak256(
    toBytes(`${receipt.transactionHash}-slippage-${Date.now()}`)
  );

  const slippageTx = await walletClient.writeContract({
    address: registryAddress,
    abi: ReputationRegistryABI,
    functionName: 'giveFeedback',
    args: [
      agentId,
      BigInt(slippageScore),
      0, // decimals
      'execution',
      'slippage',
      '', // endpoint
      `tx:${receipt.transactionHash}`,
      slippageFeedbackHash,
    ],
  });

  console.log(`Submitted slippage feedback for ${receipt.id}: ${slippageTx}`);

  // Submit compliance feedback
  const complianceFeedbackHash = keccak256(
    toBytes(`${receipt.transactionHash}-compliance-${Date.now()}`)
  );

  const complianceTx = await walletClient.writeContract({
    address: registryAddress,
    abi: ReputationRegistryABI,
    functionName: 'giveFeedback',
    args: [
      agentId,
      receipt.policyCompliant ? 100n : 0n,
      0, // decimals
      'compliance',
      'policy',
      '', // endpoint
      `tx:${receipt.transactionHash}`,
      complianceFeedbackHash,
    ],
  });

  console.log(`Submitted compliance feedback for ${receipt.id}: ${complianceTx}`);

  return { slippageTx, complianceTx };
}

async function processReceipts(env: Env): Promise<{ processed: number; errors: number }> {
  // Get last processed receipt ID from KV
  const lastProcessedId = await env.REPUTATION_KV.get('lastProcessedReceiptId');

  // Fetch unprocessed receipts
  const receipts = await fetchUnprocessedReceipts(env, lastProcessedId);
  console.log(`Found ${receipts.length} unprocessed receipts`);

  if (receipts.length === 0) {
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;

  for (const receipt of receipts) {
    try {
      // Check if already processed (belt and suspenders)
      const isProcessed = await env.REPUTATION_KV.get(`receipt:${receipt.id}`);
      if (isProcessed) {
        console.log(`Receipt ${receipt.id} already processed, skipping`);
        continue;
      }

      const result = await submitFeedback(env, receipt);

      if (result) {
        // Mark as processed
        await env.REPUTATION_KV.put(`receipt:${receipt.id}`, JSON.stringify(result), {
          expirationTtl: 60 * 60 * 24 * 30, // 30 days
        });

        // Update last processed ID
        await env.REPUTATION_KV.put('lastProcessedReceiptId', receipt.id);

        processed++;
      }
    } catch (error) {
      console.error(`Error processing receipt ${receipt.id}:`, error);
      errors++;
    }
  }

  return { processed, errors };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Manual trigger (for testing)
    if (url.pathname === '/process' && request.method === 'POST') {
      try {
        const result = await processReceipts(env);
        return new Response(JSON.stringify({ success: true, ...result }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Status endpoint
    if (url.pathname === '/status') {
      const lastProcessedId = await env.REPUTATION_KV.get('lastProcessedReceiptId');
      return new Response(
        JSON.stringify({
          lastProcessedReceiptId: lastProcessedId,
          reputationRegistry: env.REPUTATION_REGISTRY,
          indexerUrl: env.INDEXER_URL,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron triggered at ${new Date().toISOString()}`);
    ctx.waitUntil(processReceipts(env));
  },
};

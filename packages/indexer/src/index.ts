import { ponder } from 'ponder:registry';
import { executionReceipt, strategyMetrics, agent } from 'ponder:schema';
import { keccak256, toBytes } from 'viem';

// Treasury agent webhook URL (configurable via env)
const TREASURY_AGENT_WEBHOOK_URL = process.env.TREASURY_AGENT_WEBHOOK_URL;

/**
 * Dispatch webhook to treasury agent for ExecutionReceipt events
 * This enables the observation loop to react to on-chain events
 */
async function dispatchWebhook(
  eventType: string,
  eventId: string,
  data: Record<string, unknown>,
  chainId: number
): Promise<void> {
  if (!TREASURY_AGENT_WEBHOOK_URL) {
    // Webhook not configured, skip silently
    return;
  }

  try {
    const response = await fetch(`${TREASURY_AGENT_WEBHOOK_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [{ type: eventType, eventId, data }],
        chainId,
      }),
    });

    if (!response.ok) {
      console.error(`[webhook] Failed to dispatch ${eventType}: ${response.status}`);
    }
  } catch (error) {
    // Don't let webhook failures break indexing
    console.error(`[webhook] Error dispatching ${eventType}:`, error);
  }
}

/**
 * NOTE: Reputation Registry Integration (OIK-12)
 *
 * The Ponder indexer is read-only and cannot make transactions.
 * To submit feedback to the canonical ERC-8004 ReputationRegistry after
 * ExecutionReceipt events, use the SDK's reputationService in a separate
 * service/worker that:
 *
 * 1. Listens to the indexer API for new receipts, OR
 * 2. Subscribes directly to ReceiptHook:ExecutionReceipt events
 *
 * Example using the SDK:
 * ```typescript
 * import { submitReceiptFeedback, type ReputationServiceConfig } from '@oikonomos/sdk';
 *
 * const config: ReputationServiceConfig = {
 *   chainId: 11155111,
 *   walletClient,
 *   publicClient,
 *   resolveAgentId: async (strategyId) => {
 *     // Resolve strategyId -> agentId via ENS agent:erc8004 record
 *     // or query indexer for agent mapping
 *   },
 * };
 *
 * await submitReceiptFeedback(config, receiptData);
 * ```
 *
 * See: packages/sdk/src/services/reputationService.ts
 */

// Helper: Calculate absolute value for BigInt (OIK-8 code review fix)
function absBigInt(n: bigint): bigint {
  return n >= 0n ? n : -n;
}

// IPFS Gateway URL (configurable via env, defaults to public gateway)
const IPFS_GATEWAY_URL = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs';

/**
 * Compute strategyId from ENS name (OIK-38)
 * strategyId = keccak256(ensName)
 */
function computeStrategyId(ensName: string): `0x${string}` {
  return keccak256(toBytes(ensName));
}

/**
 * Fetch metadata from IPFS and extract ENS name (OIK-35)
 * Returns the ENS name if found, null otherwise
 */
async function fetchENSFromMetadata(agentURI: string): Promise<string | null> {
  if (!agentURI) return null;

  try {
    // Convert IPFS URI to gateway URL
    let url = agentURI;
    if (agentURI.startsWith('ipfs://')) {
      const cid = agentURI.replace('ipfs://', '');
      url = `${IPFS_GATEWAY_URL}/${cid}`;
    } else if (!agentURI.startsWith('http')) {
      // Assume it's a raw CID
      url = `${IPFS_GATEWAY_URL}/${agentURI}`;
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.warn(`[ipfs] Failed to fetch metadata from ${url}: ${response.status}`);
      return null;
    }

    const metadata = await response.json() as { ens?: string };
    return metadata.ens || null;
  } catch (error) {
    // Don't let IPFS failures break indexing
    console.warn(`[ipfs] Error fetching metadata from ${agentURI}:`, error);
    return null;
  }
}

// ReceiptHook handlers
ponder.on('ReceiptHook:ExecutionReceipt', async ({ event, context }) => {
  const receiptId = `${event.transaction.hash}-${event.log.logIndex}`;

  // Store the receipt
  await context.db.insert(executionReceipt).values({
    id: receiptId,
    strategyId: event.args.strategyId,
    quoteId: event.args.quoteId,
    user: event.args.user, // The actual user wallet (from hookData)
    router: event.args.router, // The router contract
    amount0: event.args.amount0,
    amount1: event.args.amount1,
    actualSlippage: event.args.actualSlippage,
    policyCompliant: event.args.policyCompliant,
    timestamp: event.args.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });

  // Update strategy metrics using upsert pattern
  const strategyIdKey = event.args.strategyId;

  // Volume calculation: sum of absolute values of both amounts
  // This captures total value moved regardless of swap direction
  const volume = absBigInt(event.args.amount0) + absBigInt(event.args.amount1);

  // Determine if execution was successful (policyCompliant is a good proxy for now)
  const isSuccess = event.args.policyCompliant;

  await context.db
    .insert(strategyMetrics)
    .values({
      id: strategyIdKey,
      totalExecutions: 1n,
      totalVolume: volume,
      // Store raw values for precise calculation on query
      slippageSum: event.args.actualSlippage,
      compliantCount: event.args.policyCompliant ? 1n : 0n,
      successCount: isSuccess ? 1n : 0n,
      lastExecutionAt: event.args.timestamp,
      // Legacy computed fields (for backwards compatibility)
      avgSlippage: event.args.actualSlippage,
      successRate: isSuccess ? 10000n : 0n,
      complianceRate: event.args.policyCompliant ? 10000n : 0n,
    })
    .onConflictDoUpdate((existing) => {
      const newTotalExecutions = existing.totalExecutions + 1n;
      const newSlippageSum = existing.slippageSum + event.args.actualSlippage;
      const newCompliantCount = existing.compliantCount + (event.args.policyCompliant ? 1n : 0n);
      const newSuccessCount = existing.successCount + (isSuccess ? 1n : 0n);

      return {
        totalExecutions: newTotalExecutions,
        totalVolume: existing.totalVolume + volume,
        // Store sums (calculate rates on query for precision)
        slippageSum: newSlippageSum,
        compliantCount: newCompliantCount,
        successCount: newSuccessCount,
        lastExecutionAt: event.args.timestamp,
        // Legacy computed fields (truncation still occurs, but sums are available for precise calc)
        avgSlippage: newSlippageSum / newTotalExecutions,
        successRate: (newSuccessCount * 10000n) / newTotalExecutions,
        complianceRate: (newCompliantCount * 10000n) / newTotalExecutions,
      };
    });

  // Dispatch webhook to treasury agent observation loop
  await dispatchWebhook(
    'ExecutionReceipt',
    receiptId,
    {
      user: event.args.user, // The actual user wallet
      router: event.args.router, // The router contract
      strategyId: event.args.strategyId,
      quoteId: event.args.quoteId,
      amount0: event.args.amount0.toString(),
      amount1: event.args.amount1.toString(),
      actualSlippage: event.args.actualSlippage.toString(),
      policyCompliant: event.args.policyCompliant,
      timestamp: event.args.timestamp.toString(),
      transactionHash: event.transaction.hash,
    },
    11155111 // Sepolia chain ID
  );
});

// Canonical ERC-8004 IdentityRegistry handlers (howto8004.com)
// Event: AgentRegistered(uint256 indexed agentId, address indexed owner, string agentURI)
ponder.on('IdentityRegistry:AgentRegistered', async ({ event, context }) => {
  // Fetch ENS name from IPFS metadata (OIK-35)
  const ens = await fetchENSFromMetadata(event.args.agentURI);

  // Compute strategyId from ENS name if available (OIK-38)
  const strategyId = ens ? computeStrategyId(ens) : null;

  await context.db.insert(agent).values({
    id: event.args.agentId.toString(),
    owner: event.args.owner,
    agentURI: event.args.agentURI,
    agentWallet: event.args.owner, // Initially same as owner
    ens, // ENS name from metadata (may be null)
    strategyId, // keccak256(ens) for dynamic resolution (OIK-38)
    registeredAt: event.block.timestamp,
  });

  if (ens) {
    console.log(`[agent] Registered agent ${event.args.agentId} with ENS: ${ens}, strategyId: ${strategyId}`);
  }
});

// Event: AgentWalletUpdated(uint256 indexed agentId, address oldWallet, address newWallet)
ponder.on('IdentityRegistry:AgentWalletUpdated', async ({ event, context }) => {
  await context.db
    .update(agent, { id: event.args.agentId.toString() })
    .set({
      agentWallet: event.args.newWallet,
    });
});

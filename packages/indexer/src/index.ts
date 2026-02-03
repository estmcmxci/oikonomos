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

// ERC-8004 Registration format
interface ERC8004Service {
  name: string;
  endpoint: string;
  version?: string;
}

interface ERC8004Registration {
  type?: string;
  name?: string;
  description?: string;
  services?: ERC8004Service[];
  ens?: string; // Legacy field for backwards compatibility
}

/**
 * Extract ENS name from ERC-8004 registration metadata (OIK-35, OIK-38)
 * Handles: data URIs (base64), IPFS URIs, and HTTP URLs
 * Extracts ENS from: services array (official) or top-level ens field (legacy)
 */
async function extractENSFromAgentURI(agentURI: string): Promise<string | null> {
  if (!agentURI) return null;

  try {
    let metadata: ERC8004Registration;

    // Handle data URI (base64 encoded JSON)
    if (agentURI.startsWith('data:application/json;base64,')) {
      const base64 = agentURI.replace('data:application/json;base64,', '');
      const json = Buffer.from(base64, 'base64').toString('utf-8');
      metadata = JSON.parse(json);
    }
    // Handle IPFS URI
    else if (agentURI.startsWith('ipfs://')) {
      const cid = agentURI.replace('ipfs://', '');
      const url = `${IPFS_GATEWAY_URL}/${cid}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        console.warn(`[metadata] Failed to fetch from IPFS: ${response.status}`);
        return null;
      }
      metadata = await response.json() as ERC8004Registration;
    }
    // Handle HTTP URL
    else if (agentURI.startsWith('http')) {
      const response = await fetch(agentURI, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        console.warn(`[metadata] Failed to fetch from URL: ${response.status}`);
        return null;
      }
      metadata = await response.json() as ERC8004Registration;
    }
    // Assume raw CID
    else {
      const url = `${IPFS_GATEWAY_URL}/${agentURI}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return null;
      metadata = await response.json() as ERC8004Registration;
    }

    // Extract ENS from services array (official ERC-8004 format)
    if (metadata.services) {
      const ensService = metadata.services.find(s => s.name === 'ENS');
      if (ensService?.endpoint) {
        return ensService.endpoint;
      }
    }

    // Fall back to legacy top-level ens field
    if (metadata.ens) {
      return metadata.ens;
    }

    return null;
  } catch (error) {
    console.warn(`[metadata] Error extracting ENS from ${agentURI.substring(0, 50)}...:`, error);
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
// Event: Registered(uint256 indexed agentId, string agentURI, address indexed owner)
ponder.on('IdentityRegistry:Registered', async ({ event, context }) => {
  // Extract ENS name from metadata (OIK-35, OIK-38)
  const ens = await extractENSFromAgentURI(event.args.agentURI);

  // Compute strategyId from ENS name if available (OIK-38)
  const strategyId = ens ? computeStrategyId(ens) : null;

  await context.db.insert(agent).values({
    id: event.args.agentId.toString(),
    owner: event.args.owner,
    agentURI: event.args.agentURI,
    agentWallet: event.args.owner, // Initially same as owner, updated via MetadataSet
    ens, // ENS name from metadata (may be null)
    strategyId, // keccak256(ens) for dynamic resolution (OIK-38)
    registeredAt: event.block.timestamp,
  });

  console.log(`[agent] Registered agent ${event.args.agentId}${ens ? ` with ENS: ${ens}, strategyId: ${strategyId}` : ''}`);
});

// Event: MetadataSet - handles agentWallet updates
// Uses upsert pattern since MetadataSet can fire for agents registered before start block
ponder.on('IdentityRegistry:MetadataSet', async ({ event, context }) => {
  // Check if this is an agentWallet update
  if (event.args.metadataKey === 'agentWallet') {
    // metadataValue is the wallet address encoded as bytes
    const walletAddress = ('0x' + event.args.metadataValue.slice(2).slice(0, 40)) as `0x${string}`;

    await context.db
      .insert(agent)
      .values({
        id: event.args.agentId.toString(),
        owner: walletAddress, // Best guess
        agentURI: '',
        agentWallet: walletAddress,
        ens: null,
        strategyId: null,
        registeredAt: event.block.timestamp,
      })
      .onConflictDoUpdate({
        agentWallet: walletAddress,
      });

    console.log(`[agent] Upserted agent ${event.args.agentId} wallet to ${walletAddress}`);
  }
});

// Event: URIUpdated - handles agent URI changes (may change ENS)
// Uses upsert pattern since URIUpdated can fire for agents registered before start block
ponder.on('IdentityRegistry:URIUpdated', async ({ event, context }) => {
  const ens = await extractENSFromAgentURI(event.args.newURI);
  const strategyId = ens ? computeStrategyId(ens) : null;

  await context.db
    .insert(agent)
    .values({
      id: event.args.agentId.toString(),
      owner: event.args.updatedBy, // Best guess for owner
      agentURI: event.args.newURI,
      agentWallet: event.args.updatedBy,
      ens,
      strategyId,
      registeredAt: event.block.timestamp,
    })
    .onConflictDoUpdate({
      agentURI: event.args.newURI,
      ens,
      strategyId,
    });

  console.log(`[agent] Upserted agent ${event.args.agentId} URI${ens ? `, ENS: ${ens}` : ''}`);
});

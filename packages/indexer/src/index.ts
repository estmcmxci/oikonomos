import { ponder } from 'ponder:registry';
import { agent, subname, swapReceipt, agentMetrics, feeClaim, agentToken } from 'ponder:schema';
import { keccak256, toBytes, formatEther } from 'viem';

/**
 * Marketplace ENS Filter (OIK-45)
 *
 * Only index agents that belong to our marketplace (*.oikonomos.eth).
 * This ensures the consumer journey only shows relevant strategy agents,
 * not all 249+ agents registered in the canonical ERC-8004 registry.
 */
const MARKETPLACE_ENS_SUFFIX = process.env.MARKETPLACE_ENS_SUFFIX || '.oikonomos.eth';

function isMarketplaceAgent(ens: string | null): boolean {
  if (!ens) return false;
  return ens.endsWith(MARKETPLACE_ENS_SUFFIX);
}

// IPFS Gateway URL
const IPFS_GATEWAY_URL = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs';

/**
 * Compute strategyId from ENS name
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
  ens?: string;
}

/**
 * Extract ENS name from ERC-8004 registration metadata
 */
async function extractENSFromAgentURI(agentURI: string): Promise<string | null> {
  if (!agentURI) return null;

  try {
    let metadata: ERC8004Registration;

    if (agentURI.startsWith('data:application/json;base64,')) {
      const base64 = agentURI.replace('data:application/json;base64,', '');
      const json = Buffer.from(base64, 'base64').toString('utf-8');
      metadata = JSON.parse(json);
    } else if (agentURI.startsWith('ipfs://')) {
      const cid = agentURI.replace('ipfs://', '');
      const url = `${IPFS_GATEWAY_URL}/${cid}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return null;
      metadata = await response.json() as ERC8004Registration;
    } else if (agentURI.startsWith('http')) {
      const response = await fetch(agentURI, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return null;
      metadata = await response.json() as ERC8004Registration;
    } else {
      const url = `${IPFS_GATEWAY_URL}/${agentURI}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return null;
      metadata = await response.json() as ERC8004Registration;
    }

    if (metadata.services) {
      const ensService = metadata.services.find(s => s.name === 'ENS');
      if (ensService?.endpoint) return ensService.endpoint;
    }

    return metadata.ens || null;
  } catch (error) {
    console.warn(`[metadata] Error extracting ENS from ${agentURI.substring(0, 50)}...:`, error);
    return null;
  }
}

// ============================================================================
// Uniswap V4 PoolManager Swap Handler (Clanker Integration)
// ============================================================================

/**
 * Compute reputation score from swap metrics
 * Formula:
 * - 40% from swap count tier (log scale)
 * - 30% from volume tier (log scale)
 * - 30% from recency (linear decay over 30 days)
 */
function computeReputationScore(
  totalSwaps: bigint,
  totalVolume: bigint,
  lastSwapAt: bigint,
  currentTimestamp: bigint
): bigint {
  // 40% from swap count tier
  let swapScore = 0n;
  if (totalSwaps >= 100n) swapScore = 4000n;
  else if (totalSwaps >= 50n) swapScore = 3000n;
  else if (totalSwaps >= 20n) swapScore = 2000n;
  else if (totalSwaps >= 5n) swapScore = 1000n;

  // 30% from volume tier (in ETH equivalent)
  const oneEth = 10n ** 18n;
  let volumeScore = 0n;
  if (totalVolume >= 100n * oneEth) volumeScore = 3000n;
  else if (totalVolume >= 10n * oneEth) volumeScore = 2000n;
  else if (totalVolume >= oneEth) volumeScore = 1000n;

  // 30% from recency (full score if swapped in last 7 days, decays to 0 over 30 days)
  const sevenDays = 7n * 24n * 60n * 60n;
  const thirtyDays = 30n * 24n * 60n * 60n;
  const timeSinceLastSwap = currentTimestamp - lastSwapAt;

  let recencyScore = 0n;
  if (timeSinceLastSwap <= sevenDays) {
    recencyScore = 3000n;
  } else if (timeSinceLastSwap <= thirtyDays) {
    // Linear decay from 3000 to 0
    const decayPeriod = thirtyDays - sevenDays;
    const elapsed = timeSinceLastSwap - sevenDays;
    recencyScore = 3000n - (3000n * elapsed) / decayPeriod;
  }

  return swapScore + volumeScore + recencyScore;
}

/**
 * Helper: absolute value for bigint
 */
function absBigInt(n: bigint): bigint {
  return n >= 0n ? n : -n;
}

/**
 * Handle Swap events from PoolManager
 * Creates swap receipts for all swaps on Clanker pools
 *
 * Note: Agent metrics are computed via API queries aggregating swap receipts,
 * rather than real-time updates during indexing (Ponder 0.16 limitation).
 */
ponder.on('PoolManager:Swap', async ({ event, context }) => {
  const { db } = context;
  const receiptId = `${event.transaction.hash}-${event.log.logIndex}`;

  // Store the swap receipt
  await db.insert(swapReceipt).values({
    id: receiptId,
    poolId: event.args.id,
    sender: event.args.sender,
    amount0: event.args.amount0,
    amount1: event.args.amount1,
    sqrtPriceX96: BigInt(event.args.sqrtPriceX96),
    liquidity: BigInt(event.args.liquidity),
    tick: event.args.tick,
    fee: event.args.fee,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  });
});

// ============================================================================
// IdentityRegistry handlers (shared logic for both chains)
// ============================================================================

async function handleRegistered(
  event: {
    args: { agentId: bigint; agentURI: string; owner: `0x${string}` };
    block: { timestamp: bigint };
  },
  context: { db: any }
) {
  const ens = await extractENSFromAgentURI(event.args.agentURI);

  if (!isMarketplaceAgent(ens)) {
    console.log(`[agent] Skipping agent ${event.args.agentId} - not in marketplace (ens: ${ens || 'none'})`);
    return;
  }

  const strategyId = computeStrategyId(ens!);

  await context.db.insert(agent).values({
    id: event.args.agentId.toString(),
    owner: event.args.owner,
    agentURI: event.args.agentURI,
    agentWallet: event.args.owner,
    ens,
    strategyId,
    registeredAt: event.block.timestamp,
  });

  console.log(`[agent] Indexed marketplace agent ${event.args.agentId}: ${ens} (strategyId: ${strategyId})`);
}

async function handleMetadataSet(
  event: {
    args: { agentId: bigint; metadataKey: string; metadataValue: `0x${string}` };
  },
  context: { db: any }
) {
  if (event.args.metadataKey === 'agentWallet') {
    const walletAddress = ('0x' + event.args.metadataValue.slice(2).slice(0, 40)) as `0x${string}`;

    const existing = await context.db.find(agent, { id: event.args.agentId.toString() });
    if (!existing) return;

    await context.db
      .update(agent, { id: event.args.agentId.toString() })
      .set({ agentWallet: walletAddress });

    console.log(`[agent] Updated wallet for agent ${event.args.agentId} to ${walletAddress}`);
  }
}

async function handleURIUpdated(
  event: {
    args: { agentId: bigint; newURI: string; updatedBy: `0x${string}` };
    block: { timestamp: bigint };
  },
  context: { db: any }
) {
  const ens = await extractENSFromAgentURI(event.args.newURI);

  if (!isMarketplaceAgent(ens)) {
    console.log(`[agent] Skipping URI update for agent ${event.args.agentId} - not in marketplace`);
    return;
  }

  const strategyId = computeStrategyId(ens!);

  await context.db
    .insert(agent)
    .values({
      id: event.args.agentId.toString(),
      owner: event.args.updatedBy,
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

  console.log(`[agent] Updated marketplace agent ${event.args.agentId}: ${ens}`);
}

// Sepolia IdentityRegistry handlers
ponder.on('IdentityRegistry:Registered', async ({ event, context }) => {
  await handleRegistered(event, context);
});

ponder.on('IdentityRegistry:MetadataSet', async ({ event, context }) => {
  await handleMetadataSet(event, context);
});

ponder.on('IdentityRegistry:URIUpdated', async ({ event, context }) => {
  await handleURIUpdated(event, context);
});

// Base Sepolia IdentityRegistry handlers
ponder.on('IdentityRegistryBaseSepolia:Registered', async ({ event, context }) => {
  await handleRegistered(event, context);
});

ponder.on('IdentityRegistryBaseSepolia:MetadataSet', async ({ event, context }) => {
  await handleMetadataSet(event, context);
});

ponder.on('IdentityRegistryBaseSepolia:URIUpdated', async ({ event, context }) => {
  await handleURIUpdated(event, context);
});

// ============================================================================
// OIK-54: CCIP Subname Registration (oikonomos.eth)
// ============================================================================

ponder.on('OffchainSubnameManager:SubnameRegistered', async ({ event, context }) => {
  const subnameId = `${event.args.parentNode}-${event.args.labelHash}`;
  const fullName = `${event.args.label}.oikonomos.eth`;

  await context.db.insert(subname).values({
    id: subnameId,
    parentNode: event.args.parentNode,
    labelHash: event.args.labelHash,
    label: event.args.label,
    fullName,
    owner: event.args.owner,
    agentId: event.args.agentId.toString(),
    a2aUrl: event.args.a2aUrl,
    expiry: event.args.expiry,
    registeredAt: event.block.timestamp,
    transactionHash: event.transaction.hash,
    chainId: 11155111,
  });

  console.log(`[subname] Registered ${fullName} -> owner: ${event.args.owner}, agentId: ${event.args.agentId}`);
});

// ============================================================================
// P3 Gap 10: ClankerFeeLocker Fee Claims (Base Mainnet)
// ============================================================================

ponder.on('ClankerFeeLocker:FeesClaimed', async ({ event, context }) => {
  const { db } = context;
  const claimId = `${event.transaction.hash}-${event.log.logIndex}`;

  // Store the fee claim record
  await db.insert(feeClaim).values({
    id: claimId,
    token: event.args.token,
    wallet: event.args.wallet,
    wethAmount: event.args.wethAmount.toString(),
    tokenAmount: event.args.tokenAmount.toString(),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
    chainId: 8453, // Base mainnet
  });

  // Update or create agent token record with fee totals
  const existingToken = await db.find(agentToken, { id: event.args.token.toLowerCase() });

  if (existingToken) {
    // Update running totals
    const currentTotal = BigInt(existingToken.totalFeesClaimed);
    const newTotal = currentTotal + event.args.wethAmount;

    await db
      .update(agentToken, { id: event.args.token.toLowerCase() })
      .set({
        totalFeesClaimed: newTotal.toString(),
        lastClaimAt: BigInt(event.block.timestamp),
      });
  } else {
    // Create new agent token entry from first claim
    await db.insert(agentToken).values({
      id: event.args.token.toLowerCase(),
      agentWallet: event.args.wallet,
      tokenAddress: event.args.token,
      symbol: 'UNKNOWN', // Would need Clawnch API to get symbol
      name: 'Unknown Token',
      launchedAt: BigInt(event.block.timestamp), // Approximate from first claim
      platform: 'unknown',
      totalFeesClaimed: event.args.wethAmount.toString(),
      lastClaimAt: BigInt(event.block.timestamp),
    });
  }

  const wethFormatted = formatEther(event.args.wethAmount);
  console.log(`[feeClaim] Claimed ${wethFormatted} WETH for token ${event.args.token} by ${event.args.wallet}`);
});

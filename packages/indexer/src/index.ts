import { ponder } from 'ponder:registry';
import { executionReceipt, strategyMetrics, agent } from 'ponder:schema';

// ReceiptHook handlers
ponder.on('ReceiptHook:ExecutionReceipt', async ({ event, context }) => {
  const receiptId = `${event.transaction.hash}-${event.log.logIndex}`;

  // Store the receipt
  await context.db.insert(executionReceipt).values({
    id: receiptId,
    strategyId: event.args.strategyId,
    quoteId: event.args.quoteId,
    sender: event.args.sender,
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
  const volume = event.args.amount0 > 0n ? event.args.amount0 : -event.args.amount0;

  await context.db
    .insert(strategyMetrics)
    .values({
      id: strategyIdKey,
      totalExecutions: 1n,
      totalVolume: volume,
      avgSlippage: event.args.actualSlippage,
      successRate: 10000n, // 100% initially
      complianceRate: event.args.policyCompliant ? 10000n : 0n,
      lastExecutionAt: event.args.timestamp,
    })
    .onConflictDoUpdate((existing) => ({
      totalExecutions: existing.totalExecutions + 1n,
      totalVolume: existing.totalVolume + volume,
      avgSlippage:
        (existing.avgSlippage * existing.totalExecutions + event.args.actualSlippage) /
        (existing.totalExecutions + 1n),
      complianceRate:
        (existing.complianceRate * existing.totalExecutions +
          (event.args.policyCompliant ? 10000n : 0n)) /
        (existing.totalExecutions + 1n),
      lastExecutionAt: event.args.timestamp,
    }));
});

// Canonical ERC-8004 IdentityRegistry handlers (howto8004.com)
// Event: Registered(uint256 indexed agentId, string agentURI, address indexed owner)
ponder.on('IdentityRegistry:Registered', async ({ event, context }) => {
  await context.db.insert(agent).values({
    id: event.args.agentId.toString(),
    owner: event.args.owner,
    agentURI: event.args.agentURI,
    agentWallet: event.args.owner, // Initially same as owner
    registeredAt: event.block.timestamp,
  });
});

// Event: URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy)
ponder.on('IdentityRegistry:URIUpdated', async ({ event, context }) => {
  await context.db
    .update(agent, { id: event.args.agentId.toString() })
    .set({
      agentURI: event.args.newURI,
    });
});

// Event: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
// Handle ownership transfers (ERC-721)
ponder.on('IdentityRegistry:Transfer', async ({ event, context }) => {
  // Skip mint events (from = 0x0) as they're handled by Registered
  if (event.args.from === '0x0000000000000000000000000000000000000000') {
    return;
  }

  await context.db
    .update(agent, { id: event.args.tokenId.toString() })
    .set({
      owner: event.args.to,
      // Agent wallet is cleared on transfer per ERC-8004 spec
      agentWallet: event.args.to,
    });
});

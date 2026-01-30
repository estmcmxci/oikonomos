import { ponder } from 'ponder:registry';
import { executionReceipt, strategyMetrics, agent } from 'ponder:schema';

// Helper: Calculate absolute value for BigInt
function absBigInt(n: bigint): bigint {
  return n >= 0n ? n : -n;
}

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
});

// IdentityRegistry handlers
ponder.on('IdentityRegistry:AgentRegistered', async ({ event, context }) => {
  await context.db.insert(agent).values({
    id: event.args.agentId.toString(),
    owner: event.args.owner,
    agentURI: event.args.agentURI,
    agentWallet: event.args.owner, // Initially same as owner
    registeredAt: event.block.timestamp,
  });
});

ponder.on('IdentityRegistry:AgentWalletUpdated', async ({ event, context }) => {
  await context.db
    .update(agent, { id: event.args.agentId.toString() })
    .set({
      agentWallet: event.args.newWallet,
    });
});

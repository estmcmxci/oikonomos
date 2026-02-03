import { onchainTable, index } from 'ponder';

export const executionReceipt = onchainTable('execution_receipt', (t) => ({
  id: t.text().primaryKey(),
  strategyId: t.hex().notNull(),
  quoteId: t.hex().notNull(),
  user: t.hex().notNull(), // The actual user wallet (from hookData)
  router: t.hex().notNull(), // The router contract that executed the swap
  amount0: t.bigint().notNull(),
  amount1: t.bigint().notNull(),
  actualSlippage: t.bigint().notNull(),
  policyCompliant: t.boolean().notNull(),
  timestamp: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}), (table) => ({
  strategyIdIdx: index().on(table.strategyId),
  userIdx: index().on(table.user),
  routerIdx: index().on(table.router),
  timestampIdx: index().on(table.timestamp),
}));

export const strategyMetrics = onchainTable('strategy_metrics', (t) => ({
  id: t.hex().primaryKey(), // strategyId
  totalExecutions: t.bigint().notNull(),
  totalVolume: t.bigint().notNull(),
  // Store sums for precise rate calculation on query (avoids BigInt division truncation)
  slippageSum: t.bigint().notNull(), // Sum of all slippage values (divide by totalExecutions for avg)
  compliantCount: t.bigint().notNull(), // Number of compliant executions
  successCount: t.bigint().notNull(), // Number of successful executions
  lastExecutionAt: t.bigint().notNull(),
  // Legacy fields (computed on insert for backwards compatibility, but prefer calculating from sums)
  avgSlippage: t.bigint().notNull(), // basis points - DEPRECATED: use slippageSum/totalExecutions
  successRate: t.bigint().notNull(), // basis points - DEPRECATED: use successCount/totalExecutions*10000
  complianceRate: t.bigint().notNull(), // basis points - DEPRECATED: use compliantCount/totalExecutions*10000
}));

export const agent = onchainTable('agent', (t) => ({
  id: t.text().primaryKey(), // agentId as string
  owner: t.hex().notNull(),
  agentURI: t.text().notNull(),
  agentWallet: t.hex().notNull(),
  ens: t.text(), // ENS name resolved from agentURI metadata (e.g., "alice-treasury.oikonomos.eth")
  registeredAt: t.bigint().notNull(),
}), (table) => ({
  ownerIdx: index().on(table.owner),
  agentWalletIdx: index().on(table.agentWallet),
  ensIdx: index().on(table.ens),
}));

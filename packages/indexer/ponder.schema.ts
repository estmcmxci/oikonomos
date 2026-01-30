import { onchainTable, index } from 'ponder';

export const executionReceipt = onchainTable('execution_receipt', (t) => ({
  id: t.text().primaryKey(),
  strategyId: t.hex().notNull(),
  quoteId: t.hex().notNull(),
  sender: t.hex().notNull(),
  amount0: t.bigint().notNull(),
  amount1: t.bigint().notNull(),
  actualSlippage: t.bigint().notNull(),
  policyCompliant: t.boolean().notNull(),
  timestamp: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}), (table) => ({
  strategyIdIdx: index().on(table.strategyId),
  senderIdx: index().on(table.sender),
  timestampIdx: index().on(table.timestamp),
}));

export const strategyMetrics = onchainTable('strategy_metrics', (t) => ({
  id: t.hex().primaryKey(), // strategyId
  totalExecutions: t.bigint().notNull(),
  totalVolume: t.bigint().notNull(),
  avgSlippage: t.bigint().notNull(), // basis points
  successRate: t.bigint().notNull(), // basis points (10000 = 100%)
  complianceRate: t.bigint().notNull(), // basis points
  lastExecutionAt: t.bigint().notNull(),
}));

export const agent = onchainTable('agent', (t) => ({
  id: t.text().primaryKey(), // agentId as string
  owner: t.hex().notNull(),
  agentURI: t.text().notNull(),
  agentWallet: t.hex().notNull(),
  registeredAt: t.bigint().notNull(),
}), (table) => ({
  ownerIdx: index().on(table.owner),
  agentWalletIdx: index().on(table.agentWallet),
}));

import { onchainTable, index } from 'ponder';

// OIK-54: Schema version bump for CCIP subnames
// v6: Added subname table for oikonomos.eth CCIP subname registrations

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
  // OIK-46: Computed reputation score (0-10000 = 0.00-100.00%)
  // Formula: 40% compliance + 30% volume tier + 20% execution tier + 10% slippage (inverse)
  score: t.bigint().notNull(),
}));

export const agent = onchainTable('agent', (t) => ({
  id: t.text().primaryKey(), // agentId as string
  owner: t.hex().notNull(),
  agentURI: t.text().notNull(),
  agentWallet: t.hex().notNull(),
  ens: t.text(), // ENS name resolved from agentURI metadata (e.g., "alice-treasury.oikonomos.eth")
  strategyId: t.hex(), // keccak256(ens) - enables strategyId → agentId resolution (OIK-38)
  registeredAt: t.bigint().notNull(),
}), (table) => ({
  ownerIdx: index().on(table.owner),
  agentWalletIdx: index().on(table.agentWallet),
  ensIdx: index().on(table.ens),
  strategyIdIdx: index().on(table.strategyId), // OIK-38: index for efficient lookup
}));

// OIK-54: CCIP Subname registrations under oikonomos.eth
export const subname = onchainTable('subname', (t) => ({
  id: t.text().primaryKey(), // parentNode-labelHash
  parentNode: t.hex().notNull(),
  labelHash: t.hex().notNull(),
  label: t.text().notNull(), // Human-readable label (e.g., "treasury")
  fullName: t.text().notNull(), // Full ENS name (e.g., "treasury.oikonomos.eth")
  owner: t.hex().notNull(),
  agentId: t.text().notNull(), // Associated ERC-8004 agent ID
  expiry: t.bigint().notNull(),
  registeredAt: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
  chainId: t.integer().notNull(),
}), (table) => ({
  ownerIdx: index().on(table.owner),
  agentIdIdx: index().on(table.agentId),
  labelIdx: index().on(table.label),
  registeredAtIdx: index().on(table.registeredAt),
}));

import { onchainTable, index } from 'ponder';

// Schema version v7: Pivot to meta-treasury manager
// - Removed executionReceipt table (was for ReceiptHook)
// - Removed strategyMetrics table (was for ReceiptHook)
// - Added swapReceipt table for Uniswap V4 Swap events
// - Added agentMetrics table for provider reputation tracking
// - Keep agent table for ERC-8004 identity
// - Keep subname table for CCIP subnames (OIK-54)

/**
 * ERC-8004 Agent registrations
 * Filtered to only include marketplace agents (*.oikonomos.eth)
 */
export const agent = onchainTable('agent', (t) => ({
  id: t.text().primaryKey(), // agentId as string
  owner: t.hex().notNull(),
  agentURI: t.text().notNull(),
  agentWallet: t.hex().notNull(),
  ens: t.text(), // ENS name resolved from agentURI metadata (e.g., "alice-treasury.oikonomos.eth")
  strategyId: t.hex(), // keccak256(ens) - enables strategyId → agentId resolution
  registeredAt: t.bigint().notNull(),
}), (table) => ({
  ownerIdx: index().on(table.owner),
  agentWalletIdx: index().on(table.agentWallet),
  ensIdx: index().on(table.ens),
  strategyIdIdx: index().on(table.strategyId),
}));

/**
 * CCIP Subname registrations under oikonomos.eth
 * OIK-54: Tracks subnames registered via OffchainSubnameManager
 */
export const subname = onchainTable('subname', (t) => ({
  id: t.text().primaryKey(), // parentNode-labelHash
  parentNode: t.hex().notNull(),
  labelHash: t.hex().notNull(),
  label: t.text().notNull(), // Human-readable label (e.g., "treasury")
  fullName: t.text().notNull(), // Full ENS name (e.g., "treasury.oikonomos.eth")
  owner: t.hex().notNull(),
  agentId: t.text().notNull(), // Associated ERC-8004 agent ID
  a2aUrl: t.text().notNull(), // A2A protocol endpoint URL
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

/**
 * Swap receipts from Uniswap V4 PoolManager
 * Tracks all swaps for provider reputation and accountability
 */
export const swapReceipt = onchainTable('swap_receipt', (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  poolId: t.hex().notNull(), // Uniswap V4 pool ID
  sender: t.hex().notNull(), // Wallet that executed the swap
  amount0: t.bigint().notNull(),
  amount1: t.bigint().notNull(),
  sqrtPriceX96: t.bigint().notNull(),
  liquidity: t.bigint().notNull(),
  tick: t.integer().notNull(),
  fee: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}), (table) => ({
  senderIdx: index().on(table.sender),
  poolIdIdx: index().on(table.poolId),
  timestampIdx: index().on(table.timestamp),
}));

/**
 * Agent metrics computed from swap history
 * Used for provider reputation scoring
 */
export const agentMetrics = onchainTable('agent_metrics', (t) => ({
  id: t.hex().primaryKey(), // Agent wallet address
  totalSwaps: t.bigint().notNull(),
  totalVolume: t.bigint().notNull(), // Sum of absolute swap amounts
  lastSwapAt: t.bigint().notNull(),
  score: t.bigint().notNull(), // Reputation score (0-10000 basis points)
}), (table) => ({
  scoreIdx: index().on(table.score),
  lastSwapAtIdx: index().on(table.lastSwapAt),
}));

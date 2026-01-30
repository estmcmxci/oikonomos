export interface AgentRecord {
  type: 'treasury' | 'router' | 'lp' | 'vault' | 'netting' | 'receipts';
  mode: 'intent-only' | 'safe-roles';
  version: string;
  chainId: number;
  entrypoint: `0x${string}`;
  a2a?: string;
  x402?: string;
  safe?: `0x${string}`;
  rolesModifier?: `0x${string}`;
  erc8004?: string;
}

export interface ExecutionReceipt {
  strategyId: `0x${string}`;
  quoteId: `0x${string}`;
  sender: `0x${string}`;
  amount0: bigint;
  amount1: bigint;
  actualSlippage: bigint;
  policyCompliant: boolean;
  timestamp: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface Intent {
  user: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: bigint;
  maxSlippage: bigint;
  deadline: bigint;
  strategyId: `0x${string}`;
  nonce: bigint;
}

export interface PoolKey {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
}

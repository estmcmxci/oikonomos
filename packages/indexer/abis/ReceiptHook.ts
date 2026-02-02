export const ReceiptHookABI = [
  {
    type: 'event',
    name: 'ExecutionReceipt',
    inputs: [
      { name: 'strategyId', type: 'bytes32', indexed: true },
      { name: 'quoteId', type: 'bytes32', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'router', type: 'address', indexed: false },
      { name: 'amount0', type: 'int128', indexed: false },
      { name: 'amount1', type: 'int128', indexed: false },
      { name: 'actualSlippage', type: 'uint256', indexed: false },
      { name: 'policyCompliant', type: 'bool', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * IntentRouter ABI
 * Deployed at: 0xFD699481f0aA60e0014EEd79d16cbe4b954FfaEf (Sepolia)
 */
export const IntentRouterABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_poolManager', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'DOMAIN_SEPARATOR',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'POOL_MANAGER',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IPoolManager' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'executeIntent',
    inputs: [
      {
        name: 'intent',
        type: 'tuple',
        internalType: 'struct IntentRouter.Intent',
        components: [
          { name: 'user', type: 'address', internalType: 'address' },
          { name: 'tokenIn', type: 'address', internalType: 'address' },
          { name: 'tokenOut', type: 'address', internalType: 'address' },
          { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
          { name: 'maxSlippage', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
          { name: 'strategyId', type: 'bytes32', internalType: 'bytes32' },
          { name: 'nonce', type: 'uint256', internalType: 'uint256' }
        ]
      },
      { name: 'signature', type: 'bytes', internalType: 'bytes' },
      {
        name: 'poolKey',
        type: 'tuple',
        internalType: 'struct PoolKey',
        components: [
          { name: 'currency0', type: 'address', internalType: 'Currency' },
          { name: 'currency1', type: 'address', internalType: 'Currency' },
          { name: 'fee', type: 'uint24', internalType: 'uint24' },
          { name: 'tickSpacing', type: 'int24', internalType: 'int24' },
          { name: 'hooks', type: 'address', internalType: 'contract IHooks' }
        ]
      },
      { name: 'strategyData', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [{ name: 'amountOut', type: 'int256', internalType: 'int256' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'executedIntents',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getIntentHash',
    inputs: [
      {
        name: 'intent',
        type: 'tuple',
        internalType: 'struct IntentRouter.Intent',
        components: [
          { name: 'user', type: 'address', internalType: 'address' },
          { name: 'tokenIn', type: 'address', internalType: 'address' },
          { name: 'tokenOut', type: 'address', internalType: 'address' },
          { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
          { name: 'maxSlippage', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
          { name: 'strategyId', type: 'bytes32', internalType: 'bytes32' },
          { name: 'nonce', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'pure'
  },
  {
    type: 'function',
    name: 'getNonce',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'nonces',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'unlockCallback',
    inputs: [{ name: 'data', type: 'bytes', internalType: 'bytes' }],
    outputs: [{ name: '', type: 'bytes', internalType: 'bytes' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    name: 'EIP712DomainChanged',
    inputs: [],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IntentExecuted',
    inputs: [
      { name: 'intentHash', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'strategyId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'amountIn', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'amountOut', type: 'int256', indexed: false, internalType: 'int256' }
    ],
    anonymous: false
  },
  {
    type: 'error',
    name: 'ECDSAInvalidSignature',
    inputs: []
  },
  {
    type: 'error',
    name: 'ECDSAInvalidSignatureLength',
    inputs: [{ name: 'length', type: 'uint256', internalType: 'uint256' }]
  },
  {
    type: 'error',
    name: 'ECDSAInvalidSignatureS',
    inputs: [{ name: 's', type: 'bytes32', internalType: 'bytes32' }]
  },
  {
    type: 'error',
    name: 'IntentAlreadyExecuted',
    inputs: []
  },
  {
    type: 'error',
    name: 'IntentExpired',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidNonce',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidShortString',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidSignature',
    inputs: []
  },
  {
    type: 'error',
    name: 'NotPoolManager',
    inputs: []
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }]
  },
  {
    type: 'error',
    name: 'SlippageExceeded',
    inputs: []
  },
  {
    type: 'error',
    name: 'StringTooLong',
    inputs: [{ name: 'str', type: 'string', internalType: 'string' }]
  }
] as const;

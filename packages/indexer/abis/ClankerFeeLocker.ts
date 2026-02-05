// ClankerFeeLocker ABI for fee claim events
// Contract: 0xF3622742b1E446D92e45E22923Ef11C2fcD55D68 (Base Mainnet)

export const ClankerFeeLockerABI = [
  {
    type: 'event',
    name: 'FeesClaimed',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'wallet', type: 'address', indexed: true },
      { name: 'wethAmount', type: 'uint256', indexed: false },
      { name: 'tokenAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FeesDeposited',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'wethAmount', type: 'uint256', indexed: false },
      { name: 'tokenAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'availableWethFees',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'availableTokenFees',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'claim',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimAll',
    inputs: [{ name: 'tokens', type: 'address[]' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

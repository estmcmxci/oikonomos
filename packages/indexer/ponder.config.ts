import { createConfig } from 'ponder';
import { http } from 'viem';

import { ReceiptHookABI } from './abis/ReceiptHook';
import { IdentityRegistryABI } from './abis/IdentityRegistry';

export default createConfig({
  chains: {
    sepolia: {
      id: 11155111,
      rpc: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/MIpa-idKGvSRwUYBT9gAr',
    },
  },
  contracts: {
    ReceiptHook: {
      chain: 'sepolia',
      abi: ReceiptHookABI,
      address: '0x15d3b7CbC9463f92a88cE7B1B384277DA741C040',
      startBlock: 10165500,
    },
    IdentityRegistry: {
      chain: 'sepolia',
      abi: IdentityRegistryABI,
      address: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
      startBlock: 10165000,
    },
  },
});

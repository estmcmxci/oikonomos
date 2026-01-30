import { createConfig } from 'ponder';
import { http } from 'viem';

import ReceiptHookABI from './abis/ReceiptHook.json';
import IdentityRegistryABI from './abis/IdentityRegistry.json';

export default createConfig({
  networks: {
    sepolia: {
      chainId: 11155111,
      transport: http(process.env.PONDER_RPC_URL_11155111),
    },
  },
  contracts: {
    ReceiptHook: {
      network: 'sepolia',
      abi: ReceiptHookABI,
      address: process.env.RECEIPT_HOOK_ADDRESS as `0x${string}` | undefined,
      startBlock: Number(process.env.RECEIPT_HOOK_START_BLOCK || 0),
    },
    IdentityRegistry: {
      network: 'sepolia',
      abi: IdentityRegistryABI,
      address: process.env.IDENTITY_REGISTRY_ADDRESS as `0x${string}` | undefined,
      startBlock: Number(process.env.IDENTITY_REGISTRY_START_BLOCK || 0),
    },
  },
});

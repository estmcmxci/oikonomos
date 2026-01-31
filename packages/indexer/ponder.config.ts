import { createConfig } from 'ponder';
import { http } from 'viem';

import ReceiptHookABI from './abis/ReceiptHook.json';
import IdentityRegistryABI from './abis/IdentityRegistry.json';

// Canonical ERC-8004 IdentityRegistry on Sepolia (howto8004.com)
const CANONICAL_IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';

// Start block for canonical registry (approximate deployment block)
// Set to 0 to index from genesis, or specify a block near deployment to speed up sync
const CANONICAL_REGISTRY_START_BLOCK = 5000000;

export default createConfig({
  chains: {
    sepolia: {
      id: 11155111,
      rpc: process.env.PONDER_RPC_URL_11155111,
    },
  },
  contracts: {
    ReceiptHook: {
      chain: 'sepolia',
      abi: ReceiptHookABI,
      address: process.env.RECEIPT_HOOK_ADDRESS as `0x${string}` | undefined,
      startBlock: Number(process.env.RECEIPT_HOOK_START_BLOCK || 0),
    },
    // Canonical ERC-8004 IdentityRegistry
    IdentityRegistry: {
      chain: 'sepolia',
      abi: IdentityRegistryABI,
      // Use canonical address unless overridden via env var
      address: (process.env.IDENTITY_REGISTRY_ADDRESS || CANONICAL_IDENTITY_REGISTRY) as `0x${string}`,
      startBlock: Number(process.env.IDENTITY_REGISTRY_START_BLOCK || CANONICAL_REGISTRY_START_BLOCK),
    },
  },
});

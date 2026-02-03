import { createConfig } from 'ponder';

import { ReceiptHookABI } from './abis/ReceiptHook';
import { IdentityRegistryABI } from './abis/IdentityRegistry';

// Canonical ERC-8004 IdentityRegistry on Sepolia (howto8004.com)
const CANONICAL_IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';

// Deployed ReceiptHook address and start block (OIK-31: user address in hookData)
const RECEIPT_HOOK_ADDRESS = '0x41a75f07bA1958EcA78805D8419C87a393764040';
const RECEIPT_HOOK_START_BLOCK = 10176818;

// Start block for identity registry (near OIK-13 deployment)
const IDENTITY_REGISTRY_START_BLOCK = 10165000;

export default createConfig({
  database: {
    // Versioned schema to avoid migration conflicts when schema changes
    schema: 'oikonomos_v2',
  },
  chains: {
    sepolia: {
      id: 11155111,
      rpc: process.env.SEPOLIA_RPC_URL || process.env.PONDER_RPC_URL_11155111,
    },
  },
  contracts: {
    ReceiptHook: {
      chain: 'sepolia',
      abi: ReceiptHookABI,
      address: (process.env.RECEIPT_HOOK_ADDRESS || RECEIPT_HOOK_ADDRESS) as `0x${string}`,
      startBlock: Number(process.env.RECEIPT_HOOK_START_BLOCK || RECEIPT_HOOK_START_BLOCK),
    },
    // Canonical ERC-8004 IdentityRegistry
    IdentityRegistry: {
      chain: 'sepolia',
      abi: IdentityRegistryABI,
      address: (process.env.IDENTITY_REGISTRY_ADDRESS || CANONICAL_IDENTITY_REGISTRY) as `0x${string}`,
      startBlock: Number(process.env.IDENTITY_REGISTRY_START_BLOCK || IDENTITY_REGISTRY_START_BLOCK),
    },
  },
});

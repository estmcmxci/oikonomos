import { createConfig } from 'ponder';

import { ReceiptHookABI } from './abis/ReceiptHook';
import { IdentityRegistryABI } from './abis/IdentityRegistry';

// Canonical ERC-8004 IdentityRegistry (same address via CREATE2 on all chains)
const CANONICAL_IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';

// ======== Sepolia (legacy) ========
const SEPOLIA_RECEIPT_HOOK = '0x41a75f07bA1958EcA78805D8419C87a393764040';
const SEPOLIA_RECEIPT_HOOK_START_BLOCK = 10176818;
const SEPOLIA_IDENTITY_REGISTRY_START_BLOCK = 10165000;

// ======== Base Sepolia (OIK-50: x402 native support) ========
const BASE_SEPOLIA_RECEIPT_HOOK = '0x906E3e24C04f6b6B5b6743BB77d0FCBE4d87C040';
const BASE_SEPOLIA_RECEIPT_HOOK_START_BLOCK = 37200452; // OIK-50 deployment block
const BASE_SEPOLIA_IDENTITY_REGISTRY_START_BLOCK = 37200000; // Approximate

export default createConfig({
  // Note: Schema is passed via CLI --schema flag in package.json scripts
  // Bumped to v4 for OIK-50: added Base Sepolia multi-chain support
  chains: {
    sepolia: {
      id: 11155111,
      rpc: process.env.SEPOLIA_RPC_URL || process.env.PONDER_RPC_URL_11155111,
    },
    baseSepolia: {
      id: 84532,
      rpc: process.env.BASE_SEPOLIA_RPC_URL || process.env.PONDER_RPC_URL_84532,
    },
  },
  contracts: {
    // Sepolia ReceiptHook (legacy)
    ReceiptHook: {
      chain: 'sepolia',
      abi: ReceiptHookABI,
      address: (process.env.RECEIPT_HOOK_ADDRESS || SEPOLIA_RECEIPT_HOOK) as `0x${string}`,
      startBlock: Number(process.env.RECEIPT_HOOK_START_BLOCK || SEPOLIA_RECEIPT_HOOK_START_BLOCK),
    },
    // Base Sepolia ReceiptHook (OIK-50)
    ReceiptHookBaseSepolia: {
      chain: 'baseSepolia',
      abi: ReceiptHookABI,
      address: (process.env.BASE_SEPOLIA_RECEIPT_HOOK || BASE_SEPOLIA_RECEIPT_HOOK) as `0x${string}`,
      startBlock: Number(process.env.BASE_SEPOLIA_RECEIPT_HOOK_START_BLOCK || BASE_SEPOLIA_RECEIPT_HOOK_START_BLOCK),
    },
    // Canonical ERC-8004 IdentityRegistry (Sepolia)
    IdentityRegistry: {
      chain: 'sepolia',
      abi: IdentityRegistryABI,
      address: (process.env.IDENTITY_REGISTRY_ADDRESS || CANONICAL_IDENTITY_REGISTRY) as `0x${string}`,
      startBlock: Number(process.env.IDENTITY_REGISTRY_START_BLOCK || SEPOLIA_IDENTITY_REGISTRY_START_BLOCK),
    },
    // Canonical ERC-8004 IdentityRegistry (Base Sepolia - same address via CREATE2)
    IdentityRegistryBaseSepolia: {
      chain: 'baseSepolia',
      abi: IdentityRegistryABI,
      address: CANONICAL_IDENTITY_REGISTRY as `0x${string}`,
      startBlock: BASE_SEPOLIA_IDENTITY_REGISTRY_START_BLOCK,
    },
  },
});

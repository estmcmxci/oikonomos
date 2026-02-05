import { createConfig } from 'ponder';

import { IdentityRegistryABI } from './abis/IdentityRegistry';
import { OffchainSubnameManagerABI } from './abis/OffchainSubnameManager';
import { PoolManagerABI } from './abis/PoolManager';
import { ClankerFeeLockerABI } from './abis/ClankerFeeLocker';

// Canonical ERC-8004 IdentityRegistry (same address via CREATE2 on all chains)
const CANONICAL_IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';

// ======== Sepolia ========
const SEPOLIA_IDENTITY_REGISTRY_START_BLOCK = 10165000;

// ======== Base Sepolia ========
const BASE_SEPOLIA_IDENTITY_REGISTRY_START_BLOCK = 37200000;

// ======== OIK-54: CCIP Subname Manager (Sepolia) ========
const SEPOLIA_SUBNAME_MANAGER = process.env.SUBNAME_MANAGER_ADDRESS || '0x0000000000000000000000000000000000000000';
const SEPOLIA_SUBNAME_MANAGER_START_BLOCK = Number(process.env.SUBNAME_MANAGER_START_BLOCK || 0);

// ======== Clanker Contracts (Base Sepolia) ========
// Phase 3: PoolManager for Swap event indexing
const BASE_SEPOLIA_POOL_MANAGER = '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408';
const BASE_SEPOLIA_POOL_MANAGER_START_BLOCK = Number(process.env.POOL_MANAGER_START_BLOCK || 37200000);

// ======== ClankerFeeLocker (Base Mainnet) ========
// P3 Gap 10: Fee claim tracking for agent tokens
const BASE_FEE_LOCKER = '0xF3622742b1E446D92e45E22923Ef11C2fcD55D68';
const BASE_FEE_LOCKER_START_BLOCK = Number(process.env.FEE_LOCKER_START_BLOCK || 22000000);

export default createConfig({
  // Note: Schema is passed via CLI --schema flag in package.json scripts
  // v7: Pivot - Removed ReceiptHook, added PoolManager for Clanker integration
  chains: {
    sepolia: {
      id: 11155111,
      rpc: process.env.SEPOLIA_RPC_URL || process.env.PONDER_RPC_URL_11155111,
    },
    baseSepolia: {
      id: 84532,
      rpc: process.env.BASE_SEPOLIA_RPC_URL || process.env.PONDER_RPC_URL_84532,
    },
    base: {
      id: 8453,
      rpc: process.env.BASE_RPC_URL || process.env.PONDER_RPC_URL_8453,
    },
  },
  contracts: {
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
    // OIK-54: CCIP Subname Manager (Sepolia)
    // Note: Uses placeholder address if not configured - handler will simply not match any events
    OffchainSubnameManager: {
      chain: 'sepolia',
      abi: OffchainSubnameManagerABI,
      address: SEPOLIA_SUBNAME_MANAGER as `0x${string}`,
      startBlock: SEPOLIA_SUBNAME_MANAGER_START_BLOCK,
    },
    // Uniswap V4 PoolManager (Base Sepolia) - for indexing Clanker pool swaps
    PoolManager: {
      chain: 'baseSepolia',
      abi: PoolManagerABI,
      address: BASE_SEPOLIA_POOL_MANAGER as `0x${string}`,
      startBlock: BASE_SEPOLIA_POOL_MANAGER_START_BLOCK,
    },
    // ClankerFeeLocker (Base Mainnet) - for fee claim tracking
    ClankerFeeLocker: {
      chain: 'base',
      abi: ClankerFeeLockerABI,
      address: BASE_FEE_LOCKER as `0x${string}`,
      startBlock: BASE_FEE_LOCKER_START_BLOCK,
    },
  },
});

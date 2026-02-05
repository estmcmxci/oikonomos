# Integration & Refactoring Plan

> Reference: [PIVOT_SUMMARY.md](./PIVOT_SUMMARY.md)

This plan outlines the work required to pivot Oikonomos from a portfolio rebalancing marketplace to a meta-treasury manager for Clawnch-deployed AI agents.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION PHASES                    │
│                                                                 │
│  Phase 1: Cleanup ─────────────────────────────────────► 1 day  │
│  Phase 2: Clawnch Integration ─────────────────────────► 2 days │
│  Phase 3: Indexer Refactor ────────────────────────────► 1 day  │
│  Phase 4: DelegationRouter Contract ───────────────────► 2 days │
│  Phase 5: Dashboard Updates ───────────────────────────► 2 days │
│  Phase 6: Provider Worker ─────────────────────────────► 1 day  │
│  Phase 7: Dogfooding & Demo ───────────────────────────► 1 day  │
│                                                                 │
│  Total Estimated: ~10 days                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Cleanup

**Goal:** Remove deprecated contracts and code that are no longer needed.

### 1.1 Contracts to Delete

```
packages/contracts/src/
├── hooks/
│   └── ReceiptHook.sol          # DELETE - Using Clanker pools
├── mocks/
│   ├── MockUSDC.sol             # DELETE - Using Clanker tokens
│   └── MockDAI.sol              # DELETE - Using Clanker tokens
└── routers/
    └── IntentRouter.sol         # KEEP - Will refactor to DelegationRouter
```

### 1.2 Indexer Cleanup

```
packages/indexer/
├── abis/
│   └── ReceiptHook.json         # DELETE - No longer indexing this
├── src/
│   └── index.ts                 # MODIFY - Remove ReceiptHook handlers
└── ponder.config.ts             # MODIFY - Remove ReceiptHook contract config
```

### 1.3 Treasury Agent Cleanup

```
agents/treasury-agent/src/
├── config/
│   └── pools.ts                 # DELETE - No longer managing custom pools
└── services/
    └── swap.ts                  # MODIFY - Will use Clanker pools instead
```

### 1.4 Tasks

- [x] Delete ReceiptHook.sol and related tests
- [x] Delete MockUSDC.sol, MockDAI.sol and related tests
- [x] Remove ReceiptHook from ponder.config.ts
- [x] Remove ReceiptHook event handlers from indexer
- [x] Remove custom pool configuration from treasury-agent (updated for Clanker)
- [ ] Update deployment scripts to remove deleted contracts
- [ ] Run tests to ensure nothing breaks

---

## Phase 2: Clawnch Integration

**Goal:** Integrate with Clawnch SDK for token launching, fee checking, and fee claiming.

### 2.1 Install Dependencies

```bash
# In packages/sdk or agents/treasury-agent
pnpm add @clawnch/sdk

# For MCP server integration (optional)
pnpm add clawnch-mcp-server
```

### 2.2 Create Clawnch Service

```typescript
// packages/sdk/src/services/clawnch.ts

import { ClawnchClient } from '@clawnch/sdk';

export class ClawnchService {
  private client: ClawnchClient;

  constructor(moltbookKey?: string) {
    this.client = new ClawnchClient({ moltbookKey });
  }

  // Discover user's launched tokens
  async discoverUserAgents(wallet: string): Promise<LaunchedToken[]> {
    const response = await fetch(
      `https://clawn.ch/api/launches?wallet=${wallet}`
    );
    return response.json();
  }

  // Check fees for a token
  async checkFees(tokenAddress: string): Promise<FeeInfo> {
    return this.client.getAvailableFees(tokenAddress);
  }

  // Launch a new token
  async launchToken(params: LaunchParams): Promise<LaunchResult> {
    return this.client.launchToken(params);
  }

  // Get token analytics
  async getTokenAnalytics(tokenAddress: string): Promise<TokenAnalytics> {
    const response = await fetch(
      `https://clawn.ch/api/analytics/token?address=${tokenAddress}`
    );
    return response.json();
  }
}
```

### 2.3 Create ClankerFeeLocker Service

```typescript
// packages/sdk/src/services/feeLocker.ts

import { getContract, type PublicClient, type WalletClient } from 'viem';
import { ClankerFeeLockerABI } from '../abis/ClankerFeeLocker';

const FEE_LOCKER_ADDRESS = '0x42A95190B4088C88Dd904d930c79deC1158bF09D';

export class FeeLockerService {
  private contract;

  constructor(publicClient: PublicClient, walletClient?: WalletClient) {
    this.contract = getContract({
      address: FEE_LOCKER_ADDRESS,
      abi: ClankerFeeLockerABI,
      client: { public: publicClient, wallet: walletClient },
    });
  }

  // Check available WETH fees
  async getAvailableWethFees(token: string, wallet: string): Promise<bigint> {
    return this.contract.read.availableWethFees([token, wallet]);
  }

  // Check available token fees
  async getAvailableTokenFees(token: string, wallet: string): Promise<bigint> {
    return this.contract.read.availableTokenFees([token, wallet]);
  }

  // Claim fees (requires wallet client)
  async claimFees(token: string): Promise<string> {
    const hash = await this.contract.write.claim([token]);
    return hash;
  }
}
```

### 2.4 Add ABIs

```typescript
// packages/sdk/src/abis/ClankerFeeLocker.ts

export const ClankerFeeLockerABI = [
  {
    name: 'availableWethFees',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'availableTokenFees',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
  // Add more functions as needed
] as const;
```

### 2.5 Tasks

- [ ] Install @clawnch/sdk (using direct API calls instead)
- [x] Create ClawnchService class (packages/sdk/src/services/clawnch.ts)
- [x] Create FeeLockerService class (packages/sdk/src/services/feeLocker.ts)
- [x] Add ClankerFeeLocker ABI (in feeLocker.ts)
- [x] Add Uniswap V4 PoolManager ABI (packages/indexer/abis/PoolManager.ts)
- [ ] Write unit tests for Clawnch integration
- [ ] Test fee checking on Base Sepolia

---

## Phase 3: Indexer Refactor

**Goal:** Update indexer to watch Uniswap V4 Swap events instead of ReceiptHook events.

### 3.1 New Ponder Config

```typescript
// packages/indexer/ponder.config.ts

import { createConfig } from 'ponder';
import { PoolManagerABI } from './abis/PoolManager';
import { IdentityRegistryABI } from './abis/IdentityRegistry';
import { OffchainSubnameManagerABI } from './abis/OffchainSubnameManager';

// Clanker contracts on Base Sepolia
const BASE_SEPOLIA_POOL_MANAGER = '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408';
const BASE_SEPOLIA_POOL_MANAGER_START_BLOCK = 0; // TODO: Set actual start block

export default createConfig({
  chains: {
    baseSepolia: {
      id: 84532,
      rpc: process.env.BASE_SEPOLIA_RPC_URL,
    },
  },
  contracts: {
    // Uniswap V4 PoolManager (for Swap events)
    PoolManager: {
      chain: 'baseSepolia',
      abi: PoolManagerABI,
      address: BASE_SEPOLIA_POOL_MANAGER,
      startBlock: BASE_SEPOLIA_POOL_MANAGER_START_BLOCK,
    },
    // Keep existing contracts
    IdentityRegistryBaseSepolia: {
      chain: 'baseSepolia',
      abi: IdentityRegistryABI,
      address: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
      startBlock: 37200000,
    },
    // Subname manager (if deployed)
    // ...
  },
});
```

### 3.2 New Schema

```typescript
// packages/indexer/ponder.schema.ts

import { onchainTable, index } from 'ponder';

// Swap receipts from Uniswap V4 PoolManager
export const swapReceipt = onchainTable('swap_receipt', (t) => ({
  id: t.text().primaryKey(),
  poolId: t.hex().notNull(),
  sender: t.hex().notNull(),           // Agent wallet that executed
  amount0: t.bigint().notNull(),
  amount1: t.bigint().notNull(),
  sqrtPriceX96: t.bigint().notNull(),
  liquidity: t.bigint().notNull(),
  tick: t.integer().notNull(),
  fee: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}), (table) => ({
  senderIdx: index().on(table.sender),
  poolIdIdx: index().on(table.poolId),
  timestampIdx: index().on(table.timestamp),
}));

// Agent metrics (computed from swap receipts)
export const agentMetrics = onchainTable('agent_metrics', (t) => ({
  id: t.hex().primaryKey(),             // Agent wallet address
  totalSwaps: t.bigint().notNull(),
  totalVolume: t.bigint().notNull(),
  lastSwapAt: t.bigint().notNull(),
  score: t.bigint().notNull(),          // Reputation score
}));

// Keep existing tables
export const agent = onchainTable('agent', (t) => ({
  id: t.text().primaryKey(),
  owner: t.hex().notNull(),
  agentURI: t.text().notNull(),
  agentWallet: t.hex().notNull(),
  ens: t.text(),
  strategyId: t.hex(),
  registeredAt: t.bigint().notNull(),
}), (table) => ({
  ownerIdx: index().on(table.owner),
  agentWalletIdx: index().on(table.agentWallet),
  ensIdx: index().on(table.ens),
  strategyIdIdx: index().on(table.strategyId),
}));

export const subname = onchainTable('subname', (t) => ({
  // ... keep existing
}));
```

### 3.3 New Event Handlers

```typescript
// packages/indexer/src/index.ts

import { ponder } from 'ponder:registry';
import { swapReceipt, agentMetrics, agent } from 'ponder:schema';

// Handle Swap events from PoolManager
ponder.on('PoolManager:Swap', async ({ event, context }) => {
  const { db } = context;

  const receiptId = `${event.transaction.hash}-${event.log.logIndex}`;

  // Create swap receipt
  await db.insert(swapReceipt).values({
    id: receiptId,
    poolId: event.args.id,
    sender: event.args.sender,
    amount0: event.args.amount0,
    amount1: event.args.amount1,
    sqrtPriceX96: event.args.sqrtPriceX96,
    liquidity: event.args.liquidity,
    tick: event.args.tick,
    fee: event.args.fee,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  });

  // Update agent metrics if sender is a registered agent
  const agentRecord = await db.query.agent.findFirst({
    where: (a, { eq }) => eq(a.agentWallet, event.args.sender),
  });

  if (agentRecord) {
    const volume = abs(event.args.amount0) + abs(event.args.amount1);

    await db.insert(agentMetrics)
      .values({
        id: event.args.sender,
        totalSwaps: 1n,
        totalVolume: volume,
        lastSwapAt: BigInt(event.block.timestamp),
        score: calculateScore(1n, volume),
      })
      .onConflictDoUpdate((existing) => ({
        totalSwaps: existing.totalSwaps + 1n,
        totalVolume: existing.totalVolume + volume,
        lastSwapAt: BigInt(event.block.timestamp),
        score: calculateScore(existing.totalSwaps + 1n, existing.totalVolume + volume),
      }));
  }
});

function abs(n: bigint): bigint {
  return n < 0n ? -n : n;
}

function calculateScore(swaps: bigint, volume: bigint): bigint {
  // Simple score calculation - can be more sophisticated
  const swapScore = swaps > 100n ? 4000n : (swaps * 40n);
  const volumeScore = volume > 10n ** 20n ? 3000n : (volume / 10n ** 17n);
  return swapScore + volumeScore;
}
```

### 3.4 Tasks

- [x] Add PoolManager ABI with Swap event
- [x] Update ponder.config.ts with PoolManager contract
- [x] Create new schema (swapReceipt, agentMetrics)
- [x] Implement Swap event handler
- [x] Update agent metrics calculation
- [x] Remove old ReceiptHook handlers
- [ ] Test indexer on Base Sepolia
- [ ] Verify data is being indexed correctly

---

## Phase 4: DelegationRouter Contract

**Goal:** Refactor IntentRouter to DelegationRouter for fee claiming and policy enforcement.

### 4.1 Contract Design

```solidity
// packages/contracts/src/DelegationRouter.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

interface IClankerFeeLocker {
    function claim(address token) external;
}

interface ISwapRouter {
    // Uniswap V4 swap interface
}

contract DelegationRouter is EIP712 {
    using ECDSA for bytes32;

    // Clanker contracts
    IClankerFeeLocker public immutable feeLocker;
    address public immutable weth;

    // EIP-712 typehash for delegation intent
    bytes32 public constant DELEGATION_TYPEHASH = keccak256(
        "Delegation(address user,address provider,address[] tokens,uint256 claimFrequency,uint256 providerFeeBps,uint256 deadline,uint256 nonce)"
    );

    // User nonces for replay protection
    mapping(address => uint256) public nonces;

    // Active delegations
    mapping(address => Delegation) public delegations;

    struct Delegation {
        address provider;
        address[] tokens;
        uint256 claimFrequency;
        uint256 providerFeeBps;
        uint256 deadline;
        uint256 lastClaimTime;
    }

    struct Policy {
        uint256 compoundPercentage;    // % to reinvest
        uint256 toStablesPercentage;   // % to convert to stables
        uint256 holdPercentage;        // % to keep as WETH
        uint256 maxSlippageBps;
    }

    event DelegationCreated(address indexed user, address indexed provider, address[] tokens);
    event FeesClaimed(address indexed user, address indexed provider, address token, uint256 wethAmount, uint256 tokenAmount);
    event ManagementExecuted(address indexed user, address indexed provider, uint256 totalClaimed);

    constructor(
        address _feeLocker,
        address _weth
    ) EIP712("OikonomosDelegation", "1") {
        feeLocker = IClankerFeeLocker(_feeLocker);
        weth = _weth;
    }

    /// @notice Create a delegation by signing an intent
    function createDelegation(
        address user,
        address provider,
        address[] calldata tokens,
        uint256 claimFrequency,
        uint256 providerFeeBps,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp < deadline, "Expired");
        require(providerFeeBps <= 1000, "Fee too high"); // Max 10%

        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            DELEGATION_TYPEHASH,
            user,
            provider,
            keccak256(abi.encodePacked(tokens)),
            claimFrequency,
            providerFeeBps,
            deadline,
            nonces[user]++
        ));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == user, "Invalid signature");

        // Store delegation
        delegations[user] = Delegation({
            provider: provider,
            tokens: tokens,
            claimFrequency: claimFrequency,
            providerFeeBps: providerFeeBps,
            deadline: deadline,
            lastClaimTime: 0
        });

        emit DelegationCreated(user, provider, tokens);
    }

    /// @notice Execute management actions (called by provider)
    function executeManagement(
        address user,
        Policy calldata policy
    ) external {
        Delegation storage delegation = delegations[user];

        require(msg.sender == delegation.provider, "Not authorized");
        require(block.timestamp < delegation.deadline, "Delegation expired");
        require(
            block.timestamp >= delegation.lastClaimTime + delegation.claimFrequency,
            "Too soon"
        );

        uint256 totalWethClaimed = 0;

        // Claim fees for all tokens
        for (uint i = 0; i < delegation.tokens.length; i++) {
            address token = delegation.tokens[i];

            // Get balances before
            uint256 wethBefore = IERC20(weth).balanceOf(address(this));
            uint256 tokenBefore = IERC20(token).balanceOf(address(this));

            // Claim from FeeLocker
            feeLocker.claim(token);

            // Calculate claimed amounts
            uint256 wethClaimed = IERC20(weth).balanceOf(address(this)) - wethBefore;
            uint256 tokenClaimed = IERC20(token).balanceOf(address(this)) - tokenBefore;

            totalWethClaimed += wethClaimed;

            emit FeesClaimed(user, msg.sender, token, wethClaimed, tokenClaimed);
        }

        // Pay provider fee
        uint256 providerFee = (totalWethClaimed * delegation.providerFeeBps) / 10000;
        if (providerFee > 0) {
            IERC20(weth).transfer(msg.sender, providerFee);
        }

        // Execute policy with remaining WETH
        uint256 remaining = totalWethClaimed - providerFee;
        _executePolicy(user, remaining, policy);

        // Update last claim time
        delegation.lastClaimTime = block.timestamp;

        emit ManagementExecuted(user, msg.sender, totalWethClaimed);
    }

    function _executePolicy(
        address user,
        uint256 wethAmount,
        Policy calldata policy
    ) internal {
        require(
            policy.compoundPercentage + policy.toStablesPercentage + policy.holdPercentage == 100,
            "Invalid percentages"
        );

        // Hold portion - transfer to user
        uint256 holdAmount = (wethAmount * policy.holdPercentage) / 100;
        if (holdAmount > 0) {
            IERC20(weth).transfer(user, holdAmount);
        }

        // Compound portion - add to LP (TODO: implement)
        uint256 compoundAmount = (wethAmount * policy.compoundPercentage) / 100;
        if (compoundAmount > 0) {
            // TODO: Add to LP positions
            // For now, transfer to user
            IERC20(weth).transfer(user, compoundAmount);
        }

        // Stables portion - swap to USDC (TODO: implement)
        uint256 stablesAmount = (wethAmount * policy.toStablesPercentage) / 100;
        if (stablesAmount > 0) {
            // TODO: Swap WETH to USDC via Uniswap
            // For now, transfer to user
            IERC20(weth).transfer(user, stablesAmount);
        }
    }

    /// @notice Revoke delegation
    function revokeDelegation() external {
        delete delegations[msg.sender];
    }

    /// @notice Get delegation details
    function getDelegation(address user) external view returns (Delegation memory) {
        return delegations[user];
    }
}
```

### 4.2 Deployment Script

```typescript
// packages/contracts/script/DeployDelegationRouter.s.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {DelegationRouter} from "../src/DelegationRouter.sol";

contract DeployDelegationRouter is Script {
    // Base Sepolia addresses
    address constant FEE_LOCKER = 0x42A95190B4088C88Dd904d930c79deC1158bF09D;
    address constant WETH = 0x4200000000000000000000000000000000000006;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        vm.startBroadcast(deployerKey);

        DelegationRouter router = new DelegationRouter(FEE_LOCKER, WETH);

        vm.stopBroadcast();

        console.log("DelegationRouter deployed at:", address(router));
    }
}
```

### 4.3 Tasks

- [x] Design DelegationRouter contract (packages/contracts/src/DelegationRouter.sol)
- [x] Implement EIP-712 signature verification
- [x] Implement fee claiming from ClankerFeeLocker
- [x] Implement policy execution (compound, stables, hold)
- [x] Add provider fee payment
- [ ] Write comprehensive tests
- [ ] Deploy to Base Sepolia
- [ ] Verify contract on BaseScan

---

## Phase 5: Dashboard Updates

> **SKIPPED** - Dashboard UI updates deferred per user request. Backend services created.

**Goal:** Update dashboard to show aggregate portfolio view and policy configuration.

### 5.1 New Pages

```
apps/dashboard/app/
├── page.tsx                    # Landing / Connect wallet
├── portfolio/
│   └── page.tsx               # NEW: Aggregate portfolio view
├── agents/
│   ├── page.tsx               # NEW: List user's agents
│   └── deploy/
│       └── page.tsx           # NEW: Deploy new agent
├── providers/
│   ├── page.tsx               # NEW: Browse providers
│   └── [address]/
│       └── page.tsx           # NEW: Provider detail
├── delegate/
│   └── page.tsx               # NEW: Create delegation
└── settings/
    └── page.tsx               # Policy configuration
```

### 5.2 Portfolio Page

```typescript
// apps/dashboard/app/portfolio/page.tsx

'use client';

import { useAccount } from 'wagmi';
import { useUserAgents } from '@/hooks/useUserAgents';
import { useAggregateFees } from '@/hooks/useAggregateFees';

export default function PortfolioPage() {
  const { address } = useAccount();
  const { agents, isLoading: agentsLoading } = useUserAgents(address);
  const { fees, isLoading: feesLoading } = useAggregateFees(agents);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Portfolio</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <SummaryCard title="Total Agents" value={agents?.length || 0} />
        <SummaryCard title="Total Tokens" value={agents?.length || 0} />
        <SummaryCard title="Unclaimed WETH" value={fees?.totalWeth || '0'} />
        <SummaryCard title="Est. Value" value={fees?.totalUsd || '$0'} />
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Agent</th>
              <th className="p-4 text-left">Platform</th>
              <th className="p-4 text-left">Token</th>
              <th className="p-4 text-right">WETH Fees</th>
              <th className="p-4 text-right">Token Fees</th>
              <th className="p-4 text-right">24h Change</th>
            </tr>
          </thead>
          <tbody>
            {agents?.map((agent) => (
              <AgentRow key={agent.address} agent={agent} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <Button href="/agents/deploy">Deploy New Agent</Button>
        <Button href="/delegate">Delegate to Provider</Button>
      </div>
    </div>
  );
}
```

### 5.3 Hooks

```typescript
// apps/dashboard/hooks/useUserAgents.ts

import { useQuery } from '@tanstack/react-query';
import { ClawnchService } from '@oikonomos/sdk';

export function useUserAgents(wallet?: string) {
  return useQuery({
    queryKey: ['userAgents', wallet],
    queryFn: async () => {
      if (!wallet) return [];
      const clawnch = new ClawnchService();
      return clawnch.discoverUserAgents(wallet);
    },
    enabled: !!wallet,
  });
}

// apps/dashboard/hooks/useAggregateFees.ts

import { useQuery } from '@tanstack/react-query';
import { FeeLockerService } from '@oikonomos/sdk';

export function useAggregateFees(agents?: Agent[]) {
  return useQuery({
    queryKey: ['aggregateFees', agents?.map(a => a.token)],
    queryFn: async () => {
      if (!agents?.length) return { totalWeth: '0', totalUsd: '$0' };

      const feeLocker = new FeeLockerService(publicClient);
      let totalWeth = 0n;

      for (const agent of agents) {
        const wethFees = await feeLocker.getAvailableWethFees(
          agent.token,
          agent.wallet
        );
        totalWeth += wethFees;
      }

      return {
        totalWeth: formatEther(totalWeth),
        totalUsd: `$${(Number(formatEther(totalWeth)) * ETH_PRICE).toFixed(2)}`,
      };
    },
    enabled: !!agents?.length,
  });
}
```

### 5.4 Tasks

- [ ] Create portfolio page with aggregate view
- [ ] Create agents list page
- [ ] Create deploy agent page (with ENS naming)
- [ ] Create providers browse page
- [ ] Create delegation page (sign intent)
- [ ] Implement useUserAgents hook (Clawnch API)
- [ ] Implement useAggregateFees hook (FeeLocker)
- [ ] Implement useProviders hook (indexer)
- [ ] Add policy configuration form
- [ ] Connect to DelegationRouter for signing

---

## Phase 6: Provider Worker

**Goal:** Create a reference provider worker implementation.

### 6.1 Worker Structure

```
agents/meta-treasury-provider/
├── src/
│   ├── index.ts               # Cloudflare Worker entry
│   ├── routes/
│   │   ├── capabilities.ts    # GET /capabilities
│   │   ├── quote.ts           # POST /quote
│   │   └── execute.ts         # POST /execute
│   ├── services/
│   │   ├── feeChecker.ts      # Check fees across tokens
│   │   ├── feeClaimer.ts      # Claim from FeeLocker
│   │   └── policyExecutor.ts  # Execute management policy
│   └── types.ts
├── wrangler.toml
└── package.json
```

### 6.2 Capabilities Endpoint

```typescript
// agents/meta-treasury-provider/src/routes/capabilities.ts

export async function handleCapabilities(): Promise<Response> {
  return Response.json({
    type: 'meta-treasury-manager',
    version: '1.0.0',
    supportedPlatforms: ['moltbook', '4claw', 'clawstr', 'moltx'],
    strategies: {
      claiming: {
        frequency: ['daily', 'weekly', 'monthly', 'threshold'],
        minThreshold: '0.01 WETH',
      },
      wethManagement: {
        compound: true,
        toStables: true,
        hold: true,
        customSplit: true,
      },
      tokenManagement: {
        holdWinners: true,
        exitLosers: true,
        rebalance: true,
      },
    },
    pricing: {
      type: 'percentage',
      value: '2%',
      basis: 'claimed fees',
    },
    supportedChains: [84532], // Base Sepolia
    description: 'Reference implementation of meta-treasury management',
  });
}
```

### 6.3 Tasks

- [x] Create provider worker scaffold (agents/meta-treasury-provider/)
- [x] Implement /capabilities endpoint
- [x] Implement /quote endpoint
- [x] Implement /execute endpoint (calls DelegationRouter)
- [x] Add fee checking logic (services/feeChecker.ts)
- [x] Add policy execution logic (services/policyExecutor.ts)
- [ ] Deploy to Cloudflare
- [ ] Register as provider (ERC-8004 + ENS)

---

## Phase 7: Dogfooding & Demo

**Goal:** Deploy test agents, launch tokens, and demo the platform.

### 7.1 Dogfooding Script

```typescript
// scripts/dogfood-setup.ts

import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { ClawnchService } from '@oikonomos/sdk';

const DEPLOYER_KEY = process.env.DEPLOYER_KEY!;

// Derive 4 agent wallets
const agents = [
  { name: 'alpha', platform: 'moltbook', index: 0 },
  { name: 'beta', platform: '4claw', index: 1 },
  { name: 'gamma', platform: 'clawstr', index: 2 },
  { name: 'delta', platform: 'moltx', index: 3 },
];

async function main() {
  const deployer = privateKeyToAccount(DEPLOYER_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account: deployer,
    chain: baseSepolia,
    transport: http(),
  });

  console.log('🚀 Starting dogfood setup...\n');

  for (const agent of agents) {
    // Generate deterministic wallet for this agent
    const agentWallet = deriveWallet(DEPLOYER_KEY, agent.index);

    console.log(`\n📦 Setting up ${agent.name}.agents.oikonomos.eth`);
    console.log(`   Wallet: ${agentWallet.address}`);

    // 1. Fund agent wallet
    console.log('   💰 Funding wallet...');
    await walletClient.sendTransaction({
      to: agentWallet.address,
      value: parseEther('0.05'),
    });

    // 2. Register ENS subname
    console.log('   📛 Registering ENS subname...');
    await registerSubname({
      label: agent.name,
      parent: 'agents.oikonomos.eth',
      owner: agentWallet.address,
    });

    // 3. Launch token via Clawnch
    console.log(`   🎯 Launching $${agent.name.toUpperCase()} on ${agent.platform}...`);
    const clawnch = new ClawnchService(process.env.MOLTBOOK_API_KEY);

    const result = await clawnch.launchToken({
      name: `Oikonomos ${agent.name.toUpperCase()}`,
      symbol: agent.name.toUpperCase(),
      wallet: agentWallet.address,
      description: `Test token for ${agent.name}.agents.oikonomos.eth`,
      platform: agent.platform,
    });

    console.log(`   ✅ Token launched: ${result.contractAddress}`);
    console.log(`   🔗 Clanker: ${result.clankerUrl}`);
  }

  console.log('\n✨ Dogfood setup complete!');
  console.log('\nNext steps:');
  console.log('1. Generate some trades on the tokens to accumulate fees');
  console.log('2. Open the dashboard to see the aggregate portfolio');
  console.log('3. Create a delegation to the provider');
}

main().catch(console.error);
```

### 7.2 Demo Checklist

- [ ] Deploy 4 agents with ENS names
- [ ] Launch 4 tokens (one per platform)
- [ ] Execute some test trades to generate fees
- [ ] Show aggregate portfolio in dashboard
- [ ] Create delegation to provider
- [ ] Execute management cycle
- [ ] Verify on-chain receipts

### 7.3 Tasks

- [x] Create dogfood-setup.ts script (scripts/dogfood-setup.ts)
- [x] Generate/store agent wallet keys (deterministic derivation from deployer key)
- [ ] Register ENS subnames
- [ ] Launch tokens via Clawnch
- [ ] Execute test trades
- [ ] Verify fees accumulating
- [ ] Demo full flow end-to-end

---

## Summary

### Files Created ✅

```
packages/sdk/src/services/
├── clawnch.ts                 # ✅ Clawnch API integration
└── feeLocker.ts               # ✅ ClankerFeeLocker integration

packages/indexer/abis/
└── PoolManager.ts             # ✅ Uniswap V4 PoolManager ABI

packages/contracts/src/
├── DelegationRouter.sol       # ✅ Delegation contract
└── script/DeployDelegationRouter.s.sol  # ✅ Deployment script

packages/indexer/
├── ponder.config.ts           # ✅ Updated (PoolManager added)
├── ponder.schema.ts           # ✅ Updated (swapReceipt, agentMetrics)
└── src/index.ts               # ✅ Updated (Swap handler)

packages/shared/src/
└── constants.ts               # ✅ Added Clanker addresses

agents/meta-treasury-provider/ # ✅ Reference provider worker
├── src/
│   ├── index.ts               # Worker entry point
│   ├── types.ts               # Type definitions
│   ├── routes/                # Route handlers
│   │   ├── capabilities.ts
│   │   ├── quote.ts
│   │   └── execute.ts
│   └── services/              # Business logic
│       ├── feeChecker.ts
│       └── policyExecutor.ts
├── wrangler.toml
├── package.json
└── tsconfig.json

scripts/
└── dogfood-setup.ts           # ✅ Dogfooding script
```

### Files to Create (Dashboard - Deferred)

```
apps/dashboard/app/
├── portfolio/page.tsx         # Aggregate view
├── agents/page.tsx            # Agent list
├── agents/deploy/page.tsx     # Deploy agent
├── providers/page.tsx         # Browse providers
└── delegate/page.tsx          # Create delegation
```

### Files Deleted ✅

```
packages/contracts/src/core/ReceiptHook.sol          # ✅ Deleted
packages/contracts/src/core/interfaces/IReceiptHook.sol  # ✅ Deleted
packages/contracts/src/mocks/MockUSDC.sol            # ✅ Deleted
packages/contracts/src/mocks/MockDAI.sol             # ✅ Deleted
packages/contracts/src/libraries/HookDataLib.sol     # ✅ Deleted
packages/contracts/test/HookDataLib.t.sol            # ✅ Deleted
packages/indexer/abis/ReceiptHook.json               # ✅ Deleted
packages/indexer/abis/ReceiptHook.ts                 # ✅ Deleted
packages/sdk/src/contracts/receiptHook.ts            # ✅ Deleted
agents/treasury-agent/src/config/pools.test.ts       # ✅ Deleted
```

### Files Modified ✅

```
packages/indexer/ponder.config.ts    # ✅ Removed ReceiptHook, added PoolManager
packages/indexer/ponder.schema.ts    # ✅ New schema (swapReceipt, agentMetrics)
packages/indexer/src/index.ts        # ✅ New Swap handler, removed ReceiptHook handlers
packages/shared/src/constants.ts     # ✅ Added Clanker addresses
packages/shared/src/abis.ts          # ✅ Removed ReceiptHookABI
packages/sdk/src/index.ts            # ✅ Updated exports
packages/sdk/src/contracts/index.ts  # ✅ Removed ReceiptHook exports
packages/sdk/src/services/index.ts   # ✅ Added Clawnch & FeeLocker exports
agents/treasury-agent/src/config/pools.ts  # ✅ Updated for Clanker
```

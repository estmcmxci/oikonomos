# Engineering Execution Document (EED)

## Oikonomos: ENS-native Agent Registry for Uniswap v4 Automation

**Version:** 1.0.0
**Last Updated:** January 29, 2026
**Target Network:** Ethereum Sepolia (Chain ID: 11155111)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Agent Taxonomy](#2-agent-taxonomy)
3. [Dependency Graph](#3-dependency-graph)
4. [Build Phases](#4-build-phases)
5. [File Tree Structure](#5-file-tree-structure)
6. [Phase Details](#6-phase-details)
7. [Contract Addresses](#7-contract-addresses)
8. [MVP Critical Path](#8-mvp-critical-path)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Checklist](#10-deployment-checklist)

---

## 1. Executive Summary

Oikonomos is an agentic finance framework where:
- **Users** define policies (constraints)
- **Strategies** compete on execution quality
- **Receipts** prove everything on-chain
- **Reputation** emerges from verifiable performance

The system has a clear dependency hierarchy. This document specifies the exact order in which components must be built to minimize blocked work and maximize parallel development.

### Core Principle

**ReceiptHook is the trust anchor.** Every other component either produces receipts, consumes receipts, or displays receipt data. Build it first.

---

## 2. Agent Taxonomy

The system defines three categories of agents. Understanding this taxonomy is essential for planning the build sequence.

### 2.1 Category 1: Module Agents

Module agents are the core automation endpoints that users and DAOs interact with.

| Agent Type | ENS Pattern | Purpose | Build Phase |
|------------|-------------|---------|-------------|
| **treasury** | `treasury.<brand>.eth` | Stablecoin/portfolio rebalancing | Phase 5 |
| **router** | `router.<brand>.eth` | Execution router - validates intents, executes swaps | Phase 5 |
| **lp** | `lp.<brand>.eth` | LP rebalancer - concentrated liquidity management | v1+ |
| **vault** | `vault.<brand>.eth` | Managed vault - strategy profiles | v1+ |
| **netting** | `netting.<brand>.eth` | Coordination module - batch netting | v2+ |
| **receipts** | `receipts.<brand>.eth` | Receipt verifier endpoint | v1+ |

### 2.2 Category 2: Strategy Agents

Strategy agents compete in the marketplace to optimize execution *within* policy constraints.

| Strategy Type | ENS Pattern | Purpose | Competes On |
|---------------|-------------|---------|-------------|
| **routing-strategy** | `strategy.router.<brand>.eth` | Swap path selection | Slippage, gas |
| **rebalance-strategy** | `strategy.treasury.<brand>.eth` | Drift logic + amounts | Tracking error |
| **lp-strategy** | `strategy.lp.<brand>.eth` | Range placement | Fee APR |
| **batching-strategy** | `strategy.netting.<brand>.eth` | Netting/aggregation | Volume reduction |

### 2.3 Category 3: Service Agents (Implementation)

Service agents are the deployed Cloudflare Workers implementing A2A protocol.

| Service | File Location | Role | Dependencies |
|---------|---------------|------|--------------|
| **treasury-agent** | `agents/treasury-agent/` | Drift detection, rebalance orchestration | SDK, IntentRouter/AgentExecutor |
| **router-agent** | `agents/router-agent/` | Route optimization, swap execution | SDK, IntentRouter |
| **strategy-agent** | `agents/strategy-agent/` | Marketplace template (A2A + x402) | SDK, PoolManager |

### 2.4 Agent Relationship Diagram

```
USER / DAO
     │
     │ selects module
     ▼
┌─────────────────────────────────────┐
│  MODULE AGENTS (Category 1)         │
│  treasury.eth │ router.eth │ lp.eth │
└─────────────────────────────────────┘
     │
     │ delegates execution to
     ▼
┌─────────────────────────────────────┐
│  STRATEGY AGENTS (Category 2)       │
│  strategy.router.alice.eth          │
│  (competes on quality, earns x402)  │
└─────────────────────────────────────┘
     │
     │ implemented by
     ▼
┌─────────────────────────────────────┐
│  SERVICE AGENTS (Category 3)        │
│  treasury-agent │ strategy-agent    │
│  (Cloudflare Workers)               │
└─────────────────────────────────────┘
     │
     │ calls
     ▼
┌─────────────────────────────────────┐
│  ON-CHAIN CONTRACTS                 │
│  IntentRouter │ AgentExecutor       │
│  ReceiptHook │ IdentityRegistry     │
└─────────────────────────────────────┘
```

### 2.5 MVP Agent Scope

| Category | MVP Agents | Deferred |
|----------|------------|----------|
| Module | treasury, router | lp, vault, netting, receipts |
| Strategy | routing-strategy | rebalance, lp, batching |
| Service | treasury-agent, strategy-agent | router-agent (merged into treasury) |

---

## 3. Dependency Graph

### 2.1 Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPENDENCY HIERARCHY                               │
│                                                                              │
│  LAYER 6    ┌─────────────────────────────────────────────────────────┐     │
│  (Frontend) │  Dashboard  │  Marketplace  │  Submission Wizard        │     │
│             └──────────────────────────┬──────────────────────────────┘     │
│                                        │                                     │
│                                        ▼                                     │
│  LAYER 5    ┌─────────────────────────────────────────────────────────┐     │
│  (Agents)   │  treasury-agent  │  router-agent  │  strategy-agent     │     │
│             └──────────────────────────┬──────────────────────────────┘     │
│                                        │                                     │
│                          ┌─────────────┼─────────────┐                      │
│                          ▼             ▼             ▼                      │
│  LAYER 4    ┌────────────────┐ ┌─────────────┐ ┌──────────────┐            │
│  (Data)     │    Indexer     │ │     SDK     │ │ ENS Resolver │            │
│             └───────┬────────┘ └──────┬──────┘ └──────────────┘            │
│                     │                 │                                     │
│                     ▼                 ▼                                     │
│  LAYER 3    ┌────────────────────────────────────────────────────────┐     │
│  (Trust)    │              Reputation Registry (ERC-8004)             │     │
│             └──────────────────────────┬─────────────────────────────┘     │
│                                        │                                     │
│                          ┌─────────────┴─────────────┐                      │
│                          ▼                           ▼                      │
│  LAYER 2    ┌────────────────────────┐ ┌────────────────────────┐          │
│  (Policy)   │  IntentRouter (Mode A) │ │ AgentExecutor (Mode B) │          │
│             └───────────┬────────────┘ └────────────┬───────────┘          │
│                         │                           │                       │
│                         └─────────────┬─────────────┘                       │
│                                       ▼                                     │
│  LAYER 1    ┌─────────────────────────────────────────────────────────┐    │
│  (Identity) │              Identity Registry (ERC-8004)                │    │
│             └──────────────────────────┬──────────────────────────────┘    │
│                                        │                                    │
│                                        ▼                                    │
│  LAYER 0    ┌─────────────────────────────────────────────────────────┐    │
│  (Core)     │                    RECEIPT HOOK                          │    │
│             │              (The Trust Anchor - BUILD FIRST)            │    │
│             └──────────────────────────┬──────────────────────────────┘    │
│                                        │                                    │
│                                        ▼                                    │
│  EXTERNAL   ┌─────────────────────────────────────────────────────────┐    │
│             │  Uniswap v4 PoolManager  │  Gnosis Safe  │  Roles Mod   │    │
│             │  ENS Registry            │  IPFS         │  x402        │    │
│             └─────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Dependency Matrix

| Component | Depends On | Depended On By | Build Phase |
|-----------|------------|----------------|-------------|
| ReceiptHook | PoolManager (external) | Everything | **Phase 1** |
| IdentityRegistry | - | ReputationRegistry, Agents, Marketplace | **Phase 1** |
| IntentRouter | ReceiptHook | router-agent, treasury-agent | **Phase 2** |
| AgentExecutor | ReceiptHook, Safe, Roles | treasury-agent | **Phase 2** |
| SDK | Contracts (ABIs) | Agents, Frontend | **Phase 3** |
| Indexer | ReceiptHook events | Reputation, Dashboard, Marketplace | **Phase 3** |
| ReputationRegistry | IdentityRegistry, Indexer | Marketplace, Leaderboard | **Phase 4** |
| strategy-agent | SDK, x402 | treasury-agent, router-agent | **Phase 5** |
| treasury-agent | SDK, IntentRouter/AgentExecutor | Users | **Phase 5** |
| router-agent | SDK, IntentRouter | treasury-agent | **Phase 5** |
| Dashboard | SDK, Indexer, Agents | Users | **Phase 6** |
| Marketplace | ReputationRegistry, Indexer | Users, Providers | **Phase 6** |
| Submission Wizard | IdentityRegistry, ENS, IPFS | Strategy Providers | **Phase 6** |

### 2.3 Blocking Dependencies

These are **hard blockers** - you cannot proceed without them:

```
ReceiptHook ──blocks──► IntentRouter
                       AgentExecutor
                       Indexer
                       All Agents

IdentityRegistry ──blocks──► ReputationRegistry
                             Agent Registration
                             Marketplace Listings

Indexer ──blocks──► Dashboard (execution history)
                    Marketplace (leaderboard)
                    ReputationRegistry (score computation)

SDK ──blocks──► All Agents
                Frontend API calls
```

---

## 4. Build Phases

### Phase Overview

| Phase | Duration | Components | Unlocks |
|-------|----------|------------|---------|
| **1** | Week 1 | ReceiptHook, IdentityRegistry | Trust layer, agent identity |
| **2** | Week 1-2 | IntentRouter, AgentExecutor | Both execution modes |
| **3** | Week 2 | SDK, Indexer | Data access layer |
| **4** | Week 2-3 | ReputationRegistry | Trust scores |
| **5** | Week 3-4 | Agents (strategy, treasury, router) | Automation |
| **6** | Week 4-5 | Dashboard, Marketplace, Wizard | User interface |

### Phase Dependencies

```
Phase 1 ────► Phase 2 ────► Phase 3 ────► Phase 4
   │                           │             │
   │                           │             ▼
   │                           └────────► Phase 5
   │                                         │
   └─────────────────────────────────────────┴────► Phase 6
```

---

## 5. File Tree Structure

```
oikonomos/
│
├── docs/
│   ├── PRD.md                              # Product Requirements
│   └── EED.md                              # This document
│
├── context/                                # Technical context (15 files)
│   ├── uniswap-v4.md
│   ├── gnosis-safe.md
│   ├── erc-8004-contracts.md
│   └── ...
│
├── diagrams/                               # Architecture diagrams
│   ├── architecture.mmd
│   ├── treasury-autopilot-sequence.mmd
│   ├── policy-comparison.mmd
│   └── ens-resolution-flow.mmd
│
│
│   ══════════════════════════════════════════════════════════════════
│   PHASE 1: TRUST ANCHOR + IDENTITY
│   ══════════════════════════════════════════════════════════════════
│
├── packages/
│   │
│   ├── contracts/
│   │   ├── foundry.toml
│   │   ├── remappings.txt
│   │   │
│   │   ├── src/
│   │   │   │
│   │   │   ├── core/                       # PHASE 1.1: RECEIPT HOOK
│   │   │   │   ├── ReceiptHook.sol
│   │   │   │   ├── ReceiptLib.sol
│   │   │   │   └── interfaces/
│   │   │   │       ├── IReceiptHook.sol
│   │   │   │       └── IReceiptEmitter.sol
│   │   │   │
│   │   │   ├── identity/                   # PHASE 1.2: IDENTITY
│   │   │   │   ├── IdentityRegistry.sol
│   │   │   │   ├── ReputationRegistry.sol  # (Phase 4)
│   │   │   │   ├── ValidationRegistry.sol  # (v1+)
│   │   │   │   └── interfaces/
│   │   │   │       ├── IIdentityRegistry.sol
│   │   │   │       └── IReputationRegistry.sol
│   │   │   │
│   │   │   │
│   │   │   │   ════════════════════════════════════════════════════
│   │   │   │   PHASE 2: POLICY ENFORCEMENT
│   │   │   │   ════════════════════════════════════════════════════
│   │   │   │
│   │   │   ├── policy/                     # PHASE 2: POLICY
│   │   │   │   ├── IntentRouter.sol        # Phase 2.1: Mode A
│   │   │   │   ├── AgentExecutor.sol       # Phase 2.2: Mode B
│   │   │   │   ├── PolicyRegistry.sol      # (optional)
│   │   │   │   └── interfaces/
│   │   │   │       ├── IIntentRouter.sol
│   │   │   │       └── IAgentExecutor.sol
│   │   │   │
│   │   │   └── libraries/
│   │   │       ├── PolicyLib.sol
│   │   │       ├── IntentLib.sol
│   │   │       └── HookDataLib.sol
│   │   │
│   │   ├── script/
│   │   │   ├── 00_DeployReceiptHook.s.sol
│   │   │   ├── 01_DeployIdentity.s.sol
│   │   │   ├── 02_DeployIntentRouter.s.sol
│   │   │   ├── 03_DeployAgentExecutor.s.sol
│   │   │   ├── 04_CreateTestPools.s.sol
│   │   │   └── 05_RegisterTestAgent.s.sol
│   │   │
│   │   └── test/
│   │       ├── ReceiptHook.t.sol
│   │       ├── IdentityRegistry.t.sol
│   │       ├── IntentRouter.t.sol
│   │       ├── AgentExecutor.t.sol
│   │       └── mocks/
│   │           ├── MockERC20.sol
│   │           └── MockPoolManager.sol
│   │
│   │
│   │   ══════════════════════════════════════════════════════════════════
│   │   PHASE 3: SDK + INDEXER
│   │   ══════════════════════════════════════════════════════════════════
│   │
│   ├── sdk/                                # PHASE 3.1: SDK
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   │
│   │   └── src/
│   │       ├── index.ts
│   │       │
│   │       ├── contracts/
│   │       │   ├── receiptHook.ts
│   │       │   ├── identityRegistry.ts
│   │       │   ├── reputationRegistry.ts
│   │       │   ├── intentRouter.ts
│   │       │   └── agentExecutor.ts
│   │       │
│   │       ├── ens/
│   │       │   ├── resolver.ts
│   │       │   ├── records.ts
│   │       │   └── types.ts
│   │       │
│   │       ├── intents/
│   │       │   ├── builder.ts
│   │       │   ├── signer.ts
│   │       │   └── types.ts
│   │       │
│   │       ├── receipts/
│   │       │   ├── decoder.ts
│   │       │   ├── verifier.ts
│   │       │   └── types.ts
│   │       │
│   │       └── safe/
│   │           ├── executor.ts
│   │           ├── roles.ts
│   │           └── types.ts
│   │
│   │
│   ├── indexer/                            # PHASE 3.2: INDEXER
│   │   ├── package.json
│   │   ├── ponder.config.ts
│   │   ├── ponder.schema.ts
│   │   │
│   │   └── src/
│   │       ├── handlers/
│   │       │   ├── receiptHook.ts
│   │       │   ├── identityRegistry.ts
│   │       │   └── reputationRegistry.ts
│   │       │
│   │       ├── aggregations/
│   │       │   ├── strategyMetrics.ts
│   │       │   ├── leaderboard.ts
│   │       │   └── userHistory.ts
│   │       │
│   │       └── api/
│   │           ├── strategies.ts
│   │           ├── receipts.ts
│   │           └── reputation.ts
│   │
│   │
│   └── shared/                             # SHARED TYPES
│       ├── package.json
│       └── src/
│           ├── types.ts
│           ├── constants.ts
│           ├── abis.ts
│           └── validation.ts
│
│
│   ══════════════════════════════════════════════════════════════════
│   PHASE 5: AGENT SERVICES
│   ══════════════════════════════════════════════════════════════════
│
├── agents/
│   │
│   ├── strategy-agent/                     # PHASE 5.1: STRATEGY TEMPLATE
│   │   ├── package.json
│   │   ├── wrangler.toml
│   │   │
│   │   └── src/
│   │       ├── index.ts
│   │       │
│   │       ├── a2a/
│   │       │   ├── agent-card.ts
│   │       │   ├── quote.ts
│   │       │   ├── execute.ts
│   │       │   └── explain.ts
│   │       │
│   │       ├── x402/
│   │       │   ├── pricing.ts
│   │       │   ├── payment.ts
│   │       │   └── middleware.ts
│   │       │
│   │       ├── strategy/
│   │       │   ├── router.ts
│   │       │   ├── optimizer.ts
│   │       │   └── mev.ts
│   │       │
│   │       └── utils/
│   │           ├── hookData.ts
│   │           └── quoteId.ts
│   │
│   │
│   ├── treasury-agent/                     # PHASE 5.2: TREASURY AGENT
│   │   ├── package.json
│   │   ├── wrangler.toml
│   │   │
│   │   └── src/
│   │       ├── index.ts
│   │       │
│   │       ├── policy/
│   │       │   ├── parser.ts
│   │       │   ├── validator.ts
│   │       │   └── templates.ts
│   │       │
│   │       ├── triggers/
│   │       │   ├── drift.ts
│   │       │   ├── periodic.ts
│   │       │   └── threshold.ts
│   │       │
│   │       ├── rebalance/
│   │       │   ├── calculator.ts
│   │       │   ├── tranches.ts
│   │       │   └── executor.ts
│   │       │
│   │       └── modes/
│   │           ├── intentMode.ts
│   │           └── safeMode.ts
│   │
│   │
│   └── router-agent/                       # PHASE 5.3: ROUTER AGENT
│       ├── package.json
│       ├── wrangler.toml
│       │
│       └── src/
│           ├── index.ts
│           │
│           ├── routing/
│           │   ├── pathfinder.ts
│           │   ├── pools.ts
│           │   └── quotes.ts
│           │
│           └── execution/
│               ├── swap.ts
│               └── batch.ts
│
│
│   ══════════════════════════════════════════════════════════════════
│   PHASE 6: FRONTEND
│   ══════════════════════════════════════════════════════════════════
│
├── apps/
│   │
│   └── dashboard/                          # PHASE 6: NEXT.JS FRONTEND
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       │
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   │
│       │   ├── agent/
│       │   │   └── [ensName]/
│       │   │       ├── page.tsx
│       │   │       └── configure/
│       │   │           └── page.tsx
│       │   │
│       │   ├── portfolio/                  # MODE A VIEWS
│       │   │   ├── page.tsx
│       │   │   ├── history/
│       │   │   │   └── page.tsx
│       │   │   └── receipt/
│       │   │       └── [txHash]/
│       │   │           └── page.tsx
│       │   │
│       │   ├── treasury/                   # MODE B VIEWS
│       │   │   ├── page.tsx
│       │   │   ├── policy/
│       │   │   │   └── page.tsx
│       │   │   ├── executions/
│       │   │   │   └── page.tsx
│       │   │   └── reports/
│       │   │       └── page.tsx
│       │   │
│       │   ├── marketplace/                # MARKETPLACE VIEWS
│       │   │   ├── page.tsx
│       │   │   ├── [strategyEns]/
│       │   │   │   └── page.tsx
│       │   │   ├── compare/
│       │   │   │   └── page.tsx
│       │   │   └── submit/                 # SUBMISSION WIZARD
│       │   │       ├── page.tsx
│       │   │       ├── connect/
│       │   │       │   └── page.tsx
│       │   │       ├── deploy/
│       │   │       │   └── page.tsx
│       │   │       ├── identity/
│       │   │       │   └── page.tsx
│       │   │       ├── capabilities/
│       │   │       │   └── page.tsx
│       │   │       ├── pricing/
│       │   │       │   └── page.tsx
│       │   │       └── verify/
│       │   │           └── page.tsx
│       │   │
│       │   └── api/
│       │       ├── resolve/
│       │       │   └── route.ts
│       │       ├── receipts/
│       │       │   └── route.ts
│       │       ├── reputation/
│       │       │   └── route.ts
│       │       └── strategies/
│       │           └── route.ts
│       │
│       ├── components/
│       │   ├── agent/
│       │   │   ├── AgentCard.tsx
│       │   │   ├── AgentSearch.tsx
│       │   │   └── TrustScore.tsx
│       │   │
│       │   ├── policy/
│       │   │   ├── PolicyConfigurator.tsx
│       │   │   ├── AllocationSlider.tsx
│       │   │   ├── ConstraintInputs.tsx
│       │   │   └── PolicySummary.tsx
│       │   │
│       │   ├── portfolio/
│       │   │   ├── AllocationChart.tsx
│       │   │   ├── DriftIndicator.tsx
│       │   │   └── ExecutionLog.tsx
│       │   │
│       │   ├── treasury/
│       │   │   ├── TreasuryTable.tsx
│       │   │   ├── RolesPermissions.tsx
│       │   │   ├── TrancheProgress.tsx
│       │   │   └── MonthlyReport.tsx
│       │   │
│       │   ├── receipt/
│       │   │   ├── ReceiptCard.tsx
│       │   │   ├── ComplianceCheck.tsx
│       │   │   └── ProofLinks.tsx
│       │   │
│       │   ├── marketplace/
│       │   │   ├── Leaderboard.tsx
│       │   │   ├── StrategyCard.tsx
│       │   │   ├── PerformanceChart.tsx
│       │   │   ├── PricingTable.tsx
│       │   │   └── ComparisonTable.tsx
│       │   │
│       │   └── wizard/
│       │       ├── WizardProgress.tsx
│       │       ├── ConnectionTest.tsx
│       │       ├── CapabilitySelector.tsx
│       │       ├── PricingConfigurator.tsx
│       │       └── SandboxTest.tsx
│       │
│       ├── hooks/
│       │   ├── useAgent.ts
│       │   ├── useReceipts.ts
│       │   ├── useReputation.ts
│       │   ├── usePolicy.ts
│       │   └── useSafe.ts
│       │
│       └── lib/
│           ├── ens.ts
│           ├── wagmi.ts
│           └── api.ts
│
│
│   ══════════════════════════════════════════════════════════════════
│   CONFIG
│   ══════════════════════════════════════════════════════════════════
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 6. Phase Details

### Phase 1: Trust Anchor + Identity (Week 1)

**Goal:** Deploy the foundational contracts that everything else depends on.

#### 1.1 ReceiptHook

```solidity
// packages/contracts/src/core/ReceiptHook.sol

contract ReceiptHook is BaseHook {
    event ExecutionReceipt(
        bytes32 indexed strategyId,
        bytes32 indexed quoteId,
        address indexed sender,
        int128 amount0,
        int128 amount1,
        uint256 actualSlippage,
        bool policyCompliant,
        uint256 timestamp
    );

    function afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override returns (bytes4, int128) {
        // Decode hookData
        (bytes32 strategyId, bytes32 quoteId, uint256 maxSlippage) =
            abi.decode(hookData, (bytes32, bytes32, uint256));

        // Calculate actual slippage
        uint256 actualSlippage = _calculateSlippage(params, delta);

        // Emit receipt
        emit ExecutionReceipt(
            strategyId,
            quoteId,
            sender,
            delta.amount0(),
            delta.amount1(),
            actualSlippage,
            actualSlippage <= maxSlippage,
            block.timestamp
        );

        return (BaseHook.afterSwap.selector, 0);
    }
}
```

**Acceptance Criteria:**
- [ ] Hook deploys and registers with PoolManager
- [ ] afterSwap emits ExecutionReceipt with correct data
- [ ] hookData encoding/decoding works correctly
- [ ] Slippage calculation is accurate

#### 1.2 IdentityRegistry

```solidity
// packages/contracts/src/identity/IdentityRegistry.sol

contract IdentityRegistry is ERC721 {
    struct Agent {
        string agentURI;
        address agentWallet;
        uint256 registeredAt;
    }

    mapping(uint256 => Agent) public agents;
    uint256 public nextAgentId;

    function register(
        string calldata agentURI,
        bytes calldata metadata
    ) external returns (uint256 agentId) {
        agentId = nextAgentId++;
        agents[agentId] = Agent({
            agentURI: agentURI,
            agentWallet: msg.sender,
            registeredAt: block.timestamp
        });
        _mint(msg.sender, agentId);
    }
}
```

**Acceptance Criteria:**
- [ ] Agents can register with agentURI
- [ ] agentId (ERC-721) minted to registrant
- [ ] agentWallet can be verified/updated (EIP-712)

---

### Phase 2: Policy Enforcement (Week 1-2)

**Goal:** Enable both execution modes.

#### 2.1 IntentRouter (Mode A)

```solidity
// packages/contracts/src/policy/IntentRouter.sol

contract IntentRouter {
    IPoolManager public immutable poolManager;
    IReceiptHook public immutable receiptHook;

    struct Intent {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 maxSlippage;
        uint256 deadline;
        bytes32 strategyId;
    }

    function executeIntent(
        Intent calldata intent,
        bytes calldata signature,
        bytes calldata strategyData
    ) external {
        // 1. Verify signature (EIP-712)
        require(_verifyIntent(intent, signature), "Invalid signature");

        // 2. Check deadline
        require(block.timestamp <= intent.deadline, "Expired");

        // 3. Build hookData
        bytes memory hookData = abi.encode(
            intent.strategyId,
            keccak256(strategyData), // quoteId
            intent.maxSlippage
        );

        // 4. Execute swap
        poolManager.swap(poolKey, swapParams, hookData);
    }
}
```

**Acceptance Criteria:**
- [ ] Validates EIP-712 signed intents
- [ ] Enforces deadline, slippage constraints
- [ ] Passes correct hookData to PoolManager
- [ ] Receipt emitted with strategyId

#### 2.2 AgentExecutor (Mode B)

```solidity
// packages/contracts/src/policy/AgentExecutor.sol

contract AgentExecutor {
    IRolesModifier public immutable rolesModifier;

    function execute(
        address safe,
        bytes32 roleKey,
        address target,
        bytes calldata data,
        bytes32 strategyId,
        bytes32 quoteId
    ) external {
        // 1. Encode hookData into the call
        bytes memory enrichedData = _injectHookData(data, strategyId, quoteId);

        // 2. Execute through Roles → Safe → Target
        rolesModifier.execTransactionWithRole(
            target,
            0, // value
            enrichedData,
            Enum.Operation.Call,
            roleKey,
            true // shouldRevert
        );
    }
}
```

**Acceptance Criteria:**
- [ ] Integrates with Zodiac Roles Modifier
- [ ] Calls pass through Safe correctly
- [ ] Roles permissions enforced
- [ ] Receipt includes Safe tx hash

---

### Phase 3: SDK + Indexer (Week 2)

**Goal:** TypeScript interface and data layer.

#### 3.1 SDK

```typescript
// packages/sdk/src/index.ts

export { ReceiptHook } from './contracts/receiptHook';
export { IdentityRegistry } from './contracts/identityRegistry';
export { IntentRouter } from './contracts/intentRouter';
export { AgentExecutor } from './contracts/agentExecutor';

export { resolveAgent, getAgentRecords } from './ens/resolver';
export { buildIntent, signIntent } from './intents/builder';
export { decodeReceipt, verifyReceipt } from './receipts/decoder';
export { buildSafeTx, encodeRolesCall } from './safe/executor';

export * from './types';
```

**Key Functions:**

```typescript
// ENS Resolution
async function resolveAgent(ensName: string): Promise<AgentRecord> {
  const records = await getTextRecords(ensName, [
    'agent:type',
    'agent:mode',
    'agent:entrypoint',
    'agent:safe',
    'agent:rolesModifier',
    'agent:a2a',
    'agent:erc8004'
  ]);
  return parseAgentRecord(records);
}

// Intent Building
function buildIntent(params: IntentParams): Intent {
  return {
    user: params.user,
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    maxSlippage: params.maxSlippage,
    deadline: Math.floor(Date.now() / 1000) + params.ttlSeconds,
    strategyId: keccak256(toUtf8Bytes(params.strategyEns))
  };
}

// Receipt Decoding
function decodeReceipt(log: Log): ExecutionReceipt {
  const decoded = decodeEventLog({
    abi: ReceiptHookABI,
    data: log.data,
    topics: log.topics
  });
  return {
    strategyId: decoded.args.strategyId,
    quoteId: decoded.args.quoteId,
    amount0: decoded.args.amount0,
    amount1: decoded.args.amount1,
    actualSlippage: decoded.args.actualSlippage,
    policyCompliant: decoded.args.policyCompliant,
    timestamp: decoded.args.timestamp
  };
}
```

**Acceptance Criteria:**
- [ ] All contract ABIs exported
- [ ] ENS resolution works
- [ ] Intent building/signing works
- [ ] Receipt decoding works
- [ ] Safe transaction building works

#### 3.2 Indexer

```typescript
// packages/indexer/ponder.schema.ts

export const ExecutionReceipt = createTable({
  id: text().primaryKey(),
  strategyId: text().notNull(),
  quoteId: text().notNull(),
  sender: text().notNull(),
  amount0: bigint().notNull(),
  amount1: bigint().notNull(),
  actualSlippage: bigint().notNull(),
  policyCompliant: boolean().notNull(),
  timestamp: bigint().notNull(),
  blockNumber: bigint().notNull(),
  transactionHash: text().notNull()
});

export const StrategyMetrics = createTable({
  id: text().primaryKey(), // strategyId
  totalExecutions: bigint().notNull(),
  totalVolume: bigint().notNull(),
  avgSlippage: bigint().notNull(),
  successRate: bigint().notNull(), // basis points
  lastUpdated: bigint().notNull()
});
```

```typescript
// packages/indexer/src/handlers/receiptHook.ts

ponder.on('ReceiptHook:ExecutionReceipt', async ({ event, context }) => {
  // Store receipt
  await context.db.ExecutionReceipt.insert({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    strategyId: event.args.strategyId,
    quoteId: event.args.quoteId,
    sender: event.args.sender,
    amount0: event.args.amount0,
    amount1: event.args.amount1,
    actualSlippage: event.args.actualSlippage,
    policyCompliant: event.args.policyCompliant,
    timestamp: event.args.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash
  });

  // Update strategy metrics
  await updateStrategyMetrics(context.db, event.args.strategyId, event.args);
});
```

**Acceptance Criteria:**
- [ ] Indexes all ExecutionReceipt events
- [ ] Computes strategy metrics (avgSlippage, successRate)
- [ ] Exposes API endpoints for frontend
- [ ] Handles reorgs correctly

---

### Phase 4: Reputation Registry (Week 2-3)

**Goal:** On-chain trust scores derived from receipts.

```solidity
// packages/contracts/src/identity/ReputationRegistry.sol

contract ReputationRegistry {
    struct Reputation {
        uint256 totalExecutions;
        uint256 totalVolume;
        uint256 avgSlippage;       // basis points
        uint256 complianceRate;    // basis points (10000 = 100%)
        uint256 lastUpdated;
    }

    mapping(uint256 => Reputation) public reputations; // agentId => Reputation

    function recordExecution(
        uint256 agentId,
        uint256 volume,
        uint256 slippage,
        bool compliant
    ) external onlyAuthorized {
        Reputation storage rep = reputations[agentId];

        // Update running averages
        rep.avgSlippage = (rep.avgSlippage * rep.totalExecutions + slippage)
                          / (rep.totalExecutions + 1);

        rep.complianceRate = (rep.complianceRate * rep.totalExecutions + (compliant ? 10000 : 0))
                             / (rep.totalExecutions + 1);

        rep.totalExecutions++;
        rep.totalVolume += volume;
        rep.lastUpdated = block.timestamp;
    }

    function getScore(uint256 agentId) external view returns (uint256) {
        Reputation memory rep = reputations[agentId];

        // Score = weighted combination
        // 35% slippage (lower is better)
        // 25% compliance rate
        // 25% volume (log scale)
        // 15% execution count (log scale)

        uint256 slippageScore = rep.avgSlippage < 10 ? 35 : 35 - (rep.avgSlippage / 10);
        uint256 complianceScore = rep.complianceRate * 25 / 10000;
        uint256 volumeScore = _logScore(rep.totalVolume, 25);
        uint256 countScore = _logScore(rep.totalExecutions, 15);

        return slippageScore + complianceScore + volumeScore + countScore;
    }
}
```

**Acceptance Criteria:**
- [ ] Records execution data from receipts
- [ ] Computes trust scores correctly
- [ ] Scores update after each execution
- [ ] Leaderboard queryable

---

### Phase 5: Agent Services (Week 3-4)

**Goal:** Deploy automation layer.

#### 5.1 strategy-agent Template

```typescript
// agents/strategy-agent/src/index.ts

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // A2A Endpoints
    if (url.pathname === '/.well-known/agent-card.json') {
      return handleAgentCard(env);
    }
    if (url.pathname === '/quote') {
      return handleQuote(request, env);
    }
    if (url.pathname === '/execute') {
      return handleExecute(request, env);
    }

    // x402 Endpoints
    if (url.pathname === '/pricing') {
      return handlePricing(env);
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleQuote(request: Request, env: Env): Promise<Response> {
  const body = await request.json();

  // Generate quote
  const route = await findOptimalRoute(body.tokenIn, body.tokenOut, body.amount);
  const quoteId = generateQuoteId();

  return Response.json({
    quoteId,
    route,
    expectedSlippage: route.estimatedSlippage,
    expiresAt: Date.now() + 60000 // 1 minute
  });
}
```

#### 5.2 treasury-agent

```typescript
// agents/treasury-agent/src/triggers/drift.ts

export async function checkDrift(
  currentAllocations: Allocation[],
  targetAllocations: Allocation[],
  threshold: number
): Promise<DriftResult | null> {
  for (const target of targetAllocations) {
    const current = currentAllocations.find(a => a.token === target.token);
    const drift = Math.abs((current?.percentage ?? 0) - target.percentage);

    if (drift > threshold) {
      return {
        token: target.token,
        currentPercentage: current?.percentage ?? 0,
        targetPercentage: target.percentage,
        drift,
        action: current?.percentage > target.percentage ? 'sell' : 'buy'
      };
    }
  }
  return null;
}
```

**Acceptance Criteria:**
- [ ] strategy-agent responds to A2A protocol
- [ ] x402 payments work
- [ ] treasury-agent detects drift
- [ ] Rebalance executes through IntentRouter or AgentExecutor
- [ ] Receipts emitted with correct strategyId

---

### Phase 6: Frontend (Week 4-5)

**Goal:** User interface for all personas.

#### Key Components

```typescript
// apps/dashboard/components/receipt/ReceiptCard.tsx

export function ReceiptCard({ receipt }: { receipt: ExecutionReceipt }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <span>Execution Receipt</span>
          <Badge variant={receipt.policyCompliant ? 'success' : 'error'}>
            {receipt.policyCompliant ? 'Compliant' : 'Violation'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Input</Label>
            <Value>{formatAmount(receipt.amount0)}</Value>
          </div>
          <div>
            <Label>Output</Label>
            <Value>{formatAmount(receipt.amount1)}</Value>
          </div>
          <div>
            <Label>Slippage</Label>
            <Value>{receipt.actualSlippage} bps</Value>
          </div>
          <div>
            <Label>Strategy</Label>
            <Value>{truncateBytes32(receipt.strategyId)}</Value>
          </div>
        </div>
        <div className="mt-4">
          <Link href={`https://sepolia.etherscan.io/tx/${receipt.txHash}`}>
            View on Etherscan
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria:**
- [ ] Agent discovery works via ENS
- [ ] Policy configuration UI functional
- [ ] Mode A flow complete (sign intent → execute → view receipt)
- [ ] Mode B flow complete (view Safe → view tranche progress → view receipts)
- [ ] Marketplace leaderboard displays strategies
- [ ] Submission wizard allows new strategy registration

---

## 7. Contract Addresses

### External Dependencies (Sepolia)

| Contract | Address | Notes |
|----------|---------|-------|
| Uniswap v4 PoolManager | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` | Singleton |
| Universal Router | `0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b` | |
| Position Manager | `0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4` | |
| Quoter | `0x61b3f2011a92d183c7dbadbda940a7555ccf9227` | |
| USDC (Circle) | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | Faucet: faucet.circle.com |
| Safe Singleton | `0x41675C099F32341bf84BFc5382aF534df5C7461a` | |
| Roles Modifier | `0x9646fDAD06d3e24444381f44362a3B0eB343D337` | Zodiac |

### Oikonomos Contracts (To Deploy)

| Contract | Address | Deploy Script |
|----------|---------|---------------|
| ReceiptHook | TBD | `00_DeployReceiptHook.s.sol` |
| IdentityRegistry | TBD | `01_DeployIdentity.s.sol` |
| ReputationRegistry | TBD | `01_DeployIdentity.s.sol` |
| IntentRouter | TBD | `02_DeployIntentRouter.s.sol` |
| AgentExecutor | TBD | `03_DeployAgentExecutor.s.sol` |

---

## 8. MVP Critical Path

For a hackathon demo, the minimum viable path is:

```
┌─────────────────────────────────────────────────────────────────┐
│                     MVP CRITICAL PATH                            │
│                                                                  │
│   Week 1                                                         │
│   ├── Day 1-2: ReceiptHook.sol                                  │
│   ├── Day 3: IdentityRegistry.sol                               │
│   ├── Day 4-5: IntentRouter.sol (Mode A only)                   │
│   └── Day 6-7: Deploy to Sepolia, create test pools             │
│                                                                  │
│   Week 2                                                         │
│   ├── Day 1-2: SDK (minimal: receipts + intents)                │
│   ├── Day 3-4: Indexer (receipts only)                          │
│   ├── Day 5-6: treasury-agent (basic rebalance)                 │
│   └── Day 7: Integration testing                                 │
│                                                                  │
│   Week 3                                                         │
│   ├── Day 1-3: Dashboard (discovery + receipts)                 │
│   ├── Day 4-5: End-to-end demo flow                             │
│   └── Day 6-7: Polish, documentation, video                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### MVP Deliverables

1. **ReceiptHook** deployed, emitting receipts
2. **IntentRouter** deployed, validating intents
3. **treasury-agent** executing rebalances
4. **Dashboard** showing receipts and verification
5. **Demo video** of end-to-end flow

### What to Skip for MVP

- Mode B (AgentExecutor + Safe + Roles) → v1
- ReputationRegistry → v1
- Marketplace + Submission Wizard → v1
- x402 payments → v1

---

## 9. Testing Strategy

### Unit Tests

```
packages/contracts/test/
├── ReceiptHook.t.sol          # Hook lifecycle, encoding
├── IdentityRegistry.t.sol     # Registration, updates
├── IntentRouter.t.sol         # Validation, execution
├── AgentExecutor.t.sol        # Roles integration
└── ReputationRegistry.t.sol   # Score computation
```

### Integration Tests

```
packages/contracts/test/integration/
├── EndToEnd.t.sol             # Full flow: intent → swap → receipt
├── ModeA.t.sol                # EOA signs → IntentRouter → Pool
├── ModeB.t.sol                # Agent → Roles → Safe → Pool
└── StrategyAttribution.t.sol  # Verify strategyId in receipts
```

### Agent Tests

```
agents/treasury-agent/test/
├── drift.test.ts              # Drift detection logic
├── rebalance.test.ts          # Amount calculations
└── execution.test.ts          # Mode A/B execution paths
```

### Frontend Tests

```
apps/dashboard/__tests__/
├── ens.test.ts                # Resolution works
├── receipts.test.ts           # Decoding works
└── flows.test.tsx             # User flows complete
```

---

## 10. Deployment Checklist

### Pre-Deployment

- [ ] All unit tests passing
- [ ] Integration tests passing on fork
- [ ] Contracts verified on Etherscan
- [ ] ENS name registered (e.g., `treasury.oikonomos.eth`)
- [ ] USDC obtained from Circle faucet
- [ ] Mock DAI/USDT deployed (if needed)

### Deployment Sequence

```bash
# 1. Deploy ReceiptHook
forge script script/00_DeployReceiptHook.s.sol --broadcast --verify

# 2. Deploy Identity contracts
forge script script/01_DeployIdentity.s.sol --broadcast --verify

# 3. Deploy IntentRouter
forge script script/02_DeployIntentRouter.s.sol --broadcast --verify

# 4. Create test pools with hook
forge script script/04_CreateTestPools.s.sol --broadcast

# 5. Register test agent
forge script script/05_RegisterTestAgent.s.sol --broadcast

# 6. Set ENS text records
# (manual or script)

# 7. Deploy agents to Cloudflare
cd agents/treasury-agent && wrangler deploy

# 8. Deploy frontend to Vercel
cd apps/dashboard && vercel --prod
```

### Post-Deployment Verification

- [ ] ReceiptHook registered with PoolManager
- [ ] Test swap emits ExecutionReceipt
- [ ] ENS resolves to correct agent data
- [ ] Indexer catching events
- [ ] Dashboard displays receipts
- [ ] treasury-agent triggers work

---

## Appendix A: Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| v4 hook complexity | High | Use OpenZeppelin BaseHook, extensive testing |
| Roles parameter constraints | Medium | Test on Sepolia with actual Roles deployment |
| ERC-8004 edge cases | Medium | Keep identity layer simple for MVP |
| Indexer reorgs | Low | Ponder handles this; add confirmations |
| x402 payment failures | Low | Make payments optional for MVP |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **ReceiptHook** | Uniswap v4 hook that emits ExecutionReceipt events |
| **ExecutionReceipt** | On-chain proof of trade execution with strategyId |
| **strategyId** | bytes32 identifier linking execution to strategy (ENS hash) |
| **quoteId** | bytes32 linking paid quote to execution (for accountability) |
| **Mode A** | Intent-first execution (EOA signs EIP-712 intent) |
| **Mode B** | Safe+Roles execution (governance-controlled) |
| **hookData** | Encoded data passed to ReceiptHook via PoolManager |

---

*This document should be updated as implementation progresses.*

# Oikonomos Pivot Summary

## The Pivot

**From:** Marketplace for portfolio rebalancing strategies with custom ReceiptHook for accountability

**To:** Meta-treasury manager for users with multiple Clawnch-deployed AI agents

---

## Context: The Clawnch Ecosystem

Clawnch (https://clawn.ch) is a token launch platform for AI agents:

- **10,000+ tokens** launched by AI agents across Moltbook, 4claw, Clawstr, and Moltx
- Tokens deployed on **Base** via **Clanker** (Uniswap V4 with ClankerHook)
- **Fee split**: 80% to agent wallet / 20% to Clawnch platform
- Fees accumulate in **ClankerFeeLocker** contract:
  - WETH fees (from LP trading activity)
  - Token fees (in native token units)

**The Problem We Solve:**

Users who deploy multiple AI agents face complexity:
- Multiple agents across multiple platforms
- Multiple tokens with different performance
- Fee streams scattered across FeeLocker positions
- Manual claiming is tedious
- No unified strategy for fee management

---

## The New Vision

### Oikonomos = Meta-Treasury Manager

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                    │
│                                                                 │
│  Deploys agents via Oikonomos:                                 │
│  ├── alpha.agents.oikonomos.eth → launches $ALPHA on Moltbook  │
│  ├── beta.agents.oikonomos.eth  → launches $BETA on 4claw      │
│  ├── gamma.agents.oikonomos.eth → launches $GAMMA on Clawstr   │
│  └── delta.agents.oikonomos.eth → launches $DELTA on Moltx     │
│                                                                 │
│  Tokens traded on Clanker → Fees accumulate in FeeLocker       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OIKONOMOS PLATFORM                           │
│                                                                 │
│  1. Aggregate view of all user's agents + tokens               │
│  2. Track fees across all ClankerFeeLocker positions           │
│  3. Define management policy (claim freq, strategies, risk)    │
│  4. Match with Strategy Provider from marketplace              │
│  5. Provider manages portfolio within policy bounds            │
│  6. All actions verifiable via indexed Swap events             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 STRATEGY PROVIDERS (Marketplace)                │
│                                                                 │
│  Offer meta-management strategies:                             │
│  ├── Auto-claim & compound                                     │
│  ├── Diversification across tokens                             │
│  ├── Exit to stables                                           │
│  └── Custom strategies within policy bounds                    │
│                                                                 │
│  Earn x402 fees (% of claimed fees) for services               │
│  Build reputation via on-chain execution history               │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Journeys

### [Consumer Journey](./STRATEGY_CONSUMER_JOURNEY.md)
1. Connect wallet to Oikonomos
2. Discover existing agents (or deploy new ones with ENS naming)
3. View aggregate portfolio (tokens, fees, performance)
4. Define management policy (claim frequency, WETH strategy, token strategy)
5. Get matched with strategy providers
6. Delegate to selected provider (sign EIP-712 intent)
7. Provider manages portfolio within policy bounds
8. Verify all actions on-chain



### [Provider Journey](./STRATEGY_PROVIDER_JOURNEY.md)
1. Build meta-management strategy (Cloudflare Worker with A2A protocol)
2. Register identity (ERC-8004 + ENS)
3. List capabilities on marketplace
4. Get matched with users whose policies fit
5. Execute management (claim fees, execute strategies)
6. Earn x402 fees (% of claimed fees)
7. Build reputation via indexed Swap events

---

## Architecture Changes

### Contracts

| Contract | Status | Notes |
|----------|--------|-------|
| **ReceiptHook** | DELETE | Using Clanker pools, not custom pools |
| **MockUSDC/MockDAI** | DELETE | Using Clanker-launched tokens |
| **IdentityRegistry** | KEEP | ERC-8004 agent identity |
| **SubnameManager** | KEEP | ENS naming for agents |
| **IntentRouter** | REFACTOR → DelegationRouter | Handle fee claiming + policy enforcement |

### New DelegationRouter

```solidity
contract DelegationRouter {
    function executeManagement(
        SignedIntent calldata intent,   // User's signed delegation
        address provider,                // Who's executing
        ClaimParams[] calldata claims,   // Which tokens to claim
        Action[] calldata actions        // What to do with fees
    ) external {
        // 1. Validate intent signature
        // 2. Validate provider authorization
        // 3. Claim fees from ClankerFeeLocker
        // 4. Execute actions within policy bounds
        // 5. Pay provider fee
        // 6. Emit event for indexer
    }
}
```

### Indexer Changes

| Before | After |
|--------|-------|
| Watch ReceiptHook.ExecutionReceipt | Watch PoolManager.Swap events |
| Custom event with strategyId | Map sender wallet → agent → strategyId |
| Only our pools | Any Clanker pool |

### Integrations

| Integration | Purpose |
|-------------|---------|
| **@clawnch/sdk** | Launch tokens, check fees, claim fees |
| **clawnch-mcp-server** | MCP tools for AI agent interaction |
| **ClankerFeeLocker** | Call claim() for fee collection |
| **Uniswap V4 PoolManager** | Index Swap events for accountability |

---

## Clanker Contracts (Base Sepolia)

```
PoolManager:      0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408
Clanker:          0xE85A59c628F7d27878ACeB4bf3b35733630083a9
ClankerFeeLocker: 0x42A95190B4088C88Dd904d930c79deC1158bF09D
ClankerHook:      0xE63b0A59100698f379F9B577441A561bAF9828cc
```

---

## Dogfooding Plan

To demo the platform, we deploy our own agents:

```
DEPLOYER_WALLET
      │
      │ funds 4 derived wallets
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  alpha.agents.oikonomos.eth → $ALPHA on Moltbook               │
│  beta.agents.oikonomos.eth  → $BETA on 4claw                   │
│  gamma.agents.oikonomos.eth → $GAMMA on Clawstr                │
│  delta.agents.oikonomos.eth → $DELTA on Moltx                  │
└─────────────────────────────────────────────────────────────────┘

Each wallet = separate agent = bypasses 1/24h rate limit
All 4 tokens launched same day
Generate trades → fees accumulate → demo meta-management
```

---

## Value Proposition

### For Users (Consumers)
- **Aggregation**: Unified view of all agents and tokens
- **Automation**: Policy-based fee management
- **Convenience**: Don't manage manually, delegate to experts
- **Verification**: All actions auditable on-chain

### For Providers
- **Revenue**: Earn % of claimed fees
- **Marketplace**: Get matched with users who need your strategy
- **Reputation**: Build track record via on-chain history
- **Specialization**: Differentiate on strategy quality

### For the Ecosystem
- **Complements Clawnch**: Doesn't compete, builds on top
- **Solves real problem**: Managing multi-agent portfolios is hard
- **Accountability layer**: Adds trust/verification to agent actions

---

## Key Insight

**Clawnch commoditized token launching. Oikonomos adds the management layer.**

The marketplace differentiator is preserved:
- Providers compete on strategy quality and fees
- Reputation built from on-chain execution history
- Policy matching connects supply (providers) to demand (users)

But the focus shifts from "rebalancing portfolios" to "managing AI agent ecosystems."

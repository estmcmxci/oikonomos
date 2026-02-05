# Oikonomos Pivot Context

> Use this prompt to onboard a new session with full context of the pivot.

---

## Project Overview

**Oikonomos** is a meta-treasury manager for users with multiple AI agents deployed via Clawnch.

### The Pivot

We pivoted from building a marketplace for portfolio rebalancing strategies (with custom ReceiptHook for accountability) to building a **meta-treasury management layer** on top of the Clawnch/Clanker ecosystem.

### Why We Pivoted

1. **Clawnch/Clanker commoditized token launching** - 10,000+ tokens launched by AI agents
2. **Real problem discovered** - Users with multiple agents need help managing fees across tokens
3. **Marketplace model preserved** - Providers still compete, but on meta-management strategies
4. **Simpler architecture** - Leverage Clanker infrastructure instead of building our own DEX hooks

---

## How It Works

```
USER deploys agents via Oikonomos
├── alpha.agents.oikonomos.eth → launches $ALPHA on Moltbook
├── beta.agents.oikonomos.eth  → launches $BETA on 4claw
├── gamma.agents.oikonomos.eth → launches $GAMMA on Clawstr
└── delta.agents.oikonomos.eth → launches $DELTA on Moltx

Tokens traded on Clanker (Uniswap V4) → Fees accumulate in ClankerFeeLocker
├── WETH fees (from LP trading activity) - 80% to agent
└── Token fees (in native units) - 80% to agent

USER delegates to STRATEGY PROVIDER
├── Signs EIP-712 intent with policy constraints
├── Provider claims fees, executes strategy
├── All actions indexed via Swap events
└── Provider earns x402 fees (% of claimed)
```

---

## Key Documents

| Document | Purpose |
|----------|---------|
| [PIVOT_SUMMARY.md](./PIVOT_SUMMARY.md) | High-level vision and architecture |
| [STRATEGY_CONSUMER_JOURNEY.md](./STRATEGY_CONSUMER_JOURNEY.md) | User flow for deploying agents and delegating |
| [STRATEGY_PROVIDER_JOURNEY.md](./STRATEGY_PROVIDER_JOURNEY.md) | Provider flow for building and selling strategies |
| [INTEGRATION_REFACTORING_PLAN.md](./INTEGRATION_REFACTORING_PLAN.md) | Implementation plan with 7 phases |

---

## Architecture Summary

### Contracts

| Contract | Status |
|----------|--------|
| ReceiptHook | **DELETE** - Using Clanker pools |
| MockUSDC/MockDAI | **DELETE** - Using Clanker tokens |
| IdentityRegistry | **KEEP** - ERC-8004 agent identity |
| SubnameManager | **KEEP** - ENS naming for agents |
| IntentRouter | **REFACTOR** → DelegationRouter |

### New DelegationRouter

Handles fee claiming from ClankerFeeLocker and policy execution:
- Validates EIP-712 signed delegation
- Claims fees from FeeLocker on user's behalf
- Executes policy (compound/stables/hold)
- Pays provider fee
- Emits events for indexer

### Indexer Changes

| Before | After |
|--------|-------|
| Watch ReceiptHook.ExecutionReceipt | Watch PoolManager.Swap events |
| Custom strategyId in hookData | Map sender wallet → agent |
| Only our pools | Any Clanker pool |

### Clanker Contracts (Base Sepolia)

```
PoolManager:      0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408
Clanker:          0xE85A59c628F7d27878ACeB4bf3b35733630083a9
ClankerFeeLocker: 0x42A95190B4088C88Dd904d930c79deC1158bF09D
ClankerHook:      0xE63b0A59100698f379F9B577441A561bAF9828cc
```

---

## Implementation Phases

1. **Cleanup** - Delete ReceiptHook, MockTokens
2. **Clawnch Integration** - ClawnchService, FeeLockerService
3. **Indexer Refactor** - Watch Swap events, new schema
4. **DelegationRouter** - New contract for delegation + policy
5. **Dashboard Updates** - Portfolio view, agents, providers
6. **Provider Worker** - Reference implementation
7. **Dogfooding** - Deploy 4 agents, launch tokens, demo

See [INTEGRATION_REFACTORING_PLAN.md](./INTEGRATION_REFACTORING_PLAN.md) for full details.

---

## Dogfooding Plan

Deploy 4 agents using 4 derived wallets (bypasses 1/24h rate limit):

```
DEPLOYER_WALLET funds 4 wallets
├── alpha.agents.oikonomos.eth → $ALPHA on Moltbook
├── beta.agents.oikonomos.eth  → $BETA on 4claw
├── gamma.agents.oikonomos.eth → $GAMMA on Clawstr
└── delta.agents.oikonomos.eth → $DELTA on Moltx
```

---

## Key Integrations

| Integration | Purpose |
|-------------|---------|
| @clawnch/sdk | Launch tokens, check/claim fees |
| clawnch-mcp-server | MCP tools for AI agents |
| ClankerFeeLocker | Fee claiming |
| Uniswap V4 PoolManager | Index Swap events |

---

## Context Files

For deeper context on Clawnch:
- `/Users/oakgroup/Desktop/webdev/ethglobal/oikonomos/context/clawnch.md`

---

## Starting Point

To continue implementation, read the [INTEGRATION_REFACTORING_PLAN.md](./INTEGRATION_REFACTORING_PLAN.md) and start with Phase 1 (Cleanup) or whichever phase is most relevant.

The codebase currently has the old architecture (ReceiptHook, MockTokens, etc.) that needs to be refactored according to the plan.

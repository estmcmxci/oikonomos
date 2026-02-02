# Agent Service Implementation Plan

> **Linear Issue:** [OIK-18](https://linear.app/oikonomos-app/issue/OIK-18/agent-service-fix-config-local-testing-phase-5152)
> **EED Reference:** Phase 5 - Agent Services (Week 3-4)

## Current State

The agent infrastructure is **already scaffolded** following EED Phase 5:

```
agents/
├── shared/                  # IntentRouterABI, viem client, types
├── strategy-agent/          # A2A protocol + x402 marketplace (PHASE 5.1)
└── treasury-agent/          # Drift detection, rebalance orchestration (PHASE 5.2)
```

### Proven On-Chain Components

| Contract | Address | Status |
|----------|---------|--------|
| IntentRouter | `0xFD699481f0aA60e0014EEd79d16cbe4b954FfaEf` | ✅ Fixed & Tested |
| ReceiptHook | `0x15d3b7CbC9463f92a88cE7B1B384277DA741C040` | ✅ Deployed |
| PoolManager | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` | ✅ Uniswap v4 |
| USDC/DAI Pool | fee=3000, tickSpacing=60 | ✅ Initialized |

**E2E Proof:** [TX 0x1019...](https://sepolia.etherscan.io/tx/0x101961a836079a13d8e63c058e88fd33b1b7f41d0f7c749ae416ee43c6d361b6)
- 1 USDC → 0.996 DAI with ExecutionReceipt emitted

## Configuration Fixes Required

### 1. Pool Configuration
**File:** `agents/treasury-agent/src/rebalance/executor.ts`

```typescript
// CURRENT (wrong)
fee: 500,
tickSpacing: 10,

// CORRECT
fee: 3000,       // 0.3% fee tier
tickSpacing: 60, // matching tick spacing
```

### 2. IntentRouter Address
**File:** `agents/treasury-agent/wrangler.toml`

```toml
INTENT_ROUTER = "0xFD699481f0aA60e0014EEd79d16cbe4b954FfaEf"
RECEIPT_HOOK = "0x15d3b7CbC9463f92a88cE7B1B384277DA741C040"
STRATEGY_ID = "0x4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a"
```

### 3. Local Development Secrets
**File:** `agents/treasury-agent/.dev.vars` (create)

```
PRIVATE_KEY=0x...
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

## Implementation Steps

### Step 1: Configuration Fixes
- [ ] Update `DEFAULT_POOL_KEY` with correct fee/tickSpacing
- [ ] Set `INTENT_ROUTER` in wrangler.toml
- [ ] Add `RECEIPT_HOOK` and `STRATEGY_ID`
- [ ] Create `.dev.vars.example` template

### Step 2: Local Testing (wrangler dev)
```bash
# Terminal 1: strategy-agent
cd agents/strategy-agent && pnpm wrangler dev

# Terminal 2: treasury-agent
cd agents/treasury-agent && pnpm wrangler dev
```

### Step 3: Endpoint Verification
- [ ] `GET /health` - Returns `{ status: "ok" }`
- [ ] `GET /.well-known/agent-card.json` - Returns A2A card
- [ ] `POST /quote` (strategy-agent) - Returns quote with quoteId
- [ ] `POST /rebalance` (treasury-agent) - Triggers rebalance flow

### Step 4: Integration Test
- [ ] treasury-agent calls strategy-agent for quote
- [ ] Signs intent with EIP-712
- [ ] Submits to IntentRouter on Sepolia
- [ ] Verify ExecutionReceipt event
- [ ] Verify IntentExecuted event

## EED Phase 5 Acceptance Criteria

- [ ] strategy-agent responds to A2A protocol
- [ ] treasury-agent detects drift
- [ ] Rebalance executes through IntentRouter
- [ ] Receipts emitted with correct strategyId

## Agent Flow Diagram

```
┌─────────────────┐
│  User Request   │
│  /rebalance     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ treasury-agent  │────►│ strategy-agent  │
│ (drift check)   │     │ (get quote)     │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Build Intent   │
│  (EIP-712 sign) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IntentRouter   │
│  executeIntent  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PoolManager   │
│   swap()        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ReceiptHook    │
│  afterSwap()    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ExecutionReceipt │
│    (event)      │
└─────────────────┘
```

## Related Issues

- **OIK-17:** IntentRouter BalanceDelta fix ✅ Merged
- **OIK-13:** E2E Validation ✅ Complete

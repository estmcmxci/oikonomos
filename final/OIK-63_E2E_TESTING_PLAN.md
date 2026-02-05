# OIK-63: E2E Testing & Phase 2 LP Compounding Plan

## Overview

This document outlines the testing plan for the Unified Treasury Platform and the Phase 2 LP compounding implementation.

**Linear Issue:** [OIK-63](https://linear.app/oikonomos-app/issue/OIK-63/oik-63-e2e-testing-and-phase-2-lp-compounding)

---

## Phase 1: E2E Testing

### Test 1: WETH→USDC Swap on Base Sepolia

**Objective:** Verify Uniswap V3 SwapRouter integration in `wethDistribution.ts`

**Prerequisites:**
- Agent wallet funded with testnet WETH (0.01 WETH minimum)
- Base Sepolia RPC configured in `.dev.vars`

**Test Steps:**
```bash
# 1. Create test script
pnpm tsx scripts/test-weth-swap.ts

# 2. Expected flow:
#    - Check agent WETH balance
#    - Approve SwapRouter for WETH spend
#    - Execute exactInputSingle swap
#    - Verify USDC received
```

**Success Criteria:**
- [ ] Transaction succeeds on Base Sepolia
- [ ] USDC balance increases by expected amount (minus slippage)
- [ ] Gas cost is reasonable (<0.001 ETH)

**Files Under Test:**
- `agents/treasury-agent/src/execute/wethDistribution.ts:203-320`

---

### Test 2: Fee Claim Flow End-to-End

**Objective:** Verify FeeLocker claim + WETH distribution pipeline

**Prerequisites:**
- Agent token deployed on Base mainnet/testnet
- Unclaimed fees accumulated in FeeLocker
- Agent private key accessible

**Test Steps:**
```bash
# 1. Call /claim-fees endpoint
curl -X POST http://localhost:8787/claim-fees \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x...",
    "agentName": "test-agent",
    "distributeStrategy": {
      "compound": 0,
      "toStables": 80,
      "hold": 20
    }
  }'

# 2. Expected response:
# {
#   "claim": { "totalWethClaimed": "0.1", "txHash": "0x..." },
#   "distribution": { "toStables": { "usdcReceived": "300.00" }, "held": { "amount": "0.02" } }
# }
```

**Success Criteria:**
- [ ] FeeLocker.claim() executes successfully
- [ ] WETH distributed per strategy percentages
- [ ] USDC swap executes if toStables > 0
- [ ] Audit log entry created

**Files Under Test:**
- `agents/treasury-agent/src/execute/claimHandler.ts`
- `agents/treasury-agent/src/execute/feeClaim.ts`
- `agents/treasury-agent/src/execute/wethDistribution.ts`

---

### Test 3: Integration Test - Full Workflow

**Objective:** Verify complete user journey from agent launch to autonomous execution

**Test Scenario:**
```
1. Launch Agent
   POST /launch-agent → wallet + ENS + ERC-8004 + Nostr

2. Discover Portfolio
   POST /suggest-policy → unified policy with agent tokens

3. Configure Policy
   POST /configure → save policy to KV

4. Authorize Agent
   POST /authorize → grant execution permission

5. Trigger Execution (Manual)
   POST /claim-fees → claim + distribute

6. Trigger Execution (Cron)
   Scheduled trigger → automatic claim when threshold met
```

**Success Criteria:**
- [ ] Agent launched with all identity layers
- [ ] Policy correctly identifies agent tokens + fees
- [ ] Authorization persists in KV
- [ ] Manual claim succeeds
- [ ] Cron trigger fires when fee threshold exceeded

---

## Phase 2: LP Compounding Implementation

### Gap 4: PositionManager Integration

**Current State:** Returns "LP compounding not yet implemented" (`wethDistribution.ts:160`)

**Implementation Plan:**

#### Step 1: Position Discovery
```typescript
// Get agent's existing LP position NFT
async function getAgentLPPosition(
  env: Env,
  agentAddress: Address,
  tokenAddress: Address
): Promise<bigint | null> {
  // Query PositionManager for NFT ownership
  // Filter by token pair (WETH + tokenAddress)
  // Return position ID or null
}
```

#### Step 2: Increase Liquidity
```typescript
async function compoundToLP(
  env: Env,
  agentKey: `0x${string}`,
  wethAmount: bigint,
  tokenAddress: Address
): Promise<CompoundResult> {
  const positionId = await getAgentLPPosition(env, agentKey, tokenAddress);

  if (!positionId) {
    // Option A: Create new position
    // Option B: Return WETH to wallet (safer for MVP)
    return { success: false, reason: 'No existing LP position' };
  }

  // Get current position details (tickLower, tickUpper)
  const position = await getPositionDetails(positionId);

  // Calculate optimal token amounts for current tick range
  const { amount0, amount1 } = calculateLiquidityAmounts(
    wethAmount,
    position.tickLower,
    position.tickUpper,
    currentTick
  );

  // Call increaseLiquidity on PositionManager
  const txHash = await walletClient.writeContract({
    address: POSITION_MANAGER_ADDRESS,
    abi: PositionManagerABI,
    functionName: 'increaseLiquidity',
    args: [{
      tokenId: positionId,
      amount0Desired: amount0,
      amount1Desired: amount1,
      amount0Min: amount0 * 99n / 100n,
      amount1Min: amount1 * 99n / 100n,
      deadline: BigInt(Date.now() + 300_000),
    }],
  });

  return { success: true, txHash, liquidityAdded: '...' };
}
```

#### Step 3: Handle Single-Sided Liquidity
```typescript
// If only WETH available, need to swap half to token first
async function prepareCompoundAmounts(
  wethAmount: bigint,
  tokenAddress: Address,
  position: PositionDetails
): Promise<{ weth: bigint; token: bigint }> {
  // Check if position is in range
  if (!isPositionInRange(position, currentTick)) {
    // Position out of range - return as WETH
    return { weth: wethAmount, token: 0n };
  }

  // Swap half WETH to token
  const halfWeth = wethAmount / 2n;
  const tokenAmount = await swapWethToToken(halfWeth, tokenAddress);

  return { weth: halfWeth, token: tokenAmount };
}
```

**Dependencies:**
- Uniswap V4 PositionManager ABI
- Position NFT tracking (indexer or on-chain query)
- Tick math utilities

**Estimate:** L (Large) - requires significant Uniswap V4 integration work

---

## Test Scripts

### scripts/test-weth-swap.ts
```typescript
import { createWalletClient, http, parseEther, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const WETH = '0x4200000000000000000000000000000000000006';
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC

async function testWethSwap() {
  const account = privateKeyToAccount(process.env.TEST_PRIVATE_KEY as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC),
  });

  console.log('Testing WETH→USDC swap...');
  console.log('Wallet:', account.address);

  // Import and call executeWethToUsdcSwap
  // Verify result
}

testWethSwap().catch(console.error);
```

---

## Timeline

| Task | Priority | Estimate | Status |
|------|----------|----------|--------|
| Test WETH→USDC swap | P1 | S | ⬜ Not Started |
| Test claim flow E2E | P1 | M | ⬜ Not Started |
| Integration testing | P1 | M | ⬜ Not Started |
| LP compounding (Phase 2) | P2 | L | ⬜ Deferred |
| Price oracle | P3 | M | ⬜ Optional |

---

## Success Metrics

1. **E2E Tests Pass:** All P1 tests execute without errors
2. **Gas Efficiency:** Swap + claim costs < 0.005 ETH total
3. **Accuracy:** USDC received within 1% of quoted amount
4. **Reliability:** Cron trigger fires consistently when threshold met

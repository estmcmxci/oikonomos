# Unified Treasury Platform - Implementation Gaps

## Progress Summary

| Priority | Gap | Status |
|----------|-----|--------|
| **P1** | Gap 1: WETH→USDC Swap | ✅ Complete |
| **P1** | Gap 2: /claim-fees Endpoint | ✅ Complete |
| **P1** | Gap 3: Drift Checking | ✅ Complete |
| **P2** | Gap 4: LP Compounding | ⏸️ Deferred (Phase 2) |
| **P2** | Gap 5: Observation Loop | ✅ Complete |
| **P2** | Gap 6: Token Balance Lookup | ✅ Complete |
| **P3** | Gap 7-10: ENS/ERC-8004/Nostr/Indexer | ✅ Complete |

**MVP Status: 9/10 gaps implemented (Gap 4 LP compounding deferred to Phase 2)**

## Context

OIK-61 scaffolded the Unified Treasury Platform (Phases 1-5). This document addresses the critical gaps identified during reconciliation with `UNIFIED_TREASURY_PLAN.md`.

---

## P1: Critical Path (Must Complete for MVP)

### Gap 1: WETH→USDC Swap in Fee Distribution ✅

**File:** `agents/treasury-agent/src/execute/wethDistribution.ts`

**Current State:** ~~Returns error "Direct swap not yet implemented"~~ FIXED

**Solution:** Connect to existing IntentRouter swap flow

```typescript
// In wethDistribution.ts - replace executeWethToUsdcSwap()

import { handleQuote } from '../quote/handler';
import { handleExecute } from './handler';

async function executeWethToUsdcSwap(
  env: Env,
  agentPrivateKey: `0x${string}`,
  wethAmount: bigint
): Promise<SwapResult> {
  // 1. Get quote via existing quote handler
  const quoteResponse = await getInternalQuote(env, {
    tokenIn: WETH_ADDRESS,
    tokenOut: USDC_ADDRESS,
    amountIn: wethAmount.toString(),
  });

  // 2. Build EIP-712 intent and sign with agent key
  const account = privateKeyToAccount(agentPrivateKey);
  const intent = buildSwapIntent(quoteResponse, account.address);
  const signature = await account.signTypedData(intent);

  // 3. Execute via IntentRouter
  const txHash = await executeIntent(env, intent, signature);

  return { success: true, txHash, usdcReceived: quoteResponse.amountOut };
}
```

**Tasks:**
- [x] Add internal quote helper (bypass HTTP, call directly)
- [x] Add EIP-712 intent builder for agent-signed swaps
- [ ] Test with small amount on Base Sepolia

**Implementation:** Uses Uniswap V3 SwapRouter on Base mainnet for direct WETH→USDC swaps with 1% slippage tolerance.

---

### Gap 2: Route Fee Claims Through Execution ✅

**File:** `agents/treasury-agent/src/index.ts`

**Current State:** ~~No `/claim-fees` endpoint; fee claiming not connected to execution flow~~ FIXED

**Solution:** Add dedicated claim endpoint that orchestrates claim + distribute

```typescript
// New endpoint in index.ts
if (url.pathname === '/claim-fees' && request.method === 'POST') {
  return handleClaimFees(request, env, CORS_HEADERS);
}

// New handler: src/execute/claimHandler.ts
export async function handleClaimFees(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { userAddress, agentName, tokens, distributeStrategy } = await request.json();

  // 1. Get agent private key from KV
  const agentKey = await getAgentPrivateKey(env.TREASURY_KV, userAddress, agentName);

  // 2. Execute batch claim
  const claimResult = await executeClaimAll(env, agentKey, tokens);

  // 3. Distribute WETH per strategy (if specified)
  if (distributeStrategy && claimResult.totalWethClaimed !== '0') {
    const wethWei = parseEther(claimResult.totalWethClaimed);
    const distResult = await distributeWeth(env, agentKey, wethWei, distributeStrategy);
    return Response.json({ claim: claimResult, distribution: distResult });
  }

  return Response.json({ claim: claimResult });
}
```

**Tasks:**
- [x] Create `src/execute/claimHandler.ts`
- [x] Add route to `index.ts`
- [x] Add request validation
- [ ] Test claim flow end-to-end

**Implementation:** Created claimHandler.ts with full orchestration of claim + distribute flow. Added POST /claim-fees endpoint.

---

### Gap 3: Stablecoin Drift Checking ✅

**File:** `agents/treasury-agent/src/triggers/unified.ts`

**Current State:** ~~`checkDriftTrigger()` returns `{ hasDrift: false }` always~~ FIXED

**Solution:** Implement actual balance checking via RPC

```typescript
async function checkDriftTrigger(
  env: Env,
  userAddress: Address,
  policy: UnifiedPolicy
): Promise<DriftResult> {
  const client = createPublicClient({
    chain: base,
    transport: http(env.RPC_URL),
  });

  const tokens = policy.stablecoinRebalance.tokens;
  const balances: Map<Address, bigint> = new Map();
  let totalValue = 0n;

  // 1. Get balances for all tokens
  for (const token of tokens) {
    const balance = await client.readContract({
      address: token.address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    });
    balances.set(token.address, balance);
    totalValue += balance; // Simplified - assumes 1:1 stablecoin peg
  }

  // 2. Calculate drift from target allocation
  const drifts: Drift[] = [];
  for (const token of tokens) {
    const balance = balances.get(token.address) || 0n;
    const actualPercent = totalValue > 0n ? Number(balance * 100n / totalValue) : 0;
    const targetPercent = token.targetPercentage;
    const drift = Math.abs(actualPercent - targetPercent);

    if (drift > policy.stablecoinRebalance.driftThreshold) {
      drifts.push({
        token: token.address,
        symbol: token.symbol,
        drift,
        actual: actualPercent,
        target: targetPercent,
      });
    }
  }

  return { hasDrift: drifts.length > 0, drifts };
}
```

**Tasks:**
- [x] Add ERC20 balanceOf calls
- [x] Handle decimal normalization (USDC=6, DAI=18)
- [ ] Add price oracle for non-stablecoin assets (optional)

**Implementation:** Added checkDriftTrigger with proper decimal normalization to 18 decimals for consistent comparison.

---

## P2: Important for Production

### Gap 4: LP Compounding via PositionManager

**File:** `agents/treasury-agent/src/execute/wethDistribution.ts`

**Current State:** Returns "LP compounding not yet implemented"

**Solution:** Integrate Uniswap V4 PositionManager

```typescript
// Requires PositionManager contract interaction
// Agent needs to:
// 1. Have existing LP position NFT
// 2. Call increaseLiquidity() with WETH + token pair

async function compoundToLP(
  env: Env,
  agentKey: `0x${string}`,
  wethAmount: bigint,
  tokenAddress: Address
): Promise<CompoundResult> {
  // Get agent's LP position ID from indexer or KV
  const positionId = await getAgentLPPosition(env, agentKey, tokenAddress);

  // Build increaseLiquidity params
  // This requires knowing the current tick range
  // ...complex Uniswap V4 logic
}
```

**Recommendation:** Defer to Phase 2. For MVP, compound % should be 0 or held as WETH.

---

### Gap 5: Update Observation Loop ✅

**File:** `agents/treasury-agent/src/observation/cron.ts`

**Current State:** ~~Loop doesn't call `checkAllTriggers()` for unified policies~~ FIXED

**Solution:** Add unified policy handling to scheduled trigger

```typescript
// In handleScheduledTrigger()
const policy = await getPolicy(kv, user.address);

if (policy?.type === 'unified') {
  const triggerResult = await checkAllTriggers(env, user.address, policy);
  if (triggerResult.triggered) {
    for (const action of triggerResult.actions) {
      await executeTriggeredAction(env, user.address, action, policy);
    }
  }
}
```

**Tasks:**
- [x] Import `checkAllTriggers` in observation loop
- [x] Add `executeTriggeredAction()` dispatcher
- [x] Add logging for trigger events

**Implementation:** Updated cron.ts with evaluateUnifiedPolicy() and executeTriggeredAction() dispatcher. Handles claim-fees, rebalance, exit-token, and compound actions.

---

### Gap 6: Token Balance Lookup ✅

**File:** `agents/treasury-agent/src/suggestion/clawnch.ts`

**Current State:** ~~`balance: '0'` hardcoded at line 173~~ FIXED

**Solution:** Add on-chain balance check

```typescript
// In discoverAgentTokens(), after getting token address
const balance = await publicClient.readContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [wallet],
});

allTokens.push({
  ...
  balance: formatEther(balance),
  ...
});
```

**Implementation:** Added getTokenBalance() helper and integrated into discoverAgentTokens() parallel fetch.

---

## P3: Essential Integrations ✅ COMPLETE

### Gap 7: ENS Subname Registration ✅

**File:** `agents/treasury-agent/src/launch/registration.ts`

**Current State:** ~~Returns "pending" status~~ FIXED

**Solution:** Created dedicated registration module with CCIP-Read flow

```typescript
// New file: src/launch/registration.ts
export async function registerENSSubname(
  env: Env,
  agentPrivateKey: `0x${string}`,
  params: { label: string; agentId: bigint; a2aUrl: string }
): Promise<ENSRegistrationResult>

export async function isSubnameAvailable(env: Env, label: string): Promise<boolean>
```

**Implementation:**
- Uses OffchainSubnameManager at `0x89E3740C8b81D90e146c62B6C6451b85Ec8E6E78`
- Registers subnames under `oikonomos.eth` parent node
- Integrated into launch handler flow

---

### Gap 8: ERC-8004 Registration ✅

**File:** `agents/treasury-agent/src/launch/registration.ts`

**Current State:** ~~Not implemented~~ FIXED

**Solution:** Created ERC-8004 registration with base64 metadata URI

```typescript
// In src/launch/registration.ts
export async function registerAgentERC8004(
  env: Env,
  agentPrivateKey: `0x${string}`,
  params: { name, description, ensName, a2aUrl, imageUrl? }
): Promise<RegistrationResult>
```

**Implementation:**
- Uses canonical ERC-8004 registry at `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- Generates data URI with base64-encoded JSON metadata
- Includes ENS service endpoint and A2A URL in metadata
- Integrated into launch handler flow (executes before ENS registration)

---

### Gap 9: Nostr Integration ✅

**File:** `agents/treasury-agent/src/launch/nostr.ts`

**Current State:** ~~Nostr keys derived but not used~~ FIXED

**Solution:** Created dedicated Nostr module with nostr-tools

```typescript
// New file: src/launch/nostr.ts
export function createProfileEvent(
  privateKeyHex: string,
  profile: { name: string; about: string; picture?: string; bot?: boolean }
): Event

export function createClawnchEvent(
  privateKeyHex: string,
  params: { tokenSymbol, tokenName, description, platform, agentWallet }
): Event

export async function launchAgentOnNostr(
  privateKeyHex: string,
  params: { tokenName, tokenSymbol, description, platform, agentWallet, ensName }
): Promise<NostrPublishResult & { events: Event[] }>
```

**Implementation:**
- Uses nostr-tools v2.7.0 with @noble/secp256k1 for key derivation
- Publishes to relay.damus.io (configurable via NOSTR_RELAY_URL)
- Creates profile event (kind 0) with bot flag
- Creates !clawnch event (kind 1) with platform, wallet, ENS name
- Updated keychain.ts to derive proper secp256k1 public keys
- Integrated into launch handler flow

---

### Gap 10: Indexer Event Handlers ✅

**File:** `packages/indexer/src/index.ts`

**Current State:** ~~No fee claim tracking~~ FIXED

**Solution:** Added ClankerFeeLocker contract and FeesClaimed handler

```typescript
// ponder.config.ts - added Base mainnet chain and ClankerFeeLocker contract
ClankerFeeLocker: {
  chain: 'base',
  abi: ClankerFeeLockerABI,
  address: '0xF3622742b1E446D92e45E22923Ef11C2fcD55D68',
  startBlock: 22000000,
}

// src/index.ts - handler with running totals
ponder.on('ClankerFeeLocker:FeesClaimed', async ({ event, context }) => {
  // Store fee claim record
  await db.insert(feeClaim).values({ ... });

  // Update agent token with running totals
  await db.update(agentToken).set({
    totalFeesClaimed: newTotal.toString(),
    lastClaimAt: timestamp,
  });
});
```

**Implementation:**
- Created `abis/ClankerFeeLocker.ts` with FeesClaimed event
- Added `feeClaim` table for individual claim records
- Added `agentToken` table for token portfolios with fee totals
- Added Base mainnet chain to ponder.config.ts
- Handler tracks WETH and token amounts per claim
- Maintains running totals on agentToken for portfolio views

---

## Implementation Order ✅ COMPLETE

```
Week 1: P1 Critical Path ✅
├── Gap 1 (WETH swap) ✅
├── Gap 2 (claim endpoint) ✅
└── Gap 3 (drift checking) ✅

Week 2: P2 Production Ready ✅
├── Gap 5 (observation loop) ✅
├── Gap 6 (token balances) ✅
└── Integration testing (ongoing)

Week 3: P3 Essential Integrations ✅
├── Gap 7: ENS subname registration ✅
├── Gap 8: ERC-8004 registration ✅
├── Gap 9: Nostr integration ✅
└── Gap 10: Indexer fee claims ✅
```

**Remaining:** Gap 4 (LP compounding) deferred to Phase 2 by design.

---

## Success Metrics

1. **Fee Claiming:** User can claim fees and receive USDC in wallet
2. **Drift Rebalancing:** Trigger fires when stablecoin allocation drifts >5%
3. **Agent Launch:** Full flow works: wallet → ENS → ERC-8004 → Nostr → Token
4. **Indexer:** Fee claims and agent registrations queryable via GraphQL

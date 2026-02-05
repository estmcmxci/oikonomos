# Unified Treasury Platform - Implementation Gaps

## Context

OIK-61 scaffolded the Unified Treasury Platform (Phases 1-5). This document addresses the critical gaps identified during reconciliation with `UNIFIED_TREASURY_PLAN.md`.

---

## P1: Critical Path (Must Complete for MVP)

### Gap 1: WETH→USDC Swap in Fee Distribution

**File:** `agents/treasury-agent/src/execute/wethDistribution.ts`

**Current State:** Returns error "Direct swap not yet implemented"

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
- [ ] Add internal quote helper (bypass HTTP, call directly)
- [ ] Add EIP-712 intent builder for agent-signed swaps
- [ ] Test with small amount on Base Sepolia

---

### Gap 2: Route Fee Claims Through Execution

**File:** `agents/treasury-agent/src/index.ts`

**Current State:** No `/claim-fees` endpoint; fee claiming not connected to execution flow

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
- [ ] Create `src/execute/claimHandler.ts`
- [ ] Add route to `index.ts`
- [ ] Add request validation
- [ ] Test claim flow end-to-end

---

### Gap 3: Stablecoin Drift Checking

**File:** `agents/treasury-agent/src/triggers/unified.ts`

**Current State:** `checkDriftTrigger()` returns `{ hasDrift: false }` always

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
- [ ] Add ERC20 balanceOf calls
- [ ] Handle decimal normalization (USDC=6, DAI=18)
- [ ] Add price oracle for non-stablecoin assets (optional)

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

### Gap 5: Update Observation Loop

**File:** `agents/treasury-agent/src/observation/loop.ts`

**Current State:** Loop doesn't call `checkAllTriggers()` for unified policies

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
- [ ] Import `checkAllTriggers` in observation loop
- [ ] Add `executeTriggeredAction()` dispatcher
- [ ] Add logging for trigger events

---

### Gap 6: Token Balance Lookup

**File:** `agents/treasury-agent/src/suggestion/clawnch.ts`

**Current State:** `balance: '0'` hardcoded at line 173

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

---

## P3: Nice to Have (Post-MVP)

### Gap 7: ENS Subname Registration

**File:** `agents/treasury-agent/src/launch/handler.ts`

**Current State:** Returns "pending" status

**Solution:** Call existing ENS CCIP resolver

```typescript
import { registerSubname } from '@oikonomos/sdk';

// In handleLaunchAgent(), replace placeholder:
const ensResult = await registerSubname({
  label: body.agentName,
  owner: agentWallet.address,
  resolver: CCIP_RESOLVER_ADDRESS,
});
```

---

### Gap 8: ERC-8004 Registration

**File:** `agents/treasury-agent/src/launch/handler.ts`

**Solution:** Call ERC-8004 registry contract

```typescript
const registryContract = getContract({
  address: ERC8004_REGISTRY,
  abi: ERC8004RegistryABI,
  client: walletClient,
});

const erc8004Id = await registryContract.write.registerAgent([
  agentWallet.address,
  ensName,
  metadataUri,
]);
```

---

### Gap 9: Nostr Integration

**File:** `agents/treasury-agent/src/launch/handler.ts`

**Current State:** Nostr keys derived but not used

**Solution:** Use nostr-tools for profile + clawnch posting

```typescript
import { getPublicKey, finalizeEvent, Relay } from 'nostr-tools';

// Create profile event (kind 0)
const profileEvent = finalizeEvent({
  kind: 0,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: JSON.stringify({
    name: tokenName,
    about: description,
    bot: true,
  }),
}, nostrPrivateKey);

// Post !clawnch (kind 1)
const clawnchEvent = finalizeEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: `!clawnch ${tokenSymbol} ${tokenName}\n${description}`,
}, nostrPrivateKey);

const relay = await Relay.connect('wss://relay.damus.io');
await relay.publish(profileEvent);
await relay.publish(clawnchEvent);
```

---

### Gap 10: Indexer Event Handlers

**File:** `packages/indexer/src/index.ts`

**Solution:** Add event handlers for fee claims and agent registration

```typescript
// ponder.config.ts - add ClankerFeeLocker contract
ClankerFeeLocker: {
  abi: ClankerFeeLockerABI,
  address: '0xF3622742b1E446D92e45E22923Ef11C2fcD55D68',
  network: 'base',
  startBlock: 12000000,
}

// src/index.ts - add handler
ponder.on('ClankerFeeLocker:FeesClaimed', async ({ event, context }) => {
  await context.db.FeeClaim.create({
    id: event.transaction.hash,
    data: {
      token: event.args.token,
      wallet: event.args.wallet,
      wethAmount: event.args.wethAmount.toString(),
      timestamp: event.block.timestamp,
    },
  });
});
```

---

## Implementation Order

```
Week 1: P1 Critical Path
├── Day 1-2: Gap 1 (WETH swap)
├── Day 3: Gap 2 (claim endpoint)
└── Day 4-5: Gap 3 (drift checking)

Week 2: P2 Production Ready
├── Day 1: Gap 5 (observation loop)
├── Day 2: Gap 6 (token balances)
└── Day 3-5: Integration testing

Week 3: P3 Polish (if time permits)
├── Gap 7-8: ENS + ERC-8004
├── Gap 9: Nostr
└── Gap 10: Indexer
```

---

## Success Metrics

1. **Fee Claiming:** User can claim fees and receive USDC in wallet
2. **Drift Rebalancing:** Trigger fires when stablecoin allocation drifts >5%
3. **Agent Launch:** Full flow works: wallet → ENS → ERC-8004 → Nostr → Token
4. **Indexer:** Fee claims and agent registrations queryable via GraphQL

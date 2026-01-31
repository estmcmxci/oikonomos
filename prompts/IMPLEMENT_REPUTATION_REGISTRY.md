# Prompt: Integrate with Canonical ERC-8004 ReputationRegistry

## Key Insight: Canonical Registries Already Exist!

The canonical ERC-8004 registries are **already deployed** on Sepolia and Mainnet:

| Network | Registry | Address |
|---------|----------|---------|
| Sepolia | Identity | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| Sepolia | Reputation | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| Mainnet | Identity | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Mainnet | Reputation | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

**This changes OIK-12 from "implement" to "integrate"** - we don't need to deploy a new ReputationRegistry, just integrate with the canonical one.

---

## Decision: Integrate with Canonical ReputationRegistry (Alongside Indexer)

### Context

The MVP currently uses an **indexer-based system** for receipt storage and metrics aggregation. The canonical ERC-8004 ReputationRegistry is now available and should be **integrated** to work **alongside** the indexer, not replace it.

### Why Use Both: Indexer + Canonical ReputationRegistry

**They serve different purposes:**

| Purpose | Indexer | Canonical ReputationRegistry |
|---------|---------|------------------------------|
| **Receipt Storage** | ✅ Stores all receipts for querying | ❌ Doesn't store receipts |
| **Receipt Queries** | ✅ Fast queries by user/strategy/tx | ❌ Can't query individual receipts |
| **Historical Data** | ✅ Full receipt history | ❌ Only aggregates feedback |
| **Reputation Scores** | ⚠️ Computes metrics (off-chain) | ✅ On-chain verifiable scores |
| **Portability** | ❌ Locked to Oikonomos | ✅ Portable across protocols |
| **Query Speed** | ✅ Fast (no gas) | ⚠️ Slower (on-chain reads) |
| **Complex Filtering** | ✅ SQL queries, pagination | ❌ Limited to summary queries |

**The Right Architecture: Use Both**

```
ReceiptHook emits ExecutionReceipt
    ↓
Indexer catches event
    ↓
    ├─→ Stores receipt in database (for querying)
    │   • Receipt history
    │   • User receipts
    │   • Strategy receipts
    │   • Complex queries
    │
    └─→ Submits feedback to CANONICAL ReputationRegistry (for reputation)
        • Address: 0x8004B663056A597Dffe9eCcC1965A193B7388713 (Sepolia)
        • On-chain reputation scores
        • Portable across protocols
        • Verifiable trust signals
```

**Why This Approach:**

1. ✅ **Indexer for Receipts** - Fast querying, historical data, complex filters
2. ✅ **Canonical ReputationRegistry for Reputation** - On-chain scores, portable trust
3. ✅ **Best of Both Worlds** - Speed + portability
4. ✅ **No Contract Development Needed** - Canonical already deployed
5. ✅ **Standards Compliance** - Uses official ERC-8004 registries

### Why Not Indexer-Only

**Problems with Indexer-Only Approach:**
1. ❌ **Reputation not portable** - Locked to Oikonomos indexer
2. ❌ **Not on-chain verifiable** - Requires trusting indexer infrastructure
3. ❌ **Can't be queried by other protocols** - No standard interface
4. ❌ **Doesn't demonstrate standards** - MVP should show ERC-8004 integration

### Why Not ReputationRegistry-Only

**Problems with ReputationRegistry-Only Approach:**
1. ❌ **No receipt storage** - Can't query individual receipts
2. ❌ **No historical data** - Only aggregates, doesn't store details
3. ❌ **Slower queries** - On-chain reads are slower than database
4. ❌ **No complex filtering** - Limited to summary queries
5. ❌ **Gas costs** - Every query costs gas

### The Hybrid Approach (Recommended)

**Indexer Responsibilities:**
- Store all receipts (for querying)
- Provide fast receipt queries (by user, strategy, tx hash)
- Complex filtering and pagination
- Historical data access
- Leaderboard queries (can use ReputationRegistry data)

**Canonical ReputationRegistry Responsibilities:**
- On-chain reputation scores
- Portable trust signals
- Verifiable feedback aggregation
- Standard interface for other protocols

**How They Work Together:**
1. ReceiptHook emits → Indexer stores receipt
2. Indexer submits feedback → Canonical ReputationRegistry accumulates reputation
3. Dashboard queries:
   - Indexer → For receipt lists and history
   - Canonical ReputationRegistry → For reputation scores
4. Other protocols can query ReputationRegistry directly (portable)

### Implementation Plan

**Phase 1: Add Constants** *(NEW - replaces Contract Development)*
- Add canonical registry addresses to `packages/shared/src/constants.ts`
- Import canonical ReputationRegistry ABI
- No contract deployment needed!

**Phase 2: Indexer Integration**
- **Keep existing receipt storage** - Indexer continues storing receipts for querying
- **Add feedback submission** - Indexer submits feedback to **canonical** ReputationRegistry after each receipt
- Resolve `strategyId` → `agentId` via ENS
- Submit execution quality and compliance feedback
- **Indexer continues computing metrics** - For fast queries (can be cached from ReputationRegistry)

**Phase 3: Dashboard Integration**
- **Receipt queries** - Continue using indexer (fast, no gas)
- **Reputation scores** - Query **canonical** ReputationRegistry (on-chain, portable)
- Display on-chain reputation scores alongside receipt history
- Show feedback counts and summaries from ReputationRegistry
- **Fallback** - If ReputationRegistry unavailable, use indexer metrics

**Phase 4: Testing**
- Integration tests for feedback submission to canonical registry
- Verify end-to-end flow with canonical addresses
- No unit tests for contract (we're not deploying one!)

### Success Criteria

- [ ] ~~ReputationRegistry contract deployed on Sepolia~~ **NOT NEEDED - use canonical**
- [ ] Constants added with canonical registry addresses
- [ ] Indexer continues storing receipts (unchanged)
- [ ] Indexer submits feedback to **canonical** ReputationRegistry after each receipt
- [ ] Dashboard queries **canonical** ReputationRegistry for reputation scores
- [ ] Dashboard queries indexer for receipt history (unchanged)
- [ ] Reputation is queryable by any app via ERC-8004 standard
- [ ] Both systems work together seamlessly

---

## Linear Issue: Integrate with Canonical ERC-8004 ReputationRegistry

### Issue Title
**Integrate with Canonical ERC-8004 ReputationRegistry for On-Chain Reputation**

### Issue Description

**Key Insight: Canonical Registries Already Exist!**

The canonical ERC-8004 registries are **already deployed** on Sepolia:
- **IdentityRegistry:** `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- **ReputationRegistry:** `0x8004B663056A597Dffe9eCcC1965A193B7388713`

**Background:**
Currently, Oikonomos uses an indexer-based reputation system for MVP speed. The canonical ERC-8004 ReputationRegistry is now available and should be integrated for proper architecture and portability.

**Problem:**
- Indexer reputation is not portable across protocols
- Requires trusting off-chain infrastructure
- Not using the canonical registries that exist
- Doesn't demonstrate ERC-8004 standard integration

**Solution:**
Integrate with the **canonical** ERC-8004 ReputationRegistry (not deploy a new one):
1. Update indexer to submit feedback to canonical ReputationRegistry
2. Update dashboard to query canonical ReputationRegistry for scores
3. Keep indexer for receipt storage and fast queries

**Acceptance Criteria:**
- [ ] ~~ReputationRegistry contract deployed on Sepolia~~ **NOT NEEDED - use canonical**
- [ ] Indexer continues storing receipts (no breaking changes)
- [ ] Indexer submits feedback to **canonical** ReputationRegistry after each ExecutionReceipt
- [ ] Dashboard queries **canonical** ReputationRegistry for reputation scores
- [ ] Dashboard queries indexer for receipt history (unchanged)
- [ ] Constants updated with canonical registry addresses
- [ ] Reputation is portable (queryable by any app)
- [ ] Both systems work together (hybrid approach)
- [ ] Integration tests passing

**Technical Details:**
- ~~Contract location: `packages/contracts/src/identity/ReputationRegistry.sol`~~ **NOT NEEDED**
- Constants: `packages/shared/src/constants.ts` - add `ERC8004_REGISTRIES`
- Integration point: `packages/indexer/src/index.ts` (ReceiptHook handler)
- Dashboard update: `apps/dashboard/components/agent/TrustScore.tsx`
- Reference: `context/erc-8004-contracts.md`

**Dependencies:**
- ✅ Canonical IdentityRegistry deployed on Sepolia
- ✅ Canonical ReputationRegistry deployed on Sepolia
- Agents registered with canonical IdentityRegistry (OIK-15)
- ReceiptHook (already implemented)
- Indexer (already implemented)

**Priority:** High (Architecture integrity, standards compliance)

**Labels:** `enhancement`, `erc-8004`, `reputation`, `integration`

---

## Implementation Guidance

### Step 1: Add Canonical Registry Constants

Create or update `packages/shared/src/constants.ts`:

```typescript
export const ERC8004_REGISTRIES = {
  SEPOLIA: {
    IDENTITY: '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const,
    REPUTATION: '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const,
  },
  MAINNET: {
    IDENTITY: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const,
    REPUTATION: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63' as const,
  },
} as const;

export type SupportedChain = 'SEPOLIA' | 'MAINNET';

export function getReputationRegistryAddress(chain: SupportedChain): `0x${string}` {
  return ERC8004_REGISTRIES[chain].REPUTATION;
}

export function getIdentityRegistryAddress(chain: SupportedChain): `0x${string}` {
  return ERC8004_REGISTRIES[chain].IDENTITY;
}
```

### Step 2: Import Canonical ABI

The canonical ReputationRegistry ABI can be obtained from:
- https://howto8004.com (reference implementation)
- `ethglobal/erc-8004-contracts/abis/ReputationRegistry.json`

Key functions:
```typescript
const REPUTATION_REGISTRY_ABI = [
  {
    name: 'giveFeedback',
    type: 'function',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'value', type: 'int128' },
      { name: 'valueDecimals', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
  },
  {
    name: 'getSummary',
    type: 'function',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
    ],
    outputs: [
      { name: 'count', type: 'uint256' },
      { name: 'summaryValue', type: 'int128' },
      { name: 'summaryValueDecimals', type: 'uint8' },
    ],
  },
] as const;
```

### Step 3: Update Indexer to Submit Feedback (Keep Receipt Storage)

Modify `packages/indexer/src/index.ts`:

```typescript
import { ERC8004_REGISTRIES } from '@oikonomos/shared';
import { createPublicClient, createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';

// Canonical ReputationRegistry address
const REPUTATION_REGISTRY = ERC8004_REGISTRIES.SEPOLIA.REPUTATION;

ponder.on('ReceiptHook:ExecutionReceipt', async ({ event, context }) => {
  // EXISTING: Store receipt (keep this!)
  await context.db.insert(executionReceipt).values({
    id: receiptId,
    strategyId: event.args.strategyId,
    // ... all existing fields
  });

  // EXISTING: Update strategy metrics (keep this for fast queries!)
  await context.db
    .insert(strategyMetrics)
    .values({...})
    .onConflictDoUpdate({...});

  // NEW: Submit feedback to CANONICAL ReputationRegistry (in parallel)
  // This doesn't replace indexer metrics, it adds on-chain reputation
  await submitToCanonicalReputationRegistry(event.args);
});

async function submitToCanonicalReputationRegistry(args: ExecutionReceiptArgs) {
  // 1. Resolve strategyId → agentId via ENS
  const ensName = await resolveStrategyIdToEns(args.strategyId);
  if (!ensName) return; // Skip if can't resolve

  const erc8004Record = await client.getEnsText({
    name: ensName,
    key: 'agent:erc8004'
  });
  if (!erc8004Record) return;

  // Parse: eip155:11155111:0x8004A818...:123
  const agentId = BigInt(erc8004Record.split(':')[3]);

  // 2. Calculate slippage score (0-100, higher is better)
  const slippageScore = Math.max(0, 100 - (Number(args.actualSlippage) * 4));

  // 3. Submit execution quality feedback to CANONICAL registry
  await walletClient.writeContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'giveFeedback',
    args: [
      agentId,
      BigInt(slippageScore),
      0, // decimals
      'execution',
      'slippage',
      '',
      `ipfs://${receiptCid}`,
      receiptHash
    ]
  });

  // 4. Submit compliance feedback to CANONICAL registry
  await walletClient.writeContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'giveFeedback',
    args: [
      agentId,
      args.policyCompliant ? 100n : 0n,
      0,
      'compliance',
      'policy',
      '',
      `ipfs://${receiptCid}`,
      receiptHash
    ]
  });
}
```

### Step 4: Update Dashboard (Hybrid Querying)

Modify `apps/dashboard/components/agent/TrustScore.tsx`:

```typescript
import { ERC8004_REGISTRIES } from '@oikonomos/shared';

// Use CANONICAL ReputationRegistry
const REPUTATION_REGISTRY = ERC8004_REGISTRIES.SEPOLIA.REPUTATION;

async function getReputationScore(erc8004: string) {
  // Parse agentId from ERC-8004 record
  const agentId = parseAgentId(erc8004);

  try {
    // PRIMARY: Query CANONICAL ReputationRegistry (on-chain, portable)
    const executionSummary = await publicClient.readContract({
      address: REPUTATION_REGISTRY,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: 'getSummary',
      args: [
        agentId,
        [userAddress], // Required: client addresses
        'execution',
        'slippage'
      ]
    });

    const complianceSummary = await publicClient.readContract({
      address: REPUTATION_REGISTRY,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: 'getSummary',
      args: [
        agentId,
        [userAddress],
        'compliance',
        'policy'
      ]
    });

    // Calculate trust score from on-chain data
    return calculateTrustScore(executionSummary, complianceSummary);
  } catch (error) {
    // FALLBACK: Use indexer metrics if ReputationRegistry unavailable
    console.warn('ReputationRegistry unavailable, using indexer metrics');
    const strategyId = ensNameToStrategyId(ensName);
    const metrics = await fetch(`${indexerUrl}/strategies/${strategyId}`);
    return calculateTrustScoreFromMetrics(metrics);
  }
}

// Receipt queries continue using indexer (fast, no gas)
async function getReceiptHistory(userAddress: string) {
  // Continue using indexer for receipt queries
  return await fetch(`${indexerUrl}/receipts/user/${userAddress}`);
}
```

**Key Point:** Dashboard uses **both**:
- **Canonical ReputationRegistry** → For reputation scores (on-chain, portable)
- **Indexer** → For receipt queries (fast, historical data)

### Step 5: Testing

Create integration tests (no contract unit tests needed!):

```typescript
// packages/indexer/test/reputation-integration.test.ts
import { ERC8004_REGISTRIES } from '@oikonomos/shared';

describe('Canonical ReputationRegistry Integration', () => {
  const REPUTATION_REGISTRY = ERC8004_REGISTRIES.SEPOLIA.REPUTATION;

  it('should submit feedback to canonical registry', async () => {
    // Test feedback submission to real canonical registry on Sepolia
  });

  it('should query reputation from canonical registry', async () => {
    // Test querying the canonical registry
  });

  it('should work with ENS agent:erc8004 records', async () => {
    // Test full flow: ENS → agentId → ReputationRegistry
  });
});
```

---

## Summary: Integrate with Canonical ReputationRegistry

### What Changed (OIK-12 v1 → v2)

| Before (OIK-12 v1) | After (OIK-12 v2) |
|--------------------|-------------------|
| Deploy new ReputationRegistry | Integrate with canonical |
| Custom contract code | Use existing ABI |
| Deploy to Sepolia ourselves | Already deployed at `0x8004B663...` |
| Manage contract upgrades | Rely on canonical maintainers |
| Write unit tests for contract | Integration tests only |

### The Architecture

```
┌─────────────────────────────────────────────────────────┐
│              ReceiptHook (On-chain)                     │
│         Emits ExecutionReceipt event                    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │        Indexer (Ponder)        │
        └───────────────────────────────┘
                │                    │
                │                    │
        ┌───────▼────────┐   ┌───────▼──────────────┐
        │  Receipt DB    │   │  Submit Feedback    │
        │  (Storage)    │   │  to CANONICAL       │
        └───────┬────────┘   └───────┬──────────────┘
                │                    │
                │                    ▼
        ┌───────▼────────┐   ┌──────────────────────┐
        │  Fast Queries │   │ CANONICAL            │
        │  • By user    │   │ ReputationRegistry   │
        │  • By strategy│   │ 0x8004B663...        │
        │  • By tx hash │   │   • Portable          │
        │  • History    │   │   • Verifiable        │
        └───────────────┘   └──────────────────────┘
                │                    │
                └────────┬────────────┘
                         ▼
                ┌─────────────────┐
                │    Dashboard     │
                │  • Receipts:     │
                │    Indexer API   │
                │  • Reputation:   │
                │    CANONICAL Reg │
                └─────────────────┘
```

### Division of Responsibilities

**Indexer Handles:**
- ✅ Receipt storage (all ExecutionReceipt events)
- ✅ Fast receipt queries (by user, strategy, tx hash)
- ✅ Historical data access
- ✅ Complex filtering and pagination
- ✅ Leaderboard queries (can use ReputationRegistry data)

**Canonical ReputationRegistry Handles:**
- ✅ On-chain reputation scores
- ✅ Portable trust signals (queryable by any protocol)
- ✅ Verifiable feedback aggregation
- ✅ ERC-8004 standard compliance

**Dashboard Uses:**
- **Indexer** → For receipt lists, history, complex queries
- **Canonical ReputationRegistry** → For reputation scores, trust signals

### Why This Works

1. **No Contract Development** - Canonical already deployed
2. **Best Performance** - Fast queries (indexer) + portable reputation (on-chain)
3. **Standards Compliant** - Uses official ERC-8004 registries
4. **Future Proof** - Other protocols can query ReputationRegistry directly
5. **Backward Compatible** - Indexer continues working as before

---

## References

- **Canonical Registry:** https://howto8004.com
- **ERC-8004 Specification:** `context/erc-8004-contracts/ERC8004SPEC.md`
- **Architecture Decisions:** `context/erc-8004-contracts.md`
- **Current Indexer:** `packages/indexer/src/index.ts`
- **ReceiptHook:** `packages/contracts/src/core/ReceiptHook.sol`
- **Related Issue:** OIK-15 (Register agents with canonical registry)

**Canonical Registry Addresses:**
- Sepolia Identity: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- Sepolia Reputation: `0x8004B663056A597Dffe9eCcC1965A193B7388713`
- Mainnet Identity: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- Mainnet Reputation: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`

# Prompt: Implement ERC-8004 ReputationRegistry

> **Related Documents:**
> - `/prompts/PHASE_5_MODE_B_REPUTATION.md` - ReputationRegistry contract and Mode B integration
> - `/prompts/PHASE_E2E_INTEGRATION.md` - E2E integration prerequisites
> - `/context/erc-8004-contracts.md` - ERC-8004 standard reference
> - `/E2E_REQUIREMENTS.md` - Full system integration requirements

## Decision: Build ReputationRegistry Now (Alongside Indexer)

### Context

The MVP currently uses an **indexer-based system** for receipt storage and metrics aggregation. After reviewing the architecture, we've decided to **implement the ERC-8004 ReputationRegistry** now to work **alongside** the indexer, not replace it.

### Why Use Both: Indexer + ReputationRegistry

**They serve different purposes:**

| Purpose | Indexer | ReputationRegistry |
|---------|---------|-------------------|
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
    └─→ Submits feedback to ReputationRegistry (for reputation)
        • On-chain reputation scores
        • Portable across protocols
        • Verifiable trust signals
```

**Why This Approach:**

1. ✅ **Indexer for Receipts** - Fast querying, historical data, complex filters
2. ✅ **ReputationRegistry for Reputation** - On-chain scores, portable trust
3. ✅ **Best of Both Worlds** - Speed + portability
4. ✅ **No Migration Needed** - Build it right from the start
5. ✅ **Standards Compliance** - Demonstrates ERC-8004 integration

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

**ReputationRegistry Responsibilities:**
- On-chain reputation scores
- Portable trust signals
- Verifiable feedback aggregation
- Standard interface for other protocols

**How They Work Together:**
1. ReceiptHook emits → Indexer stores receipt
2. Indexer submits feedback → ReputationRegistry accumulates reputation
3. Dashboard queries:
   - Indexer → For receipt lists and history
   - ReputationRegistry → For reputation scores
4. Other protocols can query ReputationRegistry directly (portable)

### Implementation Plan

**Phase 1: Contract Development**
- Implement `ReputationRegistry.sol` following ERC-8004 standard
- Integrate with existing `IdentityRegistry`
- Add feedback submission logic
- Add summary/aggregation functions

**Phase 2: Indexer Integration**
- **Keep existing receipt storage** - Indexer continues storing receipts for querying
- **Add feedback submission** - Indexer submits feedback to ReputationRegistry after each receipt
- Resolve `strategyId` → `agentId` via ENS
- Submit execution quality and compliance feedback
- **Indexer continues computing metrics** - For fast queries (can be cached from ReputationRegistry)

**Phase 3: Dashboard Integration**
- **Receipt queries** - Continue using indexer (fast, no gas)
- **Reputation scores** - Query ReputationRegistry (on-chain, portable)
- Display on-chain reputation scores alongside receipt history
- Show feedback counts and summaries from ReputationRegistry
- **Fallback** - If ReputationRegistry unavailable, use indexer metrics

**Phase 4: Testing & Deployment**
- Unit tests for ReputationRegistry
- Integration tests for feedback submission
- Deploy to Sepolia
- Verify end-to-end flow

### Timeline Estimate

- **Contract development:** 2-3 days
- **Indexer integration:** 1 day
- **Dashboard integration:** 1 day
- **Testing & deployment:** 1 day
- **Total:** ~5-6 days

### Success Criteria

- [ ] ReputationRegistry contract deployed on Sepolia
- [ ] Indexer continues storing receipts (unchanged)
- [ ] Indexer submits feedback to ReputationRegistry after each receipt
- [ ] Dashboard queries ReputationRegistry for reputation scores
- [ ] Dashboard queries indexer for receipt history (unchanged)
- [ ] Reputation is queryable by any app via ERC-8004 standard
- [ ] Historical receipts can be backfilled to ReputationRegistry (if needed)
- [ ] Both systems work together seamlessly

---

## Linear Issue: Implement ERC-8004 ReputationRegistry

### Issue Title
**Implement ERC-8004 ReputationRegistry for On-Chain Reputation**

### Issue Description

**Background:**
Currently, Oikonomos uses an indexer-based reputation system for MVP speed. However, ERC-8004 ReputationRegistry is the standard solution and should be implemented now for proper architecture and portability.

**Problem:**
- Indexer reputation is not portable across protocols
- Requires trusting off-chain infrastructure
- Will need migration in v1 anyway
- Doesn't demonstrate ERC-8004 standard integration

**Solution:**
Implement ERC-8004 ReputationRegistry contract and integrate it with:
1. ReceiptHook events (via indexer)
2. Dashboard reputation display
3. Agent identity system

**Acceptance Criteria:**
- [ ] ReputationRegistry contract deployed on Sepolia
- [ ] Contract follows ERC-8004 standard
- [ ] Indexer continues storing receipts (no breaking changes)
- [ ] Indexer submits feedback to ReputationRegistry after each ExecutionReceipt
- [ ] Dashboard queries ReputationRegistry for reputation scores
- [ ] Dashboard queries indexer for receipt history (unchanged)
- [ ] Reputation is portable (queryable by any app)
- [ ] Both systems work together (hybrid approach)
- [ ] Unit tests passing
- [ ] Integration tests passing

**Technical Details:**
- Contract location: `packages/contracts/src/identity/ReputationRegistry.sol`
- Integration point: `packages/indexer/src/index.ts` (ReceiptHook handler)
- Dashboard update: `apps/dashboard/components/agent/TrustScore.tsx`
- Reference: `context/erc-8004-contracts.md`

**Dependencies:**
- IdentityRegistry (already implemented)
- ReceiptHook (already implemented)
- Indexer (already implemented)

**Estimated Effort:** 5-6 days

**Priority:** High (Architecture integrity, standards compliance)

**Labels:** `enhancement`, `contracts`, `erc-8004`, `reputation`, `architecture`

---

## Implementation Guidance

### Step 1: Review ERC-8004 Standard

Read the ERC-8004 specification and reference implementation:
- `context/erc-8004-contracts.md` - Architecture decisions
- `context/erc-8004-contracts/ERC8004SPEC.md` - Full specification
- Reference implementation in `ethglobal/erc-8004-contracts/`

### Step 2: Implement ReputationRegistry Contract

Create `packages/contracts/src/identity/ReputationRegistry.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IIdentityRegistry} from "./interfaces/IIdentityRegistry.sol";
import {IReputationRegistry} from "./interfaces/IReputationRegistry.sol";

contract ReputationRegistry is IReputationRegistry {
    IIdentityRegistry public immutable identityRegistry;
    
    // Feedback storage
    mapping(uint256 => Feedback[]) public feedback; // agentId => Feedback[]
    
    // Summary cache (optional optimization)
    mapping(uint256 => mapping(string => mapping(string => Summary))) public summaries;
    
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external {
        // Prevent self-feedback
        require(
            !identityRegistry.isAuthorizedOrOwner(msg.sender, agentId),
            "Cannot give self-feedback"
        );
        
        // Store feedback
        feedback[agentId].push(Feedback({
            clientAddress: msg.sender,
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            endpoint: endpoint,
            feedbackURI: feedbackURI,
            feedbackHash: feedbackHash,
            timestamp: block.timestamp,
            revoked: false
        }));
        
        emit FeedbackGiven(agentId, msg.sender, tag1, tag2, value, valueDecimals);
    }
    
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2
    ) external view returns (uint256 count, int128 summaryValue, uint8 summaryValueDecimals) {
        // Aggregate feedback from specified clients
        // Return count, sum, and decimals
    }
}
```

### Step 3: Update Indexer to Submit Feedback (Keep Receipt Storage)

Modify `packages/indexer/src/index.ts`:

```typescript
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
  
  // NEW: Submit feedback to ReputationRegistry (in parallel)
  // This doesn't replace indexer metrics, it adds on-chain reputation
  await submitToReputationRegistry(event.args);
});

async function submitToReputationRegistry(args: ExecutionReceiptArgs) {
  // 1. Resolve strategyId → agentId via ENS
  const ensName = await resolveStrategyIdToEns(args.strategyId);
  if (!ensName) return; // Skip if can't resolve
  
  const erc8004Record = await client.getEnsText({
    name: ensName,
    key: 'agent:erc8004'
  });
  if (!erc8004Record) return;
  
  const agentId = BigInt(erc8004Record.split(':')[3]);
  
  // 2. Calculate slippage score (0-100, higher is better)
  const slippageScore = Math.max(0, 100 - (Number(args.actualSlippage) * 4));
  
  // 3. Submit execution quality feedback
  await reputationRegistry.giveFeedback(
    agentId,
    BigInt(slippageScore),
    0, // decimals
    'execution',
    'slippage',
    '',
    `ipfs://${receiptCid}`,
    receiptHash
  );
  
  // 4. Submit compliance feedback
  await reputationRegistry.giveFeedback(
    agentId,
    args.policyCompliant ? 100n : 0n,
    0,
    'compliance',
    'policy',
    '',
    `ipfs://${receiptCid}`,
    receiptHash
  );
}
```

### Step 4: Update Dashboard (Hybrid Querying)

Modify `apps/dashboard/components/agent/TrustScore.tsx`:

```typescript
async function getReputationScore(erc8004: string) {
  // Parse agentId from ERC-8004 record
  const agentId = parseAgentId(erc8004);
  
  try {
    // PRIMARY: Query ReputationRegistry (on-chain, portable)
    const executionSummary = await reputationRegistry.getSummary(
      agentId,
      [userAddress], // Required: client addresses
      'execution',
      'slippage'
    );
    
    const complianceSummary = await reputationRegistry.getSummary(
      agentId,
      [userAddress],
      'compliance',
      'policy'
    );
    
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
- **ReputationRegistry** → For reputation scores (on-chain, portable)
- **Indexer** → For receipt queries (fast, historical data)

### Step 5: Testing

Create `packages/contracts/test/ReputationRegistry.t.sol`:

```solidity
contract ReputationRegistryTest is Test {
    ReputationRegistry reputationRegistry;
    IdentityRegistry identityRegistry;
    
    function test_GiveFeedback() public {
        // Test feedback submission
    }
    
    function test_PreventSelfFeedback() public {
        // Test that agent owner cannot give self-feedback
    }
    
    function test_GetSummary() public {
        // Test summary aggregation
    }
}
```

---

## Next Steps

1. **Create Linear Issue** - Add to backlog with above details
2. **Review ERC-8004 Spec** - Understand the standard fully
3. **Implement Contract** - Build ReputationRegistry following standard
4. **Integrate Indexer** - Submit feedback after each receipt
5. **Update Dashboard** - Query ReputationRegistry for scores
6. **Test & Deploy** - Verify end-to-end flow

---

## Summary: Use Both Indexer + ReputationRegistry

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
        │  (Storage)    │   │  (Reputation)       │
        └───────┬────────┘   └───────┬──────────────┘
                │                    │
                │                    ▼
        ┌───────▼────────┐   ┌──────────────────────┐
        │  Fast Queries │   │ ReputationRegistry   │
        │  • By user    │   │   (On-chain)          │
        │  • By strategy│   │   • Portable          │
        │  • By tx hash │   │   • Verifiable        │
        │  • History    │   │   • Standard           │
        └───────────────┘   └──────────────────────┘
                │                    │
                └────────┬────────────┘
                         ▼
                ┌─────────────────┐
                │    Dashboard     │
                │  • Receipts:     │
                │    Indexer API   │
                │  • Reputation:   │
                │    ReputationReg │
                └─────────────────┘
```

### Division of Responsibilities

**Indexer Handles:**
- ✅ Receipt storage (all ExecutionReceipt events)
- ✅ Fast receipt queries (by user, strategy, tx hash)
- ✅ Historical data access
- ✅ Complex filtering and pagination
- ✅ Leaderboard queries (can use ReputationRegistry data)

**ReputationRegistry Handles:**
- ✅ On-chain reputation scores
- ✅ Portable trust signals (queryable by any protocol)
- ✅ Verifiable feedback aggregation
- ✅ ERC-8004 standard compliance

**Dashboard Uses:**
- **Indexer** → For receipt lists, history, complex queries
- **ReputationRegistry** → For reputation scores, trust signals

### Why This Works

1. **No Redundancy** - They serve different purposes
2. **Best Performance** - Fast queries (indexer) + portable reputation (on-chain)
3. **Standards Compliant** - ERC-8004 integration for reputation
4. **Future Proof** - Other protocols can query ReputationRegistry directly
5. **Backward Compatible** - Indexer continues working as before

---

## References

- ERC-8004 Specification: `context/erc-8004-contracts/ERC8004SPEC.md`
- Architecture Decisions: `context/erc-8004-contracts.md`
- Current Indexer: `packages/indexer/src/index.ts`
- ReceiptHook: `packages/contracts/src/core/ReceiptHook.sol`
- IdentityRegistry: `packages/contracts/src/identity/IdentityRegistry.sol`

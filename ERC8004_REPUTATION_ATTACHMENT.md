# ERC-8004 Reputation Attachment: How Verification Builds Over Time

## The Connection Problem

You're right to be confused! There's a **bridge** between two identity systems:

1. **Receipts** use `strategyId` (derived from ENS name: `keccak256("treasury.oikonomos.eth")`)
2. **ERC-8004** uses `agentId` (a `uint256` like `1`, `2`, `3`...)

These are **different identifiers**, so how do they connect?

---

## The Bridge: ENS Text Record

The connection happens through the ENS text record `agent:erc8004`:

```
ENS Name: treasury.oikonomos.eth
    ↓
Text Record: agent:erc8004 = "eip155:11155111:0x462c...:1"
    ↓
Parse: chainId:registryAddress:agentId
    ↓
ERC-8004 agentId: 1
```

---

## Current Flow: Receipts → Reputation

### Step 1: Receipt Emitted (Uses strategyId)

```solidity
// ReceiptHook emits receipt with strategyId (ENS-derived)
event ExecutionReceipt(
    bytes32 indexed strategyId,  // keccak256("treasury.oikonomos.eth")
    bytes32 indexed quoteId,
    address indexed sender,
    int128 amount0,
    int128 amount1,
    uint256 actualSlippage,
    bool policyCompliant,
    uint256 timestamp
);
```

**What happens:**
- Receipt stored in indexer with `strategyId` as key
- Metrics aggregated by `strategyId`
- No direct link to ERC-8004 `agentId` yet

### Step 2: Indexer Stores Receipt

```typescript
// packages/indexer/src/index.ts

ponder.on('ReceiptHook:ExecutionReceipt', async ({ event, context }) => {
  // Store receipt with strategyId
  await context.db.insert(executionReceipt).values({
    id: receiptId,
    strategyId: event.args.strategyId,  // ← ENS-derived hash
    // ... other fields
  });

  // Update metrics by strategyId
  await context.db
    .insert(strategyMetrics)
    .values({
      id: event.args.strategyId,  // ← Keyed by strategyId, not agentId
      totalExecutions: 1n,
      avgSlippage: event.args.actualSlippage,
      // ...
    });
});
```

**Current state:**
- ✅ Receipts indexed by `strategyId`
- ✅ Metrics computed by `strategyId`
- ❌ Not yet linked to ERC-8004 `agentId`

---

## The Missing Link: Resolving strategyId → agentId

### Option 1: Reverse Resolution (Current MVP Approach)

To link receipts to ERC-8004, you need to:

```typescript
// 1. Reverse lookup: strategyId → ENS name
// This requires maintaining a mapping or brute-force search
// (Not ideal, but works for MVP)

async function resolveStrategyIdToEns(strategyId: `0x${string}`): Promise<string | null> {
  // Option A: Maintain a registry mapping
  // Option B: Try known ENS names and hash them
  // Option C: Store ENS name in receipt metadata (future)
  
  // For known agents, we can maintain a mapping:
  const knownAgents = {
    '0x8f3a4b2c...': 'treasury.oikonomos.eth',
    // ... more mappings
  };
  
  return knownAgents[strategyId] || null;
}

// 2. Resolve ENS → ERC-8004 agentId
async function getAgentIdFromEns(ensName: string): Promise<bigint | null> {
  const erc8004Record = await client.getEnsText({
    name: ensName,
    key: 'agent:erc8004'
  });
  
  if (!erc8004Record) return null;
  
  // Parse: "eip155:11155111:0x462c...:1"
  const [, , , agentIdStr] = erc8004Record.split(':');
  return BigInt(agentIdStr);
}

// 3. Query ReputationRegistry with agentId
async function getReputation(agentId: bigint) {
  const reputationRegistry = getContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    client
  });
  
  // Get summary for execution quality
  const executionSummary = await reputationRegistry.getSummary(
    agentId,
    [userAddress],  // Client addresses (required)
    'execution',
    'slippage'
  );
  
  // Get summary for compliance
  const complianceSummary = await reputationRegistry.getSummary(
    agentId,
    [userAddress],
    'compliance',
    'policy'
  );
  
  return {
    executionScore: executionSummary.summaryValue,
    complianceScore: complianceSummary.summaryValue,
    feedbackCount: executionSummary.count
  };
}
```

**Problem:** This requires reverse lookup, which is inefficient.

---

## Future Flow: Direct agentId in Receipts (v1+)

### Better Approach: Include agentId in Receipt

For v1, receipts could include both identifiers:

```solidity
event ExecutionReceipt(
    bytes32 indexed strategyId,     // ENS-derived (for backward compat)
    uint256 indexed agentId,        // ERC-8004 agentId (NEW)
    bytes32 indexed quoteId,
    address indexed sender,
    int128 amount0,
    int128 amount1,
    uint256 actualSlippage,
    bool policyCompliant,
    uint256 timestamp
);
```

**How it works:**
1. Agent registers with ERC-8004 → gets `agentId = 1`
2. Agent sets ENS record: `agent:erc8004 = "eip155:11155111:0x462c...:1"`
3. When executing, agent includes `agentId` in hookData
4. ReceiptHook emits receipt with **both** `strategyId` and `agentId`
5. Indexer can directly query ReputationRegistry by `agentId`

---

## How Reputation Attaches Over Time

### Current MVP: Indexer-Based Reputation

**Step 1: Receipts Accumulate**
```
Execution 1: strategyId = 0x8f3a..., slippage = 12 bps, compliant = true
Execution 2: strategyId = 0x8f3a..., slippage = 11 bps, compliant = true
Execution 3: strategyId = 0x8f3a..., slippage = 13 bps, compliant = true
...
Execution 1247: strategyId = 0x8f3a..., slippage = 12 bps, compliant = true
```

**Step 2: Indexer Aggregates Metrics**
```typescript
// Indexer computes running averages
strategyMetrics[strategyId] = {
  totalExecutions: 1247n,
  avgSlippage: 12n,        // Running average
  complianceRate: 9950n,   // 99.5% (basis points)
  totalVolume: 5000000000000n
};
```

**Step 3: Dashboard Resolves to ERC-8004**
```typescript
// When displaying agent profile:
// 1. User searches: treasury.oikonomos.eth
// 2. Resolve ENS → get agent:erc8004 record
// 3. Extract agentId = 1
// 4. Query indexer by strategyId (for now)
// 5. Display metrics

const ensName = 'treasury.oikonomos.eth';
const strategyId = keccak256(toBytes(ensName));
const metrics = await indexer.getStrategyMetrics(strategyId);
// → Shows reputation based on receipts
```

**Current limitation:** Reputation is stored in indexer, not on-chain ERC-8004 ReputationRegistry.

---

## Future v1: On-Chain ERC-8004 Reputation

### How It Will Work

**Step 1: Receipt Emitted (with agentId)**
```solidity
// ReceiptHook emits with agentId
emit ExecutionReceipt(
    strategyId: keccak256("treasury.oikonomos.eth"),
    agentId: 1,  // ← ERC-8004 agentId
    quoteId: 0xabc...,
    actualSlippage: 12,
    policyCompliant: true,
    // ...
);
```

**Step 2: Indexer Catches Receipt**
```typescript
ponder.on('ReceiptHook:ExecutionReceipt', async ({ event, context }) => {
  // Store receipt
  await context.db.insert(executionReceipt).values({
    strategyId: event.args.strategyId,
    agentId: event.args.agentId,  // ← Now we have agentId!
    // ...
  });
  
  // Submit feedback to ERC-8004 ReputationRegistry
  await submitToReputationRegistry(event.args.agentId, {
    slippage: event.args.actualSlippage,
    compliant: event.args.policyCompliant
  });
});
```

**Step 3: Submit to ReputationRegistry**
```typescript
async function submitToReputationRegistry(
  agentId: bigint,
  receipt: ExecutionReceipt
) {
  const reputationRegistry = getContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    client: walletClient
  });
  
  // Calculate slippage score (0-100, higher is better)
  // 0 bps = 100 points, 25 bps = 0 points (linear)
  const slippageScore = Math.max(0, 100 - (Number(receipt.actualSlippage) * 4));
  
  // Submit execution quality feedback
  await reputationRegistry.giveFeedback(
    agentId,
    BigInt(slippageScore),  // value: 88 (for 12 bps slippage)
    0,                       // decimals: 0 (integer score)
    'execution',            // tag1
    'slippage',             // tag2
    '',                      // endpoint (optional)
    `ipfs://${receiptCid}`, // feedbackURI (optional)
    receiptHash              // feedbackHash (optional)
  );
  
  // Submit compliance feedback
  await reputationRegistry.giveFeedback(
    agentId,
    receipt.policyCompliant ? 100n : 0n,  // Binary pass/fail
    0,
    'compliance',
    'policy',
    '',
    `ipfs://${receiptCid}`,
    receiptHash
  );
}
```

**Step 4: Reputation Accumulates On-Chain**
```solidity
// ReputationRegistry stores feedback
// Each execution adds 2 feedback entries:
// 1. execution/slippage: 88 (out of 100)
// 2. compliance/policy: 100 (pass) or 0 (fail)

// Over time:
// Execution 1: slippage=88, compliance=100
// Execution 2: slippage=89, compliance=100
// Execution 3: slippage=87, compliance=100
// ...
// Execution 1247: slippage=88, compliance=100

// Query summary:
reputationRegistry.getSummary(
    agentId: 1,
    clientAddresses: [0x742d...],  // Alice's address
    tag1: 'execution',
    tag2: 'slippage'
);
// Returns: (count: 1247, summaryValue: 88, summaryValueDecimals: 0)
// → Average slippage score: 88/100
```

**Step 5: Dashboard Queries On-Chain Reputation**
```typescript
// When displaying agent:
const ensName = 'treasury.oikonomos.eth';

// 1. Resolve ENS → get agentId
const erc8004Record = await client.getEnsText({
  name: ensName,
  key: 'agent:erc8004'
});
const agentId = BigInt(erc8004Record.split(':')[3]);

// 2. Query ReputationRegistry directly
const executionSummary = await reputationRegistry.getSummary(
  agentId,
  [userAddress],  // Required: client addresses
  'execution',
  'slippage'
);

const complianceSummary = await reputationRegistry.getSummary(
  agentId,
  [userAddress],
  'compliance',
  'policy'
);

// 3. Display on-chain reputation
<TrustScore>
  Execution Score: {executionSummary.summaryValue}/100
  Compliance Rate: {complianceSummary.summaryValue}%
  Based on {executionSummary.count} verifiable executions
</TrustScore>
```

---

## Timeline: How Reputation Builds

### Day 1: Agent Registers
```
1. Agent registers with IdentityRegistry
   → agentId = 1 minted
   → agentURI = "ipfs://Qm..." set

2. Agent sets ENS records
   → treasury.oikonomos.eth
   → agent:erc8004 = "eip155:11155111:0x462c...:1"
   → agent:type = "treasury"
   → agent:a2a = "https://treasury-agent.workers.dev"

3. ReputationRegistry: Empty
   → No feedback yet
   → Agent is unproven
```

### Week 1: First Executions
```
Execution 1:
  → Receipt emitted: strategyId, slippage=12 bps, compliant=true
  → Indexer stores receipt
  → (MVP) Metrics: 1 execution, 12 bps avg
  → (v1) ReputationRegistry.giveFeedback(agentId=1, slippage=88, compliance=100)

Execution 2-10:
  → More receipts accumulate
  → (MVP) Indexer: 10 executions, 11.5 bps avg
  → (v1) ReputationRegistry: 10 feedback entries for execution/slippage, 10 for compliance/policy
```

### Month 1: Reputation Established
```
After 100 executions:
  → (MVP) Indexer: 100 executions, 12 bps avg, 99% compliance
  → (v1) ReputationRegistry.getSummary():
     - execution/slippage: (count: 100, value: 88, decimals: 0)
     - compliance/policy: (count: 100, value: 99, decimals: 0)
  
Trust Score: 87/100
  → Based on verifiable on-chain data
  → Portable across any app that queries ReputationRegistry
```

### Month 6: High Reputation
```
After 1,247 executions:
  → (MVP) Indexer: 1,247 executions, 12 bps avg, 99.5% compliance
  → (v1) ReputationRegistry.getSummary():
     - execution/slippage: (count: 1247, value: 88, decimals: 0)
     - compliance/policy: (count: 1247, value: 995, decimals: 1)  // 99.5%
  
Trust Score: 87/100
  → Established reputation
  → Users trust agent based on proven track record
```

---

## Key Differences: MVP vs v1

| Aspect | MVP (Current) | v1 (Future) |
|--------|---------------|-------------|
| **Receipt Identifier** | `strategyId` only | `strategyId` + `agentId` |
| **Reputation Storage** | Indexer database | ERC-8004 ReputationRegistry (on-chain) |
| **Reputation Query** | Indexer API | ReputationRegistry contract |
| **Portability** | Limited to Oikonomos | Portable across protocols |
| **Verification** | Indexer + on-chain receipts | On-chain ReputationRegistry |
| **Connection** | ENS → strategyId → metrics | ENS → agentId → ReputationRegistry |

---

## Summary: How Verification Attaches

**Current MVP Flow:**
```
Receipt (strategyId) 
  → Indexer aggregates metrics
  → Dashboard queries indexer
  → Reputation displayed (off-chain)
```

**Future v1 Flow:**
```
Receipt (strategyId + agentId)
  → Indexer stores receipt
  → Indexer submits feedback to ReputationRegistry
  → ReputationRegistry stores on-chain
  → Dashboard queries ReputationRegistry directly
  → Reputation displayed (on-chain, portable)
```

**The Bridge:**
- **ENS name** (`treasury.oikonomos.eth`) is the user-facing identity
- **strategyId** (`keccak256(ensName)`) links receipts to ENS
- **agentId** (`1`) links to ERC-8004 identity
- **ENS text record** (`agent:erc8004`) bridges strategyId ↔ agentId

**Over Time:**
1. Receipts accumulate with `strategyId`
2. Indexer aggregates metrics by `strategyId`
3. Dashboard resolves ENS → `agentId` via text record
4. (v1) ReputationRegistry accumulates feedback by `agentId`
5. Reputation becomes portable across protocols

The key insight: **Reputation attaches to the ERC-8004 agentId through the ENS bridge**, but currently the aggregation happens in the indexer. In v1, it will happen directly in the on-chain ReputationRegistry.

# User Journey: Strategy Provider
## ERC-8004 Registration → ENS Marketplace Listing → Agent Discovery

**Focus:** Registration, Listing, and Discoverability

---

## E2E Testing Status

> **Last Updated:** 2026-02-02

| Component | Status | Notes |
|-----------|--------|-------|
| ERC-8004 IdentityRegistry | ✅ Deployed | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| Agent registration CLI | ✅ Working | `pnpm register` in packages/contracts |
| ENS name registration | ⏳ Pending | Need Sepolia ENS setup |
| ENS marketplace records | ⏳ Pending | OIK-34: New text records |
| Indexer /agents endpoint | ⏳ Pending | OIK-34: List registered agents |
| Agent discovery via /suggest-policy | ⏳ Pending | OIK-34: ENS resolution |

---

## Persona: Alice

**Profile:**
- Strategy developer building DeFi automation
- Has deployed a treasury rebalancing agent on Cloudflare Workers
- Wants to list her agent on the Oikonomos marketplace
- Values: Transparency, fair competition, reputation-based discovery

**Philosophy:** Build once, compete on execution quality, let reputation speak.

**Goals:**
- Register agent identity on-chain (ERC-8004)
- List agent on ENS marketplace with capabilities
- Get discovered by users through `/suggest-policy`
- Build reputation through verifiable execution receipts

---

## Phase 1: Deploy Agent Service

### Step 1: Build Agent Endpoint

**User Action:** Alice deploys her treasury agent to Cloudflare Workers

**Technical Flow:**

```typescript
// agents/treasury-agent/src/index.ts

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // A2A Protocol Endpoints (required)
    if (url.pathname === '/.well-known/agent-card.json') {
      return handleAgentCard(env);
    }
    if (url.pathname === '/quote') {
      return handleQuote(request, env);
    }
    if (url.pathname === '/execute') {
      return handleExecute(request, env);
    }

    // Policy Suggestion (OIK-33)
    if (url.pathname === '/suggest-policy') {
      return handleSuggestPolicy(request, env);
    }

    // Health & Status
    if (url.pathname === '/health') {
      return handleHealth(env);
    }

    return new Response('Not Found', { status: 404 });
  }
};
```

**Agent Card (A2A Protocol):**

```json
// /.well-known/agent-card.json
{
  "name": "Alice's Treasury Agent",
  "description": "Stablecoin rebalancing with optimal execution",
  "version": "1.0.0",
  "capabilities": [
    "rebalance",
    "drift-detection",
    "policy-enforcement"
  ],
  "endpoints": {
    "quote": "/quote",
    "execute": "/execute",
    "suggest": "/suggest-policy"
  },
  "supportedTokens": [
    "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
  ],
  "policyTypes": [
    "stablecoin-rebalance",
    "threshold-rebalance"
  ],
  "pricing": {
    "type": "percentage",
    "value": "0.1%"
  }
}
```

**Deployment:**

```bash
cd agents/treasury-agent
wrangler deploy
# → https://alice-treasury-agent.workers.dev
```

**Alice Sees:**
```
┌─────────────────────────────────────────┐
│ Agent Deployed                           │
│                                         │
│ URL: https://alice-treasury-agent...    │
│ Status: ✅ Live                          │
│                                         │
│ Endpoints:                              │
│ • /.well-known/agent-card.json ✅       │
│ • /quote ✅                              │
│ • /execute ✅                            │
│ • /suggest-policy ✅                     │
│ • /health ✅                             │
│                                         │
│ Ready for registration →                │
└─────────────────────────────────────────┘
```

---

## Phase 2: Register ERC-8004 Identity

### Step 2: On-Chain Registration

**User Action:** Alice registers her agent on the IdentityRegistry

**Technical Flow:**

```typescript
// Using the registration CLI
// packages/contracts/scripts/register-agent.ts

import { createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';

async function registerAgent() {
  const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);

  const client = createWalletClient({
    account,
    chain: sepolia,
    transport: http(process.env.RPC_URL)
  });

  // Register agent with metadata URI
  const tx = await client.writeContract({
    address: IDENTITY_REGISTRY,
    abi: IdentityRegistryABI,
    functionName: 'register',
    args: [
      'ipfs://QmYourAgentMetadataHash',  // agentURI pointing to metadata JSON
      '0x'  // Optional additional metadata
    ]
  });

  console.log('Registration TX:', tx);
  // → agentId: 643 (next available ID)
}
```

**CLI Command:**

```bash
cd packages/contracts
pnpm register --uri "ipfs://QmYourAgentMetadataHash"

# Output:
# ✅ Agent registered successfully
# Agent ID: 643
# Registry: 0x8004A818BFB912233c491871b3d84c89A494BD9e
# TX: 0xabc123...
```

**Agent Metadata (IPFS):**

```json
// ipfs://QmYourAgentMetadataHash
{
  "name": "Alice's Treasury Agent",
  "ens": "alice-treasury.oikonomos.eth",
  "version": "1.0.0",
  "description": "High-performance stablecoin rebalancing with <25 bps slippage",
  "capabilities": ["rebalance", "drift-detection", "policy-enforcement"],
  "a2a": "https://alice-treasury-agent.workers.dev",
  "supportedTokens": ["USDC", "DAI", "WETH"],
  "policyTemplates": [
    {
      "name": "stablecoin-rebalance",
      "description": "Maintain target allocation across stablecoins",
      "params": ["targetAllocations", "driftThreshold", "maxSlippage"]
    }
  ],
  "pricing": {
    "type": "percentage",
    "value": "0.1%"
  }
}
```

**Registration Features:**
- ✅ **On-chain identity** - ERC-721 NFT proves agent existence
- ✅ **Portable** - Works across any protocol that supports ERC-8004
- ✅ **Metadata linking** - agentURI points to rich metadata
- ✅ **Ownership proof** - NFT ownership = control over identity

**Alice Sees:**
```
┌─────────────────────────────────────────┐
│ ERC-8004 Registration Complete          │
│                                         │
│ Agent ID: #643                          │
│ Registry: 0x8004A818...                 │
│ Wallet: 0x742d35Cc...                   │
│ Metadata: ipfs://QmYour...              │
│                                         │
│ ✅ On-chain identity verified           │
│ ✅ NFT minted to your wallet            │
│                                         │
│ Next: Set up ENS marketplace listing →  │
└─────────────────────────────────────────┘
```

---

## Phase 3: ENS Marketplace Listing

### Step 3: Set ENS Text Records

**User Action:** Alice sets ENS text records for marketplace discovery

**Technical Flow:**

```typescript
// Using ENS.js or viem to set text records
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';  // ENS is on mainnet
import { normalize } from 'viem/ens';

const ENS_PUBLIC_RESOLVER = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63';

async function setMarketplaceRecords() {
  const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http(process.env.MAINNET_RPC_URL)
  });

  const name = normalize('alice-treasury.oikonomos.eth');
  const node = namehash(name);

  // Required agent records
  const records = [
    { key: 'agent:type', value: 'treasury' },
    { key: 'agent:mode', value: 'intent-only' },
    { key: 'agent:version', value: '1.0.0' },
    { key: 'agent:chainId', value: '11155111' },
    { key: 'agent:entrypoint', value: '0xFD699481f0aA60e0014EEd79d16cbe4b954FfaEf' },
    { key: 'agent:a2a', value: 'https://alice-treasury-agent.workers.dev' },
    { key: 'agent:erc8004', value: 'eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e:643' },

    // Marketplace records (OIK-34)
    { key: 'agent:supportedTokens', value: 'USDC,DAI,WETH' },
    { key: 'agent:policyTypes', value: 'stablecoin-rebalance,threshold-rebalance' },
    { key: 'agent:pricing', value: '0.1%' },
    { key: 'agent:description', value: 'High-performance stablecoin rebalancing with <25 bps slippage' }
  ];

  // Set each record
  for (const { key, value } of records) {
    await client.writeContract({
      address: ENS_PUBLIC_RESOLVER,
      abi: PublicResolverABI,
      functionName: 'setText',
      args: [node, key, value]
    });
  }
}
```

**CLI Command (OIK-34):**

```bash
cd packages/contracts
pnpm ens:set-records --name alice-treasury.oikonomos.eth

# Interactive prompts:
# Agent type: treasury
# Agent mode: intent-only
# A2A endpoint: https://alice-treasury-agent.workers.dev
# Supported tokens (comma-separated): USDC,DAI,WETH
# Policy types (comma-separated): stablecoin-rebalance,threshold-rebalance
# Pricing: 0.1%
# Description: High-performance stablecoin rebalancing

# Output:
# ✅ ENS records set successfully
# Name: alice-treasury.oikonomos.eth
# Records: 11 text records set
```

**ENS Records Schema:**

| Record | Value | Purpose |
|--------|-------|---------|
| `agent:type` | `treasury` | Agent category for filtering |
| `agent:mode` | `intent-only` | Execution mode |
| `agent:version` | `1.0.0` | Semantic version |
| `agent:chainId` | `11155111` | Target chain (Sepolia) |
| `agent:entrypoint` | `0xFD69...` | IntentRouter contract |
| `agent:a2a` | `https://...` | A2A protocol endpoint |
| `agent:erc8004` | `eip155:11155111:...` | Identity registry reference |
| `agent:supportedTokens` | `USDC,DAI,WETH` | **Marketplace: Token support** |
| `agent:policyTypes` | `stablecoin-rebalance,...` | **Marketplace: Policy templates** |
| `agent:pricing` | `0.1%` | **Marketplace: Fee structure** |
| `agent:description` | `High-performance...` | **Marketplace: Description** |

**Marketplace Benefits:**
- ✅ **Discoverable** - Users find agents via `/suggest-policy`
- ✅ **Filterable** - Token and policy type matching
- ✅ **Comparable** - Pricing and capabilities visible
- ✅ **Decentralized** - ENS is the registry, no central database

**Alice Sees:**
```
┌─────────────────────────────────────────┐
│ ENS Marketplace Listing Complete        │
│                                         │
│ Name: alice-treasury.oikonomos.eth     │
│                                         │
│ Records Set:                            │
│ • agent:type = treasury                 │
│ • agent:mode = intent-only              │
│ • agent:supportedTokens = USDC,DAI,WETH │
│ • agent:policyTypes = stablecoin-...    │
│ • agent:pricing = 0.1%                  │
│ • agent:description = High-perf...      │
│                                         │
│ ✅ Agent now discoverable on marketplace │
│                                         │
│ Users will find you when:               │
│ • They have USDC, DAI, or WETH          │
│ • They need stablecoin rebalancing      │
│ • Your reputation ranks competitively   │
└─────────────────────────────────────────┘
```

---

## Phase 4: Get Indexed & Discovered

### Step 4: Indexer Registration

**User Action:** Alice's agent is automatically indexed by the Ponder indexer

**Technical Flow:**

```typescript
// Indexer automatically catches IdentityRegistry.Register events
// packages/indexer/src/handlers/identityRegistry.ts

ponder.on('IdentityRegistry:Register', async ({ event, context }) => {
  const agentId = event.args.agentId;
  const agentURI = event.args.agentURI;
  const agentWallet = event.args.agentWallet;

  // Store agent in indexer database
  await context.db.insert(agent).values({
    id: agentId.toString(),
    agentURI,
    agentWallet,
    registeredAt: event.block.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash
  });

  // Resolve ENS name from agentURI metadata
  const metadata = await fetchIPFS(agentURI);
  if (metadata.ens) {
    await context.db.update(agent)
      .set({ ens: metadata.ens })
      .where(eq(agent.id, agentId.toString()));
  }
});

// API endpoint for listing agents
// GET /agents
app.get('/agents', async (c) => {
  const agents = await db
    .select()
    .from(agent)
    .orderBy(desc(agent.registeredAt))
    .limit(100);

  return c.json(agents);
});

// GET /agents?tokens=USDC,DAI
app.get('/agents', async (c) => {
  const tokensParam = c.req.query('tokens');

  if (tokensParam) {
    const requestedTokens = tokensParam.split(',');
    // Filter agents by token support (requires ENS resolution)
    // This is done in /suggest-policy for full marketplace matching
  }

  const agents = await db.select().from(agent).limit(100);
  return c.json(agents);
});
```

**Indexer API:**

```bash
# List all registered agents
curl https://oikonomos-indexer.ponder.sh/agents

# Response:
[
  {
    "id": "643",
    "agentURI": "ipfs://QmYour...",
    "agentWallet": "0x742d35Cc...",
    "ens": "alice-treasury.oikonomos.eth",
    "registeredAt": 1738483200,
    "blockNumber": 5234567
  },
  ...
]
```

**Alice Sees:**
```
┌─────────────────────────────────────────┐
│ Agent Indexed                           │
│                                         │
│ Indexer: oikonomos-indexer.ponder.sh   │
│ Agent ID: 643                           │
│ ENS: alice-treasury.oikonomos.eth      │
│                                         │
│ ✅ Indexed in 12 seconds                 │
│ ✅ Available via /agents API             │
│ ✅ Discoverable via /suggest-policy      │
└─────────────────────────────────────────┘
```

---

### Step 5: Discovery via /suggest-policy

**User Action:** A user (Marcus) searches for compatible agents

**Technical Flow:**

```typescript
// When Marcus calls /suggest-policy, his tokens are analyzed
// and matched against registered agents

async function handleSuggestPolicy(request: Request, env: Env) {
  // 1. Analyze user's portfolio
  const portfolio = await fetchPortfolio(env, walletAddress, tokens);
  const composition = analyzeComposition(portfolio);

  // 2. Get registered agents from indexer
  const agentsResponse = await fetch(`${env.INDEXER_URL}/agents`);
  const registeredAgents = await agentsResponse.json();

  // 3. Resolve ENS marketplace records for each agent
  const agentsWithRecords = await Promise.all(
    registeredAgents.map(async (agent) => {
      const records = await resolveMarketplaceRecords(agent.ens);
      return { ...agent, ...records };
    })
  );

  // 4. Filter by token compatibility
  const userTokenSymbols = portfolio.map(t => t.symbol);
  const compatibleAgents = agentsWithRecords.filter(agent => {
    const agentTokens = agent.supportedTokens?.split(',') || [];
    return userTokenSymbols.every(t => agentTokens.includes(t));
  });

  // 5. Filter by policy type compatibility
  const neededPolicyType = determinePolicyType(composition);
  const matchingAgents = compatibleAgents.filter(agent => {
    const agentPolicies = agent.policyTypes?.split(',') || [];
    return agentPolicies.includes(neededPolicyType);
  });

  // 6. Rank by reputation score (from ReputationRegistry)
  const rankedAgents = await Promise.all(
    matchingAgents.map(async (agent) => {
      const trustScore = await calculateTrustScore(agent.agentId);
      return { ...agent, trustScore };
    })
  );

  rankedAgents.sort((a, b) => b.trustScore - a.trustScore);

  // 7. Return top matches
  return Response.json({
    suggestedPolicy: { ... },
    matchedAgents: rankedAgents.slice(0, 5),
    reasoning: `Found ${rankedAgents.length} compatible agents...`
  });
}
```

**Marcus (User) Sees:**
```
┌─────────────────────────────────────────┐
│ Compatible Strategy Agents              │
│                                         │
│ 1. alice-treasury.oikonomos.eth        │
│    Trust Score: 92/100 █████████░      │
│    Pricing: 0.1%                        │
│    Tokens: USDC, DAI, WETH              │
│    "High-performance stablecoin..."     │
│    [Select]                             │
│                                         │
│ 2. treasury.oikonomos.eth              │
│    Trust Score: 87/100 ████████░░      │
│    Pricing: 0.05%                       │
│    Tokens: USDC, DAI                    │
│    "Treasury rebalancing for..."        │
│    [Select]                             │
│                                         │
│ 3. bob-strategy.oikonomos.eth          │
│    Trust Score: 78/100 ███████░░░      │
│    Pricing: 0.15%                       │
│    Tokens: USDC, DAI, WETH, UNI         │
│    "Multi-asset rebalancing..."         │
│    [Select]                             │
└─────────────────────────────────────────┘
```

---

## Phase 5: Build Reputation

### Step 6: Execute & Earn Reputation

**User Action:** Alice's agent executes trades, building on-chain reputation

**Technical Flow:**

```
User selects Alice's agent
       │
       ▼
Sign intent (EIP-712)
       │
       ▼
Alice's agent executes via IntentRouter
       │
       ▼
ReceiptHook emits ExecutionReceipt
       │
       ▼
Indexer catches receipt
       │
       ├─► Stores in receipt database
       │
       └─► Submits feedback to ReputationRegistry
                │
                ▼
         Alice's reputation updates
                │
                ▼
         Trust score increases
```

**Reputation Accumulation:**

```typescript
// After each execution, indexer submits feedback
await reputationRegistry.giveFeedback(
  agentId,                    // 643 (Alice's agent)
  slippageScore,              // 0-100 based on execution quality
  0,                          // decimals
  'execution',                // tag1
  'slippage',                 // tag2
  '',                         // endpoint
  `ipfs://${receiptCid}`,    // feedbackURI
  receiptHash                 // feedbackHash
);

// Alice's reputation after 100 executions:
const summary = await reputationRegistry.getSummary(
  643,           // agentId
  [userAddress], // clients
  'execution',
  'slippage'
);
// Returns:
// {
//   count: 100n,
//   summaryValue: 92n,  // Average slippage score
//   summaryValueDecimals: 0n
// }
```

**Alice Sees:**
```
┌─────────────────────────────────────────┐
│ Reputation Dashboard                    │
│                                         │
│ Agent: alice-treasury.oikonomos.eth    │
│ Agent ID: #643                          │
│                                         │
│ Trust Score: 92/100 █████████░          │
│                                         │
│ Metrics:                                │
│ • 100 executions                        │
│ • 92/100 avg execution score            │
│ • 99% compliance rate                   │
│ • $50K total volume                     │
│                                         │
│ Recent Receipts:                        │
│ • 8 bps slippage ✅ (5 min ago)         │
│ • 12 bps slippage ✅ (1 hour ago)       │
│ • 6 bps slippage ✅ (3 hours ago)       │
│                                         │
│ Rank: #2 on leaderboard                 │
└─────────────────────────────────────────┘
```

---

## Summary: Strategy Provider Journey

**Alice's Complete Journey:**

1. **Deploy agent** → Cloudflare Worker with A2A endpoints
2. **Register ERC-8004** → On-chain identity with agentId NFT
3. **Set ENS records** → Marketplace listing with capabilities
4. **Get indexed** → Ponder indexer catches registration
5. **Get discovered** → Users find via `/suggest-policy`
6. **Execute trades** → Receipts prove execution quality
7. **Build reputation** → ReputationRegistry accumulates feedback
8. **Rank on leaderboard** → Trust score determines visibility

**Marketplace Benefits:**

- ✅ **Decentralized listing** - ENS is the registry
- ✅ **Permissionless** - Anyone can register
- ✅ **Reputation-based** - Quality rises to the top
- ✅ **Transparent** - All metrics on-chain
- ✅ **Portable** - ERC-8004 works across protocols

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 STRATEGY PROVIDER (Alice)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1. Deploy agent
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Agent Service (Cloudflare Worker)               │
│  • /.well-known/agent-card.json                              │
│  • /quote                                                    │
│  • /execute                                                  │
│  • /suggest-policy                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 2. Register identity
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              IdentityRegistry (ERC-8004)                     │
│  • agentId: 643                                              │
│  • agentURI: ipfs://Qm...                                    │
│  • agentWallet: 0x742d...                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 3. Set ENS records
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ENS (Marketplace Registry)                      │
│  • alice-treasury.oikonomos.eth                             │
│  • agent:supportedTokens = USDC,DAI,WETH                    │
│  • agent:policyTypes = stablecoin-rebalance                 │
│  • agent:pricing = 0.1%                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 4. Get indexed
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Ponder Indexer                                  │
│  • /agents → lists registered agents                         │
│  • /receipts → execution history                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 5. Get discovered
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              /suggest-policy                                 │
│  • Resolves ENS marketplace records                          │
│  • Filters by token compatibility                            │
│  • Ranks by reputation score                                 │
│  • Returns matched agents                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 6. Execute & build reputation
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ReputationRegistry (ERC-8004)                   │
│  • Accumulates feedback from receipts                        │
│  • Provides on-chain trust scores                            │
│  • Portable across protocols                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendix: CLI Commands

### Registration CLI

```bash
# Register agent (creates ERC-8004 identity)
cd packages/contracts
pnpm register --uri "ipfs://QmYourAgentMetadataHash"

# Set ENS records (marketplace listing)
pnpm ens:set-records --name alice-treasury.oikonomos.eth

# Verify registration
pnpm verify-agent --id 643
```

### ENS Records CLI (OIK-34)

```bash
# Set individual record
pnpm ens:set --name alice-treasury.oikonomos.eth \
  --key agent:supportedTokens \
  --value "USDC,DAI,WETH"

# Set all marketplace records interactively
pnpm ens:marketplace-setup --name alice-treasury.oikonomos.eth

# Verify ENS records
pnpm ens:verify --name alice-treasury.oikonomos.eth
```

---

**End of Strategy Provider Journey Document**

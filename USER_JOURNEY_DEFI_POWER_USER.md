# User Journey: DeFi Power User
## ENS Discovery → ERC-8004 Reputation → Uniswap V4 Execution

**Focus:** Discoverability, Reputation, and Verification

---

## E2E Testing Status

> **Last Updated:** 2026-02-01

| Component | Status | Notes |
|-----------|--------|-------|
| IntentRouter execution | ✅ Tested | TX: `0x38571649...` |
| ReceiptHook events | ✅ Tested | ExecutionReceipt emitted |
| Treasury agent drift detection | ✅ Tested | `/check-triggers` working |
| Treasury agent rebalance | ✅ Tested | `/rebalance` executes swaps |
| Strategy agent quotes | ✅ Tested | `/quote` returns valid quotes |
| A2A agent-card.json | ✅ Tested | Proper schema |
| ENS resolution | ⏳ Pending | Needs ENS setup on Sepolia |
| ERC-8004 identity | ⏳ Pending | Registry not deployed |
| ReputationRegistry | ⏳ Pending | Indexer integration needed |
| Multi-asset rebalancing | ⏳ Pending | Currently single-pair only |

---

## Persona: Marcus

**Profile:**
- DeFi power user with $100K mixed portfolio
- Active trader maintaining ETH exposure + stablecoin reserves
- Current allocation: 40% ETH, 25% USDC, 15% DAI, 10% USDC(Circle), 5% UNI, 5% LINK
- Target allocation: Same as current (rebalance on drift)
- Values: Transparency, verifiable execution, trust through proof

**Philosophy:** Maintain core ETH exposure while actively managing stablecoin reserves for yield opportunities and dip buying.

**Goals:**
- Automate treasury rebalancing across asset classes
- Maintain target allocations with variable drift thresholds
- Verify every execution with on-chain proof
- Trust agents based on verifiable reputation

### Portfolio (Sepolia Testnet)

| Asset | Target % | Address | Faucet |
|-------|----------|---------|--------|
| **ETH/WETH** | 40% | Native / `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` | [Google Cloud](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) |
| **USDC (Aave)** | 25% | `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8` | [Aave Faucet](https://staging.aave.com/faucet/) |
| **DAI (Aave)** | 15% | `0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357` | [Aave Faucet](https://staging.aave.com/faucet/) |
| **USDC (Circle)** | 10% | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | [Circle Faucet](https://faucet.circle.com/) |
| **UNI** | 5% | `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` | Limited |
| **LINK** | 5% | `0x779877A7B0D9E8603169DdbD7836e478b4624789` | [Chainlink](https://faucets.chain.link/sepolia) |

### Drift Thresholds

| Asset Class | Threshold | Rationale |
|-------------|-----------|-----------|
| ETH/WETH | ±7% | Base layer, moderate rebalancing |
| Stablecoins | ±5% | Tight band for stable assets |
| Altcoins (UNI/LINK) | ±10% | Wider tolerance for volatility |

---

## Phase 1: Discovery via ENS

### Step 1: Agent Search

**User Action:** Marcus opens Oikonomos dashboard, searches `treasury.oikonomos.eth`

**Technical Flow:**

```typescript
// Dashboard calls /api/resolve?name=treasury.oikonomos.eth
// SDK resolves ENS text records in parallel:

const records = await Promise.all([
  client.getEnsText({ name: 'treasury.oikonomos.eth', key: 'agent:type' }),      
  // → "treasury"
  
  client.getEnsText({ name: 'treasury.oikonomos.eth', key: 'agent:mode' }),     
  // → "intent-only"
  
  client.getEnsText({ name: 'treasury.oikonomos.eth', key: 'agent:version' }),   
  // → "0.1.0"
  
  client.getEnsText({ name: 'treasury.oikonomos.eth', key: 'agent:chainId' }),  
  // → "11155111" (Sepolia)
  
  client.getEnsText({ name: 'treasury.oikonomos.eth', key: 'agent:entrypoint' }), 
  // → "0xFD699481f0aA60e0014EEd79d16cbe4b954FfaEf" (IntentRouter)
  
  client.getEnsText({ name: 'treasury.oikonomos.eth', key: 'agent:erc8004' }),  
  // → "eip155:11155111:0x462c09195E468823845C60C12Ec9eB72d16C7584:1"
  
  client.getEnsText({ name: 'treasury.oikonomos.eth', key: 'agent:a2a' }),      
  // → "https://treasury-agent.workers.dev"
  
  client.getEnsText({ name: 'treasury.oikonomos.eth', key: 'agent:x402' }),     
  // → "https://treasury-agent.workers.dev/pricing"
  
  client.getEnsText({ name: 'treasury.oikonomos.eth', key: 'agent:safe' }),     
  // → null (Mode A, no Safe)
  
  client.getEnsText({ name: 'treasury.oikonomos.eth', key: 'agent:rolesModifier' }), 
  // → null (Mode A, no Roles)
]);

// SDK constructs AgentRecord object
const agentRecord: AgentRecord = {
  type: 'treasury',
  mode: 'intent-only',
  version: '0.1.0',
  chainId: 11155111,
  entrypoint: '0xFD699481f0aA60e0014EEd79d16cbe4b954FfaEf',
  a2a: 'https://treasury-agent.workers.dev',
  x402: 'https://treasury-agent.workers.dev/pricing',
  erc8004: 'eip155:11155111:0x462c09195E468823845C60C12Ec9eB72d16C7584:1',
  safe: undefined,
  rolesModifier: undefined
};
```

**Discoverability Features:**
- ✅ **Human-readable names** - No hardcoded addresses to memorize
- ✅ **Standardized schema** - `agent:*` text record pattern
- ✅ **Cross-app compatibility** - Any app can resolve same records
- ✅ **Versioning support** - `agent:version` enables upgrades
- ✅ **Multi-chain ready** - `agent:chainId` specifies deployment

**Marcus Sees:**
```
┌─────────────────────────────────────────┐
│ Searching treasury.oikonomos.eth...    │
│ ✓ Resolved ENS records                 │
│ ✓ Found agent:type = treasury          │
│ ✓ Found agent:mode = intent-only       │
└─────────────────────────────────────────┘
```

---

### Step 2: ERC-8004 Identity Resolution

**User Action:** Dashboard automatically parses `agent:erc8004` record

**Technical Flow:**

```typescript
// Parse ERC-8004 record format: "eip155:chainId:registryAddress:agentId"
const erc8004Record = "eip155:11155111:0x462c09195E468823845C60C12Ec9eB72d16C7584:1";
const [standard, chainId, registryAddress, agentId] = erc8004Record.split(':');

// Connect to IdentityRegistry contract on Sepolia
const identityRegistry = getContract({
  address: registryAddress as Address,
  abi: IdentityRegistryABI,
  client: sepoliaClient
});

// Query agent data from ERC-8004 registry
const agentData = await identityRegistry.getAgent(BigInt(agentId));
// Returns:
// {
//   agentURI: "ipfs://QmXyZ123...",           // Points to agent metadata JSON
//   agentWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",  // Payment address
//   registeredAt: 1738172604n                // Registration timestamp
// }

// Fetch agent metadata from IPFS/ENS
const metadataResponse = await fetch(`https://ipfs.io/ipfs/${agentData.agentURI.replace('ipfs://', '')}`);
const metadata = await metadataResponse.json();
// Returns:
// {
//   "name": "Oikonomos Treasury Agent",
//   "ens": "treasury.oikonomos.eth",
//   "version": "0.1.0",
//   "capabilities": ["rebalance", "drift-detection", "policy-enforcement"],
//   "a2a": "https://treasury-agent.workers.dev",
//   "x402": "https://treasury-agent.workers.dev/pricing",
//   "supportedTokens": ["0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"],
//   "policyTemplates": [
//     {
//       "name": "stablecoin-rebalance",
//       "description": "Maintain target allocation across stablecoins",
//       "params": ["targetAllocations", "driftThreshold", "maxSlippage", "maxDaily"]
//     }
//   ]
// }

// Verify agentWallet matches declared payment address
const isValidWallet = metadata.paymentAddress?.toLowerCase() === agentData.agentWallet.toLowerCase();
```

**ERC-8004 Benefits:**
- ✅ **Portable identity** - Works across protocols, not locked to Oikonomos
- ✅ **On-chain verification** - Agent existence proven on-chain (ERC-721 NFT)
- ✅ **Payment integration** - `agentWallet` enables x402 payments
- ✅ **Metadata linking** - `agentURI` → Agent Record JSON
- ✅ **Ownership proof** - ERC-721 ownership = control over identity

**Marcus Sees:**
```
┌─────────────────────────────────────────┐
│ ERC-8004 Identity Verified              │
│ • Agent ID: #1                          │
│ • Registered: Jan 29, 2026             │
│ • Wallet: 0x742d...0bEb                 │
│ • Metadata: ipfs://QmXyZ...            │
└─────────────────────────────────────────┘
```

---

### Step 3: Reputation Display

**User Action:** Dashboard fetches trust score from ReputationRegistry (with indexer for receipts)

**Technical Flow:**

```typescript
// Parse ERC-8004 agentId from ENS record
const erc8004Record = agent.erc8004; // "eip155:11155111:0x462c...:1"
const [, , , agentIdStr] = erc8004Record.split(':');
const agentId = BigInt(agentIdStr); // → 1n

// PRIMARY: Query ReputationRegistry for on-chain reputation scores
const reputationRegistry = getContract({
  address: REPUTATION_REGISTRY_ADDRESS,
  abi: ReputationRegistryABI,
  client: publicClient
});

// Get execution quality summary (slippage performance)
const executionSummary = await reputationRegistry.getSummary(
  agentId,
  [userAddress],  // Required: client addresses (prevents Sybil)
  'execution',
  'slippage'
);
// Returns:
// {
//   count: 1247n,
//   summaryValue: 88n,        // Average slippage score (0-100, higher is better)
//   summaryValueDecimals: 0n
// }

// Get compliance summary
const complianceSummary = await reputationRegistry.getSummary(
  agentId,
  [userAddress],
  'compliance',
  'policy'
);
// Returns:
// {
//   count: 1247n,
//   summaryValue: 9950n,      // 99.5% compliance (basis points)
//   summaryValueDecimals: 0n
// }

// Calculate trust score from ReputationRegistry data
function calculateTrustScoreFromReputation(
  executionSummary: Summary,
  complianceSummary: Summary
): number {
  // Convert ReputationRegistry scores to trust score
  const slippageScore = (Number(executionSummary.summaryValue) / 100) * 35;
  const complianceScore = (Number(complianceSummary.summaryValue) / 10000) * 25;
  
  // Volume and count would need separate queries or use indexer metrics
  // For now, use execution count from summary
  const volumeScore = Math.min(25, Math.log10(Number(executionSummary.count) + 1) * 5);
  const countScore = Math.min(15, Math.log10(Number(executionSummary.count) + 1) * 3);
  
  return Math.round(slippageScore + complianceScore + volumeScore + countScore);
}

const trustScore = calculateTrustScoreFromReputation(executionSummary, complianceSummary);
// → 87/100

// FALLBACK: Query indexer for receipt history (fast queries)
const strategyId = keccak256(toBytes('treasury.oikonomos.eth'));
const receiptsResponse = await fetch(
  `${indexerUrl}/receipts/${strategyId}?limit=5`
);
const recentReceipts = await receiptsResponse.json();
```

**Reputation Features:**
- ✅ **On-chain verifiable** - Reputation stored in ReputationRegistry contract
- ✅ **Portable** - Any protocol can query ERC-8004 ReputationRegistry
- ✅ **Objective scoring** - Based on verifiable feedback from receipts
- ✅ **Historical transparency** - All receipts queryable via indexer
- ✅ **Real-time updates** - Reputation updates with each execution
- ✅ **Multi-metric** - Execution quality, compliance, volume, count
- ✅ **Standard compliance** - ERC-8004 standard interface

**Marcus Sees:**
```
┌─────────────────────────────────────────┐
│ treasury.oikonomos.eth                  │
│ Treasury Agent • v0.1.0                 │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Trust Score: 87/100 ████████░░      │ │
│ │ • 1,247 executions                  │ │
│ │ • 88/100 execution score            │ │
│ │ • 99.5% compliance rate              │ │
│ │ • On-chain verified ✅              │ │
│ │                                     │ │
│ │ ERC-8004: eip155:11155111:...:1    │ │
│ │ Reputation: Queryable by any app    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Recent Executions (from indexer):      │
│ • 12 bps slippage ✅ (2 min ago)        │
│ • 11 bps slippage ✅ (15 min ago)       │
│ • 13 bps slippage ✅ (1 hour ago)       │
└─────────────────────────────────────────┘
```

---

## Phase 2: Policy Configuration & Verification

### Step 4: Policy Setup

**User Action:** Marcus clicks "Configure Policy" → Sets target allocations

**Technical Flow:**

```typescript
// Marcus configures policy via dashboard UI
const policy: Policy = {
  targetAllocations: [
    {
      token: '0x0000000000000000000000000000000000000000',  // ETH (native)
      percentage: 40,
      symbol: 'ETH',
      decimals: 18
    },
    {
      token: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',  // USDC (Aave)
      percentage: 25,
      symbol: 'USDC',
      decimals: 6
    },
    {
      token: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',  // DAI (Aave)
      percentage: 15,
      symbol: 'DAI',
      decimals: 18
    },
    {
      token: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',  // USDC (Circle)
      percentage: 10,
      symbol: 'USDC2',
      decimals: 6
    },
    {
      token: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',  // UNI
      percentage: 5,
      symbol: 'UNI',
      decimals: 18
    },
    {
      token: '0x779877A7B0D9E8603169DdbD7836e478b4624789',  // LINK
      percentage: 5,
      symbol: 'LINK',
      decimals: 18
    }
  ],
  driftThresholds: {
    ETH: 7,           // 7% drift triggers rebalance for ETH
    stablecoins: 5,   // 5% combined stablecoin drift
    altcoins: 10      // 10% for volatile assets (UNI, LINK)
  },
  maxSlippageBps: 50,        // Maximum 50 basis points slippage (0.5%)
  maxDaily: 20000,           // Maximum $20K per day
  trigger: 'drift',          // Trigger type: 'drift' | 'periodic' | 'threshold'
  allowedTokens: [           // Token allowlist (all Sepolia v4 tradeable)
    '0x0000000000000000000000000000000000000000',  // ETH
    '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',  // USDC (Aave)
    '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',  // DAI (Aave)
    '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',  // USDC (Circle)
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',  // UNI
    '0x779877A7B0D9E8603169DdbD7836e478b4624789'   // LINK
  ]
};

// Dashboard validates policy
const validation = validatePolicy(policy);
// Checks:
// - Allocations sum to 100%
// - All tokens are valid addresses
// - Thresholds are reasonable
// - No conflicting constraints

if (!validation.valid) {
  throw new Error(`Policy validation failed: ${validation.errors.join(', ')}`);
}

// User signs policy configuration (EIP-712)
const policySignature = await wallet.signTypedData({
  domain: {
    name: 'Oikonomos Treasury Agent',
    version: '1',
    chainId: 11155111,
    verifyingContract: treasuryAgentAddress
  },
  types: {
    Policy: [
      { name: 'user', type: 'address' },
      { name: 'targetAllocations', type: 'TokenAllocation[]' },
      { name: 'driftThreshold', type: 'uint256' },
      { name: 'maxSlippageBps', type: 'uint256' },
      { name: 'maxDaily', type: 'uint256' },
      { name: 'nonce', type: 'uint256' }
    ],
    TokenAllocation: [
      { name: 'token', type: 'address' },
      { name: 'percentage', type: 'uint256' }
    ]
  },
  primaryType: 'Policy',
  message: {
    user: marcus.address,
    targetAllocations: policy.targetAllocations,
    driftThreshold: policy.driftThreshold,
    maxSlippageBps: policy.maxSlippageBps,
    maxDaily: policy.maxDaily,
    nonce: 0n
  }
});

// Dashboard calls treasury-agent /configure endpoint
const configureResponse = await fetch('https://treasury-agent.workers.dev/configure', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userAddress: marcus.address,
    policy: policy,
    signature: policySignature
  })
});

const configureResult = await configureResponse.json();
// Returns:
// {
//   success: true,
//   policyId: "0xabc123...",  // Hash of policy for verification
//   expiresAt: 1738259004     // Policy expiration timestamp
// }
```

**Verification Features:**
- ✅ **Policy validation** - Constraints checked before storage
- ✅ **User signature** - EIP-712 signature proves consent
- ✅ **Human-readable** - Policy displayed in plain language
- ✅ **Auditable** - Policy hash stored for verification
- ✅ **Revocable** - User can update/revoke anytime

**Marcus Sees:**
```
┌─────────────────────────────────────────┐
│ Policy Configuration                     │
│                                         │
│ Target Allocations:                     │
│ • USDC: 70%                             │
│ • USDT: 20%                             │
│ • DAI: 10%                              │
│                                         │
│ Constraints:                            │
│ • Drift threshold: 5%                   │
│ • Max slippage: 25 bps                  │
│ • Max daily: $20,000                    │
│                                         │
│ ✓ Policy validated                      │
│ ✓ Signature required                    │
└─────────────────────────────────────────┘
```

---

### Step 5: Intent Authorization

**User Action:** Marcus signs EIP-712 intent with embedded constraints

**Technical Flow:**

```typescript
// SDK builds intent structure
import { buildIntent } from '@oikonomos/sdk';

const intent = buildIntent({
  user: marcus.address,
  tokenIn: usdtAddress,  // Will be determined at execution time
  tokenOut: usdcAddress, // Will be determined at execution time
  amountIn: 0n,          // Will be calculated based on drift
  maxSlippageBps: 25,    // From policy
  ttlSeconds: 3600,       // 1 hour validity window
  strategyEns: 'treasury.oikonomos.eth',
  nonce: 0n
});

// Intent structure:
// {
//   user: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
//   tokenIn: "0x...",  // USDT
//   tokenOut: "0x...", // USDC
//   amountIn: 5000000000n,  // $5K USDT (6 decimals)
//   maxSlippage: 25n,       // 25 basis points
//   deadline: 1738176204n,  // Current time + 1 hour
//   strategyId: keccak256("treasury.oikonomos.eth"),
//   nonce: 0n
// }

// Marcus signs intent with wallet (EIP-712)
const signature = await wallet.signTypedData({
  domain: {
    name: 'OikonomosIntentRouter',
    version: '1',
    chainId: 11155111,
    verifyingContract: intentRouterAddress  // 0xFD699481f0aA60e0014EEd79d16cbe4b954FfaEf
  },
  types: {
    Intent: [
      { name: 'user', type: 'address' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'maxSlippage', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'strategyId', type: 'bytes32' },
      { name: 'nonce', type: 'uint256' }
    ]
  },
  primaryType: 'Intent',
  message: {
    user: intent.user,
    tokenIn: intent.tokenIn,
    tokenOut: intent.tokenOut,
    amountIn: intent.amountIn,
    maxSlippage: BigInt(intent.maxSlippageBps),
    deadline: intent.deadline,
    strategyId: intent.strategyId,
    nonce: intent.nonce
  }
});
// → "0x1234567890abcdef..."

// Verify signature before storing
const isValid = await verifyIntentSignature(intent, signature, intentRouterAddress);
// ✅ Signature valid

// Store signed intent (off-chain, can be IPFS-hashed)
const intentHash = keccak256(abi.encode(['tuple(address,address,address,uint256,uint256,uint256,bytes32,uint256)'], [intent]));
```

**Verification Features:**
- ✅ **Structured signatures** - EIP-712, not blank checks
- ✅ **Constraints encoded** - Slippage, deadline, amounts in signature
- ✅ **Nonce protection** - Prevents replay attacks
- ✅ **User control** - Can revoke by incrementing nonce
- ✅ **Time-bound** - Deadline prevents stale intents

**Marcus Sees:**
```
┌─────────────────────────────────────────┐
│ Sign Intent Authorization               │
│                                         │
│ You are authorizing:                    │
│ • Agent: treasury.oikonomos.eth        │
│ • Max slippage: 25 bps                  │
│ • Valid for: 1 hour                    │
│ • Nonce: 0                              │
│                                         │
│ This is NOT a blank check.             │
│ Constraints are enforced on-chain.     │
│                                         │
│ [Sign with Wallet]                      │
└─────────────────────────────────────────┘
```

---

## Phase 3: Automated Execution & Receipt Generation

### Step 6: Drift Detection

**User Action:** Agent automatically detects portfolio drift (scheduled check)

**Technical Flow:**

```typescript
// Treasury agent scheduled check (Cloudflare Cron: every hour)
// OR manual trigger via /check-triggers endpoint

async function checkDrift(env: Env, userAddress: Address, policy: Policy): Promise<DriftResult> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL)
  });

  // Fetch current token balances
  const balances = await Promise.all(
    policy.targetAllocations.map(async (target) => {
      const balance = await client.readContract({
        address: target.token,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [userAddress]
      });
      
      // Get token price (simplified - would use oracle in production)
      const priceUsd = await getTokenPrice(target.token);
      const valueUsd = Number(balance) / 10**target.decimals * priceUsd;
      
      return {
        token: target.token,
        symbol: target.symbol,
        balance: balance,
        valueUsd: valueUsd,
        decimals: target.decimals
      };
    })
  );

  // Calculate total portfolio value
  const totalValueUsd = balances.reduce((sum, b) => sum + b.valueUsd, 0);
  // → $100,000

  // Calculate current percentages
  const currentAllocations = balances.map(b => ({
    token: b.token,
    symbol: b.symbol,
    balance: b.balance,
    percentage: (b.valueUsd / totalValueUsd) * 100,
    targetPercentage: policy.targetAllocations.find(t => t.token === b.token)!.percentage
  }));
  // Current: USDC 55%, USDT 30%, DAI 15%
  // Target:  USDC 70%, USDT 20%, DAI 10%

  // Detect drift
  const drifts: DriftItem[] = [];
  for (const alloc of currentAllocations) {
    const drift = Math.abs(alloc.percentage - alloc.targetPercentage);
    // USDC: |55 - 70| = 15% drift (exceeds 5% threshold)
    // USDT: |30 - 20| = 10% drift (exceeds 5% threshold)
    // DAI:  |15 - 10| = 5% drift (at threshold)
    
    if (drift > policy.driftThreshold) {
      const excessAmount = alloc.balance - (totalValueUsd * alloc.targetPercentage / 100);
      
      drifts.push({
        token: alloc.token,
        symbol: alloc.symbol,
        currentPercentage: alloc.percentage,
        targetPercentage: alloc.targetPercentage,
        drift: drift,
        action: alloc.percentage > alloc.targetPercentage ? 'sell' : 'buy',
        amount: excessAmount > 0n ? excessAmount : -excessAmount
      });
    }
  }

  return {
    hasDrift: drifts.length > 0,
    drifts: drifts,
    allocations: currentAllocations,
    totalValueWei: BigInt(Math.floor(totalValueUsd * 1e6))
  };
}

// Agent detects drift
const driftResult = await checkDrift(env, marcus.address, policy);
// Returns:
// {
//   hasDrift: true,
//   drifts: [
//     {
//       token: usdtAddress,
//       symbol: 'USDT',
//       currentPercentage: 30,
//       targetPercentage: 20,
//       drift: 10,
//       action: 'sell',
//       amount: 10000000000n  // $10K USDT excess
//     },
//     {
//       token: usdcAddress,
//       symbol: 'USDC',
//       currentPercentage: 55,
//       targetPercentage: 70,
//       drift: 15,
//       action: 'buy',
//       amount: 15000000000n  // $15K USDC deficit
//     }
//   ],
//   allocations: [...],
//   totalValueWei: 100000000000000n
// }

// Agent requests quote from strategy-agent
const quoteResponse = await fetch('https://strategy-agent.workers.dev/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenIn: usdtAddress,
    tokenOut: usdcAddress,
    amountIn: '5000000000',  // $5K USDT (start with partial rebalance)
    maxSlippageBps: 25
  })
});

const quote = await quoteResponse.json();
// Returns:
// {
//   quoteId: "0xabc123def456...",        // Unique quote identifier
//   tokenIn: "0x...",                    // USDT
//   tokenOut: "0x...",                   // USDC
//   amountIn: "5000000000",              // $5K USDT
//   expectedAmountOut: "4987500000",     // Expected USDC (12.5 bps slippage)
//   estimatedSlippageBps: 12,            // Estimated 12 bps
//   route: [
//     {
//       pool: "0x...-0x...-100",         // Pool identifier
//       tokenIn: "0x...",                // USDT
//       tokenOut: "0x...",               // USDC
//       fee: 100                         // 0.01% fee tier
//     }
//   ],
//   hookData: "0x...",                   // Encoded for ReceiptHook
//   expiresAt: 1738172704                // Quote expiration
// }
```

**Verification Features:**
- ✅ **Transparent detection** - Drift calculation is deterministic
- ✅ **Quote attribution** - `quoteId` links quote to execution
- ✅ **Slippage disclosure** - Expected slippage shown upfront
- ✅ **Route transparency** - Which pools will be used

**Marcus Sees (Optional Notification):**
```
┌─────────────────────────────────────────┐
│ Rebalance Triggered                     │
│                                         │
│ Detected drift:                         │
│ • USDC: 55% → 70% (15% drift)          │
│ • USDT: 30% → 20% (10% drift)          │
│                                         │
│ Executing: $5K USDT → USDC             │
│ Expected slippage: 12 bps              │
│                                         │
│ [View Details]                          │
└─────────────────────────────────────────┘
```

---

### Step 7: Uniswap V4 Execution

**User Action:** Agent executes swap via IntentRouter (automated)

**Technical Flow:**

```solidity
// IntentRouter contract validates and executes

contract IntentRouter {
    function executeIntent(
        Intent calldata intent,
        bytes calldata signature,
        PoolKey calldata poolKey,
        bytes calldata strategyData
    ) external returns (int256 amountOut) {
        // 1. Verify signature (EIP-712)
        bytes32 intentHash = keccak256(abi.encode(
            INTENT_TYPEHASH,
            intent.user,
            intent.tokenIn,
            intent.tokenOut,
            intent.amountIn,
            intent.maxSlippage,
            intent.deadline,
            intent.strategyId,
            intent.nonce
        ));
        bytes32 digest = _hashTypedDataV4(intentHash);
        address signer = digest.recover(signature);
        
        require(signer == intent.user, "Invalid signature");
        
        // 2. Check deadline
        require(block.timestamp <= intent.deadline, "Intent expired");
        
        // 3. Check nonce (prevent replay)
        require(!executedIntents[intentHash], "Intent already executed");
        executedIntents[intentHash] = true;
        
        // 4. Increment user nonce
        nonces[intent.user]++;
        
        // 5. Transfer tokens from user
        IERC20(intent.tokenIn).safeTransferFrom(
            intent.user,
            address(this),
            intent.amountIn
        );
        
        // 6. Approve PoolManager
        IERC20(intent.tokenIn).safeApprove(address(poolManager), intent.amountIn);
        
        // 7. Build hookData for ReceiptHook
        bytes memory hookData = abi.encode(
            intent.strategyId,              // Links to ENS name
            keccak256(strategyData),        // quoteId from strategy-agent
            intent.maxSlippage              // Slippage cap for verification
        );
        
        // 8. Execute swap on Uniswap V4
        IPoolManager.SwapParams memory swapParams = IPoolManager.SwapParams({
            zeroForOne: intent.tokenIn < intent.tokenOut,
            amountSpecified: int256(intent.amountIn),
            sqrtPriceLimitX96: 0  // No price limit
        });
        
        BalanceDelta delta = poolManager.swap(poolKey, swapParams, hookData);
        
        // 9. Transfer output to user
        if (delta.amount1() > 0) {
            IERC20(intent.tokenOut).safeTransfer(intent.user, uint256(delta.amount1()));
        }
        
        emit IntentExecuted(intentHash, intent.user, intent.strategyId, intent.amountIn, uint256(delta.amount1()));
        
        return delta.amount1();
    }
}

// Execution flow:
// 1. IntentRouter.executeIntent() called by treasury-agent
// 2. Signature verified ✅
// 3. Deadline checked ✅ (not expired)
// 4. Nonce checked ✅ (not used)
// 5. Tokens transferred from Marcus ✅
// 6. PoolManager.swap() called with hookData
// 7. ReceiptHook.afterSwap() called automatically by PoolManager
```

**Uniswap V4 Features:**
- ✅ **Hook-enabled pool** - ReceiptHook registered at pool creation
- ✅ **HookData passing** - `strategyId` and `quoteId` encoded in hookData
- ✅ **Automatic receipt** - ReceiptHook called by PoolManager
- ✅ **Gas efficient** - Single transaction for swap + receipt

---

### Step 8: Receipt Emission

**User Action:** ReceiptHook automatically emits ExecutionReceipt event

**Technical Flow:**

```solidity
// ReceiptHook contract (Uniswap v4 hook)

contract ReceiptHook is IHooks {
    IPoolManager public immutable poolManager;
    
    event ExecutionReceipt(
        bytes32 indexed strategyId,
        bytes32 indexed quoteId,
        address indexed sender,
        int128 amount0,
        int128 amount1,
        uint256 actualSlippage,
        bool policyCompliant,
        uint256 timestamp
    );
    
    function afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4, int128) {
        // Decode hookData
        (bytes32 strategyId, bytes32 quoteId, uint256 maxSlippage) = 
            abi.decode(hookData, (bytes32, bytes32, uint256));
        
        // Calculate actual slippage
        // amount0 = input (negative), amount1 = output (positive)
        int128 inputAmount = delta.amount0() < 0 ? -delta.amount0() : delta.amount0();
        int128 outputAmount = delta.amount1() > 0 ? delta.amount1() : -delta.amount1();
        
        // Get expected output from quote (would need to store or recalculate)
        // For simplicity, calculate slippage from price impact
        uint256 expectedOutput = calculateExpectedOutput(inputAmount, key);
        uint256 actualSlippage = calculateSlippage(expectedOutput, outputAmount);
        // → 12 basis points
        
        // Verify policy compliance
        bool compliant = actualSlippage <= maxSlippage;
        // → true (12 bps <= 25 bps)
        
        // Emit receipt
        emit ExecutionReceipt(
            strategyId: keccak256("treasury.oikonomos.eth"),
            quoteId: 0xabc123def456...,              // From strategy-agent quote
            sender: marcus.address,
            amount0: -5000000000,                    // -$5K USDT (input)
            amount1: 4988000000,                     // +$4,988 USDC (output)
            actualSlippage: 12,                      // 12 basis points
            policyCompliant: true,                   // ✅ Under 25 bps cap
            timestamp: block.timestamp
        );
        
        return (BaseHook.afterSwap.selector, 0);
    }
    
    function calculateSlippage(
        uint256 expectedOutput,
        int128 actualOutput
    ) internal pure returns (uint256) {
        if (actualOutput < 0) return type(uint256).max; // Error case
        
        uint256 actual = uint256(uint128(actualOutput));
        if (actual >= expectedOutput) return 0; // Better than expected
        
        uint256 slippageAmount = expectedOutput - actual;
        // Convert to basis points: (slippage / expected) * 10000
        return (slippageAmount * 10000) / expectedOutput;
    }
}

// Event emitted on-chain:
// ExecutionReceipt(
//     strategyId: 0x8f3a4b2c1d9e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b,
//     quoteId: 0xabc123def456...,
//     sender: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,
//     amount0: -5000000000,
//     amount1: 4988000000,
//     actualSlippage: 12,
//     policyCompliant: true,
//     timestamp: 1738172604
// )
```

**Verification Features:**
- ✅ **On-chain proof** - Event stored permanently on blockchain
- ✅ **Strategy attribution** - `strategyId` links to ENS name
- ✅ **Quote binding** - `quoteId` links quote to execution
- ✅ **Slippage measurement** - Objectively measured on-chain
- ✅ **Policy compliance** - Cryptographically verified
- ✅ **Immutable record** - Cannot be altered or deleted

**Transaction Details:**
```
Transaction: 0x789abcdef123...
Block: 5,234,567
From: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb (Marcus)
To: 0xFD699481f0aA60e0014EEd79d16cbe4b954FfaEf (IntentRouter)

Events:
1. Transfer (USDT): Marcus → IntentRouter ($5K)
2. Swap (Uniswap V4): USDT → USDC
3. ExecutionReceipt: strategyId, quoteId, slippage, compliance
4. Transfer (USDC): IntentRouter → Marcus ($4,988)
```

---

## Phase 4: Receipt Indexing & Reputation Update

### Step 9: Dual Indexing: Receipts + Reputation

**User Action:** Indexer automatically catches ExecutionReceipt event and processes it for both systems

**Technical Flow:**

```typescript
// Ponder indexer handler (packages/indexer/src/index.ts)

ponder.on('ReceiptHook:ExecutionReceipt', async ({ event, context }) => {
  const receiptId = `${event.transaction.hash}-${event.log.logIndex}`;
  
  // ============================================
  // PART 1: Store Receipt in Indexer (for querying)
  // ============================================
  
  await context.db.insert(executionReceipt).values({
    id: receiptId,
    strategyId: event.args.strategyId,        // Links to ENS name
    quoteId: event.args.quoteId,              // Links to quote
    sender: event.args.sender,                // Marcus's address
    amount0: event.args.amount0,              // -5000000000 (input)
    amount1: event.args.amount1,              // 4988000000 (output)
    actualSlippage: event.args.actualSlippage, // 12 bps
    policyCompliant: event.args.policyCompliant, // true
    timestamp: event.args.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash
  });
  
  // Update strategy metrics in indexer (for fast queries)
  const strategyIdKey = event.args.strategyId;
  const volume = event.args.amount0 > 0n 
    ? event.args.amount0 
    : -event.args.amount0;  // Absolute value
  
  await context.db
    .insert(strategyMetrics)
    .values({
      id: strategyIdKey,
      totalExecutions: 1n,
      totalVolume: volume,
      avgSlippage: event.args.actualSlippage,
      successRate: 10000n,
      complianceRate: event.args.policyCompliant ? 10000n : 0n,
      lastExecutionAt: event.args.timestamp,
    })
    .onConflictDoUpdate((existing) => ({
      totalExecutions: existing.totalExecutions + 1n,
      totalVolume: existing.totalVolume + volume,
      avgSlippage: (existing.avgSlippage * existing.totalExecutions + event.args.actualSlippage) / (existing.totalExecutions + 1n),
      complianceRate: (existing.complianceRate * existing.totalExecutions + (event.args.policyCompliant ? 10000n : 0n)) / (existing.totalExecutions + 1n),
      lastExecutionAt: event.args.timestamp,
    }));
  
  // ============================================
  // PART 2: Submit Feedback to ReputationRegistry (for on-chain reputation)
  // ============================================
  
  // Resolve strategyId → ENS name → agentId
  const ensName = await resolveStrategyIdToEns(event.args.strategyId);
  if (!ensName) {
    console.warn(`Could not resolve strategyId ${event.args.strategyId} to ENS name`);
    return; // Skip reputation submission if can't resolve
  }
  
  // Get ERC-8004 agentId from ENS record
  const erc8004Record = await client.getEnsText({
    name: ensName,
    key: 'agent:erc8004'
  });
  
  if (!erc8004Record) {
    console.warn(`No ERC-8004 record found for ${ensName}`);
    return; // Skip if agent not registered with ERC-8004
  }
  
  const agentId = BigInt(erc8004Record.split(':')[3]);
  
  // Calculate slippage score (0-100, higher is better)
  // 0 bps = 100 points, 25 bps = 0 points (linear scale)
  const slippageScore = Math.max(0, 100 - (Number(event.args.actualSlippage) * 4));
  // → 12 bps = 100 - (12 * 4) = 52 points
  
  // Submit execution quality feedback to ReputationRegistry
  const reputationRegistry = getContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    client: walletClient  // Indexer's wallet (authorized submitter)
  });
  
  // Submit slippage feedback
  await reputationRegistry.giveFeedback(
    agentId,
    BigInt(slippageScore),  // 52 (for 12 bps slippage)
    0,                       // decimals: 0 (integer score)
    'execution',            // tag1
    'slippage',             // tag2
    '',                      // endpoint (optional)
    `ipfs://${receiptCid}`, // feedbackURI (optional - receipt IPFS hash)
    receiptHash              // feedbackHash (optional)
  );
  
  // Submit compliance feedback
  await reputationRegistry.giveFeedback(
    agentId,
    event.args.policyCompliant ? 100n : 0n,  // Binary pass/fail
    0,                                        // decimals: 0
    'compliance',                             // tag1
    'policy',                                 // tag2
    '',                                       // endpoint
    `ipfs://${receiptCid}`,                  // feedbackURI
    receiptHash                               // feedbackHash
  );
  
  // ReputationRegistry now has:
  // - execution/slippage: 52 (for this execution)
  // - compliance/policy: 100 (passed)
  // Running averages computed automatically via getSummary()
});

// Indexer API endpoints (packages/indexer/src/api/index.ts)

// Get receipts for a strategy
app.get('/receipts/:strategyId', async (c) => {
  const strategyId = c.req.param('strategyId') as `0x${string}`;
  
  const receipts = await db
    .select()
    .from(executionReceipt)
    .where(eq(executionReceipt.strategyId, strategyId))
    .orderBy(desc(executionReceipt.timestamp))
    .limit(100);
  
  return c.json(receipts);
});

// Get receipts for a user
app.get('/receipts/user/:sender', async (c) => {
  const sender = c.req.param('sender') as `0x${string}`;
  
  const receipts = await db
    .select()
    .from(executionReceipt)
    .where(eq(executionReceipt.sender, sender))
    .orderBy(desc(executionReceipt.timestamp))
    .limit(100);
  
  return c.json(receipts);
});

// Get strategy metrics
app.get('/strategies/:strategyId', async (c) => {
  const strategyId = c.req.param('strategyId') as `0x${string}`;
  
  const [metrics] = await db
    .select()
    .from(strategyMetrics)
    .where(eq(strategyMetrics.id, strategyId))
    .limit(1);
  
  if (!metrics) {
    return c.json({ error: 'Strategy not found' }, 404);
  }
  
  return c.json(metrics);
});
```

**Dual System Features:**

**Indexer (Receipt Storage):**
- ✅ **Automatic indexing** - Every receipt stored automatically
- ✅ **Fast queries** - Receipts accessible via REST API (no gas)
- ✅ **Running averages** - Metrics computed for fast display
- ✅ **User history** - All user receipts queryable
- ✅ **Strategy history** - All strategy receipts queryable
- ✅ **Complex filtering** - SQL queries, pagination, sorting

**ReputationRegistry (On-Chain Reputation):**
- ✅ **On-chain storage** - Reputation stored on blockchain
- ✅ **Automatic feedback** - Indexer submits feedback after each receipt
- ✅ **Portable** - Any protocol can query ReputationRegistry
- ✅ **Verifiable** - On-chain proof of reputation
- ✅ **Standard interface** - ERC-8004 compliant
- ✅ **Running summaries** - getSummary() computes averages on-demand

---

### Step 10: Receipt Verification

**User Action:** Marcus views execution receipt on dashboard

**Technical Flow:**

```typescript
// Dashboard fetches receipts from indexer (fast, no gas)
const receiptsResponse = await fetch(
  `${indexerUrl}/receipts/user/${marcus.address}?limit=10`
);
const receipts = await receiptsResponse.json();
// Returns array of ExecutionReceipt objects from indexer database:
// [
//   {
//     id: "0x789...-0",
//     strategyId: "0x8f3a4b2c...",
//     quoteId: "0xabc123...",
//     sender: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
//     amount0: -5000000000n,
//     amount1: 4988000000n,
//     actualSlippage: 12n,
//     policyCompliant: true,
//     timestamp: 1738172604n,
//     blockNumber: 5234567n,
//     transactionHash: "0x789abcdef123..."
//   },
//   ...
// ]

// For each receipt, verify on-chain (optional verification)
async function verifyReceipt(receipt: ExecutionReceipt): Promise<boolean> {
  // Query on-chain event logs to verify receipt exists
  const logs = await publicClient.getLogs({
    address: receiptHookAddress,
    event: {
      type: 'event',
      name: 'ExecutionReceipt',
      inputs: [
        { name: 'strategyId', type: 'bytes32', indexed: true },
        { name: 'quoteId', type: 'bytes32', indexed: true },
        { name: 'sender', type: 'address', indexed: true },
        { name: 'amount0', type: 'int128' },
        { name: 'amount1', type: 'int128' },
        { name: 'actualSlippage', type: 'uint256' },
        { name: 'policyCompliant', type: 'bool' },
        { name: 'timestamp', type: 'uint256' }
      ]
    },
    args: {
      strategyId: receipt.strategyId,
      quoteId: receipt.quoteId,
      sender: receipt.sender
    },
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber
  });
  
  // Verify receipt exists on-chain
  return logs.length > 0;
}

// Verify all receipts (optional - indexer data is trusted)
const verifiedReceipts = await Promise.all(
  receipts.map(async (receipt) => ({
    ...receipt,
    verified: await verifyReceipt(receipt)  // On-chain verification
  }))
);

// Resolve strategyId to ENS name (for display)
const strategyEnsName = await resolveStrategyIdToEns(receipt.strategyId);
// → "treasury.oikonomos.eth"

// Also check if feedback was submitted to ReputationRegistry
const erc8004Record = await client.getEnsText({
  name: strategyEnsName,
  key: 'agent:erc8004'
});
if (erc8004Record) {
  const agentId = BigInt(erc8004Record.split(':')[3]);
  // Query ReputationRegistry to see if this receipt's feedback exists
  // (This would require storing receipt hash in feedback metadata)
}

// Display receipt
<ReceiptCard>
  <ReceiptHeader>
    <h3>Execution Receipt</h3>
    <Badge variant={receipt.policyCompliant ? 'success' : 'error'}>
      {receipt.policyCompliant ? 'Compliant' : 'Violation'}
    </Badge>
  </ReceiptHeader>
  
  <ReceiptBody>
    <ReceiptRow>
      <Label>Strategy</Label>
      <Value>{strategyEnsName}</Value>
    </ReceiptRow>
    
    <ReceiptRow>
      <Label>Quote ID</Label>
      <Value className="font-mono text-xs">{receipt.quoteId}</Value>
    </ReceiptRow>
    
    <ReceiptRow>
      <Label>Input</Label>
      <Value>-{formatAmount(receipt.amount0)} USDT</Value>
    </ReceiptRow>
    
    <ReceiptRow>
      <Label>Output</Label>
      <Value>+{formatAmount(receipt.amount1)} USDC</Value>
    </ReceiptRow>
    
    <ReceiptRow>
      <Label>Slippage</Label>
      <Value className={receipt.actualSlippage <= 25 ? 'text-success' : 'text-danger'}>
        {receipt.actualSlippage} bps
        {receipt.actualSlippage <= 25 && ' ✅'}
      </Value>
    </ReceiptRow>
    
    <ReceiptRow>
      <Label>Policy Compliant</Label>
      <Value>{receipt.policyCompliant ? 'Yes ✅' : 'No ❌'}</Value>
    </ReceiptRow>
    
    <ReceiptRow>
      <Label>Transaction</Label>
      <Value>
        <a 
          href={`https://sepolia.etherscan.io/tx/${receipt.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Etherscan →
        </a>
      </Value>
    </ReceiptRow>
    
    <ReceiptRow>
      <Label>Verified</Label>
      <Value>{receipt.verified ? '✅ On-chain verified' : '⏳ Pending'}</Value>
    </ReceiptRow>
  </ReceiptBody>
</ReceiptCard>
```

**Verification Features:**

**Receipt Verification (Indexer):**
- ✅ **Fast queries** - Indexer API provides quick access to receipt history
- ✅ **On-chain verification** - Can verify any receipt on-chain via event logs
- ✅ **Etherscan links** - Direct links to transaction details
- ✅ **Human-readable** - Receipts displayed in plain language
- ✅ **Policy compliance** - Clear indication of compliance status

**Reputation Verification (ReputationRegistry):**
- ✅ **On-chain scores** - Reputation stored on blockchain
- ✅ **Portable verification** - Any app can verify reputation independently
- ✅ **Feedback traceability** - Each feedback links to receipt (via IPFS URI)
- ✅ **Standard interface** - ERC-8004 compliant queries

**Marcus Sees:**
```
┌─────────────────────────────────────────┐
│ Execution Receipt                       │
│ ✅ Policy Compliant                     │
│                                         │
│ Strategy: treasury.oikonomos.eth        │
│ Quote ID: 0xabc123...                   │
│                                         │
│ Input:  -$5,000.00 USDT                │
│ Output: +$4,988.00 USDC                │
│                                         │
│ Slippage: 12 bps ✅ (under 25 bps cap) │
│ Policy Compliant: Yes ✅                │
│                                         │
│ Transaction: 0x789...                   │
│ [View on Etherscan →]                   │
│                                         │
│ ✅ Verified on-chain                    │
└─────────────────────────────────────────┘
```

---

## Phase 5: Ongoing Trust & Reputation

### Step 11: Reputation Accumulation (Dual System)

**User Action:** System updates trust score over time (automatic in both systems)

**Technical Flow:**

```typescript
// After multiple executions, both systems update automatically

// ============================================
// INDEXER: Fast metrics for display
// ============================================

// Before Marcus's execution:
const indexerMetricsBefore = {
  totalExecutions: 1247n,
  totalVolume: 5000000000000n,  // $5M
  avgSlippage: 12n,              // 12 bps
  complianceRate: 9950n,          // 99.5%
  successRate: 10000n            // 100%
};

// After Marcus's execution:
const indexerMetricsAfter = {
  totalExecutions: 1248n,        // +1
  totalVolume: 5005000000000n,   // +$5K
  avgSlippage: 12n,              // Still 12 bps (excellent)
  complianceRate: 9950n,         // 99.5% (1,247/1,248 compliant)
  successRate: 10000n            // 100% success
};

// ============================================
// REPUTATIONREGISTRY: On-chain reputation
// ============================================

// Query ReputationRegistry for on-chain scores
const agentId = 1n; // From ERC-8004 record

// Get execution quality summary (aggregates all feedback)
const executionSummary = await reputationRegistry.getSummary(
  agentId,
  [userAddress],  // Required: client addresses
  'execution',
  'slippage'
);
// Returns:
// {
//   count: 1248n,              // Total feedback entries
//   summaryValue: 88n,         // Average slippage score (0-100)
//   summaryValueDecimals: 0n
// }

// Get compliance summary
const complianceSummary = await reputationRegistry.getSummary(
  agentId,
  [userAddress],
  'compliance',
  'policy'
);
// Returns:
// {
//   count: 1248n,
//   summaryValue: 9950n,       // 99.5% compliance (basis points)
//   summaryValueDecimals: 0n
// }

// Calculate trust score from ReputationRegistry data
function calculateTrustScoreFromReputation(
  executionSummary: Summary,
  complianceSummary: Summary
): number {
  // Convert ReputationRegistry scores to trust score
  const slippageScore = (Number(executionSummary.summaryValue) / 100) * 35;
  // → (88/100) * 35 = 30.8 points
  
  const complianceScore = (Number(complianceSummary.summaryValue) / 10000) * 25;
  // → (9950/10000) * 25 = 24.875 points
  
  // Volume and count from execution count
  const volumeScore = Math.min(25, Math.log10(Number(executionSummary.count) + 1) * 5);
  // → log10(1248 + 1) * 5 ≈ 18.5 points
  
  const countScore = Math.min(15, Math.log10(Number(executionSummary.count) + 1) * 3);
  // → log10(1248 + 1) * 3 ≈ 10.2 points
  
  return Math.round(slippageScore + complianceScore + volumeScore + countScore);
  // → 30.8 + 24.875 + 18.5 + 10.2 = 84.375 → 84/100
}

const onChainTrustScore = calculateTrustScoreFromReputation(executionSummary, complianceSummary);
// → 84/100 (from ReputationRegistry)

// Dashboard shows updated reputation from both sources
<TrustScore>
  Trust Score: 84/100 ████████░░ (On-chain)
  
  ReputationRegistry (ERC-8004):
  • 1,248 feedback entries
  • 88/100 execution score
  • 99.5% compliance rate
  • Portable across protocols ✅
  
  Indexer Metrics (Fast Queries):
  • 1,248 executions
  • $5.005M total volume
  • 12 bps avg slippage
  
  Last updated: 2 minutes ago
  
  ERC-8004: eip155:11155111:0x462c...:1
</TrustScore>
```

**Dual System Reputation Features:**

**Indexer (Fast Metrics):**
- ✅ **Fast queries** - Metrics computed for quick display
- ✅ **Historical data** - Full execution history
- ✅ **Complex analytics** - SQL queries, aggregations

**ReputationRegistry (On-Chain Reputation):**
- ✅ **On-chain verifiable** - Reputation stored on blockchain
- ✅ **Portable** - Any protocol can query independently
- ✅ **Objective scoring** - Based on verifiable feedback
- ✅ **Transparent** - All feedback entries queryable
- ✅ **Real-time updates** - Reputation updates with each feedback submission
- ✅ **Historical tracking** - Can query feedback history
- ✅ **Standard compliance** - ERC-8004 interface

---

## Key Trust & Verification Mechanisms

### 1. Discoverability (ENS)

**How it works:**
- Human-readable ENS names (`treasury.oikonomos.eth`)
- Standardized text record schema (`agent:*`)
- Cross-protocol compatibility
- Versioning support

**Trust benefits:**
- ✅ No hardcoded addresses to memorize
- ✅ Easy to share and verify
- ✅ Works across any app that supports ENS
- ✅ Can update endpoints without changing name

**Example:**
```
User searches: treasury.oikonomos.eth
↓
ENS resolves: agent:type, agent:entrypoint, agent:erc8004, etc.
↓
Dashboard displays: Agent info, trust score, capabilities
```

---

### 2. Reputation (ERC-8004 ReputationRegistry + Indexer)

**How it works:**
- ERC-8004 provides on-chain identity (ERC-721 NFT)
- Receipts provide verifiable execution history
- **Indexer** stores receipts and computes fast metrics
- **ReputationRegistry** accumulates on-chain feedback from receipts
- Trust score calculated from ReputationRegistry summaries

**Trust benefits:**
- ✅ Portable identity across protocols (ERC-8004)
- ✅ Verifiable execution history (ReceiptHook events)
- ✅ On-chain reputation (ReputationRegistry)
- ✅ Fast queries (Indexer)
- ✅ Objective metrics (no subjective ratings)
- ✅ Reputation builds automatically in both systems

**Example:**
```
ERC-8004 Identity: agentId #1
↓
Receipts reference: strategyId (derived from ENS)
↓
Indexer: Stores receipts, computes fast metrics
ReputationRegistry: Accumulates feedback, provides on-chain scores
↓
Trust score calculated: 84/100 (from ReputationRegistry)
Receipt history: Queryable via Indexer
```

---

### 3. Verification (ReceiptHook + Dual Storage)

**How it works:**
- ReceiptHook emits ExecutionReceipt on every swap
- Receipts include strategyId, quoteId, slippage, compliance
- **Indexer** stores receipts for fast querying
- **ReputationRegistry** receives feedback for on-chain reputation
- Users can verify receipts on-chain and query reputation

**Trust benefits:**
- ✅ On-chain proof of every execution (ReceiptHook events)
- ✅ Links quote → execution → receipt
- ✅ Policy compliance cryptographically verified
- ✅ Full audit trail (indexer + on-chain)
- ✅ Portable reputation (ReputationRegistry)

**Example:**
```
Swap executes: USDT → USDC
↓
ReceiptHook emits: ExecutionReceipt event
↓
    ├─→ Indexer stores: Receipt in database (for querying)
    │
    └─→ Indexer submits: Feedback to ReputationRegistry (for reputation)
        ↓
        ReputationRegistry: Accumulates on-chain feedback
        ↓
        Dashboard queries: ReputationRegistry for scores
        Dashboard queries: Indexer for receipt history
```

---

## Summary: Trust Through Transparency

**Marcus's Complete Journey:**

1. **Discovers agent via ENS** → No hardcoded addresses needed
2. **Verifies ERC-8004 identity** → On-chain proof of agent existence
3. **Checks reputation score** → Queries ReputationRegistry (on-chain, portable)
4. **Views receipt history** → Queries Indexer (fast, no gas)
5. **Configures policy** → Human-readable constraints
6. **Signs intent** → Structured signature, not blank check
7. **Agent executes** → Uniswap V4 swap with ReceiptHook
8. **Receipt emitted** → On-chain proof with strategyId + quoteId
9. **Dual indexing** → Indexer stores receipt + submits feedback to ReputationRegistry
10. **Verifies receipt** → Can check on Etherscan + query Indexer
11. **Reputation updates** → Both systems update automatically

**Trust is built through:**
- ✅ **Discoverability** - ENS provides human-readable names
- ✅ **Identity** - ERC-8004 provides portable on-chain identity
- ✅ **Execution proof** - ReceiptHook provides verifiable receipts
- ✅ **Receipt storage** - Indexer provides fast receipt queries
- ✅ **On-chain reputation** - ReputationRegistry provides portable trust scores
- ✅ **Verification** - On-chain receipts + ReputationRegistry provide audit trail

**Every step is:**
- ✅ Verifiable (on-chain proof)
- ✅ Transparent (all data public)
- ✅ Trustless (no need to trust third parties)
- ✅ Portable (works across protocols)

---

## Technical Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    USER (Marcus)                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1. Searches ENS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ENS Resolution (Mainnet)                       │
│  • agent:type = "treasury"                                  │
│  • agent:erc8004 = "eip155:11155111:0x462c...:1"           │
│  • agent:entrypoint = "0x3C75bA..."                        │
│  • agent:a2a = "https://treasury-agent.workers.dev"        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 2. Resolves ERC-8004
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         IdentityRegistry (ERC-8004)                        │
│  • agentId: 1                                              │
│  • agentURI: "ipfs://Qm..."                                │
│  • agentWallet: "0x742d..."                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 3. Queries reputation
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Indexer API (Receipt Storage)                   │
│  • Receipt queries: Fast, no gas                            │
│  • Strategy metrics: 1,247 executions, 12 bps avg          │
│  • Recent receipts: [12 bps, 11 bps, 13 bps]               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 3b. Query reputation
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         ReputationRegistry (ERC-8004)                        │
│  • On-chain reputation scores                               │
│  • Execution score: 88/100                                  │
│  • Compliance rate: 99.5%                                   │
│  • Portable across protocols                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 4. Configures policy
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Treasury Agent (Cloudflare Worker)                  │
│  • Stores policy                                           │
│  • Monitors drift                                          │
│  • Requests quotes from strategy-agent                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 5. Executes swap
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              IntentRouter (On-chain)                        │
│  • Validates EIP-712 signature                             │
│  • Checks deadline & nonce                                 │
│  • Executes swap via PoolManager                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 6. Swap executes
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Uniswap V4 PoolManager                              │
│  • Executes swap                                           │
│  • Calls ReceiptHook.afterSwap()                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 7. Receipt emitted
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ReceiptHook (On-chain)                         │
│  • Emits ExecutionReceipt event                             │
│  • Includes strategyId, quoteId, slippage, compliance      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 8. Indexed
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Indexer (Ponder)                                │
│  • Stores receipt (for querying)                            │
│  • Updates strategy metrics (for fast display)              │
│  • Submits feedback to ReputationRegistry                   │
│  • Exposes API for receipt queries                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 8b. Submit feedback
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         ReputationRegistry (ERC-8004)                        │
│  • Receives feedback from indexer                           │
│  • Accumulates on-chain reputation                          │
│  • Provides portable trust scores                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 9. User verifies
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Dashboard                                      │
│  • Receipts: Queries Indexer (fast)                         │
│  • Reputation: Queries ReputationRegistry (on-chain)       │
│  • Displays receipt history                                │
│  • Shows on-chain reputation scores                         │
│  • Links to Etherscan                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendix: E2E Testing Reconciliation

### What's Been Tested (OIK-18)

| Component | Test | Result | Evidence |
|-----------|------|--------|----------|
| **IntentRouter.executeIntent()** | Execute DAI→USDC swap | ✅ Pass | [TX 0x38571649...](https://sepolia.etherscan.io/tx/0x38571649950be26283a5c967ce7f74eb50914de8556d8c170c4efd34966771be) |
| **ReceiptHook.afterSwap()** | Emit ExecutionReceipt | ✅ Pass | Event in TX logs |
| **Treasury Agent /health** | Health check endpoint | ✅ Pass | 200 OK |
| **Treasury Agent /check-triggers** | Drift detection | ✅ Pass | Returns drift data |
| **Treasury Agent /rebalance** | Execute rebalance flow | ✅ Pass | 8.6s execution |
| **Strategy Agent /quote** | Get swap quote | ✅ Pass | Returns quote data |
| **Strategy Agent /.well-known/agent-card.json** | A2A protocol | ✅ Pass | Valid schema |
| **EIP-712 Intent Signing** | Sign intent struct | ✅ Pass | Signature verified on-chain |
| **Pool Config** | fee=3000, tickSpacing=60 | ✅ Pass | Swap executed |

### What Remains to Test

| Component | Test | Status | Blockers |
|-----------|------|--------|----------|
| **ENS Resolution** | Resolve treasury.oikonomos.eth | ⏳ Pending | Need to register ENS name on Sepolia |
| **ERC-8004 Identity** | Register agent identity | ⏳ Pending | IdentityRegistry not deployed |
| **ERC-8004 Reputation** | Query agent reputation | ⏳ Pending | ReputationRegistry not deployed |
| **Indexer** | Index ExecutionReceipt events | ⏳ Pending | Ponder indexer not running |
| **Multi-Token Rebalance** | Rebalance across 6 assets | ⏳ Pending | Requires multi-pool routing |
| **Variable Drift Thresholds** | Different thresholds per asset class | ⏳ Pending | Policy engine enhancement |
| **Dashboard** | End-user UI | ⏳ Pending | Frontend not built |

### Deployed Contracts (Sepolia)

| Contract | Address | Status |
|----------|---------|--------|
| **PoolManager** | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` | ✅ Uniswap canonical |
| **IntentRouter** | `0xFD699481f0aA60e0014EEd79d16cbe4b954FfaEf` | ✅ Deployed & tested |
| **ReceiptHook** | `0x15d3b7CbC9463f92a88cE7B1B384277DA741C040` | ✅ Deployed & tested |
| **IdentityRegistry** | TBD | ⏳ Not deployed |
| **ReputationRegistry** | TBD | ⏳ Not deployed |

### Available Pools for Testing

| Pair | Fee | Status | Notes |
|------|-----|--------|-------|
| USDC(Aave)/DAI(Aave) | 0.05%, 0.25%, 0.3% | ✅ Tested | Main stablecoin pair |
| ETH/USDC(Circle) | 0.3% | ⏳ Untested | Native ETH trading |
| USDC(Circle)/WETH(Uni) | 0.3% | ⏳ Untested | WETH alternative |
| UNI/WETH(Aave) | 0.3% | ⏳ Untested | DeFi token |

### Next Steps (Priority Order)

1. **Deploy ERC-8004 contracts** - IdentityRegistry + ReputationRegistry
2. **Register ENS name** - treasury.oikonomos.eth on Sepolia
3. **Start Ponder indexer** - Index ReceiptHook events
4. **Test multi-pool routing** - ETH→USDC→DAI paths
5. **Build dashboard MVP** - Policy config + receipt viewer

---

**End of User Journey Document**

# Strategy Consumer Journey (Meta-Treasury Management)

```
┌─────────────────────────────────────────────────────────────────┐
│  USER: "I have multiple AI agents launching tokens across       │
│         platforms. Help me manage all my fees and tokens."      │
└─────────────────────────────────────────────────────────────────┘
```

## STEP 1: CONNECT WALLET
══════════════════════
User connects to Oikonomos dashboard:

  - Wallet connected: 0xUser...
  - Chain: Base (8453)


## STEP 2: DISCOVER USER'S AGENTS
═════════════════════════════════
Oikonomos scans for agents the user has deployed across platforms:

  Query Clawnch API:
  GET https://clawn.ch/api/launches?wallet=0xUser...

  Discovered Agents:
  ┌──────────────────────────────────────────────────────────────┐
  │  AGENT                  PLATFORM    TOKEN     FEES ACCRUED   │
  │  ──────────────────────────────────────────────────────────  │
  │  alpha.agents.oikonomos.eth   Moltbook    $ALPHA    0.5 WETH │
  │  beta.agents.oikonomos.eth    4claw       $BETA     0.3 WETH │
  │  gamma.agents.oikonomos.eth   Clawstr     $GAMMA    0.8 WETH │
  │  delta.agents.oikonomos.eth   Moltx       $DELTA    0.2 WETH │
  │  ──────────────────────────────────────────────────────────  │
  │  TOTAL UNCLAIMED FEES:                           1.8 WETH    │
  │  + Native token fees in each token's units                   │
  └──────────────────────────────────────────────────────────────┘

  Fee Sources (per token):
  ├── WETH fees: From LP trading activity (the valuable one)
  └── Token fees: In the token's native units


## STEP 3: AGGREGATE PORTFOLIO VIEW
═══════════════════════════════════
Oikonomos presents unified dashboard:

  Portfolio Summary:
  ├── Total Agents: 4
  ├── Total Tokens Launched: 4
  ├── Platforms: Moltbook, 4claw, Clawstr, Moltx
  │
  ├── Unclaimed WETH Fees: 1.8 WETH (~$5,400)
  ├── Unclaimed Token Fees:
  │   ├── 10,000 $ALPHA
  │   ├── 5,000 $BETA
  │   ├── 25,000 $GAMMA
  │   └── 8,000 $DELTA
  │
  └── Fee Split: 80% to you / 20% to Clawnch

  Token Performance:
  ├── $ALPHA: $0.02 (+15% 24h) | 500 holders | $1M mcap
  ├── $BETA:  $0.005 (-8% 24h) | 120 holders | $250K mcap
  ├── $GAMMA: $0.10 (+42% 24h) | 2,000 holders | $5M mcap
  └── $DELTA: $0.001 (new) | 45 holders | $50K mcap


## STEP 4: DEFINE MANAGEMENT POLICY
═══════════════════════════════════
User defines how they want their meta-portfolio managed:

  Policy Configuration:
  {
    "claimFrequency": "weekly",
    "wethStrategy": {
      "compound": 50,      // Reinvest 50% into LP
      "toStables": 30,     // Convert 30% to USDC
      "hold": 20           // Keep 20% as WETH
    },
    "tokenStrategy": {
      "winners": "hold",           // Hold tokens up >20%
      "losers": "sell-to-weth",    // Exit tokens down >30%
      "neutral": "hold"
    },
    "riskTolerance": "medium",
    "maxSlippage": 100,            // 100 bps max per trade
    "minClaimThreshold": "0.1 WETH" // Don't claim less than this
  }


## STEP 5: DISCOVER MATCHING PROVIDERS
═════════════════════════════════════
Oikonomos queries the marketplace for strategy providers:

  1. GET /agents from indexer
     → Returns registered strategy providers

  2. Filter by capabilities:
     ├── Supports multi-agent management ✓
     ├── Supports user's platforms (Moltbook, 4claw, etc.) ✓
     ├── Offers compound + exit strategies ✓
     └── Accepts policy parameters ✓

  3. GET /reputation for matching providers:

  Matching Providers:
  ┌──────────────────────────────────────────────────────────────┐
  │  PROVIDER                        SCORE   FEE    SPECIALTY    │
  │  ──────────────────────────────────────────────────────────  │
  │  metatreasury.oikonomos.eth      92/100  2%    All-rounder  │
  │  └── 500 portfolios managed, 0.8 WETH avg monthly yield     │
  │                                                              │
  │  compound-king.oikonomos.eth     87/100  1.5%  Compounding  │
  │  └── Specializes in reinvestment strategies                 │
  │                                                              │
  │  safe-exit.oikonomos.eth         78/100  3%    Risk mgmt    │
  │  └── Focus on protecting gains, exit strategies             │
  └──────────────────────────────────────────────────────────────┘


## STEP 6: SELECT PROVIDER & DELEGATE
═════════════════════════════════════
User reviews and selects a provider:

  ┌─────────────────────────────────────────────────────┐
  │  SELECTED: metatreasury.oikonomos.eth               │
  │                                                      │
  │  ⭐ 92/100 reputation score                         │
  │  📊 500 portfolios managed                          │
  │  💰 2% of claimed fees                              │
  │  🎯 Supports all your platforms                     │
  │                                                      │
  │  [Delegate Management]                              │
  └─────────────────────────────────────────────────────┘

User signs EIP-712 delegation intent:

  const delegation = {
    user: "0xUser...",
    provider: "metatreasury.oikonomos.eth",
    strategyId: keccak256("metatreasury.oikonomos.eth"),

    // Scope: which agents/tokens to manage
    agents: [
      "alpha.agents.oikonomos.eth",
      "beta.agents.oikonomos.eth",
      "gamma.agents.oikonomos.eth",
      "delta.agents.oikonomos.eth"
    ],

    // Policy constraints
    policy: {
      claimFrequency: "weekly",
      maxSlippage: 100,
      wethStrategy: {...},
      tokenStrategy: {...}
    },

    // Authorization
    deadline: now + 30 days,
    fee: "2%"  // Provider's fee
  };

  const signature = await wallet.signTypedData(delegation);


## STEP 7: PROVIDER MANAGES PORTFOLIO
═════════════════════════════════════
The strategy provider now manages the user's meta-portfolio:

  Weekly Cycle:

  1. CLAIM FEES
     ├── Call ClankerFeeLocker.claim() for each token
     ├── Claimed: 1.8 WETH + token fees
     └── Provider fee: 0.036 WETH (2%)

  2. EXECUTE WETH STRATEGY (per policy)
     ├── Compound 50%: Add 0.9 WETH to LP positions
     ├── To stables 30%: Swap 0.54 WETH → 1,620 USDC
     └── Hold 20%: Keep 0.36 WETH in wallet

  3. EXECUTE TOKEN STRATEGY (per policy)
     ├── $GAMMA (+42%): HOLD ✓
     ├── $ALPHA (+15%): HOLD ✓
     ├── $DELTA (new): HOLD ✓
     └── $BETA (-8%): HOLD (not >30% down yet)

  4. EMIT RECEIPTS
     └── All swaps indexed via Swap events
     └── Provider's reputation updated


## STEP 8: VERIFY & TRACK
═════════════════════════
User can verify all actions on-chain:

  Dashboard View:
  ┌──────────────────────────────────────────────────────────────┐
  │  MANAGEMENT REPORT - Week of Feb 3, 2026                     │
  │  ──────────────────────────────────────────────────────────  │
  │  Provider: metatreasury.oikonomos.eth                        │
  │                                                              │
  │  FEES CLAIMED:                                               │
  │  ├── 1.8 WETH from ClankerFeeLocker                         │
  │  └── Token fees: 10K $ALPHA, 5K $BETA, 25K $GAMMA, 8K $DELTA│
  │                                                              │
  │  ACTIONS TAKEN:                                              │
  │  ├── ✓ Compounded 0.9 WETH into LP (tx: 0xabc...)           │
  │  ├── ✓ Swapped 0.54 WETH → 1,620 USDC (tx: 0xdef...)        │
  │  └── ✓ Held 0.36 WETH (no action needed)                    │
  │                                                              │
  │  POLICY COMPLIANCE: 100% ✓                                   │
  │  PROVIDER FEE PAID: 0.036 WETH                              │
  │                                                              │
  │  [View All Transactions] [Dispute] [Change Provider]        │
  └──────────────────────────────────────────────────────────────┘

  On-chain verification:
  ├── All Swap events indexed by Oikonomos
  ├── Linked to provider's strategyId
  ├── Policy compliance computed
  └── Immutable audit trail


## STEP 9: DEPLOY NEW AGENTS (Optional)
═══════════════════════════════════════
User can deploy new agents directly from Oikonomos:

  ┌─────────────────────────────────────────────────────┐
  │  DEPLOY NEW AGENT                                   │
  │                                                      │
  │  Agent Name: epsilon                                │
  │  ENS: epsilon.agents.oikonomos.eth                  │
  │                                                      │
  │  Platform: [Moltbook ▼]                             │
  │                                                      │
  │  Token Details:                                     │
  │  ├── Name: Epsilon Token                           │
  │  ├── Symbol: $EPSILON                              │
  │  └── Description: My fifth AI agent token          │
  │                                                      │
  │  [Deploy Agent]                                     │
  └─────────────────────────────────────────────────────┘

  Deployment Flow:
  1. Register ENS subname: epsilon.agents.oikonomos.eth
  2. Set ENS records (agent:a2a, agent:erc8004)
  3. Launch token via Clawnch API
  4. Token deployed on Clanker with Uniswap V4 pool
  5. Auto-added to user's managed portfolio

---

## Summary Flow

```
USER                                    PROVIDER
════                                    ════════

1. Connect wallet                       1. Build meta-management strategy
      │                                       │
      ▼                                       ▼
2. Discover existing agents ◄────────── 2. Register (ERC-8004 + ENS)
   (Moltbook, 4claw, Clawstr, Moltx)          │
      │                                       ▼
      ▼                                 3. List capabilities
3. View aggregate portfolio                   │
   (tokens, fees, performance)                │
      │                                       │
      ▼                                       │
4. Define management policy                   │
   (claim freq, strategies, risk)             │
      │                                       │
      ▼                                       │
5. Match with providers ◄─────────────────────┘
      │
      ▼
6. Select & delegate
   (sign EIP-712 intent)
      │
      ▼
7. Provider manages ◄─────────────────► 4. Execute strategies
   (claim, compound, rebalance)              (within policy bounds)
      │                                       │
      ▼                                       ▼
8. Verify on-chain ◄──────────────────► 5. Swap events indexed
   (all actions auditable)                   (reputation grows)
      │                                       │
      ▼                                       ▼
9. Deploy new agents                    6. Earn x402 fees
   (optional, with ENS naming)               (% of claimed fees)
```

---

## Key Insight

**The meta-treasury manager solves a real problem:**

With 10,000+ tokens launched by AI agents across Moltbook, 4claw, Clawstr, and Moltx, users face complexity in managing:
- Multiple agents across platforms
- Multiple tokens with different performance
- Fee streams (WETH + native tokens) in ClankerFeeLocker
- Claiming, compounding, and exit strategies

Oikonomos provides:
1. **Aggregation** - Unified view of all agents and tokens
2. **Policy-based management** - User defines constraints, provider executes
3. **Marketplace** - Compete on strategy quality and fees
4. **Accountability** - All actions verifiable via indexed Swap events
5. **ENS naming** - Human-readable identity for each agent

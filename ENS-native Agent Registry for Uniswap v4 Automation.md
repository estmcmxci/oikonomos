## PRD: ENS-native Agent Registry for Uniswap v4 Automation

### 1) Product summary

A modular “agentic finance” framework where **ENS names** resolve to **agent endpoints** (contracts + metadata) that automate Uniswap v4 interactions under **explicit, auditable policies**.

**Flagship workflow (v0):** **Treasury Autopilot**

* A stablecoin treasury agent decides *what* to do (policy-driven)
* A v4 router/executor performs *how* to do it (best path within constraints)
* A receipt system proves *what happened* (verifiable execution logs)

Additional modules plug in as features: LP rebalancing, managed vaults, intent receipts, netting/coordination, policy routing.

---

### 2) Goals

**Core goals (aligned with the prize prompt):**

1. **Reliability-first automation:** deterministic policy checks; no “black-box AI required.”
2. **Transparency:** every action yields a **receipt** with inputs/constraints/outcomes.
3. **Composability:** agents are callable primitives; registry enables discovery and integration.
4. **Human-readable addressing:** ENS names as stable identifiers for agent endpoints + versions.

**User goals:**

* “I want my stablecoin treasury to rebalance + convert cheaply, automatically, safely.”
* “I want proof of what the agent did and why.”
* “I want to integrate an agent endpoint into my app without hardcoding addresses.”

**Principles:**

- Principles (from ENS agent identity requirements)
- Portable: Agent identity and metadata resolve consistently across apps and (eventually) chains.
- Open: Registry schema and metadata format are public and permissionless to implement.
- Composable: Agent records are interoperable with external registries/reputation frameworks.
- Human-readable: ENS names are the primary UX surface for agent selection and safety checks.


### 2.1) Standards alignment
This project intentionally composes with emerging agent identity/payment standards to keep discovery and trust portable and neutral across interfaces:
- ERC-8004 (Identity/Reputation/Validation): We treat the ERC-8004 Identity Registry as the canonical, onchain identity object for an agent implementation. Each ENS-named agent MAY be linked to an ERC-8004 agentId (ERC-721), with its `agentURI` pointing to the Agent Record (or a deterministic mirror of it). The ERC-8004 `agentWallet` mechanism is supported for declaring/verifying the agent’s payment address (EIP-712/ ERC-1271).
- x402 (optional): If the agent offers offchain services (execution/keeper, simulation, receipt verification UI), it MAY expose an x402 paywall endpoint so clients can pay per request over HTTP 402. Payments remain orthogonal to identity/trust.
- ERC-8122 (optional): The system MAY support curated listings via minimal agent registries for ecosystem-specific discovery (e.g., “approvedagents”), while ENS remains the global namespace.

---

### 3) Non-goals

* No generalized “AI trader” or price prediction engine.
* No custody of user funds by default (prefer user-signed intents + scoped approvals).
* No attempt to be the universal router across every chain on day one.
* No deep regulatory/KYC layer in v0 (keep a clean interface for future compliance).

---

### 3.1 Deployment modes

This system supports two primary deployment modes, selected per user persona and custody model:

#### Mode A — Intent-first (EOA / vault-controlled)
- Users authorize actions via EIP-712 intents with scoped approvals.
- Best for individuals/power users and non-Safe vaults.

#### Mode B — Safe + Roles (DAO treasury / institutional)

- Funds remain in a Gnosis Safe.
- Execution is delegated to an agent executor, but Zodiac Roles Modifier enforces DAO-voted permissions (pre-approved transactions and parameter constraints).
- Best for DAOs and any treasury that requires governance-defined execution envelopes and strong onchain permissioning.
- Design implication: “policy” is not a single mechanism; it is a pluggable enforcement backend (Intent constraints vs Roles constraints). The product must support both.


---
### 4) Target users & personas

1. **DAO Treasurer / Operator**

   * Needs stable balances, predictable execution, clear reporting, emergency stops.
2. **DeFi Power User**

   * Wants automation for swaps/LP management without surrendering control.
3. **Developer / Integrator**

   * Wants stable endpoints, schemas, and receipts to embed in wallets/dapps.

---

### 5) Problem statement

Current DeFi automation is fragmented: bots are opaque, integrations hardcode addresses, and “agents” often mean speculative AI. The prize prompt is asking for automation that is **programmatic, reliable, transparent, composable**. ENS can be the missing discovery + identity layer.

---

### 6) Core product concept

**ENS names** map to **Agent Records** that define:

* What the agent is (type/capabilities)
* Where it lives (contract addresses / endpoints)
* What constraints it enforces (policy hash / policy contract)
* How it proves actions (receipt contract / verification endpoint)
* Versioning + upgrade rules

Apps integrate via ENS:

* resolve `treasury.agentnamh` → get agent entrypoint + policy + receipts
* submit an intent to `router.agentname.eth` → receive a verifiable receipt


#### Policy Enforcement Backends

Agent Records MUST specify which enforcement backend is in use:

- `intent-only` (constraints enforced by intent validation in router)
- `safe-roles` (constraints enforced by Safe + Roles Modifier; agent submits only pre-approved tx patterns)

This is critical for integrators: the same ENS name must communicate whether an agent can move funds via intents or must operate through Safe role-gated execution. 

---

### 7) User journeys

#### 7.1 Individual User Journey (Mode A: Intent-First)

**Persona:** DeFi power user with $100K in stablecoins (60K USDC, 25K USDT, 15K DAI) seeking automated rebalancing to maintain a 70/20/10 split with best execution.

##### Step 1: Discovery
**Action:** Connect wallet, search for `treasury.oikonomos.eth`

**What happens:**
- Frontend resolves ENS → fetches agent text records
- Sees `agent:mode = intent-only` (confirms this works for EOAs)
- Fetches A2A agent card to display capabilities
- Shows agent's ERC-8004 reputation score from past executions

**User sees:** Agent profile with trust score, supported tokens, slippage history

##### Step 2: Policy Configuration
**Action:** Choose policy template or customize

**What happens:**
- Select "Stablecoin Rebalance" template
- Set parameters:
  - Target: 70% USDC / 20% USDT / 10% DAI
  - Max slippage: 25 bps
  - Trigger: drift > 5% OR weekly
  - Max daily: $20K

**User sees:** Human-readable summary: *"Rebalance when any asset drifts >5% from target. Max 25bps slippage. Max $20K/day."*

##### Step 3: Authorization
**Action:** Sign EIP-712 intent with embedded constraints

**What happens:**
- Wallet prompts structured signature (not a blank check)
- Intent includes: allowed tokens, slippage cap, deadline, max amounts
- No token approvals beyond what user explicitly permits

**User sees:** Clear breakdown of what they're authorizing—constraints are on-chain enforceable

##### Step 4: Trigger Fires
**Action:** None (automated)

**What happens:**
- Agent detects drift: current allocation is 55/30/15 (USDC dropped)
- Treasury agent requests quote from strategy-agent
- Strategy-agent returns optimal route: USDT → USDC via v4 pool
- Quote includes `quoteId` for attribution

**User sees:** (Optional) Push notification: *"Rebalance triggered. Drift: 15%. Executing..."*

##### Step 5: Execution
**Action:** None (automated)

**What happens:**
1. `IntentRouter.validateIntent()` checks signed constraints
2. `PoolManager.swap()` executes on Uniswap v4
3. `hookData` encodes: strategyId, quoteId, maxSlippage
4. `ReceiptHook.afterSwap()` emits `ExecutionReceipt` event

**On-chain:** ~$8K USDT → ~$7,988 USDC (12bps slippage, under 25bps cap)

##### Step 6: Receipt & Verification
**Action:** View dashboard

**What happens:**
- Receipt event indexed and displayed:
  ```
  strategyId: treasury.oikonomos.eth
  quoteId: 0xabc...
  amount0: -8000 USDT
  amount1: +7988 USDC
  actualSlippage: 12bps
  policyCompliant: true
  ```
- Strategy's reputation updated in ERC-8004 Reputation Registry

**User sees:**
- *"Rebalanced to 70/20/10 ✅"*
- *"Slippage: 12bps (under 25bps cap)"*
- *"Tx: 0x... | Verify on-chain"*

##### Step 7: Ongoing
**Action:** Monitor or adjust

**User can:**
- View execution history with full receipts
- Adjust policy parameters (sign new intent)
- Revoke authorization anytime
- Compare strategy performance on leaderboard

##### What the user never has to do:
- Trust a black-box AI
- Grant unlimited token approvals
- Wonder what happened or why
- Manually execute swaps at 3am when markets move

---

#### 7.2 DAO Treasury Journey (Mode B: Safe + Roles)

**Persona:** DAO with ~$114M treasury portfolio:

| Asset | Value | Share |
|-------|-------|-------|
| USDS | $44.3M | 38.93% |
| ETHx | $20.6M | 18.13% |
| ETH | $20.4M | 17.95% |
| rETH | $14.7M | 12.95% |
| stETH | $13.7M | 12.03% |
| Dust (COMP, wstETH, BAL, GRG) | ~$2K | 0.00% |

The DAO wants to automate rebalancing across ETH LSTs while maintaining stablecoin reserves—without giving any single operator custody.

##### Step 1: Discovery & Agent Selection
**Actor:** DAO Treasurer / Metagovernance Steward

**Action:** Propose agent adoption via governance forum

**What happens:**
- Resolve `treasury.oikonomos.eth` → sees `agent:mode = safe-roles`
- Fetch agent card: capabilities include `rebalance`, `lst-rotation`, `stablecoin-sweep`
- Review ERC-8004 reputation: execution history, slippage scores, compliance rate
- Agent metadata shows required Roles permissions

**DAO sees:** Governance post with agent profile, trust score, and proposed policy

##### Step 2: Policy Design & Governance Vote
**Actor:** DAO Governance

**Action:** Vote on execution policy

**Proposed Policy:**
```
Target Allocation:
  - Stablecoins (USDS): 35-40%
  - ETH + LSTs: 60-65%
    - ETH: 15-20%
    - ETHx: 15-20%
    - rETH: 10-15%
    - stETH: 10-15%

Constraints:
  - Max slippage: 20 bps
  - Max daily notional: $2M
  - Allowed targets: Uniswap v4, Curve, 1inch
  - Allowed tokens: USDS, ETH, ETHx, rETH, stETH, wstETH
  - Rebalance trigger: drift > 3%
  - Emergency pause: Steward multisig can halt
```

**What happens:**
- DAO votes (Snapshot or onchain)
- Policy passes with 85% approval

**DAO sees:** Human-readable policy summary attached to proposal

##### Step 3: Roles Configuration (Policy Compilation)
**Actor:** DAO Ops / Treasurer

**Action:** Configure Zodiac Roles Modifier with approved permissions

**What happens:**
1. Policy Compiler translates vote into Roles config:
   ```
   Role: treasury-agent-executor
   Permissions:
     - target: UniversalRouter (0x3A9D...)
     - selectors: swap(), execute()
     - tokens: [USDS, ETH, ETHx, rETH, stETH]
     - maxPerTx: $500K
     - maxDaily: $2M
     - slippageParam: ≤ 20bps
   ```
2. Safe enables Zodiac Roles Modifier as module
3. Agent executor address assigned the role

**On-chain:** `RolesModifier.assignRole(agentExecutor, roleKey, permissions)`

**DAO sees:** Verified tx that permissions match voted policy

##### Step 4: Trigger Detection
**Actor:** Treasury Agent (automated)

**Action:** Monitor allocation drift

**Current state:**
- USDS: 38.93% ✅ (within 35-40%)
- ETHx: 18.13% ✅
- ETH: 17.95% ✅
- rETH: 12.95% ✅
- stETH: 12.03% ✅

**Scenario:** ETH pumps 15%, LSTs lag. New allocation:
- USDS: 34.2% ⚠️ (drifting low)
- ETH: 21.5% ⚠️ (over target)

**What happens:**
- Agent detects drift > 3% threshold
- Computes rebalance: sell ~$1.8M ETH → buy USDS + underweight LSTs
- Requests quote from strategy-agent

**DAO sees:** (Optional) Alert: *"Rebalance triggered. ETH overweight by 3.5%."*

##### Step 5: Quote & Execution Plan
**Actor:** Strategy Agent

**Action:** Generate optimal execution plan

**What happens:**
1. Strategy-agent analyzes liquidity across v4 pools
2. Proposes split execution to minimize impact:
   - Tranche 1: 800K ETH → USDS via v4
   - Tranche 2: 500K ETH → rETH via Curve
   - Tranche 3: 500K ETH → stETH via v4
3. Returns `quoteId: 0xdef...` with expected slippage: 14bps

**x402 (optional):** Strategy charges 0.5bps fee for MEV-optimized routing

##### Step 6: Execution (3-Step Chain)
**Actor:** AgentExecutor contract

**Action:** Submit transactions through Safe + Roles

**What happens (for each tranche):**

```
1. AgentExecutor.execute(swapCalldata)
         ↓
2. RolesModifier.execTransactionWithRole(
     target: UniversalRouter,
     data: swapCalldata,
     roleKey: 0x...
   )
   → ✅ Checks: target allowed? selector allowed? amount ≤ $500K? slippage ≤ 20bps?
         ↓
3. Safe.execTransactionFromModule(
     to: UniversalRouter,
     data: swapCalldata
   )
         ↓
4. PoolManager.swap() executes on Uniswap v4
         ↓
5. ReceiptHook.afterSwap() emits ExecutionReceipt
```

**If agent tries to exceed permissions:**
```
RolesModifier → ❌ Revert: PermissionDenied
(Safe never executes; funds remain safe)
```

##### Step 7: Receipt Emission & Verification
**Actor:** ReceiptHook

**Action:** Emit on-chain proof

**ExecutionReceipt Event:**
```
strategyId: treasury.oikonomos.eth
quoteId: 0xdef...
safeTxHash: 0x789...
tranche: 1 of 3
amount0: -800,000 USDS worth of ETH
amount1: +799,120 USDS
actualSlippage: 11bps
policyCompliant: true
enforcementBackend: safe-roles
rolesModifier: 0x9646f...
timestamp: 1738172604
```

**DAO sees:** Dashboard shows:
- *"Rebalance complete: 3 tranches executed"*
- *"Total moved: $1.8M | Avg slippage: 12bps (under 20bps cap)"*
- *"New allocation: USDS 37.1% | ETH 18.2% | ETHx 17.9% | rETH 14.1% | stETH 12.7%"*
- Link to verify each Safe tx on-chain

##### Step 8: Reputation & Reporting
**Actor:** System

**Action:** Update trust metrics

**What happens:**
- ERC-8004 Reputation Registry updated:
  - `totalExecutions++`
  - `avgSlippage` recalculated
  - `complianceRate: 100%`
- Strategy leaderboard updated with execution quality score
- DAO treasury dashboard shows historical performance

**DAO sees:** Monthly report:
- Executions: 12
- Total rebalanced: $8.4M
- Avg slippage: 13bps
- Policy violations: 0
- Estimated savings vs manual: ~$12K

##### What the DAO never has to do:
- Trust an operator with unlimited access
- Execute manual swaps during volatility
- Wonder if execution matched the voted policy
- Argue about what happened—receipts prove it

---

#### 7.3 Mode Comparison

| Aspect | Individual (Mode A) | DAO (Mode B) |
|--------|---------------------|--------------|
| Authorization | User signs each intent | DAO votes once; Roles enforces |
| Custody | User's EOA | Gnosis Safe multisig |
| Enforcement | IntentRouter validates | RolesModifier gates execution |
| Blast radius | Limited by intent constraints | Limited by Roles permissions |
| Recovery | Revoke intent | Revoke role / disable module |
| Governance | Self | Token vote + steward oversight |

---

#### 7.4 Integrator journey

1. Wallet resolves ENS name → fetches `agent.json`
2. Displays policy summary + risk level
3. Lets user sign an intent (Mode A) or shows DAO policy status (Mode B)
4. Shows receipt and verification link

---

### 8) Feature set

#### 8.1 Core (must-have for v0)

**F1 — ENS Agent Registry Schema**

* Standard metadata published via ENS text records (and/or a resolver contenthash pointing to JSON).
* Must support type, version, chain, entrypoint, policy, receipts, permissions.

**F1.1 — ERC-8004 Identity Bridge (must-have for ENS track)**

- Create and maintain an ERC-8004 Identity Registry entry for each ENS-named agent implementation.
- Bindings:
    - `agentURI` SHOULD point to a canonical Agent Record JSON (or content-addressed hash) that corresponds to the ENS name.
    - Optional ERC-8004 onchain metadata keys MAY store the ENS name and core capability tags.
    - Support `agentWallet` declaration and updates in accordance with ERC-8004's wallet verification flow (EIP-712 / ERC-1271).
- Receipts emitted by the agent SHOULD reference the `agentId` to enable downstream reputation/validation systems to consume performance proofs.

**Acceptance criteria (hackathon):**
- Demonstrate: resolve ENS → discover `agentId` → execute v4 action → emit receipt referencing `agentId`.

**F2 — Policy Router Agent (Execution constraints)**

* Accepts user intents with hard constraints:

  * slippage cap
  * max price impact
  * deadline
  * gas budget ceiling (optional)
  * allowed tokens/pools
* Produces an execution plan; executes on v4.

**F3 — Receipt System**

* Onchain receipt contract emits structured events:

  * intent hash
  * input constraints
  * pools/path used
  * effective price, fees, slippage
  * policy verdict (pass/fail + reason codes)
* Offchain verifier reads receipts + displays human explanation.

**F4 — Treasury Autopilot Module**

- Rebalance stablecoin baskets using the policy router.
- Triggers:
    - threshold: drift > X%
    - periodic: weekly/monthly
    - Optional: “idle cash sweep” into a simple yield leg (can be stubbed in v0).


**F5 — Safe + Roles Execution Adapter (DAO enforcement backend)**

- Provides an adapter layer for DAOs where:
    - Treasury funds reside in a Gnosis Safe
    - An agent executor is permissioned through Zodiac Roles Modifier 


- Responsibilities:
    - **Policy compilation:** translate high-level policy templates into Roles permissions (target/function/parameter constraints; allowlists; spend limits; cadence limits). 
    - **Execution path:** submit agent actions as Safe transactions that must pass Roles checks. 
    - **Receipt linkage:** bind Safe transaction hashes to receipt events (so receipts prove not only "what happened," but "it was within the DAO-approved envelope").

**Acceptance criteria (v0):**
- Demonstrate at least one Treasury autopilot rebalance executed through a Safe with Roles Modifier enabled. 

#### 8.2 Plug-in modules (v1 features; can be demo-only in v0)

**P1 — LP Range Rebalancer Module**

* For concentrated liquidity positions: reposition range, harvest fees, rate-limit rebalances.

**P2 — Managed Vault Module**

* Vault with strategy profiles that call the router; publishes performance receipts.

**P3 — Netting / Coordination Module**

* Group-level policies; batch internal netting before external swaps; execute via router.

**P4 — Intent + Receipt Executor (as a standalone endpoint)**

* Expose “router + receipts” as a generic service even without treasury logic.

#### 8.3 Secondary Market for Strategies



The protocol supports a competitive marketplace of **Strategy Modules** (algorithms) that optimize execution and liquidity decisions *inside* a user/DAO-defined policy envelope. Strategies are discoverable via ENS, verifiable via ERC-8004 identities, and objectively measurable via receipts. x402 is used as an optional payment rail for offchain strategy services (quotations, monitoring, execution planning).

This enables economic competition for:

* Swap routing quality (price impact, slippage adherence, gas efficiency)
* Treasury rebalance quality (tracking error vs target allocations, cost)
* LP range management (fee APR, rebalance frequency, drawdown control)
* Netting/batching efficiency (reduced external swap notional, fees)

#### Core principle: Policy ≠ Strategy

* **Policy** defines non-negotiable constraints: allowlists, max notional, slippage caps, cadence, risk limits, and emergency stops.
* **Strategy** defines the optimization logic inside the constraints: how to route, when to rebalance, where to place liquidity, how to batch.

Strategies MUST NOT expand authority beyond policy. In DAO mode, Safe + Roles remains the enforcement backend.

---

### 8.3.1 Strategy Module Interface

All strategies implement a minimal interface (onchain, offchain, or hybrid), enabling substitution and competition.

**Required capabilities**

1. **Quote/Plan:** Given an intent and current state, propose an execution plan.

   * Output: `plan`, expected outcomes (price, slippage, gas), and a confidence envelope.
2. **Execute (optional):** Submit transactions or assist an executor in execution.
3. **Explain (recommended):** Provide a human-readable rationale for the plan (judge-facing transparency).

**Strategy types**

* `routing-strategy` (swap path selection on v4)
* `rebalance-strategy` (treasury drift logic + amounts)
* `lp-strategy` (range placement + reposition rules)
* `batching-strategy` (netting and aggregation)

---

### 8.3.2 Strategy Identity, Discovery, and Listing

**ENS-native discovery**

* Strategies are published under ENS names (recommended patterns):

  * `strategy.router.<brand>.eth`
  * `strategy.treasury.<brand>.eth`
  * `strategy.lp.<brand>.eth`

**ERC-8004 binding**

* Each strategy SHOULD have an ERC-8004 agentId (identity object) linked from ENS metadata for portable trust/reputation and unambiguous versioning.

**Agent Record requirements for strategies**

* type, version, capabilities, chain scope, entrypoints, and receipts linkage
* optional x402 endpoint (see below)
* changelog/audit pointers

---

### 8.3.3 Receipt-Based Scoring and Selection

Every execution emits receipts that enable objective scoring. The system defines a standardized scoring function per strategy class.

**Core metrics (routing)**

* `execution_quality`: effective price vs baseline (TWAP or reference route)
* `constraint_adherence`: slippage vs cap; reverts/violations
* `efficiency`: gas used / complexity
* `reliability`: success rate over trailing window

**Core metrics (treasury)**

* `tracking_error`: drift vs target bands
* `cost_to_rebalance`: fees + slippage + gas
* `policy_compliance_rate`

**Selection mechanisms**

* **Default:** select top-performing strategy that is policy-compatible.
* **Manual:** user chooses strategy from ranked list.
* **DAO mode:** governance-approved allowlist of strategy ENS names; only allowlisted strategies can be used.

---

### 8.3.4 x402 Payments for Strategy Services

Strategies MAY monetize offchain services via x402 (HTTP 402 payment flow). This creates a secondary market where better strategies can charge for higher-quality compute without custodying funds or altering onchain determinism.

**What can be paywalled (x402)**

* quote generation (simulation, search, solver computation)
* MEV-aware execution planning
* continuous monitoring & alerts
* execution-as-a-service (if user/DAO opts in)

**What must remain free and onchain-verifiable**

* policy enforcement (onchain checks)
* execution receipts (proof of outcome)
* validation of plan compliance (deterministic verification)

**Payment coupling to receipts**
Each paid quote/plan MUST produce a `quoteId` that is referenced in the onchain receipt. This binds “what the user paid for” to “what happened,” enabling:

* dispute resolution
* reputation systems (ERC-8004 validation/reputation) to score strategies
* performance-based pricing models

**Suggested pricing models**

* per-quote fee (x402)
* subscription for monitoring (x402)
* performance fee via opt-in onchain fee split (v1+), bounded and fully disclosed

---

### 8.3.5 Safety Controls for Strategy Competition

To prevent "best strategy" from becoming a new attack surface:

* **Policy compatibility checks**: a strategy must declare which policy primitives it supports.
* **Allowlist support**: especially for DAOs; strategies must be explicitly approved.
* **Rate limits and circuit breakers**: enforced at policy layer.
* **Receipt transparency**: all actions must be explainable and auditable.
* **Optional bonding (v1+)**: strategies post stake; slashed on violations or misrepresentation.

---

### 8.3.6 Strategy Marketplace Economics

This section details the economic model that allows anyone to build, deploy, and monetize strategies within the Oikonomos framework.

#### The Core Distinction

| Layer | Who Controls | What It Is |
|-------|--------------|------------|
| **Policy** | User / DAO | Non-negotiable constraints (slippage caps, token allowlists, max notional, cadence) |
| **Strategy** | Strategy Provider | Optimization logic *within* the policy (routing, timing, MEV protection, batching) |

Users don't buy policies—they define them. Users buy **strategies** that execute optimally within their policy constraints.

#### Strategy Provider Lifecycle

**Step 1: Build & Deploy**
- Develop strategy logic (Cloudflare Worker, smart contract, or hybrid)
- Implement the Strategy Module Interface: `Quote/Plan`, `Execute`, `Explain`
- Use `create-8004-agent` CLI scaffold for rapid deployment

**Step 2: Register Identity**
- Register ENS name: `strategy.router.alice.eth`
- Mint ERC-8004 agentId → links to agentURI (capabilities, version, chain scope)
- Set `agent:x402` endpoint for paid services
- Declare supported policy primitives

**Step 3: Compete in Marketplace**
- Strategy appears on leaderboard (initially unranked)
- Users/DAOs can select it for their policy execution
- Pricing tiers: free (basic routing) vs paid (MEV-optimized, monitoring)

**Step 4: Execution + Receipt Attribution**
- Every execution emits a receipt via `ReceiptHook.afterSwap()`:
  ```solidity
  event ExecutionReceipt(
      bytes32 indexed strategyId,    // Who executed
      bytes32 indexed quoteId,       // Links to x402 payment
      int128 amount0,                // Actual input
      int128 amount1,                // Actual output
      uint256 actualSlippage,        // Objective measurement
      bool policyCompliant,          // Did it follow rules?
      uint256 timestamp
  );
  ```
- `strategyId` = ENS name or ERC-8004 agentId → **attribution**
- `quoteId` = links paid quote to actual outcome → **accountability**

**Step 5: Reputation Accumulates**
- ERC-8004 Reputation Registry aggregates receipt data
- Metrics: `avgSlippage`, `successRate`, `complianceRate`, `totalVolume`
- Better scores → higher ranking → more users → more revenue

#### Revenue Streams for Strategy Providers

| Stream | Mechanism | Example | When Available |
|--------|-----------|---------|----------------|
| **Per-quote fees** | x402 paywall | $0.10 per MEV-optimized quote | v0 |
| **Subscription** | x402 recurring | $50/mo for monitoring + alerts | v0 |
| **Performance fee** | On-chain fee split | 0.5bps of trade value on success | v1+ |
| **MEV rebates** | Searcher kickbacks | Share captured MEV with user | v1+ |

#### Why ReceiptHook is the Trust Anchor

Without `ReceiptHook`, the marketplace is **unverifiable**:
```
Strategy claims: "I got you 5bps slippage!"
User asks: "Prove it."
Strategy: "Trust me bro."
```

With `ReceiptHook`, it's **trustless**:
- Every execution is provably attributed to a strategy
- Slippage is objectively measured on-chain
- Policy compliance is cryptographically verifiable
- Reputation is earned through performance, not claimed

**The `quoteId` binding:**
1. User pays for quote via x402 → receives `quoteId: 0xabc`
2. Quote promises: "I'll get you ≤10bps slippage"
3. Execution happens → receipt emits `quoteId: 0xabc, actualSlippage: 8bps`
4. User can verify: "I paid for 0xabc, receipt shows 8bps. Promise kept."

If the strategy underperforms:
- Receipt shows worse slippage than promised
- Reputation score drops automatically
- Users migrate to better strategies
- **Market selection enforces quality**

#### The Economic Flywheel

```
Better Strategy Algorithm
         ↓
Lower Slippage (proven via receipts)
         ↓
Higher Reputation Score (ERC-8004)
         ↓
More Users Select It (leaderboard visibility)
         ↓
More Revenue (x402 fees + volume)
         ↓
Incentive to Build Better Strategies
         ↓
      (repeat)
```

#### Example: Strategy Provider Journey

**Alice** builds `strategy.router.alice.eth`:
- Specializes in stablecoin→stablecoin swaps
- Uses private mempool to avoid sandwich attacks
- Charges 0.3bps per trade via x402

| Period | Executions | Avg Slippage | Reputation | Monthly Revenue |
|--------|------------|--------------|------------|-----------------|
| Month 1 | 50 | 9bps | 72/100 (new) | ~$150 |
| Month 3 | 400 | 8bps | 85/100 | ~$1,200 |
| Month 6 | 2,000 | 7bps | 94/100 (top 5) | ~$8,000 |
| Month 12 | 8,000 | 6bps | 97/100 (top 2) | ~$35,000 |

At month 6, DAOs start allowlisting Alice's strategy for their treasuries.

**The receipts made this possible**—every single execution is attributed, measured, and scored on-chain.

#### Marketplace Infrastructure (Implementation Phases)

**v0 (Hackathon)**
- ReceiptHook emits `strategyId` and `quoteId`
- Basic leaderboard UI showing receipt-derived metrics
- x402 endpoint support for per-quote fees

**v1**
- On-chain scoring contract aggregating receipts
- ERC-8004 Reputation Registry integration
- Strategy allowlist governance for DAOs
- Subscription billing via x402

**v2+**
- On-chain performance fee splits
- Strategy bonding/slashing for violations
- Cross-chain strategy reputation portability
- MEV rebate mechanisms

#### Market Dynamics

**Why this creates healthy competition:**

1. **Low barrier to entry**: Anyone can deploy a strategy with the CLI scaffold
2. **Objective measurement**: Receipts prevent false performance claims
3. **User choice**: Leaderboard surfaces best strategies by category
4. **DAO governance**: Allowlists prevent untrusted strategies from accessing treasury funds
5. **Economic alignment**: Strategies earn more by performing better, not by marketing

**Why this doesn't become a race to the bottom:**

1. **Quality differentiation**: MEV protection, gas optimization, and reliability are measurable
2. **Specialization**: Strategies can focus on niches (LST swaps, large trades, specific pools)
3. **Trust premium**: Established strategies with high reputation can charge more
4. **DAO relationships**: Long-term partnerships with treasuries provide stable revenue

---

### 9) Requirements

#### Functional requirements

* ENS resolution returns sufficient data to call the agent without hardcoding addresses.
* Every agent action produces an onchain receipt with enough data to reproduce/verify.
* Router rejects intents that violate policy (clear revert reasons).
* Treasury module can run with **zero ML**; fully policy-driven.
* System must support **Safe + Roles** as a policy enforcement backend, including:
    * identifying Safe/Modifier addresses from agent metadata
    * executing rebalances as Safe transactions 
    * failing cleanly when a proposed action is outside Roles permissions

- Policy templates must be representable in both forms:
    - intent constraints (EOA mode)
    - roles constraints (DAO mode), at minimum for token allowlists + max notional + slippage cap + cadence 

* The system must support discovery and selection of Strategy Modules via ENS metadata, including compatibility filtering against policy constraints.
* Receipts must include `strategyId` (ENS name and/or ERC-8004 agentId) and optional `quoteId` to bind x402-paid quotes/plans to execution outcomes.
* The UI must render a strategy leaderboard using receipt-indexed metrics and make selection criteria explicit.


#### Non-functional requirements

* **Safety:** circuit breakers; allowlist/denylist; rate limits.
* **Observability:** receipts indexed; dashboards for actions + policy status.
* **Upgradeability:** versioned ENS names (e.g., `router.v1.<brand>.eth`) + explicit “latest” alias.
* **Composability:** agents callable by other contracts/apps.
* **Governance compatibility:** policies must be exportable as human-readable summaries suitable for DAO votes, plus machine-readable artifacts suitable for Roles configuration. 
* **Auditability:** receipts must reference Safe tx hashes and include an "enforcement backend" field (`intent-only` vs `safe-roles`).

---

### 9.1) Agent Taxonomy

The system defines three categories of agents, each serving a distinct role in the architecture.

#### Category 1: Module Agents

Module agents are the core automation endpoints that users and DAOs interact with. Each module type has a specific purpose and ENS naming pattern.

| Agent Type | ENS Pattern | Purpose | Status |
|------------|-------------|---------|--------|
| **treasury** | `treasury.<brand>.eth` | Stablecoin/portfolio rebalancing (flagship module) | v0 MVP |
| **router** | `router.<brand>.eth` | Execution router - validates intents, executes swaps | v0 MVP |
| **lp** | `lp.<brand>.eth` | LP rebalancer - concentrated liquidity management | v1 |
| **vault** | `vault.<brand>.eth` | Managed vault - strategy profiles with deposits | v1 |
| **netting** | `netting.<brand>.eth` | Coordination module - batch internal netting | v2 |
| **receipts** | `receipts.<brand>.eth` | Receipt verifier endpoint (optional) | v1 |

#### Category 2: Strategy Agents

Strategy agents compete in the marketplace to optimize execution *within* user-defined policy constraints. They implement the Strategy Module Interface (Quote/Plan, Execute, Explain).

| Strategy Type | ENS Pattern | Purpose | Competes On |
|---------------|-------------|---------|-------------|
| **routing-strategy** | `strategy.router.<brand>.eth` | Swap path selection on v4 | Slippage, gas efficiency |
| **rebalance-strategy** | `strategy.treasury.<brand>.eth` | Treasury drift logic + amounts | Tracking error, cost |
| **lp-strategy** | `strategy.lp.<brand>.eth` | Range placement + reposition rules | Fee APR, drawdown |
| **batching-strategy** | `strategy.netting.<brand>.eth` | Netting and aggregation | Reduced swap volume |

#### Category 3: Service Agents (Implementation Layer)

Service agents are the deployed Cloudflare Workers that implement the A2A protocol and orchestrate execution.

| Service | Deployment | Role | Depends On |
|---------|------------|------|------------|
| **treasury-agent** | Cloudflare Worker | Detects drift, computes rebalances, orchestrates execution | IntentRouter or AgentExecutor |
| **router-agent** | Cloudflare Worker | Route optimization, swap execution | IntentRouter, PoolManager |
| **strategy-agent** | Cloudflare Worker | Template for marketplace strategies (A2A + x402) | PoolManager, x402 |

#### Agent Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER / DAO                                   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ selects
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MODULE AGENTS (Category 1)                        │
│  treasury.brand.eth  │  router.brand.eth  │  lp.brand.eth  │ ...    │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ delegates to
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   STRATEGY AGENTS (Category 2)                       │
│  strategy.router.alice.eth  │  strategy.treasury.bob.eth  │ ...     │
│  (compete on execution quality, monetize via x402)                   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ implemented by
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE AGENTS (Category 3)                        │
│  treasury-agent  │  router-agent  │  strategy-agent (template)      │
│  (Cloudflare Workers with A2A/x402 endpoints)                        │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ executes via
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ON-CHAIN CONTRACTS                              │
│  IntentRouter (Mode A)  │  AgentExecutor (Mode B)  │  ReceiptHook   │
└─────────────────────────────────────────────────────────────────────┘
```

#### MVP Scope

For the hackathon MVP, the focus is on:
- **Module**: treasury-agent (rebalancing)
- **Strategy**: routing-strategy (swap optimization)
- **Service**: treasury-agent + strategy-agent template

---

### 10) ENS naming & record schema

#### Naming convention

* `router.<brand>.eth` — execution router endpoint
* `treasury.<brand>.eth` — flagship module
* `lp.<brand>.eth` — LP rebalancer
* `vault.<brand>.eth` — managed vault
* `receipts.<brand>.eth` — receipt verifier endpoint (optional)
* `netting.<brand>.eth` — coordination module

Optional versioning:

* `router.v1.<brand>.eth`, `router.v2.<brand>.eth`
* `router.<brand>.eth` points to latest stable

#### Suggested ENS Records (minimum viable)

* `agent:type` = `router | treasury | lp | vault | netting | receipts`
* `agent:version` = `0.1.0`
* `agent:chainId` = `...`
* `agent:entrypoint` = `0x...` (contract)
* `agent:policy` = `ipfs://...` OR `0x...` (policy contract)
* `agent:receipts` = `0x...` (receipt contract)
* `agent:capabilities` = `swap,rebalance,batch,lp_manage`
* `agent:permissions` = `intent-only` (or `allowance-scoped`)
* `agent:docs` = `ipfs://...` (human-readable summary)


#### Standards interop records

* `agent:erc8004` = `eip155:<chainId>:<identityRegistryAddress>:<agentId>``
* `agent:agentURI` = `ipfs://…`` (mirror of ERC-8004 agentURI, if used)
* `agent:wallet` = `0x…`` (declared payment wallet; SHOULD match ERC-8004 agentWallet if set)

#### Additional ENS records for Safe + Roles (DAO mode)

- `agent:mode` = `intent-only | safe-roles`
- `agent:safe` = `0x...` (Safe address, for DAO mode)
- `agent:rolesModifier` = `0x...` (Roles Modifier address, if DAO mode)
- `agent:roleKey` = `<bytes32 or identifier>` (role assigned to the agent executor)
- agent:policyCompiler = `0x...` (optional: contract or endpoint that compiles templates → Roles config)


#### Optional payments records (x402)

- `agent:x402` = `https://…`` (x402-enabled endpoint, if any)
- `agent:fees` = `ipfs://…`` (fee schedule / pricing policy)
- `agent:accepts` = `USDC,…`` (accepted assets/rails; optional)


#### Optional curated discovery (ERC-8122)

- `agent:erc8122Listings` = `ipfs://…` (list of registries/collections where this agent is listed)


#### Delegated namespaces

- Support optional delegation so protocols/teams can mint sub-agents under a parent ENS name:
    - `v4.<brand>.eth ``→ `delegates treasury.v4.<brand>.eth`, `router.v4.<brand>.eth`, etc.
- Enables curated ecosystems (e.g., “approved v4 agents”) without centralizing discovery.

**Strategy discovery**

* `agent:category` = `module | strategy`
* `strategy:type` = `routing | rebalance | lp | batching`
* `strategy:baseline` = `twap | reference_route | oracle` (how performance is measured)

**x402**

* `agent:x402` = `https://…`
* `agent:pricing` = `ipfs://…` (pricing schema)
* `agent:quoteFormat` = `ipfs://…` (quote/plan payload schema)

**Receipt linkage**

* `strategy:receiptSchema` = `ipfs://…`
* `strategy:quoteIdField` = `quoteId` (name of receipt field)

---

### 11) System architecture (v0)

**Onchain**

* `PolicyRegistry` (optional): stores policy templates / hashes
* `IntentRouter` contract: validates intent + calls v4 execution
* `ReceiptEmitter` contract: emits receipt events, stores minimal receipt data
* `TreasuryModule` contract: computes rebalance amounts + submits intents


**ERC-8004 integration (identity/trust layer)**

- `ERC8004IdentityRegistry`: agent mints/registers an agentId using `register(agentURI, metadata)`; agentURI points to the Agent Record and metadata MAY include capability tags and ENS binding.
- (Optional, not required for v0) `ERC8004ReputationRegistry`: receipts can be summarized into feedback signals (e.g., success rate, uptime, slippage efficiency) if/when used.
- (Optional, not required for v0) `ERC8004ValidationRegistry`: allow third-party validators to validate a receipt batch or strategy outcome via validationRequest/validationResponse flows.

**Offchain**

* “Executor” service (if needed) that:

  * monitors triggers (time/drift)
  * submits transactions
  * posts receipt explanations
* Frontend:

  * resolves ENS
  * shows policy summary
  * lets user sign intents
  * displays receipts/verifications

**DAO mode(Safe + Roles)**

**Onchain**

- `SafeTreasury` (Gnosis Safe) holds funds
- `RolesModifier` enforces permissions over Safe execution 
- `AgentExecutor` (module or designated executor) submits transactions
- `ReceiptEmitter` links Safe tx hash → receipt event

**Offchain (optional)**
- Policy compiler tool that produces:
    - Roles configuration artifacts (targets/selectors/params)
    - human-readable "policy summary" for governance review




**Uniswap v4 integration**

Uniswap v4 is not optional—it's architecturally required. The singleton PoolManager and native hook system enable the trust anchor that makes Oikonomos work.

**Why v4 (not v3)**

* **Singleton architecture**: All pools in one contract reduces gas and enables atomic multi-hop
* **Native hooks**: First-class hook support without wrapper contracts
* **Gas efficiency**: Flash accounting eliminates intermediate transfers
* **Native ETH**: Direct ETH pools without WETH wrapping

**ReceiptHook: The Trust Anchor**

ReceiptHook is a Uniswap v4 hook that emits `ExecutionReceipt` events after every swap. This is the single source of truth for all execution claims.

```solidity
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
```

**Hook lifecycle**

1. Swap initiated via `PoolManager.swap(poolKey, params, hookData)`
2. `hookData` encodes strategy context: `abi.encode(strategyId, quoteId, maxSlippage)`
3. After swap settles, `ReceiptHook.afterSwap()` is called
4. Hook calculates actual slippage, checks policy compliance
5. Emits `ExecutionReceipt` with full execution details

**Pool requirements**

* Pools must have ReceiptHook enabled (set in `poolKey.hooks`)
* Support for native ETH pools (address(0) as token)
* Compatible with both exact-input and exact-output swaps

**Integration points**

* Mode A (Intent-First): IntentRouter calls PoolManager with user's signed constraints in hookData
* Mode B (Safe+Roles): AgentExecutor routes through Safe → Roles → PoolManager with policy bounds

---

### 12) Security & trust model

**Default posture: user-controlled**

* User signs an EIP-712 intent with constraints.
* Router can only execute what the intent permits.


**Agent identity and payment address safety (ERC-8004)**

When using ERC-8004, the agent’s payment address is represented by `agentWallet`, which is updateable only with explicit proof of control (EIP-712 for EOAs or ERC-1271 for contract wallets). This reduces spoofing risk for “pay the agent” flows and makes payment endpoints auditable when tied to ENS records.


**DAO posture: governance-controlled (Safe + Roles)**
- The agent is treated as an operator, not a custodian.
- Ultimate enforcement is performed by **Safe execution gates**:
    - even if the agent is compromised, it cannot execute transactions outside Roles policy. 

- Recommend defaults for DAO mode:
    - strict token/pool allowlists
    - max daily notional
    - mandatory slippage caps
    - emergency pause (disable role or pause executor)

**Controls**

* Circuit breaker: pause execution globally + per-module.
* Rate limits: max daily notional; max tx frequency.
* Allowlist: tokens/pools; denylist known risky assets.
* Receipt-based monitoring: alert on drift, failures, near-constraint executions.

**Threats**

* MEV / sandwich: mitigate via slippage caps, TWAP, private tx relays (optional).
* Key compromise of executor: limit via intents + caps; executor can’t exceed constraints.
* Policy misconfig: provide safe templates + simulation mode.
* Executor compromise in DAO mode: blast radius is bounded by Roles permissions; recovery path is to revoke role / disable module. 

---

### 13) UX requirements

* "One screen" agent selection via ENS + clear risk label.
* Policy is human-readable ("You will rebalance weekly; max slippage 0.3%; max $50k/day").
* Receipts are readable:

  * what you asked
  * what happened
  * did it comply
  * where the proof lives (tx hash / event)

---

### 13.1) Dashboard Specifications

This section defines the dashboard layouts for Mode A (Individual), Mode B (DAO), and the Strategy Marketplace. Each dashboard is designed around the user journeys in Section 7.

---

#### 13.1.1 Mode A Dashboard (Individual User)

**Primary Persona:** DeFi power user with EOA, managing personal holdings via intent-signing.

##### View 1: Agent Discovery & Selection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 DISCOVER AGENTS                                            [Connect Wallet] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Search: [treasury._____________.eth                    ] [Resolve]         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  treasury.oikonomos.eth                                             │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  Type: Treasury Agent          Mode: intent-only ✓ (EOA compatible) │   │
│  │  Version: 0.1.0                Chain: Sepolia (11155111)            │   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Trust Score  │  │ Avg Slippage │  │ Executions   │              │   │
│  │  │    94/100    │  │    8 bps     │  │   2,847      │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                     │   │
│  │  Capabilities: [rebalance] [swap] [stablecoin-sweep]               │   │
│  │  Supported Tokens: USDC, USDT, DAI, FRAX                           │   │
│  │                                                                     │   │
│  │  ERC-8004 Identity: agentId #42 ✓ verified                         │   │
│  │  Strategy: strategy.router.alice.eth (top 5 ranked)                │   │
│  │                                                                     │   │
│  │                                              [View Details] [Select]│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- `agent:type`, `agent:mode`, `agent:version`, `agent:chainId` from ENS
- Trust score from ERC-8004 Reputation Registry
- Avg slippage and execution count from indexed receipts
- Capabilities from A2A agent card

##### View 2: Policy Configuration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ CONFIGURE POLICY                          treasury.oikonomos.eth       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Template: [Stablecoin Rebalance ▼]                                         │
│                                                                             │
│  ┌─ TARGET ALLOCATION ──────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │   USDC  [===========================] 70%  [$70,000]                 │  │
│  │   USDT  [=========]                   20%  [$20,000]                 │  │
│  │   DAI   [===]                         10%  [$10,000]                 │  │
│  │                                                                      │  │
│  │   Current: 60/25/15        Drift: 10% ⚠️                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ CONSTRAINTS ────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │   Max Slippage:        [25] bps                                      │  │
│  │   Max Daily Notional:  [$20,000]                                     │  │
│  │   Rebalance Trigger:   [◉ Drift > 5%] [○ Weekly] [○ Both]           │  │
│  │   Deadline:            [24] hours from trigger                       │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ HUMAN-READABLE SUMMARY ─────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  "Rebalance when any asset drifts >5% from target.                   │  │
│  │   Max 25bps slippage. Max $20K moved per day.                        │  │
│  │   Allowed tokens: USDC, USDT, DAI only."                             │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ STRATEGY SELECTION ─────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  [◉] strategy.router.alice.eth    Score: 94  Slippage: 7bps  $0.10  │  │
│  │  [○] strategy.router.bob.eth      Score: 89  Slippage: 9bps  FREE   │  │
│  │  [○] Default (no strategy)        Score: --  Slippage: ~15bps       │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                    [Cancel]  [Sign Intent with Wallet →]   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- Current holdings from wallet balances
- Drift calculation (current vs target)
- Constraint inputs map to EIP-712 intent fields
- Strategy options from marketplace leaderboard

##### View 3: Active Monitoring

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 PORTFOLIO MONITOR                                    [Pause] [Revoke]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Active Policy: Stablecoin Rebalance (70/20/10)                            │
│  Agent: treasury.oikonomos.eth                                              │
│  Strategy: strategy.router.alice.eth                                        │
│  Status: ● Active                                                           │
│                                                                             │
│  ┌─ CURRENT ALLOCATION ─────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │   USDC   $69,240 (69.2%)  [========================]  Target: 70%   │  │
│  │   USDT   $20,120 (20.1%)  [=======]                   Target: 20%   │  │
│  │   DAI    $10,640 (10.6%)  [===]                       Target: 10%   │  │
│  │                                                                      │  │
│  │   Total: $100,000         Max Drift: 0.8% ✓ (threshold: 5%)         │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ EXECUTION LOG ──────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Jan 29, 14:32  Rebalance executed                                   │  │
│  │                 USDT → USDC  $8,000  Slippage: 12bps ✓               │  │
│  │                 [View Receipt →]                                     │  │
│  │                                                                      │  │
│  │  Jan 22, 09:15  Rebalance executed                                   │  │
│  │                 DAI → USDC   $3,200  Slippage: 9bps ✓                │  │
│  │                 [View Receipt →]                                     │  │
│  │                                                                      │  │
│  │  Jan 15, 11:47  Trigger detected (drift: 6.2%)                       │  │
│  │                 USDT → USDC  $5,500  Slippage: 11bps ✓               │  │
│  │                 [View Receipt →]                                     │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Daily Usage: $8,000 / $20,000 (40%)    This Month: 3 executions           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- Live wallet balances
- Drift calculation against policy target
- Indexed receipt events with timestamps
- Daily limit tracking

##### View 4: Receipt Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📝 EXECUTION RECEIPT                                        Jan 29, 14:32  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Status: ✅ Policy Compliant                                                │
│                                                                             │
│  ┌─ WHAT YOU ASKED ─────────────────────────────────────────────────────┐  │
│  │  Rebalance to 70/20/10 with max 25bps slippage                       │  │
│  │  Intent Hash: 0x7a3f...8b2c                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ WHAT HAPPENED ──────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Input:   8,000.00 USDT                                              │  │
│  │  Output:  7,990.40 USDC                                              │  │
│  │  Rate:    1 USDT = 0.9988 USDC                                       │  │
│  │                                                                      │  │
│  │  Route:   USDT → [v4 USDT/USDC 0.01%] → USDC                        │  │
│  │  Pool:    0xE03A...3543                                              │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ COMPLIANCE ─────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Slippage:      12 bps   (limit: 25 bps)    ✓ PASS                   │  │
│  │  Daily Limit:   $8,000   (limit: $20,000)   ✓ PASS                   │  │
│  │  Token:         USDT → USDC                 ✓ ALLOWED                │  │
│  │  Deadline:      Within 24h                  ✓ PASS                   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ PROOF ──────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Strategy:      strategy.router.alice.eth                            │  │
│  │  Quote ID:      0xabc...def                                          │  │
│  │  Tx Hash:       0x123...789  [View on Etherscan ↗]                   │  │
│  │  Block:         12,345,678                                           │  │
│  │  Receipt Event: ExecutionReceipt #42  [View logs ↗]                  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- All fields from `ExecutionReceipt` event
- Intent hash from signed EIP-712
- Compliance checks against policy constraints
- Direct links to on-chain verification

---

#### 13.1.2 Mode B Dashboard (DAO Treasury)

**Primary Persona:** DAO treasurer managing multi-sig holdings via Safe + Roles.

##### View 1: Treasury Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🏦 DAO TREASURY                                treasury.oikonomos.eth      │
│  Safe: 0x41675C...5C7461a                                   [Disconnect]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Total Value: $113,976,556                          Mode: safe-roles ✓      │
│                                                                             │
│  ┌─ ALLOCATION ─────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Token     Balance         Value           Share    Target   Drift   │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  USDS      44,336,415      $44,314,862     38.93%   35-40%   ✓       │  │
│  │  ETHx      6,443.68        $20,636,894     18.13%   15-20%   ✓       │  │
│  │  ETH       6,879.50        $20,436,528     17.95%   15-20%   ✓       │  │
│  │  rETH      4,300.45        $14,741,493     12.95%   10-15%   ✓       │  │
│  │  stETH     4,612.71        $13,689,182     12.03%   10-15%   ✓       │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  COMP      67.25           $1,666          0.00%    --       dust    │  │
│  │  wstETH    0.12            $442            0.00%    --       dust    │  │
│  │  BAL       0.97            $0.58           0.00%    --       dust    │  │
│  │  GRG       0.03            $0.01           0.00%    --       dust    │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Status: ● All allocations within target bands                              │
│  Last Rebalance: Jan 27, 2026 (2 days ago)                                  │
│  Next Check: Continuous monitoring (drift > 3% triggers alert)              │
│                                                                             │
│  [View Policy] [View Permissions] [Execution History] [Generate Report]     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- Safe balance via Safe SDK
- Token prices from oracles/APIs
- Policy targets from Roles configuration
- Drift calculation per asset

##### View 2: Policy & Permissions Status

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📜 ACTIVE POLICY                                       [Propose Change]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Governance Approval: Snapshot Vote #47 (Jan 15, 2026)                      │
│  Vote Result: 85% YES (12.4M tokens)                                        │
│  Execution: On-chain tx 0xdef...123 [View ↗]                                │
│                                                                             │
│  ┌─ POLICY SUMMARY (Human-Readable) ────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  "Maintain 35-40% stablecoins, 60-65% ETH + LSTs.                    │  │
│  │   Rebalance when any asset drifts >3% from target band.              │  │
│  │   Max slippage: 20bps. Max daily volume: $2M.                        │  │
│  │   Emergency pause: Steward multisig (3/5)."                          │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ ROLES PERMISSIONS (Machine-Readable) ───────────────────────────────┐  │
│  │                                                                      │  │
│  │  Role Key: 0x7a3f...treasury-executor                                │  │
│  │  Assigned To: AgentExecutor (0x9646...f337)                          │  │
│  │  Roles Modifier: 0x9646fDAD06d3e24444381f44362a3B0eB343D337          │  │
│  │                                                                      │  │
│  │  Permissions:                                                        │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │  Target           Selector        Constraint                   │ │  │
│  │  │  ────────────────────────────────────────────────────────────  │ │  │
│  │  │  UniversalRouter  swap()          tokens ∈ allowlist           │ │  │
│  │  │  UniversalRouter  execute()       amount ≤ $500K/tx            │ │  │
│  │  │  PoolManager      swap()          slippage ≤ 20bps             │ │  │
│  │  │  ────────────────────────────────────────────────────────────  │ │  │
│  │  │  Daily Limit: $2,000,000                                       │ │  │
│  │  │  Token Allowlist: USDS, ETH, ETHx, rETH, stETH, wstETH         │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Strategy: strategy.router.alice.eth (DAO-allowlisted)                      │
│  Agent: treasury.oikonomos.eth                                              │
│                                                                             │
│  [Export for Audit] [View Roles Config JSON] [Emergency Pause]              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- Governance vote reference (Snapshot/on-chain)
- Roles Modifier configuration
- Permission matrix from Zodiac Roles
- Allowlisted strategy ENS names

##### View 3: Execution Monitoring (Multi-Tranche)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ EXECUTION IN PROGRESS                                    Jan 29, 2026   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Trigger: ETH overweight by 3.5% (21.5% vs 18% target)                      │
│  Action: Rebalance $1.8M from ETH to underweight assets                     │
│  Strategy: strategy.router.alice.eth                                        │
│  Quote ID: 0xdef...789                                                      │
│                                                                             │
│  ┌─ TRANCHE EXECUTION ──────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  #   Route              Amount      Status      Slippage   Safe Tx   │  │
│  │  ─────────────────────────────────────────────────────────────────── │  │
│  │  1   ETH → USDS         $800,000    ✅ Complete  11bps     0x123...  │  │
│  │  2   ETH → rETH         $500,000    ✅ Complete  9bps      0x456...  │  │
│  │  3   ETH → stETH        $500,000    🔄 Pending   --        --        │  │
│  │  ─────────────────────────────────────────────────────────────────── │  │
│  │                                                                      │  │
│  │  Progress: ████████████████░░░░░░░░ 2/3 tranches (67%)               │  │
│  │  Executed: $1,300,000 / $1,800,000                                   │  │
│  │  Avg Slippage: 10bps (limit: 20bps) ✓                                │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ EXECUTION FLOW (Tranche 3) ─────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  AgentExecutor ──► RolesModifier ──► Safe ──► PoolManager            │  │
│  │       ✓                 ✓            🔄           ○                  │  │
│  │                                                                      │  │
│  │  Roles Check: ✅ target=UniversalRouter, amount=$500K, slippage=20bps│  │
│  │  Safe Nonce: 847                                                     │  │
│  │  Estimated Gas: 245,000                                              │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Daily Usage: $1,300,000 / $2,000,000 (65%)                                 │
│                                                                             │
│  [View All Safe Transactions] [Pause Execution] [View Receipts]             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- Trigger reason from agent monitoring
- Per-tranche status with Safe tx hashes
- Real-time execution flow visualization
- Roles permission check status
- Daily limit consumption

##### View 4: Monthly Governance Report

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 TREASURY AUTOPILOT REPORT                          January 2026         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ SUMMARY ────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Total Executions:     12                                            │  │
│  │  Total Rebalanced:     $8,420,000                                    │  │
│  │  Avg Slippage:         13 bps (limit: 20 bps)                        │  │
│  │  Policy Violations:    0                                             │  │
│  │  Estimated Savings:    ~$12,600 vs manual execution                  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ ALLOCATION HISTORY ─────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  100% ┤                                                              │  │
│  │       │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ETH + LSTs (60-65%)        │  │
│  │   60% ┤  ████████████████████████████████                            │  │
│  │       │                                                              │  │
│  │   40% ┤  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  Stablecoins (35-40%)       │  │
│  │       │                                                              │  │
│  │    0% ┼──────────────────────────────────────────────────────────    │  │
│  │       Jan 1    Jan 8    Jan 15   Jan 22   Jan 29                     │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ EXECUTION BREAKDOWN ────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Date        Trigger          Volume      Tranches  Avg Slip  Status │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  Jan 29      ETH +3.5%        $1.8M       3/3       10bps     ✅     │  │
│  │  Jan 22      rETH -3.2%       $920K       2/2       14bps     ✅     │  │
│  │  Jan 15      USDS -4.1%       $1.2M       3/3       11bps     ✅     │  │
│  │  Jan 08      stETH +3.8%      $780K       2/2       15bps     ✅     │  │
│  │  ...                                                                 │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ STRATEGY PERFORMANCE ───────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  strategy.router.alice.eth                                           │  │
│  │  ─────────────────────────────────────────────────────────────────── │  │
│  │  Executions for DAO:  12          Slippage vs Limit:  35% headroom   │  │
│  │  Success Rate:        100%        Gas Efficiency:     +12% vs avg    │  │
│  │  Fees Paid (x402):    $84         Est. Savings:       ~$12,600       │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [Export PDF] [Export CSV] [Share with Governance] [View All Receipts]      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- Aggregated receipt data for reporting period
- Allocation chart from historical snapshots
- Per-execution breakdown with Safe tx references
- Strategy performance vs baseline

---

#### 13.1.3 Strategy Marketplace Dashboard

**Primary Personas:** Strategy providers (listing), Users/DAOs (selecting)

##### View 1: Leaderboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🏆 STRATEGY MARKETPLACE                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Category: [All ▼]  Chain: [Sepolia ▼]  Sort: [Score ▼]      [List Yours]  │
│                                                                             │
│  ┌─ ROUTING STRATEGIES ─────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  #   Strategy                    Score  Slippage  Volume     Price   │  │
│  │  ─────────────────────────────────────────────────────────────────── │  │
│  │  🥇  strategy.router.alice.eth   97     6 bps     $142M      0.3bps  │  │
│  │      Specializes in stablecoins • MEV-protected • 4,200 executions   │  │
│  │      [View] [Select]                                                 │  │
│  │                                                                      │  │
│  │  🥈  strategy.router.bob.eth     94     7 bps     $89M       FREE    │  │
│  │      General purpose • Fast execution • 2,800 executions             │  │
│  │      [View] [Select]                                                 │  │
│  │                                                                      │  │
│  │  🥉  strategy.router.charlie.eth 91     8 bps     $56M       0.2bps  │  │
│  │      LST specialist • Curve integration • 1,900 executions           │  │
│  │      [View] [Select]                                                 │  │
│  │                                                                      │  │
│  │  4   strategy.router.delta.eth   89     9 bps     $34M       FREE    │  │
│  │      New entrant • Growing fast • 890 executions                     │  │
│  │      [View] [Select]                                                 │  │
│  │                                                                      │  │
│  │  5   strategy.router.echo.eth    85     11 bps    $21M       0.1bps  │  │
│  │      Budget option • Basic routing • 2,100 executions                │  │
│  │      [View] [Select]                                                 │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ REBALANCE STRATEGIES ───────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  #   Strategy                    Score  Tracking  Volume     Price   │  │
│  │  ─────────────────────────────────────────────────────────────────── │  │
│  │  🥇  strategy.treasury.frank.eth 95     0.8%      $67M       $50/mo  │  │
│  │      DAO-focused • Multi-tranche • Governance reports included       │  │
│  │      [View] [Select]                                                 │  │
│  │                                                                      │  │
│  │  ...                                                                 │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Showing 12 strategies • Data from 847,000 receipts • Updated 5 min ago    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- Aggregated scores from ERC-8004 Reputation Registry
- Avg slippage from indexed receipts
- Total volume from receipt `amount` fields
- Pricing from `agent:x402` endpoint

##### View 2: Strategy Detail Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  strategy.router.alice.eth                                      Rank: #1   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ IDENTITY ───────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  ENS Name:       strategy.router.alice.eth                           │  │
│  │  ERC-8004 ID:    agentId #127 ✓ verified                             │  │
│  │  Type:           routing-strategy                                    │  │
│  │  Version:        1.2.0                                               │  │
│  │  Chain:          Sepolia (11155111)                                  │  │
│  │  Operator:       alice.eth (0x742d...35Fa)                           │  │
│  │                                                                      │  │
│  │  A2A Endpoint:   https://alice-router.workers.dev/a2a                │  │
│  │  x402 Endpoint:  https://alice-router.workers.dev/x402               │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ PERFORMANCE (Last 30 Days) ─────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │ Trust Score│  │ Avg Slip   │  │ Success    │  │ Volume     │     │  │
│  │  │    97/100  │  │   6 bps    │  │   99.8%    │  │  $18.4M    │     │  │
│  │  │  ▲ +2      │  │  ▼ -1bps   │  │  ═ same    │  │  ▲ +22%    │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │  │
│  │                                                                      │  │
│  │  Slippage Distribution:                                              │  │
│  │  0-5bps  ████████████████████████████  68%                          │  │
│  │  5-10bps ██████████░░░░░░░░░░░░░░░░░░  28%                          │  │
│  │  10-15bps███░░░░░░░░░░░░░░░░░░░░░░░░░  4%                           │  │
│  │  >15bps  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0%                           │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ CAPABILITIES ───────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Specializations:                                                    │  │
│  │  [✓] Stablecoin swaps    [✓] MEV protection    [✓] Multi-hop        │  │
│  │  [✓] LST routing         [○] LP management     [○] Batching         │  │
│  │                                                                      │  │
│  │  Supported Tokens: USDC, USDT, DAI, FRAX, ETH, stETH, rETH, wstETH  │  │
│  │  Supported Pools: Uniswap v4, Curve (via aggregator)                │  │
│  │                                                                      │  │
│  │  Policy Compatibility:                                               │  │
│  │  [✓] slippage caps    [✓] token allowlists    [✓] daily limits     │  │
│  │  [✓] deadline         [✓] Safe+Roles          [✓] intent-only      │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ PRICING ────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Tier          Fee         Includes                                  │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  Basic         FREE        Standard routing, no MEV protection       │  │
│  │  Pro           0.3 bps     MEV protection, optimized paths           │  │
│  │  Enterprise    $200/mo     Dedicated support, custom integration     │  │
│  │                                                                      │  │
│  │  Payment: USDC (Base Sepolia) via x402                               │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ RECENT EXECUTIONS (Public Receipts) ────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Time          Pair           Volume    Slippage   Compliant         │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  2 min ago     USDT→USDC      $45,000   4 bps      ✅                │  │
│  │  8 min ago     ETH→stETH      $120,000  7 bps      ✅                │  │
│  │  15 min ago    DAI→USDC       $28,000   3 bps      ✅                │  │
│  │  22 min ago    USDC→rETH      $89,000   8 bps      ✅                │  │
│  │  ...                                                                 │  │
│  │                                                                      │  │
│  │  [View All 4,247 Receipts →]                                         │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [Select for Mode A] [Add to DAO Allowlist Proposal] [Contact Operator]    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- ENS text records for identity
- ERC-8004 agentId and verification status
- Performance metrics from Reputation Registry
- Capabilities from A2A agent card
- Pricing from x402 endpoint
- Recent receipts from indexer

##### View 3: Strategy Provider Dashboard (My Strategy)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📈 MY STRATEGY                                   strategy.router.alice.eth │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ REVENUE (January 2026) ─────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │ Total Rev  │  │ Executions │  │ Volume     │  │ Avg Fee    │     │  │
│  │  │  $8,420    │  │   2,847    │  │  $28.1M    │  │  0.3 bps   │     │  │
│  │  │  ▲ +18%    │  │  ▲ +12%    │  │  ▲ +22%    │  │  ═ same    │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │  │
│  │                                                                      │  │
│  │  Revenue by Tier:                                                    │  │
│  │  Pro (0.3bps)    ████████████████████████  $7,140 (85%)             │  │
│  │  Enterprise      ████░░░░░░░░░░░░░░░░░░░░  $1,000 (12%)             │  │
│  │  Basic (free)    █░░░░░░░░░░░░░░░░░░░░░░░  $280 tips (3%)           │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ REPUTATION HEALTH ──────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Current Score: 97/100 (Rank #1)                                     │  │
│  │                                                                      │  │
│  │  Score Breakdown:                                                    │  │
│  │  ├─ Slippage Performance    32/35  ████████████████████████████░░   │  │
│  │  ├─ Success Rate            25/25  ██████████████████████████████   │  │
│  │  ├─ Policy Compliance       25/25  ██████████████████████████████   │  │
│  │  └─ Volume/Reliability      15/15  ██████████████████████████████   │  │
│  │                                                                      │  │
│  │  ⚠️  Slippage crept up 1bps this week - consider optimizing routes  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ USER BREAKDOWN ─────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Type              Users    Volume      Avg Trade    Retention       │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  DAO Treasuries    8        $18.2M      $1.2M        100%            │  │
│  │  Individuals       412      $9.9M       $24K         78%             │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  Total             420      $28.1M                                   │  │
│  │                                                                      │  │
│  │  Top DAOs:                                                           │  │
│  │  1. treasury.ens.eth          $8.4M this month                       │  │
│  │  2. treasury.compound.eth     $4.2M this month                       │  │
│  │  3. treasury.aave.eth         $3.1M this month                       │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ ALERTS ─────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  ⚠️  Jan 28: Slippage exceeded 15bps on 2 trades (still compliant)  │  │
│  │  ✅  Jan 25: Added to compound.eth DAO allowlist                     │  │
│  │  ✅  Jan 20: Reached 4,000 lifetime executions                       │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [Update Pricing] [Edit Capabilities] [View All Receipts] [Withdraw Fees]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- Revenue from x402 payment logs
- Execution count and volume from receipts
- Score breakdown from Reputation Registry algorithm
- User segmentation from receipt analysis
- Alerts from monitoring system

##### View 4: Strategy Comparison Tool

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚖️ COMPARE STRATEGIES                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Comparing for: Stablecoin rebalance ($100K portfolio, 20bps max slippage) │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Metric              alice.eth      bob.eth       charlie.eth        │  │
│  │  ────────────────────────────────────────────────────────────────── │  │
│  │  Trust Score         97 🥇          94            91                 │  │
│  │  Avg Slippage        6 bps 🥇       7 bps         8 bps              │  │
│  │  Success Rate        99.8%          99.5%         99.2%              │  │
│  │  30d Volume          $18.4M 🥇      $12.1M        $8.7M              │  │
│  │  Total Executions    4,247 🥇       2,891         1,923              │  │
│  │  ────────────────────────────────────────────────────────────────── │  │
│  │  Stablecoin Focus    ✓ Specialist   General       General            │  │
│  │  MEV Protection      ✓ Yes          ✗ No          ✓ Yes              │  │
│  │  Safe+Roles Support  ✓ Yes          ✓ Yes         ✓ Yes              │  │
│  │  ────────────────────────────────────────────────────────────────── │  │
│  │  Price (per trade)   0.3 bps        FREE          0.2 bps            │  │
│  │  Est. Cost ($100K)   $30/year       $0            $20/year           │  │
│  │  Est. Savings*       $450/year 🥇   $280/year     $340/year          │  │
│  │  ────────────────────────────────────────────────────────────────── │  │
│  │  NET BENEFIT         +$420/year 🥇  +$280/year    +$320/year         │  │
│  │                                                                      │  │
│  │  * vs default routing (avg 15bps slippage)                           │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Recommendation: strategy.router.alice.eth                                  │
│  Reason: Best slippage performance for stablecoin trades, MEV protection   │
│          justifies the 0.3bps premium with $420/year net savings.          │
│                                                                             │
│  [Select alice.eth] [Select bob.eth] [Select charlie.eth] [Back to List]   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data fields:**
- Side-by-side metrics from Reputation Registry
- Capability comparison from A2A agent cards
- Cost/benefit analysis based on user's portfolio size
- Recommendation algorithm based on use case

---

#### 13.1.4 Dashboard Data Sources Summary

| Dashboard Component | Primary Data Source | Update Frequency |
|---------------------|---------------------|------------------|
| Agent discovery | ENS text records | On-demand |
| Trust scores | ERC-8004 Reputation Registry | Every block |
| Execution history | Indexed `ExecutionReceipt` events | Real-time |
| Portfolio balances | Wallet/Safe RPC calls | 15 seconds |
| Policy/Roles config | Zodiac Roles Modifier state | On-change |
| Strategy metrics | Aggregated receipt data | 5 minutes |
| Revenue tracking | x402 payment logs | Real-time |
| Safe transactions | Safe Transaction Service API | Real-time |

---

#### 13.1.5 Strategy Submission Wizard

**Purpose:** Enable anyone to list a strategy on the marketplace through a guided onboarding flow.

##### Step 1: Connect & Verify Ownership

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🚀 LIST YOUR STRATEGY                                          Step 1 of 6 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ CONNECT WALLET ─────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Connect the wallet that will operate your strategy.                 │  │
│  │  This address will:                                                  │  │
│  │  • Receive x402 payments                                             │  │
│  │  • Sign ERC-8004 identity registration                               │  │
│  │  • Be displayed as the strategy operator                             │  │
│  │                                                                      │  │
│  │                      [Connect Wallet]                                │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ VERIFY ENS OWNERSHIP ───────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Your strategy needs an ENS name for discovery.                      │  │
│  │                                                                      │  │
│  │  ENS Name: [strategy.router._____________.eth    ] [Check]           │  │
│  │                                                                      │  │
│  │  Recommended format:                                                 │  │
│  │  • strategy.router.yourname.eth   (for routing strategies)           │  │
│  │  • strategy.treasury.yourname.eth (for rebalance strategies)         │  │
│  │  • strategy.lp.yourname.eth       (for LP strategies)                │  │
│  │                                                                      │  │
│  │  Don't have an ENS name? [Register on ENS App ↗]                     │  │
│  │                                                                      │  │
│  │  ─────────────────────────────────────────────────────────────────── │  │
│  │                                                                      │  │
│  │  ✅ strategy.router.alice.eth                                        │  │
│  │     Owner: 0x742d...35Fa ✓ (matches connected wallet)                │  │
│  │     Available for registration                                       │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                    [Back] [Continue →]      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Validation:**
- Wallet connected
- ENS name resolves to connected wallet address
- ENS name follows recommended naming convention (warning if not)
- ENS name not already registered in marketplace

##### Step 2: Deploy or Connect Strategy Endpoint

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🚀 LIST YOUR STRATEGY                                          Step 2 of 6 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  How would you like to set up your strategy?                                │
│                                                                             │
│  ┌─ OPTION A: USE TEMPLATE (Recommended for new strategies) ────────────┐  │
│  │                                                                      │  │
│  │  Deploy a pre-built strategy template to Cloudflare Workers.         │  │
│  │  Customizable, production-ready, includes A2A + x402 support.        │  │
│  │                                                                      │  │
│  │  Template: [Stablecoin Router ▼]                                     │  │
│  │                                                                      │  │
│  │  Available templates:                                                │  │
│  │  • Stablecoin Router — optimized for stable-to-stable swaps          │  │
│  │  • General Router — multi-token routing via v4 pools                 │  │
│  │  • LST Router — specialized for liquid staking tokens                │  │
│  │  • Treasury Rebalancer — drift-based portfolio rebalancing           │  │
│  │                                                                      │  │
│  │  [Deploy with create-8004-agent CLI →]                               │  │
│  │                                                                      │  │
│  │  CLI command:                                                        │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │ npx create-8004-agent@latest \                                 │ │  │
│  │  │   --template stablecoin-router \                               │ │  │
│  │  │   --name strategy.router.alice.eth \                           │ │  │
│  │  │   --chain sepolia                                              │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ OPTION B: CONNECT EXISTING ENDPOINT (Advanced) ─────────────────────┐  │
│  │                                                                      │  │
│  │  Already have a strategy service running? Connect it here.           │  │
│  │                                                                      │  │
│  │  A2A Endpoint:  [https://______________________/a2a    ]             │  │
│  │  x402 Endpoint: [https://______________________/x402   ] (optional)  │  │
│  │                                                                      │  │
│  │  Requirements:                                                       │  │
│  │  • Must implement A2A agent-card endpoint                            │  │
│  │  • Must respond to quote/plan requests                               │  │
│  │  • Must emit receipts with correct strategyId                        │  │
│  │                                                                      │  │
│  │  [Test Connection]                                                   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ CONNECTION TEST RESULTS ────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  A2A Health Check:                                                   │  │
│  │  ✅ GET /.well-known/agent-card.json — 200 OK                        │  │
│  │  ✅ Agent type: routing-strategy                                     │  │
│  │  ✅ Capabilities declared: quote, execute, explain                   │  │
│  │                                                                      │  │
│  │  x402 Check:                                                         │  │
│  │  ✅ Endpoint responds with pricing info                              │  │
│  │  ✅ Accepts USDC on Base Sepolia                                     │  │
│  │                                                                      │  │
│  │  Quote Test:                                                         │  │
│  │  ✅ Returns valid quote for USDC→USDT swap                           │  │
│  │  ✅ Quote includes quoteId for receipt binding                       │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                    [Back] [Continue →]      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Validation:**
- A2A endpoint returns valid agent-card.json
- Endpoint responds to health checks
- Quote generation returns properly formatted response
- x402 endpoint (if provided) returns valid pricing

##### Step 3: Register On-Chain Identity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🚀 LIST YOUR STRATEGY                                          Step 3 of 6 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Register your strategy's on-chain identity for trust and reputation.      │
│                                                                             │
│  ┌─ ERC-8004 IDENTITY REGISTRATION ─────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  This creates a verifiable on-chain identity for your strategy.      │  │
│  │  Users can check your reputation score before selecting you.         │  │
│  │                                                                      │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │  agentURI:     ipfs://Qm...abc123                            │   │  │
│  │  │  (Auto-generated from your endpoint metadata)                │   │  │
│  │  │                                                              │   │  │
│  │  │  Contents:                                                   │   │  │
│  │  │  {                                                           │   │  │
│  │  │    "name": "strategy.router.alice.eth",                      │   │  │
│  │  │    "type": "routing-strategy",                               │   │  │
│  │  │    "version": "1.0.0",                                       │   │  │
│  │  │    "capabilities": ["quote", "execute", "explain"],          │   │  │
│  │  │    "endpoints": {                                            │   │  │
│  │  │      "a2a": "https://alice-router.workers.dev/a2a",          │   │  │
│  │  │      "x402": "https://alice-router.workers.dev/x402"         │   │  │
│  │  │    }                                                         │   │  │
│  │  │  }                                                           │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │  [Edit Metadata] [Upload to IPFS]                                    │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ ENS TEXT RECORDS ───────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  The following records will be set on strategy.router.alice.eth:     │  │
│  │                                                                      │  │
│  │  Record                  Value                                       │  │
│  │  ─────────────────────────────────────────────────────────────────── │  │
│  │  agent:type              routing-strategy                            │  │
│  │  agent:version           1.0.0                                       │  │
│  │  agent:chainId           11155111                                    │  │
│  │  agent:a2a               https://alice-router.workers.dev/a2a        │  │
│  │  agent:x402              https://alice-router.workers.dev/x402       │  │
│  │  agent:erc8004           eip155:11155111:0xReg:128                   │  │
│  │  agent:category          strategy                                    │  │
│  │  strategy:type           routing                                     │  │
│  │  strategy:baseline       twap                                        │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ TRANSACTIONS REQUIRED ──────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  1. Mint ERC-8004 agentId                          ~0.002 ETH        │  │
│  │  2. Set ENS text records (9 records)               ~0.005 ETH        │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  Total estimated gas:                              ~0.007 ETH        │  │
│  │                                                                      │  │
│  │  [Sign & Submit Transactions]                                        │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                    [Back] [Continue →]      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Transactions:**
1. Upload agentURI to IPFS
2. Call `IdentityRegistry.register(agentURI, metadata)`
3. Set ENS text records via multicall

##### Step 4: Declare Capabilities & Compatibility

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🚀 LIST YOUR STRATEGY                                          Step 4 of 6 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Tell users what your strategy can do and which policies it supports.       │
│                                                                             │
│  ┌─ STRATEGY TYPE ──────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Primary type: (select one)                                          │  │
│  │                                                                      │  │
│  │  [◉] Routing Strategy     — swap path optimization                   │  │
│  │  [○] Rebalance Strategy   — portfolio drift management               │  │
│  │  [○] LP Strategy          — liquidity position management            │  │
│  │  [○] Batching Strategy    — netting and aggregation                  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ SPECIALIZATIONS ────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  What does your strategy specialize in? (select all that apply)      │  │
│  │                                                                      │  │
│  │  [✓] Stablecoin swaps        [✓] MEV protection                      │  │
│  │  [✓] LST routing             [○] Cross-pool arbitrage                │  │
│  │  [○] Large trade splitting   [✓] Gas optimization                    │  │
│  │  [○] Multi-hop routing       [○] Private mempool                     │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ SUPPORTED TOKENS ───────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Which tokens can your strategy route? (select all that apply)       │  │
│  │                                                                      │  │
│  │  Stablecoins:                                                        │  │
│  │  [✓] USDC    [✓] USDT    [✓] DAI    [✓] FRAX    [○] LUSD            │  │
│  │                                                                      │  │
│  │  ETH & LSTs:                                                         │  │
│  │  [✓] ETH     [✓] stETH   [✓] rETH   [✓] wstETH  [○] cbETH           │  │
│  │                                                                      │  │
│  │  Other:                                                              │  │
│  │  [○] WBTC    [○] LINK    [○] UNI    [+ Add custom token]            │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ POLICY COMPATIBILITY ───────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Which policy constraints does your strategy respect?                │  │
│  │  (Users will filter strategies by these capabilities)                │  │
│  │                                                                      │  │
│  │  [✓] Slippage caps          — enforce max slippage parameter         │  │
│  │  [✓] Token allowlists       — only trade specified tokens            │  │
│  │  [✓] Daily notional limits  — respect max daily volume               │  │
│  │  [✓] Deadline enforcement   — complete before deadline               │  │
│  │  [✓] Intent-only mode       — support EOA signed intents             │  │
│  │  [✓] Safe+Roles mode        — work with Zodiac Roles Modifier        │  │
│  │                                                                      │  │
│  │  ⚠️  Strategies that don't support Safe+Roles cannot be used by DAOs │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                    [Back] [Continue →]      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Stored in:**
- A2A agent-card.json (capabilities)
- ENS text records (strategy:type, supported tokens)
- ERC-8004 agentURI metadata

##### Step 5: Configure Pricing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🚀 LIST YOUR STRATEGY                                          Step 5 of 6 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Set your pricing model. You can offer free and paid tiers.                 │
│                                                                             │
│  ┌─ PRICING MODEL ──────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  How do you want to charge for your strategy?                        │  │
│  │                                                                      │  │
│  │  [✓] Free tier              Always offer a basic free option         │  │
│  │  [✓] Per-trade fee          Charge per execution (in bps)            │  │
│  │  [○] Subscription           Monthly fee for premium access           │  │
│  │  [○] Performance fee        % of savings vs baseline (v1+)           │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ TIER CONFIGURATION ─────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  ┌─ FREE TIER ────────────────────────────────────────────────────┐ │  │
│  │  │                                                                │ │  │
│  │  │  Name:     [Basic                    ]                         │ │  │
│  │  │  Fee:      FREE                                                │ │  │
│  │  │  Includes: [Standard routing, no MEV protection       ]        │ │  │
│  │  │                                                                │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                      │  │
│  │  ┌─ PAID TIER ────────────────────────────────────────────────────┐ │  │
│  │  │                                                                │ │  │
│  │  │  Name:     [Pro                      ]                         │ │  │
│  │  │  Fee:      [0.3] bps per trade                                 │ │  │
│  │  │  Includes: [MEV protection, optimized multi-hop paths ]        │ │  │
│  │  │                                                                │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                      │  │
│  │  [+ Add another tier]                                                │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ PAYMENT SETTINGS ───────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Accepted payment:                                                   │  │
│  │  [✓] USDC (Base Sepolia)    — recommended, most liquid               │  │
│  │  [○] ETH (Sepolia)          — gas token payments                     │  │
│  │  [○] DAI (Sepolia)          — stablecoin alternative                 │  │
│  │                                                                      │  │
│  │  Payment address: 0x742d...35Fa (your connected wallet)              │  │
│  │  [Use different address]                                             │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ PRICING PREVIEW ────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  How users will see your pricing:                                    │  │
│  │                                                                      │  │
│  │  strategy.router.alice.eth                                           │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  Basic (FREE)    Standard routing                                    │  │
│  │  Pro (0.3 bps)   MEV protection, optimized paths                     │  │
│  │                                                                      │  │
│  │  Example: $100K trade                                                │  │
│  │  • Basic: $0                                                         │  │
│  │  • Pro: $30                                                          │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                    [Back] [Continue →]      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Stored in:**
- x402 endpoint configuration
- ENS text record: `agent:pricing` → IPFS hash of pricing schema

##### Step 6: Test & Submit

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🚀 LIST YOUR STRATEGY                                          Step 6 of 6 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Final verification before your strategy goes live.                         │
│                                                                             │
│  ┌─ SANDBOX TEST ───────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  We'll run a test execution to verify your strategy works correctly. │  │
│  │                                                                      │  │
│  │  Test parameters:                                                    │  │
│  │  • Swap: 100 USDC → USDT                                             │  │
│  │  • Max slippage: 50 bps                                              │  │
│  │  • Network: Sepolia (testnet)                                        │  │
│  │                                                                      │  │
│  │  [Run Sandbox Test]                                                  │  │
│  │                                                                      │  │
│  │  ─────────────────────────────────────────────────────────────────── │  │
│  │                                                                      │  │
│  │  Test Results:                                                       │  │
│  │                                                                      │  │
│  │  1. Quote Generation                                                 │  │
│  │     ✅ Received valid quote                                          │  │
│  │     ✅ quoteId: 0xtest...123                                         │  │
│  │     ✅ Expected slippage: 8 bps                                      │  │
│  │                                                                      │  │
│  │  2. Execution                                                        │  │
│  │     ✅ Transaction submitted                                         │  │
│  │     ✅ Swap completed successfully                                   │  │
│  │     ✅ Actual slippage: 9 bps (within tolerance)                     │  │
│  │                                                                      │  │
│  │  3. Receipt Verification                                             │  │
│  │     ✅ ExecutionReceipt event emitted                                │  │
│  │     ✅ strategyId matches: strategy.router.alice.eth                 │  │
│  │     ✅ quoteId matches: 0xtest...123                                 │  │
│  │     ✅ policyCompliant: true                                         │  │
│  │                                                                      │  │
│  │  ✅ ALL TESTS PASSED                                                 │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ SUBMISSION SUMMARY ─────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Strategy:        strategy.router.alice.eth                          │  │
│  │  Type:            Routing Strategy                                   │  │
│  │  ERC-8004 ID:     agentId #128                                       │  │
│  │  Operator:        0x742d...35Fa                                      │  │
│  │                                                                      │  │
│  │  Capabilities:    Stablecoin swaps, MEV protection, LST routing      │  │
│  │  Supported:       USDC, USDT, DAI, FRAX, ETH, stETH, rETH, wstETH   │  │
│  │  Policy modes:    Intent-only ✓, Safe+Roles ✓                        │  │
│  │                                                                      │  │
│  │  Pricing:         Free (Basic), 0.3 bps (Pro)                        │  │
│  │  Payment:         USDC on Base Sepolia                               │  │
│  │                                                                      │  │
│  │  Initial rank:    Unranked (builds with executions)                  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ TERMS ──────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  [✓] I understand my strategy's performance will be publicly         │  │
│  │      tracked via on-chain receipts                                   │  │
│  │                                                                      │  │
│  │  [✓] I understand my reputation score depends on actual execution    │  │
│  │      quality, not marketing claims                                   │  │
│  │                                                                      │  │
│  │  [✓] I will maintain my strategy endpoint with reasonable uptime     │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                         [Back] [🚀 Submit & Go Live]        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Verification checks:**
1. Quote generation works
2. Execution completes successfully
3. Receipt emitted with correct `strategyId`
4. `quoteId` properly linked between quote and receipt
5. `policyCompliant` flag set correctly

##### Post-Submission: Success Screen

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎉 STRATEGY LISTED SUCCESSFULLY                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ✓                                              │
│                                                                             │
│              strategy.router.alice.eth is now live!                         │
│                                                                             │
│  ┌─ WHAT'S NEXT ────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  1. Your strategy appears on the marketplace (unranked)              │  │
│  │                                                                      │  │
│  │  2. As users select your strategy, executions build your reputation: │  │
│  │     • 10 executions → Initial ranking                                │  │
│  │     • 100 executions → Visible on leaderboard                        │  │
│  │     • 1000 executions → Eligible for "Verified" badge                │  │
│  │                                                                      │  │
│  │  3. Monitor your performance in the Strategy Provider Dashboard      │  │
│  │                                                                      │  │
│  │  4. Optimize based on receipt data to climb the rankings             │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ QUICK LINKS ────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  [View on Marketplace]     [Open Provider Dashboard]                 │  │
│  │                                                                      │  │
│  │  [Share on Twitter]        [Copy Strategy Link]                      │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Your strategy link:                                                        │
│  https://oikonomos.xyz/strategy/strategy.router.alice.eth                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### Wizard Data Flow Summary

```
Step 1 (Connect)     → Wallet address, ENS name ownership
        ↓
Step 2 (Deploy)      → A2A endpoint URL, x402 endpoint URL
        ↓
Step 3 (Identity)    → ERC-8004 agentId, ENS text records, IPFS agentURI
        ↓
Step 4 (Capabilities)→ Strategy type, tokens, policy compatibility
        ↓
Step 5 (Pricing)     → x402 configuration, payment address
        ↓
Step 6 (Test)        → Sandbox execution, receipt verification
        ↓
LIVE                 → Strategy appears on marketplace leaderboard
```

##### Wizard Implementation Requirements

| Step | On-chain Actions | Off-chain Actions |
|------|------------------|-------------------|
| 1 | — | Verify ENS ownership via RPC |
| 2 | — | Test A2A/x402 endpoint connectivity |
| 3 | Mint ERC-8004 agentId, Set ENS records | Upload agentURI to IPFS |
| 4 | Update ENS records | Update A2A agent-card |
| 5 | — | Configure x402 endpoint |
| 6 | Execute test swap | Verify receipt emission |

---

### 14) Metrics of success

**Hackathon / v0**

* ✅ Can resolve ENS → call router → execute swap on v4 → emit receipt.
* ✅ Treasury module performs at least one rebalance end-to-end.
* ✅ Receipts show policy compliance and are verifiable from chain data.

**Post-hack**

* The # of integrations using ENS resolution
* The # of successful intents executed / receipts generated
* Mean slippage vs limit; % of failed intents (should be low, and explainable)
* Time-to-integrate for a new app (goal: < 30 minutes)

---

### 15) MVP scope (what to build first)

**Must ship**

1. ENS schema + example names live on testnet
2. IntentRouter + ReceiptEmitter
3. TreasuryModule (simple stablecoin rebalance)
4. Minimal UI: choose agent, set policy, execute, view receipt

**Demo-only (optional)**

* LP rebalancer as a stub module with read-only “plan generation”
* Netting module as a “batch intent builder” without full settlement

---

### 16) Roadmap

**v0 (hackathon)**

* One chain, one v4 deployment, stablecoin rebalance,  Identity Bridge implemented + demonstrated end-to-end (ENS ↔ ERC-8004 ↔ receipt).
x402 and ERC-8122 only as metadata hooks (no full dependency).

**v1**

* LP rebalancer module + managed vault module
* Better routing (multi-pool) + improved MEV protections
* Richer policy templates + simulation mode
* Optional x402-paid offchain services (executor/monitoring/simulation).
* Optional curated discovery via ERC-8122 registries for “approved agents.”
* Optional ERC-8004 validation requests for “receipt batch verification.”

**v2**

* Coordination/netting module fully operational
* Multi-chain support + cross-domain policy publishing
* Enterprise-grade reporting + compliance hooks (optional)
* Define a convention for publishing per-chain endpoints:
    - either multiple names (router.base.<brand>.eth, router.eth.<brand>.eth)
    - or a single name with multi-chain metadata in agent:entrypoints JSON

---

### 17) Open questions (resolve as you build)

* Do we want a dedicated onchain `AgentRegistry` ckeep it ENS-only in v0?
* Is the executor fully offchain, or do we support keeper networks?
* Which “receipt standard” format do we want (custom events vs something EIP-aligned)?
* Do we implement a first-party "policy → Roles compiler" in v0, or ship a reference script/config format for Roles setup?
* What is the minimal Roles permissions surface for v0 (tokens, max notional, selectors, cadence), and what's deferred to v1? 

---

# Sources:

- https://github.com/ensdomains/docs/blob/master/src/public/governance/dao-investment-policy.pdf
- https://eips.ethereum.org/EIPS/eip-8004 
- https://ens.domains/blog/post/ens-ai-agent-erc8004



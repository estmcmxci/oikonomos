# End-to-End Testing Requirements
## Complete System Integration & Validation

**Status:** 🟡 **~80% Complete** - Core infrastructure exists, execution path needs implementation

**Last Updated:** January 30, 2026

---

## Executive Summary

This document outlines the requirements for completing and testing the end-to-end flow of the Oikonomos system. While approximately 80% of the functionality is implemented, critical gaps in the execution path prevent full E2E testing. This document identifies what works, what's missing, and provides a comprehensive plan to achieve a working end-to-end flow.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Critical Gaps](#2-critical-gaps)
3. [Implementation Requirements](#3-implementation-requirements)
4. [Deployment & Setup Requirements](#4-deployment--setup-requirements)
5. [End-to-End Test Flow](#5-end-to-end-test-flow)
6. [Success Criteria](#6-success-criteria)
7. [Testing Checklist](#7-testing-checklist)

---

## 1. Current State Analysis

### ✅ What Works

#### 1.1 Contract Infrastructure
- **ReceiptHook**: Fully implemented, emits `ExecutionReceipt` events with strategy attribution
- **IdentityRegistry**: ERC-8004 compliant, manages agent identities (`agentId`, `agentURI`, `agentWallet`)
- **IntentRouter**: Contract structure complete, validates EIP-712 signatures, manages nonces
- **HookDataLib**: Encodes/decodes hook data (strategyId, quoteId, maxSlippage)

#### 1.2 Indexer Infrastructure
- **Ponder Setup**: Configured to listen for `ExecutionReceipt` and `AgentRegistered` events
- **Database Schema**: `executionReceipt`, `strategyMetrics`, `agent` tables defined
- **API Endpoints**: REST API with routes for:
  - `/receipts/:strategyId` - Get receipts by strategy
  - `/receipts/user/:sender` - Get receipts by user
  - `/receipt/:id` - Get single receipt
  - `/strategies/:strategyId` - Get strategy metrics
  - `/leaderboard` - Top strategies by volume/compliance/executions
  - `/agents/:agentId` - Get agent by ID

#### 1.3 Agent Infrastructure
- **treasury-agent** (Cloudflare Worker):
  - `/configure` - Policy configuration endpoint
  - `/check-triggers` - Drift detection
  - `/rebalance` - Rebalance execution (with concurrency protection)
  - `/health` - Health check
  - Intent building and signing logic (`buildAndSignIntent`)
- **strategy-agent** (Cloudflare Worker):
  - `/.well-known/agent-card.json` - A2A discovery
  - `/quote` - Quote generation
  - `/execute` - Execution endpoint
  - `/pricing` - Pricing information
  - `/health` - Health check

#### 1.4 SDK & Frontend
- **ENS Resolution**: SDK can resolve ENS names to agent records
- **Text Record Parsing**: Extracts `agent:erc8004`, `agent:type`, `agent:entrypoint`, etc.
- **Dashboard API Routes**: `/api/resolve` for ENS resolution

#### 1.5 Deployment Scripts
- `00_DeployReceiptHook.s.sol` - Deploy ReceiptHook
- `01_DeployIdentity.s.sol` - Deploy IdentityRegistry
- `02_DeployIntentRouter.s.sol` - Deploy IntentRouter
- `03_DeployAll.s.sol` - Deploy all contracts
- `DeploySepolia.s.sol` - Production Sepolia deployment

---

## 2. Critical Gaps

### 🔴 **CRITICAL: IntentRouter Doesn't Execute Swaps**

**Location:** `packages/contracts/src/policy/IntentRouter.sol:110-122`

**Current Code:**
```solidity
// 7. Execute swap via PoolManager
// Note: In production, this would integrate with UniversalRouter or custom unlock callback
// For MVP, we emit the event and return placeholder
// The actual swap execution depends on v4 integration pattern

// Silence unused variable warnings
poolKey;
hookData;

emit IntentExecuted(intentHash, intent.user, intent.strategyId, intent.amountIn, 0);

return 0; // Placeholder - actual amount would come from swap
```

**Impact:** 
- ❌ No swap is executed
- ❌ `ReceiptHook.afterSwap()` is never called
- ❌ No `ExecutionReceipt` event is emitted
- ❌ Indexer has nothing to index
- ❌ Dashboard has no receipts to display

**Required Fix:**
- Implement actual `PoolManager.swap()` call
- Handle Uniswap V4 callback pattern (lock/unlock)
- Pass `hookData` to the swap
- Return actual `amountOut` from swap

---

### 🔴 **CRITICAL: treasury-agent submitIntent is Placeholder**

**Location:** `agents/treasury-agent/src/modes/intentMode.ts:105-110`

**Current Code:**
```typescript
// In production: Call IntentRouter.executeIntent
// This would require the full contract ABI and proper encoding

// For MVP: Return a placeholder
console.log('Would submit intent:', signedIntent);
return '0x0000000000000000000000000000000000000000000000000000000000000000';
```

**Impact:**
- ❌ Agent never calls the contract
- ❌ Intents are never executed on-chain
- ❌ User signatures are never validated
- ❌ No on-chain state changes

**Required Fix:**
- Import IntentRouter ABI
- Create viem contract instance
- Call `executeIntent()` with proper parameters
- Wait for transaction confirmation
- Return transaction hash

---

### 🟡 **MEDIUM: Uniswap V4 Integration Pattern**

**Issue:** Uniswap V4 uses a callback-based pattern where:
1. Caller initiates swap via `PoolManager.swap()`
2. PoolManager calls hook callbacks (`beforeSwap`, `afterSwap`)
3. PoolManager calls back to caller's `lockAcquired()` callback
4. Caller must settle balances in the callback

**Current State:** IntentRouter doesn't implement the callback pattern.

**Required:**
- Implement `ILockCallback` interface
- Handle balance settlement in `lockAcquired()`
- Properly encode swap parameters
- Handle slippage checks

---

### 🟡 **MEDIUM: Dashboard May Be Incomplete**

**Issue:** `apps/dashboard` directory structure unclear.

**Required:**
- Verify dashboard pages exist (`/`, `/agents`, `/receipts`)
- Ensure API routes are connected
- Verify receipt display components
- Test ENS resolution UI

---

### 🟢 **LOW: Test Pool Creation**

**Issue:** No script found for creating test pools with ReceiptHook attached.

**Required:**
- Script to create test pools (USDC/DAI, USDC/USDT)
- Register ReceiptHook with pools
- Verify hook flags match requirements

---

## 3. Implementation Requirements

### Phase 1: Fix Core Execution Path

#### 3.1 Implement IntentRouter Swap Execution

**File:** `packages/contracts/src/policy/IntentRouter.sol`

**Requirements:**
1. Import `ILockCallback` from Uniswap V4
2. Implement `lockAcquired()` callback to settle balances
3. Call `PoolManager.swap()` with:
   - `poolKey` (currency0, currency1, fee, tickSpacing, hooks)
   - `SwapParams` (amountSpecified, zeroForOne, sqrtPriceLimitX96)
   - `hookData` (encoded strategyId, quoteId, maxSlippage)
4. Handle swap result and return `amountOut`
5. Update `IntentExecuted` event with actual `amountOut`

**Technical Notes:**
- Uniswap V4 requires exact input or exact output specification
- `amountSpecified < 0` = exact input (specify amountIn)
- `amountSpecified > 0` = exact output (specify amountOut)
- `zeroForOne` determines swap direction (token0 → token1 or token1 → token0)
- Must approve IntentRouter to spend user's tokens before swap

**Example Implementation Pattern:**
```solidity
import {ILockCallback} from "@uniswap/v4-core/src/interfaces/callback/ILockCallback.sol";

contract IntentRouter is EIP712, ILockCallback {
    // ... existing code ...
    
    function executeIntent(...) external returns (int256 amountOut) {
        // ... validation code ...
        
        // Transfer tokens from user
        IERC20(intent.tokenIn).safeTransferFrom(intent.user, address(this), intent.amountIn);
        
        // Build swap params
        IPoolManager.SwapParams memory swapParams = IPoolManager.SwapParams({
            zeroForOne: _isZeroForOne(intent.tokenIn, poolKey.currency0),
            amountSpecified: -int256(intent.amountIn), // Negative = exact input
            sqrtPriceLimitX96: 0 // No price limit
        });
        
        // Execute swap
        BalanceDelta delta = poolManager.swap(poolKey, swapParams, hookData);
        
        // Calculate amountOut from delta
        amountOut = _calculateAmountOut(delta, swapParams.zeroForOne);
        
        // Transfer output tokens to user
        _settleSwap(intent.tokenOut, amountOut, intent.user);
        
        emit IntentExecuted(intentHash, intent.user, intent.strategyId, intent.amountIn, amountOut);
        
        return amountOut;
    }
    
    function lockAcquired(bytes calldata data) external returns (bytes memory) {
        // Handle balance settlement
        // This is called by PoolManager during swap
        // Must settle net balance changes
    }
}
```

---

#### 3.2 Implement treasury-agent submitIntent

**File:** `agents/treasury-agent/src/modes/intentMode.ts`

**Requirements:**
1. Import IntentRouter ABI (or generate from contract)
2. Create viem contract instance with wallet client
3. Call `executeIntent()` with:
   - `intent` struct
   - `signature` bytes
   - `poolKey` struct
   - `strategyData` bytes
4. Wait for transaction confirmation
5. Return transaction hash
6. Handle errors (revert reasons, gas estimation failures)

**Example Implementation:**
```typescript
import { IntentRouter } from './abis/IntentRouter'; // Generated ABI
import { parseAbiParameters } from 'viem';

export async function submitIntent(
  env: Env,
  signedIntent: SignedIntent,
  poolKey: {
    currency0: Address;
    currency1: Address;
    fee: number;
    tickSpacing: number;
    hooks: Address;
  },
  strategyData: `0x${string}` = '0x'
): Promise<`0x${string}`> {
  const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);
  
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(env.RPC_URL),
  });
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });
  
  // Create contract instance
  const intentRouter = getContract({
    address: env.INTENT_ROUTER as Address,
    abi: IntentRouterABI,
    client: { public: publicClient, wallet: walletClient },
  });
  
  // Prepare intent struct
  const intent = {
    user: signedIntent.intent.user,
    tokenIn: signedIntent.intent.tokenIn,
    tokenOut: signedIntent.intent.tokenOut,
    amountIn: signedIntent.intent.amountIn,
    maxSlippage: BigInt(signedIntent.intent.maxSlippageBps),
    deadline: signedIntent.intent.deadline,
    strategyId: signedIntent.intent.strategyId,
    nonce: signedIntent.intent.nonce,
  };
  
  // Prepare poolKey struct
  const poolKeyStruct = {
    currency0: poolKey.currency0,
    currency1: poolKey.currency1,
    fee: poolKey.fee,
    tickSpacing: poolKey.tickSpacing,
    hooks: poolKey.hooks,
  };
  
  // Estimate gas
  const gasEstimate = await intentRouter.estimateGas.executeIntent([
    intent,
    signedIntent.signature,
    poolKeyStruct,
    strategyData,
  ]);
  
  // Execute transaction
  const hash = await intentRouter.write.executeIntent([
    intent,
    signedIntent.signature,
    poolKeyStruct,
    strategyData,
  ], {
    gas: gasEstimate,
  });
  
  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  if (receipt.status === 'reverted') {
    throw new Error(`Transaction reverted: ${receipt.transactionHash}`);
  }
  
  return hash;
}
```

---

#### 3.3 Wire Up Rebalance Flow

**File:** `agents/treasury-agent/src/rebalance/executor.ts`

**Current State:** Lines 122-128 have placeholder comments.

**Requirements:**
1. After getting quote from strategy-agent, build intent
2. Sign intent (or use user's signature if provided)
3. Call `submitIntent()` with proper parameters
4. Wait for transaction confirmation
5. Record receipt transaction hash
6. Handle failures gracefully

**Update Required:**
```typescript
// In executeRebalance(), after getting quote:
const signedIntent = await buildAndSignIntent(env, {
  user: request.userAddress,
  tokenIn: drift.token,
  tokenOut: buyToken.token,
  amountIn: drift.amount.toString(),
  maxSlippageBps: request.policy.maxSlippageBps,
  strategyId: env.STRATEGY_ID, // Or derive from agent
  nonce: await getNonce(env, request.userAddress),
  ttlSeconds: 3600,
});

// Get pool key (from config or strategy-agent)
const poolKey = await getPoolKey(env, drift.token, buyToken.token);

// Submit intent
const txHash = await submitIntent(env, signedIntent, poolKey, quote.quoteId);

receipts.push(txHash);
```

---

### Phase 2: Uniswap V4 Integration

#### 3.4 Implement ILockCallback

**File:** `packages/contracts/src/policy/IntentRouter.sol`

**Requirements:**
1. Import `ILockCallback` interface
2. Implement `lockAcquired(bytes calldata data)` function
3. Decode callback data to get expected balance changes
4. Settle net balance delta:
   - If delta > 0: Take tokens from contract (user already sent input)
   - If delta < 0: Send tokens to PoolManager (for output)
5. Return empty bytes on success

**Technical Details:**
- PoolManager calls `lockAcquired()` during swap
- Must settle the net balance change for the pool
- Use `CurrencyLibrary.settle()` helper if available
- Or manually transfer tokens based on delta sign

---

#### 3.5 Pool Key Resolution

**Requirements:**
1. Function to resolve pool key from token pair
2. Query PoolManager for pool existence
3. Cache pool keys to avoid repeated queries
4. Handle fee tiers (500, 3000, 10000)

**Implementation Options:**
- Hardcode test pool keys for MVP
- Query Uniswap V4 PoolManager registry
- Use SDK helper if available

---

### Phase 3: Testing Infrastructure

#### 3.6 Create Test Pool Script

**File:** `packages/contracts/script/04_CreateTestPools.s.sol` (new)

**Requirements:**
1. Deploy test ERC20 tokens (if needed) or use existing (USDC, DAI, USDT)
2. Create pools with ReceiptHook attached:
   - USDC/DAI pool
   - USDC/USDT pool
3. Initialize pools with liquidity
4. Log pool keys for use in tests

---

#### 3.7 Register Test Agent Script

**File:** `packages/contracts/script/05_RegisterTestAgent.s.sol` (new)

**Requirements:**
1. Register agent in IdentityRegistry
2. Get `agentId` from registration
3. Set ENS text records (manual or scripted):
   - `agent:erc8004` = `agentId`
   - `agent:type` = `treasury`
   - `agent:entrypoint` = IntentRouter address
   - `agent:a2a` = treasury-agent URL
4. Log all addresses and IDs

---

## 4. Deployment & Setup Requirements

### 4.1 Prerequisites

**Environment Variables:**
```bash
# Contracts
RECEIPT_HOOK_ADDRESS=0x...
IDENTITY_REGISTRY_ADDRESS=0x...
INTENT_ROUTER_ADDRESS=0x...
POOL_MANAGER_ADDRESS=0xE03A1074c86CFeDd5C142C4F04F1a1536e203543 # Sepolia

# Agents
TREASURY_AGENT_URL=https://treasury-agent.workers.dev
STRATEGY_AGENT_URL=https://strategy-agent.workers.dev
PRIVATE_KEY=0x... # Agent wallet private key
RPC_URL=https://sepolia.infura.io/v3/...
CHAIN_ID=11155111

# Indexer
INDEXER_RPC_URL=https://sepolia.infura.io/v3/...
INDEXER_API_URL=http://localhost:42069

# Dashboard
NEXT_PUBLIC_INDEXER_API_URL=http://localhost:42069
NEXT_PUBLIC_CHAIN_ID=11155111
```

**Testnet Assets:**
- Sepolia ETH (for gas)
- Test USDC (from Circle faucet or mint)
- Test DAI/USDT (deploy or use existing)

---

### 4.2 Deployment Sequence

#### Step 1: Deploy Contracts
```bash
cd packages/contracts

# Deploy ReceiptHook
forge script script/00_DeployReceiptHook.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  --sender $DEPLOYER_ADDRESS

# Deploy IdentityRegistry
forge script script/01_DeployIdentity.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify

# Deploy IntentRouter
forge script script/02_DeployIntentRouter.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify

# Update .env with deployed addresses
```

#### Step 2: Create Test Pools
```bash
# Create pools with ReceiptHook
forge script script/04_CreateTestPools.s.sol \
  --rpc-url $RPC_URL \
  --broadcast

# Note pool keys for use in agents
```

#### Step 3: Register Test Agent
```bash
# Register agent in IdentityRegistry
forge script script/05_RegisterTestAgent.s.sol \
  --rpc-url $RPC_URL \
  --broadcast

# Set ENS text records (manual via ENS app or script)
# agent:erc8004 = <agentId>
# agent:type = treasury
# agent:entrypoint = <IntentRouter address>
# agent:a2a = <treasury-agent URL>
```

#### Step 4: Deploy Indexer
```bash
cd packages/indexer

# Update ponder.config.ts with deployed contract addresses
# Update .env with RPC URL

# Start indexer
pnpm dev

# Verify indexer is catching events
curl http://localhost:42069/health
```

#### Step 5: Deploy Agents
```bash
# Deploy treasury-agent
cd agents/treasury-agent
wrangler secret put PRIVATE_KEY
wrangler secret put INTENT_ROUTER
wrangler secret put RPC_URL
wrangler secret put STRATEGY_AGENT_URL
wrangler deploy

# Deploy strategy-agent
cd ../strategy-agent
wrangler secret put PRIVATE_KEY
wrangler secret put RPC_URL
wrangler deploy

# Update .env with agent URLs
```

#### Step 6: Deploy Dashboard
```bash
cd apps/dashboard

# Update .env.local with indexer API URL
# Build and deploy
vercel --prod

# Or run locally
pnpm dev
```

---

## 5. End-to-End Test Flow

### 5.1 Test Scenario: Alice's Treasury Rebalancing

**Setup:**
- Alice has 1000 USDC, 500 DAI, 300 USDT
- Target allocation: 70% USDC, 20% DAI, 10% USDT
- Current allocation: ~56% USDC, ~28% DAI, ~17% USDT
- Drift threshold: 5%

---

### 5.2 Step-by-Step E2E Flow

#### **Step 1: Discovery via ENS**
1. Alice opens dashboard
2. Searches for `treasury.oikonomos.eth`
3. Dashboard calls `/api/resolve?name=treasury.oikonomos.eth`
4. SDK resolves ENS text records:
   - `agent:type` → `treasury`
   - `agent:erc8004` → `<agentId>`
   - `agent:entrypoint` → `<IntentRouter address>`
   - `agent:a2a` → `<treasury-agent URL>`
5. Dashboard displays agent card with:
   - Agent type, version, chain
   - Entrypoint address
   - A2A endpoint URL

**✅ Success Criteria:**
- ENS name resolves correctly
- All text records are retrieved
- Agent card displays properly

---

#### **Step 2: Policy Configuration**
1. Alice clicks "Configure Policy"
2. Sets target allocation: 70% USDC, 20% DAI, 10% USDT
3. Sets max slippage: 50 bps (0.5%)
4. Sets drift threshold: 5%
5. Signs policy with EIP-712
6. Dashboard calls `POST ${TREASURY_AGENT_URL}/configure`
7. Agent stores policy (in-memory or database)

**✅ Success Criteria:**
- Policy is accepted by agent
- Signature is validated
- Policy is stored

---

#### **Step 3: Trigger Check**
1. Alice clicks "Check for Rebalance" (or cron triggers)
2. Dashboard calls `POST ${TREASURY_AGENT_URL}/check-triggers`
3. Agent:
   - Fetches Alice's token balances
   - Calculates current allocation
   - Compares to target allocation
   - Detects drift: USDC below target, DAI above target
4. Returns `{ hasDrift: true, drifts: [...] }`

**✅ Success Criteria:**
- Drift is detected correctly
- Required trades are identified

---

#### **Step 4: Get Quote**
1. Agent calls `POST ${STRATEGY_AGENT_URL}/quote`
2. Request: `{ tokenIn: DAI, tokenOut: USDC, amountIn: 100, maxSlippageBps: 50 }`
3. Strategy agent:
   - Queries Uniswap V4 pool for quote
   - Calculates expected output
   - Returns `{ quoteId: "0x...", expectedAmountOut: "95.5" }`

**✅ Success Criteria:**
- Quote is returned
- Expected output is reasonable

---

#### **Step 5: Build and Sign Intent**
1. Agent builds intent:
   ```typescript
   {
     user: aliceAddress,
     tokenIn: DAI_ADDRESS,
     tokenOut: USDC_ADDRESS,
     amountIn: 100e18,
     maxSlippage: 50, // bps
     deadline: now + 3600,
     strategyId: STRATEGY_ID,
     nonce: 0
   }
   ```
2. Agent signs intent with EIP-712 (or uses user's signature)
3. Creates `SignedIntent` object

**✅ Success Criteria:**
- Intent is properly formatted
- Signature is valid EIP-712

---

#### **Step 6: Execute Intent On-Chain**
1. Agent calls `submitIntent()`:
   ```typescript
   await submitIntent(env, signedIntent, poolKey, quoteId)
   ```
2. Function:
   - Creates IntentRouter contract instance
   - Calls `executeIntent(intent, signature, poolKey, strategyData)`
   - Waits for transaction confirmation
3. IntentRouter:
   - Validates signature
   - Checks nonce
   - Transfers tokens from user
   - Calls `PoolManager.swap()` with hookData
4. PoolManager:
   - Executes swap
   - Calls `ReceiptHook.afterSwap()`
5. ReceiptHook:
   - Calculates actual slippage
   - Emits `ExecutionReceipt` event:
     ```solidity
     ExecutionReceipt(
       strategyId,
       quoteId,
       aliceAddress,
       amount0Delta,
       amount1Delta,
       actualSlippage,
       policyCompliant,
       timestamp
     )
     ```

**✅ Success Criteria:**
- Transaction succeeds
- Swap executes correctly
- ExecutionReceipt event is emitted
- Actual slippage is within maxSlippage

---

#### **Step 7: Indexer Catches Event**
1. Ponder indexer listens for `ExecutionReceipt` events
2. Event handler:
   - Stores receipt in `executionReceipt` table
   - Updates `strategyMetrics` table:
     - Increments `totalExecutions`
     - Updates `totalVolume`
     - Recalculates `avgSlippage`
     - Updates `complianceRate`
     - Updates `lastExecutionAt`

**✅ Success Criteria:**
- Event is indexed within ~1 block
- Receipt is stored correctly
- Metrics are updated

---

#### **Step 8: Dashboard Displays Receipt**
1. Alice refreshes dashboard
2. Dashboard calls `GET ${INDEXER_API_URL}/receipts/user/${aliceAddress}`
3. Indexer returns receipts array
4. Dashboard displays:
   - Receipt transaction hash
   - Strategy ID
   - Token pair (DAI → USDC)
   - Amount in/out
   - Actual slippage
   - Policy compliance status
   - Timestamp
5. Alice can click receipt to:
   - View on Etherscan
   - Verify on-chain
   - Check ReceiptHook event logs

**✅ Success Criteria:**
- Receipts are displayed
- Data is accurate
- Links work correctly

---

#### **Step 9: Verify On-Chain**
1. Alice clicks "Verify on Etherscan"
2. Opens transaction on Etherscan
3. Verifies:
   - `ExecutionReceipt` event exists
   - Event data matches dashboard display
   - `strategyId` matches expected
   - `policyCompliant` is true
4. Alice can also query ReceiptHook contract directly:
   ```solidity
   // Get event logs
   ReceiptHook.ExecutionReceipt(
     strategyId,
     quoteId,
     sender,
     amount0,
     amount1,
     actualSlippage,
     policyCompliant,
     timestamp
   )
   ```

**✅ Success Criteria:**
- Event exists on-chain
- Data matches indexer
- Verification is transparent

---

#### **Step 10: Reputation Display**
1. Dashboard queries `GET ${INDEXER_API_URL}/strategies/${strategyId}`
2. Indexer returns:
   ```json
   {
     "id": "0x...",
     "totalExecutions": 1247,
     "totalVolume": "1000000",
     "avgSlippage": 12,
     "successRate": 9950,
     "complianceRate": 9950,
     "lastExecutionAt": 1234567890
   }
   ```
3. Dashboard displays:
   - Trust score (derived from metrics)
   - Execution count
   - Average slippage
   - Compliance rate
4. Alice sees agent has good reputation

**✅ Success Criteria:**
- Metrics are displayed
- Trust score is calculated correctly
- Reputation is verifiable

---

## 6. Success Criteria

### 6.1 Functional Requirements

✅ **Discovery:**
- ENS name resolves to agent records
- Agent card displays correctly
- All text records are accessible

✅ **Configuration:**
- Policy can be set via A2A endpoint
- Signature validation works
- Policy is stored and retrievable

✅ **Execution:**
- Intent is built and signed correctly
- Transaction is submitted to IntentRouter
- Swap executes via PoolManager
- ReceiptHook emits ExecutionReceipt event
- Actual slippage is calculated correctly
- Policy compliance is verified

✅ **Indexing:**
- Indexer catches ExecutionReceipt events
- Receipts are stored in database
- Strategy metrics are updated
- API endpoints return correct data

✅ **Verification:**
- Dashboard displays receipts
- Receipts link to on-chain data
- Event data matches indexer data
- Users can verify independently

---

### 6.2 Performance Requirements

- **Transaction Confirmation:** < 30 seconds (Sepolia)
- **Indexer Latency:** < 1 block (~12 seconds)
- **API Response Time:** < 500ms
- **Dashboard Load Time:** < 2 seconds

---

### 6.3 Security Requirements

- ✅ Signature validation prevents unauthorized execution
- ✅ Nonce prevents replay attacks
- ✅ Deadline prevents stale intents
- ✅ Slippage protection prevents excessive losses
- ✅ Policy compliance is enforced

---

## 7. Testing Checklist

### Pre-Deployment Checklist

- [ ] All contracts compile without errors
- [ ] Unit tests pass for all contracts
- [ ] IntentRouter swap execution is implemented
- [ ] treasury-agent submitIntent is implemented
- [ ] ILockCallback is implemented
- [ ] Test pool creation script exists
- [ ] Agent registration script exists
- [ ] Environment variables are documented

### Deployment Checklist

- [ ] ReceiptHook deployed and verified
- [ ] IdentityRegistry deployed and verified
- [ ] IntentRouter deployed and verified
- [ ] Test pools created with ReceiptHook
- [ ] Test agent registered in IdentityRegistry
- [ ] ENS text records set
- [ ] Indexer configured and running
- [ ] treasury-agent deployed to Cloudflare
- [ ] strategy-agent deployed to Cloudflare
- [ ] Dashboard deployed (or running locally)

### E2E Test Checklist

- [ ] **Discovery:** ENS resolution works
- [ ] **Configuration:** Policy can be set
- [ ] **Trigger Check:** Drift detection works
- [ ] **Quote:** Strategy agent returns quote
- [ ] **Intent Building:** Intent is built correctly
- [ ] **Execution:** Transaction succeeds
- [ ] **Event Emission:** ExecutionReceipt is emitted
- [ ] **Indexing:** Indexer catches event
- [ ] **API:** Receipts are queryable
- [ ] **Dashboard:** Receipts are displayed
- [ ] **Verification:** On-chain data matches

### Edge Cases

- [ ] Intent expires before execution
- [ ] Nonce mismatch
- [ ] Invalid signature
- [ ] Slippage exceeds max
- [ ] Pool doesn't exist
- [ ] Insufficient balance
- [ ] Indexer is down (graceful degradation)
- [ ] Agent is down (error handling)

---

## 8. Next Steps

### Immediate (Phase 1)
1. ✅ Implement IntentRouter swap execution
2. ✅ Implement treasury-agent submitIntent
3. ✅ Wire up rebalance flow
4. ✅ Test swap execution in isolation

### Short-term (Phase 2)
1. ✅ Implement ILockCallback
2. ✅ Create test pool script
3. ✅ Register test agent script
4. ✅ Deploy to Sepolia testnet

### Medium-term (Phase 3)
1. ✅ Run full E2E test
2. ✅ Fix any issues discovered
3. ✅ Document findings
4. ✅ Create demo video

---

## 9. Appendix

### A. Contract Addresses (Sepolia)

```
PoolManager: 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543
ReceiptHook: <TBD>
IdentityRegistry: <TBD>
IntentRouter: <TBD>
```

### B. Test Token Addresses (Sepolia)

```
USDC: <TBD>
DAI: <TBD>
USDT: <TBD>
```

### C. Useful Commands

```bash
# Check indexer health
curl http://localhost:42069/health

# Query receipts
curl http://localhost:42069/receipts/user/0x...

# Query strategy metrics
curl http://localhost:42069/strategies/0x...

# Check agent health
curl https://treasury-agent.workers.dev/health
curl https://strategy-agent.workers.dev/health
```

### D. References

- [Uniswap V4 Documentation](https://docs.uniswap.org/sdk/v4/overview)
- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [Ponder Documentation](https://ponder.sh/docs)

---

**Document Status:** Ready for Implementation

**Last Updated:** January 30, 2026

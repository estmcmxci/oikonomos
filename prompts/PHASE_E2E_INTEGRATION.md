# Phase E2E: End-to-End Integration

## Objective

Complete the integration work needed to connect all individual components into a working end-to-end system. This phase addresses the critical gaps between implemented components and provides the infrastructure for full system testing.

**Status:** ~80% of components exist, but integration gaps prevent E2E testing.

## Prerequisites

- Phases 0-4 completed (Foundation, Contracts, SDK/Indexer, Agents, Dashboard)
- Contracts deployed to Sepolia
- Understanding of Uniswap V4 callback patterns

## Context Files

Read these before starting:
- `/E2E_REQUIREMENTS.md` - Detailed gap analysis and requirements
- `/prompts/PHASE_1_CONTRACTS.md` - Core contract specifications
- `/prompts/PHASE_3_AGENTS.md` - Agent service specifications
- `/context/uniswap-v4.md` - Uniswap V4 integration patterns

## Critical Gaps to Address

### Gap 1: IntentRouter Doesn't Execute Swaps

**Location:** `packages/contracts/src/policy/IntentRouter.sol:110-122`

**Current State:** Placeholder that emits event but doesn't call PoolManager.swap()

**Impact:**
- No swap is executed
- ReceiptHook.afterSwap() is never called
- No ExecutionReceipt event is emitted
- Indexer has nothing to index

### Gap 2: treasury-agent submitIntent is Placeholder

**Location:** `agents/treasury-agent/src/modes/intentMode.ts:105-110`

**Current State:** Returns placeholder transaction hash without calling contract

**Impact:**
- Agent never calls the contract
- Intents are never executed on-chain

### Gap 3: ILockCallback Not Implemented

**Issue:** Uniswap V4 uses callback-based pattern that IntentRouter doesn't implement

**Required:**
- Implement `ILockCallback` interface
- Handle balance settlement in `lockAcquired()`

---

## Deliverables

### Part A: Fix Core Execution Path

#### 1. Implement IntentRouter Swap Execution

Update `packages/contracts/src/policy/IntentRouter.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ILockCallback} from "@uniswap/v4-core/src/interfaces/callback/ILockCallback.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract IntentRouter is EIP712, ILockCallback {
    using SafeERC20 for IERC20;
    using CurrencyLibrary for Currency;

    IPoolManager public immutable poolManager;

    // Temporary storage for callback context
    struct CallbackData {
        address user;
        PoolKey poolKey;
        IPoolManager.SwapParams swapParams;
        bytes hookData;
    }

    CallbackData private _callbackData;

    constructor(address _poolManager) EIP712("OikonomosIntent", "1") {
        poolManager = IPoolManager(_poolManager);
    }

    function executeIntent(
        Intent calldata intent,
        bytes calldata signature,
        PoolKey calldata poolKey,
        bytes calldata strategyData
    ) external returns (int256 amountOut) {
        // ... existing validation code (signature, nonce, deadline) ...

        // Transfer tokens from user to this contract
        IERC20(intent.tokenIn).safeTransferFrom(intent.user, address(this), intent.amountIn);

        // Approve PoolManager to spend tokens
        IERC20(intent.tokenIn).approve(address(poolManager), intent.amountIn);

        // Determine swap direction
        bool zeroForOne = Currency.unwrap(poolKey.currency0) == intent.tokenIn;

        // Build swap params
        IPoolManager.SwapParams memory swapParams = IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: -int256(intent.amountIn), // Negative = exact input
            sqrtPriceLimitX96: zeroForOne ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1
        });

        // Encode hookData for ReceiptHook
        bytes memory hookData = abi.encode(
            intent.strategyId,
            keccak256(strategyData), // quoteId
            intent.maxSlippage
        );

        // Store callback context
        _callbackData = CallbackData({
            user: intent.user,
            poolKey: poolKey,
            swapParams: swapParams,
            hookData: hookData
        });

        // Execute swap via PoolManager (triggers callback)
        bytes memory result = poolManager.unlock(
            abi.encode(poolKey, swapParams, hookData)
        );

        // Decode result
        BalanceDelta delta = abi.decode(result, (BalanceDelta));

        // Calculate amountOut
        amountOut = zeroForOne ? -delta.amount1() : -delta.amount0();

        // Transfer output tokens to user
        address tokenOut = zeroForOne
            ? Currency.unwrap(poolKey.currency1)
            : Currency.unwrap(poolKey.currency0);
        IERC20(tokenOut).safeTransfer(intent.user, uint256(amountOut));

        emit IntentExecuted(intentHash, intent.user, intent.strategyId, intent.amountIn, amountOut);

        // Clear callback data
        delete _callbackData;

        return amountOut;
    }

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        require(msg.sender == address(poolManager), "Only PoolManager");

        (PoolKey memory poolKey, IPoolManager.SwapParams memory swapParams, bytes memory hookData) =
            abi.decode(data, (PoolKey, IPoolManager.SwapParams, bytes));

        // Execute the swap
        BalanceDelta delta = poolManager.swap(poolKey, swapParams, hookData);

        // Settle balances
        _settleDelta(poolKey, delta, swapParams.zeroForOne);

        return abi.encode(delta);
    }

    function _settleDelta(
        PoolKey memory poolKey,
        BalanceDelta delta,
        bool zeroForOne
    ) internal {
        // Pay the input currency to PoolManager
        if (zeroForOne) {
            if (delta.amount0() > 0) {
                poolKey.currency0.settle(poolManager, address(this), uint256(int256(delta.amount0())), false);
            }
            if (delta.amount1() < 0) {
                poolKey.currency1.take(poolManager, address(this), uint256(-int256(delta.amount1())), false);
            }
        } else {
            if (delta.amount1() > 0) {
                poolKey.currency1.settle(poolManager, address(this), uint256(int256(delta.amount1())), false);
            }
            if (delta.amount0() < 0) {
                poolKey.currency0.take(poolManager, address(this), uint256(-int256(delta.amount0())), false);
            }
        }
    }
}
```

#### 2. Implement treasury-agent submitIntent

Update `agents/treasury-agent/src/modes/intentMode.ts`:

```typescript
import { createWalletClient, createPublicClient, http, getContract, Address, Hex } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { IntentRouterABI } from '../abis/IntentRouter';

export interface SignedIntent {
  intent: {
    user: Address;
    tokenIn: Address;
    tokenOut: Address;
    amountIn: string;
    maxSlippageBps: number;
    deadline: number;
    strategyId: Hex;
    nonce: number;
  };
  signature: Hex;
}

export interface PoolKey {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}

export async function submitIntent(
  env: Env,
  signedIntent: SignedIntent,
  poolKey: PoolKey,
  strategyData: Hex = '0x'
): Promise<Hex> {
  const account = privateKeyToAccount(env.PRIVATE_KEY as Hex);

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
    amountIn: BigInt(signedIntent.intent.amountIn),
    maxSlippage: BigInt(signedIntent.intent.maxSlippageBps),
    deadline: BigInt(signedIntent.intent.deadline),
    strategyId: signedIntent.intent.strategyId,
    nonce: BigInt(signedIntent.intent.nonce),
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
  const hash = await intentRouter.write.executeIntent(
    [intent, signedIntent.signature, poolKeyStruct, strategyData],
    { gas: gasEstimate + (gasEstimate / 10n) } // 10% buffer
  );

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status === 'reverted') {
    throw new Error(`Transaction reverted: ${hash}`);
  }

  console.log(`Intent executed: ${hash}`);
  return hash;
}
```

#### 3. Wire Up Rebalance Flow

Update `agents/treasury-agent/src/rebalance/executor.ts` to use the real `submitIntent`:

```typescript
import { submitIntent, SignedIntent, PoolKey } from '../modes/intentMode';
import { buildAndSignIntent } from '../intent/builder';

// In executeRebalance(), after getting quote:
async function executeTrade(
  env: Env,
  drift: DriftInfo,
  buyToken: TokenInfo,
  quote: Quote,
  request: RebalanceRequest
): Promise<Hex> {
  // Build and sign intent
  const signedIntent: SignedIntent = await buildAndSignIntent(env, {
    user: request.userAddress,
    tokenIn: drift.token,
    tokenOut: buyToken.token,
    amountIn: drift.amount.toString(),
    maxSlippageBps: request.policy.maxSlippageBps,
    strategyId: env.STRATEGY_ID,
    nonce: await getNonce(env, request.userAddress),
    ttlSeconds: 3600,
  });

  // Get pool key from config or strategy-agent
  const poolKey: PoolKey = await getPoolKey(env, drift.token, buyToken.token);

  // Submit intent to IntentRouter
  const txHash = await submitIntent(env, signedIntent, poolKey, quote.quoteId);

  return txHash;
}
```

---

### Part B: Testing Infrastructure

#### 4. Create Test Pool Script

Create `packages/contracts/script/04_CreateTestPools.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";

contract CreateTestPools is Script {
    // Sepolia addresses
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    // Test tokens (deploy these or use existing)
    address USDC;
    address DAI;
    address RECEIPT_HOOK;

    function run() external {
        USDC = vm.envAddress("USDC_ADDRESS");
        DAI = vm.envAddress("DAI_ADDRESS");
        RECEIPT_HOOK = vm.envAddress("RECEIPT_HOOK_ADDRESS");

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        IPoolManager poolManager = IPoolManager(POOL_MANAGER);

        // Create USDC/DAI pool with ReceiptHook
        PoolKey memory usdcDaiPool = PoolKey({
            currency0: Currency.wrap(USDC < DAI ? USDC : DAI),
            currency1: Currency.wrap(USDC < DAI ? DAI : USDC),
            fee: 500, // 0.05%
            tickSpacing: 10,
            hooks: IHooks(RECEIPT_HOOK)
        });

        // Initialize pool at 1:1 price (sqrtPriceX96 for 1:1)
        uint160 sqrtPriceX96 = 79228162514264337593543950336; // sqrt(1) * 2^96
        poolManager.initialize(usdcDaiPool, sqrtPriceX96);

        console.log("USDC/DAI pool created with ReceiptHook");
        console.log("  currency0:", Currency.unwrap(usdcDaiPool.currency0));
        console.log("  currency1:", Currency.unwrap(usdcDaiPool.currency1));
        console.log("  hooks:", address(usdcDaiPool.hooks));

        vm.stopBroadcast();
    }
}
```

#### 5. Register Test Agent Script

Create `packages/contracts/script/05_RegisterTestAgent.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IdentityRegistry} from "../src/identity/IdentityRegistry.sol";

contract RegisterTestAgent is Script {
    function run() external {
        address identityRegistry = vm.envAddress("IDENTITY_REGISTRY_ADDRESS");
        string memory agentURI = vm.envString("AGENT_URI");

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        IdentityRegistry registry = IdentityRegistry(identityRegistry);

        uint256 agentId = registry.register(agentURI, "");

        console.log("Agent registered:");
        console.log("  agentId:", agentId);
        console.log("  agentURI:", agentURI);
        console.log("  owner:", msg.sender);

        // Log ENS text record format
        console.log("");
        console.log("Set ENS text records:");
        console.log("  agent:erc8004 = eip155:11155111:", identityRegistry, ":", agentId);
        console.log("  agent:type = treasury");
        console.log("  agent:entrypoint = <INTENT_ROUTER_ADDRESS>");
        console.log("  agent:a2a = <TREASURY_AGENT_URL>");

        vm.stopBroadcast();
    }
}
```

---

### Part C: E2E Test Flow

#### 6. E2E Test Script

Create `packages/contracts/test/E2EFlow.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {ReceiptHook} from "../src/core/ReceiptHook.sol";
import {IdentityRegistry} from "../src/identity/IdentityRegistry.sol";
import {IntentRouter} from "../src/policy/IntentRouter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract E2EFlowTest is Test {
    ReceiptHook public receiptHook;
    IdentityRegistry public identityRegistry;
    IntentRouter public intentRouter;

    MockERC20 public usdc;
    MockERC20 public dai;

    address public alice;
    uint256 public aliceKey;
    address public agent;

    function setUp() public {
        // Deploy contracts
        // ... setup code
    }

    function test_FullE2EFlow() public {
        // 1. Register agent
        vm.prank(agent);
        uint256 agentId = identityRegistry.register("ipfs://agent-metadata", "");

        // 2. Alice approves IntentRouter
        vm.prank(alice);
        usdc.approve(address(intentRouter), type(uint256).max);

        // 3. Build and sign intent
        IntentRouter.Intent memory intent = IntentRouter.Intent({
            user: alice,
            tokenIn: address(usdc),
            tokenOut: address(dai),
            amountIn: 100e6,
            maxSlippage: 50, // 0.5%
            deadline: block.timestamp + 3600,
            strategyId: bytes32(agentId),
            nonce: 0
        });

        bytes memory signature = _signIntent(intent, aliceKey);

        // 4. Execute intent
        vm.prank(agent);
        int256 amountOut = intentRouter.executeIntent(
            intent,
            signature,
            poolKey,
            ""
        );

        // 5. Verify receipt was emitted
        // Check event logs for ExecutionReceipt

        // 6. Verify balances
        assertGt(dai.balanceOf(alice), 0, "Alice should have DAI");
        assertEq(usdc.balanceOf(alice), 900e6, "Alice should have 900 USDC");
    }
}
```

---

## Deployment Sequence

### Step 1: Deploy/Update Contracts
```bash
cd packages/contracts

# If IntentRouter needs redeployment with ILockCallback
forge script script/02_DeployIntentRouter.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

### Step 2: Create Test Pools
```bash
forge script script/04_CreateTestPools.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast
```

### Step 3: Register Test Agent
```bash
AGENT_URI="ipfs://QmTestAgent" \
forge script script/05_RegisterTestAgent.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast
```

### Step 4: Update Agent Environment
```bash
cd agents/treasury-agent
wrangler secret put INTENT_ROUTER
wrangler secret put RECEIPT_HOOK
wrangler deploy
```

### Step 5: Verify Indexer
```bash
cd packages/indexer
pnpm dev

# Check health
curl http://localhost:42069/health
```

---

## Success Criteria

### Functional Requirements

- [ ] IntentRouter executes actual swaps via PoolManager
- [ ] ReceiptHook.afterSwap() is called and emits ExecutionReceipt
- [ ] treasury-agent calls IntentRouter.executeIntent() on-chain
- [ ] Indexer catches ExecutionReceipt events
- [ ] Dashboard displays receipts with accurate data
- [ ] On-chain verification matches indexed data

### Performance Requirements

- Transaction confirmation: < 30 seconds (Sepolia)
- Indexer latency: < 1 block (~12 seconds)
- API response time: < 500ms

### Security Requirements

- [ ] Signature validation prevents unauthorized execution
- [ ] Nonce prevents replay attacks
- [ ] Deadline prevents stale intents
- [ ] Slippage protection enforced

---

## Testing Checklist

### Pre-Deployment
- [ ] All contracts compile without errors
- [ ] Unit tests pass for IntentRouter with ILockCallback
- [ ] treasury-agent submitIntent builds correctly
- [ ] E2E test passes in fork mode

### Deployment
- [ ] IntentRouter deployed with ILockCallback
- [ ] Test pools created with ReceiptHook
- [ ] Test agent registered
- [ ] ENS text records set
- [ ] Indexer configured and running
- [ ] Agents deployed to Cloudflare

### E2E Validation
- [ ] ENS resolution works
- [ ] Policy configuration accepted
- [ ] Drift detection triggers correctly
- [ ] Quote returned from strategy-agent
- [ ] Intent built and signed
- [ ] Transaction succeeds on-chain
- [ ] ExecutionReceipt event emitted
- [ ] Indexer catches event
- [ ] Dashboard displays receipt
- [ ] On-chain data matches indexed data

---

## Relationship to Other Phases

| Phase | Dependency | Integration Point |
|-------|------------|-------------------|
| PHASE_1_CONTRACTS | Provides | IntentRouter, ReceiptHook contracts |
| PHASE_2_SDK_INDEXER | Provides | Indexer, SDK resolution |
| PHASE_3_AGENTS | Provides | treasury-agent, strategy-agent |
| PHASE_4_DASHBOARD | Consumes | Receipt display, agent discovery |
| PHASE_5_MODE_B_REPUTATION | Extends | ReputationRegistry integration |
| IMPLEMENT_REPUTATION_REGISTRY | Extends | Hybrid architecture (indexer + on-chain) |

---

## References

- [Uniswap V4 Documentation](https://docs.uniswap.org/sdk/v4/overview)
- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [Ponder Documentation](https://ponder.sh/docs)
- `/E2E_REQUIREMENTS.md` - Full gap analysis and detailed requirements

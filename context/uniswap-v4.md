# Uniswap v4

> Context file for Oikonomos integration with Uniswap v4 for Treasury Autopilot swaps

## Overview

Uniswap v4 is a singleton AMM where all pools live in a single `PoolManager` contract. It introduces hooks for customizable pool logic and uses a flash accounting pattern for gas efficiency.

**v4-core**: https://github.com/uniswap/v4-core
**Docs**: https://docs.uniswap.org/contracts/v4/overview

## OpenZeppelin Uniswap Hooks Library

**Decision**: Use OpenZeppelin's audited BaseHook over raw v4-periphery

We use OpenZeppelin's uniswap-hooks library for building our Receipt Hook. It provides security-focused base contracts with proper permission validation.

**Repository**: https://github.com/OpenZeppelin/uniswap-hooks
**Docs**: https://docs.openzeppelin.com/uniswap-hooks

### Installation

```bash
forge install OpenZeppelin/uniswap-hooks
```

Add to `remappings.txt`:
```
@openzeppelin/uniswap-hooks/=lib/uniswap-hooks/src/
```

### Available Base Contracts

| Contract | Purpose | v0 Usage |
|----------|---------|----------|
| **BaseHook** | Foundation for all hooks with security helpers | ✅ Required |
| BaseCustomAccounting | Hook-owned liquidity, custom token accounting | ❌ v1+ (vaults) |
| BaseCustomCurve | Replace v4's concentrated liquidity math | ❌ Not needed |
| BaseAsyncSwap | Defer swaps, mint ERC-6909 tokens | ❌ v1+ (netting) |
| BaseDynamicFee | Owner-adjustable LP fees | ❌ Not needed |
| BaseOverrideFee | Fee override before swap | ❌ Not needed |

### Why OpenZeppelin over v4-periphery?

- Audited by OpenZeppelin security team
- Enhanced `validateHookAddress` for permission checks
- Consistent patterns with OpenZeppelin Contracts
- Better upgrade path for v1+ features (custom accounting, async swaps)

## Architecture Decisions for Oikonomos

### Swap Pattern
**Decision**: Universal Router

Use the Universal Router for all Treasury Autopilot swaps:
- Handles the unlock/settle pattern internally
- Supports Permit2 for gas-efficient approvals
- Production-ready with proper error handling
- Simpler integration than direct PoolManager calls

### Hooks Strategy
**Decision**: Receipt Hook (afterSwap) for strategy marketplace

Deploy a custom hook that:
- Emits trustless `ExecutionReceipt` events
- Includes strategy ID and quote ID for attribution
- Calculates actual execution quality metrics
- Feeds into ERC-8004 Reputation Registry

Skip for v0:
- Policy enforcement hooks (Zodiac Roles handles this)
- beforeSwap hooks (no custom pricing logic needed)
- Fee distribution hooks (x402 payments are off-chain)

### Pool Configuration
**Decision**: Low fee + tight tick spacing for stablecoins

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Fee | 100 (0.01%) | Minimal fees for treasury rebalancing |
| Tick Spacing | 1 | Tightest spacing for stable pairs |
| Hooks | Receipt Hook address | Strategy attribution and metrics |

## Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| PoolManager | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` |
| Universal Router | `0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b` |
| PositionManager | `0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4` |
| StateView | `0xe1dd9c3fa50edb962e442f60dfbc432e24537e4c` |
| Quoter | `0x61b3f2011a92d183c7dbadbda940a7555ccf9227` |
| PoolSwapTest | `0x9b6b46e2c869aa39918db7f52f5557fe577b6eee` |
| PoolModifyLiquidityTest | `0x0c478023803a644c94c4ce1c1e7b9a087e411b0a` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

**Test Stablecoins (Sepolia)**:
| Token | Address | Faucet |
|-------|---------|--------|
| USDC (Circle) | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | [faucet.circle.com](https://faucet.circle.com/) |

## Core Types

### PoolKey

Identifies a unique pool:

```solidity
struct PoolKey {
    Currency currency0;    // Lower address token
    Currency currency1;    // Higher address token
    uint24 fee;           // Fee in hundredths of a bip (100 = 0.01%)
    int24 tickSpacing;    // Tick granularity
    IHooks hooks;         // Hook contract (or address(0))
}
```

**Important**: `currency0` must have a lower address than `currency1`. Sort tokens before creating PoolKey.

### SwapParams

Parameters for executing a swap:

```solidity
struct SwapParams {
    bool zeroForOne;           // true = sell token0 for token1
    int256 amountSpecified;    // negative = exactIn, positive = exactOut
    uint160 sqrtPriceLimitX96; // Price limit (slippage protection)
}
```

**amountSpecified interpretation**:
- Negative value: Exact input swap (e.g., `-1000` = spend exactly 1000 of input token)
- Positive value: Exact output swap (e.g., `1000` = receive exactly 1000 of output token)

### BalanceDelta

Packed int256 representing balance changes:

```solidity
type BalanceDelta is int256;

// Upper 128 bits = amount0 delta
// Lower 128 bits = amount1 delta

library BalanceDeltaLibrary {
    function amount0(BalanceDelta delta) returns (int128);
    function amount1(BalanceDelta delta) returns (int128);
}
```

Negative delta = tokens owed by caller (input)
Positive delta = tokens owed to caller (output)

## Swap Execution

### Via Universal Router (Recommended)

```typescript
import { UniversalRouter } from '@uniswap/universal-router-sdk'
import { encodeSwapExactIn } from '@uniswap/v4-sdk'

// Build swap command
const swapParams = {
  poolKey: {
    currency0: USDC_ADDRESS,
    currency1: DAI_ADDRESS,
    fee: 100,  // 0.01%
    tickSpacing: 1,
    hooks: RECEIPT_HOOK_ADDRESS
  },
  zeroForOne: true,  // USDC -> DAI
  amountIn: parseUnits('1000', 6),  // 1000 USDC
  amountOutMinimum: parseUnits('995', 18),  // 0.5% slippage
  hookData: encodeHookData(strategyId, quoteId)
}

// Execute via Universal Router
const tx = await universalRouter.execute(commands, inputs, deadline)
```

### Via PoolSwapTest (Demo/Testing)

For quick testing, use the deployed PoolSwapTest helper:

```solidity
IPoolSwapTest swapTest = IPoolSwapTest(0x9b6b46e2c869aa39918db7f52f5557fe577b6eee);

// Approve tokens first
IERC20(token0).approve(address(swapTest), amountIn);

// Execute swap
BalanceDelta delta = swapTest.swap(
    poolKey,
    SwapParams({
        zeroForOne: true,
        amountSpecified: -int256(amountIn),  // exactIn
        sqrtPriceLimitX96: MIN_SQRT_PRICE + 1  // no limit
    }),
    TestSettings({
        takeClaims: false,
        settleUsingBurn: false
    }),
    hookData
);
```

### Direct PoolManager (Advanced)

For maximum control, implement `IUnlockCallback`:

```solidity
contract TreasuryExecutor is IUnlockCallback {
    IPoolManager public immutable poolManager;

    function executeSwap(
        PoolKey memory key,
        SwapParams memory params,
        bytes memory hookData
    ) external returns (BalanceDelta delta) {
        // Unlock triggers callback
        bytes memory result = poolManager.unlock(
            abi.encode(key, params, hookData)
        );
        delta = abi.decode(result, (BalanceDelta));
    }

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == address(poolManager));

        (PoolKey memory key, SwapParams memory params, bytes memory hookData) =
            abi.decode(data, (PoolKey, SwapParams, bytes));

        // Execute swap
        BalanceDelta delta = poolManager.swap(key, params, hookData);

        // Settle balances
        _settle(key.currency0, delta.amount0());
        _settle(key.currency1, delta.amount1());

        return abi.encode(delta);
    }

    function _settle(Currency currency, int128 delta) internal {
        if (delta < 0) {
            // We owe tokens - transfer to PoolManager
            currency.settle(poolManager, address(this), uint128(-delta), false);
        } else if (delta > 0) {
            // We're owed tokens - take from PoolManager
            currency.take(poolManager, address(this), uint128(delta), false);
        }
    }
}
```

## Receipt Hook Implementation

Deploy a custom hook for strategy marketplace integration using OpenZeppelin's audited BaseHook:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "@openzeppelin/uniswap-hooks/base/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

contract ReceiptHook is BaseHook {

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

    // Track strategy performance for on-chain leaderboard
    struct StrategyStats {
        uint256 totalSwaps;
        uint256 totalVolume;
        uint256 avgSlippage;  // basis points * 100
        uint256 complianceRate;  // percentage * 100
    }

    mapping(bytes32 => StrategyStats) public strategyPerformance;

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true,  // Only hook we need
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override returns (bytes4, int128) {
        // Decode strategy metadata from hookData
        if (hookData.length > 0) {
            (
                bytes32 strategyId,
                bytes32 quoteId,
                uint256 expectedSlippage
            ) = abi.decode(hookData, (bytes32, bytes32, uint256));

            // Calculate actual execution metrics
            uint256 actualSlippage = _calculateSlippage(params, delta);
            bool policyCompliant = actualSlippage <= expectedSlippage;

            // Emit trustless receipt
            emit ExecutionReceipt(
                strategyId,
                quoteId,
                sender,
                delta.amount0(),
                delta.amount1(),
                actualSlippage,
                policyCompliant,
                block.timestamp
            );

            // Update strategy stats
            _updateStrategyStats(strategyId, actualSlippage, policyCompliant);
        }

        return (this.afterSwap.selector, 0);
    }

    function _calculateSlippage(
        SwapParams calldata params,
        BalanceDelta delta
    ) internal pure returns (uint256) {
        // Calculate slippage in basis points
        // Implementation depends on how you define slippage
        // This is a simplified example
        int256 specified = params.amountSpecified;
        int128 actual = params.zeroForOne ? delta.amount1() : delta.amount0();

        if (specified == 0) return 0;

        // For exactIn: slippage = (expected - actual) / expected
        // For exactOut: slippage = (actual - expected) / expected
        uint256 diff = specified < 0
            ? uint256(int256(-specified) - int256(actual))
            : uint256(int256(actual) - specified);

        return (diff * 10000) / uint256(specified < 0 ? -specified : specified);
    }

    function _updateStrategyStats(
        bytes32 strategyId,
        uint256 slippage,
        bool compliant
    ) internal {
        StrategyStats storage stats = strategyPerformance[strategyId];

        // Update running averages
        uint256 n = stats.totalSwaps;
        stats.avgSlippage = (stats.avgSlippage * n + slippage) / (n + 1);
        stats.complianceRate = (stats.complianceRate * n + (compliant ? 10000 : 0)) / (n + 1);
        stats.totalSwaps = n + 1;
    }
}
```

### Hook Address Mining

Hooks must have specific flags encoded in their address. Use a CREATE2 deployer:

```typescript
import { findHookAddress } from '@uniswap/v4-sdk'

// afterSwap flag = 0x0080
const flags = 0x0080;

const { salt, address } = await findHookAddress(
  CREATE2_DEPLOYER,
  hookBytecode,
  flags
);

// Deploy with the found salt
const hook = await create2Deploy(hookBytecode, salt);
```

## Pool Initialization

Before swapping, ensure the pool exists:

```solidity
// Check if pool is initialized
(uint160 sqrtPriceX96,,,) = poolManager.getSlot0(poolKey.toId());

if (sqrtPriceX96 == 0) {
    // Pool doesn't exist - initialize it
    // For stablecoins, start at 1:1 price
    uint160 initialPrice = 79228162514264337593543950336; // sqrt(1) * 2^96

    poolManager.initialize(poolKey, initialPrice);
}
```

### Stablecoin Pool Setup

```typescript
const USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
const DAI = '0x...'  // Deploy mock or use test token

// Sort currencies (required)
const [currency0, currency1] = USDC.toLowerCase() < DAI.toLowerCase()
  ? [USDC, DAI]
  : [DAI, USDC]

const poolKey = {
  currency0,
  currency1,
  fee: 100,           // 0.01%
  tickSpacing: 1,     // Tightest for stables
  hooks: RECEIPT_HOOK  // Or address(0) for hookless
}

// Initialize at 1:1 (for equal-decimal stables)
// For USDC (6 decimals) vs DAI (18 decimals), adjust the price
const sqrtPriceX96 = encodeSqrtPriceX96(1, 1)  // 1:1

await poolManager.initialize(poolKey, sqrtPriceX96)
```

## Price Limits (Slippage Protection)

Set `sqrtPriceLimitX96` to enforce maximum slippage:

```solidity
// Constants
uint160 constant MIN_SQRT_PRICE = 4295128739;
uint160 constant MAX_SQRT_PRICE = 1461446703485210103287273052203988822378723970342;

// For zeroForOne = true (selling token0), price decreases
// Set limit to minimum acceptable price
uint160 priceLimit = zeroForOne
    ? MIN_SQRT_PRICE + 1
    : MAX_SQRT_PRICE - 1;

// For specific slippage (e.g., 0.5%)
uint160 currentPrice = getCurrentSqrtPrice(poolKey);
uint160 maxSlippageBps = 50;  // 0.5%

priceLimit = zeroForOne
    ? currentPrice * (10000 - maxSlippageBps) / 10000
    : currentPrice * (10000 + maxSlippageBps) / 10000;
```

## Integration with Treasury Autopilot

### Execution Flow

```
1. Policy Engine determines rebalance needed
       ↓
2. Strategy Module generates quote (quoteId)
       ↓
3. Executor builds swap params + hookData
       ↓
4. Zodiac Roles validates permissions
       ↓
5. Universal Router executes swap
       ↓
6. Receipt Hook emits ExecutionReceipt
       ↓
7. Receipt feeds ERC-8004 Reputation Registry
```

### hookData Encoding

```solidity
// Encode strategy metadata for Receipt Hook
bytes memory hookData = abi.encode(
    strategyId,      // bytes32 - ENS namehash or ERC-8004 agentId
    quoteId,         // bytes32 - links to x402 payment if applicable
    maxSlippage      // uint256 - in basis points (50 = 0.5%)
);
```

### Receipt → Reputation Flow

```typescript
// Listen for ExecutionReceipt events
receiptHook.on('ExecutionReceipt', async (event) => {
  const { strategyId, actualSlippage, policyCompliant } = event.args

  // Convert to ERC-8004 feedback
  await reputationRegistry.giveFeedback(
    agentId,
    policyCompliant ? 100n : 0n,  // value
    0,                             // decimals
    'execution',                   // tag1
    'compliance',                  // tag2
    '',                            // endpoint
    `ipfs://${receiptCid}`,       // feedbackURI
    receiptHash                    // feedbackHash
  )
})
```

## Gas Considerations

v4's flash accounting pattern is gas-efficient:
- All balance changes tracked in transient storage
- Single settlement at end of unlock callback
- No intermediate token transfers during multi-hop swaps

**Typical gas costs (Sepolia estimates)**:
| Operation | Gas |
|-----------|-----|
| Simple swap (no hook) | ~120k |
| Swap with Receipt Hook | ~150k |
| Pool initialization | ~200k |

## File Structure Reference

```
lib/
├── uniswap-hooks/               # OpenZeppelin hooks library
│   └── src/
│       └── base/
│           ├── BaseHook.sol     # ✅ Foundation for ReceiptHook
│           ├── BaseCustomAccounting.sol
│           ├── BaseCustomCurve.sol
│           └── BaseAsyncSwap.sol
├── v4-core/
│   └── src/
│       ├── PoolManager.sol           # Singleton pool manager
│       ├── interfaces/
│       │   ├── IPoolManager.sol      # Core interface
│       │   └── IHooks.sol            # Hook interface
│       ├── types/
│       │   ├── PoolKey.sol           # Pool identifier
│       │   ├── PoolOperation.sol     # SwapParams, ModifyLiquidityParams
│       │   ├── BalanceDelta.sol      # Balance change type
│       │   └── Currency.sol          # Token wrapper
│       ├── libraries/
│       │   ├── Hooks.sol             # Hook utilities
│       │   ├── TickMath.sol          # Price calculations
│       │   └── SwapMath.sol          # Swap calculations
│       └── test/
│           └── PoolSwapTest.sol      # Test helper contract
└── v4-periphery/                # Uniswap periphery contracts
```

### Recommended remappings.txt

```
@openzeppelin/uniswap-hooks/=lib/uniswap-hooks/src/
@uniswap/v4-core/=lib/v4-core/
@uniswap/v4-periphery/=lib/v4-periphery/
```

## Resources

- [Uniswap v4 Documentation](https://docs.uniswap.org/contracts/v4/overview)
- [v4-core GitHub](https://github.com/uniswap/v4-core)
- [v4-periphery GitHub](https://github.com/uniswap/v4-periphery)
- [Hook Development Guide](https://docs.uniswap.org/contracts/v4/concepts/hooks)
- [Universal Router](https://docs.uniswap.org/contracts/universal-router/overview)
- [OpenZeppelin Uniswap Hooks Docs](https://docs.openzeppelin.com/uniswap-hooks)
- [OpenZeppelin Uniswap Hooks GitHub](https://github.com/OpenZeppelin/uniswap-hooks)

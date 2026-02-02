// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

/// @title ReceiptHook
/// @notice Uniswap v4 hook that emits ExecutionReceipt events after swaps
/// @dev This is the trust anchor for the Oikonomos strategy marketplace
/// @dev Reentrancy: This contract is read-only (emits events only), no state modifications
contract ReceiptHook is IHooks {
    /// @notice The PoolManager this hook is registered with
    IPoolManager public immutable poolManager;

    /// @notice Maximum allowed slippage in basis points (100%)
    uint256 public constant MAX_SLIPPAGE_BPS = 10000;

    /// @notice Emitted after each swap with strategy attribution data
    /// @dev The 'user' field is the actual wallet that initiated the swap (from hookData)
    /// @dev The 'router' field is the contract that called PoolManager (e.g., IntentRouter)
    event ExecutionReceipt(
        bytes32 indexed strategyId,
        bytes32 indexed quoteId,
        address indexed user,
        address router,
        int128 amount0,
        int128 amount1,
        uint256 actualSlippage,
        bool policyCompliant,
        uint256 timestamp
    );

    /// @notice Error thrown when caller is not the PoolManager
    error NotPoolManager();

    /// @notice Error thrown when hook function is not implemented
    error HookNotImplemented();

    /// @notice Error thrown when hook address flags don't match permissions
    error InvalidHookAddress();

    /// @notice Error thrown when maxSlippage exceeds bounds
    error InvalidSlippageBounds();

    /// @notice Error thrown when expectedAmount is zero
    error InvalidExpectedAmount();

    /// @notice Only allow calls from the PoolManager
    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        _;
    }

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
        // Validate hook address has correct flags for afterSwap
        Hooks.validateHookPermissions(IHooks(address(this)), getHookPermissions());
    }

    /// @notice Returns the hook permissions - only afterSwap is enabled
    function getHookPermissions() public pure returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ============ IHooks Implementation ============

    function beforeInitialize(address, PoolKey calldata, uint160) external pure override returns (bytes4) {
        revert HookNotImplemented();
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24) external pure override returns (bytes4) {
        revert HookNotImplemented();
    }

    function beforeAddLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, bytes calldata)
        external
        pure
        override
        returns (bytes4)
    {
        revert HookNotImplemented();
    }

    function afterAddLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external pure override returns (bytes4, BalanceDelta) {
        revert HookNotImplemented();
    }

    function beforeRemoveLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        revert HookNotImplemented();
    }

    function afterRemoveLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external pure override returns (bytes4, BalanceDelta) {
        revert HookNotImplemented();
    }

    function beforeSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        external
        pure
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        revert HookNotImplemented();
    }

    /// @notice Called after a swap to emit the ExecutionReceipt event
    /// @param sender The address that initiated the swap (router contract)
    /// @param params The swap parameters
    /// @param delta The balance changes from the swap
    /// @param hookData Encoded (strategyId, quoteId, expectedAmount, maxSlippage, userAddress)
    /// @return The function selector and zero delta modifier
    function afterSwap(
        address sender,
        PoolKey calldata,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4, int128) {
        // Only emit receipt if hookData is provided
        if (hookData.length > 0) {
            (bytes32 strategyId, bytes32 quoteId, uint256 expectedAmount, uint256 maxSlippage, address userAddress) =
                abi.decode(hookData, (bytes32, bytes32, uint256, uint256, address));

            // Validate hookData parameters
            if (maxSlippage > MAX_SLIPPAGE_BPS) revert InvalidSlippageBounds();
            if (expectedAmount == 0) revert InvalidExpectedAmount();

            // Calculate actual slippage in basis points
            // Compare expected vs actual for the SAME token (output for exactIn, input for exactOut)
            uint256 actualSlippage = _calculateSlippage(params, delta, expectedAmount);

            emit ExecutionReceipt(
                strategyId,
                quoteId,
                userAddress,  // The actual user wallet (from hookData)
                sender,       // The router contract that called swap
                delta.amount0(),
                delta.amount1(),
                actualSlippage,
                actualSlippage <= maxSlippage,
                block.timestamp
            );
        }

        return (this.afterSwap.selector, 0);
    }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        pure
        override
        returns (bytes4)
    {
        revert HookNotImplemented();
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        pure
        override
        returns (bytes4)
    {
        revert HookNotImplemented();
    }

    // ============ Internal Functions ============

    /// @notice Calculate slippage in basis points by comparing expected vs actual amounts
    /// @dev For exactIn: compares expected output vs actual output (both in output token)
    /// @dev For exactOut: compares expected input vs actual input (both in input token)
    /// @param params The swap parameters
    /// @param delta The actual balance changes
    /// @param expectedAmount The expected amount from the quote (output for exactIn, input for exactOut)
    /// @return Slippage in basis points (0-10000)
    function _calculateSlippage(
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        uint256 expectedAmount
    ) internal pure returns (uint256) {
        if (expectedAmount == 0) return 0;

        // Get the actual amount for the relevant token
        // For exactIn (amountSpecified < 0): compare output amounts
        //   - zeroForOne=true: selling token0 for token1, so output is amount1 (positive = received)
        //   - zeroForOne=false: selling token1 for token0, so output is amount0 (positive = received)
        // For exactOut (amountSpecified > 0): compare input amounts
        //   - zeroForOne=true: selling token0 for token1, so input is amount0 (negative = spent)
        //   - zeroForOne=false: selling token1 for token0, so input is amount1 (negative = spent)

        int128 relevantDelta;
        bool isExactIn = params.amountSpecified < 0;

        if (isExactIn) {
            // For exactIn, we care about the output token amount
            relevantDelta = params.zeroForOne ? delta.amount1() : delta.amount0();
        } else {
            // For exactOut, we care about the input token amount
            relevantDelta = params.zeroForOne ? delta.amount0() : delta.amount1();
        }

        // Convert to absolute value for comparison
        // For exactIn output: positive delta is good (received tokens)
        // For exactOut input: negative delta means spent tokens, so negate to get positive
        uint256 actualAmount;
        if (isExactIn) {
            // Output should be positive (tokens received)
            actualAmount = relevantDelta > 0 ? uint256(int256(relevantDelta)) : 0;
        } else {
            // Input should be negative (tokens spent), convert to positive
            actualAmount = relevantDelta < 0 ? uint256(-int256(relevantDelta)) : 0;
        }

        // For exactIn: if we got more output than expected, no slippage (favorable)
        // For exactOut: if we spent less input than expected, no slippage (favorable)
        if (isExactIn && actualAmount >= expectedAmount) return 0;
        if (!isExactIn && actualAmount <= expectedAmount) return 0;

        // Calculate slippage as percentage difference
        // For exactIn: slippage = (expected - actual) / expected * 10000
        // For exactOut: slippage = (actual - expected) / expected * 10000
        if (isExactIn) {
            return ((expectedAmount - actualAmount) * MAX_SLIPPAGE_BPS) / expectedAmount;
        } else {
            return ((actualAmount - expectedAmount) * MAX_SLIPPAGE_BPS) / expectedAmount;
        }
    }
}

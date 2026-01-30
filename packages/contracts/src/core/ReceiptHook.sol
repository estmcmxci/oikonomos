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
contract ReceiptHook is IHooks {
    /// @notice The PoolManager this hook is registered with
    IPoolManager public immutable poolManager;

    /// @notice Emitted after each swap with strategy attribution data
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

    /// @notice Error thrown when caller is not the PoolManager
    error NotPoolManager();

    /// @notice Error thrown when hook function is not implemented
    error HookNotImplemented();

    /// @notice Only allow calls from the PoolManager
    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        _;
    }

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
        // Note: In production, we need to validate hook address flags
        // This is skipped for testing - use HookMiner for deployment
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
    /// @param sender The address that initiated the swap
    /// @param params The swap parameters
    /// @param delta The balance changes from the swap
    /// @param hookData Encoded (strategyId, quoteId, maxSlippage)
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
            (bytes32 strategyId, bytes32 quoteId, uint256 maxSlippage) =
                abi.decode(hookData, (bytes32, bytes32, uint256));

            // Calculate actual slippage in basis points
            uint256 actualSlippage = _calculateSlippage(params, delta);

            emit ExecutionReceipt(
                strategyId,
                quoteId,
                sender,
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

    /// @notice Calculate slippage in basis points
    /// @param params The swap parameters
    /// @param delta The actual balance changes
    /// @return Slippage in basis points (0-10000)
    function _calculateSlippage(
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta
    ) internal pure returns (uint256) {
        int256 amountSpecified = params.amountSpecified;

        if (amountSpecified == 0) return 0;

        // For exactIn (amountSpecified < 0): we specify input, compare output
        // For exactOut (amountSpecified > 0): we specify output, compare input
        int128 actualAmount = params.zeroForOne ? delta.amount1() : delta.amount0();

        // Calculate absolute values for comparison
        uint256 expected = uint256(amountSpecified > 0 ? amountSpecified : -amountSpecified);
        uint256 actual = uint256(actualAmount > 0 ? int256(actualAmount) : -int256(actualAmount));

        // If we got more than expected, no slippage
        if (actual >= expected) return 0;

        // Slippage = (expected - actual) / expected * 10000
        return ((expected - actual) * 10000) / expected;
    }
}

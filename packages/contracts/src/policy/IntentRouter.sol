// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {HookDataLib} from "../libraries/HookDataLib.sol";

/// @title IntentRouter
/// @notice Mode A intent-first execution router for Oikonomos
/// @dev Validates EIP-712 signed intents and executes swaps via Uniswap v4
contract IntentRouter is EIP712, IUnlockCallback, Ownable, Pausable {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    /// @notice Intent structure for signed swap requests
    struct Intent {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 maxSlippage; // basis points (100 = 1%)
        uint256 deadline;
        bytes32 strategyId;
        uint256 nonce;
    }

    /// @notice Callback data structure passed through unlock
    struct CallbackData {
        address user;
        PoolKey poolKey;
        IPoolManager.SwapParams swapParams;
        bytes hookData;
    }

    /// @notice The Uniswap v4 PoolManager
    IPoolManager public immutable POOL_MANAGER;

    /// @notice EIP-712 typehash for Intent
    bytes32 private constant INTENT_TYPEHASH = keccak256(
        "Intent(address user,address tokenIn,address tokenOut,uint256 amountIn,uint256 maxSlippage,uint256 deadline,bytes32 strategyId,uint256 nonce)"
    );

    /// @notice User nonces for replay protection
    mapping(address => uint256) public nonces;

    /// @notice Track executed intents to prevent double execution
    mapping(bytes32 => bool) public executedIntents;

    /// @notice Emitted when an intent is executed
    event IntentExecuted(
        bytes32 indexed intentHash,
        address indexed user,
        bytes32 indexed strategyId,
        uint256 amountIn,
        int256 amountOut
    );

    /// @notice Error thrown when signature is invalid
    error InvalidSignature();

    /// @notice Error thrown when intent has expired
    error IntentExpired();

    /// @notice Error thrown when intent was already executed
    error IntentAlreadyExecuted();

    /// @notice Error thrown when nonce is invalid
    error InvalidNonce();

    /// @notice Error thrown when caller is not PoolManager
    error NotPoolManager();

    /// @notice Error thrown when slippage exceeds maximum
    error SlippageExceeded();

    /// @notice Error thrown when token address is invalid
    error InvalidToken();

    constructor(address _poolManager) EIP712("OikonomosIntentRouter", "1") Ownable(msg.sender) {
        POOL_MANAGER = IPoolManager(_poolManager);
    }

    /// @notice Execute a signed intent
    /// @param intent The intent to execute
    /// @param signature The EIP-712 signature from the user
    /// @param poolKey The Uniswap v4 pool key
    /// @param strategyData Additional strategy-specific data
    /// @return amountOut The amount of tokens received
    function executeIntent(
        Intent calldata intent,
        bytes calldata signature,
        PoolKey calldata poolKey,
        bytes calldata strategyData
    ) external whenNotPaused returns (int256 amountOut) {
        // 1. Compute intent hash
        bytes32 intentHash = _hashIntent(intent);

        // 2. Validate intent
        if (executedIntents[intentHash]) revert IntentAlreadyExecuted();
        if (block.timestamp > intent.deadline) revert IntentExpired();
        if (intent.nonce != nonces[intent.user]) revert InvalidNonce();

        // 3. Verify signature
        bytes32 digest = _hashTypedDataV4(intentHash);
        address signer = digest.recover(signature);
        if (signer != intent.user) revert InvalidSignature();

        // 4. Mark as executed and increment nonce
        executedIntents[intentHash] = true;
        nonces[intent.user]++;

        // 5. Transfer tokens from user to this contract
        IERC20(intent.tokenIn).safeTransferFrom(intent.user, address(this), intent.amountIn);

        // 6. Approve PoolManager to spend tokens
        IERC20(intent.tokenIn).approve(address(POOL_MANAGER), intent.amountIn);

        // 7. Build hookData for ReceiptHook
        bytes32 quoteId = keccak256(strategyData);
        // expectedAmount is the minimum output (amountIn minus max slippage)
        uint256 expectedAmount = intent.amountIn * (10000 - intent.maxSlippage) / 10000;
        bytes memory hookData = HookDataLib.encode(
            intent.strategyId,
            quoteId,
            expectedAmount,
            intent.maxSlippage
        );

        // 8. Determine swap direction
        bool zeroForOne = Currency.unwrap(poolKey.currency0) == intent.tokenIn;

        // 9. Build swap params
        IPoolManager.SwapParams memory swapParams = IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: -int256(intent.amountIn), // Negative = exact input
            sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
        });

        // 10. Encode callback data
        bytes memory callbackData = abi.encode(CallbackData({
            user: intent.user,
            poolKey: poolKey,
            swapParams: swapParams,
            hookData: hookData
        }));

        // 11. Execute swap via PoolManager unlock
        bytes memory result = POOL_MANAGER.unlock(callbackData);

        // 12. Decode result
        BalanceDelta delta = abi.decode(result, (BalanceDelta));

        // 13. Calculate amountOut (positive value = tokens received)
        amountOut = zeroForOne ? -int256(int128(delta.amount1())) : -int256(int128(delta.amount0()));

        // 14. Check slippage (simplified - in production would compare to quote)
        // The ReceiptHook will emit the actual slippage in the ExecutionReceipt event

        // 15. Transfer output tokens to user
        address tokenOut = zeroForOne
            ? Currency.unwrap(poolKey.currency1)
            : Currency.unwrap(poolKey.currency0);

        if (amountOut > 0) {
            IERC20(tokenOut).safeTransfer(intent.user, uint256(amountOut));
        }

        emit IntentExecuted(intentHash, intent.user, intent.strategyId, intent.amountIn, amountOut);

        return amountOut;
    }

    /// @notice Callback from PoolManager during unlock
    /// @param data Encoded CallbackData
    /// @return Encoded BalanceDelta from swap
    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        if (msg.sender != address(POOL_MANAGER)) revert NotPoolManager();

        CallbackData memory cbData = abi.decode(data, (CallbackData));

        // Execute the swap
        BalanceDelta delta = POOL_MANAGER.swap(cbData.poolKey, cbData.swapParams, cbData.hookData);

        // Settle balances
        _settleBalances(cbData.poolKey, delta, cbData.swapParams.zeroForOne);

        return abi.encode(delta);
    }

    /// @notice Settle balances with PoolManager after swap
    /// @param poolKey The pool key
    /// @param delta The balance delta from swap
    function _settleBalances(
        PoolKey memory poolKey,
        BalanceDelta delta,
        bool /* zeroForOne - unused but kept for interface compatibility */
    ) internal {
        // delta.amount0() and delta.amount1() represent the changes to the pool
        // Positive = pool received tokens (we need to pay)
        // Negative = pool sent tokens (we need to take)

        int128 amount0 = delta.amount0();
        int128 amount1 = delta.amount1();

        // Settle currency0
        if (amount0 > 0) {
            // Pool expects to receive - we pay
            _pay(poolKey.currency0, uint128(amount0));
        } else if (amount0 < 0) {
            // Pool sends to us - we take
            _take(poolKey.currency0, uint128(-amount0));
        }

        // Settle currency1
        if (amount1 > 0) {
            // Pool expects to receive - we pay
            _pay(poolKey.currency1, uint128(amount1));
        } else if (amount1 < 0) {
            // Pool sends to us - we take
            _take(poolKey.currency1, uint128(-amount1));
        }
    }

    /// @notice Pay tokens to the PoolManager
    /// @param currency The currency to pay
    /// @param amount The amount to pay
    function _pay(Currency currency, uint256 amount) internal {
        POOL_MANAGER.sync(currency);
        IERC20(Currency.unwrap(currency)).transfer(address(POOL_MANAGER), amount);
        POOL_MANAGER.settle();
    }

    /// @notice Take tokens from the PoolManager
    /// @param currency The currency to take
    /// @param amount The amount to take
    function _take(Currency currency, uint256 amount) internal {
        POOL_MANAGER.take(currency, address(this), amount);
    }

    /// @notice Hash an intent for signing
    /// @param intent The intent to hash
    /// @return The EIP-712 struct hash
    function _hashIntent(Intent calldata intent) internal pure returns (bytes32) {
        return keccak256(abi.encode(
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
    }

    /// @notice Get the hash of an intent (for off-chain signing)
    /// @param intent The intent to hash
    /// @return The EIP-712 struct hash
    function getIntentHash(Intent calldata intent) external pure returns (bytes32) {
        return _hashIntent(intent);
    }

    /// @notice Get the current nonce for a user
    /// @param user The user address
    /// @return The current nonce
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    /// @notice Get the EIP-712 domain separator
    /// @return The domain separator
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ============ Admin Functions ============

    /// @notice Pause the contract
    /// @dev Only callable by owner
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract
    /// @dev Only callable by owner
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Rescue tokens accidentally sent to this contract
    /// @param token The token address to rescue
    /// @param to The recipient address
    /// @param amount The amount to rescue
    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        if (token == address(0)) revert InvalidToken();
        IERC20(token).safeTransfer(to, amount);
    }
}

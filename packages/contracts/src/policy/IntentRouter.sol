// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {HookDataLib} from "../libraries/HookDataLib.sol";

/// @title IntentRouter
/// @notice Mode A intent-first execution router for Oikonomos
/// @dev Validates EIP-712 signed intents and executes swaps via Uniswap v4
contract IntentRouter is EIP712 {
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

    /// @notice The Uniswap v4 PoolManager
    IPoolManager public immutable poolManager;

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
        uint256 amountOut
    );

    /// @notice Error thrown when signature is invalid
    error InvalidSignature();

    /// @notice Error thrown when intent has expired
    error IntentExpired();

    /// @notice Error thrown when intent was already executed
    error IntentAlreadyExecuted();

    /// @notice Error thrown when nonce is invalid
    error InvalidNonce();

    constructor(address _poolManager) EIP712("OikonomosIntentRouter", "1") {
        poolManager = IPoolManager(_poolManager);
    }

    /// @notice Execute a signed intent
    /// @param intent The intent to execute
    /// @param signature The EIP-712 signature from the user
    /// @param poolKey The Uniswap v4 pool key
    /// @param strategyData Additional strategy-specific data
    /// @return amountOut The amount of tokens received (placeholder for now)
    function executeIntent(
        Intent calldata intent,
        bytes calldata signature,
        PoolKey calldata poolKey,
        bytes calldata strategyData
    ) external returns (int256 amountOut) {
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

        // 6. Build hookData for ReceiptHook
        bytes32 quoteId = keccak256(strategyData);
        // Note: expectedAmount should come from the strategy quote in production
        // For MVP, we use amountIn as a placeholder since actual swap isn't executed
        uint256 expectedAmount = intent.amountIn;
        bytes memory hookData = HookDataLib.encode(
            intent.strategyId,
            quoteId,
            expectedAmount,
            intent.maxSlippage
        );

        // 7. Execute swap via PoolManager
        // Note: In production, this would integrate with UniversalRouter or custom unlock callback
        // For MVP, we emit the event and return placeholder
        // The actual swap execution depends on v4 integration pattern

        // Silence unused variable warnings
        poolKey;
        hookData;

        emit IntentExecuted(intentHash, intent.user, intent.strategyId, intent.amountIn, 0);

        return 0; // Placeholder - actual amount would come from swap
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
}

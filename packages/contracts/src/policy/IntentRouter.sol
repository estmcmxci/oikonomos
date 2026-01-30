// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {HookDataLib} from "../libraries/HookDataLib.sol";

/// @title IntentRouter
/// @notice Mode A intent-first execution router for Oikonomos
/// @dev Validates EIP-712 signed intents and executes swaps via Uniswap v4
///
/// MVP LIMITATIONS:
/// - This is a validation-only implementation that verifies intent signatures
/// - Actual swap execution via PoolManager is not yet implemented
/// - Tokens are NOT transferred in this MVP version to prevent fund lockup
/// - Full v4 integration requires UniversalRouter or custom unlock callback
/// - Slippage enforcement happens in ReceiptHook after actual swap execution
///
/// @custom:security-contact security@oikonomos.eth
contract IntentRouter is EIP712, Ownable, Pausable {
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
    /// @dev Nonces provide sufficient replay protection; no separate hash tracking needed
    mapping(address => uint256) public nonces;

    /// @notice Emitted when an intent is validated and executed
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

    /// @notice Error thrown when nonce is invalid
    error InvalidNonce();

    /// @notice Error thrown when trying to rescue zero address token
    error InvalidToken();

    constructor(address _poolManager) EIP712("OikonomosIntentRouter", "1") Ownable(msg.sender) {
        poolManager = IPoolManager(_poolManager);
    }

    /// @notice Execute a signed intent
    /// @param intent The intent to execute
    /// @param signature The EIP-712 signature from the user
    /// @param poolKey The Uniswap v4 pool key (unused in MVP)
    /// @param strategyData Additional strategy-specific data
    /// @return amountOut The amount of tokens received (0 in MVP - actual swap not implemented)
    ///
    /// @dev MVP LIMITATIONS:
    /// - Validates signature and intent parameters only
    /// - Does NOT transfer tokens (prevents fund lockup until swap is implemented)
    /// - Does NOT execute actual swap via PoolManager
    /// - Emits IntentExecuted event for off-chain tracking
    /// - Full implementation requires UniversalRouter or PoolManager.unlock() callback
    function executeIntent(
        Intent calldata intent,
        bytes calldata signature,
        PoolKey calldata poolKey,
        bytes calldata strategyData
    ) external whenNotPaused returns (int256 amountOut) {
        // 1. Compute intent hash
        bytes32 intentHash = _hashIntent(intent);

        // 2. Validate intent timing and nonce
        if (block.timestamp > intent.deadline) revert IntentExpired();
        if (intent.nonce != nonces[intent.user]) revert InvalidNonce();

        // 3. Verify signature BEFORE incrementing nonce
        bytes32 digest = _hashTypedDataV4(intentHash);
        address signer = digest.recover(signature);
        if (signer != intent.user) revert InvalidSignature();

        // 4. Increment nonce AFTER successful validation (replay protection)
        nonces[intent.user]++;

        // 5. Build hookData for ReceiptHook (prepared for future swap execution)
        bytes32 quoteId = keccak256(strategyData);
        bytes memory hookData = HookDataLib.encode(
            intent.strategyId,
            quoteId,
            intent.maxSlippage
        );

        // 6. MVP: Emit event for off-chain tracking
        // NOTE: In production, this is where we would:
        // - Transfer tokens from user: IERC20(intent.tokenIn).safeTransferFrom(...)
        // - Execute swap via PoolManager.unlock() with custom callback
        // - Verify output meets slippage requirements
        // - Transfer output tokens to user
        // Slippage enforcement happens in ReceiptHook.afterSwap()

        // Silence unused variable warnings (will be used in production)
        poolKey;
        hookData;

        emit IntentExecuted(intentHash, intent.user, intent.strategyId, intent.amountIn, 0);

        return 0; // MVP placeholder - actual amount would come from swap
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

    /// @notice Pause the contract in case of emergency
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
    /// @param to The address to send rescued tokens to
    /// @param amount The amount to rescue
    /// @dev Only callable by owner. Safety mechanism for accidentally stuck tokens.
    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        if (token == address(0)) revert InvalidToken();
        IERC20(token).safeTransfer(to, amount);
    }
}

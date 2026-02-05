// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title DelegationRouter
 * @notice Routes fee management operations from users to strategy providers
 *
 * This contract enables users to delegate fee management of their Clawnch-launched
 * tokens to strategy providers. Providers can claim fees from ClankerFeeLocker and
 * execute management policies on behalf of users.
 *
 * @dev Part of the Oikonomos meta-treasury manager pivot
 * @see PIVOT_SUMMARY.md
 */
interface IClankerFeeLocker {
    function claim(address token) external;
    function availableWethFees(address token, address wallet) external view returns (uint256);
    function availableTokenFees(address token, address wallet) external view returns (uint256);
}

contract DelegationRouter is EIP712 {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    // ============ Immutables ============

    /// @notice Clanker FeeLocker contract
    IClankerFeeLocker public immutable feeLocker;

    /// @notice WETH token address
    address public immutable weth;

    // ============ Constants ============

    /// @notice EIP-712 typehash for delegation intent
    bytes32 public constant DELEGATION_TYPEHASH = keccak256(
        "Delegation(address user,address provider,bytes32 tokensHash,uint256 claimFrequency,uint256 providerFeeBps,uint256 deadline,uint256 nonce)"
    );

    /// @notice Maximum provider fee (10%)
    uint256 public constant MAX_PROVIDER_FEE_BPS = 1000;

    // ============ State ============

    /// @notice User nonces for replay protection
    mapping(address => uint256) public nonces;

    /// @notice Active delegations by user
    mapping(address => Delegation) public delegations;

    // ============ Types ============

    struct Delegation {
        address provider;
        address[] tokens;
        uint256 claimFrequency;    // Minimum seconds between claims
        uint256 providerFeeBps;    // Provider fee in basis points
        uint256 deadline;          // Delegation expiry timestamp
        uint256 lastClaimTime;     // Last time fees were claimed
    }

    struct Policy {
        uint256 compoundPercentage;    // % to reinvest (0-100)
        uint256 toStablesPercentage;   // % to convert to stables (0-100)
        uint256 holdPercentage;        // % to keep as WETH (0-100)
        uint256 maxSlippageBps;        // Max slippage in basis points
    }

    // ============ Events ============

    event DelegationCreated(
        address indexed user,
        address indexed provider,
        address[] tokens,
        uint256 claimFrequency,
        uint256 providerFeeBps,
        uint256 deadline
    );

    event DelegationRevoked(address indexed user, address indexed provider);

    event FeesClaimed(
        address indexed user,
        address indexed provider,
        address indexed token,
        uint256 wethAmount,
        uint256 tokenAmount
    );

    event ManagementExecuted(
        address indexed user,
        address indexed provider,
        uint256 totalWethClaimed,
        uint256 providerFee
    );

    // ============ Errors ============

    error InvalidSignature();
    error DelegationExpired();
    error NotAuthorized();
    error TooSoon();
    error FeeTooHigh();
    error InvalidPolicy();
    error NoDelegation();

    // ============ Constructor ============

    constructor(
        address _feeLocker,
        address _weth
    ) EIP712("OikonomosDelegation", "1") {
        feeLocker = IClankerFeeLocker(_feeLocker);
        weth = _weth;
    }

    // ============ External Functions ============

    /**
     * @notice Create a delegation by verifying a signed intent
     * @param user User wallet address
     * @param provider Provider wallet address
     * @param tokens Tokens to manage
     * @param claimFrequency Minimum seconds between claims
     * @param providerFeeBps Provider fee in basis points
     * @param deadline Delegation expiry timestamp
     * @param signature EIP-712 signature from user
     */
    function createDelegation(
        address user,
        address provider,
        address[] calldata tokens,
        uint256 claimFrequency,
        uint256 providerFeeBps,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (block.timestamp >= deadline) revert DelegationExpired();
        if (providerFeeBps > MAX_PROVIDER_FEE_BPS) revert FeeTooHigh();

        // Verify signature
        bytes32 tokensHash = keccak256(abi.encodePacked(tokens));
        bytes32 structHash = keccak256(abi.encode(
            DELEGATION_TYPEHASH,
            user,
            provider,
            tokensHash,
            claimFrequency,
            providerFeeBps,
            deadline,
            nonces[user]++
        ));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        if (signer != user) revert InvalidSignature();

        // Store delegation
        delegations[user] = Delegation({
            provider: provider,
            tokens: tokens,
            claimFrequency: claimFrequency,
            providerFeeBps: providerFeeBps,
            deadline: deadline,
            lastClaimTime: 0
        });

        emit DelegationCreated(user, provider, tokens, claimFrequency, providerFeeBps, deadline);
    }

    /**
     * @notice Execute management actions on behalf of user
     * @dev Only callable by the delegated provider
     * @param user User whose portfolio to manage
     * @param policy Policy defining how to allocate claimed fees
     */
    function executeManagement(
        address user,
        Policy calldata policy
    ) external {
        Delegation storage delegation = delegations[user];

        if (msg.sender != delegation.provider) revert NotAuthorized();
        if (block.timestamp >= delegation.deadline) revert DelegationExpired();
        if (block.timestamp < delegation.lastClaimTime + delegation.claimFrequency) revert TooSoon();
        if (policy.compoundPercentage + policy.toStablesPercentage + policy.holdPercentage != 100) {
            revert InvalidPolicy();
        }

        uint256 totalWethClaimed = 0;

        // Claim fees for all tokens
        // Note: In production, this would call the actual FeeLocker
        // For now, we simulate by tracking what would be claimed
        for (uint256 i = 0; i < delegation.tokens.length; i++) {
            address token = delegation.tokens[i];

            uint256 wethBefore = IERC20(weth).balanceOf(address(this));
            uint256 tokenBefore = IERC20(token).balanceOf(address(this));

            // Claim from FeeLocker
            // The actual claim transfers fees to the caller (this contract)
            feeLocker.claim(token);

            uint256 wethClaimed = IERC20(weth).balanceOf(address(this)) - wethBefore;
            uint256 tokenClaimed = IERC20(token).balanceOf(address(this)) - tokenBefore;

            totalWethClaimed += wethClaimed;

            emit FeesClaimed(user, msg.sender, token, wethClaimed, tokenClaimed);

            // Transfer token fees directly to user
            if (tokenClaimed > 0) {
                IERC20(token).safeTransfer(user, tokenClaimed);
            }
        }

        // Calculate and pay provider fee
        uint256 providerFee = (totalWethClaimed * delegation.providerFeeBps) / 10000;
        if (providerFee > 0) {
            IERC20(weth).safeTransfer(msg.sender, providerFee);
        }

        // Execute policy with remaining WETH
        uint256 remaining = totalWethClaimed - providerFee;
        _executePolicy(user, remaining, policy);

        // Update last claim time
        delegation.lastClaimTime = block.timestamp;

        emit ManagementExecuted(user, msg.sender, totalWethClaimed, providerFee);
    }

    /**
     * @notice Revoke delegation
     * @dev Only callable by the user
     */
    function revokeDelegation() external {
        Delegation storage delegation = delegations[msg.sender];
        if (delegation.provider == address(0)) revert NoDelegation();

        address provider = delegation.provider;
        delete delegations[msg.sender];

        emit DelegationRevoked(msg.sender, provider);
    }

    // ============ View Functions ============

    /**
     * @notice Get delegation details for a user
     */
    function getDelegation(address user) external view returns (
        address provider,
        address[] memory tokens,
        uint256 claimFrequency,
        uint256 providerFeeBps,
        uint256 deadline,
        uint256 lastClaimTime
    ) {
        Delegation storage d = delegations[user];
        return (
            d.provider,
            d.tokens,
            d.claimFrequency,
            d.providerFeeBps,
            d.deadline,
            d.lastClaimTime
        );
    }

    /**
     * @notice Check if delegation is active
     */
    function isDelegationActive(address user) external view returns (bool) {
        Delegation storage d = delegations[user];
        return d.provider != address(0) && block.timestamp < d.deadline;
    }

    /**
     * @notice Check if management can be executed
     */
    function canExecuteManagement(address user) external view returns (bool) {
        Delegation storage d = delegations[user];
        return d.provider != address(0) &&
               block.timestamp < d.deadline &&
               block.timestamp >= d.lastClaimTime + d.claimFrequency;
    }

    /**
     * @notice Get EIP-712 domain separator
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ============ Internal Functions ============

    function _executePolicy(
        address user,
        uint256 wethAmount,
        Policy calldata policy
    ) internal {
        if (wethAmount == 0) return;

        // Hold portion - transfer to user
        uint256 holdAmount = (wethAmount * policy.holdPercentage) / 100;
        if (holdAmount > 0) {
            IERC20(weth).safeTransfer(user, holdAmount);
        }

        // Compound portion - for now, also transfer to user
        // In production, this would add to LP positions
        uint256 compoundAmount = (wethAmount * policy.compoundPercentage) / 100;
        if (compoundAmount > 0) {
            // TODO: Add to LP positions via Uniswap
            IERC20(weth).safeTransfer(user, compoundAmount);
        }

        // Stables portion - for now, also transfer to user
        // In production, this would swap WETH to USDC
        uint256 stablesAmount = (wethAmount * policy.toStablesPercentage) / 100;
        if (stablesAmount > 0) {
            // TODO: Swap WETH to USDC via Uniswap
            IERC20(weth).safeTransfer(user, stablesAmount);
        }
    }
}

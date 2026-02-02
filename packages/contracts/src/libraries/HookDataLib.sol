// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title HookDataLib
/// @notice Library for encoding and decoding hook data for ReceiptHook
library HookDataLib {
    /// @notice Maximum allowed slippage in basis points (100%)
    uint256 internal constant MAX_SLIPPAGE_BPS = 10000;

    /// @notice Error thrown when maxSlippage exceeds bounds
    error InvalidSlippageBounds();

    /// @notice Error thrown when user address is zero
    error InvalidUserAddress();

    /// @notice Encode strategy data for hook consumption
    /// @param strategyId The strategy identifier (ENS namehash or agent ID)
    /// @param quoteId The quote identifier for tracking
    /// @param expectedAmount Expected output (exactIn) or expected input (exactOut) from quote
    /// @param maxSlippage Maximum acceptable slippage in basis points (0-10000)
    /// @param userAddress The actual user who initiated the swap (not the router)
    /// @return Encoded bytes for hookData parameter
    function encode(
        bytes32 strategyId,
        bytes32 quoteId,
        uint256 expectedAmount,
        uint256 maxSlippage,
        address userAddress
    ) internal pure returns (bytes memory) {
        if (maxSlippage > MAX_SLIPPAGE_BPS) revert InvalidSlippageBounds();
        if (userAddress == address(0)) revert InvalidUserAddress();
        return abi.encode(strategyId, quoteId, expectedAmount, maxSlippage, userAddress);
    }

    /// @notice Decode hook data back to components
    /// @param hookData The encoded hook data
    /// @return strategyId The strategy identifier
    /// @return quoteId The quote identifier
    /// @return expectedAmount Expected output (exactIn) or expected input (exactOut)
    /// @return maxSlippage Maximum acceptable slippage in basis points
    /// @return userAddress The actual user who initiated the swap
    function decode(bytes memory hookData) internal pure returns (
        bytes32 strategyId,
        bytes32 quoteId,
        uint256 expectedAmount,
        uint256 maxSlippage,
        address userAddress
    ) {
        return abi.decode(hookData, (bytes32, bytes32, uint256, uint256, address));
    }

    /// @notice Generate a strategy ID from an ENS name
    /// @param ensName The ENS name (e.g., "treasury.oikonomos.eth")
    /// @return strategyId The keccak256 hash of the ENS name
    function strategyIdFromEns(string memory ensName) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(ensName));
    }
}

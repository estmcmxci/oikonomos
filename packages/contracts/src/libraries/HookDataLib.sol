// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title HookDataLib
/// @notice Library for encoding and decoding hook data for ReceiptHook
library HookDataLib {
    /// @notice Encode strategy data for hook consumption
    /// @param strategyId The strategy identifier (ENS namehash or agent ID)
    /// @param quoteId The quote identifier for tracking
    /// @param maxSlippage Maximum acceptable slippage in basis points
    /// @return Encoded bytes for hookData parameter
    function encode(
        bytes32 strategyId,
        bytes32 quoteId,
        uint256 maxSlippage
    ) internal pure returns (bytes memory) {
        return abi.encode(strategyId, quoteId, maxSlippage);
    }

    /// @notice Decode hook data back to components
    /// @param hookData The encoded hook data
    /// @return strategyId The strategy identifier
    /// @return quoteId The quote identifier
    /// @return maxSlippage Maximum acceptable slippage in basis points
    function decode(bytes memory hookData) internal pure returns (
        bytes32 strategyId,
        bytes32 quoteId,
        uint256 maxSlippage
    ) {
        return abi.decode(hookData, (bytes32, bytes32, uint256));
    }

    /// @notice Generate a strategy ID from an ENS name
    /// @param ensName The ENS name (e.g., "treasury.oikonomos.eth")
    /// @return strategyId The keccak256 hash of the ENS name
    function strategyIdFromEns(string memory ensName) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(ensName));
    }
}

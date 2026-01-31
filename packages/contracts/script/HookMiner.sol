// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

/// @title HookMiner
/// @notice Library for mining hook addresses with specific flag bits
/// @dev Based on Uniswap v4-periphery HookMiner
library HookMiner {
    /// @dev Mask to isolate the lower 14 bits (hook permission flags)
    uint160 constant FLAG_MASK = 0x3FFF;

    /// @dev Maximum iterations to prevent infinite loops
    uint256 constant MAX_LOOP = 500_000;

    /// @notice Find a salt that produces a hook address with desired flags
    /// @param deployer The CREATE2 deployer address (0x4e59b44847b379578588920cA78FbF26c0B4956C for production)
    /// @param flags The required flag bits (e.g., 0x0040 for AFTER_SWAP_FLAG)
    /// @param creationCode The contract creation code (type(Contract).creationCode)
    /// @param constructorArgs ABI-encoded constructor arguments
    /// @return hookAddress The address where the hook will deploy
    /// @return salt The salt to use for CREATE2 deployment
    function find(
        address deployer,
        uint160 flags,
        bytes memory creationCode,
        bytes memory constructorArgs
    ) internal pure returns (address hookAddress, bytes32 salt) {
        flags = flags & FLAG_MASK;
        bytes memory creationCodeWithArgs = abi.encodePacked(creationCode, constructorArgs);
        bytes32 initCodeHash = keccak256(creationCodeWithArgs);

        for (uint256 i = 0; i < MAX_LOOP; i++) {
            salt = bytes32(i);
            hookAddress = computeAddress(deployer, salt, initCodeHash);

            if (uint160(hookAddress) & FLAG_MASK == flags) {
                return (hookAddress, salt);
            }
        }
        revert("HookMiner: could not find salt");
    }

    /// @notice Compute CREATE2 address
    /// @param deployer The deployer address
    /// @param salt The salt value
    /// @param initCodeHash The keccak256 hash of creation code + constructor args
    /// @return The computed address
    function computeAddress(
        address deployer,
        bytes32 salt,
        bytes32 initCodeHash
    ) internal pure returns (address) {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(bytes1(0xFF), deployer, salt, initCodeHash)
                    )
                )
            )
        );
    }
}

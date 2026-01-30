// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title HookMiner
/// @notice Library for mining hook addresses with specific flag patterns
/// @dev Uniswap v4 hooks must have addresses that encode their permissions in the lower bits
library HookMiner {
    /// @notice Find a salt that produces a hook address with the desired flags
    /// @param deployer The CREATE2 deployer address
    /// @param flags The required hook flags (encoded in lower 14 bits)
    /// @param creationCode The contract creation bytecode
    /// @param constructorArgs The encoded constructor arguments
    /// @return hookAddress The computed hook address
    /// @return salt The salt that produces the hook address
    function find(
        address deployer,
        uint160 flags,
        bytes memory creationCode,
        bytes memory constructorArgs
    ) internal pure returns (address hookAddress, bytes32 salt) {
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 bytecodeHash = keccak256(bytecode);

        uint256 saltValue = 0;
        while (true) {
            salt = bytes32(saltValue);
            hookAddress = computeAddress(deployer, salt, bytecodeHash);

            // Check if the lower 14 bits match the required flags
            if (uint160(hookAddress) & 0x3FFF == flags) {
                return (hookAddress, salt);
            }

            saltValue++;

            // Safety limit to prevent infinite loops in tests
            if (saltValue > 100000) {
                revert("HookMiner: could not find salt");
            }
        }
    }

    /// @notice Compute the CREATE2 address
    /// @param deployer The deployer address
    /// @param salt The salt value
    /// @param bytecodeHash The hash of the creation bytecode
    /// @return The computed address
    function computeAddress(
        address deployer,
        bytes32 salt,
        bytes32 bytecodeHash
    ) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            deployer,
            salt,
            bytecodeHash
        )))));
    }
}

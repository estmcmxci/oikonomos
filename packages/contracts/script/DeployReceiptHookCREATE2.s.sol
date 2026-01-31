// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {ReceiptHook} from "../src/core/ReceiptHook.sol";
import {HookMiner} from "./HookMiner.sol";

/// @title DeployReceiptHookCREATE2
/// @notice Deploy ReceiptHook via CREATE2 with mined salt for correct address flags
/// @dev OIK-11: Ensures hook address has AFTER_SWAP_FLAG (0x0040) in lower 14 bits
contract DeployReceiptHookCREATE2 is Script {
    // ============ Constants ============

    /// @dev Sepolia Uniswap v4 PoolManager
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    /// @dev Deterministic CREATE2 deployer (same on all EVM chains)
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    /// @dev AFTER_SWAP_FLAG = 1 << 6 = 0x0040 = 64
    uint160 constant AFTER_SWAP_FLAG = 0x0040;

    /// @dev Mask for lower 14 bits
    uint160 constant FLAG_MASK = 0x3FFF;

    // ============ Pre-mined Salt ============
    // Mined using: npx tsx script/mine-hook-salt.ts
    // Init code hash: 0x75592c3813bb807f794f2db22bcbbea678688554bff13221de368747158e81d7
    // Expected address: 0xea155cf7d152125839e66b585b9e455621b7c040
    bytes32 constant MINED_SALT = bytes32(uint256(43988));

    // ============ Deployment ============

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        // Get creation code with constructor args
        bytes memory creationCode = type(ReceiptHook).creationCode;
        bytes memory constructorArgs = abi.encode(POOL_MANAGER);
        bytes memory initCode = abi.encodePacked(creationCode, constructorArgs);

        // Compute expected address
        address expectedAddress = computeHookAddress(MINED_SALT, keccak256(initCode));

        console.log("=== ReceiptHook CREATE2 Deployment ===");
        console.log("PoolManager:", POOL_MANAGER);
        console.log("CREATE2 Deployer:", CREATE2_DEPLOYER);
        console.log("Salt:", uint256(MINED_SALT));
        console.log("Expected address:", expectedAddress);

        // Verify the address has correct flags
        uint160 flags = uint160(expectedAddress) & FLAG_MASK;
        console.log("Address flags:", flags);
        require(flags == AFTER_SWAP_FLAG, "Invalid address flags! Re-mine the salt.");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy via CREATE2 using the deterministic deployer
        // The CREATE2 deployer expects: salt (32 bytes) + initCode
        bytes memory deployData = abi.encodePacked(MINED_SALT, initCode);

        (bool success, bytes memory returnData) = CREATE2_DEPLOYER.call(deployData);
        require(success, "CREATE2 deployment failed");

        address deployedAddress = address(uint160(bytes20(returnData)));
        console.log("Deployed address:", deployedAddress);

        // Verify deployment
        require(deployedAddress == expectedAddress, "Address mismatch!");

        ReceiptHook hook = ReceiptHook(deployedAddress);
        console.log("PoolManager (from hook):", address(hook.poolManager()));

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Successful ===");
        console.log("ReceiptHook deployed at:", deployedAddress);
        console.log("Address flags: 0x%x (%d)", flags, flags);
        console.log("");
        console.log("Update these files:");
        console.log("  - packages/shared/src/constants.ts");
        console.log("  - .env.example");
    }

    /// @notice Compute CREATE2 address for our deployer
    function computeHookAddress(
        bytes32 salt,
        bytes32 initCodeHash
    ) internal pure returns (address) {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(bytes1(0xFF), CREATE2_DEPLOYER, salt, initCodeHash)
                    )
                )
            )
        );
    }
}

/// @title MineAndDeployReceiptHook
/// @notice Mine salt on-chain and deploy in one transaction
/// @dev Use this for development/testing. For production, use pre-mined salt.
contract MineAndDeployReceiptHook is Script {
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
    uint160 constant AFTER_SWAP_FLAG = 0x0040;

    function run() external {
        console.log("=== Mining Hook Salt ===");

        // Mine the salt
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            AFTER_SWAP_FLAG,
            type(ReceiptHook).creationCode,
            abi.encode(POOL_MANAGER)
        );

        console.log("Found valid salt!");
        console.log("Salt (decimal):", uint256(salt));
        console.log("Expected address:", hookAddress);
        console.log("Address flags:", uint160(hookAddress) & 0x3FFF);

        // Now deploy
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        bytes memory initCode = abi.encodePacked(
            type(ReceiptHook).creationCode,
            abi.encode(POOL_MANAGER)
        );
        bytes memory deployData = abi.encodePacked(salt, initCode);

        (bool success,) = CREATE2_DEPLOYER.call(deployData);
        require(success, "Deployment failed");

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("ReceiptHook:", hookAddress);
    }
}

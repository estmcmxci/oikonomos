// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";
import {ReceiptHook} from "../src/core/ReceiptHook.sol";

/// @title DeployReceiptHookWithMiner
/// @notice Deployment script for ReceiptHook using CREATE2 with address mining
/// @dev Mines a salt that produces an address with the correct hook flag bits
contract DeployReceiptHookWithMiner is Script {
    // Sepolia Uniswap v4 PoolManager
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    // CREATE2 Deployer Proxy (standard address used by forge)
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        // ReceiptHook only needs afterSwap permission
        uint160 flags = uint160(Hooks.AFTER_SWAP_FLAG);

        console.log("Mining CREATE2 address for ReceiptHook...");
        console.log("Required flags: afterSwap (bit 6)");
        console.log("Flag value:", flags);

        // Get creation code and constructor args
        bytes memory creationCode = type(ReceiptHook).creationCode;
        bytes memory constructorArgs = abi.encode(IPoolManager(POOL_MANAGER));

        // Mine the address
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            creationCode,
            constructorArgs
        );

        console.log("");
        console.log("Found valid address!");
        console.log("Hook address:", hookAddress);
        console.log("Salt:", vm.toString(salt));
        console.log("");

        // Verify the address has correct flags
        require(
            uint160(hookAddress) & Hooks.AFTER_SWAP_FLAG != 0,
            "Address does not have AFTER_SWAP_FLAG"
        );

        vm.startBroadcast(deployerPrivateKey);

        // Deploy using CREATE2 with the mined salt
        ReceiptHook hook = new ReceiptHook{salt: salt}(IPoolManager(POOL_MANAGER));

        console.log("ReceiptHook deployed at:", address(hook));
        require(address(hook) == hookAddress, "Deployed address mismatch");

        // Verify hook permissions
        Hooks.Permissions memory permissions = hook.getHookPermissions();
        require(permissions.afterSwap, "afterSwap permission not set");
        require(!permissions.beforeSwap, "beforeSwap should not be set");

        console.log("");
        console.log("Deployment successful!");
        console.log("Hook permissions verified: afterSwap = true");

        vm.stopBroadcast();
    }

    /// @notice Dry run to find and display the hook address without deploying
    function dryRun() external view {
        uint160 flags = uint160(Hooks.AFTER_SWAP_FLAG);

        console.log("=== DRY RUN: Finding CREATE2 address ===");
        console.log("Required flags: afterSwap (bit 6)");

        bytes memory creationCode = type(ReceiptHook).creationCode;
        bytes memory constructorArgs = abi.encode(IPoolManager(POOL_MANAGER));

        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            creationCode,
            constructorArgs
        );

        console.log("");
        console.log("Found valid address:");
        console.log("  Hook address:", hookAddress);
        console.log("  Salt:", vm.toString(salt));
        console.log("  Flags (hex):", vm.toString(bytes32(uint256(uint160(hookAddress) & Hooks.ALL_HOOK_MASK))));

        // Verify flags
        bool hasAfterSwap = uint160(hookAddress) & Hooks.AFTER_SWAP_FLAG != 0;
        console.log("  Has AFTER_SWAP_FLAG:", hasAfterSwap);
    }
}

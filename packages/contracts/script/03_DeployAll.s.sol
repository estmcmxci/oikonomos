// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {ReceiptHook} from "../src/core/ReceiptHook.sol";
import {IdentityRegistry} from "../src/identity/IdentityRegistry.sol";
import {IntentRouter} from "../src/policy/IntentRouter.sol";

/// @title DeployAll
/// @notice Deploys all Phase 1 contracts in a single transaction
contract DeployAll is Script {
    // Sepolia Uniswap v4 PoolManager
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ReceiptHook
        // Note: This doesn't use CREATE2 mining, so may fail validation on testnet
        ReceiptHook hook = new ReceiptHook(IPoolManager(POOL_MANAGER));
        console.log("ReceiptHook deployed at:", address(hook));

        // Deploy IdentityRegistry
        IdentityRegistry registry = new IdentityRegistry();
        console.log("IdentityRegistry deployed at:", address(registry));

        // Deploy IntentRouter
        IntentRouter router = new IntentRouter(POOL_MANAGER);
        console.log("IntentRouter deployed at:", address(router));

        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("RECEIPT_HOOK_ADDRESS=", address(hook));
        console.log("IDENTITY_REGISTRY_ADDRESS=", address(registry));
        console.log("INTENT_ROUTER_ADDRESS=", address(router));

        vm.stopBroadcast();
    }
}

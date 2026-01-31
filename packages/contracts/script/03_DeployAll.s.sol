// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {ReceiptHook} from "../src/core/ReceiptHook.sol";
import {IntentRouter} from "../src/policy/IntentRouter.sol";

/// @title DeployAll
/// @notice Deploys Oikonomos contracts (uses canonical ERC-8004 registries)
/// @dev IdentityRegistry and ReputationRegistry are canonical ERC-8004 contracts:
///      - Sepolia IdentityRegistry: 0x8004A818BFB912233c491871b3d84c89A494BD9e
///      - Sepolia ReputationRegistry: 0x8004B663056A597Dffe9eCcC1965A193B7388713
///      - Mainnet IdentityRegistry: 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
///      - Mainnet ReputationRegistry: 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
contract DeployAll is Script {
    // Sepolia Uniswap v4 PoolManager
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    // Canonical ERC-8004 registries (Sepolia)
    address constant IDENTITY_REGISTRY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;
    address constant REPUTATION_REGISTRY = 0x8004B663056A597Dffe9eCcC1965A193B7388713;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ReceiptHook
        // Note: This doesn't use CREATE2 mining, so may fail validation on testnet
        ReceiptHook hook = new ReceiptHook(IPoolManager(POOL_MANAGER));
        console.log("ReceiptHook deployed at:", address(hook));

        // Deploy IntentRouter
        IntentRouter router = new IntentRouter(POOL_MANAGER);
        console.log("IntentRouter deployed at:", address(router));

        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("RECEIPT_HOOK_ADDRESS=", address(hook));
        console.log("INTENT_ROUTER_ADDRESS=", address(router));
        console.log("");
        console.log("=== Canonical ERC-8004 Registries (pre-deployed) ===");
        console.log("IDENTITY_REGISTRY_ADDRESS=", IDENTITY_REGISTRY);
        console.log("REPUTATION_REGISTRY_ADDRESS=", REPUTATION_REGISTRY);
        console.log("");
        console.log("Note: IdentityRegistry and ReputationRegistry are canonical ERC-8004 contracts.");
        console.log("Register agents via SDK: npx ts-node packages/sdk/src/scripts/registerAgent.ts");

        vm.stopBroadcast();
    }
}

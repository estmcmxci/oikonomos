// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {ReceiptHook} from "../src/core/ReceiptHook.sol";

/// @title DeployReceiptHook
/// @notice Deployment script for ReceiptHook
/// @dev Note: Hook deployment requires address mining for correct flags
///      For production, use HookMiner to find appropriate salt
contract DeployReceiptHook is Script {
    // Sepolia Uniswap v4 PoolManager
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // WARNING: This deploys without address mining
        // For production use, you need to mine an address with the correct flag bits
        // The afterSwap flag requires specific bits in the address
        //
        // For testing purposes, this works with local chains where validation is disabled
        // For Sepolia deployment, use CREATE2 with HookMiner to find the right salt

        ReceiptHook hook = new ReceiptHook(IPoolManager(POOL_MANAGER));

        console.log("ReceiptHook deployed at:", address(hook));
        console.log("");
        console.log("WARNING: This deployment may fail hook validation on mainnet/testnet");
        console.log("For production, use CREATE2 with mined salt for correct address flags");

        vm.stopBroadcast();
    }
}

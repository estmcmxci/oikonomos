// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IntentRouter} from "../src/policy/IntentRouter.sol";

/// @title DeployIntentRouter
/// @notice Deployment script for IntentRouter
contract DeployIntentRouter is Script {
    // Sepolia Uniswap v4 PoolManager
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        IntentRouter router = new IntentRouter(POOL_MANAGER);

        console.log("IntentRouter deployed at:", address(router));

        vm.stopBroadcast();
    }
}

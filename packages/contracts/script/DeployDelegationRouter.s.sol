// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {DelegationRouter} from "../src/DelegationRouter.sol";

/**
 * @title DeployDelegationRouter
 * @notice Deployment script for DelegationRouter contract
 *
 * Usage:
 *   forge script script/DeployDelegationRouter.s.sol:DeployDelegationRouter \
 *     --rpc-url $BASE_SEPOLIA_RPC_URL \
 *     --broadcast \
 *     --verify
 */
contract DeployDelegationRouter is Script {
    // Base Sepolia addresses
    address constant FEE_LOCKER = 0x42A95190B4088C88Dd904d930c79deC1158bF09D;
    address constant WETH = 0x4200000000000000000000000000000000000006;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        address deployer = vm.addr(deployerKey);

        console2.log("Deployer address:", deployer);
        console2.log("Deploying to Base Sepolia...");

        vm.startBroadcast(deployerKey);

        DelegationRouter router = new DelegationRouter(FEE_LOCKER, WETH);

        vm.stopBroadcast();

        console2.log("DelegationRouter deployed at:", address(router));
        console2.log("");
        console2.log("Configuration:");
        console2.log("  FeeLocker:", FEE_LOCKER);
        console2.log("  WETH:", WETH);
        console2.log("  Domain Separator:", vm.toString(router.DOMAIN_SEPARATOR()));
    }
}

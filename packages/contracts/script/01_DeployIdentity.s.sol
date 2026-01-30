// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IdentityRegistry} from "../src/identity/IdentityRegistry.sol";

/// @title DeployIdentity
/// @notice Deployment script for IdentityRegistry
contract DeployIdentity is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        IdentityRegistry registry = new IdentityRegistry();

        console.log("IdentityRegistry deployed at:", address(registry));

        vm.stopBroadcast();
    }
}

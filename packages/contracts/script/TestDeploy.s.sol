// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";

contract TestDeploy is Script {
    function run() external {
        console.log("Test script running...");

        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        console.log("Deployer:", deployer);

        vm.startBroadcast(pk);
        console.log("Broadcast started");
        vm.stopBroadcast();

        console.log("Done");
    }
}

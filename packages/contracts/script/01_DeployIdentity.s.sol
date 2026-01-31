// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";

/// @title DeployIdentity
/// @notice DEPRECATED - Use canonical ERC-8004 IdentityRegistry instead
/// @dev The canonical ERC-8004 IdentityRegistry is already deployed:
///      - Sepolia: 0x8004A818BFB912233c491871b3d84c89A494BD9e
///      - Mainnet: 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
///      See: https://howto8004.com
contract DeployIdentity is Script {
    function run() external pure {
        revert(
            "DEPRECATED: Use canonical ERC-8004 IdentityRegistry. "
            "Sepolia: 0x8004A818BFB912233c491871b3d84c89A494BD9e"
        );
    }
}

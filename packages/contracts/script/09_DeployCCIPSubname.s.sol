// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {OffchainSubnameManager} from "../src/ccip/OffchainSubnameManager.sol";

/// @title DeployCCIPSubname
/// @notice Deploys the OffchainSubnameManager for oikonomos.eth subname registration
/// @dev Required environment variables:
///      - PRIVATE_KEY: Deployer private key
///      - CCIP_TRUSTED_SIGNER: Address authorized to sign gateway responses
///      - CCIP_GATEWAY_URL: CCIP-Read gateway URL (e.g., https://oikonomos-ccip.workers.dev)
contract DeployCCIPSubname is Script {
    // ENS Registry (same on mainnet and all testnets)
    address constant ENS_REGISTRY = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;

    // ENS Public Resolver on Sepolia
    address constant SEPOLIA_PUBLIC_RESOLVER = 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD;

    // ERC-8004 Identity Registry on Sepolia
    address constant SEPOLIA_IDENTITY_REGISTRY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;

    // Note: namehash("oikonomos.eth") should be computed and set in environment
    // or computed at runtime. For now, we compute it in the script.

    function run() external {
        // Load environment variables
        address trustedSigner = vm.envAddress("CCIP_TRUSTED_SIGNER");
        string memory gatewayUrl = vm.envString("CCIP_GATEWAY_URL");

        console.log("Deploying OffchainSubnameManager...");
        console.log("Trusted Signer:", trustedSigner);
        console.log("Gateway URL:", gatewayUrl);
        console.log("ENS Registry:", ENS_REGISTRY);
        console.log("Default Resolver:", SEPOLIA_PUBLIC_RESOLVER);
        console.log("Identity Registry:", SEPOLIA_IDENTITY_REGISTRY);

        // Create gateway URLs array
        string[] memory gatewayURLs = new string[](1);
        gatewayURLs[0] = gatewayUrl;

        vm.startBroadcast();

        OffchainSubnameManager manager = new OffchainSubnameManager(
            trustedSigner,
            ENS_REGISTRY,
            gatewayURLs,
            SEPOLIA_PUBLIC_RESOLVER,
            0, // defaultTTL
            SEPOLIA_IDENTITY_REGISTRY
        );

        vm.stopBroadcast();

        console.log("OffchainSubnameManager deployed at:", address(manager));
        console.log("");
        console.log("IMPORTANT: Next steps:");
        console.log("1. Register oikonomos.eth on Sepolia (if not already owned)");
        console.log("2. From the oikonomos.eth owner wallet, grant approval:");
        console.log("   cast send 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e \\");
        console.log("     \"setApprovalForAll(address,bool)\" \\");
        console.log("     ", address(manager), " true \\");
        console.log("     --rpc-url $SEPOLIA_RPC_URL --private-key $OWNER_PRIVATE_KEY");
        console.log("");
        console.log("3. Update the gateway worker with CONTRACT_ADDRESS:", address(manager));
    }
}

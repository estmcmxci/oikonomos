// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";

/// @notice ERC-8004 IdentityRegistry interface (canonical version)
interface IERC8004IdentityRegistry {
    struct MetadataEntry {
        string key;
        bytes value;
    }

    function register(string calldata agentURI) external returns (uint256 agentId);
    function register(string calldata agentURI, MetadataEntry[] calldata metadata) external returns (uint256 agentId);
    function register() external returns (uint256 agentId);

    function setAgentURI(uint256 agentId, string calldata newURI) external;
    function getMetadata(uint256 agentId, string memory metadataKey) external view returns (bytes memory);
    function setMetadata(uint256 agentId, string memory metadataKey, bytes memory metadataValue) external;
    function getAgentWallet(uint256 agentId) external view returns (address);

    function ownerOf(uint256 tokenId) external view returns (address);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

/// @title RegisterTestAgent
/// @notice Register a test agent with the canonical ERC-8004 IdentityRegistry
contract RegisterTestAgent is Script {
    // Canonical ERC-8004 IdentityRegistry on Sepolia
    address constant IDENTITY_REGISTRY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;

    // Deployed contract addresses
    address constant INTENT_ROUTER = 0x89223f6157cDE457B37763A70ed4E6A302F23683;
    address constant RECEIPT_HOOK = 0x41a75f07bA1958EcA78805D8419C87a393764040;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        string memory agentURI = vm.envOr("AGENT_URI", string("ipfs://QmTreasuryAgentOikonomos"));

        vm.startBroadcast(deployerPrivateKey);

        IERC8004IdentityRegistry registry = IERC8004IdentityRegistry(IDENTITY_REGISTRY);

        console.log("=== Registering Agent with ERC-8004 IdentityRegistry ===");
        console.log("");
        console.log("Registry address:", IDENTITY_REGISTRY);
        console.log("Agent URI:", agentURI);

        // Register the agent with just the URI
        uint256 agentId = registry.register(agentURI);

        console.log("");
        console.log("Agent registered successfully!");
        console.log("  agentId:", agentId);

        // Get agent wallet to verify
        address wallet = registry.getAgentWallet(agentId);
        console.log("  agentWallet:", wallet);

        // Get URI
        string memory uri = registry.tokenURI(agentId);
        console.log("  agentURI:", uri);

        console.log("");
        console.log("=== ENS Text Records Configuration ===");
        console.log("Set these text records for treasury.oikonomos.eth:");
        console.log("");
        console.log("  agent:type = treasury");
        console.log("  agent:mode = intent-only");
        console.log("  agent:entrypoint =", INTENT_ROUTER);
        console.log("  agent:erc8004 = eip155:11155111:", IDENTITY_REGISTRY, ":", agentId);
        console.log("  agent:a2a = https://treasury-agent.oikonomos.workers.dev");

        console.log("");
        console.log("=== SDK Configuration ===");
        console.log("Add to .env or agent config:");
        console.log("");
        console.log("AGENT_ID=", agentId);
        console.log("IDENTITY_REGISTRY=", IDENTITY_REGISTRY);
        console.log("INTENT_ROUTER=", INTENT_ROUTER);
        console.log("RECEIPT_HOOK=", RECEIPT_HOOK);

        vm.stopBroadcast();
    }
}

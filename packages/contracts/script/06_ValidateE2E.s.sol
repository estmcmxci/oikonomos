// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";

/// @notice Minimal interfaces for validation
interface IReceiptHook {
    function poolManager() external view returns (address);
}

interface IIntentRouter {
    function POOL_MANAGER() external view returns (address);
    function nonces(address user) external view returns (uint256);
}

interface IERC8004 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getAgentWallet(uint256 agentId) external view returns (address);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function symbol() external view returns (string memory);
}

/// @title ValidateE2E
/// @notice Validates the E2E integration for OIK-13
contract ValidateE2E is Script {
    // Deployed addresses from OIK-13
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant RECEIPT_HOOK = 0x15d3b7CbC9463f92a88cE7B1B384277DA741C040;
    address constant INTENT_ROUTER = 0x855B735aC495f06E46cf01A1607706dF43c82348;
    address constant IDENTITY_REGISTRY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;

    // Test tokens (Aave Sepolia)
    address constant USDC = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8;
    address constant DAI = 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357;

    // Registered agent
    uint256 constant AGENT_ID = 642;

    function run() external view {
        console.log("==============================================");
        console.log("   OIK-13 E2E Validation");
        console.log("==============================================");
        console.log("");

        // Phase 1: Validate Contract Deployments
        console.log("Phase 1: Contract Deployment Validation");
        console.log("----------------------------------------");

        _validatePoolManager();
        _validateReceiptHook();
        _validateIntentRouter();

        console.log("");

        // Phase 2: Validate Agent Registration
        console.log("Phase 2: Agent Registration Validation");
        console.log("---------------------------------------");

        _validateAgentRegistration();

        console.log("");

        // Phase 3: Validate Pool Configuration
        console.log("Phase 3: Pool Configuration Validation");
        console.log("---------------------------------------");

        _validatePoolConfiguration();

        console.log("");

        // Summary
        console.log("==============================================");
        console.log("   All Validations Passed!");
        console.log("==============================================");
        console.log("");
        console.log("Next steps for full E2E test:");
        console.log("1. Fund test wallet with USDC and DAI");
        console.log("2. Approve IntentRouter for token spending");
        console.log("3. Execute intent via treasury-agent /rebalance endpoint");
        console.log("4. Verify ExecutionReceipt event in Ponder indexer");
    }

    function _validatePoolManager() internal view {
        console.log("[*] PoolManager:", POOL_MANAGER);

        // Check contract exists
        uint256 size;
        assembly { size := extcodesize(POOL_MANAGER) }
        require(size > 0, "PoolManager not deployed");
        console.log("    Status: Deployed");
    }

    function _validateReceiptHook() internal view {
        console.log("[*] ReceiptHook:", RECEIPT_HOOK);

        // Check contract exists
        uint256 size;
        assembly { size := extcodesize(RECEIPT_HOOK) }
        require(size > 0, "ReceiptHook not deployed");

        // Verify hook flags (bit 6 = AFTER_SWAP_FLAG)
        uint160 hookAddress = uint160(RECEIPT_HOOK);
        bool hasAfterSwap = (hookAddress & Hooks.AFTER_SWAP_FLAG) != 0;
        require(hasAfterSwap, "ReceiptHook missing AFTER_SWAP_FLAG");
        console.log("    Status: Deployed with AFTER_SWAP_FLAG");

        // Verify poolManager reference
        IReceiptHook hook = IReceiptHook(RECEIPT_HOOK);
        address pm = hook.poolManager();
        require(pm == POOL_MANAGER, "ReceiptHook has wrong PoolManager");
        console.log("    PoolManager: Verified");
    }

    function _validateIntentRouter() internal view {
        console.log("[*] IntentRouter:", INTENT_ROUTER);

        // Check contract exists
        uint256 size;
        assembly { size := extcodesize(INTENT_ROUTER) }
        require(size > 0, "IntentRouter not deployed");

        // Verify poolManager reference
        IIntentRouter router = IIntentRouter(INTENT_ROUTER);
        address pm = router.POOL_MANAGER();
        require(pm == POOL_MANAGER, "IntentRouter has wrong PoolManager");
        console.log("    Status: Deployed");
        console.log("    PoolManager: Verified");
    }

    function _validateAgentRegistration() internal view {
        console.log("[*] IdentityRegistry:", IDENTITY_REGISTRY);
        console.log("[*] Agent ID:", AGENT_ID);

        IERC8004 registry = IERC8004(IDENTITY_REGISTRY);

        // Verify agent exists
        address owner = registry.ownerOf(AGENT_ID);
        require(owner != address(0), "Agent not registered");
        console.log("    Owner:", owner);

        // Get agent wallet
        address wallet = registry.getAgentWallet(AGENT_ID);
        console.log("    Agent Wallet:", wallet);

        // Get URI
        string memory uri = registry.tokenURI(AGENT_ID);
        console.log("    Agent URI:", uri);

        console.log("    Status: Registered and Verified");
    }

    function _validatePoolConfiguration() internal view {
        console.log("[*] Test Pool Tokens:");
        console.log("    currency0 (USDC):", USDC);
        console.log("    currency1 (DAI):", DAI);
        console.log("    hooks:", RECEIPT_HOOK);
        console.log("    fee: 500 (0.05%)");
        console.log("    tickSpacing: 10");

        // Verify token contracts exist
        uint256 usdcSize;
        uint256 daiSize;
        assembly {
            usdcSize := extcodesize(USDC)
            daiSize := extcodesize(DAI)
        }
        require(usdcSize > 0, "USDC token not deployed");
        require(daiSize > 0, "DAI token not deployed");

        console.log("    Token Contracts: Verified");
    }
}

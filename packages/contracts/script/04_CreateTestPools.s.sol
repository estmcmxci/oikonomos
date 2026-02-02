// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";

/// @title CreateTestPools
/// @notice Creates test pools with ReceiptHook for E2E testing
contract CreateTestPools is Script {
    // Sepolia Uniswap v4 PoolManager
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    // Deployed ReceiptHook address
    address constant RECEIPT_HOOK = 0x41a75f07bA1958EcA78805D8419C87a393764040;

    // Test token addresses (Sepolia)
    // Using mock tokens - in production would use real USDC/DAI
    address public USDC;
    address public DAI;

    function run() external {
        // Load token addresses from environment or use defaults
        USDC = vm.envOr("USDC_ADDRESS", address(0));
        DAI = vm.envOr("DAI_ADDRESS", address(0));

        if (USDC == address(0) || DAI == address(0)) {
            console.log("USDC_ADDRESS and DAI_ADDRESS not set, deploying mock tokens...");
            _deployMockTokens();
        }

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        IPoolManager poolManager = IPoolManager(POOL_MANAGER);

        // Ensure currency0 < currency1 (required by Uniswap v4)
        address currency0 = USDC < DAI ? USDC : DAI;
        address currency1 = USDC < DAI ? DAI : USDC;

        console.log("Creating USDC/DAI pool with ReceiptHook...");
        console.log("  currency0:", currency0);
        console.log("  currency1:", currency1);
        console.log("  hooks:", RECEIPT_HOOK);

        // Create pool key
        PoolKey memory usdcDaiPool = PoolKey({
            currency0: Currency.wrap(currency0),
            currency1: Currency.wrap(currency1),
            fee: 500, // 0.05% fee tier
            tickSpacing: 10,
            hooks: IHooks(RECEIPT_HOOK)
        });

        // Initialize pool at 1:1 price
        // sqrtPriceX96 = sqrt(1) * 2^96 = 2^96 = 79228162514264337593543950336
        uint160 sqrtPriceX96 = 79228162514264337593543950336;

        try poolManager.initialize(usdcDaiPool, sqrtPriceX96) returns (int24 tick) {
            console.log("");
            console.log("Pool initialized successfully!");
            console.log("  Initial tick:", tick);
            console.log("");
            console.log("Pool Key (for SDK/Agent configuration):");
            console.log("  currency0:", currency0);
            console.log("  currency1:", currency1);
            console.log("  fee: 500");
            console.log("  tickSpacing: 10");
            console.log("  hooks:", RECEIPT_HOOK);
        } catch Error(string memory reason) {
            console.log("Pool initialization failed:", reason);
            console.log("Pool may already exist or hook validation failed");
        } catch {
            console.log("Pool initialization failed with unknown error");
        }

        vm.stopBroadcast();
    }

    function _deployMockTokens() internal {
        // For testing, we'll use CREATE2 to deploy deterministic mock token addresses
        // This is a placeholder - in production you'd use real token contracts

        console.log("");
        console.log("=== Mock Token Deployment ===");
        console.log("For E2E testing, you need to either:");
        console.log("1. Set USDC_ADDRESS and DAI_ADDRESS environment variables");
        console.log("2. Use existing Sepolia test tokens");
        console.log("");
        console.log("Common Sepolia test tokens:");
        console.log("  - Aave USDC: 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8");
        console.log("  - Aave DAI:  0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357");
        console.log("");

        // Set to Aave test tokens by default
        USDC = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8;
        DAI = 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357;
    }

    /// @notice Dry run to show pool configuration without deploying
    function dryRun() external view {
        console.log("=== Pool Configuration (Dry Run) ===");
        console.log("");
        console.log("PoolManager:", POOL_MANAGER);
        console.log("ReceiptHook:", RECEIPT_HOOK);
        console.log("");
        console.log("Proposed pool: USDC/DAI");
        console.log("  fee: 500 (0.05%)");
        console.log("  tickSpacing: 10");
        console.log("  sqrtPriceX96: 79228162514264337593543950336 (1:1 price)");
    }
}

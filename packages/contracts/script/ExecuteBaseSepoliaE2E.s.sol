// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IntentRouter} from "../src/policy/IntentRouter.sol";

/// @title ExecuteBaseSepoliaE2E
/// @notice Executes a REAL swap on Base Sepolia to test the full flow with ReceiptHook
/// @dev Uses the deployed IntentRouter and DAI/USDC pool with ReceiptHook
contract ExecuteBaseSepoliaE2E is Script {
    // Deployed contracts on Base Sepolia
    address constant POOL_MANAGER = 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408;
    address constant RECEIPT_HOOK = 0x906E3e24C04f6b6B5b6743BB77d0FCBE4d87C040;
    address constant INTENT_ROUTER = 0xe57a783A55Da1FBA9aBAF1eD7bCDf16792604858;

    // Pool tokens (Mock tokens on Base Sepolia)
    address constant MOCK_USDC = 0x524C057B1030B3D832f1688e4993159C7A124518; // 6 decimals
    address constant MOCK_DAI = 0x233Dc75Bda7dB90a33454e4333E3ac96eB7FB84E;  // 18 decimals

    // Pool configuration
    uint24 constant POOL_FEE = 500;       // 0.05%
    int24 constant TICK_SPACING = 10;

    // Swap amount: 10 DAI (we have ~499 DAI in pool, so 10 is safe)
    uint256 constant SWAP_AMOUNT = 10 * 1e18; // DAI has 18 decimals

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==============================================");
        console.log("   Base Sepolia E2E Swap Execution");
        console.log("==============================================");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("Swapping: 10 DAI -> USDC");
        console.log("");

        IntentRouter router = IntentRouter(INTENT_ROUTER);

        // Verify balances
        uint256 daiBalance = IERC20(MOCK_DAI).balanceOf(deployer);
        uint256 usdcBalanceBefore = IERC20(MOCK_USDC).balanceOf(deployer);
        console.log("DAI balance:", daiBalance / 1e18);
        console.log("USDC balance before:", usdcBalanceBefore / 1e6);
        require(daiBalance >= SWAP_AMOUNT, "Insufficient DAI balance");

        // Get current nonce from router
        uint256 nonce = router.nonces(deployer);
        console.log("Current nonce:", nonce);

        // Build pool key (currency0 must be < currency1)
        // MockDAI: 0x233Dc75Bda7dB90a33454e4333E3ac96eB7FB84E
        // MockUSDC: 0x524C057B1030B3D832f1688e4993159C7A124518
        // Since 0x233... < 0x524..., currency0 = DAI, currency1 = USDC
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(MOCK_DAI),
            currency1: Currency.wrap(MOCK_USDC),
            fee: POOL_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(RECEIPT_HOOK)
        });

        console.log("");
        console.log("Pool Key:");
        console.log("  currency0 (DAI):", MOCK_DAI);
        console.log("  currency1 (USDC):", MOCK_USDC);
        console.log("  fee:", POOL_FEE);
        console.log("  tickSpacing:", TICK_SPACING);
        console.log("  hooks (ReceiptHook):", RECEIPT_HOOK);
        console.log("");
        console.log("IntentRouter:", INTENT_ROUTER);

        vm.startBroadcast(deployerPrivateKey);

        // Build intent
        bytes32 strategyId = keccak256("treasury.oikonomos.eth");
        uint256 deadline = block.timestamp + 1 hours;

        IntentRouter.Intent memory intent = IntentRouter.Intent({
            user: deployer,
            tokenIn: MOCK_DAI,
            tokenOut: MOCK_USDC,
            amountIn: SWAP_AMOUNT,
            maxSlippage: 500, // 5% max slippage (generous for testnet)
            deadline: deadline,
            strategyId: strategyId,
            nonce: nonce
        });

        // Step 1: Approve IntentRouter to spend DAI
        console.log("");
        console.log("Step 1: Approving IntentRouter to spend DAI...");
        IERC20(MOCK_DAI).approve(address(router), SWAP_AMOUNT);
        console.log("  Approved 10 DAI");

        // Step 2: Sign the intent (EIP-712)
        console.log("");
        console.log("Step 2: Signing intent...");
        bytes32 intentHash = router.getIntentHash(intent);
        bytes32 domainSeparator = router.DOMAIN_SEPARATOR();
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, intentHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(deployerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        console.log("  Intent hash:", vm.toString(intentHash));
        console.log("  Signature length:", signature.length);

        // Step 3: Execute the intent
        console.log("");
        console.log("Step 3: Executing intent...");
        console.log("  Calling IntentRouter.executeIntent()...");

        bytes memory strategyData = abi.encode("base-sepolia-e2e-test");

        try router.executeIntent(intent, signature, poolKey, strategyData) returns (int256 amountOut) {
            console.log("");
            console.log("==============================================");
            console.log("   SWAP SUCCESSFUL!");
            console.log("==============================================");
            console.log("  Amount out (raw):", amountOut);
            console.log("  Amount out (USDC):", uint256(amountOut) / 1e6);

            // Check new balances
            uint256 daiAfter = IERC20(MOCK_DAI).balanceOf(deployer);
            uint256 usdcAfter = IERC20(MOCK_USDC).balanceOf(deployer);
            console.log("");
            console.log("Final balances:");
            console.log("  DAI after:", daiAfter / 1e18);
            console.log("  DAI spent:", (daiBalance - daiAfter) / 1e18);
            console.log("  USDC after:", usdcAfter / 1e6);
            console.log("  USDC received:", (usdcAfter - usdcBalanceBefore) / 1e6);
            console.log("");
            console.log("==============================================");
            console.log("   VERIFICATION STEPS");
            console.log("==============================================");
            console.log("");
            console.log("1. Check BaseScan for ExecutionReceipt event:");
            console.log("   https://sepolia.basescan.org/address/0x906E3e24C04f6b6B5b6743BB77d0FCBE4d87C040#events");
            console.log("");
            console.log("2. Query indexer API:");
            console.log("   curl https://indexer-production-323e.up.railway.app/graphql \\");
            console.log("     -H 'Content-Type: application/json' \\");
            console.log("     -d '{\"query\": \"{ executionReceipts(first: 5) { items { id strategyId transactionHash } } }\"}'");
        } catch Error(string memory reason) {
            console.log("");
            console.log("SWAP FAILED:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("");
            console.log("SWAP FAILED with low-level error");
            console.logBytes(lowLevelData);
        }

        vm.stopBroadcast();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IntentRouter} from "../src/policy/IntentRouter.sol";

/// @title ExecuteRealE2E
/// @notice Executes a REAL swap on Sepolia to test the full Mode A flow
/// @dev This spends real testnet tokens and gas
contract ExecuteRealE2E is Script {
    // Deployed contracts
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant RECEIPT_HOOK = 0x15d3b7CbC9463f92a88cE7B1B384277DA741C040;

    // Pool tokens (Aave Sepolia)
    address constant USDC = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8;
    address constant DAI = 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357;

    // Test wallet
    address constant TEST_WALLET = 0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21;

    // Swap amount: 1 USDC (small due to limited pool liquidity)
    uint256 constant SWAP_AMOUNT = 1 * 1e6; // USDC has 6 decimals

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==============================================");
        console.log("   REAL E2E Swap Execution");
        console.log("==============================================");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("Swapping: 1 USDC -> DAI");
        console.log("");

        // Verify balances
        uint256 usdcBalance = IERC20(USDC).balanceOf(deployer);
        uint256 daiBalanceBefore = IERC20(DAI).balanceOf(deployer);
        console.log("USDC balance:", usdcBalance / 1e6);
        console.log("DAI balance before:", daiBalanceBefore / 1e18);
        require(usdcBalance >= SWAP_AMOUNT, "Insufficient USDC balance");

        // Build pool key (currency0 must be < currency1)
        address currency0 = USDC < DAI ? USDC : DAI;
        address currency1 = USDC < DAI ? DAI : USDC;

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(currency0),
            currency1: Currency.wrap(currency1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(RECEIPT_HOOK)
        });

        console.log("");
        console.log("Pool Key:");
        console.log("  currency0:", currency0);
        console.log("  currency1:", currency1);
        console.log("  fee: 3000");
        console.log("  tickSpacing: 60");
        console.log("  hooks:", RECEIPT_HOOK);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy fresh IntentRouter with fixed settle/take logic
        console.log("");
        console.log("Step 0: Deploying fresh IntentRouter...");
        IntentRouter router = new IntentRouter(POOL_MANAGER);
        console.log("  IntentRouter deployed:", address(router));

        // Nonce starts at 0 for fresh router
        uint256 nonce = 0;

        // Build intent
        bytes32 strategyId = keccak256("treasury.oikonomos.eth");
        uint256 deadline = block.timestamp + 1 hours;

        IntentRouter.Intent memory intent = IntentRouter.Intent({
            user: deployer,
            tokenIn: USDC,
            tokenOut: DAI,
            amountIn: SWAP_AMOUNT,
            maxSlippage: 500, // 5% max slippage (generous for testnet)
            deadline: deadline,
            strategyId: strategyId,
            nonce: nonce
        });

        // Step 1: Approve IntentRouter to spend USDC
        console.log("");
        console.log("Step 1: Approving IntentRouter...");
        IERC20(USDC).approve(address(router), SWAP_AMOUNT);
        console.log("  Approved 1 USDC");

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

        bytes memory strategyData = abi.encode("test-quote-id");

        try router.executeIntent(intent, signature, poolKey, strategyData) returns (int256 amountOut) {
            console.log("");
            console.log("==============================================");
            console.log("   SWAP SUCCESSFUL!");
            console.log("==============================================");
            console.log("  Amount out:", amountOut);

            // Check new balances
            uint256 usdcAfter = IERC20(USDC).balanceOf(deployer);
            uint256 daiAfter = IERC20(DAI).balanceOf(deployer);
            console.log("");
            console.log("Final balances:");
            console.log("  USDC after:", usdcAfter / 1e6);
            console.log("  USDC spent:", (usdcBalance - usdcAfter) / 1e6);
            console.log("  DAI after:", daiAfter / 1e18);
            console.log("  DAI received:", (daiAfter - daiBalanceBefore) / 1e18);
            console.log("");
            console.log("Check Sepolia Etherscan for ExecutionReceipt event!");
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

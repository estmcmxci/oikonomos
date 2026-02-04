// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MockDAI} from "../src/mocks/MockDAI.sol";
import {IntentRouter} from "../src/policy/IntentRouter.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title DeployMockTokens
/// @notice Deploy mock tokens to Base Sepolia for x402 testing
contract DeployMockTokens is Script {
    function run() external {
        address deployer = msg.sender;

        console.log("=== Base Sepolia Mock Token Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast();

        // Deploy MockUSDC (6 decimals)
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed:", address(usdc));
        console.log("  - Decimals:", usdc.decimals());
        console.log("  - Balance:", usdc.balanceOf(deployer));

        // Deploy MockDAI (18 decimals)
        MockDAI dai = new MockDAI();
        console.log("MockDAI deployed:", address(dai));
        console.log("  - Decimals:", dai.decimals());
        console.log("  - Balance:", dai.balanceOf(deployer));

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("BASE_SEPOLIA_MOCK_USDC=", address(usdc));
        console.log("BASE_SEPOLIA_MOCK_DAI=", address(dai));
    }
}

/// @title DeployIntentRouter
/// @notice Deploy IntentRouter to Base Sepolia
contract DeployIntentRouter is Script {
    // Base Sepolia Uniswap v4 PoolManager
    address constant POOL_MANAGER = 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408;

    function run() external {
        address deployer = msg.sender;

        console.log("=== Base Sepolia IntentRouter Deployment ===");
        console.log("Deployer:", deployer);
        console.log("PoolManager:", POOL_MANAGER);

        vm.startBroadcast();

        IntentRouter router = new IntentRouter(POOL_MANAGER);
        console.log("IntentRouter deployed:", address(router));

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("BASE_SEPOLIA_INTENT_ROUTER=", address(router));
    }
}

/// @title CreateBaseSepoliaPools
/// @notice Create USDC/DAI and WETH/USDC pools with ReceiptHook on Base Sepolia
contract CreateBaseSepoliaPools is Script {
    // Base Sepolia addresses
    address constant POOL_MANAGER = 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408;
    address constant RECEIPT_HOOK = 0x906E3e24C04f6b6B5b6743BB77d0FCBE4d87C040;
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant MOCK_USDC = 0x524C057B1030B3D832f1688e4993159C7A124518;
    address constant MOCK_DAI = 0x233Dc75Bda7dB90a33454e4333E3ac96eB7FB84E;

    function run() external {
        console.log("=== Base Sepolia Pool Creation ===");
        console.log("PoolManager:", POOL_MANAGER);
        console.log("ReceiptHook:", RECEIPT_HOOK);

        vm.startBroadcast();

        IPoolManager poolManager = IPoolManager(POOL_MANAGER);

        // Create USDC/DAI pool (stablecoin pair)
        _createPool(poolManager, MOCK_USDC, MOCK_DAI, 500, 10, "USDC/DAI");

        // Create WETH/USDC pool (volatile pair)
        _createPool(poolManager, WETH, MOCK_USDC, 3000, 60, "WETH/USDC");

        vm.stopBroadcast();

        console.log("");
        console.log("=== POOL CREATION COMPLETE ===");
    }

    function _createPool(
        IPoolManager poolManager,
        address tokenA,
        address tokenB,
        uint24 fee,
        int24 tickSpacing,
        string memory name
    ) internal {
        // Ensure currency0 < currency1 (required by Uniswap v4)
        address currency0 = tokenA < tokenB ? tokenA : tokenB;
        address currency1 = tokenA < tokenB ? tokenB : tokenA;

        console.log("");
        console.log("Creating", name, "pool...");
        console.log("  currency0:", currency0);
        console.log("  currency1:", currency1);
        console.log("  fee:", fee);
        console.log("  tickSpacing:", tickSpacing);
        console.log("  hooks:", RECEIPT_HOOK);

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(currency0),
            currency1: Currency.wrap(currency1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(RECEIPT_HOOK)
        });

        // Initialize at 1:1 price for stablecoins, ~2000 USDC/ETH for WETH
        // sqrtPriceX96 = sqrt(price) * 2^96
        // For 1:1: sqrt(1) * 2^96 = 79228162514264337593543950336
        uint160 sqrtPriceX96 = 79228162514264337593543950336;

        try poolManager.initialize(poolKey, sqrtPriceX96) returns (int24 tick) {
            console.log("  Pool initialized! Tick:", tick);
        } catch Error(string memory reason) {
            console.log("  Pool init failed:", reason);
        } catch {
            console.log("  Pool init failed (unknown error)");
        }
    }
}

/// @title BaseSepoliaLiquidityHelper
/// @notice Helper contract to add liquidity via PoolManager unlock callback
contract BaseSepoliaLiquidityHelper is IUnlockCallback {
    IPoolManager public immutable poolManager;

    struct CallbackData {
        address sender;
        PoolKey poolKey;
        int24 tickLower;
        int24 tickUpper;
        int256 liquidityDelta;
    }

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
    }

    function addLiquidity(
        PoolKey calldata poolKey,
        int24 tickLower,
        int24 tickUpper,
        int256 liquidityDelta
    ) external returns (BalanceDelta delta) {
        bytes memory result = poolManager.unlock(
            abi.encode(CallbackData({
                sender: msg.sender,
                poolKey: poolKey,
                tickLower: tickLower,
                tickUpper: tickUpper,
                liquidityDelta: liquidityDelta
            }))
        );
        return abi.decode(result, (BalanceDelta));
    }

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        require(msg.sender == address(poolManager), "Not PoolManager");

        CallbackData memory cbData = abi.decode(data, (CallbackData));

        (BalanceDelta delta,) = poolManager.modifyLiquidity(
            cbData.poolKey,
            IPoolManager.ModifyLiquidityParams({
                tickLower: cbData.tickLower,
                tickUpper: cbData.tickUpper,
                liquidityDelta: cbData.liquidityDelta,
                salt: bytes32(0)
            }),
            ""
        );

        int128 amount0 = delta.amount0();
        int128 amount1 = delta.amount1();

        // Pay tokens if we owe them (negative delta = we owe pool)
        if (amount0 < 0) {
            poolManager.sync(cbData.poolKey.currency0);
            IERC20(Currency.unwrap(cbData.poolKey.currency0)).transferFrom(
                cbData.sender,
                address(poolManager),
                uint128(-amount0)
            );
            poolManager.settle();
        }

        if (amount1 < 0) {
            poolManager.sync(cbData.poolKey.currency1);
            IERC20(Currency.unwrap(cbData.poolKey.currency1)).transferFrom(
                cbData.sender,
                address(poolManager),
                uint128(-amount1)
            );
            poolManager.settle();
        }

        // Take any tokens pool owes us (positive delta)
        if (amount0 > 0) {
            poolManager.take(cbData.poolKey.currency0, cbData.sender, uint128(amount0));
        }
        if (amount1 > 0) {
            poolManager.take(cbData.poolKey.currency1, cbData.sender, uint128(amount1));
        }

        return abi.encode(delta);
    }
}

/// @title AddBaseSepoliaLiquidity
/// @notice Add liquidity to Base Sepolia pools
contract AddBaseSepoliaLiquidity is Script {
    address constant POOL_MANAGER = 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408;
    address constant RECEIPT_HOOK = 0x906E3e24C04f6b6B5b6743BB77d0FCBE4d87C040;
    address constant MOCK_USDC = 0x524C057B1030B3D832f1688e4993159C7A124518;
    address constant MOCK_DAI = 0x233Dc75Bda7dB90a33454e4333E3ac96eB7FB84E;

    function run() external {
        console.log("=== Add Liquidity to Base Sepolia Pools ===");

        vm.startBroadcast();

        IPoolManager pm = IPoolManager(POOL_MANAGER);

        // Deploy helper
        BaseSepoliaLiquidityHelper helper = new BaseSepoliaLiquidityHelper(pm);
        console.log("Helper deployed:", address(helper));

        // Approve tokens
        IERC20(MOCK_USDC).approve(address(helper), type(uint256).max);
        IERC20(MOCK_DAI).approve(address(helper), type(uint256).max);

        // Build USDC/DAI pool key (currency0 < currency1)
        address currency0 = MOCK_DAI < MOCK_USDC ? MOCK_DAI : MOCK_USDC;
        address currency1 = MOCK_DAI < MOCK_USDC ? MOCK_USDC : MOCK_DAI;

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(currency0),
            currency1: Currency.wrap(currency1),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(RECEIPT_HOOK)
        });

        console.log("Adding liquidity to USDC/DAI pool...");
        console.log("  currency0:", currency0);
        console.log("  currency1:", currency1);

        // Add liquidity around tick 0 (1:1 price)
        // tickLower and tickUpper must be multiples of tickSpacing (10)
        // Use smaller range and liquidity to fit within token balances
        int24 tickLower = -100;
        int24 tickUpper = 100;
        int256 liquidityDelta = 100000000000; // 1e11 - smaller to fit token balances

        try helper.addLiquidity(poolKey, tickLower, tickUpper, liquidityDelta) returns (BalanceDelta delta) {
            console.log("SUCCESS!");
            console.log("  amount0:", delta.amount0());
            console.log("  amount1:", delta.amount1());
        } catch Error(string memory reason) {
            console.log("Failed:", reason);
        } catch (bytes memory err) {
            console.log("Failed with bytes:");
            console.logBytes(err);
        }

        vm.stopBroadcast();

        console.log("");
        console.log("=== LIQUIDITY ADDED ===");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";

/// @title LiquidityHelper
/// @notice Helper contract to add liquidity via PoolManager unlock callback
contract LiquidityHelper is IUnlockCallback {
    using StateLibrary for IPoolManager;

    IPoolManager public immutable poolManager;

    enum Action { INITIALIZE, ADD_LIQUIDITY }

    struct CallbackData {
        Action action;
        address sender;
        PoolKey poolKey;
        int24 tickLower;
        int24 tickUpper;
        int256 liquidityDelta;
        uint160 sqrtPriceX96;
    }

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
    }

    function initializePool(PoolKey calldata poolKey, uint160 sqrtPriceX96) external returns (int24) {
        bytes memory result = poolManager.unlock(
            abi.encode(CallbackData({
                action: Action.INITIALIZE,
                sender: msg.sender,
                poolKey: poolKey,
                tickLower: 0,
                tickUpper: 0,
                liquidityDelta: 0,
                sqrtPriceX96: sqrtPriceX96
            }))
        );
        return abi.decode(result, (int24));
    }

    function addLiquidity(
        PoolKey calldata poolKey,
        int24 tickLower,
        int24 tickUpper,
        int256 liquidityDelta
    ) external returns (BalanceDelta delta) {
        bytes memory result = poolManager.unlock(
            abi.encode(CallbackData({
                action: Action.ADD_LIQUIDITY,
                sender: msg.sender,
                poolKey: poolKey,
                tickLower: tickLower,
                tickUpper: tickUpper,
                liquidityDelta: liquidityDelta,
                sqrtPriceX96: 0
            }))
        );
        return abi.decode(result, (BalanceDelta));
    }

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        require(msg.sender == address(poolManager), "Not PoolManager");

        CallbackData memory cbData = abi.decode(data, (CallbackData));

        if (cbData.action == Action.INITIALIZE) {
            int24 tick = poolManager.initialize(cbData.poolKey, cbData.sqrtPriceX96);
            return abi.encode(tick);
        }

        // ADD_LIQUIDITY
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

        // In Uniswap V4, NEGATIVE delta means we OWE tokens (must settle/pay)
        // POSITIVE delta means pool OWES us (can take)

        // Pay currency0 if we owe it (negative = we owe pool)
        if (amount0 < 0) {
            poolManager.sync(cbData.poolKey.currency0);
            IERC20(Currency.unwrap(cbData.poolKey.currency0)).transferFrom(
                cbData.sender,
                address(poolManager),
                uint128(-amount0)  // Convert to positive
            );
            poolManager.settle();
        }

        // Pay currency1 if we owe it
        if (amount1 < 0) {
            poolManager.sync(cbData.poolKey.currency1);
            IERC20(Currency.unwrap(cbData.poolKey.currency1)).transferFrom(
                cbData.sender,
                address(poolManager),
                uint128(-amount1)  // Convert to positive
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

/// @title AddLiquidity
/// @notice Initializes pool if needed and adds liquidity
contract AddLiquidity is Script {
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;

    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant RECEIPT_HOOK = 0x15d3b7CbC9463f92a88cE7B1B384277DA741C040;
    address constant USDC = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8;
    address constant DAI = 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357;

    // Use unique fee tier to guarantee a new pool
    uint24 constant POOL_FEE = 3000; // 0.3% fee tier
    int24 constant TICK_SPACING = 60; // For 0.3%

    // Enable hook for real E2E testing with ReceiptHook
    bool constant USE_HOOK = true;

    // Price calculation for USDC (6 decimals) / DAI (18 decimals) at 1:1 USD
    // Since USDC < DAI, currency0=USDC, currency1=DAI
    // price = DAI_raw / USDC_raw = 1e18 / 1e6 = 1e12
    // sqrtPrice = sqrt(1e12) = 1e6
    // sqrtPriceX96 = 1e6 * 2^96 = 1e6 * 79228162514264337593543950336
    uint160 constant CORRECT_SQRT_PRICE_X96 = 79228162514264337593543950336000000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==============================================");
        console.log("   Initialize Pool & Add Liquidity");
        console.log("==============================================");
        console.log("Deployer:", deployer);

        uint256 usdcBalance = IERC20(USDC).balanceOf(deployer);
        uint256 daiBalance = IERC20(DAI).balanceOf(deployer);
        console.log("USDC balance:", usdcBalance / 1e6);
        console.log("DAI balance:", daiBalance / 1e18);

        // Build pool key
        address currency0 = USDC < DAI ? USDC : DAI;
        address currency1 = USDC < DAI ? DAI : USDC;

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(currency0),
            currency1: Currency.wrap(currency1),
            fee: POOL_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(USE_HOOK ? RECEIPT_HOOK : address(0))
        });

        IPoolManager pm = IPoolManager(POOL_MANAGER);
        PoolId poolId = poolKey.toId();

        console.log("");
        console.log("Pool ID:", vm.toString(PoolId.unwrap(poolId)));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy helper
        LiquidityHelper helper = new LiquidityHelper(pm);
        console.log("Helper deployed:", address(helper));

        // Approve tokens for helper
        IERC20(USDC).approve(address(helper), type(uint256).max);
        IERC20(DAI).approve(address(helper), type(uint256).max);

        // Check if pool is initialized by checking sqrtPriceX96
        (uint160 sqrtPriceX96,,,) = pm.getSlot0(poolId);
        console.log("Current sqrtPriceX96:", sqrtPriceX96);

        if (sqrtPriceX96 == 0) {
            console.log("");
            console.log("Pool not initialized! Initializing with correct price...");
            console.log("(USDC 6 dec / DAI 18 dec => price=1e12, sqrt=1e6)");
            try helper.initializePool(poolKey, CORRECT_SQRT_PRICE_X96) returns (int24 tick) {
                console.log("Pool initialized at tick:", tick);
            } catch Error(string memory reason) {
                console.log("Init failed:", reason);
            }
        } else {
            console.log("Pool already initialized");
        }

        // Now add liquidity
        console.log("");
        console.log("Adding liquidity...");

        // Use range around current tick (~276,300 for USDC/DAI 1:1 USD)
        // Tick must be multiples of tickSpacing (60)
        int24 tickLower = 276000;
        int24 tickUpper = 276600;
        int256 liquidityDelta = 1000000000000000; // 1e15 - larger for meaningful swaps

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
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IntentRouter} from "../src/policy/IntentRouter.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract IntentRouterTest is Test {
    IntentRouter public router;
    MockERC20 public tokenIn;
    MockERC20 public tokenOut;

    address public alice;
    uint256 public aliceKey;
    address public bob;

    // Use a mock address for PoolManager since we're not actually swapping
    address constant MOCK_POOL_MANAGER = address(0x1234);

    function setUp() public {
        router = new IntentRouter(MOCK_POOL_MANAGER);

        tokenIn = new MockERC20("Token In", "TIN", 18);
        tokenOut = new MockERC20("Token Out", "TOUT", 18);

        (alice, aliceKey) = makeAddrAndKey("alice");
        bob = makeAddr("bob");

        // Give alice some tokens
        tokenIn.mint(alice, 1000 ether);

        // Approve router
        vm.prank(alice);
        tokenIn.approve(address(router), type(uint256).max);
    }

    function _createIntent(
        address user,
        uint256 amountIn,
        uint256 maxSlippage,
        uint256 deadline,
        bytes32 strategyId
    ) internal view returns (IntentRouter.Intent memory) {
        return IntentRouter.Intent({
            user: user,
            tokenIn: address(tokenIn),
            tokenOut: address(tokenOut),
            amountIn: amountIn,
            maxSlippage: maxSlippage,
            deadline: deadline,
            strategyId: strategyId,
            nonce: router.getNonce(user)
        });
    }

    function _signIntent(IntentRouter.Intent memory intent, uint256 privateKey)
        internal
        view
        returns (bytes memory)
    {
        bytes32 intentHash = router.getIntentHash(intent);
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            router.DOMAIN_SEPARATOR(),
            intentHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _createPoolKey() internal view returns (PoolKey memory) {
        return PoolKey({
            currency0: Currency.wrap(address(tokenIn)),
            currency1: Currency.wrap(address(tokenOut)),
            fee: 100,
            tickSpacing: 1,
            hooks: IHooks(address(0))
        });
    }

    function test_ExecuteIntent_ValidSignature() public {
        // Skip: This test requires a full PoolManager mock with unlock callback
        // Integration tests cover this functionality against the real PoolManager
        // See: packages/contracts/script/06_ValidateE2E.s.sol for on-chain validation
        vm.skip(true);
    }

    function test_ExecuteIntent_RevertIfExpired() public {
        IntentRouter.Intent memory intent = _createIntent(
            alice,
            100 ether,
            50,
            block.timestamp - 1, // Already expired
            keccak256("test")
        );

        bytes memory signature = _signIntent(intent, aliceKey);
        PoolKey memory poolKey = _createPoolKey();

        vm.expectRevert(IntentRouter.IntentExpired.selector);
        router.executeIntent(intent, signature, poolKey, "");
    }

    function test_ExecuteIntent_RevertIfInvalidSignature() public {
        IntentRouter.Intent memory intent = _createIntent(
            alice,
            100 ether,
            50,
            block.timestamp + 1 hours,
            keccak256("test")
        );

        // Sign with wrong key (bob instead of alice)
        uint256 bobKey = uint256(keccak256("bob"));
        bytes memory wrongSignature = _signIntent(intent, bobKey);
        PoolKey memory poolKey = _createPoolKey();

        vm.expectRevert(IntentRouter.InvalidSignature.selector);
        router.executeIntent(intent, wrongSignature, poolKey, "");
    }

    function test_ExecuteIntent_RevertIfInvalidNonce() public {
        IntentRouter.Intent memory intent = _createIntent(
            alice,
            100 ether,
            50,
            block.timestamp + 1 hours,
            keccak256("test")
        );

        // Manually set wrong nonce
        intent.nonce = 999;

        bytes memory signature = _signIntent(intent, aliceKey);
        PoolKey memory poolKey = _createPoolKey();

        vm.expectRevert(IntentRouter.InvalidNonce.selector);
        router.executeIntent(intent, signature, poolKey, "");
    }

    function test_ExecuteIntent_RevertOnReplay() public {
        // Skip: This test requires a full PoolManager mock with unlock callback
        // Integration tests cover replay protection against the real PoolManager
        vm.skip(true);
    }

    function test_NonceIncrementsAfterExecution() public {
        // Skip: This test requires a full PoolManager mock with unlock callback
        // Integration tests cover nonce increment against the real PoolManager
        vm.skip(true);
    }

    function test_GetIntentHash_Deterministic() public view {
        IntentRouter.Intent memory intent = _createIntent(
            alice,
            100 ether,
            50,
            block.timestamp + 1 hours,
            keccak256("test")
        );

        bytes32 hash1 = router.getIntentHash(intent);
        bytes32 hash2 = router.getIntentHash(intent);

        assertEq(hash1, hash2, "Intent hash should be deterministic");
    }

    function test_DomainSeparator_IsSet() public view {
        bytes32 domainSeparator = router.DOMAIN_SEPARATOR();
        assertTrue(domainSeparator != bytes32(0), "Domain separator should be set");
    }

    // ============ Pause Tests ============

    function test_Pause_BlocksExecution() public {
        // Owner pauses
        router.pause();

        IntentRouter.Intent memory intent = _createIntent(
            alice,
            100 ether,
            50,
            block.timestamp + 1 hours,
            keccak256("test")
        );

        bytes memory signature = _signIntent(intent, aliceKey);
        PoolKey memory poolKey = _createPoolKey();

        // Execution should revert when paused
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        router.executeIntent(intent, signature, poolKey, "");
    }

    function test_Unpause_AllowsExecution() public {
        // Skip: This test requires a full PoolManager mock with unlock callback
        // Integration tests cover unpause functionality against the real PoolManager
        vm.skip(true);
    }

    function test_OnlyOwnerCanPause() public {
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", bob));
        router.pause();
    }

    function test_OnlyOwnerCanUnpause() public {
        router.pause();

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", bob));
        router.unpause();
    }

    // ============ Rescue Tests ============

    function test_RescueTokens() public {
        // Accidentally send tokens to router
        tokenIn.mint(address(router), 50 ether);
        assertEq(tokenIn.balanceOf(address(router)), 50 ether);

        // Owner rescues tokens
        router.rescueTokens(address(tokenIn), alice, 50 ether);

        assertEq(tokenIn.balanceOf(address(router)), 0, "Router should have no tokens");
        assertEq(tokenIn.balanceOf(alice), 1050 ether, "Alice should receive rescued tokens");
    }

    function test_RescueTokens_RevertIfNotOwner() public {
        tokenIn.mint(address(router), 50 ether);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", bob));
        router.rescueTokens(address(tokenIn), bob, 50 ether);
    }

    function test_RescueTokens_RevertIfZeroAddress() public {
        vm.expectRevert(IntentRouter.InvalidToken.selector);
        router.rescueTokens(address(0), alice, 50 ether);
    }
}

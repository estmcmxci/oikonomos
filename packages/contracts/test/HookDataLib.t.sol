// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {HookDataLib} from "../src/libraries/HookDataLib.sol";

contract HookDataLibTest is Test {
    address constant TEST_USER = address(0x1234567890123456789012345678901234567890);

    function test_EncodeDecodeRoundTrip() public pure {
        bytes32 strategyId = keccak256("treasury.oikonomos.eth");
        bytes32 quoteId = keccak256("quote-123");
        uint256 expectedAmount = 1000e6; // 1000 USDC
        uint256 maxSlippage = 25; // 25 bps

        bytes memory encoded = HookDataLib.encode(strategyId, quoteId, expectedAmount, maxSlippage, TEST_USER);

        (bytes32 decodedStrategy, bytes32 decodedQuote, uint256 decodedExpected, uint256 decodedSlippage, address decodedUser) =
            HookDataLib.decode(encoded);

        assertEq(decodedStrategy, strategyId, "Strategy ID mismatch");
        assertEq(decodedQuote, quoteId, "Quote ID mismatch");
        assertEq(decodedExpected, expectedAmount, "Expected amount mismatch");
        assertEq(decodedSlippage, maxSlippage, "Max slippage mismatch");
        assertEq(decodedUser, TEST_USER, "User address mismatch");
    }

    function test_StrategyIdFromEns() public pure {
        string memory ensName = "treasury.oikonomos.eth";
        bytes32 strategyId = HookDataLib.strategyIdFromEns(ensName);

        assertEq(strategyId, keccak256(abi.encodePacked(ensName)), "Strategy ID from ENS mismatch");
    }

    function test_EncodeDecodeWithZeroSlippage() public pure {
        bytes32 strategyId = bytes32(uint256(1));
        bytes32 quoteId = bytes32(uint256(2));
        uint256 expectedAmount = 500e18;
        uint256 maxSlippage = 0;

        bytes memory encoded = HookDataLib.encode(strategyId, quoteId, expectedAmount, maxSlippage, TEST_USER);

        (bytes32 decodedStrategy, bytes32 decodedQuote, uint256 decodedExpected, uint256 decodedSlippage, address decodedUser) =
            HookDataLib.decode(encoded);

        assertEq(decodedStrategy, strategyId);
        assertEq(decodedQuote, quoteId);
        assertEq(decodedExpected, expectedAmount);
        assertEq(decodedSlippage, maxSlippage);
        assertEq(decodedUser, TEST_USER);
    }

    function test_EncodeDecodeWithMaxSlippage() public pure {
        bytes32 strategyId = bytes32(uint256(1));
        bytes32 quoteId = bytes32(uint256(2));
        uint256 expectedAmount = 100e6;
        uint256 maxSlippage = 10000; // 100%

        bytes memory encoded = HookDataLib.encode(strategyId, quoteId, expectedAmount, maxSlippage, TEST_USER);

        (bytes32 decodedStrategy, bytes32 decodedQuote, uint256 decodedExpected, uint256 decodedSlippage, address decodedUser) =
            HookDataLib.decode(encoded);

        assertEq(decodedExpected, expectedAmount);
        assertEq(decodedSlippage, maxSlippage);
        assertEq(decodedUser, TEST_USER);
    }

    function test_RevertWhenSlippageExceedsBounds() public {
        bytes32 strategyId = bytes32(uint256(1));
        bytes32 quoteId = bytes32(uint256(2));
        uint256 expectedAmount = 100e6;
        uint256 maxSlippage = 10001; // > 100%, should revert

        // Use try-catch since vm.expectRevert doesn't work with pure library calls
        bool didRevert = false;
        try this.encodeWrapper(strategyId, quoteId, expectedAmount, maxSlippage, TEST_USER) {
            // If we get here, it didn't revert
        } catch {
            didRevert = true;
        }
        assertTrue(didRevert, "Expected revert for invalid slippage bounds");
    }

    function test_RevertWhenUserAddressIsZero() public {
        bytes32 strategyId = bytes32(uint256(1));
        bytes32 quoteId = bytes32(uint256(2));
        uint256 expectedAmount = 100e6;
        uint256 maxSlippage = 100;

        // Use try-catch since vm.expectRevert doesn't work with pure library calls
        bool didRevert = false;
        try this.encodeWrapper(strategyId, quoteId, expectedAmount, maxSlippage, address(0)) {
            // If we get here, it didn't revert
        } catch {
            didRevert = true;
        }
        assertTrue(didRevert, "Expected revert for zero user address");
    }

    // Wrapper function to allow try-catch
    function encodeWrapper(
        bytes32 strategyId,
        bytes32 quoteId,
        uint256 expectedAmount,
        uint256 maxSlippage,
        address userAddress
    ) external pure returns (bytes memory) {
        return HookDataLib.encode(strategyId, quoteId, expectedAmount, maxSlippage, userAddress);
    }

    function testFuzz_EncodeDecodeRoundTrip(
        bytes32 strategyId,
        bytes32 quoteId,
        uint256 expectedAmount,
        uint256 maxSlippage,
        address userAddress
    ) public pure {
        // Bound maxSlippage to valid range
        maxSlippage = bound(maxSlippage, 0, 10000);
        // Ensure user address is not zero
        vm.assume(userAddress != address(0));

        bytes memory encoded = HookDataLib.encode(strategyId, quoteId, expectedAmount, maxSlippage, userAddress);

        (bytes32 decodedStrategy, bytes32 decodedQuote, uint256 decodedExpected, uint256 decodedSlippage, address decodedUser) =
            HookDataLib.decode(encoded);

        assertEq(decodedStrategy, strategyId);
        assertEq(decodedQuote, quoteId);
        assertEq(decodedExpected, expectedAmount);
        assertEq(decodedSlippage, maxSlippage);
        assertEq(decodedUser, userAddress);
    }
}

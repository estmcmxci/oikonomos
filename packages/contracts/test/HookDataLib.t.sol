// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {HookDataLib} from "../src/libraries/HookDataLib.sol";

contract HookDataLibTest is Test {
    function test_EncodeDecodeRoundTrip() public pure {
        bytes32 strategyId = keccak256("treasury.oikonomos.eth");
        bytes32 quoteId = keccak256("quote-123");
        uint256 maxSlippage = 25; // 25 bps

        bytes memory encoded = HookDataLib.encode(strategyId, quoteId, maxSlippage);

        (bytes32 decodedStrategy, bytes32 decodedQuote, uint256 decodedSlippage) =
            HookDataLib.decode(encoded);

        assertEq(decodedStrategy, strategyId, "Strategy ID mismatch");
        assertEq(decodedQuote, quoteId, "Quote ID mismatch");
        assertEq(decodedSlippage, maxSlippage, "Max slippage mismatch");
    }

    function test_StrategyIdFromEns() public pure {
        string memory ensName = "treasury.oikonomos.eth";
        bytes32 strategyId = HookDataLib.strategyIdFromEns(ensName);

        assertEq(strategyId, keccak256(abi.encodePacked(ensName)), "Strategy ID from ENS mismatch");
    }

    function test_EncodeDecodeWithZeroSlippage() public pure {
        bytes32 strategyId = bytes32(uint256(1));
        bytes32 quoteId = bytes32(uint256(2));
        uint256 maxSlippage = 0;

        bytes memory encoded = HookDataLib.encode(strategyId, quoteId, maxSlippage);

        (bytes32 decodedStrategy, bytes32 decodedQuote, uint256 decodedSlippage) =
            HookDataLib.decode(encoded);

        assertEq(decodedStrategy, strategyId);
        assertEq(decodedQuote, quoteId);
        assertEq(decodedSlippage, maxSlippage);
    }

    function test_EncodeDecodeWithMaxSlippage() public pure {
        bytes32 strategyId = bytes32(uint256(1));
        bytes32 quoteId = bytes32(uint256(2));
        uint256 maxSlippage = 10000; // 100%

        bytes memory encoded = HookDataLib.encode(strategyId, quoteId, maxSlippage);

        (bytes32 decodedStrategy, bytes32 decodedQuote, uint256 decodedSlippage) =
            HookDataLib.decode(encoded);

        assertEq(decodedSlippage, maxSlippage);
    }

    function testFuzz_EncodeDecodeRoundTrip(
        bytes32 strategyId,
        bytes32 quoteId,
        uint256 maxSlippage
    ) public pure {
        bytes memory encoded = HookDataLib.encode(strategyId, quoteId, maxSlippage);

        (bytes32 decodedStrategy, bytes32 decodedQuote, uint256 decodedSlippage) =
            HookDataLib.decode(encoded);

        assertEq(decodedStrategy, strategyId);
        assertEq(decodedQuote, quoteId);
        assertEq(decodedSlippage, maxSlippage);
    }
}

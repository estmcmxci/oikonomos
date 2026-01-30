// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IReceiptHook {
    event ExecutionReceipt(
        bytes32 indexed strategyId,
        bytes32 indexed quoteId,
        address indexed sender,
        int128 amount0,
        int128 amount1,
        uint256 actualSlippage,
        bool policyCompliant,
        uint256 timestamp
    );
}

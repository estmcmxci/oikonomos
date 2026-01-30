// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IIntentRouter {
    struct Intent {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 maxSlippage;
        uint256 deadline;
        bytes32 strategyId;
    }

    function executeIntent(
        Intent calldata intent,
        bytes calldata signature,
        bytes calldata strategyData
    ) external;
}

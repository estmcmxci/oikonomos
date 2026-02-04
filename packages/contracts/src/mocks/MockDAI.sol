// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockDAI
/// @notice Mock DAI token for testing on Base Sepolia
/// @dev 18 decimals to match real DAI
contract MockDAI is ERC20 {
    constructor() ERC20("Mock DAI", "DAI") {
        _mint(msg.sender, 100_000 * 10 ** 18);
    }

    /// @notice Mint tokens to any address (for testing)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

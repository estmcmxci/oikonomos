// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title MockDAI
/// @notice Mock DAI token for testing on Base Sepolia with EIP-2612 permit support
/// @dev 18 decimals to match real DAI. Includes permit for gasless approvals (x402)
contract MockDAI is ERC20, ERC20Permit {
    constructor() ERC20("Mock DAI", "DAI") ERC20Permit("Mock DAI") {
        _mint(msg.sender, 100_000 * 10 ** 18);
    }

    /// @notice Mint tokens to any address (for testing)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

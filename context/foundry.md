# Foundry

## Overview

Foundry is a blazing fast, portable, and modular toolkit for Ethereum application development written in Rust. It includes:

- **Forge**: Build, test, and deploy smart contracts
- **Cast**: Interact with EVM smart contracts and send transactions
- **Anvil**: Local Ethereum development node
- **Chisel**: Solidity REPL

## Installation

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Forge Commands

### Build Contracts

```bash
forge build
```

### Run Tests

```bash
forge test
```

### Deploy Contract

```bash
forge create --rpc-url <rpc_url> --private-key <private_key> src/MyContract.sol:MyContract
```

### Verify Contract

```bash
forge verify-contract --compiler-version <version> <contract_address> src/MyContract.sol:MyContract
```

## Writing Tests

Tests are written in Solidity using the `forge-std` library:

```solidity
import "forge-std/Test.sol";

contract MyTest is Test {
    function testAddition() public {
        uint256 a = 1;
        uint256 b = 2;
        assertEq(a + b, 3);
    }
}
```

### Full Test Example

```solidity
import "forge-std/Test.sol";
import "../src/MyContract.sol";

contract MyContractTest is Test {
    MyContract public myContract;

    function setUp() public {
        // Deploy the contract before each test
        myContract = new MyContract();
    }

    function testInitialValue() public {
        // Test the initial state of the contract
        assertEq(myContract.getValue(), 0);
    }

    function testSetValue() public {
        // Test setting a value using a cheatcode
        uint256 newValue = 123;
        vm.prank(address(1)); // Set the caller to address(1)
        myContract.setValue(newValue);
        assertEq(myContract.getValue(), newValue);
    }

    function testRevertOnInvalidInput() public {
        // Test that the contract reverts on invalid input
        vm.expectRevert("Invalid input");
        myContract.setValue(0); // Assuming 0 is invalid input
    }
}
```

## Cheatcodes

Forge provides powerful cheatcodes via the `vm` object:

```solidity
// Change msg.sender for the next call
vm.prank(address(1));

// Change msg.sender for all subsequent calls
vm.startPrank(address(1));
vm.stopPrank();

// Expect a revert
vm.expectRevert("Error message");

// Warp block timestamp
vm.warp(block.timestamp + 1 days);

// Roll block number
vm.roll(block.number + 100);

// Deal ETH to an address
vm.deal(address(1), 1 ether);

// Mock a call
vm.mockCall(
    address(token),
    abi.encodeWithSelector(IERC20.balanceOf.selector, address(this)),
    abi.encode(1000)
);
```

## Assertions

```solidity
assertEq(a, b);           // Assert equality
assertEq(a, b, "message"); // With message
assertTrue(condition);
assertFalse(condition);
assertGt(a, b);           // Greater than
assertLt(a, b);           // Less than
assertGe(a, b);           // Greater or equal
assertLe(a, b);           // Less or equal
```

## Project Structure

```
.
├── foundry.toml      # Configuration
├── src/              # Contract source files
├── test/             # Test files
├── script/           # Deployment scripts
└── lib/              # Dependencies
```

## Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Foundry GitHub](https://github.com/foundry-rs/foundry)
- [forge-std](https://github.com/foundry-rs/forge-std)

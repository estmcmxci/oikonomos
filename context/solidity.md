# Solidity

## Overview

Solidity is an object-oriented, high-level programming language designed for implementing smart contracts on the Ethereum Virtual Machine (EVM). It is a curly-bracket language influenced by C++, Python, and JavaScript.

The Solidity compiler (solc) translates Solidity source code into EVM bytecode, providing a complete compilation pipeline that includes parsing, semantic analysis, optimization, and code generation.

## Basic Contract Example

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract SimpleStorage {
    uint storedData;

    function set(uint x) public {
        storedData = x;
    }

    function get() public view returns (uint) {
        return storedData;
    }
}
```

## Key Concepts

### State Variables
Variables that are permanently stored in contract storage.

### Functions
- `public`: Can be called internally and externally
- `external`: Can only be called from outside the contract
- `internal`: Can only be called internally or by derived contracts
- `private`: Can only be called from within the contract

### View and Pure Functions
- `view`: Promises not to modify state
- `pure`: Promises not to read or modify state

### Events
```solidity
event DataStored(uint256 data);
```

## Compilation Output

The compiler produces:
- **ABI**: Application Binary Interface for interacting with the contract
- **Bytecode**: The compiled code to be deployed
- **Method Identifiers**: Function selectors (first 4 bytes of keccak256 hash)

```json
{
  "abi": [
    {
      "inputs": [],
      "name": "get",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "x", "type": "uint256"}],
      "name": "set",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "methodIdentifiers": {
    "get()": "6d4ce63c",
    "set(uint256)": "60fe47b1"
  }
}
```

## Gas Estimates

The compiler provides gas estimates for:
- Contract creation (codeDepositCost, executionCost, totalCost)
- External function calls

```json
{
  "gasEstimates": {
    "creation": {
      "codeDepositCost": "37600",
      "executionCost": "20477",
      "totalCost": "58077"
    },
    "external": {
      "get()": "2415",
      "set(uint256)": "20163"
    }
  }
}
```

## Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Solidity GitHub](https://github.com/ethereum/solidity)
- [Solidity by Example](https://solidity-by-example.org/)

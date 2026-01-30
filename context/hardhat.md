# Hardhat

## Overview

Hardhat is a flexible and extensible development environment for Ethereum software, designed to help developers write, test, debug, and deploy smart contracts with ease.

## Installation

```bash
npm install --save-dev hardhat
npx hardhat init
```

## Project Structure

```
.
├── contracts/          # Solidity contracts
├── scripts/            # Deployment scripts
├── test/               # Test files
├── ignition/          # Deployment modules
│   └── modules/
├── hardhat.config.js   # Configuration
└── package.json
```

## Commands

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
# Run all tests (TypeScript and Solidity)
npx hardhat test

# Run only Solidity tests
npx hardhat test solidity
```

### Deploy with Ignition

```bash
# Deploy to localhost
npx hardhat ignition deploy --network localhost ignition/modules/Counter.ts

# Deploy to a specific network
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```

### Start Local Node

```bash
npx hardhat node
```

## Writing Tests

Hardhat supports both JavaScript/TypeScript tests and Solidity tests.

### JavaScript/TypeScript Tests

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token", function () {
  it("Should return the correct name", async function () {
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();

    expect(await token.name()).to.equal("MyToken");
  });
});
```

### Solidity Tests

Hardhat automatically:
1. Compiles your contracts and tests
2. Gathers all test files (`.t.sol` in `contracts/` and `.sol` in `test/`)
3. Deploys each test contract
4. Executes functions prefixed with `test`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "../contracts/MyContract.sol";

contract MyContractTest {
    MyContract myContract;

    function setUp() public {
        myContract = new MyContract();
    }

    function testInitialValue() public {
        require(myContract.getValue() == 0, "Initial value should be 0");
    }

    function testSetValue() public {
        myContract.setValue(42);
        require(myContract.getValue() == 42, "Value should be 42");
    }
}
```

## Configuration

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    mainnet: {
      url: process.env.MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

## Ignition Modules

```typescript
// ignition/modules/Counter.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CounterModule = buildModule("CounterModule", (m) => {
  const counter = m.contract("Counter", [0]); // Constructor args

  return { counter };
});

export default CounterModule;
```

## Console Logging

```solidity
import "hardhat/console.sol";

contract MyContract {
    function doSomething(uint256 value) public {
        console.log("Value is:", value);
        console.log("Sender is:", msg.sender);
    }
}
```

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Hardhat GitHub](https://github.com/NomicFoundation/hardhat)
- [Hardhat Ignition](https://hardhat.org/ignition)

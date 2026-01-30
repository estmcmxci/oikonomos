# Ethers.js

## Overview

Ethers.js is a complete and compact library for interacting with the Ethereum Blockchain and its ecosystem. It is used for creating decentralized applications, wallets, and tools for reading and writing to the blockchain.

## Installation

```bash
npm install ethers
```

## Key Concepts

### Providers

Providers are read-only connections to the blockchain:

```javascript
import { ethers } from 'ethers'

// Connect to a network
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_KEY')

// Or use default provider
const provider = ethers.getDefaultProvider('mainnet')
```

### Signers

Signers are providers with the ability to sign transactions:

```javascript
// From private key
const signer = new ethers.Wallet(privateKey, provider)

// From browser wallet (MetaMask)
const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()
```

### ContractRunner Interface

```javascript
interface ContractRunner {
  call: (tx: TransactionRequest) => Promise<string>
  estimateGas: (tx: TransactionRequest) => Promise<bigint>
  provider: null | Provider
  resolveName: (name: string) => Promise<null | string>
  sendTransaction: (tx: TransactionRequest) => Promise<TransactionResponse>
}
```

## Contract Interaction

### Reading from Contracts

```javascript
const abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)"
]

const contract = new ethers.Contract(tokenAddress, abi, provider)

// Read-only calls
const balance = await contract.balanceOf(address)
const symbol = await contract.symbol()
```

### Writing to Contracts

```javascript
const abi = [
  "function transfer(address to, uint amount)"
]

const contract = new ethers.Contract("dai.tokens.ethers.eth", abi, signer)
const amount = ethers.parseUnits("1.0", 18)

const tx = await contract.transfer("ethers.eth", amount)
await tx.wait() // Wait for confirmation
```

## Contract Method API

```javascript
// Estimate gas for a method call
await contract.transfer.estimateGas(to, amount)

// Get the function fragment
contract.transfer.getFragment(to, amount)

// Populate transaction (without sending)
await contract.transfer.populateTransaction(to, amount)

// Send transaction
await contract.transfer.send(to, amount)

// Static call (simulate without sending)
await contract.transfer.staticCall(to, amount)

// Static call returning full Result
await contract.transfer.staticCallResult(to, amount)
```

## BaseContract Methods

```javascript
// Attach to a new address
contract.attach(newAddress)

// Connect to a different signer/provider
contract.connect(newSigner)

// Get deployment transaction
contract.deploymentTransaction()
```

## ENS Resolution

```javascript
// Resolve ENS name to address
const address = await provider.resolveName('vitalik.eth')

// Reverse lookup
const name = await provider.lookupAddress(address)

// Get resolver
const resolver = await provider.getResolver('nick.eth')
const twitter = await resolver.getText('com.twitter')
```

## Utilities

```javascript
// Parse/format units
ethers.parseEther("1.0")      // 1000000000000000000n
ethers.formatEther(1000000000000000000n) // "1.0"

ethers.parseUnits("1.0", 6)   // USDC (6 decimals)
ethers.formatUnits(1000000n, 6) // "1.0"

// Hashing
ethers.keccak256(data)
ethers.id("Transfer(address,address,uint256)") // Event topic

// ABI encoding
const abiCoder = new ethers.AbiCoder()
abiCoder.encode(['address', 'uint256'], [address, amount])
```

## Resources

- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Ethers.js GitHub](https://github.com/ethers-io/ethers.js)

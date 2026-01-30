# Viem

## Overview

Viem is a TypeScript interface for Ethereum, offering abstractions over the JSON-RPC API, first-class smart contract interaction, and utilities for working with ABIs. It provides low-level stateless primitives for interacting with the Ethereum blockchain with a focus on developer experience, stability, bundle size, and performance.

## Key Features

- Type-safe APIs
- Composable modules
- Optimized encoding/decoding
- First-class ENS support
- Wallet integration

## EIP-712 Typed Data Signing

Viem provides robust support for signing typed data according to the EIP-712 standard.

### Basic Usage

```typescript
import { createWalletClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const walletClient = createWalletClient({
  account: privateKeyToAccount('0x...'),
  chain: mainnet,
  transport: http()
})

const signature = await walletClient.signTypedData({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
})
```

### signTypedData API

**Parameters:**
- `account` (Account | Address): The Account to use for signing
- `domain` (object): The domain separator
  - `name` (string): The name of the signing domain
  - `version` (string): The version of the signing domain
  - `chainId` (number): The chain ID
  - `verifyingContract` (address): The contract address
- `types` (object): The named list of all type definitions
- `primaryType` (string): The primary type of the message
- `message` (object): The message to be signed

**Returns:**
- Signature string (`0x${string}`)

### Domain and Types Definition

```typescript
// All properties on a domain are optional
export const domain = {
  name: 'Ether Mail',
  version: '1',
  chainId: 1,
  verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
} as const

// The named list of all type definitions
export const types = {
  Person: [
    { name: 'name', type: 'string' },
    { name: 'wallet', type: 'address' },
  ],
  Mail: [
    { name: 'from', type: 'Person' },
    { name: 'to', type: 'Person' },
    { name: 'contents', type: 'string' },
  ],
} as const
```

### With JSON-RPC Account

```typescript
import { createWalletClient, custom } from 'viem'

// Retrieve Account from an EIP-1193 Provider
const [account] = await window.ethereum.request({
  method: 'eth_requestAccounts'
})

export const walletClient = createWalletClient({
  account,
  transport: custom(window.ethereum!)
})
```

## ENS Support

```typescript
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

// Get ENS text record
const ensText = await publicClient.getEnsText({
  name: normalize('nick.eth'),
  key: 'com.twitter',
})

// Get ENS resolver
const ensResolver = await publicClient.getEnsResolver({
  name: normalize('luc.eth'),
})
```

## Resources

- [Viem Documentation](https://viem.sh/)
- [Viem GitHub](https://github.com/wevm/viem)

# Pimlico Documentation Repository

## Introduction

Pimlico is the world's most advanced ERC-4337 account abstraction infrastructure platform, providing a comprehensive suite of tools for building, deploying, and managing smart accounts on Ethereum and other EVM-compatible chains. This documentation repository serves as the complete reference for Pimlico's products including the permissionless.js TypeScript SDK, Alto Bundler (ERC-4337 bundler), and multiple paymaster solutions that sponsor gas fees across 100+ supported chains.

The documentation is built using Vocs v1.0.14, a React-based documentation framework that enables interactive components and MDX content. The repository contains 322 MDX documentation files spanning guides (78 files), API references (242 files), 99 reusable TypeScript code snippets, and custom React components. The site features comprehensive coverage of smart account implementations (Safe, Kernel, Nexus, Simple, LightAccount, TrustWallet, Thirdweb, Coinbase, MetaMask), signer integrations (15+ including passkey, Dynamic, Privy, Magic, Turnkey, Fireblocks), EIP-7702 support for external wallet integration, and detailed API documentation for bundler endpoints, paymaster services, and the Platform API for sponsorship policy management.

## API Reference and Code Examples

### Creating a Pimlico Client

Initialize a Pimlico client to interact with Pimlico's bundler and paymaster services.

```typescript
import { createPimlicoClient } from "permissionless/clients/pimlico"
import { http } from "viem"
import { entryPoint07Address } from "viem/account-abstraction"
import { sepolia } from "viem/chains"

export const pimlicoClient = createPimlicoClient({
	chain: sepolia,
	entryPoint: {
		address: entryPoint07Address,
		version: "0.7",
	},
	transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY_HERE"),
})
```

### Complete Gasless Transaction Flow with Safe Smart Account

Full example showing client setup, smart account creation, and sending a gasless transaction.

```typescript
import "dotenv/config"
import { writeFileSync } from "fs"
import { toSafeSmartAccount } from "permissionless/accounts"
import { Hex, createPublicClient, http } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import { entryPoint07Address } from "viem/account-abstraction"
import { createSmartAccountClient } from "permissionless"

// Setup API key and private key
const apiKey = process.env.PIMLICO_API_KEY
if (!apiKey) throw new Error("Missing PIMLICO_API_KEY")

const privateKey =
	(process.env.PRIVATE_KEY as Hex) ??
	(() => {
		const pk = generatePrivateKey()
		writeFileSync(".env", `PRIVATE_KEY=${pk}`)
		return pk
	})()

// Create public client for blockchain queries
export const publicClient = createPublicClient({
	chain: sepolia,
	transport: http("https://sepolia.rpc.thirdweb.com"),
})

const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${apiKey}`

// Create Pimlico client for paymaster and bundler services
const pimlicoClient = createPimlicoClient({
	transport: http(pimlicoUrl),
	entryPoint: {
		address: entryPoint07Address,
		version: "0.7",
	},
})

// Create Safe smart account
const account = await toSafeSmartAccount({
	client: publicClient,
	owners: [privateKeyToAccount(privateKey)],
	entryPoint: {
		address: entryPoint07Address,
		version: "0.7",
	},
	version: "1.4.1",
})

console.log(`Smart account address: https://sepolia.etherscan.io/address/${account.address}`)

// Create smart account client
const smartAccountClient = createSmartAccountClient({
	account,
	chain: sepolia,
	bundlerTransport: http(pimlicoUrl),
	paymaster: pimlicoClient,
	userOperation: {
		estimateFeesPerGas: async () => {
			return (await pimlicoClient.getUserOperationGasPrice()).fast
		},
	},
})

// Send transaction (gas sponsored by Pimlico)
const txHash = await smartAccountClient.sendTransaction({
	to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	value: 0n,
	data: "0x1234",
})

console.log(`User operation included: https://sepolia.etherscan.io/tx/${txHash}`)
```

### Batch Transactions with Smart Account

Execute multiple transactions atomically in a single user operation.

```typescript
import { createSmartAccountClient } from "permissionless"
import { toSafeSmartAccount } from "permissionless/accounts"
import { createPublicClient, parseEther, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

const publicClient = createPublicClient({
	chain: sepolia,
	transport: http("https://sepolia.rpc.thirdweb.com"),
})

const owner = privateKeyToAccount("0xPRIVATE_KEY")

const safeAccount = await toSafeSmartAccount({
	client: publicClient,
	entryPoint: {
		address: entryPoint07Address,
		version: "0.7",
	},
	owners: [owner],
	version: "1.4.1",
})

const smartAccountClient = createSmartAccountClient({
	account: safeAccount,
	chain: sepolia,
	paymaster: paymasterClient,
	bundlerTransport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=API_KEY"),
	userOperation: {
		estimateFeesPerGas: async () => (await paymasterClient.getUserOperationGasPrice()).fast,
	},
})

// Send batch of transactions atomically
const userOpHash = await smartAccountClient.sendUserOperation({
	calls: [
		{
			to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
			value: parseEther("0.1"),
			data: "0x",
		},
		{
			to: "0x1440ec793aE50fA046B95bFeCa5aF475b6003f9e",
			value: parseEther("0.1"),
			data: "0x1234",
		},
	],
})
```

### ERC-20 Paymaster - Pay Gas with USDC

Use ERC-20 tokens (like USDC) to pay for gas instead of ETH.

```typescript
import "dotenv/config"
import { createSmartAccountClient } from "permissionless"
import { toSafeSmartAccount } from "permissionless/accounts"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import { createPublicClient, getAddress, type Hex, http, maxUint256, parseAbi } from "viem"
import { entryPoint07Address, type EntryPointVersion } from "viem/account-abstraction"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"

const usdc = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

const publicClient = createPublicClient({
	chain: baseSepolia,
	transport: http("https://sepolia.base.org"),
})

const apiKey = process.env.PIMLICO_API_KEY
const pimlicoUrl = `https://api.pimlico.io/v2/${baseSepolia.id}/rpc?apikey=${apiKey}`

const pimlicoClient = createPimlicoClient({
	chain: baseSepolia,
	transport: http(pimlicoUrl),
	entryPoint: {
		address: entryPoint07Address,
		version: "0.7" as EntryPointVersion,
	},
})

const account = await toSafeSmartAccount({
	client: publicClient,
	owners: [privateKeyToAccount(process.env.PRIVATE_KEY as Hex)],
	version: "1.4.1",
})

const smartAccountClient = createSmartAccountClient({
	account,
	chain: baseSepolia,
	bundlerTransport: http(pimlicoUrl),
	paymaster: pimlicoClient,
	userOperation: {
		estimateFeesPerGas: async () => {
			return (await pimlicoClient.getUserOperationGasPrice()).fast
		},
	},
})

// Check USDC balance
const senderUsdcBalance = await publicClient.readContract({
	abi: parseAbi(["function balanceOf(address account) returns (uint256)"]),
	address: usdc,
	functionName: "balanceOf",
	args: [account.address],
})

if (senderUsdcBalance < 1_000_000n) {
	throw new Error(`insufficient USDC balance, required at least 1 USDC`)
}

// Get token quotes from Pimlico
const quotes = await pimlicoClient.getTokenQuotes({
    tokens: [usdc]
})
const paymaster = quotes[0].paymaster

// Send transaction with USDC approval + actual call
const txHash = await smartAccountClient.sendTransaction({
	calls: [
		{
			to: getAddress(usdc),
			abi: parseAbi(["function approve(address,uint)"]),
			functionName: "approve",
			args: [paymaster, maxUint256],
		},
		{
			to: getAddress("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
			data: "0x1234" as Hex,
		},
	],
	paymasterContext: {
		token: usdc,
	},
})

console.log(`transactionHash: ${txHash}`)
```

### EIP-7702 Authorization - Upgrading EOA to Smart Account

Convert an externally owned account (EOA) to a smart account using EIP-7702.

```typescript
import { createWalletClient, Hex, http, zeroAddress } from "viem"
import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts"
import { odysseyTestnet } from "viem/chains"
import { safeAbiImplementation } from "./safeAbi"
import { getSafeModuleSetupData } from "./setupData"

const eoaPrivateKey = process.env.EOA_PRIVATE_KEY as Hex
if (!eoaPrivateKey) throw new Error("EOA_PRIVATE_KEY is required")

const account = privateKeyToAccount(eoaPrivateKey)

const walletClient = createWalletClient({
	account,
	chain: odysseyTestnet,
	transport: http("https://odyssey.ithaca.xyz"),
})

const SAFE_SINGLETON_ADDRESS = "0x41675C099F32341bf84BFc5382aF534df5C7461a"

// Sign authorization to delegate to Safe contract
const authorization = await walletClient.signAuthorization({
	contractAddress: SAFE_SINGLETON_ADDRESS,
})

const SAFE_MULTISEND_ADDRESS = "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526"
const SAFE_4337_MODULE_ADDRESS = "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226"

const safePrivateKey = process.env.SAFE_PRIVATE_KEY as Hex
if (!safePrivateKey) throw new Error("SAFE_PRIVATE_KEY is required")

// Setup Safe parameters
const owners = [privateKeyToAddress(safePrivateKey)]
const signerThreshold = 1n
const setupAddress = SAFE_MULTISEND_ADDRESS
const setupData = getSafeModuleSetupData()
const fallbackHandler = SAFE_4337_MODULE_ADDRESS
const paymentToken = zeroAddress
const paymentValue = 0n
const paymentReceiver = zeroAddress

// Send authorization transaction
const txHash = await walletClient.writeContract({
	address: account.address,
	abi: safeAbiImplementation,
	functionName: "setup",
	args: [
		owners,
		signerThreshold,
		setupAddress,
		setupData,
		fallbackHandler,
		paymentToken,
		paymentValue,
		paymentReceiver,
	],
	authorizationList: [authorization],
})

console.log(`Submitted: https://odyssey-explorer.ithaca.xyz/tx/${txHash}`)
```

### Bundler API - eth_sendUserOperation

Submit a user operation to the bundler for on-chain inclusion.

```bash
curl -X POST https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_sendUserOperation",
    "params": [
        {
            "sender": "0x5a6b47F4131bf1feAFA56A05573314BcF44C9149",
            "nonce": "0x845ADB2C711129D4F3966735ED98A9F09FC4CE5700000000000000000000",
            "factory": "0xd703aaE79538628d27099B8c4f621bE4CCd142d5",
            "factoryData": "0xc5265d5d000000000000000000000000aac5d4240af87249b3f71bc8e4a2cae074a3e419...",
            "callData": "0xe9ae5c5300000000000000000000000000000000000000000000000000000000000000000000000000...",
            "callGasLimit": "0x13880",
            "verificationGasLimit": "0x60B01",
            "preVerificationGas": "0xD3E3",
            "maxPriorityFeePerGas": "0x3B9ACA00",
            "maxFeePerGas": "0x7A5CF70D5",
            "paymaster": "0x",
            "paymasterVerificationGasLimit": "0x0",
            "paymasterPostOpGasLimit": "0x0",
            "paymasterData": null,
            "signature": "0xa6cc6589c8bd561cfd68d7b6b0757ef6f208e7438782939938498eee7d703260137856c840c491b3d415956265e81bf5c2184a725be2abfc365f7536b6af525e1c"
        },
        "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
    ],
    "id": 1
}'

# Response
{
    "jsonrpc": "2.0",
    "id": 1,
    "result": "0x4c31ae84205a9c862dd8d0822f427fb516448451850ee6f65351951f6a2b2154"
}
```

### Paymaster API - pm_sponsorUserOperation

Sponsor gas fees for a user operation using Pimlico's verifying paymaster.

```bash
curl -X POST https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "pm_sponsorUserOperation",
    "params": [
        {
            "sender": "0x5a6b47F4131bf1feAFA56A05573314BcF44C9149",
            "nonce": "0x845adb2c711129d4f3966735ed98a9f09fc4ce5700000000000000000000",
            "factory": "0xd703aaE79538628d27099B8c4f621bE4CCd142d5",
            "factoryData": "0xc5265d5d000000000000000000000000aac5d4240af87249b3f71bc8e4a2cae074a3e419...",
            "callData": "0xe9ae5c53...",
            "callGasLimit": "0x0",
            "verificationGasLimit": "0x0",
            "preVerificationGas": "0x0",
            "maxFeePerGas": "0x7a5cf70d5",
            "maxPriorityFeePerGas": "0x3b9aca00",
            "paymaster": null,
            "paymasterVerificationGasLimit": null,
            "paymasterPostOpGasLimit": null,
            "paymasterData": null,
            "signature": "0xffffffffffffffffffff..."
        },
        "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
        { "sponsorshipPolicyId": "sp_example_policy_id" }
    ],
    "id": 1
}'

# Response
{
    "jsonrpc": "2.0",
    "result": {
        "preVerificationGas": "0xd3e3",
        "verificationGasLimit": "0x60b01",
        "callGasLimit": "0x13880",
        "paymasterPostOpGasLimit": "0x0",
        "paymasterVerificationGasLimit": "0x0",
        "paymaster": "0xDFF7FA1077Bce740a6a212b3995990682c0Ba66d",
        "paymasterData": "0xbcd12340a2109876543210987654301098765432198765432a210987654321098765430a210987654321098765430"
    },
    "id": 1
}
```

### Paymaster API - pm_validateSponsorshipPolicies

Validate which sponsorship policies will sponsor a given user operation.

```typescript
import { JsonRpcProvider } from "@ethersproject/providers"

const chain = "sepolia"
const apiKey = "YOUR_API_KEY_HERE"
const provider = new JsonRpcProvider(`https://api.pimlico.io/v2/${chain}/rpc?apikey=${apiKey}`)

const userOperation = {
    sender: "0x1234567890123456789012345678901234567890",
    nonce: "0x1",
    initCode: "0x",
    callData: "0x",
    callGasLimit: "0x100000",
    verificationGasLimit: "0x20000",
    preVerificationGas: "0x10000",
    maxFeePerGas: "0x3b9aca00",
    maxPriorityFeePerGas: "0x3b9aca00",
    paymasterAndData: "0x",
    signature: "0x"
}

const result = await provider.send("pm_validateSponsorshipPolicies", [
    userOperation,
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    ["sp_crazy_kangaroo", "sp_talented_turtle"]
])

// Returns:
// [
//     {
//         "sponsorshipPolicyId": "sp_crazy_kangaroo",
//         "data": {
//             "name": "Linea Christmas Week",
//             "author": "Linea",
//             "icon": "data:image/png;base64,...",
//             "description": "Linea is sponsoring the first 10 transactions..."
//         }
//     }
// ]
```

### Platform API - Create Sponsorship Policy

Create a sponsorship policy to control gas sponsorship rules and budgets.

```bash
curl -X POST "https://api.pimlico.io/v2/account/sponsorship_policies?apikey=YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "policy_name": "Newly Created Policy",
        "limits": {
            "global": {
                "user_operation_spending": {
                    "amount": 20000000,
                    "currency": "USD"
                }
            }
        }
    }'

# Response
{
  "id": "sp_mighty_chameleon",
  "policy_name": "Newly Created Policy",
  "policy_status": "active",
  "created_at": "2024-07-16T17:36:23.296Z",
  "start_time": null,
  "end_time": null,
  "chain_ids": {
    "allowlist": null
  },
  "limits": {
    "global": {
      "user_operation_spending": {
        "amount": 20000000,
        "currency": "USD"
      }
    }
  }
}
```

### Platform API - Retrieve Sponsorship Policy

Get details about a specific sponsorship policy.

```bash
curl -X GET "https://api.pimlico.io/v2/account/sponsorship_policies/sp_mighty_chameleon?apikey=YOUR_API_KEY"

# Response includes full policy object with id, name, status, limits, chain restrictions, and timestamps
```

### ERC-20 Paymaster - Get Token Quotes

Get exchange rates and gas cost estimates for paying with ERC-20 tokens.

```bash
curl -X POST https://api.pimlico.io/v2/84532/rpc?apikey=YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "pimlico_getTokenQuotes",
    "params": [
        ["0x036CbD53842c5426634e7929541eC2318f3dCF7e"]
    ],
    "id": 1
}'

# Response provides exchange rate, post-op gas, and paymaster address
```

### Bundler API - pimlico_getUserOperationGasPrice

Get recommended gas prices for user operations.

```typescript
import { createPimlicoClient } from "permissionless/clients/pimlico"
import { http } from "viem"
import { sepolia } from "viem/chains"
import { entryPoint07Address } from "viem/account-abstraction"

const pimlicoClient = createPimlicoClient({
	chain: sepolia,
	transport: http("https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY"),
	entryPoint: {
		address: entryPoint07Address,
		version: "0.7",
	},
})

const gasPrice = await pimlicoClient.getUserOperationGasPrice()

// Returns: { slow: {...}, standard: {...}, fast: {...} }
// Each contains: maxFeePerGas and maxPriorityFeePerGas
```

### Bundler API - pimlico_getUserOperationStatus

Track the status of a submitted user operation.

```bash
curl -X POST https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "pimlico_getUserOperationStatus",
    "params": ["0x4c31ae84205a9c862dd8d0822f427fb516448451850ee6f65351951f6a2b2154"],
    "id": 1
}'

# Returns status: "not_found", "not_submitted", "submitted", "rejected", or "reverted"
```

### Smart Account Client Actions

High-level actions available on the smart account client.

```typescript
import { createSmartAccountClient } from "permissionless"

const smartAccountClient = createSmartAccountClient({
	account,
	chain: sepolia,
	bundlerTransport: http(pimlicoUrl),
	paymaster: pimlicoClient,
	userOperation: {
		estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast,
	},
})

// Send simple transaction
const txHash = await smartAccountClient.sendTransaction({
	to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	value: parseEther("0.1"),
	data: "0x",
})

// Write to contract
const hash = await smartAccountClient.writeContract({
	address: "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
	abi: nftAbi,
	functionName: "mint",
	args: [],
})

// Estimate gas for user operation
const gasEstimate = await smartAccountClient.estimateUserOperationGas({
	calls: [{ to: "0x...", value: 0n, data: "0x" }],
})

// Prepare user operation (without sending)
const userOp = await smartAccountClient.prepareUserOperation({
	calls: [{ to: "0x...", value: 0n, data: "0x" }],
})

// Send prepared user operation
const userOpHash = await smartAccountClient.sendUserOperation(userOp)

// Wait for receipt
const receipt = await smartAccountClient.waitForUserOperationReceipt({
	hash: userOpHash,
})
```

### Vocs Configuration

Configure the documentation site with custom theme, navigation, and integrations.

```typescript
import { defineConfig } from "vocs"

export default defineConfig({
	title: "Pimlico",
	logoUrl: { light: "/pimlico-purple.svg", dark: "/pimlico-white.svg" },
	iconUrl: "/favicons/favicon.svg",
	titleTemplate: "%s | Pimlico Docs",
	editLink: {
		pattern: "https://github.com/pimlicolabs/docs/edit/main/docs/pages/:path",
		text: "Edit on GitHub",
	},
	description: "Pimlico is the world's most popular account abstraction infrastructure platform",
	rootDir: "docs",
	theme: {
		accentColor: { light: "#7115AA", dark: "#a66cc9" },
	},
	sidebar: {
		"/guides": guidesSidebar,
		"/references": [
			{
				text: "Platform",
				link: "/references/platform",
				items: platformSidebar,
			},
			{
				text: "Bundler",
				link: "/references/bundler",
				items: bundlerSidebar,
			},
			{
				text: "Paymaster",
				link: "/references/paymaster",
				items: paymasterSidebar,
			},
		],
		"/references/permissionless": [
			{
				link: "/references/permissionless",
				text: "permissionless.js Core",
				items: permissionlessSidebar,
			},
			{
				link: "/references/permissionless/wagmi",
				text: "permissionless.js Wagmi",
				items: permissionlessWagmiSidebar,
			},
		],
	},
	topNav: [
		{
			text: "Guides",
			link: "/guides/getting-started",
			match: "/guides",
		},
		{
			text: "References",
			items: [
				{ text: "permissionless.js", link: "/references/permissionless" },
				{ text: "Platform", link: "/references/platform" },
				{ text: "Bundler", link: "/references/bundler" },
				{ text: "Paymaster", link: "/references/paymaster" },
			],
			match: "/references",
		},
		{
			text: "Dashboard",
			link: "https://dashboard.pimlico.io",
		},
	],
	socials: [
		{ icon: "github", link: "https://github.com/pimlicolabs" },
		{ icon: "telegram", link: "https://t.me/pimlicoHQ" },
		{ icon: "x", link: "https://twitter.com/pimlicoHQ" },
		{ icon: "warpcast", link: "https://warpcast.com/~/channel/pimlico" },
	],
})
```

## Summary and Integration Patterns

The Pimlico documentation repository provides comprehensive coverage for developers building with ERC-4337 account abstraction. The primary use cases include: (1) Building gasless dApps where the application sponsors user transaction costs using the verifying paymaster and sponsorship policies, (2) Enabling users to pay gas with ERC-20 tokens like USDC instead of native ETH using the ERC-20 paymaster, (3) Implementing smart accounts (Safe, Kernel, etc.) with various signer integrations (passkeys, social logins, MPC providers) for enhanced UX and security, (4) Upgrading existing EOAs to smart accounts using EIP-7702 for backward compatibility, and (5) Submitting user operations through the Alto Bundler for reliable on-chain inclusion across 100+ EVM chains. The documentation supports both beginners (through tutorials) and advanced users (through detailed API references), with 99 reusable TypeScript code snippets demonstrating real-world patterns.

Integration patterns follow a consistent flow: developers first create clients (publicClient for blockchain queries, pimlicoClient for bundler/paymaster services), then instantiate a smart account using one of the supported account types (toSafeSmartAccount, toKernelSmartAccount, etc.) with configured signers, create a smartAccountClient that combines the account with bundler and paymaster services, and finally execute transactions using high-level methods like sendTransaction or sendUserOperation. The permissionless.js SDK (v0.2.50) is built on viem v2.32.1 and provides type-safe wrappers around all Pimlico services, supporting both current (EntryPoint 0.7/0.8) and legacy (EntryPoint 0.6) versions. The documentation framework enables developers to quickly copy working examples, with special MDX components for step-by-step guides (::::steps), code inclusion from snippets (// [!include ~/snippets/...]), and interactive components like the pricing calculator, all deployed via Vercel with PostHog analytics and comprehensive search functionality.


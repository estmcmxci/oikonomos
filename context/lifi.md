### GET /tools

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Retrieves a list of available tools, filtered by chains.

```APIDOC
## GET /tools

### Description
This endpoint retrieves a list of available tools, such as bridges and DEXs, filtering them based on the provided chain IDs.

### Method
GET

### Endpoint
/v1/tools?chains=20000000000001

### Parameters
#### Query Parameters
- **chains** (string) - Required - Comma-separated list of chain IDs.

### Request Example
```json
// No request body for GET requests
```

### Response
#### Success Response (200)
- **tools** (array) - List of tools for the specified chains.

#### Response Example
```json
// Example response will vary
```
```

--------------------------------

### Li.Fi SDK Full Example - TypeScript

Source: https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

A comprehensive example demonstrating the Li.Fi SDK workflow. It includes fetching a quote for a desired transfer, sending the transaction, and monitoring its status until completion or failure. This requires ethers.js and axios.

```TypeScript
const ethers = require('ethers');
const axios = require('axios');

const API_URL = 'https://li.quest/v1';

// Get a quote for your desired transfer
const getQuote = async (fromChain, toChain, fromToken, toToken, fromAmount, fromAddress) => {
    const result = await axios.get(`${API_URL}/quote`, {
        params: {
            fromChain,
            toChain,
            fromToken,
            toToken,
            fromAmount,
            fromAddress,
        }
    });
    return result.data;
}

// Check the status of your transfer
const getStatus = async (bridge, fromChain, toChain, txHash) => {
    const result = await axios.get(`${API_URL}/status`, {
        params: {
            bridge,
            fromChain,
            toChain,
            txHash,
        }
    });
    return result.data;
}

const fromChain = 42161;
const fromToken = 'USDC';
const toChain = 100;
const toToken = 'USDC';
const fromAmount = '1000000';
const fromAddress = YOUR_WALLET_ADDRESS;

// Set up your wallet
const provider = new ethers.providers.JsonRpcProvider('https://rpc.xdaichain.com/', 100);
const wallet = ethers.Wallet.fromMnemonic(YOUR_PERSONAL_MNEMONIC).connect(
    provider
);

const run = async () => {
    const quote = await getQuote(fromChain, toChain, fromToken, toToken, fromAmount, fromAddress);
    const tx = await wallet.sendTransaction(quote.transactionRequest);

    await tx.wait();

    // Only needed for cross chain transfers
    if (fromChain !== toChain) {
        let result;
        do {
            result = await getStatus(quote.tool, fromChain, toChain, tx.hash);
        } while (result.status !== 'DONE' && result.status !== 'FAILED')
    }
}

run().then(() => {
    console.log('DONE!')
});

```

--------------------------------

### GET /chains

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Retrieves information about available chains, filtered by UTXO.

```APIDOC
## GET /chains

### Description
This endpoint retrieves a list of chains, filtering the results to only include UTXO chains.

### Method
GET

### Endpoint
/v1/chains?chainTypes=UTXO

### Parameters
#### Query Parameters
- **chainTypes** (string) - Required - Filter chains by type. Value: UTXO

### Request Example
```json
// No request body for GET requests
```

### Response
#### Success Response (200)
- **chains** (array) - List of chains that match the filter.

#### Response Example
```json
// Example response will vary
```
```

--------------------------------

### GET /tokens

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Retrieves a list of tokens available on the specified chains.

```APIDOC
## GET /tokens

### Description
This endpoint retrieves a list of tokens available on the specified chains.  It is used to discover what tokens are supported on particular chains.

### Method
GET

### Endpoint
/v1/tokens?chains=BTC

### Parameters
#### Query Parameters
- **chains** (string) - Required - Comma-separated list of chain symbols or IDs.

### Request Example
```json
// No request body for GET requests
```

### Response
#### Success Response (200)
- **tokens** (array) - List of tokens for the specified chains.

#### Response Example
```json
// Example response will vary
```
```

--------------------------------

### Fetch Li.Fi Documentation LLMs File

Source: https://docs.li.fi/api-reference/get-a-quote-for-a-token-transfer-1

This example shows how to fetch the llms.txt file, which contains navigation and other essential information for the Li.Fi documentation. It assumes a standard HTTP GET request.

```bash
curl https://docs.li.fi/llms.txt
```

--------------------------------

### Li.Fi API Configuration Example

Source: https://docs.li.fi/api-reference/advanced/get-a-set-of-routes-for-a-request-that-describes-a-transfer-of-tokens

An example configuration object for the Li.Fi API, demonstrating how to set parameters for integrator fees, slippage tolerance, preferred bridges, allowed exchanges, and maximum price impact.

```json
{
  "integrator": "fee-demo",
  "slippage": 0.003,
  "fee": 0.02,
  "bridges": {
    "allow": [
      "relay"
    ]
  },
  "exchanges": {
    "allow": [
      "1inch",
      "openocean"
    ]
  },
  "maxPriceImpact": 0.1
}
```

--------------------------------

### GET /quote (Ethereum to Bitcoin)

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Requests a quote for a token swap from Ethereum to Bitcoin.

```APIDOC
## GET /quote

### Description
This endpoint retrieves a quote for a token swap from Ethereum to Bitcoin using query parameters.

### Method
GET

### Endpoint
/v1/quote?fromChain=1&toChain=20000000000001&fromToken=0x0000000000000000000000000000000000000000&toToken=bitcoin&fromAddress=0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0&toAddress=bc1qmdpxhzarlxrygtvlxrkkl0eqguszkzqdgg4py5&fromAmount=500000000000000000

### Parameters
#### Query Parameters
- **fromChain** (string) - Required - The ID of the sending chain.
- **toChain** (string) - Required - The ID of the receiving chain.
- **fromToken** (string) - Required - The address of the sending token.
- **toToken** (string) - Required - The receiving token symbol.
- **fromAddress** (string) - Required - The sender's address.
- **toAddress** (string) - Required - The receiver's address.
- **fromAmount** (string) - Required - The amount to send.

### Request Example
```json
// No request body for GET requests
```

### Response
#### Success Response (200)
- **quote** (object) - Quote details for the swap.

#### Response Example
```json
// Example response will vary
```
```

--------------------------------

### Cross-Chain Swap Estimation Example

Source: https://docs.li.fi/api-reference/advanced/populate-a-step-with-transaction-data

Demonstrates an example request for estimating a cross-chain swap using the Li.Fi SDK, including token details, amounts, and slippage.

```APIDOC
## POST /swap/estimate

### Description
Estimates the parameters for a cross-chain swap, including the expected output amount, minimum output amount, fees, and gas costs.

### Method
POST

### Endpoint
/swap/estimate

### Parameters
#### Request Body
- **fromChainId** (number) - Required - The ID of the chain the user is sending tokens from.
- **toChainId** (number) - Required - The ID of the chain the user wants to receive tokens on.
- **fromToken** (object) - Required - Details of the token to be sent.
  - **address** (string) - Required - The contract address of the token.
  - **symbol** (string) - Required - The symbol of the token.
  - **decimals** (number) - Required - The number of decimals the token has.
  - **chainId** (number) - Required - The chain ID where the token exists.
  - **name** (string) - Optional - The name of the token.
  - **coinKey** (string) - Optional - A unique key for the coin.
  - **priceUSD** (string) - Optional - The current price of the token in USD.
  - **logoURI** (string) - Optional - The URI for the token's logo.
- **toToken** (object) - Required - Details of the token to be received.
  - **address** (string) - Required - The contract address of the token.
  - **symbol** (string) - Required - The symbol of the token.
  - **decimals** (number) - Required - The number of decimals the token has.
  - **chainId** (number) - Required - The chain ID where the token exists.
  - **name** (string) - Optional - The name of the token.
  - **coinKey** (string) - Optional - A unique key for the coin.
  - **priceUSD** (string) - Optional - The current price of the token in USD.
  - **logoURI** (string) - Optional - The URI for the token's logo.
- **fromAmount** (string) - Required - The amount of the `fromToken` to send.
- **slippage** (number) - Required - The maximum acceptable slippage for the swap.
- **fromAddress** (string) - Required - The address initiating the transaction.
- **toAddress** (string) - Required - The address where the recipient token should be sent.
- **integrator** (string) - Optional - The integrator's name, used for tracking.

### Request Example
```json
{
  "fromChainId": 100,
  "toChainId": 100,
  "fromToken": {
    "address": "0x0000000000000000000000000000000000000000",
    "symbol": "Xdai",
    "decimals": 18,
    "chainId": 100,
    "name": "Xdai",
    "coinKey": "Xdai",
    "priceUSD": "1",
    "logoURI": "https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png"
  },
  "toToken": {
    "name": "Minerva Wallet SuperToken",
    "symbol": "MIVA",
    "coinKey": "MIVA",
    "decimals": 18,
    "chainId": 100,
    "priceUSD": "1",
    "logoURI": "https://minerva.digital/i/MIVA-Token_200x200.png",
    "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51"
  },
  "fromAmount": "1000000000000000000",
  "slippage": 0.003,
  "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
  "toAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
  "integrator": "fee-demo"
}
```

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the swap request.
- **type** (string) - The type of the request (e.g., "lifi").
- **tool** (string) - The DEX aggregator or tool used for the swap (e.g., "1inch").
- **toolDetails** (object) - Details about the tool used.
  - **key** (string) - Unique key for the tool.
  - **logoURI** (string) - URI for the tool's logo.
  - **name** (string) - Name of the tool.
- **action** (object) - Details of the swap action.
  - **fromChainId** (number) - Source chain ID.
  - **toChainId** (number) - Destination chain ID.
  - **fromToken** (object) - Details of the token being sent.
  - **toToken** (object) - Details of the token being received.
  - **fromAmount** (string) - Amount of the source token.
  - **slippage** (number) - Slippage tolerance.
  - **fromAddress** (string) - Sender's address.
  - **toAddress** (string) - Recipient's address.
- **estimate** (object) - Estimated details for the swap.
  - **fromAmount** (string) - The estimated amount of the source token.
  - **toAmount** (string) - The estimated amount of the destination token.
  - **toAmountMin** (string) - The minimum acceptable amount of the destination token.
  - **tool** (string) - The tool used for the estimation.
  - **executionDuration** (number) - Estimated execution time in seconds.
  - **approvalAddress** (string) - The address that needs approval for the token transfer.
  - **feeCosts** (array) - Array of fee cost objects.
  - **gasCosts** (array) - Array of gas cost objects.

#### Response Example
```json
{
  "id": "a8dc011a-f52d-4492-9e99-21de64b5453a",
  "type": "lifi",
  "tool": "1inch",
  "toolDetails": {
    "key": "1inch",
    "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/oneinch.svg",
    "name": "1inch"
  },
  "action": {
    "fromChainId": 100,
    "toChainId": 100,
    "fromToken": {
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "Xdai",
      "decimals": 18,
      "chainId": 100,
      "name": "Xdai",
      "coinKey": "Xdai",
      "priceUSD": "1",
      "logoURI": "https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png"
    },
    "toToken": {
      "name": "Minerva Wallet SuperToken",
      "symbol": "MIVA",
      "coinKey": "MIVA",
      "decimals": 18,
      "chainId": 100,
      "priceUSD": "1",
      "logoURI": "https://minerva.digital/i/MIVA-Token_200x200.png",
      "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51"
    },
    "fromAmount": "1000000000000000000",
    "slippage": 0.003,
    "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
    "toAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
  },
  "estimate": {
    "fromAmount": "1000000000000000000",
    "toAmount": "21922914496086353975",
    "toAmountMin": "21265227061203763356",
    "tool": "1inch",
    "executionDuration": 30,
    "approvalAddress": "0x1111111254fb6c44bac0bed2854e76f90643097d",
    "feeCosts": [],
    "gasCosts": [
      {
        "type": "SEND",
        "price": "1",
        "estimate": "252364",
        "limit": "315455",
        "amount": "252364",
        "amountUSD": "0.00",
        "token": {
          "address": "0x0000000000000000000000000000000000000000",
          "symbol": "Xdai",
          "decimals": 18,
          "chainId": 100,
          "name": "Xdai",
          "coinKey": "Xdai",
          "priceUSD": "1",
          "logoURI": "https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png"
        }
      }
    ]
  },
  "integrator": "fee-demo",
  "includedSteps": [
    {
      "id": "a8dc011a-f52d-4492-9e99-21de64b5453a",
      "type": "swap",
      "tool": "1inch",
      "toolDetails": {
        "key": "1inch",
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/oneinch.svg",
        "name": "1inch"
      },
      "action": {
        "fromChainId": 100,
        "toChainId": 100,
        "fromToken": {
          "address": "0x0000000000000000000000000000000000000000",
          "symbol": "Xdai",
          "decimals": 18,
          "chainId": 100,
          "name": "Xdai",
          "coinKey": "Xdai",
          "priceUSD": "1",
          "logoURI": "https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png"
        },
        "toToken": {
          "name": "Minerva Wallet SuperToken",
          "symbol": "MIVA",
          "coinKey": "MIVA",
          "decimals": 18,
          "chainId": 100,
          "priceUSD": "1",
          "logoURI": "https://minerva.digital/i/MIVA-Token_200x200.png",
          "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51"
        },
        "fromAmount": "1000000000000000000",
        "slippage": 0.003,
        "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
        "toAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
      },
      "estimate": {
        "fromAmount": "1000000000000000000",
        "toAmount": "21922914496086353975",
        "toAmountMin": "21265227061203763356",
        "tool": "1inch",
        "executionDuration": 30,
        "approvalAddress": "0x1111111254fb6c44bac0bed2854e76f90643097d",
        "feeCosts": [],
        "gasCosts": [
          {
            "type": "SEND",
            "price": "1",
            "estimate": "252364"
          }
        ]
      }
    }
  ]
}
```
```

--------------------------------

### Example URL for Widget Initialization

Source: https://docs.li.fi/integrate-li.fi-widget/configure-widget

An example of a URL that can be used to initialize the Li.Fi widget's form values. When `buildUrl` is true in the widget configuration, parameters like `fromAmount`, `fromChain`, `fromToken`, `toAddress`, `toChain`, and `toToken` in this URL will populate the widget's state upon page load.

```url
https://playground.li.fi/?fromAmount=20&fromChain=42161&fromToken=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9&toAddress=0x29DaCdF7cCaDf4eE67c923b4C22255A4B2494eD7&toChain=42161&toToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
```

--------------------------------

### GET /quote

Source: https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

Fetches a quote for a desired token transfer between chains. This is the first step in initiating a cross-chain transaction.

```APIDOC
## GET /quote

### Description
Fetches a quote for a desired token transfer between chains. This is the first step in initiating a cross-chain transaction.

### Method
GET

### Endpoint
/v1/quote

### Parameters
#### Query Parameters
- **fromChain** (number) - Required - The chain ID from which the transfer originates.
- **toChain** (number) - Required - The chain ID to which the transfer is destined.
- **fromToken** (string) - Required - The symbol or address of the token to transfer from.
- **toToken** (string) - Required - The symbol or address of the token to transfer to.
- **fromAmount** (string) - Required - The amount of the token to transfer.
- **fromAddress** (string) - Required - The wallet address initiating the transfer.

### Request Example
```json
{
  "quote": "{
    \"tool\": \"synapse\",
    \"fromChain\": 42161,
    \"toChain\": 100,
    \"fromToken\": \"USDC\",
    \"toToken\": \"USDC\",
    \"fromAmount\": \"1000000\",
    \"fromAddress\": \"0x...\",
    \"transactionRequest\": { ... }
  }"
}
```

### Response
#### Success Response (200)
- **tool** (string) - The bridging tool used for the quote.
- **fromChain** (number) - The source chain ID.
- **toChain** (number) - The destination chain ID.
- **fromToken** (string) - The source token symbol or address.
- **toToken** (string) - The destination token symbol or address.
- **fromAmount** (string) - The amount to be transferred.
- **fromAddress** (string) - The originating wallet address.
- **transactionRequest** (object) - The transaction details required to initiate the transfer.

#### Response Example
```json
{
  "tool": "synapse",
  "fromChain": 42161,
  "toChain": 100,
  "fromToken": "USDC",
  "toToken": "USDC",
  "fromAmount": "1000000",
  "fromAddress": "0x123...",
  "transactionRequest": {
    "to": "0x...",
    "value": "0x...",
    "data": "0x..."
  }
}
```
```

--------------------------------

### Quote API Example

Source: https://docs.li.fi/api-reference/introduction

An example of how to request a quote for a cross-chain token swap. This demonstrates the required query parameters and the authentication header.

```APIDOC
## GET /quote

### Description
Requests a quote for a token swap between two chains.

### Method
GET

### Endpoint
`/v1/quote`

### Parameters
#### Query Parameters
- **fromChain** (integer) - Required - The chain ID from which to send the tokens.
- **fromAmount** (string) - Required - The amount of tokens to send (as a string to avoid precision loss).
- **fromToken** (string) - Required - The token address to send from.
- **fromAddress** (string) - Required - The address from which the tokens will be sent.
- **toChain** (integer) - Required - The chain ID to which the tokens will be sent.
- **toToken** (string) - Required - The token address to receive.
- **slippage** (number) - Optional - The maximum acceptable slippage percentage (e.g., 0.03 for 3%).

#### Headers
- **x-lifi-api-key** (string) - Optional - Your LI.FI API key for higher rate limits.

### Request Example
```bash
curl --location 'https://li.quest/v1/quote?fromChain=100&fromAmount=1000000&fromToken=0x4ecaba5870353805a9f068101a40e0f32ed605c6&fromAddress=0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0&toChain=137&toToken=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&slippage=0.03' \
--header 'x-lifi-api-key: YOUR_CUSTOM_KEY'
```

### Response
#### Success Response (200)
- **quote** (object) - Contains details about the swap quote, including routes, estimated amounts, and costs.
  - **fromAmount** (string) - The amount of `fromToken` to be swapped.
  - **toAmount** (string) - The estimated amount of `toToken` to be received.
  - **routes** (array) - An array of possible swap routes.
    - **...route details...**

#### Response Example
```json
{
  "quote": {
    "fromAmount": "1000000",
    "toAmount": "850000",
    "routes": [
      {
        "...": "..."
      }
    ]
  }
}
```
```

--------------------------------

### Example URL for Widget Initialization

Source: https://docs.li.fi/widget/configure-widget

An example URL demonstrating how to pass initialization parameters to the Li.Fi widget. These parameters, such as `fromAmount`, `fromChain`, `fromToken`, `toAddress`, `toChain`, and `toToken`, will populate the widget's form fields if `buildUrl` is enabled and not overridden by config.

```url
https://playground.li.fi/?fromAmount=20&fromChain=42161&fromToken=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9&toAddress=0x29DaCdF7cCaDf4eE67c923b4C22255A4B2494eD7&toChain=42161&toToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831

```

--------------------------------

### Install LI.FI SDK using Package Managers

Source: https://docs.li.fi/sdk/overview

Install the LI.FI SDK using different package managers like Yarn, PNPM, Bun, and NPM. This is the first step in integrating the SDK into your project.

```typescript
yarn add @lifi/sdk
```

```typescript
pnpm add @lifi/sdk
```

```typescript
bun add @lifi/sdk
```

```typescript
npm install @lifi/sdk
```

--------------------------------

### Token Example Data

Source: https://docs.li.fi/api-reference/returns-all-possible-connections-based-on-a-from-or-tochain

An example illustrating the data associated with a specific token, such as DAI on the Polygon (Matic) chain. This includes its address, symbol, decimals, chain ID, name, coin key, price in USD, and logo URI.

```json
{
  "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  "symbol": "DAI",
  "decimals": 18,
  "chainId": 137,
  "name": "(PoS) Dai Stablecoin",
  "coinKey": "DAI",
  "priceUSD": "1",
  "logoURI": ">-
    https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png"
}
```

--------------------------------

### Install LI.FI SDK using Yarn

Source: https://docs.li.fi/integrate-li.fi-js-sdk/install-li

Installs the LI.FI SDK package using the Yarn package manager. This is the first step to integrating LI.FI's cross-chain functionalities into your application.

```bash
yarn add @lifi/sdk
```

--------------------------------

### GET /token

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Retrieves details for a specific token on a specific chain.

```APIDOC
## GET /token

### Description
This endpoint retrieves detailed information about a specific token, including its name, symbol, and other relevant details.

### Method
GET

### Endpoint
/v1/token?chain=20000000000001&token=bitcoin

### Parameters
#### Query Parameters
- **chain** (string) - Required - The chain ID for the token.
- **token** (string) - Required - The token symbol.

### Request Example
```json
// No request body for GET requests
```

### Response
#### Success Response (200)
- **token** (object) - Detailed information about the token.

#### Response Example
```json
// Example response will vary
```
```

--------------------------------

### Setup Sui Provider with LiFi SDK

Source: https://docs.li.fi/sdk/configure-sdk-providers

This section outlines the setup for the Sui provider within the LiFi SDK, which relies on the [@mysten/dapp-kit](https://sdk.mystenlabs.com/dapp-kit) and [@mysten/sui](https://sdk.mystenlabs.com/typescript) libraries. It highlights the configuration option `getWallet`, which expects a `WalletWithRequiredFeatures` instance.

```typescript
// Example configuration for Sui Provider (conceptual)
// Dependencies: '@mysten/dapp-kit', '@mysten/sui'

// Assuming 'getWallet' function is defined elsewhere and returns a WalletWithRequiredFeatures instance
// const mySuiWallet = getWallet();

// createConfig({
//   integrator: 'Your dApp/company name',
//   providers: [
//     Sui({
//       getWallet: async () => mySuiWallet,
//     }),
//   ],
// });
```

--------------------------------

### GET /quote (Bitcoin to Ethereum)

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Requests a quote for a token swap from Bitcoin to Ethereum. Accepts query parameters.

```APIDOC
## GET /quote

### Description
This endpoint is used to get a quote for a token swap from Bitcoin to Ethereum.  It provides estimated amounts and fees.

### Method
GET

### Endpoint
/v1/quote?fromAddress=bc1qmdpxhzarlxrygtvlxrkkl0eqguszkzqdgg4py5&fromAmount=500000&fromChain=BTC&fromToken=bitcoin&toAddress=0x39333638696578786b61393361726b63717a6773&toChain=1&toToken=0x0000000000000000000000000000000000000000

### Parameters
#### Query Parameters
- **fromAddress** (string) - Required - The sender's address.
- **fromAmount** (string) - Required - The amount to send.
- **fromChain** (string) - Required - The chain symbol of the sending token.
- **fromToken** (string) - Required - The sending token symbol.
- **toAddress** (string) - Required - The receiver's address.
- **toChain** (string) - Required - The chain ID of the receiving token.
- **toToken** (string) - Required - The receiving token address.

### Request Example
```json
// No request body for GET requests
```

### Response
#### Success Response (200)
- **quote** (object) - Quote details for the swap.

#### Response Example
```json
// Example response will vary
```
```

--------------------------------

### Get Solana Chains via API

Source: https://docs.li.fi/introduction/user-flows-and-examples/solana-tx-execution

Fetches a list of chains that support Solana (SVM) via the li.quest API. This GET request requires no specific input parameters beyond the chain type filter.

```shell
curl --request GET \
     --url 'https://li.quest/v1/chains?chainTypes=SVM' \
     --header 'accept: application/json'
```

--------------------------------

### Install LI.FI Widget with Yarn, PNPM, Bun, or NPM

Source: https://docs.li.fi/widget/install-widget

Install the LI.FI Widget and its core dependencies using your preferred package manager. This includes libraries for multi-chain functionality, Ethereum applications (Wagmi), Bitcoin applications (Bigmi), Solana wallet integration, and data management (TanStack Query).

```typescript
yarn add @lifi/widget wagmi @bigmi/react @solana/wallet-adapter-react @mysten/dapp-kit @tanstack/react-query
```

```typescript
pnpm add @lifi/widget wagmi @bigmi/react @solana/wallet-adapter-react @mysten/dapp-kit @tanstack/react-query
```

```typescript
bun add @lifi/widget wagmi @bigmi/react @solana/wallet-adapter-react @mysten/dapp-kit @tanstack/react-query
```

```typescript
npm install @lifi/widget wagmi @bigmi/react @solana/wallet-adapter-react @mysten/dapp-kit @tanstack/react-query
```

--------------------------------

### Configure LI.FI SDK

Source: https://docs.li.fi/sdk/installing-the-sdk

Set up the LI.FI SDK by creating a configuration with your integrator string. This is the first step to interacting with the SDK's functionalities.

```typescript
import { createConfig } from '@lifi/sdk'

createConfig({
  integrator: 'Your dApp/company name',
})
```

```javascript
import { createConfig } from '@lifi/sdk'

createConfig({
  integrator: 'Your dApp/company name',
})
```

--------------------------------

### Migrate Wallet Management: Ethers.js to Wagmi

Source: https://docs.li.fi/widget/migrate-from-v2-to-v3

Illustrates the transition of wallet management from Ethers.js in Widget v2 to Wagmi in Widget v3. The v2 example shows a manual setup with Ethers.js callbacks, while the v3 example highlights a simplified integration by wrapping the widget with `WagmiProvider`. This change simplifies wallet connectivity and leverages Wagmi's ecosystem.

```typescript
import { LiFiWidget, WidgetConfig } from '@lifi/widget';
import { useMemo } from 'react';

// Widget v2 setup with Ethers.js
export const WidgetPage = () => {
  const { account, connect, disconnect, switchChain } = useWallet();

  const widgetConfig = useMemo((): WidgetConfig => {
    return {
      walletManagement: {
        signer: account.signer,
        connect: async () => {
          const signer = await connect();
          return signer;
        },
        disconnect: async () => {
          await disconnect();
        },
        switchChain: async (chainId: number) => {
          await switchChain(chainId);
          if (account.signer) {
            return account.signer;
          } else {
            throw Error('No signer object is found after the chain switch.');
          }
        },
      },
    };
  }, [account.signer, connect, disconnect, switchChain]);

  return (
    <LiFiWidget integrator="Your dApp/company name" config={widgetConfig} />
  );
}

```

```typescript
import { LiFiWidget } from '@lifi/widget';
import { createClient } from 'viem';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Widget v3 setup with Wagmi
const wagmiConfig = createConfig({
  // Make sure to provide the full list of chains
  // you would like to support in the Widget
  // and keep them in sync, so all functionality
  // like switching chains can work correctly.
  chains: [mainnet],
  connectors: [injected()],
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
});

export const WidgetPage = () => {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <LiFiWidget integrator="wagmi-example" />
    </WagmiProvider>
  );
};

```

--------------------------------

### Example Solver Registration Response

Source: https://docs.li.fi/lifi-intents/for-solvers/reputation

An example JSON response indicating the successful registration of a solver's address. Includes the registration ID, the registered address, the associated solver ID, and timestamps for creation and update.

```JSON
{
  "id": 1,
  "address": "0x1234567890123456789012345678901234567890",
  "solverId": 5,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

--------------------------------

### Get Solana Token Details via API

Source: https://docs.li.fi/introduction/user-flows-and-examples/solana-tx-execution

Fetches detailed information for a specific token (e.g., BONK) on the Solana chain (SOL). This GET request requires the chain and token identifiers as parameters.

```shell
curl --request GET \
     --url 'https://li.quest/v1/token?chain=SOL&token=BONK' \
     --header 'accept: application/json'
```

--------------------------------

### Set up Bigmi Provider for UTXO Wallets

Source: https://docs.li.fi/sdk/configure-sdk-providers

Sets up the Bigmi provider for handling UTXO-based cryptocurrencies like Bitcoin. It defines available connectors (e.g., Phantom) and configures the Bigmi client with the Bitcoin chain. This setup is then wrapped in a BigmiProvider component, ensuring that the SDKProvider can access the necessary Bigmi configuration for interacting with UTXO wallets.

```typescript
import { bitcoin, createClient, http } from '@bigmi/core'
import { createConfig, phantom, getConnectorClient, type CreateConnectorFn, type Config } from '@bigmi/client' 
import { BigmiProvider } from '@bigmi/react'
import { SDKProvider } from './SDKProvider.js'

  const connectors: CreateConnectorFn[] = [phantom()]

  const bigmiConfig = createConfig({
    chains: [bitcoin],
    connectors,
    client({ chain }) {
      return createClient({ chain, transport: http() })
    }
  }) as Config

export const UTXOProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <BigmiProvider config={bigmiConfig} reconnectOnMount>
    <SDKProvider />
      { children }
    </BigmiProvider>
  )
}
```

--------------------------------

### Get Quote for Cross-Chain Swap (EVM to SOL)

Source: https://docs.li.fi/introduction/user-flows-and-examples/solana-tx-execution

Requests a quote for a token swap from an EVM chain (ARB) to Solana (SOL). This GET request requires details about the source and destination chains, tokens, addresses, and the amount.

```shell
curl --request GET \
       --url 'https://li.quest/v1/quote?fromChain=ARB&toChain=SOL&fromToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831&toToken=7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs&fromAddress=YOUR_EVM_WALLET&toAddress=YOUR_SOL_WALLET&fromAmount=1000000000' \
       --header 'accept: application/json'
```

--------------------------------

### GET /advanced/stepTransaction

Source: https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

Retrieves transaction data for the second step of a two-step cross-chain transfer route, to be called after the first step is complete.

```APIDOC
## GET /advanced/stepTransaction

### Description
Retrieves transaction data for the second step of a two-step cross-chain transfer route. This endpoint should be called after the first step is successfully completed.

### Method
GET

### Endpoint
/v1/advanced/stepTransaction

### Parameters
#### Query Parameters
- **bridge** (string) - Required - The bridging tool used for the transfer.
- **fromChain** (number) - Required - The chain ID from which the transfer originated.
- **toChain** (number) - Required - The chain ID to which the transfer is destined.
- **txHash** (string) - Required - The transaction hash of the first step.

### Request Example
```json
{
  "stepTransactionData": "{
    \"bridge\": \"lifi\",
    \"fromChain\": 1,
    \"toChain\": 10,
    \"txHash\": \"0x...\",
    \"transactionRequest\": { ... }
  }"
}
```

### Response
#### Success Response (200)
- **bridge** (string) - The bridging tool used.
- **fromChain** (number) - The source chain ID.
- **toChain** (number) - The destination chain ID.
- **txHash** (string) - The transaction hash of the first step.
- **transactionRequest** (object) - The transaction details required to execute the second step of the transfer.

#### Response Example
```json
{
  "bridge": "lifi",
  "fromChain": 1,
  "toChain": 10,
  "txHash": "0x123abc...",
  "transactionRequest": {
    "to": "0x...",
    "value": "0x...",
    "data": "0x..."
  }
}
```
```

--------------------------------

### Memo Examples for Different Bridges (JS)

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

These examples show the format of the memo string used in Bitcoin transactions for various bridges integrated with LI.FI. The memo contains essential information for routing the transaction and tracking purposes.

```javascript
// Memo example for Thorswap
=:ETH.USDC:0x29DaCdF7cCaDf4eE67c923b4C22255A4B2494eD7::lifi:0|0x4977d81c2a5d6bd8
```

```javascript
// Memo example for Unit and Symbiosis
// =|lifi02bf57fe
```

```javascript
// Memo example for Relay
0x986c2efd25b8887e9c187cfe2162753567339b6313e7137b749e83d4a1a79b03=|lifi92c9cbbc5
```

--------------------------------

### Example Usage of SupportedTools Component (React)

Source: https://docs.li.fi/introduction/lifi-architecture/sui-overview

This is an example of how to use the `SupportedTools` component. It demonstrates passing a `chainId` prop to the component to display supported bridges and exchanges for a specific chain.

```jsx
<SupportedTools chainId="9270000000000000" />
```

--------------------------------

### GET /v1/quote

Source: https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

Retrieves a quote for a token bridge or swap operation. This is the primary endpoint for getting estimated transaction details.

```APIDOC
## GET /v1/quote

### Description
Retrieves a quote for a token bridge or swap operation. This is the primary endpoint for getting estimated transaction details.

### Method
GET

### Endpoint
/v1/quote

### Parameters
#### Query Parameters
- **fromChain** (number) - Required - The chain ID of the source chain.
- **toChain** (number) - Required - The chain ID of the destination chain.
- **fromToken** (string) - Required - The symbol or address of the token on the source chain.
- **toToken** (string) - Required - The symbol or address of the token on the destination chain.
- **fromAmount** (string) - Required - The amount of the `fromToken` to be bridged or swapped.
- **fromAddress** (string) - Required - The wallet address initiating the transaction.

### Request Example
```typescript
const quote = await getQuote(42161, 100, 'USDC', 'USDC', '1000000', YOUR_WALLET_ADDRESS);
```

### Response
#### Success Response (200)
- **quote** (object) - Contains all necessary information for the quote, including `transactionRequest` and `estimate` details.
    - **action** (object) - Details about the token action.
    - **estimate** (object) - Estimated fees and approval information.
    - **transactionRequest** (object) - The transaction parameters ready to be sent.

#### Response Example
```json
{
  "message": "success",
  "quote": {
    "action": {
      "fromChain": 42161,
      "toChain": 100,
      "fromToken": {
        "address": "0x833589fcd6edb6e08f4c7d26a6e71da3170993b5",
        "symbol": "USDC",
        "decimals": 6
      },
      "toToken": {
        "address": "0x2791bca1f2de4661ed88a30c99a7a94e3cbdb486",
        "symbol": "USDC",
        "decimals": 6
      },
      "fromAmount": "1000000",
      "toAmount": "999500",
      "order": "BUY"
    },
    "estimate": {
      "chainId": 100,
      "fromAmount": "1000000",
      "toAmount": "999500",
      "feeAmount": "500",
      "approvalAddress": "0x...',
      "allowanceAmount": "0"
    },
    "transactionRequest": {
      "to": "0x...',
      "data": "0x..."
    }
  }
}
```
```

--------------------------------

### GET /v1/token?chain=SOL&token=BONK

Source: https://docs.li.fi/introduction/user-flows-and-examples/solana-tx-execution

Retrieves details for a specific token on a specific chain.

```APIDOC
## GET /v1/token?chain=SOL&token=BONK

### Description
This endpoint retrieves details for a specific token, identified by its chain and token symbol.

### Method
GET

### Endpoint
/v1/token?chain=SOL&token=BONK

### Parameters
#### Query Parameters
- **chain** (string) - Required - The chain ID (e.g., SOL).
- **token** (string) - Required - The token symbol (e.g., BONK).

### Request Example
```bash
curl --request GET \
     --url 'https://li.quest/v1/token?chain=SOL&token=BONK' \
     --header 'accept: application/json'
```

### Response
#### Success Response (200)
- **token** (object) - An object containing token details.

#### Response Example
```json
{
  "symbol": "BONK",
  "address": "...
  "chainId": "SOL",
  ...
}
```
```

--------------------------------

### Chainflip PSBT Memo Example (JavaScript)

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Illustrates the format of the memo output for Chainflip PSBT transactions. This memo includes the Chainflip payload and the LI.FI tracking ID, which are essential for correct transaction processing and avoiding stuck or failed transactions. Ensure both components are present and correctly formatted.

```javascript
// Memo example
0x01071eb6638de8c571c787d7bc24f98bfa735425731c6400f4c5ef05000000000000000000000000ff010002001e0200=|lifi92c9cbbc5
```

--------------------------------

### Token Information Example

Source: https://docs.li.fi/api-reference/check-the-status-of-a-cross-chain-transfer

Example structure for token information, including symbol, decimals, chain ID, name, and logo URI.

```APIDOC
## Token Information Example

### Description
This example shows the structure for token information as used within the Li.Fi API.

### Method
N/A (Data Structure Example)

### Endpoint
N/A

### Parameters
N/A

### Request Example
```json
{
  "symbol": "anyUSDC",
  "decimals": 6,
  "chainId": 137,
  "name": "USDC",
  "coinKey": "anyUSDC",
  "priceUSD": "0",
  "logoURI": ""
}
```

### Response
#### Success Response (N/A)
- **symbol** (string) - The trading symbol of the token.
- **decimals** (integer) - The number of decimal places for the token.
- **chainId** (integer) - The blockchain chain ID where the token exists.
- **name** (string) - The full name of the token.
- **coinKey** (string) - A unique key identifier for the coin.
- **priceUSD** (string) - The current price of the token in USD.
- **logoURI** (string) - A URI pointing to the token's logo.

#### Response Example
```json
{
  "symbol": "anyUSDC",
  "decimals": 6,
  "chainId": 137,
  "name": "USDC",
  "coinKey": "anyUSDC",
  "priceUSD": "0",
  "logoURI": ""
}
```
```

--------------------------------

### Basic LI.FI Widget Integration in React

Source: https://docs.li.fi/widget/install-widget

Integrate the LI.FI Widget into a React application with basic container customization. This example demonstrates how to import the widget and configure its appearance, such as border and border-radius.

```typescript
import { LiFiWidget, WidgetConfig } from '@lifi/widget';

const widgetConfig: WidgetConfig = {
  theme: {
    container: {
      border: '1px solid rgb(234, 234, 234)',
      borderRadius: '16px',
    },
  },
};

export const WidgetPage = () => {
  return (
    <LiFiWidget integrator="Your dApp/company name" config={widgetConfig} />
  );
};

```

--------------------------------

### GET /v1/chains?chainTypes=SVM

Source: https://docs.li.fi/introduction/user-flows-and-examples/solana-tx-execution

Retrieves information about available chains, specifically focusing on SVM (Solana Virtual Machine) chains.

```APIDOC
## GET /v1/chains?chainTypes=SVM

### Description
This endpoint retrieves a list of chains, filtering for chains of type SVM, which includes Solana.

### Method
GET

### Endpoint
/v1/chains?chainTypes=SVM

### Parameters
#### Query Parameters
- **chainTypes** (string) - Required - Specifies the type of chains to retrieve.  Use SVM for Solana.

### Request Example
```bash
curl --request GET \
     --url 'https://li.quest/v1/chains?chainTypes=SVM' \
     --header 'accept: application/json'
```

### Response
#### Success Response (200)
- **chains** (array) - An array of chain objects.

#### Response Example
```json
{
  "chains": [
    {
      "id": "SOL",
      "name": "Solana",
      "chainType": "SVM",
      ...
    }
  ]
}
```
```

--------------------------------

### LI.FI API: Get Quote for Same-Chain Deposit (Bash)

Source: https://docs.li.fi/introduction/user-flows-and-examples/lifi-composer

This example demonstrates how to use the LI.FI API's GET /quote endpoint to retrieve a transaction quote for a same-chain deposit. It specifies the source and destination chains, tokens, addresses, and amount. This is a prerequisite for executing Composer workflows involving token deposits.

```bash
curl -X GET 'https://li.quest/v1/quote?fromChain=8453&toChain=8453&fromToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&toToken=0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A&fromAddress=0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE&toAddress=0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE&fromAmount=1000000'
```

--------------------------------

### GET /v1/quote

Source: https://docs.li.fi/introduction/user-flows-and-examples/solana-tx-execution

Retrieves a quote for a token swap between two chains, including EVM to Solana swaps.

```APIDOC
## GET /v1/quote

### Description
This endpoint retrieves a quote for a token swap between two chains.  It includes options for EVM to SOL swaps.

### Method
GET

### Endpoint
/v1/quote

### Parameters
#### Query Parameters
- **fromChain** (string) - Required - The source chain ID (e.g., ARB).
- **toChain** (string) - Required - The destination chain ID (e.g., SOL).
- **fromToken** (string) - Required - The source token address.
- **toToken** (string) - Required - The destination token address.
- **fromAddress** (string) - Required - The sender's EVM wallet address.
- **toAddress** (string) - Required - The recipient's Solana wallet address.
- **fromAmount** (string) - Required - The amount of the source token.

### Request Example
```bash
curl --request GET \
     --url 'https://li.quest/v1/quote?fromChain=ARB&toChain=SOL&fromToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831&toToken=7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs&fromAddress=YOUR_EVM_WALLET&toAddress=YOUR_SOL_WALLET&fromAmount=1000000000' \
     --header 'accept: application/json'
```

### Response
#### Success Response (200)
- **quote** (object) - An object containing the quote details.

#### Response Example
```json
{
  "transactionRequest": {
    "data": "...",
  }
}
```
```

--------------------------------

### Get Quote Endpoint with API Key

Source: https://docs.li.fi/api-reference/rate-limits

This example shows how to include your API key in the header when making a request to the /v1/quote endpoint.

```APIDOC
## GET /v1/quote

### Description
Retrieves a quote for a token swap on the LI.FI protocol. An API key is required for higher rate limits.

### Method
GET

### Endpoint
`/v1/quote`

### Query Parameters
- **fromChain** (number) - Required - The chain ID of the source chain.
- **fromAmount** (string) - Required - The amount of tokens to swap, in the smallest unit.
- **fromToken** (string) - Required - The contract address of the token to swap from.
- **fromAddress** (string) - Required - The wallet address initiating the swap.
- **toChain** (number) - Required - The chain ID of the destination chain.
- **toToken** (string) - Required - The contract address of the token to swap to.
- **slippage** (number) - Optional - The maximum acceptable slippage percentage.

### Headers
- **x-lifi-api-key** (string) - Required - Your LI.FI API key.

### Request Example
```curl
curl --location 'https://li.quest/v1/quote?fromChain=100&fromAmount=1000000&fromToken=0x4ecaba5870353805a9f068101a40e0f32ed605c6&fromAddress=0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0&toChain=137&toToken=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&slippage=0.03' \
--header 'x-lifi-api-key: YOUR_CUSTOM_KEY'
```

### Response
#### Success Response (200)
- **`routes`** (array) - An array of possible swap routes.
  - **`id`** (string) - Unique identifier for the route.
  - **`order`** (number) - The order in which to consider this route.
  - **`fromAmount`** (string) - The amount of tokens after the swap.
  - **`toAmount`** (string) - The amount of tokens after the swap.
  - **`toAmountUSD`** (string) - The estimated USD value of the `toAmount`.
  - **`feeAmount`** (string) - The estimated fee for the swap.
  - **`feeAmountUSD`** (string) - The estimated USD value of the `feeAmount`.
  - **`estimatedGas`** (string) - The estimated gas cost for the swap.
  - **`insurance`** (boolean) - Indicates if insurance is available for the route.
  - **`customIntegrator`** (string) - Custom integrator name if applicable.
  - **`tool`** (string) - The DEX tool used for the swap.
  - **`toolData`** - Object containing tool-specific data.
    - **` மூல `** (string) - Source token address.
    - **` dest `** (string) - Destination token address.
    - **` user `** (string) - User's address.
    - **` approved `** (boolean) - Whether the token is approved.
    - **` allowan (string) - The token allowance.
  - **`protocol`** - Object representing the protocol.
    - **`name`** (string) - Protocol name.
    - **`logo`** (string) - Protocol logo URL.
    - **`address`** (string) - Protocol contract address.
    - **`fee`** (string) - Protocol fee.
  - **`estimate`** - Object containing estimation details.
    - **`fromAmount`** (string) - Estimated `fromAmount`.
    - **`toAmount`** (string) - Estimated `toAmount`.
    - **`toAmountUSD`** (string) - Estimated `toAmountUSD`.
    - **`feeAmount`** (string) - Estimated `feeAmount`.
    - **`feeAmountUSD`** (string) - Estimated `feeAmountUSD`.
    - **`estimatedGas`** (string) - Estimated gas cost.

#### Response Example
```json
{
  "routes": [
    {
      "id": "991186d3-4484-4174-ab6b-552652642a2e",
      "order": 1,
      "fromAmount": "999989440000000000000000",
      "toAmount": "340068844583337041070000",
      "toAmountUSD": "99989.44",
      "feeAmount": "1000000000000000000",
      "feeAmountUSD": "0.0003",
      "estimatedGas": "6425197",
      "insurance": false,
      "customIntegrator": null,
      "tool": "UniswapV3",
      "toolData": {
        "fromChainId": 100,
        "toChainId": 137,
        "fromTokenAddress": "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
        "toTokenAddress": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
        "user": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
        "recipient": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
        "affiliateAction": null,
        "affiliateName": null,
        "singleTxChainId": null,
        "approved": false,
        "allowance": "0"
      },
      "protocol": {
        "name": "Uniswap V3",
        "logo": "https://li.quest/img/logos/uniswap.svg",
        "address": "0x68b346583387841d3fc2d7ac1ee667974046076f",
        "fee": "0.3"
      },
      "estimate": {
        "fromAmount": "999989440000000000000000",
        "toAmount": "340068844583337041070000",
        "toAmountUSD": "99989.44",
        "feeAmount": "1000000000000000000",
        "feeAmountUSD": "0.0003",
        "estimatedGas": "6425197"
      }
    }
  ]
}
```
```

--------------------------------

### Get Solana Tokens via API

Source: https://docs.li.fi/introduction/user-flows-and-examples/solana-tx-execution

Retrieves a list of tokens available on the Solana chain (SOL) that are of the SVM type. This GET request filters tokens based on the specified chain and chain type.

```shell
curl --request GET \
     --url 'https://li.quest/v1/tokens?chains=SOL&chainTypes=SVM' \
     --header 'accept: application/json'
```

--------------------------------

### POST /advanced/routes (Ethereum to Bitcoin)

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Requests a quote for a token swap from Ethereum to Bitcoin using a JSON request body.

```APIDOC
## POST /advanced/routes

### Description
This endpoint is used to get a quote for a token swap from Ethereum to Bitcoin.  It requires a JSON body.

### Method
POST

### Endpoint
/v1/advanced/routes

### Parameters
#### Request Body
- **toTokenAddress** (string) - Required - The receiving token address.
- **fromTokenAddress** (string) - Required - The sending token address.
- **fromChainId** (integer) - Required - The ID of the sending chain.
- **fromAmount** (string) - Required - The amount to send.
- **toChainId** (integer) - Required - The ID of the receiving chain.
- **fromAddress** (string) - Required - The sender's address.
- **toAddress** (string) - Required - The receiver's address.

### Request Example
```json
{
  "toTokenAddress": "bitcoin",
  "fromTokenAddress": "0x0000000000000000000000000000000000000000",
  "fromChainId": 1,
  "fromAmount": "500000000000000000",
  "toChainId": 20000000000001,
  "fromAddress": "YOUR_EVM_WALLET",
  "toAddress": "YOUR_BTC_WALLET"
}
```

### Response
#### Success Response (200)
- **routes** (array) - Route details for the swap.

#### Response Example
```json
// Example response will vary
```
```

--------------------------------

### Install LI.FI Widget v3 (Multiple Package Managers)

Source: https://docs.li.fi/widget/migrate-from-v2-to-v3

Installs the latest version of the LI.FI Widget. Supports Yarn, PNPM, Bun, and NPM package managers.

```typescript
yarn add @lifi/widget
```

```typescript
pnpm add @lifi/widget
```

```typescript
bun add @lifi/widget
```

```typescript
npm install @lifi/widget
```

--------------------------------

### GET /status

Source: https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

Fetches the status of a previously initiated token transfer. Used to confirm if the token was successfully sent to the receiving chain.

```APIDOC
## GET /status

### Description
Fetches the status of a previously initiated token transfer. Used to confirm if the token was successfully sent to the receiving chain.

### Method
GET

### Endpoint
/v1/status

### Parameters
#### Query Parameters
- **bridge** (string) - Required - The bridging tool used for the transfer (obtained from the /quote response).
- **fromChain** (number) - Required - The chain ID from which the transfer originated.
- **toChain** (number) - Required - The chain ID to which the transfer was destined.
- **txHash** (string) - Required - The transaction hash of the initial transfer step.

### Request Example
```json
{
  "status": "{
    \"bridge\": \"synapse\",
    \"fromChain\": 42161,
    \"toChain\": 100,
    \"txHash\": \"0x...\",
    \"status\": \"PENDING\"
  }"
}
```

### Response
#### Success Response (200)
- **bridge** (string) - The bridging tool used.
- **fromChain** (number) - The source chain ID.
- **toChain** (number) - The destination chain ID.
- **txHash** (string) - The transaction hash.
- **status** (string) - The current status of the transfer (e.g., PENDING, DONE, FAILED).

#### Response Example
```json
{
  "bridge": "synapse",
  "fromChain": 42161,
  "toChain": 100,
  "txHash": "0xabc...",
  "status": "DONE"
}
```
```

--------------------------------

### Configure Li.Fi UTXO Provider with @bigmi/client

Source: https://docs.li.fi/sdk/configure-sdk-providers

Configures the Li.Fi SDK to use a UTXO provider, specifically for Bitcoin, by integrating with the @bigmi/client library. It defines a function `getWalletClient` that uses `getConnectorClient` from @bigmi/client to obtain the necessary client instance. This setup allows the Li.Fi SDK to interact with Bitcoin wallets like Phantom or Xverse.

```typescript
import { createConfig, UTXO } from '@lifi/sdk'
import { getConnectorClient } from '@bigmi/client'
import { useConfig } from '@bigmi/react'


const config = createConfig({
  integrator: 'Your dApp/company name',
})

export const SDKProviders = () => {
  const bigmiConfig = useConfig();

  useEffect(() => {
    // Configure SDK Provider
    config.setProviders([
      UTXO({
        async getWalletClient() {
          return getConnectorClient(bigmiConfig)
        },
      }),
    ]);
  }, [bigmiConfig]);

  return null;

};
```

--------------------------------

### LI.FI API Authentication Example (cURL)

Source: https://docs.li.fi/api-reference/introduction

Demonstrates how to authenticate with the LI.FI API using the 'x-lifi-api-key' header for authenticated requests. This is necessary for accessing higher rate limits or when integrating directly with the API.

```curl
curl --location 'https://li.quest/v1/quote?fromChain=100&fromAmount=1000000&fromToken=0x4ecaba5870353805a9f068101a40e0f32ed605c6&fromAddress=0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0&toChain=137&toToken=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&slippage=0.03' \
--header 'x-lifi-api-key: YOUR_CUSTOM_KEY'
```

--------------------------------

### Get Advanced Routes for Cross-Chain Swap (EVM to SOL)

Source: https://docs.li.fi/introduction/user-flows-and-examples/solana-tx-execution

Requests advanced routing options for a token swap from an EVM chain (ARB) to Solana (SOL) using a POST request. This method allows for more complex parameters to be sent in the request body.

```shell
curl --request POST \
       --url https://li.quest/v1/advanced/routes \
       --header 'accept: application/json' \
       --header 'content-type: application/json' \
       --data '\
{
  "fromChainId": "ARB",
  "fromAmount": "1000000000",
  "toChainId": "SOL",
  "fromTokenAddress": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  "toTokenAddress": "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
  "fromAddress": "YOUR_EVM_WALLET",
  "toAddress": "YOUR_SOL_WALLET"
}'
```

--------------------------------

### GET /v1/chains

Source: https://docs.li.fi/api-reference/get-information-about-all-currently-supported-chains

Retrieves a list of supported chains, including their key details, logos, and network configurations.

```APIDOC
## GET /v1/chains

### Description
Retrieves a list of supported chains. This endpoint provides detailed information about each chain, including its unique key, name, native coin, ID, mainnet status, logo URI, token list URL, and network-specific configurations like Metamask settings and native token details.

### Method
GET

### Endpoint
/v1/chains

### Parameters
#### Query Parameters
- **chainTypes** (string) - Optional - Restrict the resulting tokens to the given chainTypes.

#### Header Parameters
- **x-lifi-api-key** (string) - Required - The apiKey allows you to authenticate on the API.

### Request Example
```json
{
  "example": ""
}
```

### Response
#### Success Response (200)
- **chains** (array) - An array of chain objects, each containing detailed information about a supported blockchain.

#### Response Example
```json
{
  "chains": [
    {
      "key": "eth",
      "name": "Ethereum",
      "coin": "ETH",
      "id": 1,
      "mainnet": true,
      "chainType": "EVM",
      "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum.svg",
      "tokenlistUrl": "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
      "multicallAddress": "0xcA11bde05977b3631167028862bE2a173976CA11",
      "diamondAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
      "metamask": {
        "chainId": "0x1",
        "blockExplorerUrls": [
          "https://etherscan.io/"
        ],
        "chainName": "Ethereum Mainnet",
        "nativeCurrency": {
          "name": "ETH",
          "symbol": "ETH",
          "decimals": 18
        },
        "rpcUrls": [
          "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
        ]
      },
      "nativeToken": {
        "address": "0x0000000000000000000000000000000000000000",
        "decimals": 18,
        "symbol": "ETH",
        "chainId": 1,
        "coinKey": "ETH",
        "name": "ETH",
        "logoURI": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
        "priceUSD": "2582.35"
      }
    }
    // ... more chain objects
  ]
}
```
```

--------------------------------

### POST /advanced/routes (Bitcoin to Ethereum)

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Requests a quote for a token swap from Bitcoin to Ethereum. Uses a JSON request body.

```APIDOC
## POST /advanced/routes

### Description
This endpoint is used to get a quote for a token swap from Bitcoin to Ethereum. It takes a JSON body with the necessary parameters.

### Method
POST

### Endpoint
/v1/advanced/routes

### Parameters
#### Request Body
- **toTokenAddress** (string) - Required - The receiving token address.
- **fromTokenAddress** (string) - Required - The sending token symbol.
- **fromChainId** (integer) - Required - The chain ID of the sending token.
- **fromAmount** (string) - Required - The amount to send.
- **toChainId** (integer) - Required - The chain ID of the receiving token.
- **fromAddress** (string) - Required - The sender's address.
- **toAddress** (string) - Required - The receiver's address.

### Request Example
```json
{
  "toTokenAddress": "0x0000000000000000000000000000000000000000",
  "fromTokenAddress": "bitcoin",
  "fromChainId": 20000000000001,
  "fromAmount": "10000000",
  "toChainId": 1,
  "fromAddress": "YOUR_BTC_WALLET",
  "toAddress": "YOUR_EVM_WALLET"
}
```

### Response
#### Success Response (200)
- **routes** (array) - Route details for the swap.

#### Response Example
```json
// Example response will vary
```
```

--------------------------------

### GET /v1/tokens?chains=SOL&chainTypes=SVM

Source: https://docs.li.fi/introduction/user-flows-and-examples/solana-tx-execution

Retrieves token information for a specific chain, in this case Solana (SOL).

```APIDOC
## GET /v1/tokens?chains=SOL&chainTypes=SVM

### Description
This endpoint retrieves a list of tokens available on the specified chain (SOL).

### Method
GET

### Endpoint
/v1/tokens?chains=SOL&chainTypes=SVM

### Parameters
#### Query Parameters
- **chains** (string) - Required - The chain ID (e.g., SOL).
- **chainTypes** (string) - Required - Specifies the chain type (SVM).

### Request Example
```bash
curl --request GET \
     --url 'https://li.quest/v1/tokens?chains=SOL&chainTypes=SVM' \
     --header 'accept: application/json'
```

### Response
#### Success Response (200)
- **tokens** (array) - An array of token objects.

#### Response Example
```json
{
  "tokens": [
    {
      "symbol": "BONK",
      "address": "...",
      "chainId": "SOL",
      ...
    }
  ]
}
```
```

--------------------------------

### POST /v1/advanced/routes

Source: https://docs.li.fi/introduction/user-flows-and-examples/solana-tx-execution

Retrieves advanced routing options for token swaps between chains, supporting EVM to Solana swaps.

```APIDOC
## POST /v1/advanced/routes

### Description
This endpoint provides advanced routing options for token swaps, allowing for more complex configurations and is able to handle EVM to Solana swaps.

### Method
POST

### Endpoint
/v1/advanced/routes

### Parameters
#### Request Body
- **fromChainId** (string) - Required - The source chain ID (e.g., ARB).
- **fromAmount** (string) - Required - The amount of the source token.
- **toChainId** (string) - Required - The destination chain ID (e.g., SOL).
- **fromTokenAddress** (string) - Required - The source token address.
- **toTokenAddress** (string) - Required - The destination token address.
- **fromAddress** (string) - Required - The sender's EVM wallet address.
- **toAddress** (string) - Required - The recipient's Solana wallet address.

### Request Example
```bash
curl --request POST \
     --url https://li.quest/v1/advanced/routes \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "fromChainId": "ARB",
  "fromAmount": "1000000000",
  "toChainId": "SOL",
  "fromTokenAddress": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  "toTokenAddress": "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
  "fromAddress": "YOUR_EVM_WALLET",
  "toAddress": "YOUR_SOL_WALLET"
}
'
```

### Response
#### Success Response (200)
- **routes** (array) - An array of route objects.

#### Response Example
```json
{
  "transactionRequest": {
    "data": "...",
  }
}
```
```

--------------------------------

### Fetch LLM Documentation File (HTTP Request)

Source: https://docs.li.fi/introduction/lifi-architecture/sui-overview

This instruction indicates how to retrieve the `llms.txt` file, which contains navigation and other documentation content. It is accessed via a direct HTTP GET request to the provided URL.

```http
GET https://docs.li.fi/llms.txt
```

--------------------------------

### Passing Timing Strategies in GET /v1/quote API Request

Source: https://docs.li.fi/guides/integration-tips/latency

Configure timing strategies directly within GET requests to the `/v1/quote` endpoint using query parameters. This method allows for the concise specification of `swapStepTimingStrategies` and `routeTimingStrategies`, enabling fine-grained control over API response times for single-route quotes.

```http
/v1/quote?...
  &swapStepTimingStrategies=minWaitTime-600-4-300
  &routeTimingStrategies=minWaitTime-1500-6-500
```

--------------------------------

### Request a Quote using LI.FI SDK

Source: https://docs.li.fi/sdk/installing-the-sdk

Request a quote for a cross-chain transaction using the LI.FI SDK. This involves specifying source and destination chains, tokens, amounts, and addresses.

```typescript
import { ChainId, getQuote } from '@lifi/sdk'

const quote = await getQuote({
  fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  fromChain: ChainId.ARB,
  toChain: ChainId.OPT,
  fromToken: '0x0000000000000000000000000000000000000000',
  toToken: '0x0000000000000000000000000000000000000000',
  fromAmount: '1000000000000000000',
})
```

```javascript
import { ChainId, getQuote } from '@lifi/sdk'

const quote = await getQuote({
  fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  fromChain: ChainId.ARB,
  toChain: ChainId.OPT,
  fromToken: '0x0000000000000000000000000000000000000000',
  toToken: '0x0000000000000000000000000000000000000000',
  fromAmount: '1000000000000000000',
})
```

--------------------------------

### Constructing Transaction Request for BTC to EVM Swaps

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

This JavaScript object demonstrates the structure of a transaction request for sending BTC to an EVM-compatible chain via LI.FI. It includes the recipient vault address, the data field containing swap details and memo, and the value in satoshis.

```javascript
"transactionRequest": {
    "to": "bc1qawcdxplxprc64fh38ryy4crndmfgwrffpac743", //thorswap vault to send BTC to
    "data": "=:ETH.USDC:0x29DaCdF7cCaDf4eE67c923b4C22255A4B2494eD7::lifi:0|0x4977d81c2a5d6bd8",
    "value": "500000"
  }
```

--------------------------------

### Set up Sui Client and Wallet Provider with @mysten/dapp-kit

Source: https://docs.li.fi/sdk/configure-sdk-providers

Provides the necessary React context for Sui client and wallet connections. It utilizes @mysten/dapp-kit to configure the Sui network and wallet provider, wrapping the application's children with these providers. The SDKProviders component is included to ensure Li.Fi's SDK is correctly configured for Sui.

```typescript
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { type FC, type PropsWithChildren } from 'react';
import { SDKProviders } from './SDKProviders.js';

const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl('mainnet') },
});

export const SuiBaseProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
      <WalletProvider autoConnect>
        {/* Configure Sui SDK provider */}
        <SDKProviders />
        {children}
      </WalletProvider>
    </SuiClientProvider>
  );
};
```

--------------------------------

### Example Transaction Data Structure

Source: https://docs.li.fi/api-reference/advanced/populate-a-step-with-transaction-data

This snippet details the structure of data associated with a transaction, including details about the bid, fees, and gas costs.

```APIDOC
## Transaction Data Structure

### Description
This endpoint provides the structure for transaction data, including bid details, fee breakdowns, and gas cost estimations.

### Method
N/A (This is a data structure description)

### Endpoint
N/A

### Parameters
#### Request Body Fields
- **type** (string) - Description of the transaction type.
- **amountReceived** (string) - The amount of tokens received after the transfer.
- **receivingAddress** (string) - The address where the tokens will be received.
- **transactionId** (string) - Unique identifier for the transaction.
- **expiry** (number) - The expiration time of the transaction.
- **callDataHash** (string) - Hash of the call data.
- **callTo** (string) - The target address for the call.
- **encryptedCallData** (string) - Encrypted call data.
- **sendingChainTxManagerAddress** (string) - The transaction manager address on the sending chain.
- **receivingChainTxManagerAddress** (string) - The transaction manager address on the receiving chain.
- **bidExpiry** (number) - The expiration time for the bid.
- **bidSignature** (string) - The signature for the bid.
- **gasFeeInReceivingToken** (string) - Gas fee in the receiving token.
- **totalFee** (string) - The total fee for the transaction.
- **metaTxRelayerFee** (string) - Fee for the meta-transaction relayer.
- **routerFee** (string) - Fee charged by the router.

#### Nested Structures
- **feeCosts** (array of objects)
  - **name** (string) - Name of the fee component.
  - **description** (string) - Description of the fee component.
  - **percentage** (string) - Percentage of the fee.
  - **token** (object) - Details of the token used for the fee.
    - **address** (string) - Token contract address.
    - **symbol** (string) - Token symbol.
    - **decimals** (number) - Token decimal places.
    - **chainId** (number) - Chain ID where the token exists.
    - **name** (string) - Token name.
    - **coinKey** (string) - Coin key for the token.
    - **priceUSD** (string) - Current price of the token in USD.
    - **logoURI** (string) - URI for the token logo.
  - **amount** (string) - Amount of the fee.
  - **amountUSD** (string) - Amount of the fee in USD.
  - **included** (boolean) - Whether the fee is included.
- **gasCosts** (array of objects)
  - **type** (string) - Type of gas cost (e.g., SEND).
  - **price** (string) - Price of gas.
  - **estimate** (string) - Estimated gas units.
  - **limit** (string) - Gas limit for the transaction.
  - **amount** (string) - Amount of gas used.
  - **amountUSD** (string) - Amount of gas cost in USD.
  - **token** (object) - Details of the token used for gas payment.
- **data** (object)
  - **bid** (object)
    - **user** (string) - The user's address initiating the transaction.
    - **router** (string) - The router's address.
    - **initiator** (string) - The initiator's address.
    - **sendingChainId** (number) - The ID of the sending chain.
    - **sendingAssetId** (string) - The asset ID on the sending chain.
    - **amount** (string) - The amount of assets to send.
    - **receivingChainId** (number) - The ID of the receiving chain.
    - **receivingAssetId** (string) - The asset ID on the receiving chain.
    - **amountReceived** (string) - The expected amount to be received.
    - **receivingAddress** (string) - The recipient's address.
    - **transactionId** (string) - The unique transaction identifier.
    - **expiry** (number) - Transaction expiration timestamp.
    - **callDataHash** (string) - Hash of the call data.
    - **callTo** (string) - Target contract address for the call.
    - **encryptedCallData** (string) - Encrypted call data.
    - **sendingChainTxManagerAddress** (string) - Transaction manager address on the sending chain.
    - **receivingChainTxManagerAddress** (string) - Transaction manager address on the receiving chain.
    - **bidExpiry** (number) - Bid expiration timestamp.
  - **gasFeeInReceivingToken** (string) - Gas fee in the receiving token.
  - **totalFee** (string) - Total transaction fee.
  - **metaTxRelayerFee** (string) - Relayer fee for meta-transactions.
  - **routerFee** (string) - Fee charged by the router.

### Request Example
```json
{
  "fromAmount": "1000000000000000000",
  "toAmount": "999500000000000000",
  "toAmountMin": "999500000000000000",
  "tool": "allbridge",
  "executionDuration": 60,
  "approvalAddress": "0x115909BDcbaB21954bEb4ab65FC2aBEE9866fa93",
  "feeCosts": [
    {
      "name": "Gas Fee",
      "description": "Covers gas expense for sending funds to user on receiving chain.",
      "percentage": "0",
      "token": {
        "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
        "symbol": "MIVA",
        "decimals": 18,
        "chainId": 100,
        "name": "Minerva Wallet SuperToken",
        "coinKey": "MIVA",
        "priceUSD": "0.0455272371751059",
        "logoURI": ""
      },
      "amount": "0",
      "amountUSD": "0.00",
      "included": true
    },
    {
      "name": "Relay Fee",
      "description": "Covers gas expense for claiming user funds on receiving chain.",
      "percentage": "0",
      "token": {
        "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
        "symbol": "MIVA",
        "decimals": 18,
        "chainId": 100,
        "name": "Minerva Wallet SuperToken",
        "coinKey": "MIVA",
        "priceUSD": "0.0455272371751059",
        "logoURI": ""
      },
      "amount": "0",
      "amountUSD": "0.00",
      "included": true
    },
    {
      "name": "Router Fee",
      "description": "Router service fee.",
      "percentage": "0.0005",
      "token": {
        "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
        "symbol": "MIVA",
        "decimals": 18,
        "chainId": 100,
        "name": "Minerva Wallet SuperToken",
        "coinKey": "MIVA",
        "priceUSD": "0.0455272371751059",
        "logoURI": ""
      },
      "amount": "500000000000000",
      "amountUSD": "22763618587552.95",
      "included": true
    }
  ],
  "gasCosts": [
    {
      "type": "SEND",
      "price": "1.22",
      "estimate": "140000",
      "limit": "175000",
      "amount": "170800",
      "amountUSD": "0.00",
      "token": {
        "address": "0x0000000000000000000000000000000000000000",
        "symbol": "xDai",
        "decimals": 18,
        "chainId": 100,
        "name": "xDai",
        "coinKey": "xDai",
        "priceUSD": "1",
        "logoURI": "https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png"
      }
    }
  ],
  "data": {
    "bid": {
      "user": "0x10fBFF9b9450D3A2d9d1612d6dE3726fACD8809E",
      "router": "0xeE2Ef40F688607CB23618d9312d62392786d13EB",
      "initiator": "0x10fBFF9b9450D3A2d9d1612d6dE3726fACD8809E",
      "sendingChainId": 100,
      "sendingAssetId": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
      "amount": "1000000000000000000",
      "receivingChainId": 137,
      "receivingAssetId": "0xc0b2983a17573660053beeed6fdb1053107cf387",
      "amountReceived": "999500000000000000",
      "receivingAddress": "0x10fBFF9b9450D3A2d9d1612d6dE3726fACD8809E",
      "transactionId": "0x9f54c1764e19367c44706f4a6253941b81e9ec524af5590091aa8ae67e7644ed",
      "expiry": 1643369368,
      "callDataHash": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
      "callTo": "0x0000000000000000000000000000000000000000",
      "encryptedCallData": "0x",
      "sendingChainTxManagerAddress": "0x115909BDcbaB21954bEb4ab65FC2aBEE9866fa93",
      "receivingChainTxManagerAddress": "0x6090De2EC76eb1Dc3B5d632734415c93c44Fd113",
      "bidExpiry": 1643110469
    },
    "gasFeeInReceivingToken": "0",
    "totalFee": "500000000000000",
    "metaTxRelayerFee": "0",
    "routerFee": "500000000000000"
  }
}
```
        }
      ]
    }
  ]
}
```
```

--------------------------------

### Update EVM Provider Configuration Dynamically

Source: https://docs.li.fi/sdk/configure-sdk-providers

Demonstrates how to dynamically update the initial configuration of the EVM provider using the `setOptions` function. This allows changing aspects like the wallet client for different chains.

```typescript
import { createConfig, EVM } from '@lifi/sdk'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrum, mainnet } from 'viem/chains'

const account = privateKeyToAccount('PRIVATE_KEY')

const mainnetClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
})

const evmProvider = EVM({
  getWalletClient: async () => mainnetClient,
})

createConfig({
  integrator: 'Your dApp/company name',
  providers: [evmProvider],
})

const optimismClient = createWalletClient({
  account,
  chain: arbitrum,
  transport: http(),
})

evmProvider.setOptions({
  getWalletClient: async () => optimismClient,
})
```

--------------------------------

### Get Available Connections

Source: https://docs.li.fi/integrate-li.fi-sdk/chains-and-tools

Gets all the available connections for swapping or bridging tokens. A connection represents a pair of tokens that can be exchanged.

```APIDOC
## GET /connections

### Description
Gets all the available connections for swapping or bridging tokens. A connection is a pair of two tokens (on the same chain or on different chains) that can be exchanged via our platform.

### Method
GET

### Endpoint
/connections

### Parameters
#### Query Parameters
- **connectionRequest** (ConnectionsRequest) - Required - Configuration of the connection request.
  - **fromChain** (number) - Optional - The source chain ID.
  - **fromToken** (string) - Optional - The source token address.
  - **toChain** (number) - Optional - The destination chain ID.
  - **toToken** (string) - Optional - The destination token address.
  - **allowBridges** (string[]) - Optional - Allowed bridges.
  - **denyBridges** (string[]) - Optional - Denied bridges.
  - **preferBridges** (string[]) - Optional - Preferred bridges.
  - **allowExchanges** (string[]) - Optional - Allowed exchanges.
  - **denyExchanges** (string[]) - Optional - Denied exchanges.
  - **preferExchanges** (string[]) - Optional - Preferred exchanges.
  - **allowSwitchChain** (boolean) - Optional - Whether connections that require chain switch are included. Default is true.
  - **allowDestinationCall** (boolean) - Optional - Whether connections that include destination calls are included. Default is true.
  - **chainTypes** (ChainType[]) - Optional - Types of chains to include.
- **options** (RequestOptions) - Optional - Request options.

### Response
#### Success Response (200)
- **connections** (Connection[]) - An array of `Connection` objects representing possible token exchanges.

### Request Example
```javascript
import { getConnections } from '@lifi/sdk';

const connectionRequest = {
  fromChain: 1,
  fromToken: '0x0000000000000000000000000000000000000000',
  toChain: 10,
  toToken: '0x0000000000000000000000000000000000000000',
};

try {
  const connections = await getConnections(connectionRequest);
  console.log('Connections:', connections);
} catch (error) {
  console.error('Error:', error);
}
```
```

--------------------------------

### Configure Wallet and Send Transaction with TypeScript and Ethers.js

Source: https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

This snippet demonstrates how to configure an Ethers.js wallet connected to the Gnosis Chain and then send a transaction. It first establishes a provider connection and creates a wallet instance from a mnemonic phrase. Subsequently, it sends the transaction using the `transactionRequest` object obtained from a quote, waiting for its confirmation.

```TypeScript
const provider = new ethers.providers.JsonRpcProvider('https://rpc.xdaichain.com/', 100);
const wallet = ethers.Wallet.fromMnemonic(YOUR_PERSONAL_MNEMONIC).connect(
    provider
);

const tx = await wallet.sendTransaction(quote.transactionRequest);
await tx.wait();
```

--------------------------------

### Get Available Connections

Source: https://docs.li.fi/more-integration-options/li.fi-api/requesting-supported-chains

Gets all available connections for swapping or bridging tokens between chains or within the same chain. Allows filtering by tokens, bridges, and exchange preferences.

```APIDOC
## GET /getConnections

### Description
Gets all the available connections for swapping or bridging tokens.

### Method
GET

### Endpoint
/getConnections

### Parameters
#### Query Parameters
- **connectionRequest** (ConnectionsRequest) - Configuration of the connection request.
  - **fromChain** (number, optional) - The source chain ID.
  - **fromToken** (string, optional) - The source token address.
  - **toChain** (number, optional) - The destination chain ID.
  - **toToken** (string, optional) - The destination token address.
  - **allowBridges** (string[], optional) - Allowed bridges.
  - **denyBridges** (string[], optional) - Denied bridges.
  - **preferBridges** (string[], optional) - Preferred bridges.
  - **allowExchanges** (string[], optional) - Allowed exchanges.
  - **denyExchanges** (string[], optional) - Denied exchanges.
  - **preferExchanges** (string[], optional) - Preferred exchanges.
  - **allowSwitchChain** (boolean, optional) - Whether connections that require chain switch are included. Default is true.
  - **allowDestinationCall** (boolean, optional) - Whether connections that include destination calls are included. Default is true.
  - **chainTypes** (ChainType[], optional) - Types of chains to include.
- **options** (RequestOptions, optional) - Request options.

### Response
#### Success Response (200)
- **connections** (Connection[]) - A list of available connections.

#### Response Example
```json
{
  "connections": [
    {
      "fromChainId": 1,
      "fromToken": {
        "address": "0x0000000000000000000000000000000000000000",
        "decimals": 18,
        "symbol": "ETH",
        "name": "Ether"
      },
      "toChainId": 10,
      "toToken": {
        "address": "0x0000000000000000000000000000000000000000",
        "decimals": 18,
        "symbol": "ETH",
        "name": "Ether"
      },
      "toolData": {
        "toolName": "hop",
        "layerZero": {
          "fromAmount": "1000000000000000000",
          "toAmount": "950000000000000000"
        }
      }
    }
  ]
}
```
```

--------------------------------

### Import Pre-configured Themes from @lifi/widget

Source: https://docs.li.fi/widget/customize-widget

This snippet shows how to import pre-configured themes provided by the `@lifi/widget` package. These themes offer a quick way to apply different styling presets to the widget, serving as a starting point for further customization.

```typescript
import { azureLightTheme, watermelonLightTheme, windows95Theme } from '@lifi/widget';
```

--------------------------------

### Get Quote for Bridging and Swapping Tokens (TypeScript)

Source: https://docs.li.fi/integrate-li.fi-sdk/request-routes-quotes

Requests a quote for bridging and swapping tokens using the `getQuote` function from the LIFI SDK. It requires specifying source and destination chains, tokens, amounts, and the sender's address. The response contains all necessary information for initiating the transaction.

```typescript
import { getQuote } from '@lifi/sdk';

const quoteRequest: QuoteRequest = {
  fromChain: 42161, // Arbitrum
  toChain: 10, // Optimism
  fromToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  toToken: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI on Optimism
  fromAmount: '10000000', // 10 USDC
  // The address from which the tokens are being transferred.
  fromAddress: '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0' 
};

const quote = await getQuote(quoteRequest);
```

--------------------------------

### Example Quote Submission for LI.FI Intents (JSON)

Source: https://docs.li.fi/lifi-intents/for-solvers/quoting

Provides a concrete JSON example of a quote submission for LI.FI Intents. This demonstrates how to specify quote details, including chain IDs, asset addresses, and pricing ranges for a USDC transfer from Optimism to Arbitrum.

```json
{
  "quotes": [{
    "expiry": 1757673110,
    "fromChainId": "10",
    "toChainId": "42161",
    "fromAsset": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "toAsset": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "fromDecimals": "6",
    "toDecimals": "6",
    "ranges": [
      {
        "minAmount": "10",
        "maxAmount": "100",
        "quote": "0.95"
      },
      {
        "minAmount": "100",
        "maxAmount": "10000",
        "quote": "0.995"
      },
      {
        "minAmount": "10000",
        "maxAmount": "50000",
        "quote": "0.99"
      }
    ]
  }]
}
```

--------------------------------

### Li.Fi Swap Step Timing Strategy Configuration

Source: https://docs.li.fi/api-reference/advanced/get-a-set-of-routes-for-a-request-that-describes-a-transfer-of-tokens

Defines timing strategies for swap steps, allowing configuration of minimum wait times, starting expected results, and reduction intervals for swap rate checks.

```json
{
  "timing": {
    "swapStepTimingStrategies": [
      {
        "strategy": "minWaitTime",
        "minWaitTimeMs": 5000,
        "startingExpectedResults": 10,
        "reduceEveryMs": 1000
      }
    ]
  }
}
```

--------------------------------

### Get Available Bridges and DEXs

Source: https://docs.li.fi/integrate-li.fi-sdk/chains-and-tools

Fetches the tools (bridges and DEXs) available on the LI.FI platform. This endpoint can be used to discover available swapping and bridging services.

```APIDOC
## GET /tools

### Description
Fetches the tools available for bridging and swapping tokens.

### Method
GET

### Endpoint
/tools

### Parameters
#### Query Parameters
- **chains** (Array<(ChainKey | ChainId)>) - Optional - List of chain IDs or keys to filter tools by.
- **options** (RequestOptions) - Optional - Additional request options.

### Response
#### Success Response (200)
- **bridges** (Bridge[]) - An array of available bridge objects.
- **exchanges** (Exchange[]) - An array of available exchange (DEX) objects.

### Request Example
```javascript
import { getTools } from '@lifi/sdk';

try {
  const tools = await getTools();
  console.log(tools);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### Get Available Chains

Source: https://docs.li.fi/integrate-li.fi-sdk/chains-and-tools

Fetches a list of all available chains supported by the LI.FI SDK. This endpoint allows filtering by chain types.

```APIDOC
## GET /chains

### Description
Fetches a list of all available chains supported by the SDK.

### Method
GET

### Endpoint
/chains

### Parameters
#### Query Parameters
- **chainTypes** (ChainType[]) - Optional - List of chain types to filter by.
- **options** (RequestOptions) - Optional - Additional request options.

### Response
#### Success Response (200)
- **chains** (ExtendedChain[]) - An array of `ExtendedChain` objects representing available chains.

### Request Example
```javascript
import { ChainType, getChains } from '@lifi/sdk';

try {
  const chains = await getChains({ chainTypes: [ChainType.EVM] });
  console.log(chains);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### GET /tokens

Source: https://docs.li.fi/api-reference/returns-all-possible-connections-based-on-a-from-or-tochain

Retrieves a list of available tokens across different chains, including their addresses, symbols, and prices.

```APIDOC
## GET /tokens

### Description
Retrieves a list of available tokens across different chains, including their addresses, symbols, and prices.

### Method
GET

### Endpoint
/tokens

### Parameters
#### Query Parameters
- **chainIds** (string) - Optional - Comma-separated list of chain IDs to filter tokens by.

### Response
#### Success Response (200)
- **tokens** (array) - An array of token objects.
  - **address** (string) - The contract address of the token.
  - **chainId** (integer) - The ID of the chain the token is on.
  - **decimals** (integer) - The number of decimal places for the token.
  - **symbol** (string) - The symbol of the token.
  - **name** (string) - The name of the token.
  - **logoURI** (string) - The URI of the token's logo.
  - **priceUSD** (string) - The current price of the token in USD.

#### Response Example
```json
{
  "tokens": [
    {
      "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      "chainId": 137,
      "decimals": 18,
      "symbol": "DAI",
      "name": "DAI",
      "logoURI": "https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png",
      "priceUSD": "1"
    },
    {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 10,
      "decimals": 18,
      "symbol": "ETH",
      "name": "ETH",
      "logoURI": "https://static.debank.com/image/op_token/logo_url/op/d61441782d4a08a7479d54aea211679e.png",
      "priceUSD": "2582.35"
    }
  ]
}
```
```

--------------------------------

### GET /v1/quote

Source: https://docs.li.fi/introduction/user-flows-and-examples/requesting-route-fetching-quote

Generates a quote for a cryptocurrency transaction based on the amount being sent. This method is useful when you know the exact amount you want to send and need to calculate how much the recipient will receive.

```APIDOC
## GET /v1/quote

### Description
Generates a quote for a cryptocurrency transaction based on the amount being sent. This method is useful when you know the exact amount you want to send and need to calculate how much the recipient will receive.

### Method
GET

### Endpoint
https://li.quest/v1/quote

### Parameters
#### Query Parameters
- **fromChain** (integer) - Required - The chain ID of the sending network.
- **toChain** (integer) - Required - The chain ID of the receiving network.
- **fromToken** (string) - Required - The token address or symbol on the sending chain.
- **toToken** (string) - Required - The token address or symbol on the receiving chain.
- **fromAmount** (string) - Required - The amount of the `fromToken` to send.
- **fromAddress** (string) - Required - The wallet address initiating the transaction.

### Request Example
```typescript
const getQuote = async (fromChain, toChain, fromToken, toToken, fromAmount, fromAddress) => {
    const result = await axios.get('https://li.quest/v1/quote', {
        params: {
            fromChain,
            toChain,
            fromToken,
            toToken,
            fromAmount,
            fromAddress,
        }
    });
    return result.data;
}

const fromChain = 42161; // Arbitrum
const fromToken = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // USDC on Arbitrum
const toChain = 10; // Optimism
const toToken = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'; // DAI on Optimism
const fromAmount = '1000000'; // 1 USDC
const fromAddress = 'YOUR_WALLET_ADDRESS';

const quote = await getQuote(fromChain, toChain, fromToken, toToken, fromAmount, fromAddress);
```

### Response
#### Success Response (200)
- **routes** (array) - An array of route objects containing information for potential transactions.

#### Response Example
```json
{
  "routes": [
    {
      "id": "route-1",
      "fromAmount": "1000000",
      "toAmount": "998000",
      "fees": [
        {
          "type": "LIFI",
          "amount": "1000",
          "token": {
            "address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            "symbol": "USDC",
            "chainId": 42161,
            "decimals": 6
          }
        }
      ],
      "duration": 120,
      "complianceLevel": "none",
      "performativeActions": [],
      "statisticId": "stat-1",
      "providerInfos": []
    }
  ]
}
```
```

--------------------------------

### Request Chains (UTXO)

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Fetches a list of chains that support UTXO transaction types. This is useful for identifying available Bitcoin-compatible networks. It requires no specific input parameters beyond the chain type.

```JS
curl --request GET \
     --url 'https://li.quest/v1/chains?chainTypes=UTXO' \
     --header 'accept: application/json'
```

--------------------------------

### Request Tools for a Specific Chain

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Retrieves a list of available tools for a given chain, identified by its ID. This helps in discovering supported functionalities on a particular blockchain.

```JS
curl --request GET \
  --url 'https://li.quest/v1/tools?chains=20000000000001' \
  --header 'accept: application/json'
```

--------------------------------

### Generate Quote using Li.Fi API (TypeScript)

Source: https://docs.li.fi/introduction/user-flows-and-examples/requesting-route-fetching-quote

This snippet shows how to generate a quote for a specific amount using the Li.Fi API's /quote endpoint. It's useful when you know the exact amount to send and need to determine the received amount. It utilizes axios for making the GET request.

```TypeScript
const getQuote = async (fromChain, toChain, fromToken, toToken, fromAmount, fromAddress) => {
    const result = await axios.get('https://li.quest/v1/quote', {
        params: {
            fromChain,
            toChain,
            fromToken,
            toToken,
            fromAmount,
            fromAddress,
        }
    });
    return result.data;
}

const fromChain = 42161;
const fromToken = 'USDC';
const toChain = 10;
const toToken = 'USDC';
const fromAmount = '1000000';
const fromAddress = YOUR_WALLET_ADDRESS;

const quote = await getQuote(fromChain, toChain, fromToken, toToken, fromAmount, fromAddress);
```

--------------------------------

### Configure Solana JSON-RPC Provider with LiFi SDK

Source: https://docs.li.fi/sdk/configure-sdk-providers

Shows how to configure the Solana provider for the LiFi SDK using React hooks and the `@solana/wallet-adapter` libraries. It dynamically sets the wallet adapter based on the connected wallet, suitable for React applications where global configuration is not standard. Dependencies include '@lifi/sdk', '@solana/wallet-adapter-base', and '@solana/wallet-adapter-react'.

```typescript
import { Solana, config, createConfig } from '@lifi/sdk';
import type { SignerWalletAdapter } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

createConfig({
  integrator: 'Your dApp/company name',
});

export const SDKProviders = () => {
  const { wallet } = useWallet();

  useEffect(() => {
    // Configure SDK Providers
    config.setProviders([
      Solana({
        async getWalletAdapter() {
          return wallet?.adapter as SignerWalletAdapter;
        },
      }),
    ]);
  }, [wallet?.adapter]);

  return null;
};
```

```typescript
import type { Adapter } from '@solana/wallet-adapter-base';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import { type FC, type PropsWithChildren } from 'react';
import { SDKProviders } from './SDKProviders.js';

const endpoint = clusterApiUrl(WalletAdapterNetwork.Mainnet);
/**
 * Wallets that implement either of these standards will be available automatically.
 *
 *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
 *     (https://github.com/solana-mobile/mobile-wallet-adapter)
 *   - Solana Wallet Standard
 *     (https://github.com/solana-labs/wallet-standard)
 *
 * If you wish to support a wallet that supports neither of those standards,
 * instantiate its legacy wallet adapter here. Common legacy adapters can be found
 * in the npm package `@solana/wallet-adapter-wallets`.
 */
const wallets: Adapter[] = [];

export const SVMBaseProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {/* Configure Solana SDK provider */}
        <SDKProviders />
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
```

--------------------------------

### Sending Transactions

Source: https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

Executes the transaction obtained from a quote. This involves connecting a wallet and sending the transaction request to the blockchain.

```APIDOC
## Sending Transactions

### Description
Executes the transaction obtained from a quote. This involves connecting a wallet and sending the transaction request to the blockchain.

### Method
N/A (Code example provided for illustrative purposes)

### Endpoint
N/A

### Parameters
N/A

### Request Example
```typescript
const tx = await wallet.sendTransaction(quote.transactionRequest);
await tx.wait();
```

### Response
N/A (This is a client-side function execution)

### Code Snippet
```typescript
// Provider and Wallet Setup Example (Connect to Gnosis Chain)
const provider = new ethers.providers.JsonRpcProvider('https://rpc.xdaichain.com/', 100);
const wallet = ethers.Wallet.fromMnemonic(YOUR_PERSONAL_MNEMONIC).connect(
    provider
);

// Sending the transaction
const tx = await wallet.sendTransaction(quote.transactionRequest);
await tx.wait();
```
```

--------------------------------

### Create Configuration

Source: https://docs.li.fi/integrate-li.fi-sdk/configure-sdk

Initializes the LI.FI SDK configuration with essential settings. This configuration is required for the SDK's core functionalities.

```APIDOC
## POST /createConfig

### Description
Initializes the LI.FI SDK with shared settings and data required for other SDK features. The configuration can be updated later.

### Method
POST

### Endpoint
/createConfig

### Parameters
#### Request Body
- **integrator** (string) - Required - LI.FI SDK requires an integrator option to identify partners and allows them to monitor their activity on the partner dashboard, such as the transaction volume, enabling better management and support. Usually, the integrator option is your dApp or company name. This string must consist only of letters, numbers, hyphens, underscores, and dots and be a maximum of 23 characters long.
- **apiKey** (string) - Optional - Unique API key for accessing LI.FI API services. Necessary for higher rate limits.
- **apiUrl** (string) - Optional - The base URL for the LI.FI API. Defaults to `https://li.quest/v1`. Can be changed to the staging environment.
- **userId** (string) - Optional - A unique identifier for the user of your application.
- **routeOptions** (object) - Optional - Custom options for routing, applied when using `getQuote`, `getRoutes`, and `getContractCallsQuote` endpoints.
- **rpcUrls** (object) - Optional - A mapping of chain IDs to arrays of RPC URLs used for transaction execution and data retrieval.
- **chains** (array) - Optional - An array of chains that the SDK will support. Each chain must be configured with necessary details.
- **preloadChains** (boolean) - Optional - A flag indicating whether to preload chain configurations. Defaults to `true`.
- **disableVersionCheck** (boolean) - Optional - A flag to disable version checking of the SDK. Defaults to `false`.
- **providers** (array) - Optional - An array of provider configurations used by the SDK for quote or route execution.

### Request Example
```json
{
  "integrator": "Your dApp/company name"
}
```

### Response
#### Success Response (200)
No specific response body is defined for success, indicates configuration was set.

#### Response Example
(No example provided in documentation)
```

--------------------------------

### Get Routes API

Source: https://docs.li.fi/integrate-li.fi-sdk/request-routes-quotes

The `getRoutes` function allows you to retrieve an array of possible routes for a token transfer between two chains. This includes information needed to decide on the best route, but transaction data must be requested separately.

```APIDOC
## GET /api/routes

### Description
Retrieves potential routes for cross-chain token transfers based on provided parameters.

### Method
GET

### Endpoint
/api/routes

### Parameters
#### Query Parameters
- **fromChainId** (number) - Required - The ID of the source chain (e.g., Ethereum mainnet is 1).
- **fromTokenAddress** (string) - Required - The contract address of the token on the source chain.
- **fromAmount** (string) - Required - The amount to be transferred from the source chain, specified in the smallest unit of the token.
- **fromAddress** (string) - Optional - The address from which the tokens are being transferred.
- **toChainId** (number) - Required - The ID of the destination chain (e.g., Optimism is 10).
- **toTokenAddress** (string) - Required - The contract address of the token on the destination chain.
- **toAddress** (string) - Optional - The address to which the tokens will be sent on the destination chain.
- **fromAmountForGas** (string) - Optional - Part of the LI.Fuel. Allows receiving a part of the bridged tokens as gas on the destination chain.
- **options** (object) - Optional - Additional options for customizing the route. See Route Options below.

### Request Example
```javascript
import { getRoutes } from '@lifi/sdk';

const routesRequest = {
  fromChainId: 42161, // Arbitrum
  toChainId: 10, // Optimism
  fromTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  toTokenAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI on Optimism
  fromAmount: '10000000', // 10 USDC
};

const result = await getRoutes(routesRequest);
const routes = result.routes;
```

### Response
#### Success Response (200)
- **routes** (array) - An array of route objects containing essential information for token transfers.

#### Response Example
```json
{
  "routes": [
    {
      "id": "route-1",
      "//": "... route details ..."
    }
  ]
}
```
```

--------------------------------

### Configure LI.FI SDK

Source: https://docs.li.fi/integrate-li.fi-js-sdk/install-li

Initializes the LI.FI SDK by creating a configuration with a unique integrator string. This configuration is essential before interacting with other SDK functions.

```typescript
import { createConfig } from '@lifi/sdk'

createConfig({
  integrator: 'Your dApp/company name',
})
```

--------------------------------

### Get Available Bridges and DEXs using Li.Fi SDK

Source: https://docs.li.fi/integrate-li.fi-sdk/chains-and-tools

Fetches the tools available for bridging and swapping tokens through the LI.FI SDK. This function accepts an optional configuration object to filter tools by specific chains. It returns a Promise that resolves to a ToolsResponse object containing information about bridges and DEXs.

```typescript
import { getTools } from '@lifi/sdk';

try {
  const tools = await getTools();
  console.log(tools);
} catch (error) {
  console.error(error);
}
```

--------------------------------

### Get Available Chains

Source: https://docs.li.fi/sdk/chains-tools

Fetches a list of all available chains supported by the LI.FI SDK. You can filter by chain types.

```APIDOC
## GET /chains

### Description
Fetches a list of all available chains supported by the SDK.

### Method
GET

### Endpoint
/chains

### Parameters
#### Query Parameters
- **chainTypes** (ChainType[], optional) - List of chain types to filter by.
- **options** (RequestOptions, optional) - Additional request options.

### Request Example
```javascript
import { getChains, ChainType } from '@lifi/sdk';

async function fetchChains() {
  try {
    const chains = await getChains({ chainTypes: [ChainType.EVM] });
    console.log(chains);
  } catch (error) {
    console.error(error);
  }
}

fetchChains();
```

### Response
#### Success Response (200)
- **chains** (ExtendedChain[]) - An array of extended chain objects.

#### Response Example
```json
[
  {
    "id": 1,
    "key": "eth",
    "name": "Ethereum",
    "logo": "https://li.quest/v1/logos/chains/eth.svg",
    "metamask": "https://metamask.github.io/metamask-mobile-app/assets/chain-icons/eth.png",
    "chainType": "evm",
    "mainnet": true,
    "rpcUrLs": ["https://cloudflare-eth.com"],
    "nativeToken": {
      "decimals": 18,
      "name": "Ether",
      "symbol": "ETH",
      "address": "0x0000000000000000000000000000000000000000",
      "logo": "https://li.quest/v1/logos/tokens/0x0000000000000000000000000000000000000000.svg"
    },
    "explorers": ["https://etherscan.io"]
  }
]
```
```

--------------------------------

### Fetch Routes using Li.Fi SDK (TypeScript)

Source: https://docs.li.fi/introduction/user-flows-and-examples/requesting-route-fetching-quote

This snippet demonstrates how to fetch multiple route options for a swap or bridge using the Li.Fi SDK. It requires chain and token details, and returns route objects without transaction data. For a single best option, consider using getQuote.

```TypeScript
import { getRoutes } from '@lifi/sdk';

const routesRequest = {
  fromChainId: 42161, // Arbitrum
  toChainId: 10, // Optimism
  fromTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  toTokenAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI on Optimism
  fromAmount: '10000000', // 10 USDC
};

const result = await getRoutes(routesRequest);
const routes = result.routes;
```

--------------------------------

### Configure Basic EVM Wallet Management with Wagmi for LI.FI Widget

Source: https://docs.li.fi/integrate-li.fi-widget/wallet-management

This snippet shows how to preconfigure a basic wallet management setup using Wagmi for the LI.FI widget. It defines the necessary Wagmi chains and connectors, then wraps the LiFiWidget component with WagmiProvider. Ensure the chains array in `createConfig` is kept in sync with the Widget's supported chains.

```typescript
import { LiFiWidget } from "@lifi/widget";
import { createClient } from "viem";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, arbitrum, optimism, scroll } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const wagmiConfig = createConfig({
  // Make sure to provide the full list of chains
  // you would like to support in the Widget
  // and keep them in sync, so all functionality
  // like switching chains can work correctly.
  chains: [mainnet, arbitrum, optimism, scroll],
  connectors: [injected()],
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
});

export const WidgetPage = () => {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <LiFiWidget integrator="wagmi-example" />
    </WagmiProvider>
  );
};

```

--------------------------------

### Dynamically Update EVM Provider Configuration

Source: https://docs.li.fi/integrate-li.fi-sdk/configure-sdk-providers

Demonstrates how to dynamically update the initial configuration of the EVM provider using the `setOptions` function. This allows changing aspects like the `getWalletClient` function after the initial setup. Dependencies include `@lifi/sdk` and `viem`.

```typescript
import { createConfig, EVM } from '@lifi/sdk'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrum, mainnet } from 'viem/chains'

const account = privateKeyToAccount('PRIVATE_KEY')

const mainnetClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
})

const evmProvider = EVM({
  getWalletClient: async () => mainnetClient,
})

createConfig({
  integrator: 'Your dApp/company name',
  providers: [evmProvider],
})

const optimismClient = createWalletClient({
  account,
  chain: arbitrum,
  transport: http(),
})

evmProvider.setOptions({
  getWalletClient: async () => optimismClient,
})

```

--------------------------------

### Get Available Bridges and DEXs

Source: https://docs.li.fi/more-integration-options/li.fi-api/requesting-supported-chains

Fetches the tools available for bridging and swapping tokens. You can filter by specific chains.

```APIDOC
## GET /getTools

### Description
Fetches the tools available for bridging and swapping tokens.

### Method
GET

### Endpoint
/getTools

### Parameters
#### Query Parameters
- **params** (ToolsRequest, optional) - Configuration for the requested tools.
  - **chains** (ChainKey | ChainId[], optional) - List of chain IDs or keys.
- **options** (RequestOptions, optional) - Additional request options.

### Response
#### Success Response (200)
- **bridges** (Bridge[]) - A list of available bridges.
- **exchanges** (Exchange[]) - A list of available DEXs.

#### Response Example
```json
{
  "bridges": [
    {
      "key": "hop",
      "name": "Hop",
      "logo": "https://li.quest/v1/tools/hop.svg",
      "provider`": "hop.exchange",
      "type": "bridge"
    }
  ],
  "exchanges": [
    {
      "key": "uniswap_v3",
      "name": "Uniswap V3",
      "logo": "https://li.quest/v1/tools/uniswap_v3.svg",
      "provider": "uniswap.org",
      "type": "DEX"
    }
  ]
}
```
```

--------------------------------

### Get Available EVM Chains using Li.Fi SDK

Source: https://docs.li.fi/integrate-li.fi-sdk/chains-and-tools

Fetches a list of all available EVM chains supported by the LI.FI SDK. This function takes an optional configuration object for filtering chains by type. It returns a Promise that resolves to an array of ExtendedChain objects.

```typescript
import { ChainType, getChains } from '@lifi/sdk';

try {
  const chains = await getChains({ chainTypes: [ChainType.EVM] });
  console.log(chains);
} catch (error) {
  console.error(error);
}
```

--------------------------------

### Request Quote for Contract Calls (JavaScript)

Source: https://docs.li.fi/integrate-li.fi-sdk/request-routes-quotes

This snippet shows how to use the `getContractCallsQuote` function from the LI.FI SDK to get a quote for a transaction involving a contract call. It requires specifying source and destination chain and token details, along with the contract call parameters like the target contract address, call data, and gas limit. The function returns a quote object containing all necessary information for the transaction.

```javascript
import { getContractCallsQuote } from '@lifi/sdk';

const contractCallsQuoteRequest = {
  fromAddress: '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0',
  fromChain: 10,
  fromToken: '0x0000000000000000000000000000000000000000',
  toAmount: '8500000000000',
  toChain: 8453,
  toToken: '0x0000000000000000000000000000000000000000',
  contractCalls: [
    {
      fromAmount: '8500000000000',
      fromTokenAddress: '0x0000000000000000000000000000000000000000',
      toContractAddress: '0x0000000000000068F116a894984e2DB1123eB395',
      toContractCallData:
        '0xe7acab24000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000006e000000000000000000000000000000000000000000000000000000000000000000000000000000000029dacdf7ccadf4ee67c923b4c22255a4b2494ed700000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000520000000000000000000000000000000000000000000000000000000000000064000000000000000000000000090884b5bd9f774ed96f941be2fb95d56a029c99c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001220000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
```

--------------------------------

### Optimizing Response Timing: Endpoint Choice

Source: https://docs.li.fi/guides/integration-tips/latency

Understand the difference between the /quote and /advanced/routes endpoints for managing response times.

```APIDOC
## Choosing Between `/quote` and `/advanced/routes`

### Description

- Use `/quote` for faster responses as it returns a single best route and combines route finding and transaction generation into one call, reducing client-to-server latency.
- Use `/advanced/routes` to retrieve multiple route options. These calls are fast for displaying results quickly, but require a subsequent call to `/stepTransaction` to generate transaction data for execution.

### Method

GET

### Endpoint

`/v1/quote` or `/v1/advanced/routes`
```

--------------------------------

### GET /websites/li_fi

Source: https://docs.li.fi/api-reference/advanced/populate-a-step-with-transaction-data

Retrieves detailed information about a specific step within a financial route. This includes actions, estimates, and transaction details.

```APIDOC
## GET /websites/li_fi

### Description
Retrieves detailed information about a specific step within a financial route. This includes actions, estimates, and transaction details.

### Method
GET

### Endpoint
/websites/li_fi

### Parameters
#### Query Parameters
- **fromChainId** (integer) - Required - The ID of the source chain.
- **toChainId** (integer) - Required - The ID of the destination chain.
- **fromTokenAddress** (string) - Required - The contract address of the token to send.
- **toTokenAddress** (string) - Required - The contract address of the token to receive.
- **fromAmount** (string) - Required - The amount of the source token to send.
- **fromAddress** (string) - Optional - The address of the sender.
- **toAddress** (string) - Optional - The address of the recipient.
- **options** (object) - Optional - Additional options for the route.

### Request Example
```json
{
  "fromChainId": 100,
  "toChainId": 100,
  "fromTokenAddress": "0x0000000000000000000000000000000000000000",
  "toTokenAddress": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
  "fromAmount": "1000000000000000000",
  "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
  "toAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
}
```

### Response
#### Success Response (200)
- **id** (string) - The unique identifier for the step.
- **type** (string) - The type of the step (e.g., 'lifi').
- **tool** (string) - The tool used for this step (e.g., '1inch').
- **toolDetails** (object) - Details about the tool used.
  - **key** (string) - The key identifier for the tool.
  - **logoURI** (string) - The URI for the tool's logo.
  - **name** (string) - The name of the tool.
- **action** (object) - Details about the action to be performed.
  - **fromChainId** (integer) - The source chain ID.
  - **toChainId** (integer) - The destination chain ID.
  - **fromToken** (object) - Details of the token to be sent.
  - **toToken** (object) - Details of the token to be received.
  - **fromAmount** (string) - The amount of the source token.
  - **slippage** (number) - The allowed slippage percentage.
  - **fromAddress** (string) - The sender's address.
  - **toAddress** (string) - The recipient's address.
- **estimate** (object) - Estimated details for the step.
  - **fromAmount** (string) - The estimated amount of the source token.
  - **toAmount** (string) - The estimated amount of the destination token.
  - **toAmountMin** (string) - The minimum expected amount of the destination token.
  - **approvalAddress** (string) - The address for token approval, if required.
  - **feeCosts** (array) - An array of objects detailing fee costs.
  - **gasCosts** (array) - An array of objects detailing gas costs.
    - **type** (string) - The type of gas cost (e.g., 'SEND').
    - **price** (string) - The gas price.
    - **estimate** (string) - The estimated gas limit.
    - **limit** (string) - The gas limit.
    - **amount** (string) - The gas amount.
    - **amountUSD** (string) - The gas amount in USD.
    - **token** (object) - Details of the token used for gas fees.
- **data** (object) - Additional data related to the transaction.

#### Response Example
```json
{
  "id": "a8dc011a-f52d-4492-9e99-21de64b5453a",
  "type": "lifi",
  "tool": "1inch",
  "toolDetails": {
    "key": "1inch",
    "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/oneinch.svg",
    "name": "1inch"
  },
  "action": {
    "fromChainId": 100,
    "toChainId": 100,
    "fromToken": {
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "xDai",
      "decimals": 18,
      "chainId": 100,
      "name": "xDai",
      "coinKey": "xDai",
      "priceUSD": "1",
      "logoURI": "https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png"
    },
    "toToken": {
      "name": "Minerva Wallet SuperToken",
      "symbol": "MIVA",
      "coinKey": "MIVA",
      "decimals": 18,
      "chainId": 100,
      "logoURI": "https://minerva.digital/i/MIVA-Token_200x200.png",
      "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51"
    },
    "fromAmount": "1000000000000000000",
    "slippage": 0.003,
    "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
    "toAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
  },
  "estimate": {
    "fromAmount": "1000000000000000000",
    "toAmount": "21922914496086353975",
    "toAmountMin": "21265227061203763356",
    "approvalAddress": "0x1111111254fb6c44bac0bed2854e76f90643097d",
    "feeCosts": [],
    "gasCosts": [
      {
        "type": "SEND",
        "price": "1",
        "estimate": "252364",
        "limit": "315455",
        "amount": "252364",
        "amountUSD": "0.00",
        "token": {
          "address": "0x0000000000000000000000000000000000000000",
          "symbol": "xDai",
          "decimals": 18,
          "chainId": 100,
          "name": "xDai",
          "coinKey": "xDai",
          "priceUSD": "1",
          "logoURI": "https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png"
        }
      }
    ],
    "data": {
      "fromToken": {
        "name": "xDAI",
        "address": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "symbol": "xDAI",
        "decimals": 18,
        "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png"
      },
      "toToken": {
        "name": "Minerva Wallet SuperToken",
        "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
        "symbol": "MIVA",
        "decimals": 18
      }
    }
  }
}
```
```

--------------------------------

### Get Available Chains

Source: https://docs.li.fi/more-integration-options/li.fi-api/requesting-supported-chains

Fetches a list of all available chains supported by the SDK. This endpoint can be filtered by chain types.

```APIDOC
## GET /getChains

### Description
Fetches a list of all available chains supported by the SDK.

### Method
GET

### Endpoint
/getChains

### Parameters
#### Query Parameters
- **params** (ChainsRequest, optional) - Configuration for the requested chains.
  - **chainTypes** (ChainType[], optional) - List of chain types.
- **options** (RequestOptions, optional) - Additional request options.

### Response
#### Success Response (200)
- **chains** (ExtendedChain[]) - An array of `ExtendedChain` objects.

#### Response Example
```json
{
  "chains": [
    {
      "id": 1,
      "name": "Ethereum",
      "type": "EVM",
      "logo": "https://li.quest/v1/chains/1.svg",
      "symbol": "ETH",
      "decimals": 18,
      "chainId": 1,
      "chainNamespace": "evm",
      "metamask": {
        "chainName": "Ethereum Mainnet",
        "rpcUrls": ["https://mainnet.infura.io/v3/${INFURA_KEY}"],
        "nativeCurrency": {
          "name": "Ethereum",
          "symbol": "ETH",
          "decimals": 18
        },
        "blockExplorerUrls": ["https://etherscan.io"]
      },
      "explorers": ["https://etherscan.io"]
    }
  ]
}
```
```

--------------------------------

### GET /bridges

Source: https://docs.li.fi/api-reference/returns-all-possible-connections-based-on-a-from-or-tochain

Retrieves a list of available bridges and their supported token routes between different chains.

```APIDOC
## GET /bridges

### Description
Retrieves a list of available bridges and their supported token routes between different chains.

### Method
GET

### Endpoint
/bridges

### Parameters
#### Query Parameters
- **fromChainId** (integer) - Optional - The ID of the source chain.
- **toChainId** (integer) - Optional - The ID of the destination chain.

### Response
#### Success Response (200)
- **bridges** (array) - An array of bridge objects.
  - **fromChainId** (integer) - The ID of the source chain.
  - **toChainId** (integer) - The ID of the destination chain.
  - **fromTokens** (array) - An array of token objects supported for bridging from the source chain.
    - **address** (string) - The contract address of the token.
    - **chainId** (integer) - The ID of the chain the token is on.
    - **decimals** (integer) - The number of decimal places for the token.
    - **symbol** (string) - The symbol of the token.
    - **name** (string) - The name of the token.
    - **logoURI** (string) - The URI of the token's logo.
    - **priceUSD** (string) - The current price of the token in USD.
  - **toTokens** (array) - An array of token objects supported for bridging to the destination chain.
    - **address** (string) - The contract address of the token.
    - **chainId** (integer) - The ID of the chain the token is on.
    - **decimals** (integer) - The number of decimal places for the token.
    - **symbol** (string) - The symbol of the token.
    - **name** (string) - The name of the token.
    - **logoURI** (string) - The URI of the token's logo.
    - **priceUSD** (string) - The current price of the token in USD.

#### Response Example
```json
{
  "bridges": [
    {
      "fromChainId": 10,
      "toChainId": 56,
      "fromTokens": [
        {
          "address": "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
          "decimals": 18,
          "symbol": "DAI",
          "chainId": 10,
          "coinKey": "DAI",
          "name": "DAI",
          "logoURI": "https://static.debank.com/image/op_token/logo_url/0xda10009cbd5d07dd0cecc66161fc93d7c9000da1/45965130df45ecf234ff03ce28299cd1.png",
          "priceUSD": "1"
        }
      ],
      "toTokens": [
        {
          "address": "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
          "decimals": 18,
          "symbol": "DAI",
          "chainId": 56,
          "coinKey": "DAI",
          "name": "DAI",
          "logoURI": "https://static.debank.com/image/bsc_token/logo_url/0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3/549c4205dbb199f1b8b03af783f35e71.png",
          "priceUSD": "1"
        }
      ]
    }
  ]
}
```
```

--------------------------------

### Request Tokens for Bitcoin

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Fetches a list of tokens available on the Bitcoin chain. This is essential for identifying the native token or other supported tokens on the network.

```JS
curl --request GET \
     --url 'https://li.quest/v1/tokens?chains=BTC' \
     --header 'accept: application/json'
```

--------------------------------

### GET /websites/li_fi

Source: https://docs.li.fi/api-reference/advanced/get-a-set-of-routes-for-a-request-that-describes-a-transfer-of-tokens

Retrieves detailed information about gas costs and transaction data for fund transfers.

```APIDOC
## GET /websites/li_fi

### Description
This endpoint provides detailed information about gas costs, fees, and transaction data associated with sending funds. It includes details on various fees like sending, relay, and router fees, as well as gas costs on the receiving chain.

### Method
GET

### Endpoint
/websites/li_fi

### Parameters
This endpoint does not have any explicit path or query parameters documented in the provided text. All relevant information is expected within the response body.

### Request Example
(No request example available for this GET endpoint)

### Response
#### Success Response (200)
- **fees** (array) - An array of fee objects, each detailing:
  - **name** (string) - The name of the fee (e.g., 'Gas Expense', 'Relay Fee', 'Router Fee').
  - **description** (string) - A description of what the fee covers.
  - **percentage** (string) - The percentage of the fee.
  - **token** (object) - Details of the token used for the fee:
    - **name** (string) - The name of the token.
    - **symbol** (string) - The symbol of the token.
    - **coinKey** (string) - The coin key of the token.
    - **decimals** (integer) - The number of decimals for the token.
    - **chainId** (integer) - The chain ID where the token is located.
    - **logoURI** (string) - The URI for the token's logo.
    - **address** (string) - The contract address of the token.
  - **amount** (string) - The amount of the token used for the fee.
  - **amountUSD** (string) - The equivalent amount in USD.
  - **included** (boolean) - Whether the fee is included.
- **gasCosts** (array) - An array of gas cost objects, each detailing:
  - **type** (string) - The type of gas cost (e.g., 'SEND').
  - **price** (string) - The gas price.
  - **estimate** (string) - The estimated gas units.
  - **limit** (string) - The gas limit.
  - **amount** (string) - The total gas amount.
  - **amountUSD** (string) - The equivalent amount in USD.
  - **token** (object) - Details of the token used for gas:
    - **address** (string) - The contract address of the token.
    - **symbol** (string) - The symbol of the token.
    - **decimals** (integer) - The number of decimals for the token.
    - **chainId** (integer) - The chain ID where the token is located.
    - **name** (string) - The name of the token.
    - **coinKey** (string) - The coin key of the token.
    - **priceUSD** (string) - The price of the token in USD.
    - **logoURI** (string) - The URI for the token's logo.
- **data** (object) - Contains transaction-specific data:
  - **bid** (object) - Details of the bid for the transaction:
    - **user** (string) - The user initiating the bid.
    - **router** (string) - The router address.
    - **initiator** (string) - The initiator of the transaction.
    - **sendingChainId** (integer) - The chain ID of the sending chain.
    - **sendingAssetId** (string) - The asset ID on the sending chain.
    - **amount** (string) - The amount to be sent.
    - **receivingChainId** (integer) - The chain ID of the receiving chain.
    - **receivingAssetId** (string) - The asset ID on the receiving chain.
    - **amountReceived** (string) - The amount expected to be received.
    - **receivingAddress** (string) - The address on the receiving chain.
    - **transactionId** (string) - The transaction ID.
    - **expiry** (integer) - The expiry timestamp of the bid.
    - **callDataHash** (string) - The hash of the call data.
    - **callTo** (string) - The contract address to call.
    - **encryptedCallData** (string) - Encrypted call data.
    - **sendingChainTxManagerAddress** (string) - The transaction manager address on the sending chain.
    - **receivingChainTxManagerAddress** (string) - The transaction manager address on the receiving chain.
    - **bidExpiry** (integer) - The expiry timestamp of the bid.
- **gasFeeInReceivingToken** (string) - The gas fee in the receiving token.
- **totalFee** (string) - The total fee for the transaction.
- **metaTxRelayerFee** (string) - The relayer fee for meta-transactions.

#### Response Example
```json
{
  "fees": [
    {
      "name": "Gas Expense",
      "description": "Covers gas expense for sending funds to user on receiving chain.",
      "percentage": "0",
      "token": {
        "name": "Own a fraction",
        "symbol": "FRACTION",
        "coinKey": "FRACTION",
        "decimals": 18,
        "chainId": 100,
        "logoURI": "https://assets.coingecko.com/coins/images/15099/large/fraction.png?1619691519",
        "address": "0x2bf2ba13735160624a0feae98f6ac8f70885ea61"
      },
      "amount": "0",
      "amountUSD": "0.00",
      "included": true
    },
    {
      "name": "Relay Fee",
      "description": "Covers gas expense for claiming user funds on receiving chain.",
      "percentage": "0",
      "token": {
        "name": "Own a fraction",
        "symbol": "FRACTION",
        "coinKey": "FRACTION",
        "decimals": 18,
        "chainId": 100,
        "logoURI": "https://assets.coingecko.com/coins/images/15099/large/fraction.png?1619691519",
        "address": "0x2bf2ba13735160624a0feae98f6ac8f70885ea61"
      },
      "amount": "0",
      "amountUSD": "0.00",
      "included": true
    },
    {
      "name": "Router Fee",
      "description": "Router service fee.",
      "percentage": "0.00050000000105749733",
      "token": {
        "name": "Own a fraction",
        "symbol": "FRACTION",
        "coinKey": "FRACTION",
        "decimals": 18,
        "chainId": 100,
        "logoURI": "https://assets.coingecko.com/coins/images/15099/large/fraction.png?1619691519",
        "address": "0x2bf2ba13735160624a0feae98f6ac8f70885ea61"
      },
      "amount": "392435979",
      "amountUSD": "0.00",
      "included": true
    }
  ],
  "gasCosts": [
    {
      "type": "SEND",
      "price": "1.26",
      "estimate": "140000",
      "limit": "175000",
      "amount": "176400",
      "amountUSD": "0.00",
      "token": {
        "address": "0x0000000000000000000000000000000000000000",
        "symbol": "xDai",
        "decimals": 18,
        "chainId": 100,
        "name": "xDai",
        "coinKey": "xDai",
        "priceUSD": "1",
        "logoURI": "https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png"
      }
    }
  ],
  "data": {
    "bid": {
      "user": "0x53F68B2186E4a4aB4dD976eD32de68db45BA360b",
      "router": "0xeE2Ef40F688607CB23618d9312d62392786d13EB",
      "initiator": "0x53F68B2186E4a4aB4dD976eD32de68db45BA360b",
      "sendingChainId": 100,
      "sendingAssetId": "0x2bf2ba13735160624a0feae98f6ac8f70885ea61",
      "amount": "784871956340",
      "receivingChainId": 137,
      "receivingAssetId": "0xbd80cfa9d93a87d1bb895f810ea348e496611cd4",
      "amountReceived": "784479520361",
      "receivingAddress": "0x10fBFF9b9450D3A2d9d1612d6dE3726fACD8809E",
      "transactionId": "0x85e93238e8f2f83dd5840eb748c7b9099d69e1ea227a13e7a2e949cf6a32ab7d",
      "expiry": 1643364189,
      "callDataHash": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
      "callTo": "0x0000000000000000000000000000000000000000",
      "encryptedCallData": "0x",
      "sendingChainTxManagerAddress": "0x115909BDcbaB21954bEb4ab65FC2aBEE9866fa93",
      "receivingChainTxManagerAddress": "0x6090De2EC76eb1Dc3B5d632734415c93c44Fd113",
      "bidExpiry": 1643105290
    },
    "gasFeeInReceivingToken": "0",
    "totalFee": "392435979",
    "metaTxRelayerFee": "0"
  }
}
```
```

--------------------------------

### Dynamically Sync Wagmi Chains with Li.Fi Widget

Source: https://docs.li.fi/widget/wallet-management

This example shows how to dynamically update Wagmi configurations to match all available LI.FI chains using the `useSyncWagmiConfig` hook from `@lifi/wallet-management` and `useAvailableChains` from `@lifi/widget`. This ensures chain synchronization for features like chain switching.

```typescript
import { useSyncWagmiConfig } from '@lifi/wallet-management';
import { useAvailableChains } from '@lifi/widget';
import { injected } from '@wagmi/connectors';
import { useRef, type FC, type PropsWithChildren } from 'react';
import { createClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import type { Config } from 'wagmi';
import { createConfig, WagmiProvider } from 'wagmi';

const connectors = [injected()];

export const WalletProvider: FC<PropsWithChildren> = ({ children }) => {
  const { chains } = useAvailableChains();
  const wagmi = useRef<Config>();

  if (!wagmi.current) {
    wagmi.current = createConfig({
      chains: [mainnet],
      client({ chain }) {
        return createClient({ chain, transport: http() });
      },
      ssr: true,
    });
  }

  useSyncWagmiConfig(wagmi.current, connectors, chains);

  return (

  <WagmiProvider config={wagmi.current} reconnectOnMount={false}>
    {children}
  </WagmiProvider>
  );
 };

```

```typescript
import { LiFiWidget } from '@lifi/widget';
import { WalletProvider } from '../providers/WalletProvider';

export const WidgetPage = () => {
  return (
    <WalletProvider>
      <LiFiWidget integrator="wagmi-example" />
    </WalletProvider>
  );
};

```

--------------------------------

### LiFi Route Example (JSON)

Source: https://docs.li.fi/api-reference/advanced/get-a-set-of-routes-for-a-request-that-describes-a-transfer-of-tokens

This JSON object represents a complete cross-chain route with initiator, asset details, chain IDs, amounts, transaction identifiers, and fee information. It includes details about the integrator and various transaction management addresses.

```json
{
  "initiator": "0x53F68B2186E4a4aB4dD976eD32de68db45BA360b",
  "sendingChainId": 100,
  "sendingAssetId": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
  "amount": "1000000000000000000",
  "receivingChainId": 137,
  "receivingAssetId": "0xc0b2983a17573660053beeed6fdb1053107cf387",
  "amountReceived": "999500000000000000",
  "receivingAddress": "0x10fBFF9b9450D3A2d9d1612d6dE3726fACD8809E",
  "transactionId": "0x48f0a2f93b0d0a9dab992d07c46bca38516c945101e8f8e08ca42af05b9e6aa9",
  "expiry": 1643364189,
  "callDataHash": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
  "callTo": "0x0000000000000000000000000000000000000000",
  "encryptedCallData": "0x",
  "sendingChainTxManagerAddress": "0x115909BDcbaB21954bEb4ab65FC2aBEE9866fa93",
  "receivingChainTxManagerAddress": "0x6090De2EC76eb1Dc3B5d632734415c93c44Fd113",
  "bidExpiry": 1643105290,
  "gasFeeInReceivingToken": "0",
  "totalFee": "500000000000000",
  "metaTxRelayerFee": "0",
  "routerFee": "500000000000000",
  "integrator": "fee-demo"
}
```

--------------------------------

### Get Quote for Token Transfer (Composer Integration)

Source: https://docs.li.fi/introduction/user-flows-and-examples/lifi-composer

This endpoint can be used to get a quote for a token transfer, which is a prerequisite for executing Composer workflows. Vault token addresses need to be inputted into this endpoint.

```APIDOC
## GET /quote

### Description
Retrieves a quote for a token transfer, essential for initiating Composer operations. Ensure vault token addresses are correctly provided.

### Method
GET

### Endpoint
/v1/quote

### Parameters
#### Query Parameters
- **fromChain** (number) - Required - The chain ID of the originating chain.
- **toChain** (number) - Required - The chain ID of the destination chain.
- **fromToken** (string) - Required - The address of the token to transfer from.
- **toToken** (string) - Required - The address of the token to transfer to (e.g., a vault token).
- **fromAddress** (string) - Required - The user's wallet address on the originating chain.
- **toAddress** (string) - Required - The user's wallet address on the destination chain.
- **fromAmount** (string) - Required - The amount of the `fromToken` to transfer, considering its decimals.

### Request Example
```bash
curl -X GET 'https://li.quest/v1/quote?fromChain=8453&toChain=8453&fromToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&toToken=0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A&fromAddress=0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE&toAddress=0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE&fromAmount=1000000'
```

### Response
#### Success Response (200)
- **quote** (object) - Contains details about the token transfer quote.
  - **estimatedGas** (number) - Estimated gas cost.
  - **toAmount** (string) - The amount of the `toToken` expected.
  - **actions** (array) - Steps involved in the quote.

#### Response Example
```json
{
  "quote": {
    "estimatedGas": 12345,
    "toAmount": "998000",
    "actions": [
      {
        "description": "Swap USDC to Vault Token"
      }
    ]
  }
}
```
```

--------------------------------

### Get Token Balances

Source: https://docs.li.fi/integrate-li.fi-sdk/token-management

Returns the balances for a list of tokens held by a wallet. Requires EVM/Solana providers to be configured.

```APIDOC
## GET /balances/:walletAddress/:tokens

### Description
Returns the balances for a list of tokens a wallet holds. Ensure EVM/Solana providers are configured.

### Method
GET

### Endpoint
/balances/:walletAddress/:tokens

### Parameters
#### Path Parameters
- **walletAddress** (string) - Required - The wallet address to check.
- **tokens** (Token[]) - Required - A list of Token objects.

### Response
#### Success Response (200)
- **tokenAmounts** (TokenAmount[]) - A list of TokenAmount objects representing the balances.

### Request Example
```javascript
import { ChainId, getTokenBalances, getTokens } from '@lifi/sdk';

const walletAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';

try {
  const tokensResponse = await getTokens();
  const optimismTokens = tokensResponse.tokens[ChainId.OPT];
  const tokenBalances = await getTokenBalances(walletAddress, optimismTokens);
  console.log(tokenBalances);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### Configure UTXO (Bitcoin) JSON-RPC Wallet Provider (React)

Source: https://docs.li.fi/integrate-li.fi-sdk/configure-sdk-providers

Illustrates the configuration of the UTXO provider for Bitcoin using the Bigmi library. This example shows how to obtain a Bigmi Client object via the `getConnectorClient` action and pass it to the SDK's `UTXO` provider, enabling interaction with user wallets like Phantom and Xverse within a React environment.

```typescript
import { createConfig, UTXO } from '@lifi/sdk'
import { getConnectorClient } from '@bigmi/client' 
import { useConfig } from '@bigmi/react'


const config = createConfig({
  integrator: 'Your dApp/company name',
})

export const SDKProviders = () => {
  const bigmiConfig = useConfig();

  useEffect(() => {
    // Configure SDK Provider
    config.setProviders([
      UTXO({
        async getWalletClient() {
          return getConnectorClient(bigmiConfig)
        },
      }),
    ]);
  }, [bigmiConfig]);

  return null;
};
```

--------------------------------

### Request Quote or Routes with TypeScript

Source: https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

This snippet demonstrates how to request a quote for a token swap between two chains using the Li.Fi SDK. It requires chain IDs, token symbols, amounts, and the user's address. It utilizes the axios library for making HTTP requests to the Li.quest API.

```TypeScript
const getQuote = async (fromChain, toChain, fromToken, toToken, fromAmount, fromAddress) => {
    const result = await axios.get('https://li.quest/v1/quote', {
        params: {
            fromChain,
            toChain,
            fromToken,
            toToken,
            fromAmount,
            fromAddress,
        }
    });
    return result.data;
}

const fromChain = 42161;
const fromToken = 'USDC';
const toChain = 100;
const toToken = 'USDC';
const fromAmount = '1000000';
const fromAddress = YOUR_WALLET_ADDRESS;

const quote = await getQuote(fromChain, toChain, fromToken, toToken, fromAmount, fromAddress);
```

--------------------------------

### Execute Route Steps Sequentially with LiFi SDK

Source: https://docs.li.fi/sdk/execute-routes

This TypeScript example demonstrates how to execute each step of a LiFi route sequentially. It uses `getStepTransaction` to fetch transaction details for each step and `getStatus` to monitor the transaction's progress until completion or failure. This method requires manual handling of transaction sending and status checking.

```typescript
import { getStepTransaction, getStatus } from '@lifi/sdk';

// Simplified example function to execute each step of the route sequentially
async function executeRouteSteps(route) {
  for (const step of route.steps) {
    // Request transaction data for the current step
    const step = await getStepTransaction(step);
    
    // Send the transaction (e.g. using Viem)
    const transactionHash = await sendTransaction(step.transactionRequest);
    
    // Monitor the status of the transaction
    let status;
    do {
      const result = await getStatus({
        txHash: transactionHash,
        fromChain: step.action.fromChainId,
        toChain: step.action.toChainId,
        bridge: step.tool,
      })
      status = result.status
      
      console.log(`Transaction status for ${transactionHash}:`, status);
      
      // Wait for a short period before checking the status again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } while (status !== 'DONE' && status !== 'FAILED');
    
    if (status === 'FAILED') {
      console.error(`Transaction ${transactionHash} failed`);
      return;
    }
  }
  
  console.log('All steps executed successfully');
}
```

--------------------------------

### Get Available Bridges and DEXs

Source: https://docs.li.fi/sdk/chains-tools

Fetches the tools available for bridging and swapping tokens. You can filter by specific chains.

```APIDOC
## GET /tools

### Description
Fetches the tools available for bridging and swapping tokens.

### Method
GET

### Endpoint
/tools

### Parameters
#### Query Parameters
- **chains** ((ChainKey | ChainId)[], optional) - List of chain IDs or keys to filter tools by.
- **options** (RequestOptions, optional) - Additional request options.

### Request Example
```javascript
import { getTools } from '@lifi/sdk';

async function fetchTools() {
  try {
    const tools = await getTools({ chains: [1, 10] }); // Example for Ethereum and Optimism
    console.log(tools);
  } catch (error) {
    console.error(error);
  }
}

fetchTools();
```

### Response
#### Success Response (200)
- **bridges** (Bridge[]) - An array of available bridge objects.
- **exchanges** (Exchange[]) - An array of available exchange (DEX) objects.

#### Response Example
```json
{
  "bridges": [
    {
      "key": "hop",
      "name": "Hop",
      "logo": "https://li.quest/v1/logos/bridges/hop.svg",
      "key": "hop",
      "protocolType": "bridge",
      "providerFee": "0.0005",
      "limitIn": "1000000000000000000",
      "limitOut": "1000000000000000000"
    }
  ],
  "exchanges": [
    {
      "key": "uniswap",
      "name": "Uniswap",
      "logo": "https://li.quest/v1/logos/exchanges/uniswap.svg",
      "key": "uniswap",
      "protocolType": "dex",
      "multiHopChains": [1, 10, 137, 42161],
      "estimate": true
    }
  ]
}
```
```

--------------------------------

### Import Pre-configured Themes from @lifi/widget

Source: https://docs.li.fi/integrate-li.fi-widget/customize-widget

This code snippet shows how to import pre-configured themes directly from the `@lifi/widget` package. These themes provide a starting point for widget customization, offering different combinations of colors, shapes, and component styles.

```typescript
import { azureLightTheme, watermelonLightTheme, windows95Theme } from '@lifi/widget';

```

--------------------------------

### Get Token Balances by Chain

Source: https://docs.li.fi/integrate-li.fi-sdk/token-management

Queries the balances of tokens for a specific list of chains for a given wallet. Requires EVM/Solana providers.

```APIDOC
## GET /balances/by-chain/:walletAddress

### Description
Queries the balances of tokens for a specific list of chains for a given wallet. Requires EVM/Solana providers.

### Method
GET

### Endpoint
/balances/by-chain/:walletAddress

### Parameters
#### Path Parameters
- **walletAddress** (string) - Required - The wallet address to check.

#### Request Body
- **tokensByChain** (Record<chainId: number, Token[]>) - Required - A list of Token objects organized by chain IDs.

### Response
#### Success Response (200)
- **balances** (Record<chainId: number, TokenAmount[]>) - An object containing the tokens and their amounts on different chains.

### Request Example
```javascript
import { getTokenBalancesByChain } from '@lifi/sdk';

const walletAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';
const tokensByChain = {
  1: [
    {
      chainId: 1,
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'DAI Stablecoin',
      decimals: 18,
      priceUSD: '0.9999',
    },
  ],
  10: [
    {
      chainId: 10,
      address: '0x4200000000000000000000000000000000000042',
      symbol: 'OP',
      name: 'Optimism',
      decimals: 18,
      priceUSD: '1.9644',
    },
  ],
};

try {
  const balances = await getTokenBalancesByChain(walletAddress, tokensByChain);
  console.log(balances);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### TypeScript Example: Li.Fi API Response with Errors

Source: https://docs.li.fi/api-reference/error-codes

This TypeScript example demonstrates a common Li.Fi API response when a quote for a transfer cannot be found. It includes details about the error type, specific error code, and the attempted action, which helps in debugging and understanding the issue. The response details include token information, chain IDs, amounts, and the tool that failed to provide a quote.

```TypeScript
theme={\"system\"}
{
    "message": "Unable to find a quote for the requested transfer.",
    "errors": [
        {
            "errorType": "NO_QUOTE",
            "code": "INSUFFICIENT_LIQUIDITY",
            "action": {
                "fromChainId": 100,
                "toChainId": 100,
                "fromToken": {
                    "address": "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
                    "decimals": 6,
                    "symbol": "USDT",
                    "chainId": 100,
                    "coinKey": "USDT",
                    "name": "USDT",
                    "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
                    "priceUSD": "0.99872"
                },
                "toToken": {
                    "address": "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
                    "decimals": 6,
                    "symbol": "USDC",
                    "chainId": 100,
                    "coinKey": "USDC",
                    "name": "USDC",
                    "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
                },
                "fromAmount": "1",
                "slippage": 0.03,
                "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
                "toAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
            },
            "tool": "1inch",
            "message": "The tool's liquidity is insufficient."
        },
        {
            "errorType": "NO_QUOTE",
            "code": "TOOL_TIMEOUT",
            "action": {
                "fromChainId": 100,
                "toChainId": 100,
                "fromToken": {
                    "address": "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
                    "decimals": 6,
                    "symbol": "USDT",
                    "chainId": 100,
                    "coinKey": "USDT",
                    "name": "USDT",
                    "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
                    "priceUSD": "0.99872"
                },
                "toToken": {
                    "address": "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
                    "decimals": 6,
                    "symbol": "USDC",
                    "chainId": 100,
                    "coinKey": "USDC",
                    "name": "USDC",
                    "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
                },
                "fromAmount": "1",
                "slippage": 0.03,
                "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
                "toAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
            },
            "tool": "openocean",
            "message": "The third party tool timed out."
        },
        {
            "errorType": "NO_QUOTE",
            "code": "NO_POSSIBLE_ROUTE",
            "action": {
                "fromChainId": 100,
                "toChainId": 100,
                "fromToken": {
                    "address": "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
                    "decimals": 6,
                    "symbol": "USDT",
                    "chainId": 100,
                    "coinKey": "USDT",
                    "name": "USDT",
                    "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
                    "priceUSD": "0.99872"
                },
                "toToken": {
                    "address": "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
                    "decimals": 6,
                    "symbol": "USDC",
                    "chainId": 100,
                    "coinKey": "USDC",
                    "name": "USDC",
                    "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
                },
                "fromAmount": "1",
                "slippage": 0.03,
                "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
                "toAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
            },
            "tool": "superfluid",
            "message": "No route was found for this action."
        }
    ]
}
```

--------------------------------

### GET /websites/li_fi

Source: https://docs.li.fi/api-reference/get-a-gas-suggestion-for-the-specified-chain

Retrieves a gas suggestion for a specified chain. The suggestion is based on the average price of 10 approvals and 10 uniswap based swaps via LI.FI on the specified chain.

```APIDOC
## GET /websites/li_fi

### Description
Retrieve a suggestion on how much gas is needed on the requested chain. The suggestion is based on the average price of 10 approvals and 10 uniswap based swaps via LI.FI on the specified chain. If `fromChain` and `fromToken` are specified, the result will contain information about how much `fromToken` amount the user has to send to receive the suggested gas amount on the requested chain.

### Method
GET

### Endpoint
/websites/li_fi

### Parameters
#### Query Parameters
- **toChain** (string) - Required - The chain for which to get a gas suggestion.
- **fromChain** (string) - Optional - The chain from which the user is initiating the transaction.
- **fromToken** (string) - Optional - The token the user is sending from the `fromChain`.

### Response
#### Success Response (200)
- **suggestedGasAmount** (string) - The suggested amount of gas for the specified chain.
- **fromAmount** (string) - The amount of `fromToken` the user needs to send to cover the suggested gas amount (only present if `fromChain` and `fromToken` are provided).

#### Response Example
```json
{
  "suggestedGasAmount": "0.05 ETH",
  "fromAmount": "1000 USDC"
}
```
```

--------------------------------

### Manual Route Execution with getStepTransaction and getStatus

Source: https://docs.li.fi/sdk/execute-routes

This section provides a detailed guide on how to manually execute a route by sequentially processing each step. It covers requesting transaction data for each step using `getStepTransaction`, sending the transaction, and then monitoring its status using `getStatus` until completion or failure.

```APIDOC
## Manual Route Execution

This guide explains how to manually execute routes and quotes, which requires developers to manage transaction data, chain switching, sending transactions, and status tracking.

Routes initially do not include transaction data. Developers must request transaction data for each step individually using `getStepTransaction` after a user selects a route. Steps must be executed sequentially.

Quotes, however, are returned with transaction data included and can be executed immediately.

After sending a transaction, its status can be tracked using the `getStatus` function.

### `getStepTransaction` Function

**Description:** Requests transaction data for a specific step in a route.

**Parameters:**
* `step` (LiFiStep): The step object for which to retrieve transaction data.
* `options` (RequestOptions, optional): Options for the request, such as `AbortSignal`.

**Returns:**
* `Promise<LiFiStep>`: A promise that resolves to the step object with transaction data.

### `getStatus` Function

**Description:** Monitors the status of a sent transaction.

**Parameters:**
* `params` (GetStatusRequest): Includes transaction hash, source and destination chain IDs, and bridge/DEX name.
* `options` (RequestOptions, optional): Options for the request, such as `AbortSignal`.

**Returns:**
* `Promise<StatusResponse>`: A promise that resolves to the status of the transfer.

### Example: Executing Route Steps Sequentially

```typescript
import { getStepTransaction, getStatus } from '@lifi/sdk';

async function executeRouteSteps(route) {
  for (const step of route.steps) {
    // Request transaction data for the current step
    const stepWithTxData = await getStepTransaction(step);
    
    // Send the transaction (e.g., using Viem)
    const transactionHash = await sendTransaction(stepWithTxData.transactionRequest);
    
    // Monitor the status of the transaction
    let status;
    do {
      const result = await getStatus({
        txHash: transactionHash,
        fromChain: stepWithTxData.action.fromChainId,
        toChain: stepWithTxData.action.toChainId,
        bridge: stepWithTxData.tool,
      });
      status = result.status;
      
      console.log(`Transaction status for ${transactionHash}:`, status);
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } while (status !== 'DONE' && status !== 'FAILED');
    
    if (status === 'FAILED') {
      console.error(`Transaction ${transactionHash} failed`);
      return;
    }
  }
  
  console.log('All steps executed successfully');
}
```

*Note: This example omits balance checks, transaction replacements, error handling, and chain switching for simplicity. A robust implementation should include these.*
```

--------------------------------

### Get Token Balances by Chain

Source: https://docs.li.fi/sdk/token-management

Queries the balances of tokens for a specific list of chains for a given wallet address. Requires SDK configuration with EVM/Solana providers.

```APIDOC
## Get Token Balances by Chain

### Description
Queries the balances of tokens for a specific list of chains for a given wallet.

### Method
GET

### Endpoint
/balances/chains/{walletAddress}

### Parameters
#### Path Parameters
- **walletAddress** (string) - Required - A wallet address.

#### Query Parameters
- **tokensByChain** ( {chainId: number}: Token[] ) - Required - A list of Token objects organized by chain IDs.

### Response
#### Success Response (200)
- **balances** (object) - An object containing the tokens and their amounts on different chains.

### Request Example
```typescript
import { getTokenBalancesByChain } from '@lifi/sdk';

const walletAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';
const tokensByChain = {
  1: [
    {
      chainId: 1,
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'DAI Stablecoin',
      decimals: 18,
      priceUSD: '0.9999',
    },
  ],
  10: [
    {
      chainId: 10,
      address: '0x4200000000000000000000000000000000000042',
      symbol: 'OP',
      name: 'Optimism',
      decimals: 18,
      priceUSD: '1.9644',
    },
  ],
};

try {
  const balances = await getTokenBalancesByChain(walletAddress, tokensByChain);
  console.log(balances);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### Configure MVM Wallet Connection using @mysten/dapp-kit

Source: https://docs.li.fi/integrate-li.fi-widget/wallet-management

This example demonstrates preconfiguring basic wallet management for MVM chains like SUI using '@mysten/dapp-kit' and '@mysten/sui'. It involves setting up SuiClientProvider and WalletProvider to handle wallet connections and SUI blockchain interactions. Key dependencies are '@mysten/dapp-kit' and '@mysten/sui/client'.

```typescript
import type { FC, PropsWithChildren } from "react";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";

const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl("mainnet") },
});

export const SuiWalletProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
      <WalletProvider autoConnect>{children}</WalletProvider>
    </SuiClientProvider>
  );
};

```

--------------------------------

### Get Transfers Analytics (OpenAPI Specification)

Source: https://docs.li.fi/api-reference/get-a-list-of-filtered-transfers

This OpenAPI specification defines the GET endpoint `/v1/analytics/transfers` for retrieving transfer analytics. It supports filtering by integrator, wallet, status, timestamps, originating chain, destination chain, and tokens. The response includes a list of transfers with detailed sending and receiving information.

```yaml
paths:
  path: /v1/analytics/transfers
  method: get
  servers:
    - url: https://li.quest
      description: LI.FI Production Environment
    - url: https://staging.li.quest
      description: LI.FI Staging Environment
  request:
    security: []
    parameters:
      path: {}
      query:
        integrator:
          schema:
            - type: string
              description: The integrator string to filter by
        wallet:
          schema:
            - type: string
              description: 'The sending OR receiving wallet address '
        status:
          schema:
            - type: string
              description: >-
                The status of the transfers. Possible values are `ALL`, `DONE`,
                `PENDING`, and `FAILED`. The default is `DONE`
        fromTimestamp:
          schema:
            - type: number
              description: >-
                The oldest timestamp that should be taken into consideration. Defaults to 30 days ago
        toTimestamp:
          schema:
            - type: number
              description: >-
                The newest timestamp that should be taken into consideration. Defaults to now
        fromChain:
          schema:
            - type: string
              description: The chain where the transfer originates from.
        toChain:
          schema:
            - type: string
              description: The chain where the transfer ends.
        fromToken:
          schema:
            - type: string
              description: >-
                The token transferred from the originating chain. To use this parameter `fromChain` must be set.
        toToken:
          schema:
            - type: string
              description: >-
                The token received on the destination chain. To use this parameter `toChain` must be set.
      header: {}
      cookie: {}
    body: {}
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              transfers:
                allOf:
                  - type: array
                    items:
                      $ref: '#/components/schemas/StatusResponse'
        examples:
          Transfers:
            value:
              transfers:
                - transactionId: >-
                    0x8c58bf99537331b38f15f5ca9718b6fcf86bdb678a2935cf0ca2106066f07550
                  sending:
                    txHash: >-
                      0x37b56ab04df432aa84f14d94f3af2ef65c10141df37ffe60f216c0505fc43178
                    txLink: >-
                      https://explorer.zksync.io/tx/0x37b56ab04df432aa84f14d94f3af2ef65c10141df37ffe60f216c0505fc43178
                    amount: '1000000'
                    token:
                      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
                      chainId: 324
                      symbol: USDC
                      decimals: 6
                      name: USD Coin
                      coinKey: USDC
                      logoURI: >-
                        https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png
                      priceUSD: '1.00'
                    chainId: 324
                    gasPrice: '250000000'
                    gasUsed: '1428505'
                    gasToken:
                      address: '0x0000000000000000000000000000000000000000'
                      chainId: 324
                      symbol: ETH
                      decimals: 18
                      name: ETH
                      coinKey: ETH
                      logoURI: >-
                        https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png
                      priceUSD: '1676.49'
                    gasAmount: '357126250000000'
                    gasAmountUSD: '0.60'
                    amountUSD: '1.0000'
                    timestamp: 1698076232
                    value: '0'
                  receiving:
                    txHash: >-
                      0x37b56ab04df432aa84f14d94f3af2ef65c10141df37ffe60f216c0505fc43178
                    txLink: >-
                      https://explorer.zksync.io/tx/0x37b56ab04df432aa84f14d94f3af2ef65c10141df37ffe60f216c0505fc43178
                    amount: '999255'
                    token:
                      address: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C'
                      chainId: 324
                      symbol: USDT
                      decimals: 6
                      name: Tether USD
                      coinKey: USDT
                      logoURI: >-
                        https://static.debank.com/image/brise_token/logo_url/0xc7e6d7e08a89209f02af47965337714153c529f0/3c1a718331e468abe1fc2ebe319f6c77.png

```

--------------------------------

### Configure Route Labels for Li.Fi Widget (TypeScript)

Source: https://docs.li.fi/widget/configure-widget

This example demonstrates how to configure the `routeLabels` array within `WidgetConfig` to add custom labels to specific routes. It includes two examples: one for a general route from Optimism with a 'OP Reward' label, and another for 'LI.FI Bonus' on Relay routes from Optimism, showcasing custom styling and filtering.

```typescript
import { ChainId } from "@lifi/sdk";
import type { WidgetConfig } from "@lifi/widget";

const widgetConfig: WidgetConfig = {
  routeLabels: [
    {
      label: {
        text: "OP Reward",
        sx: {
          background: "linear-gradient(90deg, #ff0404, #ff04c8)",
          "@keyframes gradient": {
            "0%": { backgroundPosition: "0% 50%" },
            "50%": { backgroundPosition: "100% 50%" },
            "100%": { backgroundPosition: "0% 50%" },
          },
          animation: "gradient 3s ease infinite",
          backgroundSize: "200% 200%",
          color: "#ffffff",
        },
      },
      fromChainId: [ChainId.OPT], // Applies to routes from Optimism
    },
    {
      label: {
        text: "LI.FI Bonus",
        sx: {
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          marginLeft: "auto",
          order: 1,
          backgroundImage:
            "url(https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/lifidexaggregator.svg)",
          backgroundPosition: "left center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "24px",
          paddingLeft: "12px",
          backgroundColor: "#f5b5ff",
        },
      },
      fromChainId: [ChainId.OPT], // Applies to routes from Optimism
      exchanges: {
        allow: ["relay"], // Only show for Relay routes
      },
    },
  ],
};
```

--------------------------------

### Configure LI.FI SDK

Source: https://docs.li.fi/sdk/overview

Configure the LI.FI SDK by providing an integrator name. This step is essential for initializing the SDK and preparing it for further use in your application.

```typescript
import { createConfig } from "@lifi/sdk";

createConfig({
  integrator: "YourCompanyName",
});
```

--------------------------------

### Get Available Connections for Token Swaps/Bridges using Li.Fi SDK

Source: https://docs.li.fi/integrate-li.fi-sdk/chains-and-tools

Retrieves all available connections for swapping or bridging tokens using the LI.FI SDK. This function requires a ConnectionsRequest object specifying source and destination tokens, chains, and optionally allowing/denying/preferring specific bridges or exchanges, as well as chain types. It returns a Promise that resolves to a ConnectionsResponse.

```typescript
import { getConnections } from '@lifi/sdk';

const connectionRequest = {
  fromChain: 1,
  fromToken: '0x0000000000000000000000000000000000000000',
  toChain: 10,
  toToken: '0x0000000000000000000000000000000000000000',
};

try {
  const connections = await getConnections(connectionRequest);
  console.log('Connections:', connections);
} catch (error) {
  console.error('Error:', error);
}
```

--------------------------------

### Get Multiple Token Balances

Source: https://docs.li.fi/more-integration-options/li.fi-api/getting-token-information

Returns the balances for a list of tokens held by a wallet address. Requires EVM/Solana providers to be configured.

```APIDOC
## GET /balances/{walletAddress}

### Description
Returns the balances for a list of tokens a wallet holds. Requires EVM/Solana providers to be configured.

### Method
GET

### Endpoint
/balances/{walletAddress}

### Parameters
#### Path Parameters
- **walletAddress** (string) - Required - A wallet address.

#### Query Parameters
- **tokens** (Token[]) - Required - A list of Token objects.

### Response
#### Success Response (200)
- **tokenBalances** (TokenAmount[]) - A list of TokenAmount objects representing the balances.

#### Response Example
```json
[
  {
    "token": {
      "chainId": 1,
      "address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      "symbol": "UNI",
      "name": "Uniswap",
      "decimals": 18
    },
    "amount": "1000000000000000000",
    "unit": "1 UNI"
  }
]
```
```

--------------------------------

### Get Available Connections

Source: https://docs.li.fi/sdk/chains-tools

Retrieves all possible token connections for swapping or bridging, allowing detailed filtering by source/destination tokens, chains, and bridge/exchange preferences.

```APIDOC
## POST /connections

### Description
Gets all the available connections for swapping or bridging tokens.

### Method
POST

### Endpoint
/connections

### Parameters
#### Request Body
- **fromChain** (number, optional) - The source chain ID.
- **fromToken** (string, optional) - The source token address.
- **toChain** (number, optional) - The destination chain ID.
- **toToken** (string, optional) - The destination token address.
- **allowBridges** (string[], optional) - Allowed bridges by key.
- **denyBridges** (string[], optional) - Denied bridges by key.
- **preferBridges** (string[], optional) - Preferred bridges by key.
- **allowExchanges** (string[], optional) - Allowed exchanges by key.
- **denyExchanges** (string[], optional) - Denied exchanges by key.
- **preferExchanges** (string[], optional) - Preferred exchanges by key.
- **allowSwitchChain** (boolean, optional) - Whether connections that require chain switch are included. Default is true.
- **allowDestinationCall** (boolean, optional) - Whether connections that include destination calls are included. Default is true.
- **chainTypes** (ChainType[], optional) - Types of chains to include.
- **options** (RequestOptions, optional) - Request options.

### Request Example
```javascript
import { getConnections } from '@lifi/sdk';

const connectionRequest = {
  fromChain: 1, // Ethereum Chain ID
  fromToken: '0x0000000000000000000000000000000000000000', // ETH address
  toChain: 10, // Optimism Chain ID
  toToken: '0x0000000000000000000000000000000000000000', // DAI address on Optimism
  allowBridges: ['hop'],
  allowExchanges: ['uniswap']
};

async function fetchConnections() {
  try {
    const connections = await getConnections(connectionRequest);
    console.log('Connections:', connections);
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchConnections();
```

### Response
#### Success Response (200)
- **connections** (Connection[]) - An array of available connection objects.

#### Response Example
```json
{
  "connections": [
    {
      "fromChainId": 1,
      "fromToken": {
        "decimals": 18,
        "name": "Ether",
        "symbol": "ETH",
        "address": "0x0000000000000000000000000000000000000000",
        "logo": "https://li.quest/v1/logos/tokens/0x0000000000000000000000000000000000000000.svg"
      },
      "toChainId": 10,
      "toToken": {
        "decimals": 18,
        "name": "Dai Stablecoin",
        "symbol": "DAI",
        "address": "0x0000000000000000000000000000000000000000",
        "logo": "https://li.quest/v1/logos/tokens/0x0000000000000000000000000000000000000000.svg"
      },
      "execution": {
        "fromAddress": "0x0000000000000000000000000000000000000000",
        "toAddress": "0x0000000000000000000000000000000000000000",
        "router": "0x0000000000000000000000000000000000000000",
        "routerType": "bridge",
        "bridge": "hop",
        "exchange": null,
        "gasCosts": []
      }
    }
  ]
}
```
```

--------------------------------

### Li.Fi Quote API Parameters

Source: https://docs.li.fi/integrate-li.fi-sdk/request-routes-quotes

Details the available parameters for the Li.Fi getQuote function, including route options, bridge and exchange preferences, and swap step timing strategies.

```APIDOC
## Li.Fi Quote API Parameters

### Description
This section details the various parameters available for the Li.Fi `getQuote` function. It includes general route options, specific configurations for bridges and exchanges, and advanced timing strategies for swap steps.

### Method
GET (Implicit for `getQuote` function usage)

### Endpoint
N/A (This describes parameters for a function call)

### Parameters
#### Query Parameters

*   **allowSwitchChain** (boolean) - Optional - Used exclusively to control chain switching in route requests.
*   **allowBridges** (string[]) - Optional - An array of bridge names to allow.
*   **denyBridges** (string[]) - Optional - An array of bridge names to deny.
*   **preferBridges** (string[]) - Optional - An array of bridge names to prefer.
*   **allowExchanges** (string[]) - Optional - An array of exchange names to allow.
*   **denyExchanges** (string[]) - Optional - An array of exchange names to deny.
*   **preferExchanges** (string[]) - Optional - An array of exchange names to prefer.
*   **swapStepTimingStrategies** (string[]) - Optional - Specifies the timing strategy for swap steps. The format is: `minWaitTime-${minWaitTimeMs}-${startingExpectedResults}-${reduceEveryMs}`.

### Request Example
```json
{
  "fromToken": "USDC",
  "toToken": "ETH",
  "fromAmount": "1000",
  "fromChain": "ethereum",
  "toChain": "polygon",
  "options": {
    "allowBridges": ["uniswap", "sushiswap"],
    "denyExchanges": ["quickswap"],
    "swapStepTimingStrategies": ["minWaitTime-5000-3-1000"]
  }
}
```

### Response
#### Success Response (200)
*   **quote** (object) - Contains detailed quote information, including routes and estimated costs.

#### Response Example
```json
{
  "quote": {
    "routes": [
      {
        "id": "route1",
        "feeCosts": [
          {
            "token": "USDC",
            "amount": "0.1"
          }
        ],
        "steps": [
          {
            "type": "swap",
            "bridge": "Uniswap",
            "tokenIn": "USDC",
            "tokenOut": "WETH",
            "amountIn": "1000",
            "amountOut": "0.5"
          }
        ]
      }
    ]
  }
}
```
```

--------------------------------

### GET /v1/gas/refetch

Source: https://docs.li.fi/api-reference/in-case-a-transaction-was-missed-by-a-relayer-this-endpoint-can-be-used-to-force-a-tx-to-be-re-fetched

Retrieves the status of a gas refetching process. This endpoint is deprecated.

```APIDOC
## GET /v1/gas/refetch

### Description
Retrieves the status of a gas refetching process. This endpoint is deprecated.

### Method
GET

### Endpoint
/v1/gas/refetch

### Parameters
#### Query Parameters
- **txHash** (string) - Required - The transaction hash that started the gas refilling process
- **chainId** (string) - Required - The chain where the deposit was originally made

#### Header Parameters
- **x-lifi-api-key** (string) - Optional - Authentication header, contact support if you want to get registered.

### Request Example
```json
{
  "txHash": "0x74546ce8aac58d33c212474293dcfeeadecef115847da75131a2ff6692e03b96",
  "chainId": "137"
}
```

### Response
#### Success Response (200)
- **status** (LIFuelStatusStateEnum) - The status of the lifuel operation
- **sending** (TxInfo) - Transaction information for the sending chain
- **receiving** (TxInfo) - Transaction information for the receiving chain

#### Response Example
```json
{
  "status": "NOT_FOUND",
  "sending": {
    "txHash": "0x74546ce8aac58d33c212474293dcfeeadecef115847da75131a2ff6692e03b96",
    "txLink": "https://polygonscan.com/tx/0x74546ce8aac58d33c212474293dcfeeadecef115847da75131a2ff6692e03b96",
    "amount": "10000",
    "token": {
      "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      "symbol": "DAI",
      "decimals": 18,
      "chainId": 137,
      "name": "(PoS) Dai Stablecoin",
      "coinKey": "DAI",
      "priceUSD": "1",
      "logoURI": "https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png"
    },
    "chainId": 137,
    "block": 39397739
  },
  "receiving": {
    "txHash": "0x74546ce8aac58d33c212474293dcfeeadecef115847da75131a2ff6692e03b96",
    "txLink": "https://polygonscan.com/tx/0x74546ce8aac58d33c212474293dcfeeadecef115847da75131a2ff6692e03b96",
    "amount": "10000",
    "token": {
      "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      "symbol": "DAI",
      "decimals": 18,
      "chainId": 137,
      "name": "(PoS) Dai Stablecoin",
      "coinKey": "DAI",
      "priceUSD": "1",
      "logoURI": "https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png"
    },
    "chainId": 137,
    "block": 39397739
  }
}
```
```

--------------------------------

### Integrate LiFi Widget with MVM Sui Wallet Provider (TypeScript)

Source: https://docs.li.fi/widget/wallet-management

This code demonstrates integrating the LiFiWidget with an MVM chain setup using the SuiWalletProvider. It requires '@tanstack/react-query' for state management along with the wallet providers. The output is a LiFi widget instance configured for Sui blockchain interactions.

```typescript
import { LiFiWidget } from "@lifi/widget";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiWalletProvider } from "../providers/SuiWalletProvider";

const queryClient = new QueryClient();

export const WidgetPage = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiWalletProvider>
        <LiFiWidget integrator="sui-example" />
      </SuiWalletProvider>
    </QueryClientProvider>
  );
};

```

--------------------------------

### Example API Response for Chain Connections

Source: https://docs.li.fi/li.fi-api/li.fi-api/getting-all-possible-connections

This JSON structure represents a successful response from the '/v1/connections' endpoint. It details available token bridges between different chains, including token addresses, symbols, and prices.

```json
{
  "connections": [
    {
      "fromChainId": 137,
      "toChainId": 1,
      "fromTokens": [
        {
          "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
          "decimals": 18,
          "symbol": "DAI",
          "chainId": 137,
          "coinKey": "DAI",
          "name": "DAI",
          "logoURI": "https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png",
          "priceUSD": "1"
        }
      ],
      "toTokens": [
        {
          "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
          "decimals": 18,
          "symbol": "DAI",
          "chainId": 1,
          "coinKey": "DAI",
          "name": "DAI",
          "logoURI": "https://static.debank.com/image/eth_token/logo_url/0x6b175474e89094c44da98b954eedeac495271d0f/549c4205dbb199f1b8b03af783f35e71.png",
          "priceUSD": "1"
        },
        {
          "address": "0x0000000000000000000000000000000000000000",
          "decimals": 18,
          "symbol": "ETH",
          "chainId": 1,
          "coinKey": "ETH",
          "name": "ETH",
          "logoURI": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
          "priceUSD": "2582.35"
        },
        {
          "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          "decimals": 6,
          "symbol": "USDC",
          "chainId": 1,
          "coinKey": "USDC",
          "name": "USDC",
          "logoURI": "https://static.debank.com/image/eth_token/logo_url/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/fffcd27b9efff5a86ab942084c05924d.png",
          "priceUSD": "1"
        },
        {
          "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
          "decimals": 6,
          "symbol": "USDT",
          "chainId": 1,
          "coinKey": "USDT",
          "name": "USDT",
          "logoURI": "https://static.debank.com/image/eth_token/logo_url/0xdac17f958d2ee523a2206206994597c13d831ec7/66eadee7b7bb16b75e02b570ab8d5c01.png",
          "priceUSD": "1"
        }
      ]
    },
    {
      "fromChainId": 137,
      "toChainId": 10,
      "fromTokens": [
        {
          "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
          "decimals": 18,
          "symbol": "DAI",
          "chainId": 137,
          "coinKey": "DAI",
          "name": "DAI",
          "logoURI": "https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png",
          "priceUSD": "1"
        }
      ],
      "toTokens": [
        {
          "address": "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
          "decimals": 18,
          "symbol": "DAI",
          "chainId": 10,
          "coinKey": "DAI",
          "name": "DAI",
          "logoURI": "https://static.debank.com/image/op_token/logo_url/0xda10009cbd5d07dd0cecc66161fc93d7c9000da1/45965130df45ecf234ff03ce28299cd1.png",
          "priceUSD": "1"
        },
        {
          "address": "0x0000000000000000000000000000000000000000",
          "decimals": 18,
          "symbol": "ETH",
          "chainId": 10,
          "coinKey": "ETH",
          "name": "ETH"
        }
      ]
    }
  ]
}
```

--------------------------------

### GET /v1/gas/status

Source: https://docs.li.fi/api-reference/get-status-information-about-a-lifuel-transaction

Retrieves status information about a lifuel transaction using its transaction hash.

```APIDOC
## GET /v1/gas/status

### Description
Retrieves status information about a lifuel transaction using its transaction hash. This endpoint is useful for tracking the progress and outcome of gas refilling processes initiated through LI.FI.

### Method
GET

### Endpoint
/v1/gas/status

### Parameters
#### Query Parameters
- **txHash** (string) - Required - The transaction hash that started the gas refilling process

#### Header Parameters
- **x-lifi-api-key** (string) - Optional - Authentication header, contact support if you want to get registered.

### Request Example
```json
{
  "txHash": "0x74546ce8aac58d33c212474293dcfeeadecef115847da75131a2ff6692e03b96"
}
```

### Response
#### Success Response (200)
- **status** (string) - The current status of the lifuel transaction (e.g., NOT_FOUND, PENDING, DONE).
- **sending** (object) - Information about the sending transaction.
  - **txHash** (string) - Hash of the sending transaction.
  - **txLink** (string) - Link to the sending transaction on a block explorer.
  - **amount** (string) - The amount of token sent.
  - **token** (object) - Details of the token sent.
    - **address** (string) - Token contract address.
    - **decimals** (number) - Token decimals.
    - **symbol** (string) - Token symbol.
    - **chainId** (number) - Chain ID where the token exists.
    - **coinKey** (string) - Unique key for the token.
    - **name** (string) - Token name.
    - **logoURI** (string) - URL for the token's logo.
    - **priceUSD** (string) - Current price of the token in USD.
  - **chainId** (number) - Chain ID of the sending transaction.
  - **block** (number) - Block number of the sending transaction.
- **receiving** (object) - Information about the receiving transaction.
  - **txHash** (string) - Hash of the receiving transaction.
  - **txLink** (string) - Link to the receiving transaction on a block explorer.
  - **amount** (string) - The amount of token received.
  - **token** (object) - Details of the token received (same structure as sending token).
  - **chainId** (number) - Chain ID of the receiving transaction.
  - **block** (number) - Block number of the receiving transaction.

#### Response Example
```json
{
  "status": "NOT_FOUND",
  "sending": {
    "txHash": "0x74546ce8aac58d33c212474293dcfeeadecef115847da75131a2ff6692e03b96",
    "txLink": "https://polygonscan.com/tx/0x74546ce8aac58d33c212474293dcfeeadecef115847da75131a2ff6692e03b96",
    "amount": "10000",
    "token": {
      "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      "symbol": "DAI",
      "decimals": 18,
      "chainId": 137,
      "name": "(PoS) Dai Stablecoin",
      "coinKey": "DAI",
      "priceUSD": "1",
      "logoURI": "https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png"
    },
    "chainId": 137,
    "block": 39397739
  },
  "receiving": {
    "txHash": "0x74546ce8aac58d33c212474293dcfeeadecef115847da75131a2ff6692e03b96",
    "txLink": "https://polygonscan.com/tx/0x74546ce8aac58d33c212474293dcfeeadecef115847da75131a2ff6692e03b96",
    "amount": "10000",
    "token": {
      "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      "symbol": "DAI",
      "decimals": 18,
      "chainId": 137,
      "name": "(PoS) Dai Stablecoin",
      "coinKey": "DAI",
      "priceUSD": "1",
      "logoURI": "https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png"
    },
    "chainId": 137,
    "block": 39397739
  }
}
```
```

--------------------------------

### GET /v1/analytics/transfers

Source: https://docs.li.fi/api-reference/get-a-list-of-filtered-transfers

Retrieves a list of cross-chain transfers with various filtering options.

```APIDOC
## GET /v1/analytics/transfers

### Description
Retrieves a list of cross-chain transfers with various filtering options. This endpoint is useful for tracking and analyzing transfer activity across different blockchains and tokens.

### Method
GET

### Endpoint
/v1/analytics/transfers

### Parameters
#### Query Parameters
- **integrator** (string) - Optional - The integrator string to filter by.
- **wallet** (string) - Optional - The sending OR receiving wallet address.
- **status** (string) - Optional - The status of the transfers. Possible values are `ALL`, `DONE`, `PENDING`, and `FAILED`. The default is `DONE`.
- **fromTimestamp** (number) - Optional - The oldest timestamp that should be taken into consideration. Defaults to 30 days ago.
- **toTimestamp** (number) - Optional - The newest timestamp that should be taken into consideration. Defaults to now.
- **fromChain** (string) - Optional - The chain where the transfer originates from.
- **toChain** (string) - Optional - The chain where the transfer ends.
- **fromToken** (string) - Optional - The token transferred from the originating chain. To use this parameter `fromChain` must be set.
- **toToken** (string) - Optional - The token received on the destination chain. To use this parameter `toChain` must be set.

### Request Example
```json
{
  "example": "No request body for GET request"
}
```

### Response
#### Success Response (200)
- **transfers** (array) - An array of transfer objects.
  - **transactionId** (string) - The unique identifier for the transfer transaction.
  - **sending** (object) - Details about the sending leg of the transfer.
    - **txHash** (string) - The transaction hash on the originating chain.
    - **txLink** (string) - A link to the transaction on the originating chain explorer.
    - **amount** (string) - The amount of the token sent.
    - **token** (object) - Details about the token being sent.
      - **address** (string) - The token contract address.
      - **chainId** (number) - The chain ID where the token is located.
      - **symbol** (string) - The token symbol (e.g., USDC).
      - **decimals** (number) - The number of decimals for the token.
      - **name** (string) - The full name of the token.
      - **coinKey** (string) - A key representing the coin.
      - **logoURI** (string) - A URI for the token's logo.
      - **priceUSD** (string) - The current price of the token in USD.
    - **chainId** (number) - The chain ID from which the transfer originates.
    - **gasPrice** (string) - The gas price for the sending transaction.
    - **gasUsed** (string) - The amount of gas used for the sending transaction.
    - **gasToken** (object) - Details about the gas token.
    - **gasAmount** (string) - The total gas amount for the transaction.
    - **gasAmountUSD** (string) - The gas cost in USD.
    - **amountUSD** (string) - The value of the sent amount in USD.
    - **timestamp** (number) - The timestamp of the sending transaction.
    - **value** (string) - The value associated with the transfer.
  - **receiving** (object) - Details about the receiving leg of the transfer.
    - **txHash** (string) - The transaction hash on the destination chain.
    - **txLink** (string) - A link to the transaction on the destination chain explorer.
    - **amount** (string) - The amount of the token received.
    - **token** (object) - Details about the token being received.
    - **chainId** (number) - The chain ID to which the transfer is directed.

#### Response Example
```json
{
  "transfers": [
    {
      "transactionId": "0x8c58bf99537331b38f15f5ca9718b6fcf86bdb678a2935cf0ca2106066f07550",
      "sending": {
        "txHash": "0x37b56ab04df432aa84f14d94f3af2ef65c10141df37ffe60f216c0505fc43178",
        "txLink": "https://explorer.zksync.io/tx/0x37b56ab04df432aa84f14d94f3af2ef65c10141df37ffe60f216c0505fc43178",
        "amount": "1000000",
        "token": {
          "address": "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
          "chainId": 324,
          "symbol": "USDC",
          "decimals": 6,
          "name": "USD Coin",
          "coinKey": "USDC",
          "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
          "priceUSD": "1.00"
        },
        "chainId": 324,
        "gasPrice": "250000000",
        "gasUsed": "1428505",
        "gasToken": {
          "address": "0x0000000000000000000000000000000000000000",
          "chainId": 324,
          "symbol": "ETH",
          "decimals": 18,
          "name": "ETH",
          "coinKey": "ETH",
          "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
          "priceUSD": "1676.49"
        },
        "gasAmount": "357126250000000",
        "gasAmountUSD": "0.60",
        "amountUSD": "1.0000",
        "timestamp": 1698076232,
        "value": "0"
      },
      "receiving": {
        "txHash": "0x37b56ab04df432aa84f14d94f3af2ef65c10141df37ffe60f216c0505fc43178",
        "txLink": "https://explorer.zksync.io/tx/0x37b56ab04df432aa84f14d94f3af2ef65c10141df37ffe60f216c0505fc43178",
        "amount": "999255",
        "token": {
          "address": "0x493257fD37EDB34451f62EDf8D2a0C418852bA4C",
          "chainId": 324,
          "symbol": "USDT",
          "decimals": 6,
          "name": "Tether USD",
          "coinKey": "USDT",
          "logoURI": "https://static.debank.com/image/brise_token/logo_url/0xc7e6d7e08a89209f02af47965337714153c529f0/3c1a718331e468abe1fc2ebe319f6c77.png"
        },
        "chainId": 324
      }
    }
  ]
}
```
```

--------------------------------

### Get Token Balances by Chain

Source: https://docs.li.fi/more-integration-options/li.fi-api/getting-token-information

Queries the balances of tokens for a specific list of chains for a given wallet address. Requires EVM/Solana providers to be configured.

```APIDOC
## GET /balances/{walletAddress}/by-chain

### Description
Queries the balances of tokens for a specific list of chains for a given wallet. Requires EVM/Solana providers to be configured.

### Method
GET

### Endpoint
/balances/{walletAddress}/by-chain

### Parameters
#### Path Parameters
- **walletAddress** (string) - Required - A wallet address.

#### Query Parameters
- **tokensByChain** (chainId: number): Token[] - Required - A list of Token objects organized by chain IDs.

### Response
#### Success Response (200)
- **balances** (object) - An object containing the tokens and their amounts on different chains.

#### Response Example
```json
{
  "1": [
    {
      "token": {
        "chainId": 1,
        "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "symbol": "DAI",
        "name": "DAI Stablecoin",
        "decimals": 18
      },
      "amount": "1000000000000000000",
      "unit": "1 DAI"
    }
  ],
  "10": [
    {
      "token": {
        "chainId": 10,
        "address": "0x4200000000000000000000000000000000000042",
        "symbol": "OP",
        "name": "Optimism",
        "decimals": 18
      },
      "amount": "500000000000000000",
      "unit": "0.5 OP"
    }
  ]
}
```
```

--------------------------------

### Get Token Balances for Multiple Tokens

Source: https://docs.li.fi/sdk/token-management

Returns the balances for a list of specified tokens that a wallet address holds. Requires SDK configuration with EVM/Solana providers.

```APIDOC
## Get Token Balances

### Description
Returns the balances for a list of tokens a wallet holds.

### Method
GET

### Endpoint
/balances/{walletAddress}

### Parameters
#### Path Parameters
- **walletAddress** (string) - Required - A wallet address.

#### Query Parameters
- **tokens** (Token[]) - Required - A list of Token objects.

### Response
#### Success Response (200)
- **tokenAmounts** (TokenAmount[]) - A list of TokenAmount objects representing the balances for each token.

### Request Example
```typescript
import { ChainId, getTokenBalances, getTokens } from '@lifi/sdk';

const walletAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';

try {
  const tokensResponse = await getTokens();
  const optimismTokens = tokensResponse.tokens[ChainId.OPT];
  const tokenBalances = await getTokenBalances(walletAddress, optimismTokens);
  console.log(tokenBalances);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### Configure EVM Provider with Local Accounts

Source: https://docs.li.fi/integrate-li.fi-sdk/configure-sdk-providers

Sets up the EVM provider using local accounts (private keys) and the Viem library. It defines a list of chains to interact with and configures a wallet client for transaction signing and chain switching.

```typescript
import { createConfig, EVM } from '@lifi/sdk'
import type { Chain } from 'viem'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrum, mainnet, optimism, polygon, scroll } from 'viem/chains'

const account = privateKeyToAccount('PRIVATE_KEY')

const chains = [arbitrum, mainnet, optimism, polygon, scroll]

const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
})

createConfig({
  integrator: 'Your dApp/company name',
  providers: [
    EVM({
      getWalletClient: async () => client,
      switchChain: async (chainId) =>
        // Switch chain by creating a new wallet client
        createWalletClient({
          account,
          chain: chains.find((chain) => chain.id == chainId) as Chain,
          transport: http(),
        }),
    }),
  ],
})
```

--------------------------------

### Get available connections

Source: https://docs.li.fi/li.fi-api/li.fi-api/getting-all-possible-connections

Retrieves a list of all available connections, which can represent bridges and exchanges within the Li-Fi ecosystem.

```APIDOC
## GET /websites/li_fi/connections

### Description
Retrieves a list of all available connections, which can represent bridges and exchanges within the Li-Fi ecosystem.

### Method
GET

### Endpoint
/websites/li_fi/connections

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
None

### Response
#### Success Response (200)
- **connections** (object[]) - The possible connections

#### Response Example
```json
{
  "connections": [
    {
      "id": "connection1",
      "name": "Exchange A",
      "type": "exchange"
    },
    {
      "id": "connection2",
      "name": "Bridge B",
      "type": "bridge"
    }
  ]
}
```
```

--------------------------------

### Create Initial LI.FI SDK Configuration

Source: https://docs.li.fi/integrate-li.fi-sdk/configure-sdk

Initializes the LI.FI SDK configuration with essential settings. The `integrator` parameter is mandatory for identifying your dApp or company. This configuration is required before using other SDK features.

```typescript
import { createConfig } from "@lifi/sdk";

createConfig({
  integrator: "Your dApp/company name",
});

```

--------------------------------

### Manual Route Execution with Transaction Tracking

Source: https://docs.li.fi/integrate-li.fi-sdk/execute-routes-quotes

Provides a function to manually execute route steps sequentially. It uses `getStepTransaction` to get transaction data, simulates sending the transaction, and then uses `getStatus` to monitor its progress. This requires `@lifi/sdk` and external functions like `sendTransaction`. Error handling and chain switching are omitted for simplicity.

```typescript
import { getStepTransaction, getStatus } from '@lifi/sdk';

// Simplified example function to execute each step of the route sequentially
async function executeRouteSteps(route) {
  for (const step of route.steps) {
    // Request transaction data for the current step
    const step = await getStepTransaction(step); // Note: 'step' is being reassigned here, consider using a different variable name
    
    // Send the transaction (e.g. using Viem)
    const transactionHash = await sendTransaction(step.transactionRequest); // 'sendTransaction' is not defined in this snippet
    
    // Monitor the status of the transaction
    let status;
    do {
      const result = await getStatus({
        txHash: transactionHash,
        fromChain: step.action.fromChainId,
        toChain: step.action.toChainId,
        bridge: step.tool,
      })
      status = result.status
      
      console.log(`Transaction status for ${transactionHash}:`, status);
      
      // Wait for a short period before checking the status again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } while (status !== 'DONE' && status !== 'FAILED');
    
    if (status === 'FAILED') {
      console.error(`Transaction ${transactionHash} failed`);
      return;
    }
  }
  
  console.log('All steps executed successfully');
}


```

--------------------------------

### Optimizing Response Timing: Disabling Simulation

Source: https://docs.li.fi/guides/integration-tips/latency

Learn how to disable on-chain simulations to improve API response times.

```APIDOC
## Disabling Simulation

### Description

By default, responses include on-chain simulation checks. To improve speed, you can disable these checks by setting the `skipSimulation` query parameter to `true`.

### Method

GET

### Endpoint

`/v1/advanced/stepTransaction` or `/v1/quote`

### Query Parameters

- **skipSimulation** (boolean) - Optional - Set to `true` to disable on-chain simulations and improve response time.

### Request Example

```
/v1/advanced/stepTransaction?skipSimulation=true
/v1/quote?skipSimulation=true&...
```

### Note

Disabling simulation reduces verification but improves response time. It is recommended when you simulate/gasEstimate the transaction in your system.
```

--------------------------------

### GET /v1/gas/prices

Source: https://docs.li.fi/api-reference/gas/get-gas-prices-for-enabled-chains

Fetches the latest gas prices for all enabled chains. This is useful for estimating transaction costs on different networks.

```APIDOC
## GET /v1/gas/prices

### Description
Retrieves the most recent gas prices (standard, fast, fastest) for enabled chains on the LI.FI platform, along with the last updated timestamp.

### Method
GET

### Endpoint
/v1/gas/prices

### Parameters
#### Header Parameters
- **x-lifi-api-key** (string) - Required - Authentication header. Contact support for registration.

### Request Example
```json
{
  "example": ""
}
```

### Response
#### Success Response (200)
- **standard** (number) - The standard gas price.
- **fast** (number) - The fast gas price.
- **fastest** (number) - The fastest gas price.
- **lastUpdated** (number) - Timestamp of the last gas price update.

#### Response Example
```json
{
  "standard": 123,
  "fast": 123,
  "fastest": 123,
  "lastUpdated": 123
}
```
```

--------------------------------

### Get Available Tokens

Source: https://docs.li.fi/integrate-li.fi-sdk/token-management

Retrieves a list of all available tokens on specified chains. You can filter by chain IDs or chain types.

```APIDOC
## GET /tokens

### Description
Retrieves a list of all available tokens on specified chains. Supports filtering by chain IDs and chain types.

### Method
GET

### Endpoint
/tokens

### Parameters
#### Query Parameters
- **chains** (ChainId[], optional) - List of chain IDs or keys. If not specified, returns tokens on all available chains.
- **chainTypes** (ChainType[], optional) - List of chain types.
- **options** (RequestOptions, optional) - Additional request options.

### Response
#### Success Response (200)
- **tokens** (TokensResponse) - An object containing lists of tokens organized by chain.

### Request Example
```javascript
import { ChainType, getTokens } from '@lifi/sdk';

try {
  const tokens = await getTokens({
    chainTypes: [ChainType.EVM, ChainType.SVM],
  });
  console.log(tokens);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### Token Allowance Management

Source: https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

Manages token allowances for sending transactions. This is crucial before executing a transfer to ensure the contract has permission to spend the user's tokens.

```APIDOC
## Token Allowance Management

### Description
Manages token allowances for sending transactions. This is crucial before executing a transfer to ensure the contract has permission to spend the user's tokens.

### Method
N/A (Code example provided for illustrative purposes)

### Endpoint
N/A

### Parameters
N/A

### Request Example
```typescript
await checkAndSetAllowance(wallet, quote.action.fromToken.address, quote.estimate.approvalAddress, fromAmount);
```

### Response
N/A (This is a client-side function execution)

### Code Snippet
```typescript
const { Contract } = require('ethers');

const ERC20_ABI = [
    {
        "name": "approve",
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "name": "allowance",
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const checkAndSetAllowance = async (wallet, tokenAddress, approvalAddress, amount) => {
    // Transactions with the native token don't need approval
    if (tokenAddress === ethers.constants.AddressZero) {
        return
    }

    const erc20 = new Contract(tokenAddress, ERC20_ABI, wallet);
    const allowance = await erc20.allowance(await wallet.getAddress(), approvalAddress);

    if (allowance.lt(amount)) {
        const approveTx = await erc20.approve(approvalAddress, amount);
        await approveTx.wait();
    }
}
```
```

--------------------------------

### GET /v1/token

Source: https://docs.li.fi/api-reference/fetch-information-about-a-token

Retrieves comprehensive information about a specific token based on its address or symbol and the associated blockchain chain.

```APIDOC
## GET /v1/token

### Description
This endpoint can be used to get more information about a token by its address or symbol and its chain.

### Method
GET

### Endpoint
`/v1/token`

### Parameters
#### Query Parameters
- **chain** (string) - Required - Id or key of the chain that contains the token
- **token** (string) - Required - Address or symbol of the token on the requested chain

#### Header Parameters
- **x-lifi-api-key** (string) - Optional - Authentication header, contact support if you want to get registered.

### Request Example
```
GET https://li.quest/v1/token?chain=137&token=0x8f3cf7ad23cd3cadbd9735aff958023239c6a063
```

### Response
#### Success Response (200)
- **address** (string) - Address of the token
- **symbol** (string) - Symbol of the token
- **decimals** (number) - Number of decimals the token uses
- **chainId** (number) - Id of the token's chain
- **name** (string) - Name of the token
- **coinKey** (string) - Identifier for the token
- **logoURI** (string) - Logo of the token
- **priceUSD** (string) - Token price in USD

#### Response Example
```json
{
  "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  "symbol": "DAI",
  "decimals": 18,
  "chainId": 137,
  "name": "(PoS) Dai Stablecoin",
  "coinKey": "DAI",
  "priceUSD": "1",
  "logoURI": "https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png"
}
```

#### Error Response (400)
- Description: User passed an invalid chain id or abbrevation

#### Error Response (404)
- Description: No token found for the given address and chain
```

--------------------------------

### GET /analytics/transfers

Source: https://docs.li.fi/api-reference/get-a-list-of-filtered-transfers

Retrieves analytics data for transfers, including details about gas, tokens, and transaction status.

```APIDOC
## GET /analytics/transfers

### Description
Retrieves analytics data for transfers, including details about gas, tokens, and transaction status.

### Method
GET

### Endpoint
/analytics/transfers

### Query Parameters
- **start_date** (string) - Optional - The start date for filtering transfer data (YYYY-MM-DD).
- **end_date** (string) - Optional - The end date for filtering transfer data (YYYY-MM-DD).
- **chain_id** (integer) - Optional - Filter transfers by chain ID.
- **tool_id** (string) - Optional - Filter transfers by tool ID.
- **status** (string) - Optional - Filter transfers by status (e.g., 'DONE', 'FAILED').

### Response
#### Success Response (200)
- **data** (array) - An array of transaction information objects.
  - **priceUSD** (string) - The price in USD of the transferred token.
  - **chainId** (integer) - The ID of the blockchain.
  - **gasPrice** (string) - The gas price for the transaction.
  - **gasUsed** (string) - The amount of gas used.
  - **gasToken** (object) - Information about the token used for gas.
    - **address** (string) - The token's contract address.
    - **chainId** (integer) - The chain ID of the gas token.
    - **symbol** (string) - The symbol of the gas token.
    - **decimals** (integer) - The number of decimals for the gas token.
    - **name** (string) - The name of the gas token.
    - **coinKey** (string) - The coin key identifier.
    - **logoURI** (string) - The URI for the gas token's logo.
    - **priceUSD** (string) - The price in USD of the gas token.
  - **gasAmount** (string) - The total gas amount.
  - **gasAmountUSD** (string) - The gas amount in USD.
  - **amountUSD** (string) - The USD value of the transferred amount.
  - **timestamp** (integer) - The transaction timestamp.
  - **lifiExplorerLink** (string) - A link to the transaction on the LI.FI explorer.
  - **fromAddress** (string) - The sender's address.
  - **toAddress** (string) - The recipient's address.
  - **tool** (string) - The tool used for the transfer.
  - **status** (string) - The status of the transfer.
  - **substatus** (string) - The sub-status of the transfer.
  - **substatusMessage** (string) - A message detailing the sub-status.

#### Response Example
```json
{
  "data": [
    {
      "priceUSD": "1.0000",
      "chainId": 324,
      "gasPrice": "250000000",
      "gasUsed": "1428505",
      "gasToken": {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 324,
        "symbol": "ETH",
        "decimals": 18,
        "name": "ETH",
        "coinKey": "ETH",
        "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
        "priceUSD": "1676.49"
      },
      "gasAmount": "357126250000000",
      "gasAmountUSD": "0.60",
      "amountUSD": "1.0000",
      "timestamp": 1698076232,
      "lifiExplorerLink": "https://explorer.li.fi/tx/0x37b56ab04df432aa84f14d94f3af2ef65c10141df37ffe60f216c0505fc43178",
      "fromAddress": "0x552008c0f6870c2f77e5cc1d2eb9bdff03e30ea0",
      "toAddress": "0x552008c0f6870c2f77e5cc1d2eb9bdff03e30ea0",
      "tool": "solver3",
      "status": "DONE",
      "substatus": "COMPLETED",
      "substatusMessage": "The transfer is complete."
    }
  ]
}
```
```

--------------------------------

### Get Specific Token Details

Source: https://docs.li.fi/integrate-li.fi-sdk/token-management

Fetches detailed information about a specific token on a given chain, identified by its address or symbol.

```APIDOC
## GET /tokens/:chain/:token

### Description
Fetches details about a specific token on a specified chain.

### Method
GET

### Endpoint
/tokens/:chain/:token

### Parameters
#### Path Parameters
- **chain** (ChainKey | ChainId) - Required - ID or key of the chain that contains the token.
- **token** (string) - Required - Address or symbol of the token on the requested chain.

#### Query Parameters
- **options** (RequestOptions, optional) - Additional request options.

### Response
#### Success Response (200)
- **token** (Token) - A Token object with detailed information.

### Request Example
```javascript
import { getToken } from '@lifi/sdk';

const chainId = 1;
const tokenAddress = '0x0000000000000000000000000000000000000000';

try {
  const token = await getToken(chainId, tokenAddress);
  console.log(token);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### GET /v1/connections

Source: https://docs.li.fi/li.fi-api/li.fi-api/getting-all-possible-connections

Retrieves all possible cross-chain connections. You can filter these connections by specifying a `fromChain` or `toChain` in the query parameters.

```APIDOC
## GET /v1/connections

### Description
Retrieves all possible cross-chain connections. This endpoint allows filtering by specifying `fromChain` or `toChain` in the query parameters.

### Method
GET

### Endpoint
/v1/connections

#### Query Parameters
- **fromChain** (integer) - Optional - The ID of the starting chain.
- **toChain** (integer) - Optional - The ID of the destination chain.

### Response
#### Success Response (200)
- **connections** (array) - An array of connection objects, each detailing `fromChainId`, `toChainId`, `fromTokens`, and `toTokens`.
  - **fromChainId** (integer) - The ID of the source chain.
  - **toChainId** (integer) - The ID of the destination chain.
  - **fromTokens** (array) - An array of token objects available on the `fromChain`.
    - **address** (string) - The token contract address.
    - **decimals** (integer) - The number of decimals the token uses.
    - **symbol** (string) - The token symbol (e.g., "DAI").
    - **chainId** (integer) - The chain ID where the token is located.
    - **coinKey** (string) - A unique key for the coin.
    - **name** (string) - The full name of the token.
    - **logoURI** (string) - URL to the token's logo.
    - **priceUSD** (string) - The current price of the token in USD.
  - **toTokens** (array) - An array of token objects available on the `toChain`.
    - **address** (string) - The token contract address.
    - **decimals** (integer) - The number of decimals the token uses.
    - **symbol** (string) - The token symbol (e.g., "DAI").
    - **chainId** (integer) - The chain ID where the token is located.
    - **coinKey** (string) - A unique key for the coin.
    - **name** (string) - The full name of the token.
    - **logoURI** (string) - URL to the token's logo.
    - **priceUSD** (string) - The current price of the token in USD.

### Request Example
```bash
curl --request GET \
  --url https://li.quest/v1/connections \
  --header 'accept: application/json'
```

### Response Example
```json
{
  "connections": [
    {
      "fromChainId": 137,
      "toChainId": 1,
      "fromTokens": [
        {
          "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
          "decimals": 18,
          "symbol": "DAI",
          "chainId": 137,
          "coinKey": "DAI",
          "name": "DAI",
          "logoURI": "https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png",
          "priceUSD": "1"
        }
      ],
      "toTokens": [
        {
          "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
          "decimals": 18,
          "symbol": "DAI",
          "chainId": 1,
          "coinKey": "DAI",
          "name": "DAI",
          "logoURI": "https://static.debank.com/image/eth_token/logo_url/0x6b175474e89094c44da98b954eedeac495271d0f/549c4205dbb199f1b8b03af783f35e71.png",
          "priceUSD": "1"
        },
        {
          "address": "0x0000000000000000000000000000000000000000",
          "decimals": 18,
          "symbol": "ETH",
          "chainId": 1,
          "coinKey": "ETH",
          "name": "ETH",
          "logoURI": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
          "priceUSD": "2582.35"
        }
      ]
    }
  ]
}
```
```

--------------------------------

### Initialize Form Values in LI.FI Widget Config (JavaScript)

Source: https://docs.li.fi/integrate-li.fi-widget/configure-widget

This example shows how to pre-configure default values for the LI.FI Widget, including source and destination chains, tokens, the amount to send, and the destination address. These settings streamline the user experience by pre-filling crucial swap or bridge parameters.

```javascript
import type { WidgetConfig } from "@lifi/widget";
import { ChainType } from "@lifi/widget";

const widgetConfig: WidgetConfig = {
  // set source chain to Polygon
  fromChain: 137,
  // set destination chain to Optimism
  toChain: 10,
  // set source token to USDC (Polygon)
  fromToken: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  // set source token to USDC (Optimism)
  toToken: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  // set source token amount to 10 USDC (Polygon)
  fromAmount: 10,
  // set the destination wallet address
  toAddress: {
    address: "0x29DaCdF7cCaDf4eE67c923b4C22255A4B2494eD7",
    chainType: ChainType.EVM,
  },
};

export const WidgetPage = () => {
  return (
    <LiFiWidget integrator="Your dApp/company name" config={widgetConfig} />
  );
};


```

--------------------------------

### GET /websites/li_fi

Source: https://docs.li.fi/api-reference/get-a-list-of-filtered-transfers

Retrieves a list of transfers filtered by certain properties. The response is limited to a maximum of 1000 transfers.

```APIDOC
## GET /websites/li_fi

### Description
This endpoint can be used to retrieve a list of transfers filtered by certain properties. Returns a maximum of 1000 transfers.

### Method
GET

### Endpoint
/websites/li_fi

### Parameters
#### Query Parameters
- **status** (string) - Optional - Filter transfers by their status (e.g., 'pending', 'completed', 'failed').
- **startDate** (string) - Optional - Filter transfers that started on or after this date (YYYY-MM-DD).
- **endDate** (string) - Optional - Filter transfers that ended on or before this date (YYYY-MM-DD).
- **limit** (integer) - Optional - The maximum number of transfers to return (default is 1000).

### Request Example
GET /websites/li_fi?status=completed&startDate=2023-01-01

### Response
#### Success Response (200)
- **transfers** (array) - A list of transfer objects.
  - **id** (string) - The unique identifier for the transfer.
  - **amount** (number) - The amount of the transfer.
  - **currency** (string) - The currency of the transfer.
  - **status** (string) - The current status of the transfer.
  - **createdAt** (string) - The timestamp when the transfer was created.

#### Response Example
{
  "transfers": [
    {
      "id": "txn_123abc",
      "amount": 100.50,
      "currency": "USD",
      "status": "completed",
      "createdAt": "2023-10-27T10:00:00Z"
    }
  ]
}
```

--------------------------------

### Request Specific Token Details

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Retrieves detailed information about a specific token on a given chain, identified by chain ID and token identifier. This provides comprehensive data for a particular token.

```JS
curl --request GET \
     --url 'https://li.quest/v1/token?chain=20000000000001&token=bitcoin' \
     --header 'accept: application/json'
```

--------------------------------

### Get Routes for Token Transfer

Source: https://docs.li.fi/api-reference/advanced/get-a-set-of-routes-for-a-request-that-describes-a-transfer-of-tokens

Retrieves a set of possible routes for executing a token transfer. After obtaining the routes, you can select one and proceed to execute each step of the selected route.

```APIDOC
## GET /websites/li_fi/routes

### Description
Retrieves a set of possible routes for executing a token transfer. After obtaining the routes, you can select one and proceed to execute each step of the selected route.

### Method
GET

### Endpoint
/websites/li_fi/routes

### Parameters
#### Query Parameters
- **fromAmount** (string) - Required - The amount of tokens to transfer.
- **fromChain** (string) - Required - The chain the tokens are being transferred from.
- **fromToken** (string) - Required - The token being transferred.
- **toChain** (string) - Required - The chain the tokens are being transferred to.
- **toToken** (string) - Required - The token being received.
- **options.excludeProtocols** (array) - Optional - A list of protocols to exclude from the routes.

### Request Example
```json
{
  "fromAmount": "1000000000000000000",
  "fromChain": "eth",
  "fromToken": "0x1111111111111111111111111111111111111111",
  "toChain": "polygon",
  "toToken": "0x2222222222222222222222222222222222222222",
  "options": {
    "excludeProtocols": ["uniswap_v2"]
  }
}
```

### Response
#### Success Response (200)
- **routes** (array) - A list of available routes for the token transfer.
  - **id** (string) - The unique identifier for the route.
  - **steps** (array) - A list of steps required to execute the transfer using this route.
    - **type** (string) - The type of step (e.g., `swap`, `bridge`).
    - **action** (object) - Details about the action to be performed in the step.
    - **estimate** (object) - Estimated gas costs and time for the step.
    - **message** (string) - A descriptive message for the step.

#### Response Example
```json
{
  "routes": [
    {
      "id": "route_1",
      "steps": [
        {
          "type": "swap",
          "action": {
            "fromChain": "eth",
            "toChain": "polygon",
            "fromToken": "0x1111111111111111111111111111111111111111",
            "toToken": "0x2222222222222222222222222222222222222222",
            "fromAmount": "1000000000000000000",
            "toAmount": "950000000000000000",
            "contractAddress": "0x3333333333333333333333333333333333333333",
            "data": "0x..."
          },
          "estimate": {
            "gasCosts": [
              {
                "amount": "100000",
                "token": "0x710c54958f11d685e79c5f17e33b2d47d6b7795a",
                "chainId": "1",
                "tokenAmount": "0.001"
              }
            ],
            "time": 120
          },
          "message": "Swap tokens on Uniswap"
        }
      ]
    }
  ]
}
```
```

--------------------------------

### Get Available Tokens

Source: https://docs.li.fi/sdk/token-management

Retrieves a list of all available tokens on specified chains. Supports filtering by chain IDs and chain types.

```APIDOC
## Get Available Tokens

### Description
Retrieves a list of all available tokens on specified chains.

### Method
GET

### Endpoint
/tokens

### Parameters
#### Query Parameters
- **params** (TokensRequest, optional) - Configuration for the requested tokens.
  - **chains** (ChainId[], optional) - List of chain IDs or keys. If not specified, returns tokens on all available chains.
  - **chainTypes** (ChainType[], optional) - List of chain types.
- **options** (RequestOptions, optional) - Additional request options.

### Response
#### Success Response (200)
- **tokens** (TokensResponse) - A response object containing lists of tokens.

### Request Example
```typescript
import { ChainType, getTokens } from '@lifi/sdk';

try {
  const tokens = await getTokens({
    chainTypes: [ChainType.EVM, ChainType.SVM],
  });
  console.log(tokens);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### GET /v1/tokens

Source: https://docs.li.fi/api-reference/fetch-all-known-tokens

Fetches all tokens known to the LI.FI services. This endpoint can be used to retrieve a comprehensive list of supported tokens across various chains.

```APIDOC
## GET /v1/tokens

### Description
Fetches all tokens known to the LI.FI services. This endpoint can be used to retrieve a comprehensive list of supported tokens across various chains.

### Method
GET

### Endpoint
/v1/tokens

### Parameters
#### Query Parameters
- **chains** (string) - Optional - Restrict the resulting tokens to the given chains.
- **chainTypes** (string) - Optional - Restrict the resulting tokens to the given chainTypes.
- **minPriceUSD** (number) - Optional - Filters results by minimum token price in USD. Minimum value for this parameter is 0. Defaults to 0.0001 USD.

#### Header Parameters
- **x-lifi-api-key** (string) - Optional - Authentication header, contact support if you want to get registered.

### Request Example
```json
{
  "example": "No request body needed for this GET request"
}
```

### Response
#### Success Response (200)
- **1** (array) - The requested tokens. Each token object contains:
  - **address** (string) - Address of the token
  - **symbol** (string) - Symbol of the token
  - **decimals** (number) - Number of decimals the token uses
  - **chainId** (number) - Id of the token's chain
  - **name** (string) - Name of the token
  - **coinKey** (string) - Identifier for the token
  - **logoURI** (string) - Logo of the token
  - **priceUSD** (string) - Token price in USD

#### Response Example
```json
{
  "1": [
    {
      "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      "symbol": "DAI",
      "decimals": 18,
      "chainId": 137,
      "name": "(PoS) Dai Stablecoin",
      "coinKey": "DAI",
      "priceUSD": "1",
      "logoURI": "https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png"
    }
  ]
}
```
```

--------------------------------

### Example Token Data for a Specific Chain

Source: https://docs.li.fi/li.fi-api/li.fi-api/getting-all-possible-connections

This JSON snippet shows token information for tokens on chainId 56 (Binance Smart Chain). It includes details like token address, symbol, name, logo URI, and price in USD.

```json
{
  "address": "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
  "decimals": 18,
  "symbol": "DAI",
  "chainId": 56,
  "coinKey": "DAI",
  "name": "DAI",
  "logoURI": "https://static.debank.com/image/bsc_token/logo_url/0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3/549c4205dbb199f1b8b03af783f35e71.png",
  "priceUSD": "1"
}
```

--------------------------------

### Configure Sui JSON-RPC Wallet Provider (React)

Source: https://docs.li.fi/integrate-li.fi-sdk/configure-sdk-providers

Provides an example of setting up the Sui provider for interacting with user wallets (e.g., Sui Wallet, Ethos) using the @mysten/dapp-kit library. It demonstrates how to pass a `WalletWithRequiredFeatures` instance to the Sui provider, updating the SDK configuration at runtime within a React component.

```typescript
import { Sui, config, createConfig } from '@lifi/sdk';
import { useCurrentWallet } from '@mysten/dapp-kit';
import { useEffect } from 'react';

createConfig({
  integrator: 'Your dApp/company name',
});

export const SDKProviders = () => {
  const { currentWallet } = useCurrentWallet();

  useEffect(() => {
    // Configure Sui SDK provider
    config.setProviders([
      Sui({
        async getWallet() {
          return currentWallet!;
        },
      }),
    ]);
  }, [currentWallet]);

  return null;
};
```

--------------------------------

### getRoutes SDK Method

Source: https://docs.li.fi/introduction/user-flows-and-examples/requesting-route-fetching-quote

Fetches an array of route objects containing essential information to determine the best route for a swap or bridging transfer. Transaction data is not included and must be requested separately.

```APIDOC
## getRoutes SDK Method

### Description
Fetches an array of route objects containing essential information to determine the best route for a swap or bridging transfer. Transaction data is not included and must be requested separately. For a single best option, consider using `getQuote`.

### Method
SDK Function Call

### Endpoint
`getRoutes(routesRequest)`

### Parameters
#### Request Body (routesRequest)
- **fromChainId** (number) - Required - The chain ID of the sending network.
- **toChainId** (number) - Required - The chain ID of the receiving network.
- **fromTokenAddress** (string) - Required - The token address on the sending chain.
- **toTokenAddress** (string) - Required - The token address on the receiving chain.
- **fromAmount** (string) - Required - The amount of the `fromToken` to send.

### Request Example
```typescript
import { getRoutes } from '@lifi/sdk';

const routesRequest = {
  fromChainId: 42161, // Arbitrum
  toChainId: 10, // Optimism
  fromTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  toTokenAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI on Optimism
  fromAmount: '1000000', // 1 USDC
};

const result = await getRoutes(routesRequest);
const routes = result.routes;
```

### Response
#### Success Response
- **routes** (array) - An array of route objects containing essential information for swaps or bridging transfers.

#### Response Example
```json
{
  "routes": [
    {
      "id": "route-example-1",
      "fromAmount": "1000000",
      "toAmount": "998000",
      "fees": [],
      "duration": 120,
      "providerInfos": []
    }
  ]
}
```
```

--------------------------------

### Get Specific Token Details

Source: https://docs.li.fi/more-integration-options/li.fi-api/getting-token-information

Fetches detailed information about a specific token on a given chain, identified by its address or symbol.

```APIDOC
## GET /tokens/{chain}/{token}

### Description
Fetches details about a specific token on a specified chain.

### Method
GET

### Endpoint
/tokens/{chain}/{token}

### Parameters
#### Path Parameters
- **chain** (ChainKey | ChainId) - Required - ID or key of the chain that contains the token.
- **token** (string) - Required - Address or symbol of the token on the requested chain.

#### Query Parameters
- **options** (RequestOptions) - Optional - Additional request options.

### Response
#### Success Response (200)
- **token** (Token) - A Token object containing details about the specified token.

#### Response Example
```json
{
  "chainId": 1,
  "address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
  "symbol": "UNI",
  "name": "Uniswap",
  "decimals": 18,
  "logoURI": "https://..."
}
```
```

--------------------------------

### Timing Preferences for Route Execution

Source: https://docs.li.fi/integrate-li.fi-sdk/request-routes-quotes

Specify preferences for the timing of route execution to optimize performance and reliability.

```APIDOC
## POST /timing

### Description
Specify preferences for the timing of route execution to optimize performance and reliability.

### Method
POST

### Endpoint
/timing

### Parameters
#### Request Body
- **swapStepTimingStrategies** (object[]) - Optional - An array of timing strategies specifically for each swap step in the route.
  - **strategy** (string) - Required - The strategy type, must be set to ‘minWaitTime’.
  - **minWaitTimeMs** (number) - Optional - The minimum wait time in milliseconds before any results are returned.
  - **startingExpectedResults** (number) - Optional - The initial number of expected results.
  - **reduceEveryMs** (number) - Optional - The interval in milliseconds at which the expected results are reduced.
- **routeTimingStrategies** (object[]) - Optional - An array of timing strategies that apply to the entire route.
  - **strategy** (string) - Required - The strategy type, must be set to ‘minWaitTime’.
  - **minWaitTimeMs** (number) - Optional - The minimum wait time in mill before any results are returned.
  - **startingExpectedResults** (number) - Optional - The initial number of expected results.
  - **reduceEveryMs** (number) - Optional - The interval in milliseconds at which the expected results are reduced.

### Request Example
```json
{
  "swapStepTimingStrategies": [
    {
      "strategy": "minWaitTime",
      "minWaitTimeMs": 1000,
      "startingExpectedResults": 5,
      "reduceEveryMs": 200
    }
  ],
  "routeTimingStrategies": [
    {
      "strategy": "minWaitTime",
      "minWaitTimeMs": 500
    }
  ]
}
```

### Response
#### Success Response (200)
- **message** (string) - Confirmation message indicating timing preferences have been set.

#### Response Example
```json
{
  "message": "Timing preferences updated successfully."
}
```
```

--------------------------------

### Website Configuration Parameters

Source: https://docs.li.fi/sdk/request-routes

This section outlines the parameters used to configure Li.Fi websites, such as enabling destination calls and setting preferences for bridges, exchanges, and timing.

```APIDOC
## Website Configuration Parameters

This section outlines parameters related to website configuration within the Li.Fi project.

### Parameters

- **allowDestinationCall** (boolean) - Optional - Specifies whether destination calls are enabled.
- **bridges** (AllowDenyPrefer) - Optional - An `AllowDenyPrefer` object to specify preferences for bridges.
- **exchanges** (AllowDenyPrefer) - Optional - An `AllowDenyPrefer` object to specify preferences for exchanges.
- **timing** (Timing) - Optional - A Timing object to specify preferences for Timing Strategies.
```

--------------------------------

### GET /v1/status

Source: https://docs.li.fi/api-reference/check-the-status-of-a-cross-chain-transfer

Retrieves the status of a cross-chain transaction. This endpoint can be used to track the progress of a transfer initiated through LI.FI.

```APIDOC
## GET /v1/status

### Description
Retrieves the status of a cross-chain transaction. This endpoint can be used to track the progress of a transfer initiated through LI.FI.

### Method
GET

### Endpoint
https://li.quest/v1/status

### Parameters
#### Query Parameters
- **txHash** (string) - Required - The transaction hash on the sending chain, destination chain or lifi step id
- **bridge** (enum<string>) - Optional - The bridging tool used for the transfer. Supported values: hop, cbridge, celercircle, optimism, polygon, arbitrum, avalanche, across, gnosis, omni, relay, celerim, symbiosis, thorswap, squid, allbridge, mayan, debridge, relay, chainflip
- **fromChain** (string) - Optional - The sending chain. Can be the chain id or chain key
- **toChain** (string) - Optional - The receiving chain. Can be the chain id or chain key

#### Header Parameters
- **x-lifi-api-key** (string) - Optional - Authentication header, contact support if you want to get registered.

### Response
#### Success Response (200)
- **sending** (object) - The transaction on the sending chain.
- **receiving** (object) - The transaction on the receiving chain.
- **feeCosts** (array) - An array of fee costs for the transaction.
  - **name** (string)
  - **description** (string)
  - **percentage** (string)
  - **token** (object)
    - **address** (string)
    - **decimals** (number)
    - **symbol** (string)
    - **chainId** (number)
    - **coinKey** (string)
    - **name** (string)
    - **logoURI** (string)
  - **amount** (string)
  - **amountUSD** (string)
  - **included** (boolean)
- **status** (string) - The current status of the transfer. Possible values: NOT_FOUND, INVALID, PENDING, DONE, FAILED
- **substatus** (string) - A more specific substatus. Available for PENDING and DONE statuses. More information can be found here: https://docs.li.fi/more-integration-options/li.fi-api/checking-the-status-of-a-transaction
- **substatusMessage** (string)

#### Response Example
```json
{
  "sending": {
    "txHash": "0x123abc",
    "chainId": 1,
    "status": "DONE"
  },
  "receiving": {
    "txHash": "0x456def",
    "chainId": 137,
    "status": "PENDING"
  },
  "feeCosts": [
    {
      "name": "Bridge Fee",
      "description": "Fee charged by the bridge provider",
      "percentage": "0.1%",
      "token": {
        "address": "0x...",
        "decimals": 18,
        "symbol": "USDC",
        "chainId": 1,
        "coinKey": "usdc",
        "name": "USD Coin",
        "logoURI": "https://..."
      },
      "amount": "1.0",
      "amountUSD": "1.0",
      "included": true
    }
  ],
  "status": "PENDING",
  "substatus": "WAIT_SOURCE_CONFIRMATIONS",
  "substatusMessage": "Waiting for confirmations on the source chain."
}
```
```

--------------------------------

### LI.FI SDK Initialization Parameters

Source: https://docs.li.fi/sdk/configure-sdk

This section outlines the various parameters that can be used to configure the LI.FI SDK during its initialization. These parameters control how the SDK interacts with the LI.FI API and manages chain data.

```APIDOC
## LI.FI SDK Initialization Parameters

### Description
This section details the parameters used for configuring the LI.FI SDK. These settings allow for customization of API interaction, partner identification, and data management.

### Method
SDK Initialization (Conceptual)

### Endpoint
N/A (SDK Initialization)

### Parameters
#### Query Parameters
- **integrator** (string) - Required - LI.FI SDK requires an integrator option to identify partners and allows them to monitor their activity on the partner dashboard, such as the transaction volume, enabling better management and support. Usually, the integrator option is your dApp or company name. This string must consist only of letters, numbers, hyphens, underscores, and dots and be a maximum of 23 characters long.
- **apiKey** (string) - Optional - Unique API key for accessing LI.FI API services. Necessary for higher rate limits.
- **apiUrl** (string) - Optional - The base URL for the LI.FI API. Defaults to `https://li.quest/v1`. Can be changed to the staging environment for testing.
- **userId** (string) - Optional - A unique identifier for the user of your application. Used to track user-specific data and interactions.
- **routeOptions** (object) - Optional - Custom options for routing, applied when using `getQuote`, `getRoutes`, and `getContractCallsQuote` endpoints. Can be configured during initialization or passed per function call.
- **rpcUrls** (object) - Optional - A mapping of chain IDs to arrays of RPC URLs. Used for transaction execution and data retrieval.
- **chains** (array) - Optional - An array of chains that the SDK will support. Each chain must be configured with necessary details like chain ID, name, RPCs, etc. If not provided, chains are fetched from the LI.FI API during initialization.
- **preloadChains** (boolean) - Optional - A flag indicating whether to preload chain configurations. Defaults to `true`. If `true`, chain details are loaded during initialization.

### Request Example
```json
{
  "integrator": "my-dapp",
  "apiKey": "your-api-key",
  "apiUrl": "https://li.quest/v1",
  "userId": "user-123",
  "routeOptions": {
    "fee": "0.001"
  },
  "rpcUrls": {
    "1": ["https://mainnet.infura.io/v3/your-infura-id"]
  },
  "chains": [
    {
      "id": 1,
      "name": "Ethereum",
      "nativeCurrency": {"symbol": "ETH", "name": "Ethereum"},
      "rpc": ["https://mainnet.infura.io/v3/your-infura-id"],
      "explorers": ["https://etherscan.io"]
    }
  ],
  "preloadChains": true
}
```

### Response
#### Success Response (200)
N/A (SDK Initialization - no direct API response for initialization itself)

#### Response Example
N/A
```

--------------------------------

### Get Available Tokens

Source: https://docs.li.fi/more-integration-options/li.fi-api/getting-token-information

Retrieves a list of all available tokens on specified chains. This function can be configured with specific chain IDs or types.

```APIDOC
## GET /tokens

### Description
Retrieves a list of all available tokens on specified chains. Can be filtered by `chains` and `chainTypes`.

### Method
GET

### Endpoint
/tokens

### Parameters
#### Query Parameters
- **chains** (ChainId[]) - Optional - List of chain IDs or keys. If not specified, returns tokens on all available chains.
- **chainTypes** (ChainType[]) - Optional - List of chain types.
- **options** (RequestOptions) - Optional - Additional request options.

### Response
#### Success Response (200)
- **tokens** (TokensResponse) - A list of available tokens.

#### Response Example
```json
{
  "tokens": [
    {
      "chainId": 1,
      "address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      "symbol": "UNI",
      "name": "Uniswap",
      "decimals": 18,
      "logoURI": "https://..."
    }
  ]
}
```
```

--------------------------------

### Accessing Transaction Hashes

Source: https://docs.li.fi/integrate-li.fi-sdk/execute-routes-quotes

This example demonstrates how to access and log transaction hashes for each process within a route's steps. It's useful for tracking transaction progress during route execution.

```APIDOC
## Access Transaction Hashes

### Description
This function iterates through the steps and processes of a route to extract and log any available transaction hashes.

### Method
`getTransactionLinks(route: RouteExtended)`

### Endpoint
N/A (Client-side function)

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
```javascript
const getTransactionLinks = (route: RouteExtended) => {
  route.steps.forEach((step, index) => {
    step.execution?.process.forEach((process) => {
      if (process.txHash) {
        console.log(
          `Transaction Hash for Step ${index + 1}, Process ${process.type}:`,
          process.txHash
        )
      }
    })
  })
}

const executedRoute = await executeRoute(route, {
  updateRouteHook(route) {
    getTransactionLinks(route)
  },
})
```

### Response
N/A (Logs transaction hashes to the console)

#### Success Response (200)
N/A

#### Response Example
```
Transaction Hash for Step 1, Process SWAP:
0xabc123...
```
```

--------------------------------

### Connect Wallet Button with External Wallet (RainbowKit)

Source: https://docs.li.fi/integrate-li.fi-widget/wallet-management

Configure the `Connect wallet` button to trigger an external wallet menu using the `onConnect` option. This example demonstrates integrating with RainbowKit by calling `openConnectModal` when the button is clicked. It utilizes the `useConnectModal` hook and `LiFiWidget` from the `@lifi/widget` and `@rainbow-me/rainbowkit` libraries.

```typescript
import { LiFiWidget } from "@lifi/widget";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { WalletProvider } from "../providers/WalletProvider";

export const WidgetPage = () => {
  const { openConnectModal } = useConnectModal();
  return (
    <WalletProvider>
      <LiFiWidget
        integrator="wagmi-example"
        config={{
          walletConfig: {
            onConnect() {
              openConnectModal?.();
            },
          },
        }}
      />
    </WalletProvider>
  );
};

```

--------------------------------

### GET /analytics/transfers/summary

Source: https://docs.li.fi/api-reference/get-the-total-amount-of-a-token-received-on-a-specific-chain-for-cross-chain-transfers

Retrieves a summary of transfers, including total received amount and details about the receiving address and sending chain ID.

```APIDOC
## GET /analytics/transfers/summary

### Description
Retrieves a summary of transfers, including total received amount and details about the receiving address and sending chain ID.

### Method
GET

### Endpoint
/v1/analytics/transfers/summary

### Parameters
#### Query Parameters
- **toAddress** (string) - Optional - The address in the receiving side of the transfer.
- **sendingChainId** (number) - Optional - The ID of the chain the transfer was sent from.

### Request Example
```json
{
  "toAddress": "0x123...",
  "sendingChainId": 1
}
```

### Response
#### Success Response (200)
- **toAddress** (string) - The address in the receiving side of the transfer.
- **sendingChainId** (number) - The ID of the chain the transfer was sent from.
- **totalReceivedAmount** (number) - The cumulative amount of token received.

#### Response Example
```json
{
  "toAddress": "0x123...",
  "sendingChainId": 1,
  "totalReceivedAmount": 1000000
}
```
```

--------------------------------

### Compare LI.FI SDK v2 and v3 getQuote Functionality

Source: https://docs.li.fi/sdk/migrate-v2-to-v3

Demonstrates the difference in how the `getQuote` function is called between SDK v2 (class-based instance) and SDK v3 (function-based import). SDK v3 simplifies configuration by removing the need for a class instance.

```typescript
// SDK v2
import { ChainId, LiFi } from '@lifi/sdk'

const lifi = new LiFi({
  integrator: 'Your dApp/company name'
})

const quote = await lifi.getQuote({
  fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  fromChain: ChainId.ARB,
  toChain: ChainId.OPT,
  fromToken: '0x0000000000000000000000000000000000000000',
  toToken: '0x0000000000000000000000000000000000000000',
  fromAmount: '1000000000000000000',
})

// SDK v3
import { ChainId, createConfig, getQuote } from '@lifi/sdk'

createConfig({
  integrator: 'Your dApp/company name',
})

const quote = await getQuote({
  fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  fromChain: ChainId.ARB,
  toChain: ChainId.OPT,
  fromToken: '0x0000000000000000000000000000000000000000',
  toToken: '0x0000000000000000000000000000000000000000',
  fromAmount: '1000000000000000000',
})
```

--------------------------------

### GET /websites/li_fi

Source: https://docs.li.fi/api-reference/get-integrators-collected-fees-data-for-all-supported-chains

Retrieves all integrator's collected fees data by tokens for all supported chains. The response includes the integrator ID and an array of fee balances for each supported chain.

```APIDOC
## GET /websites/li_fi

### Description
This endpoint can be used to request all integrator's collected fees data by tokens for all supported chains.
The endpoint returns an `Integrator` object which contains the integrator id and an array of fee balances for all supported chains.

### Method
GET

### Endpoint
/websites/li_fi

### Parameters

#### Query Parameters

* **integrator_id** (string) - Required - The unique identifier for the integrator.
* **chain_id** (string) - Optional - The identifier for a specific chain to filter results.

### Request Example
```
GET /websites/li_fi?integrator_id=your_integrator_id&chain_id=ethereum
```

### Response

#### Success Response (200)
- **integrator_id** (string) - The ID of the integrator.
- **fee_balances** (array) - An array of objects, where each object represents fee balances for a specific chain and token.
  - **chain_id** (string) - The identifier for the chain.
  - **token_address** (string) - The address of the token for which fees were collected.
  - **amount** (string) - The collected fee amount.

#### Response Example
```json
{
  "integrator_id": "your_integrator_id",
  "fee_balances": [
    {
      "chain_id": "ethereum",
      "token_address": "0x123...",
      "amount": "1000000000000000000"
    },
    {
      "chain_id": "polygon",
      "token_address": "0x456...",
      "amount": "500000000000000000"
    }
  ]
}
```
```

--------------------------------

### GET /v1/status

Source: https://docs.li.fi/li.fi-api/li.fi-api/status-of-a-transaction

Retrieves the status of a cross-chain transfer. This endpoint is used to check the progress and details of a transfer that has been initiated.

```APIDOC
## GET /v1/status

### Description
Retrieves the status of a cross-chain transfer. This endpoint is used to check the progress and details of a transfer that has been initiated.

### Method
GET

### Endpoint
/v1/status

### Parameters
#### Query Parameters
* **transactionId** (string) - Required - The unique identifier for the cross-chain transaction.

### Request Example
```bash
curl --request GET \
  --url https://li.quest/v1/status?transactionId=0x5e9bd1e1232bcfb28e660ce116fe910aa058345604334e5f560034f51ef5327c
```

### Response
#### Success Response (200)
- **transactionId** (string) - The unique ID of the transaction.
- **sending** (object) - Details about the sending side of the transaction.
  - **txHash** (string) - The transaction hash on the sending chain.
  - **txLink** (string) - A link to the transaction on a block explorer.
  - **amount** (string) - The amount of the token being sent.
  - **token** (object) - Information about the token being sent.
    - **address** (string) - The token contract address.
    - **chainId** (integer) - The chain ID where the token is being sent from.
    - **symbol** (string) - The token symbol.
    - **decimals** (integer) - The token's decimal places.
    - **name** (string) - The token's name.
    - **coinKey** (string) - A key representing the coin.
    - **logoURI** (string) - URI for the token's logo.
    - **priceUSD** (string) - The current price of the token in USD.
  - **chainId** (integer) - The chain ID of the sending network.
  - **gasPrice** (string) - The gas price for the transaction.
  - **gasUsed** (string) - The amount of gas used by the transaction.
  - **gasToken** (object) - Information about the gas token.
  - **gasAmount** (string) - The total gas amount.
  - **gasAmountUSD** (string) - The USD value of the gas used.
  - **amountUSD** (string) - The USD value of the amount sent.
  - **value** (string) - The value of the transaction in wei.
  - **includedSteps** (array) - An array of steps included in the transfer.
  - **timestamp** (integer) - The timestamp of the transaction.
- **receiving** (object) - Details about the receiving side of the transaction.
  - **txHash** (string) - The transaction hash on the receiving chain.
  - **txLink** (string) - A link to the transaction on a block explorer.
  - **amount** (string) - The amount of the token received.
  - **token** (object) - Information about the token received.
  - **chainId** (integer) - The chain ID of the receiving network.
  - **gasPrice** (string) - The gas price for the transaction.
  - **gasUsed** (string) - The amount of gas used by the transaction.
  - **gasToken** (object) - Information about the gas token.
  - **gasAmount** (string) - The total gas amount.
  - **gasAmountUSD** (string) - The USD value of the gas used.
  - **amountUSD** (string) - The USD value of the amount received.
  - **value** (string) - The value of the transaction in wei.
  - **includedSteps** (array) - An array of steps included in the transfer.
  - **timestamp** (integer) - The timestamp of the transaction.
- **feeCosts** (array) - An array of fee costs associated with the transfer.
  - **name** (string) - The name of the fee.
  - **description** (string) - A description of the fee.
  - **percentage** (string) - The fee as a percentage.
  - **token** (object) - Information about the token used for the fee.
  - **amount** (string) - The amount of the fee.
  - **amountUSD** (string) - The USD value of the fee.
  - **included** (boolean) - Whether the fee was included in the transfer.

#### Response Example
```json
{
  "transactionId": "0x5e9bd1e1232bcfb28e660ce116fe910aa058345604334e5f560034f51ef5327c",
  "sending": {
    "txHash": "0xe1ffdcf09d5aa92a2d89b1b39db3f8cadf09428a296cce0d5e387595ac83d08f",
    "txLink": "https://arbiscan.io/tx/0xe1ffdcf09d5aa92a2d89b1b39db3f8cadf09428a296cce0d5e387595ac83d08f",
    "amount": "129486280",
    "token": {
      "address": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      "chainId": 42161,
      "symbol": "USDT",
      "decimals": 6,
      "name": "USDT",
      "coinKey": "USDT",
      "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
      "priceUSD": "1.00074"
    },
    "chainId": 42161,
    "gasPrice": "10000000",
    "gasUsed": "477174",
    "gasToken": {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 42161,
      "symbol": "ETH",
      "decimals": 18,
      "name": "ETH",
      "coinKey": "ETH",
      "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
      "priceUSD": "3166.21"
    },
    "gasAmount": "4771740000000",
    "gasAmountUSD": "0.0151",
    "amountUSD": "129.5821",
    "value": "11551536072923",
    "includedSteps": [
      {
        "tool": "gasZip",
        "toolDetails": {
          "key": "gasZip",
          "name": "LI.Fuel",
          "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/lifi.svg"
        },
        "fromAmount": "129486280",
        "fromToken": {
          "address": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
          "chainId": 42161,
          "symbol": "USDT",
          "decimals": 6,
          "name": "USDT",
          "coinKey": "USDT",
          "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
          "priceUSD": "1.00074"
        },
        "toToken": {
          "address": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
          "chainId": 42161,
          "symbol": "USDT",
          "decimals": 6,
          "name": "USDT",
          "coinKey": "USDT",
          "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
          "priceUSD": "1.00074"
        },
        "toAmount": "128671479",
        "bridgedAmount": "128671479"
      }
    ],
    "timestamp": 1729163645
  },
  "receiving": {
    "txHash": "0xd3142ffb0abaefd030e9c108d6fedcd9b5bab9099346531b54f370762301bb4e",
    "txLink": "https://taikoscan.io/tx/0xd3142ffb0abaefd030e9c108d6fedcd9b5bab9099346531b54f370762301bb4e",
    "amount": "128671479",
    "token": {
      "address": "0x9c2dc7377717603eB92b2655c5f2E7997a4945BD",
      "chainId": 167000,
      "symbol": "USDT(Stargate)",
      "decimals": 6,
      "name": "Tether USD",
      "coinKey": "USDT",
      "logoURI": "https://static.debank.com/image/coin/logo_url/usdt/23af7472292cb41dc39b3f1146ead0fe.png",
      "priceUSD": "1.00074"
    },
    "chainId": 167000,
    "gasPrice": "60000001",
    "gasUsed": "109839",
    "gasToken": {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 167000,
      "symbol": "ETH",
      "decimals": 18,
      "name": "ETH",
      "coinKey": "ETH",
      "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
      "priceUSD": "3166.21"
    },
    "gasAmount": "6590340109839",
    "gasAmountUSD": "0.0209",
    "amountUSD": "128.7667",
    "value": "0",
    "includedSteps": [],
    "timestamp": 1729164251
  },
  "feeCosts": [
    {
      "name": "Relay fee",
      "description": "The fee required to pay for the relay on the receiving chain",
      "percentage": "0.6802",
      "token": {
        "chainId": 42161,
        "address": "0x0000000000000000000000000000000000000000",
        "symbol": "ETH",
        "decimals": 18,
        "name": "ETH",
        "coinKey": "ETH",
        "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
        "priceUSD": "2616.99"
      },
      "amount": "2100002100000",
      "amountUSD": "0.0055",
      "included": true
    },
    {
      "name": "LayerZero native fee",
      "description": "protocol native fee",
      "percentage": "0.0002",
      "token": {
        "chainId": 42161,
        "address": "0x0000000000000000000000000000000000000000",
        "symbol": "ETH",
        "decimals": 18,
        "name": "ETH",
        "coinKey": "ETH",
        "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
        "priceUSD": "2616.99"
      },
      "amount": "2800000000000",
      "amountUSD": "0.0074",
      "included": true
    }
  ]
}
```
```

--------------------------------

### Route Configuration Parameters

Source: https://docs.li.fi/api-reference/advanced/get-a-set-of-routes-for-a-request-that-describes-a-transfer-of-tokens

This section details the various parameters available for configuring route generation and selection within the LIFI SDK.

```APIDOC
## Route Configuration Parameters

### Description

This endpoint (or configuration object) allows for detailed customization of how LIFI routes are generated, prioritized, and executed. It covers aspects like slippage tolerance, bridge and exchange preferences, ordering, and chain switching.

### Method

N/A (Configuration Object)

### Endpoint

N/A (Configuration Object)

### Parameters

#### Request Body

- **slippage** (number) - Optional - The maximum allowed slippage. Format: double.
- **bridges** (object) - Optional - Object configuring the bridges that should or should not be taken into consideration for the possibilities.
  - **allow** (array of strings) - Optional - List of bridges to allow. Default: `["all"]`.
  - **deny** (array of strings) - Optional - List of bridges to deny.
  - **prefer** (array of strings) - Optional - List of bridges to prefer.
- **exchanges** (object) - Optional - Object configuring the exchanges that should or should not be taken into consideration for the possibilities.
  - **allow** (array of strings) - Optional - List of exchanges to allow. Default: `["all"]`.
  - **deny** (array of strings) - Optional - List of exchanges to deny.
  - **prefer** (array of strings) - Optional - List of exchanges to prefer.
- **order** (string) - Optional - The way the resulting routes should be ordered. Enum: `FASTEST`, `CHEAPEST`.
- **allowSwitchChain** (boolean) - Optional - Whether chain switches should be allowed in the routes. Default: `false`.
- **allowDestinationCall** (boolean) - Optional - Defines if we should return routes with a cross-chain bridge protocol (Connext, etc.) destination calls or not. Default: `true`.
- **referrer** (string) - Optional - Integrators can set a wallet address as referrer to track them.
- **fee** (number) - Optional - The percent of the integrator's fee that is taken from every transaction. The maximum fee amount should be less than 100%. Range: 0 to 1 (exclusive of 1). Format: double.
- **maxPriceImpact** (number) - Optional - The price impact threshold above which routes are hidden. Example: `0.15` for 15%. Default: `0.1` (10%). Format: double.
- **timing** (object) - Optional - Timing settings for route generation and swaps.
  - **swapStepTimingStrategies** (array of objects) - Optional - Timing setting to wait for a certain amount of swap rates. Please check [docs.li.fi](https://docs.li.fi) for more details.
    - **strategy** (string) - Required - Enum: `minWaitTime`.
    - **minWaitTimeMs** (number) - Optional - Minimum wait time in milliseconds. Range: 0 to 15000.
    - **startingExpectedResults** (number) - Optional - Number of expected results to start with. Range: 0 to 100.
    - **reduceEveryMs** (number) - Optional - Reduction in wait time in milliseconds. Range: 0 to 15000.
  - **routeTimingStrategies** (array of objects) - Optional - Timing setting to wait for a certain amount of routes to be generated before choosing the best one. Please check [docs.li.fi](https://docs.li.fi) for more details.
    - **strategy** (string) - Required - Enum: `minWaitTime`.
    - **minWaitTimeMs** (number) - Optional - Minimum wait time in milliseconds. Range: 0 to 15000.
    - **startingExpectedResults** (number) - Optional - Number of expected results to start with. Range: 0 to 100.
    - **reduceEveryMs** (number) - Optional - Reduction in wait time in milliseconds. Range: 0 to 15000.

### Request Example

```json
{
  "integrator": "fee-demo",
  "slippage": 0.003,
  "fee": 0.02,
  "bridges": {
    "allow": [
      "relay"
    ]
  },
  "exchanges": {
    "allow": [
      "1inch",
      "openocean"
    ]
  },
  "maxPriceImpact": 0.1
}
```

### Response

N/A (This is a configuration object, not an endpoint returning data.)
```

--------------------------------

### GET /v1/gas/suggestion/{chain}

Source: https://docs.li.fi/api-reference/get-a-gas-suggestion-for-the-specified-chain

Retrieves gas price suggestions for a specified chain. It can also provide information on the amount of a specific token needed to cover the suggested gas amount if `fromChain` and `fromToken` are provided.

```APIDOC
## GET /v1/gas/suggestion/{chain}

### Description
Retrieves gas price suggestions for a specified chain. It can also provide information on the amount of a specific token needed to cover the suggested gas amount if `fromChain` and `fromToken` are provided.

### Method
GET

### Endpoint
`/v1/gas/suggestion/{chain}`

### Parameters
#### Path Parameters
- **chain** (string) - Required - Chain from which gas prices should be shown (can be a chain id or a chain key)

#### Query Parameters
- **fromChain** (string) - Optional - If `fromChain` and `fromToken` are specified, the result will contain information about how much `fromToken` amount the user has to send to receive the suggested gas amount on the requested chain.
- **fromToken** (string) - Optional - If `fromChain` and `fromToken` are specified, the result will contain information about how much `fromToken` amount the user has to send to receive the suggested gas amount on the requested chain.

#### Headers
- **x-lifi-api-key** (string) - Optional - Authentication header, contact support if you want to get registered.

### Request Example
```json
{
  "example": "request body"
}
```

### Response
#### Success Response (200)
- **available** (boolean) - Indicates if gas suggestions are available for the chain.
- **recommended** (object) - Recommended gas amount details.
  - **token** (object) - Details of the token for the recommended gas amount.
    - **address** (string) - Token contract address.
    - **chainId** (integer) - Chain ID where the token exists.
    - **symbol** (string) - Token symbol.
    - **decimals** (integer) - Token decimal places.
    - **name** (string) - Token name.
    - **priceUSD** (string) - Current price of the token in USD.
    - **logoURI** (string) - URI for the token's logo.
    - **coinKey** (string) - Unique key for the coin.
  - **amount** (string) - The recommended gas amount.
  - **amountUsd** (string) - The recommended gas amount in USD.
- **limit** (object) - Maximum gas amount details.
  - **token** (object) - Details of the token for the limit gas amount.
    - **address** (string) - Token contract address.
    - **chainId** (integer) - Chain ID where the token exists.
    - **symbol** (string) - Token symbol.
    - **decimals** (integer) - Token decimal places.
    - **name** (string) - Token name.
    - **priceUSD** (string) - Current price of the token in USD.
    - **logoURI** (string) - URI for the token's logo.
    - **coinKey** (string) - Unique key for the coin.
  - **amount** (string) - The limit gas amount.
  - **amountUsd** (string) - The limit gas amount in USD.
- **fromToken** (object) - Details of the token provided in the `fromToken` query parameter.
  - **address** (string) - Token contract address.
  - **symbol** (string) - Token symbol.
  - **decimals** (integer) - Token decimal places.
  - **chainId** (integer) - Chain ID where the token exists.
  - **name** (string) - Token name.
  - **coinKey** (string) - Unique key for the coin.
  - **priceUSD** (string) - Current price of the token in USD.
  - **logoURI** (string) - URI for the token's logo.
- **fromAmount** (string) - The amount of `fromToken` that needs to be sent.

#### Response Example
```json
{
  "available": true,
  "recommended": {
    "token": {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 137,
      "symbol": "MATIC",
      "decimals": 18,
      "name": "MATIC",
      "priceUSD": "1.219821",
      "logoURI": "https://static.debank.com/image/matic_token/logo_url/matic/6f5a6b6f0732a7a235131bd7804d357c.png",
      "coinKey": "MATIC"
    },
    "amount": "190510922050970750",
    "amountUsd": "0.23"
  },
  "limit": {
    "token": {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 137,
      "symbol": "MATIC",
      "decimals": 18,
      "name": "MATIC",
      "priceUSD": "1.219821",
      "logoURI": "https://static.debank.com/image/matic_token/logo_url/matic/6f5a6b6f0732a7a235131bd7804d357c.png",
      "coinKey": "MATIC"
    },
    "amount": "1639584824330782959",
    "amountUsd": "2"
  },
  "fromToken": {
    "address": "eth",
    "symbol": "ETH",
    "decimals": 18,
    "chainId": 1,
    "name": "ETH",
    "coinKey": "ETH",
    "priceUSD": "1622.39",
    "logoURI": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png"
  },
  "fromAmount": "141766159801281"
}
```
```

--------------------------------

### Optimizing Response Timing: Timing Strategies

Source: https://docs.li.fi/guides/integration-tips/latency

Configure timing strategies to control how long LI.FI waits for results from various providers.

```APIDOC
## Selecting Timing Strategies

### Description

LI.FI allows you to control response times by configuring timing strategies. These strategies define how long the system waits for results from multiple tools (bridges, DEXes) before returning the best available options.

Timing strategies are applied in two ways:
- `swapStepTimingStrategies`: Applied when requesting same-chain exchanges.
- `routeTimingStrategies`: Applied on the full route, which can consist of multiple tools (e.g., swap + bridge).

### Timing Strategy Format

A timing strategy consists of the following properties:

```json
{
  "strategy": "minWaitTime",
  "minWaitTimeMs": 600,
  "startingExpectedResults": 4,
  "reduceEveryMs": 300
}
```

- **strategy** (string) - Currently only `minWaitTime` is supported.
- **minWaitTimeMs** (integer) - The minimum time to wait for responses in milliseconds (e.g., 600ms).
- **startingExpectedResults** (integer) - The number of expected quotes to receive before considering returning results (e.g., 4).
- **reduceEveryMs** (integer) - The interval in milliseconds at which the expected number of results is reduced if fewer than the starting amount are received (e.g., every 300ms).

**Example Explanation:** With `minWaitTimeMs: 600`, `startingExpectedResults: 4`, and `reduceEveryMs: 300`, the system waits 600ms. If 4 or more results are received, they are returned. If fewer than 4 are received, the system waits another 300ms, then checks if at least 3 results are present. This continues until a condition is met or all providers have responded.

### Passing Strategies in API Calls

#### POST `/v1/advanced/routes` Request Body

```json
{
  "...": "...",
  "options": {
    "timing": {
      "swapStepTimingStrategies": [
        {
          "strategy": "minWaitTime",
          "minWaitTimeMs": 600,
          "startingExpectedResults": 4,
          "reduceEveryMs": 300
        }
      ],
      "routeTimingStrategies": [
        {
          "strategy": "minWaitTime",
          "minWaitTimeMs": 1500,
          "startingExpectedResults": 6,
          "reduceEveryMs": 500
        }
      ]
    }
  }
}
```

#### GET `/v1/quote` Query Parameters

```
/v1/quote?...
  &swapStepTimingStrategies=minWaitTime-600-4-300
  &routeTimingStrategies=minWaitTime-1500-6-500
```

**Note:** The strategies shown in the examples are the default strategies applied by LI.FI.
```

--------------------------------

### GET /v1/connections

Source: https://docs.li.fi/api-reference/returns-all-possible-connections-based-on-a-from-or-tochain

Retrieves a list of possible cross-chain connections based on specified parameters. This endpoint is useful for finding routes for token transfers and swaps across different chains.

```APIDOC
## GET /v1/connections

### Description
Retrieves a list of possible cross-chain connections. This endpoint can be used to find routes for token transfers and swaps across different chains.

### Method
GET

### Endpoint
/v1/connections

### Parameters
#### Query Parameters
- **fromChain** (string) - Optional - The chain that should be the start of the possible connections.
- **toChain** (string) - Optional - The chain that should be the end of the possible connections.
- **fromToken** (string) - Optional - Only return connections starting with this token.
- **toToken** (string) - Optional - Only return connections ending with this token.
- **chainTypes** (string) - Optional - Restrict the resulting tokens to the given chainTypes.
- **allowBridges** (array[string]) - Optional - List of bridges that are allowed for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint.
- **denyBridges** (array[string]) - Optional - List of bridges that are not allowed for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint.
- **preferBridges** (array[string]) - Optional - List of bridges that should be preferred for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint.
- **allowExchanges** (array[string]) - Optional - List of exchanges that are allowed for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint.
- **denyExchanges** (array[string]) - Optional - List of exchanges that are not allowed for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint.
- **preferExchanges** (array[string]) - Optional - List of exchanges that should be preferred for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint.
- **allowSwitchChain** (boolean) - Optional - Whether connections that require chain switch should be included in the response. Defaults to true.
- **allowDestinationCall** (boolean) - Optional - Whether connections that includes destination call should be included in the response. Defaults to true.

#### Header Parameters
- **x-lifi-api-key** (string) - Optional - Authentication header, contact support if you want to get registered.

### Response
#### Success Response (200)
- **connections** (array[Connection]) - The possible connections.

#### Response Example
```json
{
  "connections": [
    {
      "fromChainId": 137,
      "toChainId": 1,
      "fromTokens": [
        {
          "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
          "decimals": 18,
          "symbol": "DAI",
          "chainId": 137
        }
      ]
    }
  ]
}
```
```

--------------------------------

### Get Specific Token Details

Source: https://docs.li.fi/sdk/token-management

Fetches detailed information about a specific token on a given chain, identified by its address or symbol.

```APIDOC
## Get Specific Token Details

### Description
Fetches details about a specific token on a specified chain.

### Method
GET

### Endpoint
/token/{chain}/{token}

### Parameters
#### Path Parameters
- **chain** (ChainKey | ChainId) - Required - ID or key of the chain that contains the token.
- **token** (string) - Required - Address or symbol of the token on the requested chain.

#### Query Parameters
- **options** (RequestOptions, optional) - Additional request options.

### Response
#### Success Response (200)
- **token** (Token) - A Token object containing details about the specified token.

### Request Example
```typescript
import { getToken } from '@lifi/sdk';

const chainId = 1;
const tokenAddress = '0x0000000000000000000000000000000000000000';

try {
  const token = await getToken(chainId, tokenAddress);
  console.log(token);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### Get Token Balance

Source: https://docs.li.fi/integrate-li.fi-sdk/token-management

Returns the balance of a specific token held by a given wallet address. Requires EVM/Solana providers to be configured.

```APIDOC
## GET /balance/:walletAddress/:token

### Description
Returns the balance of a specific token a wallet holds. Ensure EVM/Solana providers are configured.

### Method
GET

### Endpoint
/balance/:walletAddress/:token

### Parameters
#### Path Parameters
- **walletAddress** (string) - Required - The wallet address to check.
- **token** (Token) - Required - A Token object representing the token.

### Response
#### Success Response (200)
- **tokenAmount** (TokenAmount | null) - A TokenAmount object representing the balance, or null if not found.

### Request Example
```javascript
import { getToken, getTokenBalance } from '@lifi/sdk';

const chainId = 1;
const tokenAddress = '0x0000000000000000000000000000000000000000';
const walletAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';

try {
  const token = await getToken(chainId, tokenAddress);
  const tokenBalance = await getTokenBalance(walletAddress, token);
  console.log(tokenBalance);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### GET /websites/li_fi

Source: https://docs.li.fi/api-reference/get-a-paginated-list-of-filtered-transfers

Retrieves information about a specific website or project on the LI.FI platform. This endpoint likely provides details about the project's integration status, supported features, and any relevant identifiers.

```APIDOC
## GET /websites/li_fi

### Description
Retrieves information about a specific website or project on the LI.FI platform. This endpoint likely provides details about the project's integration status, supported features, and any relevant identifiers.

### Method
GET

### Endpoint
/websites/li_fi

### Parameters
#### Query Parameters
- **project** (string) - Required - The identifier for the website or project (e.g., 'li_fi').

### Response
#### Success Response (200)
- **project** (object) - Details about the project.
  - **type** (number) - The type of the project.
  - **coinKey** (string) - The coin key associated with the project.
  - **name** (string) - The name of the project.
  - **logoURI** (string) - The URI for the project's logo.
- **amount** (string) - The amount associated with the transfer.
- **amountUSD** (string) - The amount in USD.
- **included** (boolean) - Indicates if the project is included.
- **status** (string) - The current status of the transfer. Can be `PENDING`, `DONE`, `NOT_FOUND` or `FAILED`.
- **substatus** (string) - A more specific substatus (e.g., `WAIT_SOURCE_CONFIRMATIONS`, `COMPLETED`).
- **substatusMessage** (string) - A message describing the substatus.
- **tool** (string) - The tool used for this transfer.
- **transactionId** (string) - The ID of this transfer (NOT a transaction hash).
- **fromAddress** (string) - The address of the sender.
- **toAddress** (string) - The address of the receiver.
- **lifiExplorerLink** (string) - The link to the LI.FI explorer.
- **metadata** (object) - The transaction metadata.

#### Response Example
```json
{
  "sending": {
    "txHash": "0xd3ad8fb8798d8440f3a1ec7fd51e102a88e4690f9365fad4eff1a17020376b4a",
    "txLink": "https://polygonscan.com/tx/0xd3ad8fb8798d8440f3a1ec7fd51e102a88e4690f9365fad4eff1a17020376b4a",
    "amount": "13000000",
    "token": {
      "address": "0xd69b31c3225728cc57ddaf9be532a4ee1620be51",
      "symbol": "anyUSDC",
      "decimals": 6,
      "chainId": 137,
      "name": "USDC",
      "coinKey": "anyUSDC",
      "priceUSD": "0",
      "logoURI": ""
    },
    "chainId": 137,
    "gasToken": {
      "address": "0x0000000000000000000000000000000000001010",
      "symbol": "MATIC",
      "decimals": 18,
      "chainId": 137,
      "name": "MATIC",
      "coinKey": "MATIC",
      "priceUSD": "0",
      "logoURI": ""
    },
    "gasAmount": "10000",
    "gasAmountUSD": "0.0",
    "gasPrice": "1000",
    "gasUsed": "1000",
    "timestamp": 1720545119,
    "value": "0"
  },
  "receiving": {
    "txHash": "0xba2793065e20835ef60993144d92e6bc1a86529a70e16c357f66ad13774868ad",
    "txLink": "https://bscscan.com/tx/0xba2793065e20835ef60993144d92e6bc1a86529a70e16c357f66ad13774868ad",
    "amount": "12100000000000000000",
    "token": {
      "address": "0x8965349fb649a33a30cbfda057d8ec2c48abe2a2",
      "symbol": "anyUSDC",
      "decimals": 18,
      "chainId": 56,
      "name": "USDC",
      "coinKey": "anyUSDC",
      "priceUSD": "0",
      "logoURI": ""
    },
    "chainId": 56,
    "gasToken": {
      "address": "0x0000000000000000000000000000000000001010",
      "symbol": "BNB",
      "decimals": 18,
      "chainId": 56,
      "name": "BNB",
      "coinKey": "BNB",
      "priceUSD": "0",
      "logoURI": ""
    },
    "gasAmount": "10000",
    "gasAmountUSD": "0.0",
    "gasPrice": "1000",
    "gasUsed": "1000",
    "timestamp": 1720560232,
    "value": "0"
  },
  "tool": "anyswap",
  "status": "DONE",
  "substatus": "COMPLETED",
  "substatusMessage": "The transfer is complete.",
  "transactionId": "0x0000000000000000000000000000000000001010",
  "fromAddress": "0x0000000000000000000000000000000000001010",
  "toAddress": "0x0000000000000000000000000000000000001010",
  "lifiExplorerLink": "https://scan.li.fi/tx/0xd3ad8fb8798d8440f3a1ec7fd51e102a88e4690f9365fad4eff1a17020376b4a",
  "metadata": {
    "integrator": "jumper.exchange"
  }
}
```
```

--------------------------------

### Get gas price

Source: https://docs.li.fi/li.fi-api/li.fi-api/getting-all-possible-connections

Fetches the current gas price for a specified chain ID, essential for estimating transaction costs.

```APIDOC
## GET /websites/li_fi/gas-price

### Description
Fetches the current gas price for a specified chain ID, essential for estimating transaction costs.

### Method
GET

### Endpoint
/websites/li_fi/gas-price

### Parameters
#### Path Parameters
None

#### Query Parameters
- **chainId** (integer) - Required - The ID of the blockchain network for which to retrieve the gas price.

#### Request Body
None

### Request Example
None

### Response
#### Success Response (200)
- **gasPrice** (string) - The current gas price for the specified chain ID.

#### Response Example
```json
{
  "gasPrice": "150000000000"
}
```
```

--------------------------------

### GET /v1/gas/prices/{chainId}

Source: https://docs.li.fi/api-reference/gas/get-gas-price-for-the-specified-chainid

Fetches the most recent gas prices (standard, fast, fastest) for a specified chainId. Includes a timestamp of the last update.

```APIDOC
## GET /v1/gas/prices/{chainId}

### Description
Retrieves the most recent gas prices for a specified chainId, including standard, fast, and fastest options, along with the last update timestamp.

### Method
GET

### Endpoint
/v1/gas/prices/{chainId}

### Parameters
#### Path Parameters
- **chainId** (string) - Required - ChainId from which gas prices should be shown

#### Query Parameters
(No query parameters available)

#### Header Parameters
- **x-lifi-api-key** (string) - Optional - Authentication header, contact support if you want to get registered.

### Request Body
(No request body available)

### Response
#### Success Response (200)
- **standard** (number) - The standard gas price.
- **fast** (number) - The fast gas price.
- **fastest** (number) - The fastest gas price.
- **lastUpdated** (number) - Timestamp of the last update.

#### Response Example
```json
{
  "standard": 123,
  "fast": 123,
  "fastest": 123,
  "lastUpdated": 123
}
```

#### Error Response (400)
- **description**: Invalid Routes Request
- **_mintlify/placeholder** (any) - Placeholder for invalid request information.
```

--------------------------------

### LI.FI API Key Test Endpoint (cURL)

Source: https://docs.li.fi/api-reference/introduction

An example using cURL to test the validity of an LI.FI API key by accessing a dedicated test endpoint. Ensure to replace 'YOUR_CUSTOM_KEY' with your actual API key.

```curl
curl --location 'https://li.quest/v1/keys/test' \
--header 'x-lifi-api-key: YOUR_CUSTOM_KEY'
```

--------------------------------

### GET /v1/status

Source: https://docs.li.fi/li.fi-api/li.fi-api/status-of-a-transaction

Retrieves the status of a cross-chain transfer. While `fromChain`, `toChain`, and `bridge` are optional, providing `fromChain` can optimize the request.

```APIDOC
## GET /v1/status

### Description
Check the status of a cross chain transfer. Cross chain transfers might take a while to complete. Waiting on the transaction on the sending chain doesn’t help here. For this reason we build a simple endpoint that let’s you check the status of your transfer. Important: The endpoint returns a `200` successful response even if the transaction can not be found. This behavior accounts for the case that the transaction hash is valid but the transac has not been mined yet.

### Method
GET

### Endpoint
`https://li.quest/v1/status`

### Parameters
#### Query Parameters
- **fromChain** (string) - Optional - The chain ID of the sending chain. Passing this parameter is encouraged for faster requests.
- **toChain** (string) - Optional - The chain ID of the receiving chain.
- **bridge** (string) - Optional - The name of the bridge used for the transfer.
- **transactionId** (string) - Optional - The ID of the transaction to check.

### Request Example
```json
{
  "query": {
    "fromChain": "42161",
    "toChain": "167000",
    "bridge": "lifi",
    "transactionId": "0x5e9bd1e1232bcfb28e660ce116fe910aa058345604334e5f560034f51ef5327c"
  }
}
```

### Response
#### Success Response (200)
- **transactionId** (string) - The unique identifier for the transfer.
- **sending** (object) - Details about the transaction on the sending chain.
  - **txHash** (string) - The hash of the transaction on the sending chain.
  - **txLink** (string) - A link to the transaction on a block explorer.
  - **amount** (string) - The amount transferred.
  - **token** (object) - Information about the token being transferred.
    - **address** (string) - The token contract address.
    - **chainId** (number) - The chain ID where the token exists.
    - **symbol** (string) - The token symbol.
    - **decimals** (number) - The token's decimal places.
    - **name** (string) - The token's name.
    - **coinKey** (string) - A unique key for the coin.
    - **logoURI** (string) - The URI for the token's logo.
    - **priceUSD** (string) - The current price of the token in USD.
  - **chainId** (number) - The chain ID of the sending chain.
  - **gasPrice** (string) - The gas price for the transaction.
  - **gasUsed** (string) - The amount of gas used.
  - **gasToken** (object) - Information about the gas token.
  - **gasAmount** (string) - The total gas amount.
  - **gasAmountUSD** (string) - The gas amount in USD.
  - **amountUSD** (string) - The transferred amount in USD.
  - **value** (string) - The value of the transaction.
  - **includedSteps** (array) - Steps included in the transfer process.
  - **timestamp** (number) - The timestamp of the transaction.
- **receiving** (object) - Details about the transaction on the receiving chain (if available).
  - **txHash** (string) - The hash of the transaction on the receiving chain.
  - **txLink** (string) - A link to the transaction on a block explorer.
  - **amount** (string) - The amount received.
  - **token** (object) - Information about the token received.
  - **chainId** (number) - The chain ID of the receiving chain.
  - **gasPrice** (string) - The gas price for the transaction.
  - **gasUsed** (string) - The amount of gas used.
  - **gasToken** (object) - Information about the gas token.
  - **gasAmount** (string) - The total gas amount.
  - **gasAmountUSD** (string) - The gas amount in USD.
  - **amountUSD** (string) - The received amount in USD.
  - **value** (string) - The value of the transaction.
  - **includedSteps** (array) - Steps included in the receiving process.
  - **timestamp** (number) - The timestamp of the transaction.
- **feeCosts** (array) - An array of objects detailing the costs associated with the transfer.
  - **name** (string) - The name of the fee (e.g., "Relay fee").
  - **description** (string) - A description of the fee.
  - **percentage** (string) - The fee as a percentage.
  - **token** (object) - Information about the token used for the fee.

#### Response Example
```json
{
  "transactionId": "0x5e9bd1e1232bcfb28e660ce116fe910aa058345604334e5f560034f51ef5327c",
  "sending": {
    "txHash": "0xe1ffdcf09d5aa92a2d89b1b39db3f8cadf09428a296cce0d5e387595ac83d08f",
    "txLink": "https://arbiscan.io/tx/0xe1ffdcf09d5aa92a2d89b1b39db3f8cadf09428a296cce0d5e387595ac83d08f",
    "amount": "129486280",
    "token": {
      "address": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      "chainId": 42161,
      "symbol": "USDT",
      "decimals": 6,
      "name": "USDT",
      "coinKey": "USDT",
      "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
      "priceUSD": "1.00074"
    },
    "chainId": 42161,
    "gasPrice": "10000000",
    "gasUsed": "477174",
    "gasToken": {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 42161,
      "symbol": "ETH",
      "decimals": 18,
      "name": "ETH",
      "coinKey": "ETH",
      "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
      "priceUSD": "3166.21"
    },
    "gasAmount": "4771740000000",
    "gasAmountUSD": "0.0151",
    "amountUSD": "129.5821",
    "value": "11551536072923",
    "includedSteps": [
      {
        "tool": "gasZip",
        "toolDetails": {
          "key": "gasZip",
          "name": "LI.Fuel",
          "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/lifi.svg"
        },
        "fromAmount": "129486280",
        "fromToken": {
          "address": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
          "chainId": 42161,
          "symbol": "USDT",
          "decimals": 6,
          "name": "USDT",
          "coinKey": "USDT",
          "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
          "priceUSD": "1.00074"
        },
        "toToken": {
          "address": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
          "chainId": 42161,
          "symbol": "USDT",
          "decimals": 6,
          "name": "USDT",
          "coinKey": "USDT",
          "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
          "priceUSD": "1.00074"
        },
        "toAmount": "128671479",
        "bridgedAmount": "128671479"
      }
    ],
    "timestamp": 1729163645
  },
  "receiving": {
    "txHash": "0xd3142ffb0abaefd030e9c108d6fedcd9b5bab9099346531b54f370762301bb4e",
    "txLink": "https://taikoscan.io/tx/0xd3142ffb0abaefd030e9c108d6fedcd9b5bab9099346531b54f370762301bb4e",
    "amount": "128671479",
    "token": {
      "address": "0x9c2dc7377717603eB92b2655c5f2E7997a4945BD",
      "chainId": 167000,
      "symbol": "USDT(Stargate)",
      "decimals": 6,
      "name": "Tether USD",
      "coinKey": "USDT",
      "logoURI": "https://static.debank.com/image/coin/logo_url/usdt/23af7472292cb41dc39b3f1146ead0fe.png",
      "priceUSD": "1.00074"
    },
    "chainId": 167000,
    "gasPrice": "60000001",
    "gasUsed": "109839",
    "gasToken": {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 167000,
      "symbol": "ETH",
      "decimals": 18,
      "name": "ETH",
      "coinKey": "ETH",
      "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
      "priceUSD": "3166.21"
    },
    "gasAmount": "6590340109839",
    "gasAmountUSD": "0.0209",
    "amountUSD": "128.7667",
    "value": "0",
    "includedSteps": [],
    "timestamp": 1729164251
  },
  "feeCosts": [
    {
      "name": "Relay fee",
      "description": "The fee required to pay for the relay on the receiving chain",
      "percentage": "0.6802",
      "token": {
        "chainId": 42161,
        "address": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        "symbol": "USDT",
        "decimals": 6,
        "name": "USDT",
        "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
        "coinKey": "USDT",
        "priceUSD": "1.00074"
      }
    }
  ]
}
```
```

--------------------------------

### GET /v1/tools

Source: https://docs.li.fi/api-reference/get-available-bridges-and-exchanges

Retrieves a comprehensive list of all available bridges and exchanges supported by the LI.FI service. This endpoint is useful for understanding the integration capabilities and the specific chains each service operates on.

```APIDOC
## GET /v1/tools

### Description
This endpoint can be used to get information about the bridges and exchanges available through our service.

### Method
GET

### Endpoint
/v1/tools

### Parameters
#### Query Parameters
- **chains** (array of strings or integers) - Optional - The ids of the chains that should be taken into consideration. Example: `["pol", "eth"]` or `[1, 56]`
#### Header Parameters
- **x-lifi-api-key** (string) - Optional - Authentication header. Contact support for registration.

### Request Example
```json
{
  "example": "No request body needed for this GET request."
}
```

### Response
#### Success Response (200)
- **exchanges** (array of Exchange objects) - A list of available exchanges.
- **bridges** (array of Bridge objects) - A list of available bridges.

#### Response Example
```json
{
  "exchanges": [
    {
      "key": "1inch",
      "name": "0x",
      "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/zerox.svg",
      "supportedChains": [
        "1",
        "137",
        "56"
      ]
    }
  ],
  "bridges": [
    {
      "key": "hop",
      "name": "Connext",
      "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/relay.svg",
      "supportedChains": [
        {
          "fromChainId": "137",
          "toChainId": "1"
        }
      ]
    }
  ]
}
```

### Components
#### Schema: Exchange
- **key** (string) - Enum value representing the exchange.
- **name** (string) - The common name of the tool.
- **logoURI** (string) - The logo of the tool.
- **supportedChains** (array of strings) - The chains supported by this exchange.

#### Schema: Bridge
- **key** (string) - Enum value representing the bridge.
- **name** (string) - The common name of the tool.
- **logoURI** (string) - The logo of the tool.
- **supportedChains** (array of SupportedChains objects) - The chains supported by this bridge.

#### Schema: SupportedChains
- **fromChainId** (string) - Supported `from` chain ID.
- **toChainId** (string) - Supported `to` chain ID.
```

--------------------------------

### Importing Global SDK Configuration Object

Source: https://docs.li.fi/sdk/configure-sdk

Access and manipulate the global configuration object of the LI.FI SDK after initialization using `createConfig`. The `config` object provides methods to get, set, and update various aspects of the SDK's settings, such as providers, chains, and RPC URLs.

```typescript
import { config } from "@lifi/sdk";
```

--------------------------------

### Allow/Deny/Prefer Bridges and Exchanges

Source: https://docs.li.fi/integrate-li.fi-sdk/request-routes-quotes

Configure preferences for bridges and exchanges used in route finding. You can specify which tools to allow, deny, or prefer.

```APIDOC
## POST /allowDenyPrefer

### Description
Configure preferences for bridges and exchanges used in route finding. You can specify which tools to allow, deny, or prefer.

### Method
POST

### Endpoint
/allowDenyPrefer

### Parameters
#### Request Body
- **allow** (string[]) - Optional - A list of allowed bridges or exchanges (default: all).
- **deny** (string[]) - Optional - A list of denied bridges or exchanges (default: none).
- **prefer** (string[]) - Optional - A list of preferred bridges or exchanges (e.g., ['1inch'] to prefer 1inch if available).

### Request Example
```json
{
  "allow": ["uniswap", "sushiswap"],
  "deny": ["pancakeswap"],
  "prefer": ["1inch"]
}
```

### Response
#### Success Response (200)
- **message** (string) - Confirmation message indicating preferences have been set.

#### Response Example
```json
{
  "message": "Bridge and exchange preferences updated successfully."
}
```
```

--------------------------------

### GET /websites/li_fi

Source: https://docs.li.fi/api-reference/check-the-status-of-a-cross-chain-transfer

Retrieves the status and details of a transaction processed by the Li.Fi protocol. It returns information about the transaction, including fees, tokens involved, and explorer links.

```APIDOC
## GET /websites/li_fi

### Description
Retrieves the status and details of a transaction processed by the Li.Fi protocol. It returns information about the transaction, including fees, tokens involved, and explorer links.

### Method
GET

### Endpoint
/websites/li_fi

### Parameters
#### Query Parameters
- **txId** (string) - Required - The transaction ID to query.
- **fromChainId** (string) - Required - The chain ID from which the transaction originated.
- **toChainId** (string) - Required - The chain ID to which the transaction was sent.
- **tool** (string) - Optional - The specific tool or service used for the transaction (e.g., stargateV2Bus).
- **fromAddress** (string) - Optional - The address that initiated the transaction.
- **toAddress** (string) - Optional - The address that received the transaction.

### Response
#### Success Response (200)
- **protocolFee** (object) - Information about the protocol fee.
  - **description** (string) - Description of the fee.
  - **percentage** (string) - The fee percentage.
  - **token** (object) - Details of the token used for the fee.
    - **chainId** (number) - The chain ID of the token.
    - **address** (string) - The contract address of the token.
    - **symbol** (string) - The symbol of the token.
    - **decimals** (number) - The number of decimals for the token.
    - **name** (string) - The name of the token.
    - **coinKey** (string) - A unique key for the token.
    - **logoURI** (string) - The URI for the token's logo.
    - **priceUSD** (string) - The price of the token in USD.
  - **amount** (string) - The amount of the token used for the fee.
  - **amountUSD** (string) - The USD equivalent of the fee amount.
  - **included** (boolean) - Whether the fee was included in the transaction.
- **lifiExplorerLink** (string) - A link to the Li.Fi transaction explorer.
- **fromAddress** (string) - The originating address of the transaction.
- **toAddress** (string) - The destination address of the transaction.
- **tool** (string) - The tool used for the transaction.
- **status** (string) - The status of the transaction (e.g., DONE).
- **substatus** (string) - A more specific status of the transaction (e.g., COMPLETED).
- **substatusMessage** (string) - A message detailing the substatus.
- **metadata** (object) - Additional metadata about the transaction.
  - **integrator** (string) - The integrator used for the transaction.
- **bridgeExplorerLink** (string) - A link to the bridge's block explorer for the transaction.

#### Error Response (400)
- **description** (string) - A message indicating that the passed parameters are invalid.

### Response Example
```json
{
  "protocolFee": {
    "description": "protocol native fee",
    "percentage": "0.0002",
    "token": {
      "chainId": 42161,
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "ETH",
      "decimals": 18,
      "name": "ETH",
      "coinKey": "ETH",
      "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
      "priceUSD": "2616.99"
    },
    "amount": "11551536072923",
    "amountUSD": "0.0302",
    "included": false
  },
  "lifiExplorerLink": "https://scan.li.fi/tx/0xe1ffdcf09d5aa92a2d89b1b39db3f8cadf09428a296cce0d5e387595ac83d08f",
  "fromAddress": "0x204dedcf79dbbb02359205f4f64ce2cbdd483906",
  "toAddress": "0x204dedcf79dbbb02359205f4f64ce2cbdd483906",
  "tool": "stargateV2Bus",
  "status": "DONE",
  "substatus": "COMPLETED",
  "substatusMessage": "The transfer is complete.",
  "metadata": {
    "integrator": "dev.jumper.exchange"
  },
  "bridgeExplorerLink": "https://layerzeroscan.com/tx/0xe1ffdcf09d5aa92a2d89b1b39db3f8cadf09428a296cce0d5e387595ac83d08f"
}
```
```

--------------------------------

### Get Active Routes with LiFi SDK

Source: https://docs.li.fi/integrate-li.fi-sdk/execute-routes-quotes

Demonstrates how to retrieve currently active routes using `getActiveRoutes` and a specific active route using `getActiveRoute`. It requires the `@lifi/sdk` package. The functions return `RouteExtended` objects.

```typescript
import { getActiveRoute, getActiveRoutes, RouteExtended } from '@lifi/sdk'

const activeRoutes: RouteExtended[] = getActiveRoutes();

const routeId = activeRoutes[0].routeId;

const activeRoute = getActiveRoute(routeId);

```

--------------------------------

### Bitcoin Transaction Creation with BitcoinJS (TypeScript)

Source: https://docs.li.fi/lifi-intents/for-solvers/btc

This snippet demonstrates how to initialize BitcoinJS library for Taproot support and set up network parameters for transaction creation. It assumes the existence of an ecc library for cryptographic operations and a boolean `mainnet` flag to determine the network.

```typescript
// Assuming you use BitcoinJS PSBT:
import * as bitcoin from 'bitcoinjs-lib';
...
bitcoin.initEccLib(ecc); // For Taproot support.

const mainnet: boolean;

```

--------------------------------

### GET /v1/calldata/parse

Source: https://docs.li.fi/api-reference/parse-transaction-call-data-beta

Parses provided call data to extract transaction details like function name and parameters. Supports multiple LI.FI environments.

```APIDOC
## GET /v1/calldata/parse

### Description
Parses provided call data to extract transaction details such as the function name and its parameters. This endpoint can be used with the production or staging environments of LI.FI.

### Method
GET

### Endpoint
/v1/calldata/parse

### Parameters
#### Query Parameters
- **chainId** (string) - Optional - The chain ID that the transaction is built for or has been sent on.
- **callData** (string) - Required - The call data to parse.

#### Header Parameters
- **x-lifi-api-key** (string) - Optional - Authentication header. Contact support for registration.

### Request Example
```bash
curl -X GET \
  'https://li.quest/v1/calldata/parse?chainId=1&callData=0x...' \
  -H 'x-lifi-api-key: YOUR_API_KEY'
```

### Response
#### Success Response (200)
- **functionName** (string) - The name of the function identified in the call data.
- **functionParameters** (object) - An object containing the parameters of the identified function.

#### Response Example
```json
{
  "functionName": "swapTokensGeneric",
  "functionParameters": {
    "_transactionId": "0x40b0592501720ece27ef8614385fbef4bdbb5b2050ebaaa3563e72fee959e249",
    "_integrator": "jumper.exchange",
    "_referrer": "0x0000000000000000000000000000000000000000",
    "_receiver": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
    "_minAmount": "4640629752435722515",
    "_swapData": [
      {
        "callTo": "0xDef1C0ded9bec7F1a1670819833240f027b25EfF",
        "approveTo": "0xDef1C0ded9bec7F1a1670819833240f027b25EfF",
        "sendingAssetId": "0x0000000000000000000000000000000000000000",
        "receivingAssetId": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        "fromAmount": "5000000000000000000",
        "callData": "0x415565b0..."
      }
    ]
  }
}
```
```

--------------------------------

### Initialize Default Form Values in LI.FI Widget

Source: https://docs.li.fi/widget/configure-widget

This example shows how to initialize the LI.FI Widget with specific default values for chains, tokens, amount, and destination address. It preconfigures the source chain to Polygon, destination chain to Optimism, source token to USDC on Polygon, destination token to USDC on Optimism, sets a source amount, and specifies a destination address. This streamlines the user experience by pre-filling essential swap or bridge parameters.

```typescript
import type { WidgetConfig } from "@lifi/widget";
import { ChainType } from "@lifi/widget";

const widgetConfig: WidgetConfig = {
  // set source chain to Polygon
  fromChain: 137,
  // set destination chain to Optimism
  toChain: 10,
  // set source token to USDC (Polygon)
  fromToken: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  // set source token to USDC (Optimism)
  toToken: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  // set source token amount to 10 USDC (Polygon)
  fromAmount: 10,
  // set the destination wallet address
  toAddress: {
    address: "0x29DaCdF7cCaDf4eE67c923b4C22255A4B2494eD7",
    chainType: ChainType.EVM,
  },
};

export const WidgetPage = () => {
  return (
    <LiFiWidget integrator="Your dApp/company name" config={widgetConfig} />
  );
};

```

--------------------------------

### Subscribe to Widget Events using useWidgetEvents (TypeScript)

Source: https://docs.li.fi/widget/widget-events

Demonstrates how to use the `useWidgetEvents` hook to subscribe to LI.FI widget events such as route execution start, update, completion, failure, and high value loss. This hook should be integrated outside the main LiFiWidget component to optimize performance. It relies on the `@lifi/widget` and `@lifi/sdk` packages.

```typescript
import type { Route } from '@lifi/sdk';
import type { RouteExecutionUpdate, RouteHighValueLossUpdate } from '@lifi/widget';
import { useWidgetEvents, WidgetEvent } from '@lifi/widget';
import { useEffect } from 'react';

export const WidgetEventsExample = () => {
  const widgetEvents = useWidgetEvents();

  // ...

  useEffect(() => {
    const onRouteExecutionStarted = (route: Route) => {
      // console.log('onRouteExecutionStarted fired.');
    };
    const onRouteExecutionUpdated = (update: RouteExecutionUpdate) => {
      // console.log('onRouteExecutionUpdated fired.');
    };
    const onRouteExecutionCompleted = (route: Route) => {
      // console.log('onRouteExecutionCompleted fired.');
    };
    const onRouteExecutionFailed = (update: RouteExecutionUpdate) => {
      // console.log('onRouteExecutionFailed fired.');
    };
    const onRouteHighValueLoss = (update: RouteHighValueLossUpdate) => {
      // console.log('onRouteHighValueLoss continued.');
    };
    
    widgetEvents.on(WidgetEvent.RouteExecutionStarted, onRouteExecutionStarted);
    widgetEvents.on(WidgetEvent.RouteExecutionUpdated, onRouteExecutionUpdated);
    widgetEvents.on(WidgetEvent.RouteExecutionCompleted, onRouteExecutionCompleted);
    widgetEvents.on(WidgetEvent.RouteExecutionFailed, onRouteExecutionFailed);
    widgetEvents.on(WidgetEvent.RouteHighValueLoss, onRouteHighValueLoss);
    
    return () => widgetEvents.all.clear();
  }, [widgetEvents]);

  // ...
  
  // Return null because it's an example
  return null;
};
```

--------------------------------

### Request a Quote

Source: https://docs.li.fi/sdk/request-routes

Request a quote using the smart routing API to get the best available option for swaps or bridging transfers.

```APIDOC
## POST /quote

When you request a quote, our smart routing API provides the best available option. The quote includes all necessary information and transaction data required to initiate a swap or bridging transfer.

### Method

POST

### Endpoint

/quote

### Parameters

#### Request Body

- **fromChain** (number) - Required - The ID of the source chain (e.g., Ethereum mainnet is 1).
- **fromToken** (string) - Required - The contract address of the token on the source chain. Ensure this address corresponds to the specified `fromChain`.
- **fromAmount** (string) - Required - The amount to be transferred from the source chain, specified in the smallest unit of the token (e.g., wei for ETH).
- **fromAddress** (string) - Required - The address from which the tokens are being transferred.
- **toChain** (number) - Required - The ID of the destination chain (e.g., Optimism is 10).
- **toToken** (string) - Required - The contract address of the token on the destination chain. Ensure this address corresponds to the specified `toChain`.
- **toAddress** (string) - Optional - The address to which the tokens will be sent on the destination chain once the transaction is completed.
- **fromAmountForGas** (string) - Optional - Part of the LI.Fuel. Allows receiving a part of the bridged tokens as gas on the destination chain. Specified in the smallest unit of the token.

### Request Example

```typescript
{
  "fromChain": 42161, // Arbitrum
  "toChain": 10, // Optimism
  "fromToken": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC on Arbitrum
  "toToken": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI on Optimism
  "fromAmount": "10000000", // 10 USDC
  "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
}
```

### Response

#### Success Response (200)

- **quote** (object) - The quote object containing all necessary information and transaction data.

#### Response Example

(Response structure depends on the quote details)
```

--------------------------------

### Get Single Token Balance

Source: https://docs.li.fi/more-integration-options/li.fi-api/getting-token-information

Returns the balance of a specific token held by a given wallet address. Requires EVM/Solana providers to be configured.

```APIDOC
## GET /balance/{walletAddress}/{token}

### Description
Returns the balance of a specific token a wallet holds. Requires EVM/Solana providers to be configured.

### Method
GET

### Endpoint
/balance/{walletAddress}/{token}

### Parameters
#### Path Parameters
- **walletAddress** (string) - Required - A wallet address.
- **token** (Token) - Required - A Token object.

### Response
#### Success Response (200)
- **tokenBalance** (TokenAmount | null) - A TokenAmount object representing the balance, or null if not found.

#### Response Example
```json
{
  "token": {
    "chainId": 1,
    "address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    "symbol": "UNI",
    "name": "Uniswap",
    "decimals": 18
  },
  "amount": "1000000000000000000",
  "unit": "1 UNI"
}
```
```

--------------------------------

### Get All Connections (cURL)

Source: https://docs.li.fi/li.fi-api/li.fi-api/getting-all-possible-connections

This cURL command fetches all possible cross-chain connections from the Li.Quest API. It requires no parameters and returns a JSON object containing an array of connection details.

```bash
curl --request GET \
  --url https://li.quest/v1/connections
```

--------------------------------

### GET /v1/quote/toAmount

Source: https://docs.li.fi/api-reference/get-a-quote-for-a-token-transfer-1

Retrieves a quote for a token transfer to a specific amount on a target chain. This endpoint is useful for determining the best route and estimated cost for a swap.

```APIDOC
## GET /v1/quote/toAmount

### Description
Retrieves a quote for a token transfer to a specific amount on a target chain. This endpoint is useful for determining the best route and estimated cost for a swap.

### Method
GET

### Endpoint
/v1/quote/toAmount

### Parameters
#### Query Parameters
- **fromChain** (string) - Required - The sending chain. Can be the chain id or chain key
- **toChain** (string) - Required - The receiving chain. Can be the chain id or chain key
- **fromToken** (string) - Required - The token that should be transferred. Can be the address or the symbol
- **toToken** (string) - Required - The token that should be transferred to. Can be the address or the symbol
- **fromAddress** (string) - Required - The sending wallet address
- **toAddress** (string) - Optional - The receiving wallet address. If none is provided, the fromAddress will be used
- **toAmount** (string) - Required - The amount that will be received including all decimals (e.g. 1000000 for 1 USDC (6 decimals))
- **order** (enum) - Optional - Which kind of route should be preferred (FASTEST or CHEAPEST).
  - **FASTEST**: Prioritizes routes with the shortest estimated execution time.
  - **CHEAPEST**: Focuses on minimizing the cost of the transaction.
- **slippage** (number) - Optional - The maximum allowed slippage for the transaction as a decimal value (e.g., 0.005 for 0.5%).
- **integrator** (string) - Optional - A string containing tracking information about the integrator of the API.
- **fee** (number) - Optional - The percent of the integrator's fee that is taken from every transaction (e.g., 0.02 represents 2%).
- **referrer** (string) - Optional - A string containing tracking information about the referrer of the integrator.
- **allowBridges** (array) - Optional - List of bridges that are allowed for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint. Also values `all`, `none`, `default` and `[]` are acceptable.
- **allowExchanges** (array) - Optional - List of exchanges that are allowed for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint. Also values `all`, `none`, `default` and `[]` are acceptable.
- **denyBridges** (array) - Optional - List of bridges that are denied for this transaction.

### Request Example
```
GET https://li.quest/v1/quote/toAmount?fromChain=eth&toChain=polygon&fromToken=0x...&toToken=0x...&fromAddress=0x...&toAmount=1000000&order=CHEAPEST&slippage=0.005
```

### Response
#### Success Response (200)
- **code** (number) - Status code of the response.
- **message** (string) - Status message.
- **data** (object) - Contains quote details.
  - **estimate** (number) - The estimated amount to receive.
  - **gasCost** (number) - The estimated gas cost in native currency.
  - **exchangeRate** (number) - The exchange rate.
  - **lifiExplorerLink** (string) - A link to the LI.FI explorer for this transaction.
  - **action** (object) - Details about the action to perform.
    - **fromAmount** (string) - The amount to send.
    - **toAmount** (string) - The amount to receive.
    - **token** (object) - Details about the token.
      - **decimals** (number) - The number of decimals for the token.
      - **address** (string) - The token contract address.
      - **symbol** (string) - The token symbol.
    - **chain** (string) - The chain ID.
    - **toAmountMin** (string) - The minimum amount to receive.
    - **toAmountMax** (string) - The maximum amount to receive.
    - **priceImpact** (number) - The price impact of the transaction.
    - **estimatedGas** (string) - The estimated gas for the action.
    - **estimatedPrice** (string) - The estimated price.
    - **tool** (string) - The tool used for the swap.
    - **type** (string) - The type of action (e.g., SWAP, BRIDGE).

#### Response Example
```json
{
  "code": "SUCCESS",
  "message": "Quote retrieved successfully.",
  "data": {
    "estimate": "995000",
    "gasCost": "15000000000000000",
    "exchangeRate": "0.995",
    "lifiExplorerLink": "https://li.quest/tx/0x...",
    "action": {
      "fromAmount": "1000000",
      "toAmount": "995000",
      "token": {
        "decimals": 6,
        "address": "0x...",
        "symbol": "USDC"
      },
      "chain": "eth",
      "toAmountMin": "990000",
      "toAmountMax": "1000000",
      "priceImpact": 0.005,
      "estimatedGas": "7000000000000000",
      "estimatedPrice": "0.995",
      "tool": "Uniswap",
      "type": "SWAP"
    }
  }
}
```
```

--------------------------------

### Request Quote: Ethereum to Bitcoin

Source: https://docs.li.fi/introduction/user-flows-and-examples/bitcoin-tx-example

Requests a transaction quote for transferring assets from Ethereum to Bitcoin. This requires specifying sender and receiver addresses, amounts, and chain/token identifiers for both networks.

```JS
curl --request GET \
       --url 'https://li.quest/v1/quote?fromChain=1&toChain=20000000000001&fromToken=0x0000000000000000000000000000000000000000&toToken=bitcoin&fromAddress=0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0&toAddress=bc1qmdpxhzarlxrygtvlxrkkl0eqguszkzqdgg4py5&fromAmount=500000000000000000' \
       --header 'accept: application/json'
```

```JS
curl --request POST \
       --url https://li.quest/v1/advanced/routes \
       --header 'accept: application/json' \
       --header 'content-type: application/json' \
       --data '\
{\
  "toTokenAddress": "bitcoin",\
  "fromTokenAddress": "0x0000000000000000000000000000000000000000",\
  "fromChainId": 1,\
  "fromAmount": "500000000000000000",\
  "toChainId": 20000000000001,\
  "fromAddress": "YOUR_EVM_WALLET",\
  "toAddress": "YOUR_BTC_WALLET"\
}
'
```

--------------------------------

### Dynamically Sync Wagmi Chains with LI.FI Widget using useSyncWagmiConfig

Source: https://docs.li.fi/integrate-li.fi-widget/wallet-management

This example demonstrates how to dynamically synchronize Wagmi's chain configuration with the LI.FI Widget's available chains. It utilizes the `useAvailableChains` hook from `@lifi/widget` and `useSyncWagmiConfig` to automatically update Wagmi's configuration, ensuring all supported chains are available for the widget. This approach simplifies chain management and ensures consistent functionality across chain switches.

```typescript
import { useSyncWagmiConfig } from '@lifi/wallet-management';
import { useAvailableChains } from '@lifi/widget';
import { injected } from '@wagmi/connectors';
import { useRef, type FC, type PropsWithChildren } from 'react';
import { createClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import type { Config } from 'wagmi';
import { createConfig, WagmiProvider } from 'wagmi';

const connectors = [injected()];

export const WalletProvider: FC<PropsWithChildren> = ({ children }) => {
  const { chains } = useAvailableChains();
  const wagmi = useRef<Config>();

if (!wagmi.current) {
wagmi.current = createConfig({
chains: [mainnet],
client({ chain }) {
return createClient({ chain, transport: http() });
},
ssr: true,
});
}

useSyncWagmiConfig(wagmi.current, connectors, chains);

return (

<WagmiProvider config={wagmi.current} reconnectOnMount={false}>
  {children}
</WagmiProvider>
); };


```

--------------------------------

### Enable Partial Wallet Management

Source: https://docs.li.fi/integrate-li.fi-widget/wallet-management

Enable `usePartialWalletManagement` to allow the widget to manage wallets partially, combining external and internal management. External management is used for 'opt-out' providers, while the widget handles the rest. This provides a hybrid approach for flexibility during setup migrations or when external support is incomplete.

```typescript
import { LiFiWidget, WidgetConfig } from "@lifi/widget";

const widgetConfig: WidgetConfig = {
  walletConfig: {
    usePartialWalletManagement: true,
  },
};

export const WidgetPage = () => {
  return (
    <LiFiWidget integrator="Your dApp/company name" config={widgetConfig} />
  );
};

```

--------------------------------

### Get Bridge Routes

Source: https://docs.li.fi/api-reference/advanced/get-a-set-of-routes-for-a-request-that-describes-a-transfer-of-tokens

Retrieves available routes for cross-chain token transfers. This endpoint allows users to find optimal paths for moving assets between different blockchains.

```APIDOC
## GET /websites/li_fi/routes

### Description
Retrieves available routes for cross-chain token transfers. This endpoint allows users to find optimal paths for moving assets between different blockchains.

### Method
GET

### Endpoint
/websites/li_fi/routes

### Parameters
#### Query Parameters
- **fromChainId** (number) - Required - The ID of the source chain.
- **toChainId** (number) - Required - The ID of the destination chain.
- **fromTokenAddress** (string) - Required - The address of the token on the source chain.
- **toTokenAddress** (string) - Required - The address of the token on the destination chain.
- **fromAmount** (string) - Required - The amount of tokens to transfer.
- **fromAddress** (string) - Optional - The user's wallet address on the source chain.
- **toAddress** (string) - Optional - The user's wallet address on the destination chain.
- **slippage** (number) - Optional - The maximum acceptable slippage percentage.

### Request Example
```json
{
  "fromChainId": 100,
  "toChainId": 137,
  "fromTokenAddress": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
  "toTokenAddress": "0xc0b2983a17573660053beeed6fdb1053107cf387",
  "fromAmount": "1000000000000000000",
  "slippage": 0.003
}
```

### Response
#### Success Response (200)
- **routes** (array) - An array of available route objects.
  - **id** (string) - Unique identifier for the route.
  - **fromChainId** (number) - The ID of the source chain.
  - **fromAmountUSD** (string) - The equivalent amount in USD on the source chain.
  - **fromAmount** (string) - The amount of tokens on the source chain.
  - **fromToken** (object) - Details of the token on the source chain.
  - **toChainId** (number) - The ID of the destination chain.
  - **toAmountUSD** (string) - The equivalent amount in USD on the destination chain.
  - **toAmount** (string) - The amount of tokens on the destination chain.
  - **toAmountMin** (string) - The minimum amount of tokens expected on the destination chain.
  - **toToken** (object) - Details of the token on the destination chain.
  - **gasCostUSD** (string) - The estimated gas cost in USD.
  - **steps** (array) - An array of steps involved in the route.

#### Response Example
```json
{
  "routes": [
    {
      "id": "0x1e21fad9c26fff48b67ae2925f878e43bf81211da8b1cd9b7faa8bfd8d7ea9d9",
      "fromChainId": 100,
      "fromAmountUSD": "0.05",
      "fromAmount": "1000000000000000000",
      "fromToken": {
        "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
        "symbol": "MIVA",
        "decimals": 18,
        "chainId": 100,
        "name": "Minerva Wallet SuperToken",
        "coinKey": "MIVA",
        "priceUSD": "0.04547537276751318",
        "logoURI": ""
      },
      "toChainId": 137,
      "toAmountUSD": "0.00",
      "toAmount": "999500000000000000",
      "toAmountMin": "999500000000000000",
      "toToken": {
        "address": "0xc0b2983a17573660053beeed6fdb1053107cf387",
        "symbol": "MIVA",
        "decimals": 18,
        "chainId": 137,
        "name": "Minerva Wallet SuperToken",
        "coinKey": "MIVA",
        "priceUSD": "0",
        "logoURI": ""
      },
      "gasCostUSD": "0.00",
      "steps": [
        {
          "id": "0x48f0a2f93b0d0a9dab992d07c46bca38516c945101e8f8e08ca42af05b9e6aa9",
          "type": "cross",
          "tool": "relay",
          "action": {
            "fromChainId": 100,
            "toChainId": 137,
            "fromToken": {
              "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
              "symbol": "MIVA",
              "decimals": 18,
              "chainId": 100,
              "name": "Minerva Wallet SuperToken",
              "coinKey": "MIVA",
              "priceUSD": "0.04547537276751318",
              "logoURI": ""
            },
            "toToken": {
              "address": "0xc0b2983a17573660053beeed6fdb1053107cf387",
              "symbol": "MIVA",
              "decimals": 18,
              "chainId": 137,
              "name": "Minerva Wallet SuperToken",
              "coinKey": "MIVA",
              "priceUSD": "0",
              "logoURI": ""
            },
            "fromAmount": "1000000000000000000",
            "slippage": 0.003
          },
          "estimate": {
            "fromAmount": "1000000000000000000",
            "toAmount": "999500000000000000",
            "toAmountMin": "999500000000000000",
            "approvalAddress": "0x115909BDcbaB21954bEb4ab65FC2aBEE9866fa93",
            "feeCosts": [
              {
                "name": "Gas Fee",
                "description": "Covers gas expense for sending funds to user on receiving chain.",
                "percentage": "0",
                "token": {
                  "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
                  "symbol": "MIVA",
                  "decimals": 18,
                  "chainId": 100,
                  "name": "Minerva Wallet SuperToken",
                  "coinKey": "MIVA",
                  "priceUSD": "0.04547537276751318",
                  "logoURI": ""
                },
                "amount": "0",
                "amountUSD": "0.00",
                "included": true
              },
              {
                "name": "Relay Fee",
                "description": "Covers gas expense for claiming user funds on receiving chain.",
                "percentage": "0",
                "token": {
                  "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
                  "symbol": "MIVA",
                  "decimals": 18,
                  "chainId": 100,
                  "name": "Minerva Wallet SuperToken",
                  "coinKey": "MIVA",
                  "priceUSD": "0.04547537276751318",
                  "logoURI": ""
                },
                "amount": "0",
                "amountUSD": "0.00",
                "included": true
              },
              {
                "name": "Router Fee",
                "description": "",
                "percentage": "0",
                "token": {
                  "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
                  "symbol": "MIVA",
                  "decimals": 18,
                  "chainId": 100,
                  "name": "Minerva Wallet SuperToken",
                  "coinKey": "MIVA",
                  "priceUSD": "0.04547537276751318",
                  "logoURI": ""
                },
                "amount": "0",
                "amountUSD": "0.00",
                "included": true
              }
            ]
          }
        }
      ]
    }
  ]
}
```
```

--------------------------------

### Register Accounts

Source: https://docs.li.fi/lifi-intents/for-solvers/quoting

Associating filled intents with your solver allows the order server to track your performance. This is key for getting exclusive orders assigned to your solver.

```APIDOC
## POST /accounts/register

### Description
Register your solver account by associating filled intents. This allows the order server to track your solver's performance, which is crucial for receiving exclusive order assignments.

### Method
POST

### Endpoint
`/accounts/register`

### Parameters
#### Headers
- **x-api-key** (string) - Required - Your unique API key.

#### Request Body
- **solverAddress** (string) - Required - The on-chain address of your solver.
- **chainId** (number) - Required - The chain ID where your solver is registered.
- **filledIntentIds** (array) - Optional - An array of intent IDs that your solver has successfully filled.
  - Each element should be a string representing an intent ID.

### Request Example
```json
{
  "solverAddress": "0x4444444444444444444444444444444444444444",
  "chainId": 1,
  "filledIntentIds": [
    "intent-123",
    "intent-456"
  ]
}
```

### Response
#### Success Response (200)
- **success** (boolean) - Indicates if the account registration was successful.

#### Response Example
```json
{
  "success": true
}
```

#### Error Response (400)
- **error** (string) - Description of the error if the request body is invalid or the solver address is not recognized.

```

--------------------------------

### Import LI.FI SDK Providers

Source: https://docs.li.fi/integrate-li.fi-sdk/configure-sdk-providers

Imports the necessary provider classes (EVM, Solana, Sui, UTXO) from the '@lifi/sdk' package. These classes serve as abstractions for interacting with different blockchain ecosystems.

```typescript
import { EVM, Solana, Sui, UTXO } from '@lifi/sdk'
```

--------------------------------

### LiFi Widget: Advanced Token Filtering with Allow/Deny

Source: https://docs.li.fi/integrate-li.fi-widget/configure-widget

Precisely control token visibility in the 'from' and 'to' lists of the LiFi Widget. This example shows how to use top-level and list-specific `allow` and `deny` rules for tokens, including precedence and chain-specific filtering.

```typescript
import { LiFiWidget, WidgetConfig } from "@lifi/widget";

const widgetConfig: WidgetConfig = {
  tokens: {
    // Top-level allow/deny apply to BOTH 'from' and 'to' lists
    allow: [
      {
        address: "0x0000000000000000000000000000000000000000",
        chainId: 1,
      },
    ],
    deny: [
      {
        address: "0x0000000000000000000000000000000000000000",
        chainId: 137,
      },
    ],
    // 'from' list-specific allow/deny complements top-level settings
    from: {
      allow: [
        {
          address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          chainId: 1,
        },
      ],
      deny: [
        {
          address: "0x0000000000000000000000000000000000000000",
          chainId: 1,
        },
      ],
    },
    // 'to' list-specific allow/deny
    to: {
      allow: [
        {
          address: "0x0000000000000000000000000000000000000000",
          chainId: 137,
        },
      ],
      deny: [
        {
          address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          chainId: 1,
        },
      ],
    },
  },
};

export const WidgetPage = () => {
  return (
    <LiFiWidget integrator="Your dApp/company name" config={widgetConfig} />
  );
};

```

--------------------------------

### Construct Bitcoin Transaction with OP_RETURN (JavaScript)

Source: https://docs.li.fi/lifi-intents/for-solvers/btc

This snippet demonstrates how to construct a Bitcoin transaction using the bitcoinjs-lib library. It shows initializing a PSBT (Partially Signed Bitcoin Transaction), adding outputs, and specifically adding an OP_RETURN output to embed data. Dependencies include the bitcoinjs-lib library and a hexStringToUint8Array helper function. The input is a PSBT object, and outputs include transaction details and embedded data. Limitations may arise from the specific network chosen (mainnet/testnet) and the format of the return data.

```javascript
const psbt = new bitcoin.Psbt({
  network: mainnet ? bitcoin.networks.bitcoin : bitcoin.networks.testnet,
});

// ... add inputs

// Add the solving output.
psbt.addOutput({ address: to, value: outputValue });

// The very next output should be an OP_RETURN
const opReturnData = returnData.replace("0x", "");
if (opReturnData.length > 0) {
  const data_embed = bitcoin.payments.embed({
      data: [hexStringToUint8Array(opReturnData)],
  });
  psbt.addOutput({
    script: data_embed.output!,
    value: 0n,
  });
}

// ... complete transaction
```

--------------------------------

### Request Routes using getRoutes (JavaScript)

Source: https://docs.li.fi/integrate-li.fi-sdk/request-routes-quotes

This snippet demonstrates how to use the `getRoutes` function from the LI.FI SDK to find bridging and swapping routes. It requires specifying source and destination chains, tokens, and amounts. The function returns an array of route objects, but transaction data is not included and must be fetched separately.

```javascript
import { getRoutes } from '@lifi/sdk';

const routesRequest = {
  fromChainId: 42161, // Arbitrum
  toChainId: 10, // Optimism
  fromTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  toTokenAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI on Optimism
  fromAmount: '10000000', // 10 USDC
};

const result = await getRoutes(routesRequest);
const routes = result.routes;

```

--------------------------------

### FAQ - Chain Switching and Destination Calls

Source: https://docs.li.fi/guides/integration-tips/faq

Configuration options for controlling chain switching behavior and allowing bridge operations on the destination chain.

```APIDOC
## FAQ - Chain Switching and Destination Calls

### Description
This FAQ addresses how to ensure users sign on the source chain while allowing the bridge to complete swaps on the destination chain. It details specific configuration options for the LI.FI widget.

### Method
N/A (Configuration)

### Endpoint
N/A (Widget Configuration)

### Parameters
#### Query Parameters
- **allowSwitchChain** (boolean) - `false` - Prevents automatic chain switching.
- **allowDestinationCall** (boolean) - `true` - Allows the bridge to complete the swap on the destination chain.

### Request Example
N/A

### Response
#### Success Response (N/A)
N/A

#### Response Example
N/A
```

--------------------------------

### Example: Interoperable Address Encoding

Source: https://docs.li.fi/lifi-intents/for-developers/quote

Illustrates the structure of an interoperable address used by the LI.FI order server, which encodes chain type, chain reference, and the actual address into a single bytes field. This format is based on EIP-7930.

```plaintext
0x0001|0000|02|2105|14|833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  ^^^^---------------------------------------------------------
       ^^^^----------------------------------------------------
            ^^-------------------------------------------------
               ^^^^--------------------------------------------
                    ^^-----------------------------------------
                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

--------------------------------

### Get Advanced Routes for Request (Composer Integration)

Source: https://docs.li.fi/introduction/user-flows-and-examples/lifi-composer

This endpoint provides a set of routes for a transfer request, which can be used for Composer workflows. Vault token addresses need to be inputted into this endpoint.

```APIDOC
## POST /advanced/routes

### Description
Retrieves a set of executable routes for a token transfer request, suitable for Composer workflows. Vault token addresses are required parameters.

### Method
POST

### Endpoint
/v1/advanced/routes

### Parameters
#### Request Body
- **fromChain** (number) - Required - The chain ID of the originating chain.
- **toChain** (number) - Required - The chain ID of the destination chain.
- **fromToken** (string) - Required - The address of the token to transfer from.
- **toToken** (string) - Required - The address of the token to transfer to (e.g., a vault token).
- **fromAmount** (string) - Required - The amount of the `fromToken` to transfer, considering its decimals.
- **options** (object) - Optional - Additional options for route selection.
  - **slippage** (number) - Optional - Desired slippage tolerance.

### Request Example
```json
{
  "fromChain": 8453,
  "toChain": 8453,
  "fromToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "toToken": "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
  "fromAmount": "1000000",
  "options": {
    "slippage": 0.005
  }
}
```

### Response
#### Success Response (200)
- **routes** (array) - A list of available routes for the token transfer.
  - Each route object contains details like `steps`, `feeCosts`, and `id`.

#### Response Example
```json
{
  "routes": [
    {
      "id": "route-123",
      "steps": [
        {
          "action": "swap",
          "fromAmount": "1000000",
          "toAmount": "998000",
          "token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        }
      ],
      "feeCosts": [
        {
          "amount": "5000",
          "token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          "type": "fee"
        }
      ]
    }
  ]
}
```
```

--------------------------------

### Configure EVM Provider with Wagmi and LI.FI Chains

Source: https://docs.li.fi/integrate-li.fi-sdk/configure-sdk-providers

Sets up the EVM provider using chains fetched from the LI.FI API, synchronizing them with Wagmi configuration and updating connectors. It uses a custom hook `useSyncWagmiConfig` and disables chain preloading for runtime updates. Dependencies include `@lifi/sdk`, `@lifi/wallet-management`, `@tanstack/react-query`, `@wagmi/core`, `react`, `viem`, and `wagmi`.

```typescript
import { ChainType, EVM, config, createConfig, getChains } from '@lifi/sdk';
import { useSyncWagmiConfig } from '@lifi/wallet-management';
import { useQuery } from '@tanstack/react-query';
import { getWalletClient, switchChain } from '@wagmi/core';
import { type FC, type PropsWithChildren } from 'react';
import { createClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import type { Config, CreateConnectorFn } from 'wagmi';
import { WagmiProvider, createConfig as createWagmiConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

// List of Wagmi connectors
const connectors: CreateConnectorFn[] = [injected()];

// Create Wagmi config with default chain and without connectors
const wagmiConfig: Config = createWagmiConfig({
  chains: [mainnet],
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
});

// Create SDK config using Wagmi actions and configuration
const config = createConfig({
  integrator: 'Your dApp/company name',
  providers: [
    EVM({
      getWalletClient: () => getWalletClient(wagmiConfig),
      switchChain: async (chainId) => {
        const chain = await switchChain(wagmiConfig, { chainId });
        return getWalletClient(wagmiConfig, { chainId: chain.id });
      },
    }),
  ],
  // We disable chain preloading and will update chain configuration in runtime
  preloadChains: false,
});

export const CustomWagmiProvider: FC<PropsWithChildren> = ({ children }) => {
  // Load EVM chains from LI.FI API using getChains action from LI.FI SDK
  const { data: chains } = useQuery({
    queryKey: ['chains'] as const,
    queryFn: async () => {
      const chains = await getChains({
        chainTypes: [ChainType.EVM],
      });
      // Update chain configuration for LI.FI SDK
      config.setChains(chains);
      return chains;
    },
  });

  // Synchronize fetched chains with Wagmi config and update connectors
  useSyncWagmiConfig(wagmiConfig, connectors, chains);

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      {children}
    </WagmiProvider>
  );
};

```

--------------------------------

### GET /connections

Source: https://docs.li.fi/li.fi-api/li.fi-api/getting-all-possible-connections

Retrieves all possible cross-chain connections based on a specified 'fromChain' or 'toChain'. This endpoint is useful for understanding the available routes for token transfers between different blockchains.

```APIDOC
## GET /connections

### Description
Returns all possible connections based on a from- or toChain.

### Method
GET

### Endpoint
https://li.quest/v1/connections

### Query Parameters
- **fromChain** (integer) - Optional - The ID of the source chain.
- **toChain** (integer) - Optional - The ID of the destination chain.

### Response
#### Success Response (200)
- **connections** (array) - An array of connection objects, each detailing 'fromChainId', 'toChainId', 'fromTokens', and 'toTokens'.
  - **fromChainId** (integer) - The ID of the originating chain.
  - **toChainId** (integer) - The ID of the destination chain.
  - **fromTokens** (array) - An array of token objects available on the 'fromChain'.
    - **address** (string) - The contract address of the token.
    - **decimals** (integer) - The number of decimal places for the token.
    - **symbol** (string) - The symbol of the token (e.g., "DAI").
    - **chainId** (integer) - The ID of the chain where the token resides.
    - **coinKey** (string) - A unique key for the coin.
    - **name** (string) - The full name of the token.
    - **logoURI** (string) - The URL of the token's logo.
    - **priceUSD** (string) - The current price of the token in USD.
  - **toTokens** (array) - An array of token objects available on the 'toChain'.
    - **address** (string) - The contract address of the token.
    - **decimals** (integer) - The number of decimal places for the token.
    - **symbol** (string) - The symbol of the token (e.g., "ETH").
    - **chainId** (integer) - The ID of the chain where the token resides.
    - **coinKey** (string) - A unique key for the coin.
    - **name** (string) - The full name of the token.
    - **logoURI** (string) - The URL of the token's logo.
    - **priceUSD** (string) - The current price of the token in USD.

### Request Example
```
GET https://li.quest/v1/connections?fromChain=137&toChain=1
```

### Response Example
```json
{
  "connections": [
    {
      "fromChainId": 137,
      "toChainId": 1,
      "fromTokens": [
        {
          "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
          "decimals": 18,
          "symbol": "DAI",
          "chainId": 137,
          "coinKey": "DAI",
          "name": "DAI",
          "logoURI": "https://static.debank.com/image/matic_token/logo_url/0x8f3cf7ad23cd3cadbd9735aff958023239c6a063/549c4205dbb199f1b8b03af783f35e71.png",
          "priceUSD": "1"
        }
      ],
      "toTokens": [
        {
          "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
          "decimals": 18,
          "symbol": "DAI",
          "chainId": 1,
          "coinKey": "DAI",
          "name": "DAI",
          "logoURI": "https://static.debank.com/image/eth_token/logo_url/0x6b175474e89094c44da98b954eedeac495271d0f/549c4205dbb199f1b8b03af783f35e71.png",
          "priceUSD": "1"
        },
        {
          "address": "0x0000000000000000000000000000000000000000",
          "decimals": 18,
          "symbol": "ETH",
          "chainId": 1,
          "coinKey": "ETH",
          "name": "ETH",
          "logoURI": "https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png",
          "priceUSD": "2582.35"
        }
      ]
    }
  ]
}
```
```

--------------------------------

### Get Available Routes

Source: https://docs.li.fi/api-reference/advanced/get-a-set-of-routes-for-a-request-that-describes-a-transfer-of-tokens

Retrieves a list of available routes for transferring tokens from a source token to a destination token. This endpoint is crucial for finding the most efficient and cost-effective ways to move assets across different blockchain networks.

```APIDOC
## GET /websites/li_fi/routes

### Description
Retrieves a list of available routes for transferring tokens from a source token to a destination token. This endpoint is crucial for finding the most efficient and cost-effective ways to move assets across different blockchain networks.

### Method
GET

### Endpoint
/websites/li_fi/routes

### Parameters
#### Query Parameters
- **fromChain** (string) - Required - The chain ID of the source token.
- **toChain** (string) - Required - The chain ID of the destination token.
- **fromToken** (string) - Required - The address of the token to transfer from.
- **toToken** (string) - Required - The address of the token to transfer to.
- **fromAmount** (string) - Required - The amount of the token to transfer.
- **options** (object) - Optional - Additional options for route calculation.
  - **slippage** (number) - Optional - The maximum acceptable slippage percentage.
  - **fee** (number) - Optional - The maximum acceptable fee percentage.
  - **order** (string) - Optional - The order in which to return routes (e.g., 'cheapest', 'fastest').

### Request Example
```json
{
  "fromChain": "1",
  "toChain": "42161",
  "fromToken": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "toToken": "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
  "fromAmount": "1000000000000000000",
  "options": {
    "slippage": 0.01
  }
}
```

### Response
#### Success Response (200)
- **routes** (array) - An array of available routes.
  - **route** (object) - Details of a specific route.
    - **fromChainId** (number) - The chain ID of the source token.
    - **toChainId** (number) - The chain ID of the destination token.
    - **fromToken** (object) - Details of the source token.
    - **toToken** (object) - Details of the destination token.
    - **fromAmount** (string) - The amount of the source token.
    - **toAmount** (string) - The estimated amount of the destination token.
    - **totalAmount** (string) - The total amount after fees and conversions.
    - **feeAmount** (string) - The estimated fee amount.
    - **slippage** (number) - The slippage applied to the route.
    - **steps** (array) - An array of steps involved in the route.
      - **tool** (string) - The tool used for the step (e.g., 'bridge', 'dex').
      - **action** (object) - Details of the action to perform.
        - **fromChainId** (number) - The chain ID of the source token for the action.
        - **toChainId** (number) - The chain ID of the destination token for the action.
        - **fromTokenAddress** (string) - The address of the source token for the action.
        - **toTokenAddress** (string) - The address of the destination token for the action.
        - **fromAmount** (string) - The amount of the source token for the action.
        - **toAmount** (string) - The estimated amount of the destination token for the action.
        - **type** (string) - The type of action (e.g., 'transfer', 'swap').

#### Response Example
```json
{
  "routes": [
    {
      "fromChainId": 1,
      "toChainId": 42161,
      "fromToken": {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "decimals": 6,
        "symbol": "USDT",
        "coinKey": "USDT",
        "chainId": 1,
        "name": "Tether USD",
        "logoURI": "http://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
        "priceUSD": "1.001"
      },
      "toToken": {
        "address": "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
        "decimals": 6,
        "symbol": "USDT",
        "coinKey": "USDT",
        "chainId": 42161,
        "name": "Tether USD",
        "logoURI": "http://get.celer.app/cbridge-icons/USDT.png"
      },
      "fromAmount": "100000",
      "toAmount": "99700",
      "totalAmount": "99700",
      "feeAmount": "300",
      "slippage": 0.003,
      "steps": [
        {
          "tool": "bridge",
          "action": {
            "fromChainId": 1,
            "toChainId": 42161,
            "fromTokenAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            "toTokenAddress": "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
            "fromAmount": "100000",
            "toAmount": "99700",
            "type": "transfer"
          }
        }
      ]
    }
  ]
}
```

#### Error Responses
- **400 Bad Request**: Returned when the request parameters are invalid (e.g., incorrect chain IDs, token addresses, or amounts).
- **404 Not Found**: Returned if the specified 'to' or 'from' token is not found or supported.
```

--------------------------------

### Quote API Endpoint

Source: https://docs.li.fi/api-reference/get-a-quote-for-a-token-transfer

This endpoint allows you to get a quote for a cryptocurrency transfer. You can specify preferred or denied bridges and exchanges, as well as various other parameters to customize the quote.

```APIDOC
## POST /quote

### Description
Retrieves a quote for a cryptocurrency transfer, allowing customization of preferred/denied bridges and exchanges, and other transaction parameters.

### Method
POST

### Endpoint
/quote

### Parameters
#### Header Parameters
- **x-lifi-api-key** (string) - Required - Authentication header, contact support if you want to get registered.

#### Request Body
- **denyBridges** (array) - Optional - List of bridges that are not allowed for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint. Also values `all`, `none`, `default` and `[]` are acceptable and mean all tools of the current type (`all`), no tools (for `none` and `[]` cases) and default tool's settings on the current stage.
- **denyExchanges** (array) - Optional - List of exchanges that are not allowed for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint. Also values `all`, `none`, `default` and `[]` are acceptable and mean all tools of the current type (`all`), no tools (for `none` and `[]` cases) and default tool's settings on the current stage.
- **preferBridges** (array) - Optional - List of bridges that should be preferred for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint. Also values `all`, `none`, `default` and `[]` are acceptable and mean all tools of the current type (`all`), no tools (for `none` and `[]` cases) and default tool's settings on the current stage.
- **preferExchanges** (array) - Optional - List of exchanges that should be preferred for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint. Also values `all`, `none`, `default` and `[]` are acceptable and mean all tools of the current type (`all`), no tools (for `none` and `[]` cases) and default tool's settings on the current stage.
- **allowDestinationCall** (boolean) - Optional - Whether swaps or other contract calls should be allowed as part of the destination transaction of a bridge transfer. Separate swap transactions on the destination chain are not affected by this flag. By default, parameter is `true`.
- **fromAmountForGas** (string) - Optional - The amount of the token to convert to gas on the destination side.
- **maxPriceImpact** (number) - Optional - The price impact threshold above which routes are hidden. As an example, one should specify 0.15 (15%) to hide routes with more than 15% price impact. The default is 10%.
- **swapStepTimingStrategies** (array) - Optional - Timing setting to wait for a certain amount of swap rates. In the format `minWaitTime-${minWaitTimeMs}-${startingExpectedResults}-${reduceEveryMs}`. Please check [docs.li.fi](https://docs.li.fi) for more details.
- **routeTimingStrategies** (array) - Optional - Timing setting to wait for a certain amount of routes to be generated before choosing the best one. In the format `minWaitTime-${minWaitTimeMs}-${startingExpectedResults}-${reduceEveryMs}`. Please check [docs.li.fi](https://docs.li.fi) for more details.
- **skipSimulation** (boolean) - Optional - Parameter to skip transaction simulation. The quote will be returned faster but the transaction gas limit won't be accurate.

### Request Example
```json
{
  "denyBridges": ["all"],
  "preferExchanges": ["Uniswap"],
  "maxPriceImpact": 0.15,
  "skipSimulation": true
}
```

### Response
#### Success Response (200)
- **id** (string) - The unique identifier for the quote.

#### Response Example
```json
{
  "id": "quote_abc123"
}
```
```

--------------------------------

### Define Widget Wallet and General Configuration Interfaces

Source: https://docs.li.fi/integrate-li.fi-widget/wallet-management

These TypeScript interfaces define the structure for widget wallet configuration and general widget configuration. WidgetWalletConfig includes options for connection callbacks and specific wallet parameters (WalletConnect, Coinbase Wallet). WidgetConfig can optionally include walletConfig.

```typescript
interface WidgetWalletConfig {
  onConnect(): void;
  walletConnect?: WalletConnectParameters;
  coinbase?: CoinbaseWalletParameters;
}

interface WidgetConfig {
  // ...
  walletConfig?: WidgetWalletConfig;
}

```

--------------------------------

### Create LI.FI SDK Configuration (TypeScript)

Source: https://docs.li.fi/sdk/configure-sdk

Initialize the LI.FI SDK with essential configuration settings. This includes specifying your integrator name. The configuration object provides shared settings required for other SDK features and can be updated dynamically.

```typescript
import { createConfig } from "@lifi/sdk";

createConfig({
  integrator: "Your dApp/company name",
});
```

--------------------------------

### Request a Quote

Source: https://docs.li.fi/integrate-li.fi-sdk/request-routes-quotes

Requests the best available quote for a cross-chain token swap or bridge transfer. The response includes all necessary information and transaction data to initiate the swap.

```APIDOC
## POST /quote

### Description
Requests the best available quote for a cross-chain token swap or bridge transfer. The response includes all necessary information and transaction data to initiate the swap.

### Method
POST

### Endpoint
/quote

### Parameters
#### Request Body
- **fromChain** (number) - Required - The ID of the source chain (e.g., Ethereum mainnet is 1).
- **fromToken** (string) - Required - The contract address of the token on the source chain. Ensure this address corresponds to the specified `fromChain`.
- **fromAmount** (string) - Required - The amount to be transferred from the source chain, specified in the smallest unit of the token (e.g., wei for ETH).
- **fromAddress** (string) - Required - The address from which the tokens are being transferred.
- **toChain** (number) - Required - The ID of the destination chain (e.g., Optimism is 10).
- **toToken** (string) - Required - The contract address of the token on the destination chain. Ensure this address corresponds to the specified `toChain`.
- **toAddress** (string) - Optional - The address to which the tokens will be sent on the destination chain once the transaction is completed.
- **fromAmountForGas** (string) - Optional - Part of the LI.Fuel. Allows receiving a part of the bridged tokens as gas on the destination chain. Specified in the smallest unit of the token.

### Request Example
```json
{
  "fromChain": 42161, 
  "toChain": 10, 
  "fromToken": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", 
  "toToken": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", 
  "fromAmount": "10000000", 
  "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
}
```

### Response
#### Success Response (200)
- **quote** (object) - Contains detailed quote information including routes, estimated amounts, gas fees, and transaction data.

#### Response Example
```json
{
  "quote": {
    "id": "0xabc123...",
    "routes": [
      {
        "feeCosts": [],
        "status": "SUCCESS",
        "amount": "9.99 DAI",
        "gasCosts": [],
        "providerName": "1inch",
        "providerType": "DEX"
      }
    ]
  }
}
```
```

--------------------------------

### GET /v1/analytics/transfers/summary

Source: https://docs.li.fi/api-reference/get-the-total-amount-of-a-token-received-on-a-specific-chain-for-cross-chain-transfers

Retrieves a summary of transfer analytics. This endpoint allows filtering by various parameters such as timestamps, chains, tokens, and integrators. It supports pagination for large datasets.

```APIDOC
## GET /v1/analytics/transfers/summary

### Description
Retrieves a summary of transfer analytics, allowing filtering by various parameters and supporting pagination.

### Method
GET

### Endpoint
/v1/analytics/transfers/summary

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Pagination limit. Defines the maximum number of returned results. Defaults to 10.
- **next** (string) - Optional - The next page cursor. Must come from the `next` field of the response of the previous request.
- **previous** (string) - Optional - The previous page cursor. Must come from the `previous` field of the response of the previous request.
- **fromTimestamp** (string) - Required - A Unix timestamp in seconds marking the start of the query period, inclusive. Transactions older than this timestamp will not be included in the summary.
- **toTimestamp** (string) - Required - A Unix timestamp in seconds marking the end of the query period, inclusive. Transactions after this timestamp will not be included in the summary. The maximum range supported by the endpoint is 30 days.
- **toChain** (string) - Required - The ID, or key of the chain on the receiving side of the transfer. This parameter filters the summary to include only transfers received on the specified chain.
- **toToken** (number) - Required - The address, or symbol of the token received in the transfers. This parameter filters the summary to include only transfers involving the specified token on the receiving chain.
- **fromChain** (number) - Optional - The ID, or key of the chain on the sending side of the transfers. This parameter filters the summary to include only transfers sent from the specified chain.
- **integrator** (string) - Optional - The integrator string to filter transfers by. This parameter filters the summary to include only transfers for the given integrator.

### Request Example
```http
GET https://li.quest/v1/analytics/transfers/summary?fromTimestamp=1678886400&toTimestamp=1681478400&toChain=ethereum&toToken=USDC
```

### Response
#### Success Response (200)
- **hasNext** (boolean) - Flag indicating if there is a next page. Defaults to false.
- **hasPrevious** (boolean) - Flag indicating if there is a previous page. Defaults to false.
- **next** (string | null) - Cursor for fetching the next page. Should be passed to `next` in the pagination query.
- **previous** (string | null) - Cursor for fetching the previous page. Should be passed to `previous` in the pagination query.
- **data** (array) - An array containing the paginated data returned by the endpoint. Each item in the array is an object conforming to the `TransfersSummaryResult` schema.

#### Response Example
```json
{
  "hasNext": false,
  "hasPrevious": false,
  "next": null,
  "previous": null,
  "data": [
    {
      "id": "transfer_id_1",
      "fromChainId": 1,
      "toChainId": 137,
      "fromTokenAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "toTokenAddress": "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      "fromAmount": "1000000",
      "toAmount": "995000",
      "timestamp": 1678890000,
      "status": "completed",
      "integrator": "li_fi"
    }
  ]
}
```
```

--------------------------------

### GET /v1/analytics/transfers

Source: https://docs.li.fi/api-reference/get-a-paginated-list-of-filtered-transfers

Retrieves a paginated list of transfers, allowing filtering by specific properties. This endpoint provides a way to query transfer data with various filter criteria.

```APIDOC
## GET /v1/analytics/transfers

### Description
Retrieves a paginated list of transfers, allowing filtering by specific properties. This endpoint provides a way to query transfer data with various filter criteria.

### Method
GET

### Endpoint
/v1/analytics/transfers

### Parameters
#### Query Parameters
- **filter_property_1** (string) - Optional - Description of the first filter property
- **filter_property_2** (string) - Optional - Description of the second filter property
- **page** (integer) - Optional - The page number for pagination
- **limit** (integer) - Optional - The number of items per page

### Request Example
```
GET /v1/analytics/transfers?filter_property_1=value1&page=1&limit=10
```

### Response
#### Success Response (200)
- **transfers** (array) - A list of transfer objects.
  - **transfer_id** (string) - The unique identifier for the transfer.
  - **amount** (number) - The amount of the transfer.
  - **timestamp** (string) - The timestamp when the transfer occurred.
- **pagination** (object) - Pagination information.
  - **currentPage** (integer) - The current page number.
  - **totalPages** (integer) - The total number of pages available.
  - **totalItems** (integer) - The total number of items across all pages.

#### Response Example
```json
{
  "transfers": [
    {
      "transfer_id": "tx_12345",
      "amount": 100.50,
      "timestamp": "2023-10-27T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50
  }
}
```
```

--------------------------------

### POST /websites/li_fi

Source: https://docs.li.fi/api-reference/advanced/populate-a-step-with-transaction-data

This endpoint is used to retrieve transaction data for a given swap operation within the LiFi ecosystem. It details the steps involved, including the protocols used, token amounts, and estimated gas costs.

```APIDOC
## POST /websites/li_fi

### Description
This endpoint is used to retrieve transaction data for a given swap operation within the LiFi ecosystem. It details the steps involved, including the protocols used, token amounts, and estimated gas costs.

### Method
POST

### Endpoint
/websites/li_fi

### Parameters
#### Request Body
- **logoURI** (string) - Required - The URI of the logo for the token.
- **toTokenAmount** (string) - Required - The amount of the destination token.
- **fromTokenAmount** (string) - Required - The amount of the source token.
- **protocols** (array) - Required - A list of protocols used in the transaction.
  - **name** (string) - Required - The name of the protocol.
  - **part** (integer) - Required - The percentage of the transaction handled by this protocol.
  - **fromTokenAddress** (string) - Required - The address of the source token in this protocol step.
  - **toTokenAddress** (string) - Required - The address of the destination token in this protocol step.
- **estimatedGas** (integer) - Required - The estimated gas cost for the transaction.
- **integrator** (string) - Required - The integrator name.
- **transactionRequest** (object) - Required - The details of the transaction request.
  - **from** (string) - Required - The sender's address.
  - **to** (string) - Required - The recipient's address.
  - **chainId** (integer) - Required - The chain ID.
  - **data** (string) - Required - The transaction data.
  - **value** (string) - Required - The value of the transaction.
  - **gasPrice** (string) - Required - The gas price.
  - **gasLimit** (string) - Required - The gas limit.
- **includedSteps** (array) - Required - A list of steps included in the transaction.
  - **id** (string) - Required - The ID of the step.
  - **type** (string) - Required - The type of step (e.g., 'swap').
  - **tool** (string) - Required - The tool used for the step.
  - **toolDetails** (object) - Required - Details about the tool.
    - **key** (string) - Required - The key of the tool.
    - **logoURI** (string) - Required - The logo URI of the tool.
    - **name** (string) - Required - The name of the tool.
  - **action** (object) - Required - The action performed in the step.
    - **fromChainId** (integer) - Required - The source chain ID.
    - **toChainId** (integer) - Required - The destination chain ID.
    - **fromToken** (object) - Required - Details of the source token.
      - **address** (string) - Required - The token address.
      - **symbol** (string) - Required - The token symbol.
      - **decimals** (integer) - Required - The token decimals.
      - **chainId** (integer) - Required - The chain ID.
      - **name** (string) - Required - The token name.
      - **coinKey** (string) - Required - The coin key.
      - **priceUSD** (string) - Required - The price of the token in USD.
      - **logoURI** (string) - Required - The logo URI of the token.
    - **toToken** (object) - Required - Details of the destination token.
      - **name** (string) - Required - The token name.
      - **symbol** (string) - Required - The token symbol.
      - **coinKey** (string) - Required - The coin key.
      - **decimals** (integer) - Required - The token decimals.
      - **chainId** (integer) - Required - The chain ID.
      - **logoURI** (string) - Required - The logo URI of the token.
      - **address** (string) - Required - The token address.
    - **fromAmount** (string) - Required - The source token amount.
    - **slippage** (number) - Required - The slippage tolerance.
    - **fromAddress** (string) - Required - The source address.
    - **toAddress** (string) - Required - The destination address.
  - **estimate** (object) - Required - The estimation of the step.
    - **fromAmount** (string) - Required - The estimated source token amount.
    - **toAmount** (string) - Required - The estimated destination token amount.
    - **toAmountMin** (string) - Required - The minimum destination token amount.
    - **approvalAddress** (string) - Required - The address for token approval.
    - **feeCosts** (array) - Required - A list of fee costs.
    - **gasCosts** (array) - Required - A list of gas costs.
      - **type** (string) - Required - The type of gas cost.
      - **price** (string) - Required - The gas price.
      - **estimate** (string) - Required - The estimated gas amount.
      - **limit** (string) - Required - The gas limit.
      - **amount** (string) - Required - The gas amount.
      - **amountUSD** (string) - Required - The gas amount in USD.
      - **token** (object) - Required - Details of the token for gas costs.
        - **address** (string) - Required - The token address.
        - **symbol** (string) - Required - The token symbol.
        - **decimals** (integer) - Required - The token decimals.
        - **chainId** (integer) - Required - The chain ID.
        - **name** (string) - Required - The token name.
        - **coinKey** (string) - Required - The coin key.
        - **priceUSD** (string) - Required - The price of the token in USD.
        - **logoURI** (string) - Required - The logo URI of the token.
    - **data** (object) - Required - The transaction data for the step.
      - **fromToken** (object) - Required - Details of the source token.
        - **name** (string) - Required - The token name.
        - **address** (string) - Required - The token address.
        - **symbol** (string) - Required - The token symbol.
        - **decimals** (integer) - Required - The token decimals.
        - **logoURI** (string) - Required - The logo URI of the token.
      - **toToken** (object) - Required - Details of the destination token.
        - **name** (string) - Required - The token name.
        - **address** (string) - Required - The token address.
        - **symbol** (string) - Required - The token symbol.
        - **decimals** (integer) - Required - The token decimals.
        - **logoURI** (string) - Required - The logo URI of the token.
      - **toTokenAmount** (string) - Required - The destination token amount.
      - **fromTokenAmount** (string) - Required - The source token amount.
      - **protocols** (array) - Required - A list of protocols used.
        - **name** (string) - Required - The name of the protocol.
        - **part** (integer) - Required - The percentage of the transaction handled by this protocol.
        - **fromTokenAddress** (string) - Required - The address of the source token in this protocol step.
        - **toTokenAddress** (string) - Required - The address of the destination token in this protocol step.
      - **estimatedGas** (integer) - Required - The estimated gas cost for the step.

### Request Example
```json
{
  "logoURI": "https://minerva.digital/i/MIVA-Token_200x200.png",
  "toTokenAmount": "21922914496086353975",
  "fromTokenAmount": "1000000000000000000",
  "protocols": [
    [
      [
        {
          "name": "GNOSIS_HONEYSWAP",
          "part": 100,
          "fromTokenAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
          "toTokenAddress": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51"
        }
      ]
    ]
  ],
  "estimatedGas": 252364,
  "integrator": "fee-demo",
  "transactionRequest": {
    "from": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
    "to": "0x1111111254fb6c44bac0bed2854e76f90643097d",
    "chainId": 100,
    "data": "0x...",
    "value": "0x0de0b6b3a7640000",
    "gasPrice": "0xb2d05e00",
    "gasLimit": "0x0e9cb2"
  },
  "includedSteps": [
    {
      "id": "a8dc011a-f52d-4492-9e99-21de64b5453a",
      "type": "swap",
      "tool": "1inch",
      "toolDetails": {
        "key": "1inch",
        "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/oneinch.svg",
        "name": "1inch"
      },
      "action": {
        "fromChainId": 100,
        "toChainId": 100,
        "fromToken": {
          "address": "0x0000000000000000000000000000000000000000",
          "symbol": "xDai",
          "decimals": 18,
          "chainId": 100,
          "name": "xDai",
          "coinKey": "xDai",
          "priceUSD": "1",
          "logoURI": "https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png"
        },
        "toToken": {
          "name": "Minerva Wallet SuperToken",
          "symbol": "MIVA",
          "coinKey": "MIVA",
          "decimals": 18,
          "chainId": 100,
          "logoURI": "https://minerva.digital/i/MIVA-Token_200x200.png",
          "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51"
        },
        "fromAmount": "1000000000000000000",
        "slippage": 0.003,
        "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
        "toAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
      },
      "estimate": {
        "fromAmount": "1000000000000000000",
        "toAmount": "21922914496086353975",
        "toAmountMin": "21265227061203763356",
        "approvalAddress": "0x1111111254fb6c44bac0bed2854e76f90643097d",
        "feeCosts": [],
        "gasCosts": [
          {
            "type": "SEND",
            "price": "1",
            "estimate": "252364",
            "limit": "315455",
            "amount": "252364",
            "amountUSD": "0.00",
            "token": {
              "address": "0x0000000000000000000000000000000000000000",
              "symbol": "xDai",
              "decimals": 18,
              "chainId": 100,
              "name": "xDai",
              "coinKey": "xDai",
              "priceUSD": "1",
              "logoURI": "https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png"
            }
          }
        ],
        "data": {
          "fromToken": {
            "name": "xDAI",
            "address": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            "symbol": "xDAI",
            "decimals": 18,
            "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png"
          },
          "toToken": {
            "name": "Minerva Wallet SuperToken",
            "address": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51",
            "symbol": "MIVA",
            "decimals": 18,
            "logoURI": "https://minerva.digital/i/MIVA-Token_200x200.png"
          },
          "toTokenAmount": "21922914496086353975",
          "fromTokenAmount": "1000000000000000000",
          "protocols": [
            [
              [
                {
                  "name": "GNOSIS_HONEYSWAP",
                  "part": 100,
                  "fromTokenAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                  "toTokenAddress": "0x63e62989d9eb2d37dfdb1f93a22f063635b07d51"
                }
              ]
            ]
          ],
          "estimatedGas": 252364
        }
      }
    }
  ]
}
```

### Response
#### Success Response (200)
- **description** (string) - Description of the step populated with the transaction data.

#### Response Example
```json
{
  "description": "The step populated with the transaction data"
}
```

### Error Handling
#### 400 Bad Request
- **type** (any) - Invalid Step Request.
```

--------------------------------

### Control LI.FI Drawer Widget with Ref

Source: https://docs.li.fi/integrate-li.fi-widget/select-widget-variants

This example shows how to control the LI.FI Widget when using the 'drawer' variant. It utilizes a `useRef` hook to access the widget's methods, such as `toggleDrawer`, to programmatically open or close the drawer.

```typescript
import { useRef } from 'react';
import { LiFiWidget, WidgetDrawer } from '@lifi/widget';

export const WidgetPage = () => {
  const drawerRef = useRef<WidgetDrawer>(null);

  const toggleWidget = () => {
    drawerRef.current?.toggleDrawer();
  };

  return (
    <div>
      <button onClick={toggleWidget}>Open LI.FI Widget</button>
      <LiFiWidget
        ref={drawerRef}
        config={{
          variant: 'drawer',
        }}
        integrator="drawer-example"
      />
    </div>
  );
}

```

--------------------------------

### Get Connections

Source: https://docs.li.fi/api-reference/returns-all-possible-connections-based-on-a-from-or-tochain

Retrieves all possible connections between chains based on a specified 'from' or 'to' chain. Filtering by chain, token, bridge, or exchange is required due to potential large result sizes.

```APIDOC
## GET /websites/li_fi

### Description
Returns all possible connections based on a from- or toChain. This endpoint gives information about all possible transfers between chains. Since the result can be very large it is required to filter by at least a chain, a token, a bridge, or an exchange.

### Method
GET

### Endpoint
/websites/li_fi

### Parameters
#### Query Parameters
- **fromChain** (string) - Optional - The starting chain for the connection.
- **toChain** (string) - Optional - The destination chain for the connection.
- **token** (string) - Optional - Filter by a specific token.
- **bridge** (string) - Optional - Filter by a specific bridge.
- **exchange** (string) - Optional - Filter by a specific exchange.

### Request Example
```
GET /websites/li_fi?fromChain=ethereum&token=USDC
```

### Response
#### Success Response (200)
- **connections** (array) - An array of possible connection objects.
  - **fromChain** (string) - The originating chain.
  - **toChain** (string) - The destination chain.
  - **token** (string) - The token involved in the transfer.
  - **bridge** (string) - The bridge used for the transfer.
  - **exchange** (string) - The exchange used for the transfer.

#### Response Example
```json
{
  "connections": [
    {
      "fromChain": "ethereum",
      "toChain": "polygon",
      "token": "USDC",
      "bridge": "polygon_bridge",
      "exchange": "uniswap"
    }
  ]
}
```
```

--------------------------------

### Get Active Routes

Source: https://docs.li.fi/integrate-li.fi-sdk/execute-routes-quotes

Retrieve routes that are currently being executed. This includes fetching all active routes or a specific active route by its ID.

```APIDOC
## Get Active Routes

### Description
Provides functions to retrieve routes that are currently in an active execution state. `getActiveRoutes` returns an array of all active routes, and `getActiveRoute` returns a single active route by its ID.

### Method
`getActiveRoutes(): RouteExtended[]`
`getActiveRoute(routeId: string): RouteExtended | undefined`

### Endpoint
N/A (Client-side functions)

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
```javascript
import { getActiveRoute, getActiveRoutes, RouteExtended } from '@lifi/sdk'

const activeRoutes: RouteExtended[] = getActiveRoutes();

const routeId = activeRoutes[0]?.routeId;

if (routeId) {
  const activeRoute = getActiveRoute(routeId);
  console.log(activeRoute);
}
```

### Response
#### Success Response (200)
- **activeRoutes** (RouteExtended[]) - An array of currently active routes.
- **activeRoute** (RouteExtended | undefined) - The specific active route object if found, otherwise undefined.

#### Response Example
```json
{
  "routeId": "0x123abc...",
  "steps": [
    // ... step details
  ],
  "status": "IN_PROGRESS"
}
```
```

--------------------------------

### Passing Timing Strategies in POST /v1/advanced/routes API Request

Source: https://docs.li.fi/guides/integration-tips/latency

Integrate custom timing strategies into your POST requests to the `/v1/advanced/routes` endpoint. This is done within the `options.timing` object, allowing separate configurations for `swapStepTimingStrategies` and `routeTimingStrategies` to optimize cross-chain path construction.

```json
{
  "...": "...",
  "options": {
    "timing": {
      "swapStepTimingStrategies": [
		{
          "strategy": "minWaitTime",
          "minWaitTimeMs": 600,
          "startingExpectedResults": 4,
          "reduceEveryMs": 300
        }
      ],
      "routeTimingStrategies": [
		{
          "strategy": "minWaitTime",
          "minWaitTimeMs": 1500,
          "startingExpectedResults": 6,
          "reduceEveryMs": 500
        }
      ]
    }
  }
}
```

--------------------------------

### Execute a Cross-Chain Route with LI.FI SDK

Source: https://docs.li.fi/integrate-li.fi-sdk/execute-routes-quotes

This snippet demonstrates how to execute a pre-obtained route using the `executeRoute` function from the LI.FI SDK. It includes fetching routes using `getRoutes` and configuring an `updateRouteHook` to monitor execution progress. Ensure SDK providers are configured before use.

```javascript
import { executeRoute, getRoutes } from '@lifi/sdk'

const result = await getRoutes({
  fromChainId: 42161, // Arbitrum
  toChainId: 10, // Optimism
  fromTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  toTokenAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI on Optimism
  fromAmount: '10000000', // 10 USDC
  // The address from which the tokens are being transferred.
  fromAddress: '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0'
})

const route = result.routes[0]

const executedRoute = await executeRoute(route, {
  // Gets called once the route object gets new updates
  updateRouteHook(route) {
    console.log(route)
  },
})

```

--------------------------------

### Get Multiple Token Balances (JavaScript)

Source: https://docs.li.fi/integrate-li.fi-sdk/token-management

Returns the balances for a list of tokens held by a wallet address. Requires the wallet address and an array of Token objects. Returns a Promise resolving to a list of TokenAmount objects. Requires EVM/Solana providers to be configured.

```javascript
import { ChainId, getTokenBalances, getTokens } from '@lifi/sdk';

const walletAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';

try {
  const tokensResponse = await getTokens();
  const optimismTokens = tokensResponse.tokens[ChainId.OPT];
  const tokenBalances = await getTokenBalances(walletAddress, optimismTokens);
  console.log(tokenBalances);
} catch (error) {
  console.error(error);
}
```

--------------------------------

### Get Token Balance for a Single Token

Source: https://docs.li.fi/sdk/token-management

Returns the balance of a specific token that a given wallet address holds. Requires SDK configuration with EVM/Solana providers.

```APIDOC
## Get Token Balance

### Description
Returns the balance of a specific token a wallet holds.

### Method
GET

### Endpoint
/balance/{walletAddress}/{token}

### Parameters
#### Path Parameters
- **walletAddress** (string) - Required - A wallet address.
- **token** (Token) - Required - A Token object representing the token to check.

### Response
#### Success Response (200)
- **tokenAmount** (TokenAmount | null) - A TokenAmount object representing the balance, or null if the balance cannot be retrieved.

### Request Example
```typescript
import { getToken, getTokenBalance } from '@lifi/sdk';

const chainId = 1;
const tokenAddress = '0x0000000000000000000000000000000000000000';
const walletAddress = '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0';

try {
  const token = await getToken(chainId, tokenAddress);
  const tokenBalance = await getTokenBalance(walletAddress, token);
  console.log(tokenBalance);
} catch (error) {
  console.error(error);
}
```
```

--------------------------------

### LI.FI Timing Strategies

Source: https://docs.li.fi/guides/integration-tips/latency

This section outlines different timing strategies used by the LI.FI API to manage provider response times. These strategies affect how LI.FI waits for results from various services.

```APIDOC
## Timing Strategy Examples

This section provides examples of different timing strategies that can be configured for the LI.FI API. These strategies are used to control the trade-off between the speed of receiving results and the completeness or quality of those results.

### Maximize Results

This strategy prioritizes obtaining the best possible routes, even if it means waiting longer.

#### Request Body Example

```json
{
  "strategy": "minWaitTime",
  "minWaitTimeMs": 900,
  "startingExpectedResults": 5,
  "reduceEveryMs": 300
}
```

### Balanced Approach

This strategy aims for a moderate balance between speed and completeness, waiting a reasonable amount of time to gather a good set of results.

#### Request Body Example

```json
{
  "strategy": "minWaitTime",
  "minWaitTimeMs": 900,
  "startingExpectedResults": 1,
  "reduceEveryMs": 300
}
```

### Fastest Possible Response

This strategy focuses on returning the very first result available without any additional delay.

#### Request Body Example

```json
{
  "strategy": "minWaitTime",
  "minWaitTimeMs": 0,
  "startingExpectedResults": 1,
  "reduceEveryMs": 300
}
```

### Time-Limited Return (timeout)

This strategy returns any result that is received within a specified fixed time limit.

#### Request Body Example

```json
{
  "strategy": "minWaitTime",
  "minWaitTimeMs": 900,
  "startingExpectedResults": 0,
  "reduceEveryMs": 0
}
```

<Note>
  The timing strategies are only used for how long LI.FI will wait for third party providers to respond. The total response time from the LI.FI API will be the sum of roundTripTime + parsing + strategies + simulation.
</Note>
```

--------------------------------

### Get Available Tokens (JavaScript)

Source: https://docs.li.fi/integrate-li.fi-sdk/token-management

Retrieves a list of all available tokens across specified or all chains. It accepts optional parameters for filtering by chain IDs or types. Returns a Promise resolving to a TokensResponse object.

```javascript
import { ChainType, getTokens } from '@lifi/sdk';

try {
  const tokens = await getTokens({
    chainTypes: [ChainType.EVM, ChainType.SVM],
  });
  console.log(tokens);
} catch (error) {
  console.error(error);
}
```

--------------------------------

### Solana to EVM Transaction Request Data Structure

Source: https://docs.li.fi/introduction/user-flows-and-examples/solana-tx-execution

Illustrates the structure of the 'transactionRequest' object for Solana to EVM transfers. For SOL -> EVM, it contains a 'data' parameter with base64 encoded Solana transaction data.

```json
"transactionRequest": {\
    "data": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAsUBmw6CY1QcV7385AuJb6tDdM71YrLbjDGeWn6/zWFZAEcjcsOlIINY3LYFWBe38OO1l26BSpzB1L1bYnVNorsXkDqoJZ5Mb5PNE07yLa8RJGvFV55ILi1+vklkapJoW1yUKv7UyXP9sO3ptc4QOktFqSHRb9AYoDxZXcodBKfc4vN6ai03uOqBMXcmI4cih1E71LnDKMQljw0rqlnVVKOn98YHXWKE3PmeT4MetR4/Ep7+sfN+1vkcpHlwGeEHZgK4EIcmnLsIpOTZxLFhBBVIsDwUJkuCB/B43O01pI8fuLzyjGxJMo5db7lPEcx8Ns2BJ8kYOoL0ob3fnQ0eN3JwPzibblpkKkSjSk1qpqwB4d5rSn1PrbBHf6rOIO/O/W6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABceQrkgrAQHdCyf7CIDjBD/Y4pzKA7iTYhaafiX1eik37c9HIG4v1EeQo1ENAm3KHS+LCOKkZ4WQntGZQgIyu7ixIazui3zX0pmHiw3K3u/XdzSJfZ+ugLzVfJnnOn3v2RmLUngAdF+k4G2bOshpHaEkSZUr1Y1/vT3G9R/qU8zKFLzTYC6vfOspR18AlAfdoQQSzchbXIKs9TVzmL7XEYAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAADG+nrzvtutOj1l82qryXQxsbvkwtL24OR8pgIDRS9dYceCg/3UzgsruALUdoCSm3XiyBz8VtBPnGEIhrYpcBQ26zvkSidWkhDjuJPqY+9JDKulE8Bq2dVUioc+URRKUUsG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqTLHwyN3CxGdzcZNzliJWl0TJu3X7nF6oB9sysdDGG/6Ag8ABQJAQg8ADhMAAAcQBAMMAQgRAgYLDRIFChMJccw/qau6fVaf/aDz3hWN+Sh9oNuBvkrLv0ttxmLuxpa1pXsmnZ0BxMAAAAAAAAAAAAAAAABVIAjA9ocML3flzB0uub3/A+MOoAUAAAAAAAAAAAAAAAAnkbyh8t5GYe2IowyZp6lEmqhBdOkDAAAAAAAA"
}
```

--------------------------------

### GET /websites/li_fi

Source: https://docs.li.fi/li.fi-api/li.fi-api/getting-all-possible-connections

Retrieves available cross-chain connections based on specified parameters. This endpoint is crucial for understanding the possible routes for token transfers and smart contract interactions across different blockchains.

```APIDOC
## GET /websites/li_fi

### Description
Retrieves available cross-chain connections and token information between specified chains. This endpoint allows users to discover potential routes for transferring tokens and executing smart contract calls across different blockchain networks.

### Method
GET

### Endpoint
/websites/li_fi

### Headers
- **x-lifi-api-key** (string) - Required - Authentication header. Contact support for registration.

### Query Parameters
- **fromChain** (string) - Optional - The chain ID from which the connection should start.
- **toChain** (string) - Optional - The chain ID to which the connection should end.
- **fromToken** (string) - Optional - The token address to filter connections starting with this token.
- **toToken** (string) - Optional - The token address to filter connections ending with this token.
- **chainTypes** (string) - Optional - Restrict the resulting tokens to the given chain types (e.g., 'evm', 'solana').
- **allowBridges** (string[]) - Optional - List of bridges that are allowed for this transaction. Retrieve the current catalog from the `/v1/tools` endpoint.
- **denyBridges** (string[]) - Optional - List of bridges that are not allowed for this transaction.
- **preferBridges** (string[]) - Optional - List of bridges that should be preferred for this transaction.
- **allowExchanges** (string[]) - Optional - List of exchanges that are allowed for this transaction.
- **denyExchanges** (string[]) - Optional - List of exchanges that are not allowed for this transaction.
- **preferExchanges** (string[]) - Optional - List of exchanges that should be preferred for this transaction.
- **allowSwitchChain** (boolean) - Optional - Defaults to `true`. Whether connections that require a chain switch should be included.
- **allowDestinationCall** (boolean) - Optional - Defaults to `true`. Whether connections that include a destination call should be included.

### Response
#### Success Response (200)
- **fromChainId** (integer) - The ID of the source chain.
- **toChainId** (integer) - The ID of the destination chain.
- **fromTokens** (array) - List of tokens available on the source chain.
  - **address** (string) - Token contract address.
  - **decimals** (integer) - Number of decimal places for the token.
  - **symbol** (string) - Token symbol (e.g., 'USDC').
  - **chainId** (integer) - The chain ID where the token resides.
  - **coinKey** (string) - A unique key for the coin.
  - **name** (string) - The full name of the token.
  - **logoURI** (string) - URL for the token's logo.
  - **priceUSD** (string) - The current price of the token in USD.
- **toTokens** (array) - List of tokens available on the destination chain.
  - (Same structure as `fromTokens`)

#### Response Example
```json
{
  "fromChainId": 10,
  "toChainId": 56,
  "fromTokens": [
    {
      "address": "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
      "decimals": 6,
      "symbol": "USDC",
      "chainId": 10,
      "coinKey": "USDC",
      "name": "USDC",
      "logoURI": "https://static.debank.com/image/op_token/logo_url/0x7f5c764cbc14f9669b88837ca1490cca17c31607/773a0161709a55edc211c3fa67f7c1a7.png",
      "priceUSD": "1"
    }
  ],
  "toTokens": [
    {
      "address": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
      "decimals": 18,
      "symbol": "USDC",
      "chainId": 56,
      "coinKey": "USDC",
      "name": "USDC",
      "logoURI": "https://static.debank.com/image/bsc_token/logo_url/0x8ac76a51cc950d9822d68b83f0e1ad97b32cd580d/fffcd27b9efff5a86ab942084c05924d.png",
      "priceUSD": "1"
    }
  ]
}
```
```

---

## Oikonomos Integration Notes

### Why LI.FI is NOT used for core multi-hop routing (OIK-22)

LI.FI was evaluated but rejected for the Strategy Agent's core routing because:

1. **ReceiptHook Bypass**: LI.FI routes through its own aggregator contracts, bypassing our Uniswap v4 ReceiptHook. This breaks the accountability/attribution model that is central to Oikonomos.

2. **No Uniswap v4 Support**: LI.FI primarily supports Uniswap v2/v3 and other DEXs, but not Uniswap v4 hooks which are essential for our trust architecture.

3. **No Sepolia Testnet**: LI.FI's API doesn't support Sepolia, where our contracts are deployed.

### Where LI.FI COULD be useful in Oikonomos

LI.FI may be valuable for future features:

1. **Cross-chain rebalancing**: If a strategy needs to move assets between chains (e.g., from Ethereum mainnet to Arbitrum), LI.FI's bridge aggregation would be useful. This would be a separate "bridge step" outside the core ReceiptHook-monitored swaps.

2. **Fiat on-ramp optimization**: For consumer onboarding, LI.FI could help find optimal paths from fiat → target token across multiple chains.

3. **Multi-chain portfolio views**: LI.FI's token/chain APIs could help display user positions across multiple chains.

4. **Mainnet production routing (partial)**: For large trades where liquidity is fragmented, LI.FI could handle the "external" portion while we retain a ReceiptHook-monitored "core" portion for accountability.

**Key constraint**: Any LI.FI integration must not replace the ReceiptHook-monitored swaps that provide the trust/attribution guarantees.

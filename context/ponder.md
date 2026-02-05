### Basic Hono App Setup

Source: https://hono.dev/

This snippet demonstrates the basic setup of a Hono web application. It initializes a Hono app and defines a simple GET route for the root path that returns 'Hello Hono!'. This is a foundational example for starting with Hono.

```javascript
import { Hono } from 'hono'
const app = new Hono()

app.get('/', (c) => c.text('Hello Hono!'))

export default app
```

--------------------------------

### Basic Hono App Setup (TypeScript)

Source: https://hono.dev/docs

This snippet demonstrates the fundamental setup of a Hono application. It imports the Hono class, creates an app instance, defines a simple GET route for the root path that returns 'Hono!', and exports the app. This is a foundational example for getting started with Hono.

```typescript
import { Hono } from 'hono'

const app = new Hono ()

app.get('/', (c) => c.text('Hono!'))

export default app
```

--------------------------------

### Install Wagmi CLI

Source: https://wagmi.sh/cli/getting-started

Installs the Wagmi CLI tool as a development dependency in your project. This command is compatible with pnpm, npm, yarn, and bun package managers.

```bash
pnpm add -D @wagmi/cli
```

```bash
npm install --save-dev @wagmi/cli
```

```bash
yarn add -D @wagmi/cli
```

```bash
bun add -D @wagmi/cli
```

--------------------------------

### Install ABIType with pnpm, bun, or yarn

Source: https://abitype.dev/guide/getting-started

Installs the ABIType package into your project using your preferred package manager (pnpm, bun, or yarn). ABIType requires typescript@>=5.0.4.

```bash
pnpm add abitype
```

--------------------------------

### Advanced Wagmi CLI Configuration with Contracts and Plugins

Source: https://wagmi.sh/cli/getting-started

An example Wagmi CLI configuration file demonstrating how to include contracts (e.g., ERC-20 ABI from Viem) and plugins like Etherscan and React. It configures fetching ABIs from Etherscan and generating React hooks.

```typescript
import { defineConfig } from '@wagmi/cli'
import { etherscan, react } from '@wagmi/cli/plugins'
import { erc20Abi } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    {
      name: 'erc20',
      abi: erc20Abi,
    },
  ],
  plugins: [
    etherscan({
      apiKey: process.env.ETHERSCAN_API_KEY!,
      chainId: mainnet.id,
      contracts: [
        {
          name: 'EnsRegistry',
          address: {
            [mainnet.id]: '0x314159265dd8dbb310642f98f50c066173c1259b',
            [sepolia.id]: '0x112234455c3a32fd11230c42e7bccd4a84e02010',
          },
        },
      ],
    }),
    react(),
  ],
})
```

--------------------------------

### Create New Ponder Project using pnpm

Source: https://ponder.sh/docs/0.10/get-started

Initializes a new Ponder project with a chosen template. This command automates the setup of project structure, dependencies, and configuration files. It prompts the user for project name and template choice.

```shell
pnpm create ponder
```

--------------------------------

### Using Generated Wagmi CLI Hooks

Source: https://wagmi.sh/cli/getting-started

Demonstrates how to import and utilize generated React hooks from Wagmi CLI within a project. This example shows fetching the balance of an ERC-20 token.

```typescript
import { useReadErc20, useReadErc20BalanceOf } from './generated'

// Use the generated ERC-20 read hook
const { data } = useReadErc20({
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  functionName: 'balanceOf',
  args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
})

// Use the generated ERC-
```

--------------------------------

### Start Ponder Development Server using pnpm

Source: https://ponder.sh/docs/0.10/get-started

Starts the Ponder local development server, which includes connecting to the database, launching the HTTP server, and initiating the data indexing process. It provides real-time logs for build status, database connections, table creation, server status, and indexing progress.

```shell
pnpm dev
```

--------------------------------

### Initialize Ponder Project using npm, pnpm, or yarn

Source: https://github.com/ponder-sh/ponder

This snippet shows how to initiate a new Ponder project using the create-ponder CLI. It guides users to create a project directory, install dependencies, and initialize a Git repository. The command is available for npm, pnpm, and yarn package managers.

```shell
npm init ponder@latest
# or
pnpm create ponder
# or
yarn create ponder
```

--------------------------------

### Predev Script for Generation (package.json)

Source: https://wagmi.sh/cli/getting-started

This configuration snippet shows how to set up a 'predev' script in a package.json file to automatically run a 'generate' command before starting the development server. This ensures that generated files are up-to-date before development begins, preventing potential issues caused by stale generated code.

```json
"scripts": {
  "predev": "generate",
  "dev": "next dev"
}
```

--------------------------------

### Start Ponder Development Server using npm, pnpm, or yarn

Source: https://github.com/ponder-sh/ponder

This code demonstrates how to start the Ponder development server, which provides features like hot reloading and logging of console statements and errors. It's executed after navigating into the project directory and is available for npm, pnpm, and yarn.

```shell
npm run dev
# or
pnpm dev
# or
yarn dev
```

--------------------------------

### Project Setup and Dependency Installation

Source: https://github.com/marktoda/v4-ponder

Instructions for cloning the repository and installing project dependencies using npm, yarn, or pnpm. Assumes Node.js and a package manager are installed.

```shell
git clone cd v4-ponder
npm install
# or yarn install
# or pnpm install
```

--------------------------------

### Basic Wagmi CLI Configuration (TypeScript)

Source: https://wagmi.sh/cli/getting-started

A minimal Wagmi CLI configuration file in TypeScript. It specifies the output file for generated code and initializes empty arrays for contracts and plugins.

```typescript
import { defineConfig } from '@wagmi/cli'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [],
  plugins: [],
})
```

--------------------------------

### Interactive GraphQL Query Example

Source: https://graphql.org/learn

Provides an example of an interactive GraphQL query for learning purposes, suggesting adding fields to an object to observe updated results. This is part of an interactive guide.

```graphql
Operation {
  hero {
    name # add additional fields here!
  }
}
```

--------------------------------

### Run Wagmi CLI Code Generation

Source: https://wagmi.sh/cli/getting-started

Executes the Wagmi CLI's code generation process based on the configuration file. This command is supported by pnpm, npm, yarn, and bun.

```bash
pnpm wagmi generate
```

```bash
npx wagmi generate
```

```bash
yarn wagmi generate
```

```bash
bun wagmi generate
```

--------------------------------

### Initialize Wagmi CLI Configuration

Source: https://wagmi.sh/cli/getting-started

Initializes a Wagmi CLI configuration file. It automatically creates `wagmi.config.ts` if TypeScript is detected, otherwise `wagmi.config.js`. This command is available for pnpm, npm, yarn, and bun.

```bash
pnpm wagmi init
```

```bash
npx wagmi init
```

```bash
yarn wagmi init
```

```bash
bun wagmi init
```

--------------------------------

### GraphQL API Setup

Source: https://ponder.sh/docs/query/graphql

This section details how to enable the GraphQL API by registering the `graphql` Hono middleware and provides an example of the `src/api/index.ts` file.

```APIDOC
## POST /graphql

### Description
Enables the GraphQL API for querying the Ponder database.

### Method
POST

### Endpoint
/graphql

### Parameters
#### Request Body
- **query** (String) - Required - The GraphQL query string.
- **variables** (Object) - Optional - Variables for the GraphQL query.

### Request Example
```json
{
  "query": "{ persons { id name } }",
  "variables": {}
}
```

### Response
#### Success Response (200)
- **data** (Object) - The result of the GraphQL query.
- **errors** (Array) - An array of errors, if any occurred.

#### Response Example
```json
{
  "data": {
    "persons": [
      { "id": 1, "name": "Alice" },
      { "id": 2, "name": "Bob" }
    ]
  }
}
```
```

--------------------------------

### Start Ponder Development Server

Source: https://github.com/ponder-sh/ponder/tree/main/examples/with-foundry

Starts the Ponder development server using pnpm. Ponder is a framework for building reliable data services from blockchains. This command initiates the development environment for indexing and processing blockchain data. No specific inputs are required, and it outputs server status and logs.

```bash
pnpm ponder dev
```

--------------------------------

### Monorepo Ponder Start Command (npm)

Source: https://ponder.sh/docs/0.10/production/railway

For monorepo setups, this command navigates to the Ponder project root (e.g., 'packages/ponder') and then starts the Ponder application with the --schema option. It assumes an npm workspace.

```shell
cd packages/ponder && npm start
```

--------------------------------

### Ponder Configuration Example

Source: https://ponder.sh/docs/0.10/guides/foundry

This snippet shows a basic Ponder configuration, including importing contract ABI, address, and start block. It is a foundational part of setting up Ponder for indexing.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";

const config = createConfig({
  contracts: {
    Counter: {
      abi: counterABI,
      address: "0x123",
      startBlock: 1,
    },
  },
});
```

--------------------------------

### Running Anvil Local Node

Source: https://github.com/ponder-sh/ponder/tree/main/examples/with-foundry

This command starts a local Anvil node, a hardhat-compatible local Ethereum node. It's essential for local blockchain development and testing.

```bash
anvil --block-time 1
```

--------------------------------

### Start Ponder with Automated View Creation (CLI)

Source: https://ponder.sh/docs/production/self-hosting

Shows how to start a Ponder deployment using 'ponder start' with the '--views-schema' flag. This automatically runs the 'ponder db create-views' command upon deployment readiness, ensuring views always point to the latest tables.

```bash
pnpm start --schema=deployment-123 --views-schema=project-name
```

--------------------------------

### Monorepo Ponder Start Command (pnpm)

Source: https://ponder.sh/docs/0.10/production/railway

For monorepo setups, this command navigates to the Ponder project root (e.g., 'packages/ponder') and then starts the Ponder application with the --schema option. It assumes a pnpm workspace.

```shell
cd packages/ponder && pnpm start
```

--------------------------------

### Create HTTP Server in Node.js

Source: https://nodejs.org/en

This example demonstrates how to create a basic HTTP server using Node.js. It listens on port 3000 and responds with 'Hello World!'. Ensure Node.js is installed to run this code. The output is a running server that can be accessed via a web browser.

```javascript
import { createServer } from 'node:http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!\n');
});

// starts a simple http server locally on port 3000
server.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000');
});

// run with `node server.mjs`
```

--------------------------------

### Basic React Query Setup

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

Demonstrates the fundamental setup for using TanStack Query in a React application. It involves wrapping the application with QueryClientProvider and initializing a QueryClient instance. This setup is essential for managing server state across the application.

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

```

--------------------------------

### Install GraphiQL and Dependencies

Source: https://github.com/graphql/graphiql/tree/main/packages/graphiql

Installs the 'graphiql' package along with its peer dependencies 'react', 'react-dom', and 'graphql' using npm. This is the foundational step for using GraphiQL.

```bash
npm install graphiql react react-dom graphql
```

--------------------------------

### Windows specific global TypeScript path example

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

An example of how to specify the TypeScript SDK path in VS Code settings on Windows, when TypeScript is installed globally via npm. It uses the full path obtained from `npm root -g`.

```json
"typescript.tsdk": "C:\\Users\\myname\\AppData\\Roaming\\npm\\node_modules\\typescript\\lib"
```

--------------------------------

### Starting Anvil Local Testnet

Source: https://book.getfoundry.sh/guides/scripting-with-solidity

This snippet represents the command to start the Anvil local blockchain development environment. Anvil provides default accounts and private keys for local testing.

```bash
anvil
```

--------------------------------

### `@ponder/client` Installation

Source: https://ponder.sh/docs/0.10/api-reference/ponder-client

Installs the `@ponder/client` package using pnpm, yarn, or npm.

```APIDOC
## Installation

### Method

`pnpm` `yarn` `npm`

### Endpoint

N/A

### Request Body

N/A

### Response

N/A

### Request Example

```bash
pnpm add @ponder/client
```
```

--------------------------------

### Install @ponder/client with pnpm

Source: https://ponder.sh/docs/0.10/api-reference/ponder-client

Installs the @ponder/client package using the pnpm package manager. This is the first step to using the Ponder SQL client in your project.

```bash
pnpm add @ponder/client
```

--------------------------------

### Log Hot Reload and Indexing Progress

Source: https://ponder.sh/docs/0.10/get-started

This snippet represents log entries from a development server, showing the status of hot reloading a TypeScript file and the progress of indexing events. It provides timing and completion percentages.

```log
12:27:26 PM INFO build Hot reload 'src/index.ts'
12:27:29 PM INFO app Indexed 4999 events with 54.2% complete and 471ms remaining
12:27:29 PM INFO app Indexed 4999 events with 75.5% complete and 276ms remaining
12:27:29 PM INFO app Indexed 4998 events with 99.4% complete and 6ms remaining
12:27:29 PM INFO app Indexed 108 events with 100% complete and 0ms remaining
12:27:29 PM INFO indexing Completed historical indexing
```

--------------------------------

### Example of Setting TypeScript SDK Path (Windows)

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

This example shows how to configure the 'typescript.tsdk' setting in Visual Studio Code for a user on Windows. It specifies a path pointing to a globally installed TypeScript version managed by npm. Note the use of double backslashes for proper escaping of the Windows file path.

```json
{
  "typescript.tsdk": "C:\\Users\\username\\AppData\\Roaming\\npm\\node_modules\\typescript\\lib"
}
```

--------------------------------

### Extract ABI Function Names with ABIType

Source: https://abitype.dev/guide/getting-started

Imports and utilizes `ExtractAbiFunctionNames` from ABIType to extract all function names from a given ABI. It also shows how to import a predefined ABI like `erc20Abi` from `abitype/abis`.

```typescript
import { type ExtractAbiFunctionNames } from 'abitype'
import { erc20Abi } from 'abitype/abis'

type Result = ExtractAbiFunctionNames<typeof erc20Abi>

// Result will be "symbol" | "name" | "allowance" | "balanceOf" | "decimals" | "totalSupply"
```

--------------------------------

### Ponder Environment Variables Example (.env.example)

Source: https://github.com/ponder-sh/ponder/tree/main/examples/reference-erc20

An example environment file for Ponder projects. It lists the necessary environment variables required to run Ponder, such as RPC URLs for different blockchain networks. This file serves as a template for developers to create their own `.env` file.

```dotenv
# .env.example
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
POLYGON_RPC_URL=https://polygon-rpc.com/
ARBITRUM_ONE_RPC_URL=https://arb1.arbitrum.io/rpc/
```

--------------------------------

### Example .env file for Ponder

Source: https://github.com/ponder-sh/ponder/tree/main/examples/feature-multichain

An example environment file for a Ponder project. It demonstrates how to set up environment variables, such as RPC URLs for different networks. This file helps in configuring the Ponder instance for local development or deployment.

```env
# Replace with your actual RPC endpoints
ETHEREUM_RPC_URL=https://rpc.ankr.com/eth
GOERLI_RPC_URL=https://rpc.ankr.com/eth/goerli

```

--------------------------------

### Minimal Ponder API Server Setup (TypeScript)

Source: https://ponder.sh/docs/query/api-endpoints

This snippet shows the basic setup for a Ponder API server using Hono. It exports a minimal Hono instance, which serves as the foundation for custom API endpoints. No external dependencies beyond Hono are required for this minimal setup.

```typescript
import { Hono } from "hono";

const app = new Hono();

export default app;

```

--------------------------------

### Narrow ABIs using `narrow` function in JavaScript

Source: https://abitype.dev/guide/getting-started

Shows how to use the `narrow` function from ABIType in JavaScript to achieve specific typing for ABIs, similar to `const` assertions in TypeScript. This is useful for environments where `const` assertions might not be preferred.

```javascript
import { narrow } from 'abitype'

const erc20Abi = narrow([
  // ... ABI definition ...
])
```

--------------------------------

### Drizzle Kit Configuration for Multi-Project Schemas

Source: https://orm.drizzle.team/docs/goodies

Example Drizzle Kit configuration for a multi-project setup, specifying schema paths, output directory, dialect, database credentials, and filtering tables for 'project1'.

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/*",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  tablesFilter: ["project1_*"]
});
```

--------------------------------

### Project Initialization with Hono CLI (npm, yarn, pnpm, bun, deno)

Source: https://hono.dev/docs

These commands illustrate how to initialize a new Hono project using the official Hono CLI. The commands vary slightly depending on the package manager (npm, yarn, pnpm, bun, deno) being used. This is the recommended way to start a new Hono project, setting up the basic structure and configuration.

```shell
npm create hono@latest
```

```shell
yarn create hono
```

```shell
pnpm create hono@latest
```

```shell
bun create hono@latest
```

```shell
deno init --npm hono@latest
```

--------------------------------

### Logfmt Example

Source: https://brandur.org/logfmt

An example of a log line formatted using logfmt, showcasing its key/value pair structure.

```logfmt
at=info method=GET path=/ host=mutelight.org fwd="124.133.52.161" dyno=web.2 connect=4ms service=8ms status=200 bytes=1653
```

--------------------------------

### Multi-chain Example Configuration

Source: https://github.com/ponder-sh/ponder/tree/main/examples/feature-multichain

Configuration file for a multi-chain example in Ponder. It defines the network settings and contract events to index. This file is typically used to set up Ponder for indexing data from multiple blockchains simultaneously.

```typescript
import { ponder } from "./ponder.js";

ponder.configure({
  networks: {
    ethereum: {
      name: "mainnet",
      chainId: 1,
      transport: http("https://rpc.ankr.com/eth"),
    },
    goerli: {
      name: "goerli",
      chainId: 5,
      transport: http("https://rpc.ankr.com/eth/goerli"),
    },
  },
  contracts: {
    // ... other contracts
  },
});

```

--------------------------------

### Install @ponder/react and dependencies

Source: https://ponder.sh/docs/0.10/query/sql-client

Installs the @ponder/react package along with its peer dependencies, @ponder/client and @tanstack/react-query, for use in a React application.

```bash
pnpm add @ponder/react @ponder/client @tanstack/react-query
```

--------------------------------

### Configure Public Client Transport - viem

Source: https://viem.sh/docs/clients/public

Provides an example of configuring the 'transport' parameter when creating a Public Client. Here, it demonstrates using the 'http' transport.

```typescript
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})
```

--------------------------------

### Register GET Route Handler with Hono

Source: https://ponder.sh/docs/0.10/query/api-endpoints

This example demonstrates how to register a simple GET route handler for '/hello' on a Hono instance. It returns a plain text response. This is a foundational step for creating interactive API endpoints within Ponder.

```typescript
import { Hono } from "hono";

const app = new Hono();

app.get("/hello", (c) => {
  return c.text("Hello, world!");
});

export default app;
```

--------------------------------

### Gitignore 'out' Directory (Configuration)

Source: https://wagmi.sh/cli/getting-started

This configuration snippet illustrates how to prevent generated 'out' files from being committed to version control. By adding 'out' to the .gitignore file, developers ensure that only source files are tracked, promoting a cleaner repository. The 'out' directory is typically populated by build or generation scripts.

```git
out
```

--------------------------------

### Install @ponder/client (pnpm)

Source: https://ponder.sh/docs/query/sql-over-http

Command to install the @ponder/client package, which is necessary for interacting with Ponder's SQL over HTTP API from your client project.

```bash
pnpm add @ponder/client

```

--------------------------------

### React Query Setup and Usage

Source: https://tanstack.com/query/latest/docs/framework/react/quick-start

Demonstrates how to set up and use React Query in a React application. It covers initializing the QueryClient and providing it to the application context. This is essential for enabling data fetching and state management with React Query.

```javascript
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider, } from '@tanstack/react-query'
import { getTodos, postTodo } from '../my-api'

// Create a client
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  )
}

function Todos() {
  // Access the client
  const queryClient = useQueryClient()

  // Queries
  const query = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos
  })

  // Mutations
  const mutation = useMutation({
    mutationFn: postTodo,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <div>
      <ul>
        {query.data?.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      <button
        onClick={() => {
          mutation.mutate({ id: Date.now(), title: 'Do Laundry' })
        }}>
        Add Todo
      </button>
    </div>
  )
}
```

--------------------------------

### Install @ponder/react and Dependencies (pnpm)

Source: https://ponder.sh/docs/query/sql-over-http

Command to install the @ponder/react package along with its peer dependencies, @ponder/client and @tanstack/react-query, required for using Ponder's React hooks.

```bash
pnpm add @ponder/react @ponder/client @tanstack/react-query

```

--------------------------------

### Execute Contract Call with Factory and Factory Data (JavaScript)

Source: https://viem.sh/docs/actions/public/call

This example shows how to deploy and interact with a contract using a factory pattern. It requires the factory address and the data to execute on the factory. This is common for contract creation via Create2 or smart account factories. Requires `publicClient`.

```javascript
const data = await publicClient.call({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  factory: '0x0000000000ffe8b47b3e2130213b802212439497',
  factoryData: '0xdeadbeef',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

--------------------------------

### Solidity Contract Example

Source: https://docs.soliditylang.org/en/v0.8.17/abi-spec.html

A sample Solidity contract 'Foo' demonstrating functions with different parameter and return types. This contract is used to illustrate function encoding.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract Foo {
  function bar(bytes3[2] memory) public pure {}
  function baz(uint32 x, bool y) public pure returns (bool r) {
    r = x > 32 || y;
  }
  function sam(bytes memory, bool, uint[] memory) public pure {}
}
```

--------------------------------

### Install env-paths using npm

Source: https://github.com/sindresorhus/env-paths

This snippet shows how to install the env-paths package using npm. It's a prerequisite for using the package in your project.

```shell
$ npm install env-paths
```

--------------------------------

### Read ERC20 BalanceOf Hook (JavaScript)

Source: https://wagmi.sh/cli/getting-started

This snippet demonstrates how to use the `useReadErc20BalanceOf` hook to read the balance of a specific ERC20 token for a given address. It requires the Ethers.js library and assumes the necessary contract ABIs are available. The hook takes the token's address and the owner's address as arguments and returns the balance data.

```javascript
const { data } = useReadErc20BalanceOf({
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
})
```

--------------------------------

### Starting the Indexer Service

Source: https://github.com/marktoda/v4-ponder

Commands to start the Ponder indexer service in development mode using npm, yarn, or pnpm. This initiates the data indexing process.

```shell
npm run dev
# or yarn dev
# or pnpm dev
```

--------------------------------

### Get Transaction Count at Block Number (TypeScript)

Source: https://viem.sh/docs/actions/public/getTransactionCount

This example shows how to get the transaction count for an address at a specific block number using the `getTransactionCount` function. This is useful for historical analysis or state verification at a particular point in the blockchain.

```typescript
const transactionCount = await publicClient.getTransactionCount({
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  blockNumber: 69420n
})
```

--------------------------------

### Ponder API Endpoint: Hello World (TypeScript)

Source: https://ponder.sh/docs/query/api-endpoints

Demonstrates registering a simple GET route '/hello' on the Hono instance for the Ponder API server. This endpoint returns a plain text 'Hello, world!' response. It requires Hono to be installed and the default export to be a Hono instance.

```typescript
import { Hono } from "hono";

const app = new Hono();

app.get("/hello", (c) => {
  return c.text("Hello, world!");
});

export default app;

```

--------------------------------

### Get Environment Paths with envPaths (JavaScript)

Source: https://github.com/sindresorhus/env-paths

Demonstrates how to use the envPaths function to retrieve standardized directory paths for an application. It shows examples of accessing data and config paths. Note that this package only generates path strings and does not create directories; you might need a package like 'make-dir' for that.

```javascript
import envPaths from 'env-paths';

const paths = envPaths('MyApp');

console.log(paths.data);
//=> '/home/sindresorhus/.local/share/MyApp-nodejs' (example Linux path)

console.log(paths.config);
//=> '/home/sindresorhus/.config/MyApp-nodejs' (example Linux path)
```

--------------------------------

### Handle Event Data and Database Updates

Source: https://ponder.sh/docs/0.10/get-started

This snippet demonstrates how to process event data, including address and balance, and handle potential conflicts during database updates. It utilizes an 'onConflictDoUpdate' pattern for efficient data management.

```typescript
{
  address: event.args.from,
  balance: 0n,
  isOwner: event.args.from === OWNER_ADDRESS,
})
.onConflictDoUpdate((row) => ({ // ...

```

--------------------------------

### Deploy Contracts with Forge

Source: https://github.com/ponder-sh/ponder/tree/main/examples/with-foundry

Deploys smart contracts and generates logs using Forge. Requires a local Ethereum node and a private key. Outputs contract deployment information and logs.

```bash
forge script script/Deploy.s.sol --broadcast --fork-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

--------------------------------

### Ponder CLI Usage and Options

Source: https://ponder.sh/docs/0.10/api-reference/ponder/cli

This snippet shows the general usage of the `ponder` CLI and lists common options and commands. It provides a high-level overview of how to interact with the CLI, including options for specifying the project root, configuration file, logging levels, and debugging. Key commands like `dev`, `start`, `serve`, `db`, and `codegen` are introduced.

```bash
Usage: ponder  [OPTIONS]

Options:
  --root Path to the project root directory (default: working directory)
  --config Path to the project config file (default: "ponder.config.ts")
  -v, --debug Enable debug logs, e.g. realtime blocks, internal events
  -vv, --trace Enable trace logs, e.g. db queries, indexing checkpoints
  --log-level Minimum log level ("error", "warn", "info", "debug", or "trace", default: "info")
  --log-format The log format ("pretty" or "json") (default: "pretty")
  -V, --version Show the version number
  -h, --help Show this help message

Commands:
  dev [options] Start the development server with hot reloading
  start [options] Start the production server
  serve [options] Start the production HTTP server without the indexer
  db Database management commands
  codegen Generate the ponder-env.d.ts file, then exit
```

--------------------------------

### Running Foundry Script for Deployment

Source: https://github.com/ponder-sh/ponder/tree/main/examples/with-foundry

This command executes a Foundry script, typically used for deploying smart contracts to a local or remote blockchain. It automates the deployment process.

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --private-key <YOUR_PRIVATE_KEY>
```

--------------------------------

### GraphQL Query and JSON Response Example

Source: https://graphql.org/learn

Illustrates a basic GraphQL query to fetch a user's name and the corresponding JSON response. This highlights how clients can request specific data structures.

```graphql
{
  me {
    name
  }
}
```

```json
{
  "data": {
    "me": {
      "name": "Luke Skywalker"
    }
  }
}
```

--------------------------------

### Simulate Mint Function Call in TypeScript

Source: https://viem.sh/docs/contract/simulateContract

Demonstrates a basic simulation of a `mint` function call on a contract using `simulateContract`. This example shows the essential parameters: address, ABI, function name, and account.

```typescript
const { result } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
})
```

--------------------------------

### Deploy Smart Account with SimpleAccountFactory

Source: https://viem.sh/docs/contract/readContract

This snippet demonstrates how to deploy a smart account using the `SimpleAccountFactory`. It involves encoding the `createAccount` function data and then calling the `entryPoint` function on the smart account.

```typescript
factory: '0xE8Df82fA4E10e6A12a9Dab552bceA2acd26De9bb', // Function to execute on the factory to deploy the Smart Account.
          factoryData: encodeFunctionData({
    abi: parseAbi([
      'function createAccount(address owner, uint256 salt)'
    ]),
    functionName: 'createAccount',
    args: [account, 0n],
  }), // Function to call on the Smart Account.
          abi: account.abi,
  address: account.address,
  functionName: 'entryPoint',
}
```

--------------------------------

### Get Account Balance at Specific Block Number (TypeScript)

Source: https://viem.sh/docs/actions/public/getBalance

This example shows how to query the balance of an Ethereum address at a specific block number using `publicClient.getBalance`. It takes the address and a `blockNumber` (as a bigint) as parameters.

```typescript
const balance = await publicClient.getBalance({
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  blockNumber: 69420n
})
```

--------------------------------

### Configure Ponder Account Indexing (TypeScript)

Source: https://ponder.sh/docs/config/accounts

This configuration sets up Ponder to index transactions and native transfers for a specified account ('BeaverBuild') on the 'mainnet' chain, starting from block 20,000,000. It requires an RPC URL to be set in the environment variables.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1,
    },
  },
  accounts: {
    BeaverBuild: {
      chain: "mainnet",
      address: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
      startBlock: 20000000,
    },
  },
});
```

--------------------------------

### GraphQL Schema Evolution Example (JavaScript)

Source: https://graphql.org/learn

Demonstrates how to evolve a GraphQL schema by adding new fields and deprecating old ones. This shows GraphQL's flexibility in API management without versioning.

```graphql
type User {
  fullName: String
  nickname: String
  name: String @deprecated(reason: "Use `fullName`.")
}
```

--------------------------------

### Ponder Next.js Integration Example (TypeScript)

Source: https://github.com/ponder-sh/ponder/tree/main/examples/reference-erc20

Example demonstrating how to integrate Ponder with a Next.js application. This snippet shows how to fetch and display indexed blockchain data within a Next.js frontend, leveraging Ponder's data indexing capabilities for real-time blockchain information.

```typescript
import { useQuery } from '@tanstack/react-query';
import { client } from './ponder-client'; // Assuming ponder client is set up

function TokenInfo({ address }) {
  const { data, isLoading } = useQuery({
    queryKey: ['token', address],
    queryFn: async () => {
      const result = await client.request.token({ id: address });
      return result;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data found.</div>;

  return (
    <div>
      <h2>{data.name} ({data.symbol})</h2>
      <p>Total Supply: {data.totalSupply.toString()}</p>
    </div>
  );
}

export default TokenInfo;
```

--------------------------------

### Initialize Foundry Project

Source: https://book.getfoundry.sh/guides/scripting-with-solidity

Initializes a new Foundry project in a specified directory. This command sets up the basic file structure and configuration for a new smart contract project.

```bash
forge init Counter
```

--------------------------------

### TanStack Query - Simple Query Keys Example

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

Demonstrates the simplest form of a query key, which is an array with constant values. This is useful for generic list/index resources or non-hierarchical resources. The example shows how to define keys for a list of todos and another generic entry.

```typescript
// A list of todos
useQuery({
  queryKey: ['todos'],
  ... 
})

// Something else, whatever!
useQuery({
  queryKey: ['something', 'special'],
  ...
})
```

--------------------------------

### Assert ABIs to Constants with `as const` in TypeScript

Source: https://abitype.dev/guide/getting-started

Demonstrates how to use `const` assertions in TypeScript to ensure ABIs are typed with their most specific types, preventing type widening. This is crucial for ABIs with deeply nested arrays and objects.

```typescript
const erc20Abi = [
  // ... ABI definition ...
] as const
```

--------------------------------

### Nixpacks Dockerfile Build Stages

Source: https://railway.app/

This snippet details the stages of a Nixpacks Dockerfile used in the Railway build process. It covers setting up the base image, defining the working directory, copying Nixpkgs, installing Nix packages, installing Yarn dependencies, copying application code, and executing build commands.

```dockerfile
#3 [stage-0 1/12] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1727136237
#3 resolve ghcr.io/railwayapp/nixpacks:ubuntu-1727136237
#3 DONE 0.0s
#4 [stage-0 2/12] WORKDIR /app/
#4 CACHED
#7 [ 3/10] COPY .nixpacks/nixpkgs-e05605ec414618eab4a7a6aea8b38f6fbbcc8f08.nix .nixpacks/nixpkgs-e05605ec414618eab4a7a6aea8b38f6fbbcc8f08.nix
#7 DONE 0.6s
#8 [ 4/10] RUN nix-env -if .nixpacks/nixpkgs-e05605ec414618eab4a7a6aea8b38f6fbbcc8f08.nix && nix-collect-garbage -d
#8 DONE 0.6s
#12 [ 6/10] RUN yarn install --frozen-lockfile
#12 0.356 yarn install v1.22.22
#12 0.425 [1/5] Validating package.json...
#12 0.428 [2/5] Resolving packages...
#12 0.668 [3/5] Fetching packages...
#12 23.41 [4/5] Linking dependencies...
#12 32.87 [5/5] Building fresh packages...
#12 35.78 Done in 35.43s.
#12 DONE 36.2s
#13 [ 7/10] COPY . /app/.
#13 DONE 0.9s
#14 [ 8/10] RUN yarn migrate:deploy && yarn generate && yarn build
#14 0.312 yarn run v1.22.22
#14 0.343 $ prisma migrate deploy
#14 1.028 Prisma schema loaded from prisma/schema.prisma
#14 1.031 Datasource "db": PostgreSQL database "railway", schema "public" at "postgres.railway.interal:5432"
#14 1.304 No pending migrations to apply.
#14 1.336 Done in 1.03s.
#14 1.601 $ prisma generate
#14 2.280 Prisma schema loaded from prisma/schema.prisma
#14 3.497 $ contentlayer build && next build
#14 8.614 Generated 133 documents in .contentlayer
#14 44.99 ✓ Compiled successfully
#14 44.99 Collecting page data ...
#14 48.21 ✓ Generating static pages (3/3)
#14 49.01 Finalizing page optimization ...
#14 61.72 Route (pages) Size First Load JS
#14 61.72 ┌ ○ / (414 ms) 177 B 164 kB
#14 61.72 ├ /_app 0 B 164 kB
#14 61.72 ├ ƒ /[...slug] 178 kB 342 kB
#14 61.72 ├ ○ /404 (406 ms) 2.23 kB 166 kB
#14 61.72 + First Load JS shared by all 164 kB
#14 61.72 ├ chunks/framework-2c16ac744b6cdea6.js 45.2 kB
#14 61.72 ├ chunks/main-9cfb38678fbef8c0.js 39 kB
#14 61.72 ├ chunks/pages/_app-379ff2992e37d16f.js 77.9 kB
#14 61.72 └ other shared chunks (total) 2.03 kB
#14 61.72 ○ (Static)ent
#14 61.72 ƒ (Dynamic) server-rendered on demand
#14 DONE 1.0s
```

--------------------------------

### Configure Block Settings in Ponder

Source: https://ponder.sh/docs/api-reference/ponder/config

Shows how to configure specific block settings using the `BlockConfig` type. This example configures the `ChainlinkPriceOracle` block with its associated chain, starting block, and indexing interval, allowing for targeted data synchronization.

```typescript
import { createConfig, type BlockConfig } from "ponder";

const ChainlinkPriceOracle = {
  chain: "mainnet",
  startBlock: 19_750_000,
  interval: 5,
} as const satisfies BlockConfig;

export default createConfig({
  blocks: {
    ChainlinkPriceOracle,
  },
  // ...
});
```

--------------------------------

### Batch Contract Reads with Public Client - viem

Source: https://viem.sh/docs/clients/public

Shows an example of batching multiple contract read operations using a Public Client configured with 'eth_call' aggregation. This example reads the nae, total supply, symbol, and balance of a token from a contract.

```typescript
import { getContract } from 'viem'
import { abi } from './abi'
import { publicClient } from './client'

const contract = getContract({
  address,
  abi,
  client: publicClient
})

// The below will send a single request to the RPC Provider.
const [name, totalSupply, symbol, balance] = await Promise.all([
  contract.read.name(),
  contract.read.totalSupply(),
  contract.read.symbol(),
  contract.read.balanceOf([address]),
])
```

--------------------------------

### Multi-Chain Block Interval Configuration (TypeScript)

Source: https://ponder.sh/docs/config/block-intervals

This configuration sets up block intervals for aggregations that run on a per-hour basis across different chains. It specifies unique start blocks and calculates the interval based on the average block time for 'mainnet' (12s) and 'optimism' (2s).

```typescript
import { createConfig } from "ponder";

export default createConfig({
  chains: {
    // ... chain configurations
  },
  blocks: {
    PointsAggregation: {
      chain: {
        mainnet: {
          startBlock: 19783636,
          interval: (60 * 60) / 12, // Every 60 minutes (12s block time)
        },
        optimism: {
          startBlock: 119534316,
          interval: (60 * 60) / 2, // Every 60 minutes (2s block time)
        }
      }
    }
  }
});
```

--------------------------------

### Check global TypeScript version with Yarn

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

This command allows you to check the globally installed version of the TypeScript compiler using Yarn. It's a quick way to verify your setup before making changes.

```bash
yarn tsc --version
```

--------------------------------

### Ponder `start` Command for Production

Source: https://ponder.sh/docs/0.10/api-reference/ponder/cli

Initiates the Ponder application in production mode. Unlike development mode, project files are built only once on startup, and file changes are ignored. The terminal UI is also disabled by default. Options allow configuration of the schema, port, and hostname.

```bash
Usage: ponder start [options]

Start the production server

Options:
  --schema Database schema
  -p, --port Port for the web server (default: 42069)
  -H, --hostname Hostname for the web server (default: "0.0.0.0" or "::")
  -h, --help display help for command
```

--------------------------------

### GraphQL Query for Accounts by Balance

Source: https://ponder.sh/docs/0.10/get-started

A GraphQL query to retrieve account data, ordered by balance in descending order, and limited to the top 2 accounts. It also fetches the total count of accounts. This query can be executed against the auto-generated GraphQL API provided by the Ponder development server.

```graphql
query {
  accounts(orderBy: "balance", orderDirection: "desc", limit: 2) {
    items {
      address
      balance
    }
    totalCount
  }
}
```

--------------------------------

### Get global npm root path

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

This command helps you find the root directory of your globally installed npm packages. This path is often needed when manually configuring the `typescript.tsdk` setting in VS Code.

```bash
npm root -g
```

--------------------------------

### Fetching Paginated Projects with React Query

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

This TypeScript example demonstrates fetching paginated project data using `useInfiniteQuery`. It defines a `fetchProjects` function to get data from an API based on a cursor and configures `useInfiniteQuery` to handle initial parameters and determine the next page's cursor. The UI displays loading, error, or project data, with a 'Load More' button.

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
function Projects() {
    const fetchProjects = async ({ pageParam }) => {
        const res = await fetch('/api/projects?cursor=' + pageParam)
        return res.json()
    }
    const { data, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, status, }
        = useInfiniteQuery({
            queryKey: ['projects'],
            queryFn: fetchProjects,
            initialPageParam: 0,
            getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
        })
    return status === 'pending' ? (
        <p>Loading...</p>
    ) : status === 'error' ? (
        <p>Error: {error.message}</p>
    ) : (
        <>
            {data.pages.map((group, i) => (
                <>
                    {group.data.map((project) => (
                        <p key={project.id}>{project.name}</p>
                    ))}
                </>
            ))}
            <button
                onClick={() => fetchNextPage()}
                disabled={!hasNextPage || isFetching}
            >
                {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load More' : 'Nothing more to load'}
            </button>
            {isFetching && !isFetchingNextPage ? 'Fetching...' : null}
        </>
    )
}
```

--------------------------------

### GraphQL Connection Query Example

Source: https://relay.dev/graphql/connections.htm

An example GraphQL query demonstrating the usage of connections for pagination. It shows how to request a specific number of items ('first'), paginate using a cursor ('after'), retrieve cursors for each item, and check for the existence of more pages ('hasNextPage').

```graphql
{
  user {
    id
    name
    friends(first: 10, after: "opaqueCursor") {
      edges {
        cursor
        node {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
}
```

--------------------------------

### React: QueryClientProvider Setup

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

Shows how to set up the `QueryClientProvider` in a React application. This component wraps your application and provides the `QueryClient` instance to all components that use TanStack Query hooks. It's crucial for initializing the query cache and managing global query states.

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'

// Create a client
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

--------------------------------

### Next.js App with Streaming Example

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

Demonstrates how to leverage TanStack Query within a Next.js application, specifically focusing on streaming capabilities. This example highlights how to integrate server-side rendering with client-side data fetching and updates, utilizing React Server Components and Suspense.

```jsx
// Example assumes usage with React Server Components and Suspense
// This is a conceptual snippet, actual implementation may vary based on Next.js version and specifics

// Server Component
async function ServerComponent() {
  const queryClient = new QueryClient();
  const data = await queryClient.fetchQuery({ queryKey: ['streamingData'], queryFn: async () => fetchData() });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientComponent initialData={data} />
    </HydrationBoundary>
  );
}

// Client Component
'use client';
import { useQuery, HydrationBoundary, dehydrate } from '@tanstack/react-query';

function ClientComponent({ initialData }) {
  const { data } = useQuery({
    queryKey: ['streamingData'],
    queryFn: async () => fetchData(), // Fetch again on client if needed or rely on initialData
    initialData: initialData,
  });

  // Render streaming data
  return <div>{/* Render data, potentially updating as it streams */}</div>;
}

async function fetchData() {
  // Simulate streaming data fetch
  await new Promise(r => setTimeout(r, 2000));
  return { message: 'Data streamed successfully!' };
}

```

--------------------------------

### React Query Quick Start: Queries, Mutations, and Invalidation

Source: https://tanstack.com/query/latest/docs/framework/react/quick-start

This snippet demonstrates the three core concepts of React Query: queries for fetching data, mutations for updating data, and query invalidation for cache management. It shows how to set up the QueryClient, use the useQuery hook for data fetching, the useMutation hook for data updates, and invalidate queries upon successful mutation.

```tsx
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getTodos, postTodo } from '../my-api'

// Create a client
const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  )
}

function Todos() {
  // Access the client
  const queryClient = useQueryClient()

  // Queries
  const query = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  })

  // Mutations
  const mutation = useMutation({
    mutationFn: postTodo,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <div>
      <ul>
        {query.data?.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>

      <button
        onClick={() => {
          mutation.mutate({ id: Date.now(), title: 'Do Laundry' })
        }}
      >
        Add Todo
      </button>
    </div>
  )
}
```

--------------------------------

### PostgreSQL COPY Command Examples

Source: https://www.postgresql.org/docs/current/sql-copy.html

Demonstrates various ways to use the PostgreSQL COPY command for exporting data to the client, importing data from files, and copying query results to files. It also shows how to pipe data through external compression programs.

```sql
COPY country TO STDOUT (DELIMITER '|');

```

```sql
COPY country FROM '/usr1/proj/bray/sql/country_data';

```

```sql
COPY (SELECT * FROM country WHERE country_name LIKE 'A%') TO '/usr1/proj/bray/sql/a_list_countries.copy';

```

```sql
COPY country TO PROGRAM 'gzip > /usr1/proj/bray/sql/country_data.gz';

```

--------------------------------

### Specify Block Interval Name in ponder.config.ts

Source: https://ponder.sh/docs/0.10/config/block-intervals

This example demonstrates defining a block interval named 'ChainlinkOracleUpdate' within the `ponder.config.ts` file. It specifies the network, interval, and a starting block number for the indexing task.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  networks: {
    /* ... */
  },
  blocks: {
    ChainlinkOracleUpdate: {
      network: "mainnet",
      interval: 10,
      startBlock: 19783636,
    },
  },
});
```

--------------------------------

### Basic React Query Usage with useQuery

Source: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery

Demonstrates the fundamental use of the `useQuery` hook in React for fetching data. It includes setting up a query client and defining a query function. Assumes basic React and TanStack Query setup.

```jsx
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

function Todos() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await axios.get('https://jsonplaceholder.typicode.com/todos');
      return response.data;
    },
  });

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (error) {
    return <span>Error: {error.message}</span>;
  }

  return (
    <ul>
      {data.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}

export default Todos;
```

--------------------------------

### Prepared Statement with Multiple Placeholders (PostgreSQL)

Source: https://orm.drizzle.team/docs/rqb

Provides an example of a prepared statement that utilizes multiple placeholders for `limit` and `offset` in the main user query. This example is for PostgreSQL.

```typescript
const prepared = db.query.users.findMany({
  limit: placeholder('uLimit'),
  offset: placeholder('uOffset'),
  wh
```

--------------------------------

### Create Public Client with HTTP Transport - viem

Source: https://viem.sh/docs/clients/transports/http

Shows how to create a viem `publicClient` using the `http` transport, connecting to the Ethereum Mainnet via a provided RPC URL. It highlights the setup for interacting with the blockchain.

```typescript
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http('https://1.rpc.thirdweb.com/...'),
})
```

--------------------------------

### Ponder Start Command with Schema Option (npm)

Source: https://ponder.sh/docs/0.10/production/railway

This command starts the Ponder application with the --schema option, which is necessary for zero-downtime deployments on Railway. It utilizes the $RAILWAY_DEPLOYMENT_ID environment variable.

```shell
npm start --schema $RAILWAY_DEPLOYMENT_ID
```

--------------------------------

### Connect to SQL over HTTP Server

Source: https://ponder.sh/docs/query/sql-over-http

Install the `@ponder/client` package and use `createClient` to establish a connection to your Ponder server's SQL over HTTP endpoint.

```APIDOC
## Client Setup and Connection

### Description
This section details how to set up the `@ponder/client` package in your client project and connect to the SQL over HTTP server.

### Method
N/A (Client-side setup)

### Endpoint
`http://localhost:42069/sql` (Replace with your server's URL and path)

### Parameters
#### Path Parameters
- None

#### Query Parameters
- None

#### Request Body
- None

### Install `@ponder/client`
```bash
pnpm add @ponder/client
```

### Connect to the Server
```typescript
import { createClient } from "@ponder/client";

const client = createClient("http://localhost:42069/sql");
```

### Import `ponder.schema.ts`
```typescript
import { createClient } from "@ponder/client";
import * as schema from "../../ponder/ponder.schema"; // Adjust path as needed

const client = createClient("http://localhost:42069/sql");

// Example query using the imported schema
const result = await client.db.select().from(schema.account);
// Type inference: result is inferred as { address: `0x${string}`; balance: bigint; }[]
```
```

--------------------------------

### Execute Raw SQL Query in SQLite with Drizzle ORM

Source: https://orm.drizzle.team/docs/goodies

Provides examples of executing raw SQL queries in SQLite using Drizzle ORM. It showcases different methods like `all`, `get`, `values`, and `run` for retrieving or executing data.

```typescript
import { sql } from 'drizzle-orm';

const statement = sql`select * from ${users} where ${users.id} = ${userId}`;

// Example usages:
const res: unknown[][] = db.all(statement); // Returns all rows as arrays
const res: unknown = db.get(statement);     // Returns the first row
const res: unknown[][] = db.values(statement); // Returns only values from all rows
const res: Database.RunResult = db.run(statement); // Executes the statement, returns info about changes
```

--------------------------------

### Ponder CLI Start Command for Railway Deployments

Source: https://ponder.sh/docs/production/railway

This command starts the Ponder application on Railway, utilizing the '--schema' option for zero-downtime deployments. It also incorporates a Railway-specific environment variable for deployment identification. Ensure the correct package manager (pnpm, npm, or yarn) is used.

```pnpm
pnpm start --schema $RAILWAY_DEPLOYMENT_ID
```

```npm
npm start --schema $RAILWAY_DEPLOYMENT_ID
```

```yarn
yarn start --schema $RAILWAY_DEPLOYMENT_ID
```

--------------------------------

### Define Account Name in Ponder Configuration (TypeScript)

Source: https://ponder.sh/docs/config/accounts

This example demonstrates how to uniquely name an account ('BeaverBuild') within the Ponder configuration. Account names must be unique across all defined accounts, contracts, and block intervals in the project.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  chains: {
    /* ... */
  },
  accounts: {
    BeaverBuild: {
      chain: "mainnet",
      address: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
      startBlock: 12439123,
    },
  },
});
```

--------------------------------

### Ponder Configuration for Block Intervals (TypeScript)

Source: https://ponder.sh/docs/config/block-intervals

This snippet demonstrates how to configure block intervals in `ponder.config.ts`. It defines a block interval named 'ChainlinkOracleUpdate' that triggers every 10 blocks, starting from block 1000, on the 'mainnet' chain.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1
    }
  },
  blocks: {
    ChainlinkOracleUpdate: {
      chain: "mainnet",
      interval: 10, // Every 10 blocks
      startBlock: 1000
    }
  }
});
```

--------------------------------

### Get Table Information for PostgreSQL, MySQL, SQLite, SingleStore

Source: https://orm.drizzle.team/docs/goodies

Demonstrates how to retrieve configuration details of a table using `getTableConfig` in Drizzle ORM. This includes columns, indexes, foreign keys, checks, primary keys, name, and schema. Examples cover PostgreSQL, MySQL, SQLite, and SingleStore.

```typescript
import { getTableConfig, pgTable } from 'drizzle-orm/pg-core';
export const table = pgTable(...);
const { columns, indexes, foreignKeys, checks, primaryKeys, name, schema } = getTableConfig(table);
```

```typescript
import { getTableConfig, mysqlTable } from 'drizzle-orm/mysql-core';
export const table = mysqlTable(...);
const { columns, indexes, foreignKeys, checks, primaryKeys, name, schema } = getTableConfig(table);
```

```typescript
import { getTableConfig, sqliteTable } from 'drizzle-orm/sqlite-core';
export const table = sqliteTable(...);
const { columns, indexes, foreignKeys, checks, primaryKeys, name, schema } = getTableConfig(table);
```

```typescript
import { getTableConfig, mysqlTable } from 'drizzle-orm/singlestore-core';
export const table = singlestoreTable(...);
const { columns, indexes, checks, primaryKeys, name, schema } = getTableConfig(table);
```

--------------------------------

### PostgreSQL Text Data Example

Source: https://www.postgresql.org/docs/current/sql-copy.html

An example of data suitable for copying into a PostgreSQL table from STDIN, using the vertical bar '|' as a field delimiter. Note that whitespace on each line is a tab character.

```text
AF AFGHANISTAN
AL ALBANIA
DZ ALGERIA
ZM ZAMBIA
ZW ZIMBABWE

```

--------------------------------

### Ponder Indexing Function for Block Intervals (TypeScript)

Source: https://ponder.sh/docs/config/block-intervals

This example shows an indexing function registered for the 'ChainlinkOracleUpdate:block' event. It fetches the latest price from a Chainlink oracle contract at specified block heights and inserts the data into a 'priceTimeline' table.

```typescript
import { ponder } from "ponder:registry";
import { priceTimeline } from "ponder:schema";
import { ChainlinkOracleAbi } from "../abis/ChainlinkOracle.ts";

ponder.on("ChainlinkOracleUpdate:block", async ({ event, context }) => {
  // Fetch the price at the current block height (1000, 1010, 1020, etc.)
  const latestPrice = await context.client.readContract({
    abi: ChainlinkOracleAbi,
    address: "0xD10aBbC76679a20055E167BB80A24ac851b37056",
    functionName: "latestAnswer"
  });

  // Insert a row into the price timeline table
  await context.db.insert(priceTimeline).values({
    id: event.id,
    timestamp: event.block.timestamp,
    price: latestPrice
  });
});
```

--------------------------------

### Monorepo Ponder Start Command on Railway

Source: https://ponder.sh/docs/production/railway

This command is for monorepo users deploying a Ponder app on Railway. It navigates to the Ponder project's root directory within the monorepo and then executes the Ponder start command with the '--schema' option. Adjust 'packages/ponder' to your specific Ponder project directory.

```pnpm
cd packages/ponder && pnpm start --schema $RAILWAY_DEPLOYMENT_ID
```

```npm
cd packages/ponder && npm start --schema $RAILWAY_DEPLOYMENT_ID
```

```yarn
cd packages/ponder && yarn start --schema $RAILWAY_DEPLOYMENT_ID
```

--------------------------------

### Solidity Contract ABI Example

Source: https://docs.soliditylang.org/en/v0.8.17/abi-spec.html

This snippet demonstrates the JSON representation of a simple Solidity contract's ABI, including events, errors, and a function. It shows how parameters, their types, and indexing are defined.

```json
[{ "type":"error", "inputs": [{"name":"available","type":"uint256"},{"name":"required","type":"uint256"}], "name":"InsufficientBalance" }, { "type":"event", "inputs": [{"name":"a","type":"uint256","indexed":true},{"name":"b","type":"bytes32","indexed":false}], "name":"Event" }, { "type":"event", "inputs": [{"name":"a","type":"uint256","indexed":true},{"name":"b","type":"bytes32","indexed":false}], "name":"Event2" }, { "type":"function", "inputs": [{"name":"a","type":"uint256"}], "name":"foo", "outputs": [] }]
```

--------------------------------

### Execute Contract Call with Access List (JavaScript)

Source: https://viem.sh/docs/actions/public/call

This example shows how to perform a contract call while specifying an access list. An access list allows for gas cost optimizations by pre-declaring state slots that will be accessed. It requires `publicClient` and a correctly formatted access list.

```javascript
const data = await publicClient.call({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  accessList: [
    {
      address: '0x1',
      storageKeys: ['0x1'],
    },
  ],
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

--------------------------------

### Create Basic Public Client - viem

Source: https://viem.sh/docs/clients/public

Shows how to initialize a basic Public Client using 'createPublicClient'. It requires specifying a 'chain' (e.g., 'mainnet') and a 'transport' (e.g., 'http'). This client can then be used to call public blockchain actions.

```typescript
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})
```

--------------------------------

### Index Factory Contract and Child Contracts - TypeScript

Source: https://ponder.sh/docs/guides/factory

This TypeScript configuration for `ponder.config.ts` shows how to index both the factory contract itself and the child contracts it creates. By adding a separate entry for the factory contract (e.g., `SudoswapFactory`), you can register indexing functions to perform setup logic for each newly discovered child contract. The child contracts are configured using the `factory()` function as in the basic usage example.

```typescript
import { createConfig, factory } from "ponder";
import { parseAbiItem } from "viem";
import { SudoswapPoolAbi } from "./abis/SudoswapPool";
import { SudoswapFactoryAbi } from "./abis/SudoswapFactory";

export default createConfig({
  chains: {
    /* ... */
  },
  contracts: {
    SudoswapFactory: {
      abi: SudoswapFactoryAbi,
      chain: "mainnet",
      address: "0xb16c1342E617A5B6E4b631EB114483FDB289c0A4",
      startBlock: 14645816,
    },
    SudoswapPool: {
      abi: SudoswapPoolAbi,
      chain: "mainnet",
      address: factory({
        address: "0xb16c1342E617A5B6E4b631EB114483FDB289c0A4",
        event: parseAbiItem("event NewPair(address poolAddress)"),
        parameter: "poolAddress",
      }),
      startBlock: 14645816,
    },
  },
});
```

--------------------------------

### GraphQL Query with Pagination - Example

Source: https://ponder.sh/docs/0.10/query/graphql

Demonstrates a GraphQL query for paginated results of 'person' records using cursor-based pagination. This example includes arguments for `first`, `after`, and retrieves `pageInfo`.

```graphql
query {
  persons(first: 2, after: "someCursor") {
    edges {
      node {
        id
        name
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

```

--------------------------------

### React Native Setup with TanStack Query

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

Provides guidance on setting up TanStack Query within a React Native application. It involves similar steps to web React apps, focusing on `QueryClientProvider` and managing the query client instance for server state management in a mobile context.

```jsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

const queryClient = new QueryClient();

const Root = () => (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

AppRegistry.registerComponent(appName, () => Root);

```

--------------------------------

### Introspection Query Example

Source: https://relay.dev/graphql/connections.htm

An example of an introspection query to retrieve information about the `ExampleEdge` type and its fields.

```APIDOC
## Introspection Query Example

This example demonstrates how to query for type information, specifically the fields of an `ExampleEdge` type.

### Request

```graphql
{
  __type(name: "ExampleEdge") {
    fields {
      name
      type {
        name
        kind
        ofType {
          name
          kind
        }
      }
    }
  }
}
```

### Response

```json
{
  "data": {
    "__type": {
      "fields": [
        {
          "name": "node",
          "type": {
            "name": "Example",
            "kind": "OBJECT",
            "ofType": null
          }
        },
        {
          "name": "cursor",
          "type": {
            "name": null,
            "kind": "NON_NULL",
            "ofType": {
              "name": "String",
              "kind": "SCALAR"
            }
          }
        }
      ]
    }
  }
}
```
```

--------------------------------

### Deploy Counter Contract to Local Anvil Instance

Source: https://book.getfoundry.sh/guides/scripting-with-solidity

This snippet shows how to deploy the Counter contract to a local Anvil instance. It requires starting Anvil in one terminal and then running the forge script command with the --fork-url pointing to the local Anvil node. The user is prompted to enter a private key for the deployment.

```bash
forge script script/Counter.s.sol:CounterScript --fork-url http://localhost:8545 --broadcast --interactives 1
```

--------------------------------

### Get ENS Name with Block Tag (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsName

This example demonstrates fetching an ENS name using a block tag, such as 'latest', 'safe', or 'finalized'. Using `blockTag` allows you to specify the state of the blockchain for the ENS resolution, ensuring consistency or targeting specific chain states.

```typescript
const ensName = await publicClient.getEnsName({
  address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
  blockTag: 'safe',
})
```

--------------------------------

### Ponder Start Command with Schema Option (pnpm)

Source: https://ponder.sh/docs/0.10/production/railway

This command starts the Ponder application with the --schema option, which is necessary for zero-downtime deployments on Railway. It utilizes the $RAILWAY_DEPLOYMENT_ID environment variable.

```shell
pnpm start --schema $RAILWAY_DEPLOYMENT_ID
```

--------------------------------

### Colorized Logfmt Output Example

Source: https://brandur.org/logfmt

An illustration of how logfmt output can be colorized for better human readability, highlighting key fields.

```logfmt
info | Stopping all fetchers module=kafka.consumer.ConsumerFetcherManager
```

```logfmt
info | Performing log compaction module=kafka.compacter.LogCompactionManager
```

```logfmt
info | Performing garbage collection module=kafka.cleaner.GarbageCollectionManager
```

```logfmt
info | Starting all fetchers module=kafka.consumer.ConsumerFetcherManager
```

--------------------------------

### Handle New Client Connections in PostgreSQL Pool (JavaScript)

Source: https://node-postgres.com/apis/pool

Demonstrates how to use the `connect` event emitter to perform setup operations on newly established client connections. This allows for executing commands like setting date styles immediately after a client connects to the database.

```javascript
const pool = new Pool()
pool.on('connect', (client) => {
  client.query('SET DATESTYLE = iso, mdy')
})
```

--------------------------------

### Insert Account Data with isOwner Flag (TypeScript)

Source: https://ponder.sh/docs/get-started

This snippet demonstrates how to insert new rows into the 'account' table using Ponder. It includes logic to set the 'isOwner' field based on whether the event 'from' address matches a predefined owner address. This is typically used within an event handler for a contract like ERC20.

```typescript
import { ponder } from "ponder:registry";
import { account } from "ponder:schema";

const OWNER_ADDRESS = "0x3bf93770f2d4a794c3d9ebefbaebae2a8f09a5e5";

ponder.on("ERC20:Transfer", async ({ event, context }) => {
  await context.db
    .insert(account)
    .values({
      address: event.args.from,
      balance: 0n,
      isOwner: event.args.from === OWNER_ADDRESS,
    })
    .onConflictDoUpdate((row) => ({ // ...

```

--------------------------------

### Update Indexing Logic for New Schema Column

Source: https://ponder.sh/docs/0.10/get-started

Updates the indexing logic for an 'ERC20:Transfer' event to include the 'isOwner' field when inserting new rows into the 'account' table. This TypeScript code demonstrates how to modify event handlers to accommodate schema changes and ensure data integrity.

```typescript
import { ponder } from "ponder:registry";
import { account } from "ponder:schema";

const OWNER_ADDRESS = "0x3bf93770f2d4a794c3d9ebefbaebae2a8f09a5e5";

ponder.on("ERC20:Transfer", async ({ event, context }) => {
  await context.db
    .insert(account)
    .values({
```

--------------------------------

### Avoid Manual Viem Client Setup | TypeScript

Source: https://ponder.sh/docs/0.10/indexing/read-contracts

This snippet illustrates a common mistake: manually creating a Viem client instead of using Ponder's provided `context.client`. Ponder's client includes caching and other optimizations. Manually creating a client bypasses these benefits and is explicitly discouraged.

```typescript
import { ponder } from "ponder:registry";
import { createPublicClient, http } from "viem";

// Don't do this! ❌ ❌ ❌
const publicClient = createPublicClient({
  transport: http("https://eth-mainnet.g.alchemy.com/v2/..."),
});

ponder.on("Blitmap:Mint", async ({ event, context }) => {
  const tokenUri t publicClient.readContract({
    abi: context.contracts.Blitmap.abi,
    address: context.contracts.Blitmap.address,
    method: "tokenUri",
    args: [event.args.tokenId],
  });
});
```

--------------------------------

### Encode Nested Dynamic Arrays and Strings (Solidity Example)

Source: https://docs.soliditylang.org/en/v0.8.17/abi-spec.html

Illustrates the encoding of a function call involving nested dynamic arrays and arrays of strings. This example details the calculation of offsets for dynamically sized data within the encoded transaction data, highlighting the process for arrays of arrays and arrays of strings.

```text
Encoding for g(uint256[][],string[]) with values ((\[\[1, 2\]\]\[3\]\]), (["one", "two", "three"]))

Encoding of the first root array [[1, 2], [3]]:
- Offset 'a' to the start of the data for [1, 2]: 0x0000000000000000000000000000000000000000000000000000000000000040
- Offset 'b' to the start of the data for [3]: 0x0000000000000000000000000000000000000000000000000000000000000080

Data for the first root array:
Line 0: 0x0000000000000000000000000000000000000000000000000000000000000002 (number of elements in the root array)
Line 1: 0x0000000000000000000000000000000000000000000000000000000000000040 (offset 'a' to [1, 2])
Line 2: 0x0000000000000000000000000000000000000000000000000000000000000080 (offset 'b' to [3])

Data for the first embedded array [1, 2]:
Line 3: 0x0000000000000000000000000000000000000000000000000000000000000002 (number of elements in [1, 2])
Line 4: 0x0000000000000000000000000000000000000000000000000000000000000001 (encoding of 1)
Line 5: 0x0000000000000000000000000000000000000000000000000000000000000002 (encoding of 2)

Data for the second embedded array [3]:
Line 6: 0x0000000000000000000000000000000000000000000000000000000000000001 (number of elements in [3])
Line 7: 0x0000000000000000000000000000000000000000000000000000000000000003 (encoding of 3)

Encoding of the second root array ["one", "two", "three"]:
- Offset 'c' to the start of the data for ["one", "two", "three"]: 0x00000000000000000000000000000000000000000000000000000000000000c0

Data for the second root array:
Line 8: 0x0000000000000000000000000000000000000000000000000000000000000003 (number of elements in the array)
Line 9: 0x00000000000000000000000000000000000000000000000000000000000000c0 (offset 'c' to string data)

Data for the strings:
Line 10: 0x6f6e650000000000000000000000000000000000000000000000000000000000 ("one" padded)
Line 11: 0x74776f0000000000000000000000000000000000000000000000000000000000 ("two" padded)
Line 12: 0x7468726565000000000000000000000000000000000000000000000000000000 ("three" padded)

Final encoding for g(uint256[][],string[]) with values ([["1", "2"], "3"], ["one", "two", "three"]):
0x8be65246
0000000000000000000000000000000000000000000000000000000000000002
0000000000000000000000000000000000000000000000000000000000000040
0000000000000000000000000000000000000000000000000000000000000080
0000000000000000000000000000000000000000000000000000000000000002
0000000000000000000000000000000000000000000000000000000000000001
0000000000000000000000000000000000000000000000000000000000000002
0000000000000000000000000000000000000000000000000000000000000001
0000000000000000000000000000000000000000000000000000000000000003
0000000000000000000000000000000000000000000000000000000000000003
00000000000000000000000000000000000000000000000000000000000000c0
6f6e650000000000000000000000000000000000000000000000000000000000
74776f0000000000000000000000000000000000000000000000000000000000
7468726565000000000000000000000000000000000000000000000000000000
```

--------------------------------

### Get ENS Name with Strict Error Propagation (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsName

This example explains how to enable strict error propagation for ENS Universal Resolver Contract errors by setting the `strict` parameter to `true`. When enabled, any errors encountered during the resolution process will be strictly propagated, aiding in debugging.

```typescript
const ensName = await publicClient.getEnsName({
  address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
  strict: true,
})
```

--------------------------------

### Solidity Script for Counter Contract Deployment

Source: https://book.getfoundry.sh/guides/scripting-with-solidity

A basic Solidity script using Foundry's Script contract to deploy a Counter contract. It demonstrates the use of `vm.startBroadcast()` and `vm.stopBroadcast()` to manage transaction signing and broadcasting. This script is intended for local or testnet deployments.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";

contract CounterScript is Script {
    Counter public counter;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        counter = new Counter();
        vm.stopBroadcast();
    }
}
```

--------------------------------

### React Query: Basic and Preview Todo Query Keys

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

Demonstrates the structure of query keys for fetching individual todos and todos in a 'preview' format, as well as fetching a list of 'done' todos. These examples showcase the use of arrays and objects within query keys.

```typescript
useQuery({ queryKey: ['todo', 5], ... })
// An individual todo in a "preview" format
useQuery({ queryKey: ['todo', 5, { preview: true }], ...})
// A list of todos that are "done"
useQuery({ queryKey: ['todos', { type: 'done' }], ... })
```

--------------------------------

### Get ENS Address with Strict Error Propagation in viem (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAddress

This example shows how to enable strict error propagation for the ENS Universal Resolver Contract when using `getEnsAddress` in viem. Setting the `strict` parameter to `true` ensures that all errors from the contract are propagated, which can be useful for detailed debugging.

```typescript
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const ensAddress = await publicClient.getEnsAddress({
  name: normalize('wevm.eth'),
  strict: true,
})
```

--------------------------------

### Define Ponder Schema with New Column

Source: https://ponder.sh/docs/0.10/get-started

Defines a Ponder schema for an 'account' table, including 'address', 'balance', and a new 'isOwner' boolean column. This TypeScript code snippet shows how to extend an existing onchain table definition to include additional fields required by the application's indexing logic.

```typescript
import { index, onchainTable, primaryKey, relations } from "ponder";

export const account = onchainTable("account", (t) => ({
  address: t.hex().primaryKey(),
  balance: t.bigint().notNull(),
  isOwner: t.boolean().notNull(),
}));

// ...
```

--------------------------------

### Solidity Contract Initialization with Constructor Arguments

Source: https://docs.soliditylang.org/en/latest/contracts.html

Demonstrates contract creation and initialization using constructors. This example shows how a derived contract can initialize a base contract's state variable by passing an argument to the base constructor.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

abstract contract A {
  uint public a;
  constructor(uint a_) {
    a = a_;
  }
}

contract B is A(1) {
  constructor() {
    // Initialization code for B
  }
}
```

--------------------------------

### JSON Log Output Example

Source: https://ponder.sh/docs/0.10/advanced/observability

Example of Ponder's output when using the JSON log format. Each line is a JSON object representing a log event with structured data.

```json
{"level":30,"time":1717170664426,"service":"build","msg":"Using PGlite database at .ponder/pglite (default)"}
{"level":30,"time":1717170664454,"service":"database","msg":"Created table 'Account' in 'public.db'"}
{"level":30,"time":1717170664458,"service":"server","msg":"Started listening on port 42069"}
{"level":30,"time":1717170664625,"service":"historical","msg":"Started syncing 'base' logs for 'weth9' with 0.0% cached"}
{"level":30,"time":1717170664628,"service":"historical","msg":"Started syncing 'optimism' logs for 'weth9' with 0.0% cached"}
{"level":30,"time":1717170664683,"service":"historical","msg":"Started syncing 'polygon' logs for 'weth9' with 0.0% cached"}
```

--------------------------------

### Read Contract Total Supply using `readContract`

Source: https://viem.sh/docs/contract/readContract

This example shows how to read the `totalSupply` function from a contract using `publicClient.readContract`. It requires the contract address and ABI.

```typescript
const data = await publicClient.readContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'totalSupply',
})
```

--------------------------------

### QueryClient Configuration

Source: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery

Documentation on how to configure and use the QueryClient instance.

```APIDOC
## QueryClientProvider

**Description**: A React component that provides the `QueryClient` instance to your application.

**Usage**: Wrap your application or a part of it with `QueryClientProvider` to make the `QueryClient` available to all descendant components.

### Parameters

*   **client** (QueryClient) - Required - The `QueryClient` instance to provide.
*   **children** - Required - The child elements to be rendered.

### Request Example
```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your application components */}
    </QueryClientProvider>
  );
}
```
```

--------------------------------

### Consume Public Actions with Public Client - viem

Source: https://viem.sh/docs/clients/public

Illustrates how to use a created Public Client to perform blockchain actions. This example fetches the latest block number using the 'getBlockNumber' action.

```typescript
const blockNumber = await publicClient.getBlockNumber()
```

--------------------------------

### Example ERC20 Smart Contract Reference (Solidity)

Source: https://github.com/ponder-sh/ponder/tree/main/examples/reference-erc20

This snippet showcases a reference implementation for the ERC20 token standard using Solidity. It demonstrates basic ERC20 functions such as token transfers, balance checks, and approval mechanisms. This code is typically used for learning or as a base for custom ERC20 tokens.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExampleERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
```

--------------------------------

### Get ENS Address with Specific Coin Type in viem (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAddress

This example shows how to retrieve an ENS address for a specific cryptocurrency using the `coinType` parameter in viem's `getEnsAddress` function. By providing the appropriate coin type (e.g., from `viem/chains`), you can resolve ENS names to addresses on different blockchain networks.

```typescript
import { base } from 'viem/chains'
import { normalize, toCoinType } from 'viem/ens'
import { publicClient } from './client'

const ensAddress = await publicClient.getEnsAddress({
  name: normalize('wevm.eth'),
  coinType: toCoinType(base.id),
})
```

--------------------------------

### Generate ABIs with Wagmi

Source: https://github.com/ponder-sh/ponder/tree/main/examples/with-foundry

Generates Application Binary Interfaces (ABIs) using the Wagmi CLI. This command is typically run within a project that uses Wagmi for smart contract interaction. It outputs generated ABI files.

```bash
pnpm wagmi generate
```

--------------------------------

### JSON Log Output Example

Source: https://ponder.sh/docs/advanced/observability

Example output of Ponder logs when the JSON format is enabled. Each line is a JSON object detailing events like block indexing, including chain, block number, event count, and duration.

```json
{"level":30,"time":1760372079306,"msg":"Indexed block","chain":"mainnet","chain_id":1,"number":23569912,"event_count":17,"duration":27.752416999996058}
{"level":30,"time":1760372080106,"msg":"Indexed block","chain":"polygon","chain_id":137,"number":77633702,"event_count":0,"duration":3.4684160000033444}
{"level":30,"time":1760372080122,"msg":"Indexed block","chain":"optimism","chain_id":10,"number":142386651,"event_count":0,"duration":2.3179999999993015}
{"level":30,"time":1760372080314,"msg":"Indexed block","chain":"base","chain_id":8453,"number":36791366,"event_count":10,"duration":18.320999999996275}
{"level":30,"time":1760372082131,"msg":"Indexed block","chain":"optimism","chain_id":10,"number":142386652,"event_count":0,"duration":3.074124999999185}
{"level":30,"time":1760372082258,"msg":"Indexed block","chain":"polygon","chain_id":137,"number":77633703,"event_count":0,"duration":1.7850829999952111}
{"level":30,"time":1760372082328,"msg":"Indexed block","chain":"base","chain_id":8453,"number":36791367,"event_count":4,"duration":9.394625000000815}
{"level":30,"time":1760372084153,"msg":"Indexed block","chain":"optimism","chain_id":10,"number":142386653,"event_count":0,"duration":2.679999999993015}
```

--------------------------------

### Get Typed Table Columns for PostgreSQL, MySQL, SQLite, SingleStore

Source: https://orm.drizzle.team/docs/goodies

Shows how to retrieve typed table column maps using `getTableColumns` in Drizzle ORM. This is useful for omitting specific columns during selection. Examples cover PostgreSQL, MySQL, SQLite, and SingleStore schema definitions and usage.

```typescript
import { getTableColumns } from "drizzle-orm";
import { user } from "./schema";
const { password, role, ...rest } = getTableColumns(user);
await db.select({ ...rest }).from(users);
```

```typescript
import { serial, text, pgTable } from "drizzle-orm/pg-core";
export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  password: text("password"),
  role: text("role").$type<"admin" | "customer">(),
});
```

```typescript
import { getTableColumns } from "drizzle-orm";
import { user } from "./schema";
const { password, role, ...rest } = getTableColumns(user);
await db.select({ ...rest }).from(users);
```

```typescript
import { int, text, mysqlTable } from "drizzle-orm/mysql-core";
export const user = mysqlTable("user", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name"),
  email: text("email"),
  password: text("password"),
  role: text("role").$type<"admin" | "customer">(),
});
```

```typescript
import { getTableColumns } from "drizzle-orm";
import { user } from "./schema";
const { password, role, ...rest } = getTableColumns(user);
await db.select({ ...rest }).from(users);
```

```typescript
import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";
export const user = sqliteTable("user", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  email: text("email"),
  password: text("password"),
  role: text("role").$type<"admin" | "customer">(),
});
```

```typescript
import { getTableColumns } from "drizzle-orm";
import { user } from "./schema";
const { password, role, ...rest } = getTableColumns(user);
await db.select({ ...rest }).from(users);
```

```typescript
import { int, text, mysqlTable } from "drizzle-orm/singlestore-core";
export const user = singlestoreTable("user", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name"),
  email: text("email"),
  password: text("password"),
  role: text("role").$type<"admin" | "customer">(),
});
```

--------------------------------

### Create Basic Hono App for API Endpoints

Source: https://ponder.sh/docs/0.10/query/api-endpoints

This snippet shows the minimal setup for a Ponder API endpoint server. It involves creating a Hono instance and exporting it as the default from `src/api/index.ts`. No external dependencies beyond Hono are needed for this basic structure.

```typescript
import { Hono } from "hono";

const app = new Hono();

export default app;
```

--------------------------------

### Solidity Event Emission Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Provides an example of defining and emitting an event in Solidity. The `Deposit` event is defined with indexed parameters `from` and `id`, and a `value`. The `deposit` function emits this event when called.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.21 <0.9.0;

contract ClientReceipt {
  event Deposit( address indexed from, bytes32 indexed id, uint value );

  function deposit(bytes32 id) public payable {
    // Events are emitted using `emit`,
    // followed by the name of the event and the argum

```

--------------------------------

### Ponder Configuration Files

Source: https://github.com/ponder-sh/ponder/tree/main/examples/reference-erc721

This snippet includes configuration files for the Ponder project, such as .env.example, .eslintrc.json, .gitignore, package.json, tsconfig.json, and ponder.config.ts. These files define project settings, dependencies, and build configurations.

```dotenv
# .env.example
# Example environment variables for Ponder
DATABASE_URL="postgres://user:password@host:port/database"

```

```json
# .eslintrc.json
{
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "env": {
    "browser": true,
    "es2017": true,
    "node": true
  }
}

```

```ignore
# .gitignore
node_modules/
dist/
.env
*.log

```

```json
# package.json
{
  "name": "ponder",
  "version": "0.1.0",
  "description": "A framework for building data services.",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "react": "^18.2.0"
  }
}

```

```json
# tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "src/**/*.ts",
    "test/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}

```

```typescript
// ponder.config.ts
import { createConfig } from '@ponder/core';

export const config = createConfig({
  networks: [
    {
      name: 'mainnet',
      chainId: 1,
      transport: process.env.MAINNET_RPC_URL
    }
  ],
  contracts: [
    // Add contract definitions here
  ]
});

```

--------------------------------

### Solidity Constant and Immutable State Variables Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Demonstrates the declaration and usage of 'constant' and 'immutable' state variables in a Solidity contract. 'Constant' variables are fixed at compile-time, while 'immutable' variables can be assigned at construction time. The example shows how to initialize them, including accessing environment data for immutable variables during construction.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

uint constant X = 32**22 + 8;

contract C {
    string constant TEXT = "abc";
    bytes32 constant MY_HASH = keccak256("abc");
    uint immutable decimals = 18;
    uint immutable maxBalance;
    address immutable owner = msg.sender;

    constructor(uint decimals_, address ref) {
        if (decimals_ != 0) // Immutables are only immutable when deployed.
        // At construction time they can be assigned to any number of times.
        decimals = decimals_;
        // Assignments to immutables can even access the environment.
        maxBalance = ref.balance;
    }

    function isBalanceTooHigh(address other) public view returns (bool) {
        return other.balance > maxBalance;
    }
}
```

--------------------------------

### Public Client Creation and Usage

Source: https://viem.sh/docs/clients/public

Demonstrates how to import, create, and use a viem Public Client with HTTP transport and a specified chain.

```APIDOC
## Public Client

A Public Client is an interface to "public" JSON-RPC API methods such as retrieving block numbers, transactions, reading from smart contracts, etc through Public Actions.

### Import
```typescript
import { createPublicClient } from 'viem'
```

### Usage
Initialize a Client with your desired Chain (e.g. `mainnet`) and Transport (e.g. `http`).

```typescript
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

// Then you can consume Public Actions:
const blockNumber = await publicClient.getBlockNumber()
```

### Parameters

#### transport
*   **Type:** `Transport`
    The Transport of the Public Client.
    ```typescript
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http()
    })
    ```

#### chain (optional)
*   **Type:** `Chain`
    The Chain of the Public Client.
    ```typescript
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http()
    })
    ```
```

--------------------------------

### Configure Ethereum and Optimism Networks with HTTP and Fallback Transports

Source: https://ponder.sh/docs/0.10/config/networks

This example demonstrates setting up two networks, Ethereum mainnet and Optimism, using Ponder's `createConfig`. It utilizes Viem's `http` and `fallback` transports, fetching RPC URLs from environment variables and providing a fallback RPC endpoint for Optimism. It also sets a `maxRequestsPerSecond` limit for the Optimism network.

```typescript
import { createConfig } from "ponder";
import { http, fallback } from "viem";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1),
    },
    optimism: {
      chainId: 10,
      transport: fallback([
        http(process.env.PONDER_RPC_URL_10),
        http("https://optimism.llamarpc.com"),
      ]),
      maxRequestsPerSecond: 25,
    },
  },
  contracts: {
    /* ... */
  },
});
```

--------------------------------

### GraphQL Query with Filtering - Example

Source: https://ponder.sh/docs/0.10/query/graphql

Demonstrates a GraphQL query to retrieve 'person' records, filtered by age. This example showcases the use of the `where` argument with specific column filters.

```graphql
query {
  persons(where: { age_gte: 30 }) {
    id
    name
    age
  }
}

```

--------------------------------

### Basic Drizzle Query Builder Initialization (TypeScript)

Source: https://orm.drizzle.team/docs/rqb

Initializes the Drizzle ORM query builder with a schema definition. This is the fundamental setup required before making database queries.

```typescript
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/...';

const db = drizzle({
  schema
});

await db.query.users.findMany(...);
```

--------------------------------

### Solidity Pure Function Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Demonstrates a simple pure function in Solidity that performs arithmetic operations. Pure functions are guaranteed not to read from or write to the contract's state. This example uses SPDX-License-Identifier and pragma directives.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.5.0 <0.9.0;

contract C {
    function f(uint a, uint b) public pure returns (uint) {
        return a * (b + 42);
    }
}
```

--------------------------------

### Fetch Block Information (TypeScript)

Source: https://viem.sh/docs/actions/public/getBlock

Fetches block information using the Viem public client. This example demonstrates a basic call to getBlock without any specific parameters, defaulting to the latest block. The output includes various block details.

```typescript
import { publicClient } from './client'

const block = await publicClient.getBlock()

// Output: {
//   baseFeePerGas: 10789405161n,
//   difficulty: 11569232145203128n,
//   extraData: '0x75732d656173742d38',
//   ...
// }
```

--------------------------------

### GraphQL Query with Sorting - Example

Source: https://ponder.sh/docs/0.10/query/graphql

Demonstrates a GraphQL query to retrieve 'person' records sorted by name in ascending order. This example shows how to use the `orderBy` argument for sorting results.

```graphql
query {
  persons(orderBy: { name: asc }) {
    id
    name
    age
  }
}

```

--------------------------------

### Set Database Schema via .env.local

Source: https://ponder.sh/docs/0.10/database

This example demonstrates how to define the database schema for a Ponder instance using the `DATABASE_SCHEMA` environment variable in a `.env.local` file. This is crucial for organizing data and ensuring no two instances use the same schema.

```bash
DATABASE_SCHEMA=my_schema
```

--------------------------------

### Offset Based Pagination Query Example (PostgreSQL)

Source: https://akashrajpurohit.com/blog/navigating-your-database-efficiently-cursor-based-pagination-vs-offset-based

This snippet shows an example of an offset-based pagination query in PostgreSQL. It demonstrates how 'LIMIT' and 'OFFSET' clauses are used to retrieve a subset of data. This method can be inefficient for large tables as it requires scanning and filtering more data than necessary.

```sql
EXPLAIN SELECT * FROM users LIMIT 2 OFFSET 1;
```

--------------------------------

### Ponder Configuration: rateLimit Transport for Networks (TypeScript)

Source: https://ponder.sh/docs/0.10/api-reference/ponder-utils

Demonstrates configuring a Ponder network with the `rateLimit` transport. This example sets up the 'mainnet' network to use a rate-limited RPC endpoint, fetched from an environment variable, with a limit of 25 requests per second. It uses `createConfig` from Ponder and `rateLimit` from `@ponder/utils`.

```typescript
import { createConfig, rateLimit } from "ponder";
import { http } from "viem";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: rateLimit(http(process.env.PONDER_RPC_URL_1), {
        requestsPerSecond: 25,
      }),
    },
  },
  contracts: {
    // ...
  },
});
```

--------------------------------

### Query Schema with @ponder/client (TypeScript)

Source: https://ponder.sh/docs/query/sql-over-http

Example of querying the Ponder database using the @ponder/client library. It imports the schema and uses a select query to fetch account data, demonstrating type inference.

```typescript
import { createClient } from "@ponder/client";
import * as schema from "../../ponder/ponder.schema";

const client = createClient("http://localhost:42069/sql");

const result = await client.db.select().from(schema.account);
// ^? { address: `0x${string}`; balance: bigint; }[]

```

--------------------------------

### PostgreSQL UNIQUE Constraint Syntax Examples

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

Illustrates how to implement UNIQUE constraints in PostgreSQL to ensure column values are unique across all rows. Examples are provided for both column-level and table-level constraint definitions.

```sql
CREATE TABLE products (
 product_no integer **UNIQUE**,
 name text,
 price numeric
);
```

```sql
CREATE TABLE products (
 product_no integer,
 name text,
 price numeric,
 **UNIQUE (product_no)**
);
```

--------------------------------

### Install TypeScript globally with npm

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

Installs a specific version of the TypeScript compiler globally on your system using npm. This version can then be referenced by VS Code if configured correctly.

```bash
npm install -g typescript@2.0.5
```

--------------------------------

### React Query Mutations with useMutation

Source: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery

Illustrates how to perform data mutations (e.g., creating, updating, deleting) using the `useMutation` hook. This snippet shows basic mutation setup and handling success/error states. Requires a query client instance.

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

function AddTodo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newTodo) => {
      const response = await axios.post('/todos', newTodo);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: (error) => {
      console.error('Mutation failed:', error);
    },
  });

  return (
    <form onSubmit={e => {
      e.preventDefault();
      mutation.mutate({ id: Date.now(), title: e.target.elements.title.value });
    }}>
      <input type="text" name="title" />
      <button type="submit">Add Todo</button>
    </form>
  );
}

export default AddTodo;
```

--------------------------------

### Pagination with Limit and Offset (Drizzle ORM)

Source: https://orm.drizzle.team/docs/rqb

Provides an example of using `limit` and `offset` together to fetch a specific slice of data, like posts from the 5th to the 10th.

```typescript
await db.query.posts.findMany({
  limit: 5,
  offset: 5,
  with: {
    comments: true,
  },
});
```

--------------------------------

### Prepared Statement with 'limit' Placeholder (PostgreSQL)

Source: https://orm.drizzle.team/docs/rqb

Demonstrates creating a prepared statement to fetch users and their posts, with a placeholder named 'limit' controlling the number of posts returned per user. This example is for PostgreSQL.

```typescript
const prepared = db.query.users.findMany({
  with: {
    posts: {
      limit: placeholder('limit'),
    },
  },
}).prepare('query_name');

const usersWithPosts = await prepared.execute({ limit: 1 });
```

--------------------------------

### Execute Contract Call with Block Tag (JavaScript)

Source: https://viem.sh/docs/actions/public/call

This example shows how to perform a contract call against a specific block tag like 'latest', 'earliest', 'pending', 'safe', or 'finalized'. The default is 'latest'. It requires `publicClient`.

```javascript
const data = await publicClient.call({
  blockTag: 'safe',
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

--------------------------------

### React: Fetching Persons with `useInfiniteQuery` and Pagination

Source: https://ponder.sh/docs/query/sql-over-http

Provides an example of fetching `person` records using `useInfiniteQuery` from `@tanstack/react-query` and Ponder's client. It demonstrates filtering by age, ordering by ID, and implementing cursor-based pagination with `limit` and `offset`.

```typescript
import { asc, gt } from "@ponder/client";
import { usePonderClient } from "@ponder/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import * as schema from "../../ponder/schema";

const client = usePonderClient();

const personQuery = useInfiniteQuery({
  queryKey: ["persons"],
  queryFn: ({ pageParam }) => client.db
    .select()
    .from(schema.person)
    .where(gt(schema.person.age, 32))
    .orderBy(asc(schema.person.id))
    .limit(100)
    .offset(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => lastPage.length === 100 ? undefined : pages.length * 100,
});
```

--------------------------------

### Deploy and Verify Contract using Foundry CLI

Source: https://book.getfoundry.sh/guides/scripting-with-solidity

Command to deploy and verify a Solidity contract on the Sepolia testnet using Foundry. It includes loading environment variables, specifying the script, RPC URL, broadcast option, verification flag, verbosity level, and interactive private key input.

```bash
# To load the variables in the .env file
source .env

# To deploy and verify our contract
forge script --chain sepolia script/Counter.s.sol:CounterScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv --interactives 1
```

--------------------------------

### Drizzle ORM SingleStore Table with Indexes

Source: https://orm.drizzle.team/docs/indexes-constraints

Example of defining a SingleStore table using Drizzle ORM, including the creation of a standard index and a unique index. This demonstrates the Drizzle ORM syntax for SingleStore-specific table and index configurations.

```typescript
import { int, text, index, uniqueIndex, singlestoreTable } from "drizzle-orm/singlestore-core";

export const user = singlestoreTable("user", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name"),
  email: text("email"),
}, (table) => [
  index("name_idx").on(table.name),
  uniqueIndex("email_idx").on(table.email),
]);
```

--------------------------------

### Logfmt with Splunk Query for Statistics

Source: https://brandur.org/logfmt

An example of a logfmt line and a Splunk query to generate statistics on a specific field.

```logfmt
level=info tag=stopping_fetchers id=ConsumerFetcherManager-1382721708341 module=kafka.consumer.ConsumerFetcherManager num_open_fetchers=3
```

```spl
tag=stopping_fetchers | stats p50(num_open_fetchers) p95(num_open_fetchers) p99(num_open_fetchers)
```

--------------------------------

### Eth Call with Transaction Value

Source: https://viem.sh/docs/actions/public/call

This example demonstrates how to specify a transaction value (in wei) when making a call using the `publicClient.call` method.

```APIDOC
## POST /eth_call (with value)

### Description
Performs a call to an Ethereum contract, optionally sending a value with the transaction.

### Method
`POST`

### Endpoint
`/` (or your configured RPC endpoint)

### Parameters
#### Request Body
- **account** (string) - The account to use for the call.
- **data** (string) - The calldata for the contract call.
- **to** (string) - The contract address to call.
- **value** (bigint) - Optional. The value (in wei) to send with this transaction.

### Request Example
```json
{
  "account": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "data": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  "value": "1000000000000000000"
}
```

### Response
#### Success Response (200)
- **result** (string) - The result of the contract call.
```

--------------------------------

### Install TypeScript locally as a dev dependency

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

Installs a specific version of the TypeScript compiler locally within your project as a development dependency using npm. This is the recommended approach for project-specific versions.

```bash
npm install --save-dev typescript@2.0.5
```

--------------------------------

### ERC721 Reference Example

Source: https://github.com/ponder-sh/ponder/tree/main/examples/reference-erc721

This snippet demonstrates the implementation of a reference ERC721 contract within the Ponder framework. It includes necessary imports and contract definitions for managing ERC721 tokens.

```typescript
import { ponder } from "@ponder/core";

export const ERC721 = ponder.contract({
  name: "ERC721",
  network: "mainnet",
  address: "0xCanonicalERC721Address", // Replace with actual address
  abi: [
    // ABI definition for ERC721 token
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function safeTransferFrom(address from, address to, uint256 tokenId)",
    // ... other ERC721 methods
  ],
});

```

--------------------------------

### Install Specific TypeScript Version Globally via npm

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

This command installs a specific version of TypeScript globally using npm. This is useful when you need a particular version for development or to resolve compatibility issues. Replace '2.7.2' with your desired version.

```bash
npm install -g typescript@2.7.2
```

--------------------------------

### Defining Query Functions with useQuery

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-functions

Demonstrates different ways to configure query functions for the `useQuery` hook in TanStack Query. These examples show basic function calls, arrow functions, async functions, and functions that accept context.

```tsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchAllTodos
})
useQuery({
  queryKey: ['todos', todoId],
  queryFn: () => fetchTodoById(todoId)
})
useQuery({
  queryKey: ['todos', todoId],
  queryFn: async () => {
    const data = await fetchTodoById(todoId)
    return data
  },
})
useQuery({
  queryKey: ['todos', todoId],
  queryFn: ({ queryKey }) => fetchTodoById(queryKey[1]),
})
```

--------------------------------

### Eth Call with State Override

Source: https://viem.sh/docs/actions/public/call

This example shows how to use the `stateOverride` parameter with the `publicClient.call` method to ephemerally override specific contract states before executing a call.

```APIDOC
## POST /eth_call (with stateOverride)

### Description
Performs a call to an Ethereum contract with ephemeral state overrides.

### Method
`POST`

### Endpoint
`/` (or your configured RPC endpoint)

### Parameters
#### Request Body
- **account** (string) - The account to use for the call.
- **data** (string) - The calldata for the contract call.
- **to** (string) - The contract address to call.
- **stateOverride** (array) - An array of state override objects.
  - **address** (string) - The address of the contract to override.
  - **balance** (bigint) - The new balance for the contract.
  - **stateDiff** (array) - An array of state diff objects.
    - **slot** (string) - The storage slot to override.
    - **value** (string) - The new value for the storage slot.

### Request Example
```json
{
  "account": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "data": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  "stateOverride": [
    {
      "address": "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC",
      "balance": "1000000000000000000",
      "stateDiff": [
        {
          "slot": "0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0",
          "value": "0x00000000000000000000000000000000000000000000000000000000000001a4"
        }
      ]
    }
  ]
}
```

### Response
#### Success Response (200)
- **result** (string) - The result of the contract call.
```

--------------------------------

### Solidity Function Overloading Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Illustrates function overloading in Solidity, where multiple functions share the same name but have different parameter types. This example defines two functions named 'f' within contract 'A', one taking a uint and the other taking a uint and a boolean.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract A {
  function f(uint value) public pure returns (uint out) {
    out = value;
  }

  function f(uint value, bool really) public pure returns (uint out)

```

--------------------------------

### Ponder Configuration: loadBalance Transport for Networks (TypeScript)

Source: https://ponder.sh/docs/0.10/api-reference/ponder-utils

Shows how to configure Ponder networks using the `loadBalance` transport. This example configures the 'mainnet' network with multiple fallback HTTP and WebSocket RPC endpoints, including one rate-limited endpoint, using `createConfig` from Ponder and `loadBalance` from `@ponder/utils`.

```typescript
import { createConfig, loadBalance } from "ponder";
import { http } from "viem";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: loadBalance([
        http("https://cloudflare-eth.com"),
        http("https://eth-mainnet.public.blastapi.io"),
        webSocket("wss://ethereum-rpc.publicnode.com"),
        rateLimit(http("https://rpc.ankr.com/eth"), { requestsPerSecond: 5 }),
      ]),
    },
  },
  // ...
});
```

--------------------------------

### Configure Contract with Per-Network Start Blocks (TypeScript)

Source: https://ponder.sh/docs/0.10/config/contracts

This configuration sets up the ERC-4337 EntryPoint contract, which has a consistent address across networks. It demonstrates specifying per-network 'startBlock' values for 'mainnet' and 'optimism', while using a default address defined at the top level.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";
import { EntryPointAbi } from "./abis/EntryPoint";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1)
    },
    optimism: {
      chainId: 10,
      transport: http(process.env.PONDER_RPC_URL_10)
    },
  },
  contracts: {
    EntryPoint: {
      abi: EntryPointAbi,
      address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      network: {
        mainnet: {
          startBlock: 12369621
        },
        optimism: {
          startBlock: 88234528
        },
      },
    },
  },
});
```

--------------------------------

### GraphQL Introspection Response Example

Source: https://relay.dev/graphql/connections.htm

An example response from a GraphQL introspection query, illustrating the structure of a connection edge type. It shows the 'node' field and the 'cursor' field, which is non-null and of type String.

```json
{
  "data": {
    "__type": {
      "fields": [
        // May contain other items
        {
          "name": "node",
          "type": {
            "name": "Example",
            "kind": "OBJECT",
            "ofType": null
          }
        },
        {
          "name": "cursor",
          "type": {
            // This shows the cursor type as String!, other types are possible
            "name": null,
            "kind": "NON_NULL",
            "ofType": {
              "name": "String",
              "kind": "SCALAR"
            }
          }
        }
      ]
    }
  }
}
```

--------------------------------

### Execute Legacy Transaction Call with Gas Price (JavaScript)

Source: https://viem.sh/docs/actions/public/call

This example shows how to set the gas price for a legacy transaction. The gas price determines the cost per unit of gas. It requires `publicClient` and the `gasPrice` using `parseGwei` for readability.

```javascript
import { parseGwei } from 'viem'
const data = await publicClient.call({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  gasPrice: parseGwei('20'),
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

--------------------------------

### GraphQL Query for Specific Person - Example

Source: https://ponder.sh/docs/0.10/query/graphql

Demonstrates a GraphQL query to retrieve a single 'person' record by its ID. This example utilizes the singular query field provided by the generated GraphQL schema.

```graphql
query {
  person(id: 1) {
    id
    name
    age
  }
}

```

--------------------------------

### Basic React Query with GraphQL Request

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

Demonstrates how to integrate TanStack Query with GraphQL requests. This example shows setting up a query function that uses a GraphQL client (like `graphql-request`) to fetch data, highlighting the flexibility of `queryFn`.

```jsx
import { useQuery } from '@tanstack/react-query';
import { request, gql } from 'graphql-request';

const endpoint = 'https://api.example.com/graphql';

const GET_TODOS = gql`
  query GetTodos {
    todos {
      id
      title
    }
  }
`;

function GraphQLTodos() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['graphqlTodos'],
    queryFn: async () => {
      const data = await request(endpoint, GET_TODOS);
      return data.todos;
    },
  });

  if (isLoading) return 'Loading...';
  if (error) return 'An error has occurred: ' + error.message;

  return (
    <div>
      {data.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}

```

--------------------------------

### TypeScript Global Augmentation Example

Source: https://www.typescriptlang.org/docs/handbook/declaration-merging.html

Shows how to augment the global scope from within a TypeScript module. This example adds a `toObservable` method to the global `Array` interface, demonstrating how to extend built-in JavaScript types.

```typescript
// observable.ts
export class Observable {
  // ... still no implementation ...
}

declare global {
  interface Array<T> {
    toObservable(): Observable;
  }
}

Array.prototype.toObservable = function <T>(): Observable {
  // ...
  return new Observable();
};
```

--------------------------------

### Define PRIMARY KEY Constraints with Drizzle ORM (MySQL)

Source: https://orm.drizzle.team/docs/indexes-constraints

This example demonstrates defining PRIMARY KEY constraints in Drizzle ORM for MySQL. It includes examples for auto-incrementing integer IDs and text-based CUIDs as primary keys.

```typescript
import { int, text, mysqlTable } from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
  id: int("id").autoincrement().primaryKey(),
})

export const table = mysqlTable("table", {
  cuid: text("cuid").primaryKey(),
})
```

--------------------------------

### Fetch Block by Tag (TypeScript)

Source: https://viem.sh/docs/actions/public/getBlock

Retrieves block information using a block tag. This example demonstrates fetching the 'safe' block, and other valid tags include 'latest', 'earliest', 'pending', and 'finalized'.

```typescript
const block = await publicClient.getBlock({
  blockTag: 'safe'
})
```

--------------------------------

### Configure global TypeScript path in VS Code settings

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

Updates VS Code's user settings to use a globally installed TypeScript version. You need to provide the correct path to the globally installed TypeScript library. This affects all projects opened in VS Code.

```json
"typescript.tsdk": "{GLOBAL_NPM_PATH}/typescript/lib"
```

--------------------------------

### Execute EIP-1559 Transaction Call with Max Priority Fee Per Gas (JavaScript)

Source: https://viem.sh/docs/actions/public/call

This example shows how to set the `maxPriorityFeePerGas` for an EIP-1559 transaction, which is the fee paid to miners. It requires `publicClient` and `parseGwei`.

```javascript
import { parseGwei } from 'viem'
const data = await publicClient.call({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  maxFeePerGas: parseGwei('20'),
  maxPriorityFeePerGas: parseGwei('2'),
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

--------------------------------

### Estimate Gas with Legacy Transaction Gas Price in TypeScript

Source: https://viem.sh/docs/actions/public/estimateGas

This example shows how to estimate gas for a legacy transaction by specifying the `gasPrice`. The `gasPrice` parameter is set in wei and is only applicable to legacy transaction types.

```typescript
import { parseEther, parseGwei } from 'viem'

const gas = await publicClient.estimateGas({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  gasPrice: parseGwei('20'),
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: parseEther('1')
})
```

--------------------------------

### Get Transaction Confirmations by Hash

Source: https://viem.sh/docs/actions/public/getTransactionConfirmations

Fetches the number of confirmations for a transaction directly using its hash. This is a convenient way to get confirmation count without needing the full transaction receipt first. The returned value is a bigint representing the confirmations.

```typescript
import { publicClient } from './client'

const confirmations = await publicClient.getTransactionConfirmations({
  hash: '0x...'
})
```

--------------------------------

### Specify Transaction Value for eth_call

Source: https://viem.sh/docs/actions/public/call

This example shows how to specify the `value` of a transaction when using `publicClient.call`. The value is provided in wei and can be parsed using `parseEther` for convenience.

```javascript
import { parseEther } from 'viem'
const data = await publicClient.call({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: parseEther('1'),
})
```

--------------------------------

### Solidity Payable Fallback and Receive Functions Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Illustrates a contract with both a payable fallback function and a receive function. The fallback is called for messages with non-empty calldata, while the receive function handles plain Ether transfers (empty calldata). This example highlights how to handle Ether in different scenarios.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.6.2 <0.9.0;

contract TestPayable {
  uint x;
  uint y;

  // This function is called for all messages sent to
  // this contract, except plain Ether transfers
  // (there is no other function except the receive function).
  // Any call with non-empty calldata to this contract will execute
  // the fallback function (even if Ether is sent along with the call).
  fallback() external payable {
    x = 1;
    y = msg.value;
  }

  // This function is called for plain Ether transfers, i.e.
  // for every call with empty calldata.
  receive() external payable {
    x = 2;
    y = msg.value;
  }
}
```

--------------------------------

### Configure Drizzle Kit with PostgreSQL Dialect

Source: https://orm.drizzle.team/docs/sql-schema-declaration

This configuration file sets up Drizzle Kit for database migrations. It specifies the database dialect as PostgreSQL and points to the schema definition file. Ensure `drizzle-kit` is installed as a dev dependency.

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts'
})
```

--------------------------------

### Provide Arguments for Contract Function in viem multicall (TypeScript)

Source: https://viem.sh/docs/contract/multicall

This example shows how to pass arguments to a contract function when using viem's `multicall`. The `args` parameter accepts an array of values that correspond to the function's expected parameters, inferred from the ABI.

```typescript
const results = await publicClient.multicall({
  contracts: [
    {
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi: wagmiAbi,
      functionName: 'balanceOf',
      args: ['0xc961145a54C96E3aE9bAA048c4F4D6b04C13916b']
    },
    ...
  ]
})
```

--------------------------------

### Perform a Database Query with @ponder/client (TypeScript)

Source: https://ponder.sh/docs/query/sql-over-http

Example of executing a database query using the 'desc' function from @ponder/client and importing the schema. This is for server-side (Node.js) querying.

```typescript
import { desc } from "@ponder/client";
import * as schema from "../../ponder/ponder.schema";

// Server-side (Node.js) query example

```

--------------------------------

### Ponder Configuration File (TypeScript)

Source: https://github.com/ponder-sh/ponder/tree/main/examples/reference-erc20

Configuration file for the Ponder framework, written in TypeScript. This file defines how Ponder instances are set up, including database connections, event indexing, and schema definitions. It's crucial for setting up data indexing for smart contracts.

```typescript
import { createConfig } from '@ponder/core';
import { http, Address } from 'viem';

export const config = createConfig({
  chains: [
    {
      id: 'mainnet',
      name: 'Ethereum',
      rpcUrl: process.env.MAINNET_RPC_URL!,
    },
  ],
  contracts: [
    {
      name: 'ExampleERC20',
      address: '0x1234567890abcdef1234567890abcdef12345678' as Address,
      abi: '...', // ABI definition goes here
    },
  ],
});
```

--------------------------------

### Prepared Statement with 'offset' Placeholder (PostgreSQL)

Source: https://orm.drizzle.team/docs/rqb

An example of a prepared statement that includes an 'offset' placeholder for pagination when fetching users and their posts. This is specifically for PostgreSQL.

```typescript
const prepared = db.query.users.findMany({
  offset: placeholder('offset'),
  with: {
    posts: true,
  },
}).prepare('query_name');

const usersWithPosts = await prepared.execute({ offset: 1 });
```

--------------------------------

### Solidity Function Declaration Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Illustrates the syntax for declaring a function without an implementation in Solidity. This is distinct from a Function Type, though their syntax can appear similar.

```solidity
function foo(address) external returns (address);
```

--------------------------------

### Estimate Gas with Viem

Source: https://viem.sh/docs/actions/public/estimateGas

Estimates the gas required for a transaction using Viem's estimateGas function. This example shows a basic usage without specifying block details.

```javascript
import { parseEther } from 'viem'
const gas = await publicClient.estimateGas({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: parseEther('1')
})
```

--------------------------------

### Configure .env and foundry.toml for Foundry

Source: https://book.getfoundry.sh/guides/scripting-with-solidity

Sets up environment variables for RPC URLs and API keys in a .env file and configures foundry.toml to use these variables for specific chains like Sepolia. This is essential for Foundry to access network resources and verification services.

```env
SEPOLIA_RPC_URL=
ETHERSCAN_API_KEY=
```

```toml
[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

--------------------------------

### envPaths API - name Option (JavaScript)

Source: https://github.com/sindresorhus/env-paths

Illustrates the usage of the 'name' parameter in the envPaths function. This string is crucial for generating unique paths for your application. The example explicitly shows how to import and use the function with a given name.

```javascript
import envPaths from 'env-paths';

const paths = envPaths('YourAppName');

console.log(paths.data);
console.log(paths.config);
```

--------------------------------

### Use Query Hook Example (React)

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

Illustrates the basic usage of the `useQuery` hook from TanStack Query. This hook is used to fetch data and manage its lifecycle, including loading, error, and success states. It requires a query key and a query function to fetch data.

```jsx
import { useQuery } from '@tanstack/react-query';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos');
      return response.json();
    },
  });

  if (isLoading) return 'Loading...';
  if (error) return 'An error has occurred: ' + error.message;

  return (
    <div>
      {data.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}

```

--------------------------------

### Drizzle ORM: Advanced Pagination with Limit and Offset

Source: https://orm.drizzle.team/docs/select

Provides an example of advanced pagination using `limit` and `offset` combined with `orderBy`. This is essential for implementing efficient pagination strategies.

```javascript
await db
  .select()
  .from(users)
  .orderBy(asc(users.id)) // order by is mandatory
  .limit(4) // the number of rows to return
  .offset(4); // the number of rows to skip
```

--------------------------------

### Import createPublicClient - viem

Source: https://viem.sh/docs/clients/public

Demonstrates how to import the 'createPublicClient' function from the 'viem' library. This is the primary function used to initialize a Public Client.

```typescript
import { createPublicClient } from 'viem'
```

--------------------------------

### Solidity View Function Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

This example defines a 'view' function in Solidity, which promises not to modify the contract's state. It performs a calculation using input parameters and the current block timestamp, returning the result. View functions are enforced by the EVM's STATICCALL opcode to prevent state modifications.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.5.0 <0.9.0;

contract C {
  function f(uint a, uint b) public view returns (uint) {
    return a * (b + 42) + block.timestamp;
  }
}
```

--------------------------------

### Execute Contract Call with Bytecode (JavaScript)

Source: https://viem.sh/docs/actions/public/call

This snippet demonstrates making a contract call using raw bytecode instead of a contract address. This is useful for direct execution of EVM code. It requires `publicClient` and the bytecode data.

```javascript
const data = await publicClient.call({
  code: '0x...',
  data: '0xdeadbeef',
})
```

--------------------------------

### PostgreSQL: Enum Type Ordering and Comparisons

Source: https://www.postgresql.org/docs/current/datatype-enum.html

Illustrates how to utilize the inherent ordering of enumerated types for comparison and sorting. Includes examples of greater than comparisons and finding the minimum value.

```sql
INSERT INTO person VALUES ('Larry', 'sad');
INSERT INTO person VALUES ('Curly', 'ok');
SELECT * FROM person WHERE current_mood > 'sad';
SELECT * FROM person WHERE current_mood > 'sad' ORDER BY current_mood;
SELECT name FROM person WHERE current_mood = (SELECT MIN(current_mood) FROM person);
```

--------------------------------

### Configure VS Code to Use Workspace TypeScript Version

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

This JSON snippet configures VS Code's user settings to use the TypeScript version installed in the current workspace's 'node_modules' folder. This ensures consistency across projects without manual configuration. It requires TypeScript to be installed in every workspace.

```json
{
  // ... other User settings
  "typescript.tsdk": "./node_modules/typescript/lib"
}
```

--------------------------------

### Define PRIMARY KEY Constraints with Drizzle ORM (SingleStore)

Source: https://orm.drizzle.team/docs/indexes-constraints

This example demonstrates defining a PRIMARY KEY constraint in Drizzle ORM for SingleStore. It shows how to define an integer column as the primary key.

```typescript
import { int, text, singlestoreTable } from "drizzle-orm/singlestore-core";

export const user = singlestoreTable('user', {
  id: int('id').primaryKey()
});
```

--------------------------------

### Solidity Function Modifier Example: Ownership

Source: https://docs.soliditylang.org/en/latest/contracts.html

Introduces function modifiers in Solidity, which declaratively change function behavior, often used for pre-execution checks. This example shows a basic 'owned' contract with a constructor to set the owner. Modifiers are inheritable and can be overridden.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.1 <0.9.0;

contract owned {
  address payable owner;

  constructor() {
    owner = payable(msg.sender);
  }

  // Modifier definition would typically follow here
}
```

--------------------------------

### Simulate Contract

Source: https://viem.sh/docs/contract/simulateContract

This section details the simulation of a contract's 'mint' function, illustrating the use of different optional parameters.

```APIDOC
## POST /simulateContract

### Description
Simulates a contract interaction, such as calling the 'mint' function, with various optional parameters to customize the simulation.

### Method
POST

### Endpoint
/simulateContract

### Parameters
#### Request Body
- **address** (Hex) - Required - The contract address.
- **abi** (AbiItem[]) - Required - The ABI of the contract.
- **functionName** (string) - Required - The name of the function to call.
- **args** (any[]) - Optional - Arguments for the function.
- **dataSuffix** (Hex) - Optional - Data to append to the end of the calldata.
- **gas** (bigint) - Optional - The gas limit for the transaction.
- **gasPrice** (bigint) - Optional - The price (in wei) to pay per gas. Only applies to Legacy Transactions.
- **maxFeePerGas** (bigint) - Optional - Total fee per gas (in wei), inclusive of `maxPriorityFeePerGas`. Only applies to EIP-1559 Transactions.
- **maxPriorityFeePerGas** (bigint) - Optional - Max priority fee per gas (in wei). Only applies to EIP-1559 Transactions.
- **nonce** (number) - Optional - Unique number identifying this transaction.
- **account** (string) - Optional - The account to use for the transaction.
- **stateOverride** (StateOverride) - Optional - The state override set is an optional address-to-state mapping, where each entry specifies some state to be ephemerally overridden prior to executing the call.
- **value** (number) - Optional - Value in wei sent with this transaction.

### Request Example
```json
{
  "address": "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
  "abi": wagmiAbi,
  "functionName": "mint",
  "args": [69420],
  "account": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "gasPrice": "20",
  "maxFeePerGas": "20",
  "maxPriorityFeePerGas": "2",
  "nonce": 69,
  "value": "1000000000000000000",
  "dataSuffix": "0xdeadbeef",
  "gas": "69420",
  "stateOverride": [
    {
      "address": "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC",
      "balance": "1000000000000000000",
      "stateDiff": [
        {
          "slot": "0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0",
          "value": "0x00000000000000000000000000000000000000000000000000000000000001a4"
        }
      ]
    }
  ]
}
```

### Response
#### Success Response (200)
- **result** (any) - The result of the simulated contract call.

#### Response Example
```json
{
  "result": "transaction hash or other result"
}
```
```

--------------------------------

### Convert Wei Balance to Ether Units (TypeScript)

Source: https://viem.sh/docs/actions/public/getBalance

This example demonstrates how to convert a balance obtained in wei to Ether units using the `formatEther` utility function from viem. It takes the raw wei balance (bigint) as input and returns a formatted string.

```typescript
import { formatEther } from 'viem'

const balance = await publicClient.getBalance({
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  blockTag: 'safe'
})

const balanceAsEther = formatEther(balance) // "6.942"
```

--------------------------------

### Configure Contracts in Ponder

Source: https://ponder.sh/docs/api-reference/ponder/config

Defines smart contracts to be indexed, including their ABI, address, and the starting block for indexing. Supports indexing from a specific block range or in real-time.

```typescript
import { createConfig } from "ponder";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  contracts: {
    Blitmap: {
      abi: BlitmapAbi,
      chain: "mainnet",
      address: "0x8d04a8c79cEB0889Bdd12acdF3Fa9D207eD3Ff63",
      startBlock: 12439123,
    },
  },
  // ...
});
```

--------------------------------

### Configure ERC-4337 EntryPoint with Per-Chain Start Blocks

Source: https://ponder.sh/docs/config/contracts

Configures Ponder for the ERC-4337 EntryPoint contract, where the address is consistent across chains, but the startBlock needs to be specified per chain. This demonstrates flexible per-chain configuration.

```typescript
import { createConfig } from "ponder";
import { EntryPointAbi } from "./abis/EntryPoint";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1,
    },
    optimism: {
      id: 10,
      rpc: process.env.PONDER_RPC_URL_10,
    },
  },
  contracts: {
    EntryPoint: {
      abi: EntryPointAbi,
      address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      chain: {
        mainnet: {
          startBlock: 12369621,
        },
        optimism: {
          startBlock: 88234528,
        },
      },
    },
  },
});
```

--------------------------------

### Node.js: Paginated Account Selection

Source: https://ponder.sh/docs/query/sql-over-http

Demonstrates how to implement pagination for fetching account data using limit and offset. This is crucial for handling large datasets efficiently. It also shows how to get the total count of records in a table.

```typescript
import { desc } from "@ponder/client";
import * as schema from "../../ponder/schema";

const count = await client.db.$count(schema.account);
const result = await client.db
  .select()
  .from(schema.account)
  .orderBy(desc(schema.account.balance))
  .limit(100)
  .offset(500);
```

--------------------------------

### Fetch Block by Hash (TypeScript)

Source: https://viem.sh/docs/actions/public/getBlock

Retrieves block information for a specific block hash. This example shows how to pass the `blockHash` parameter to the `getBlock` function to query for a particular block.

```typescript
const block = await publicClient.getBlock({
  blockHash: '0x89644bbd5c8d682a2e9611170e6c1f02573d866d286f006cbf517eec7254ec2d'
})
```

--------------------------------

### Create Database Indexes - Ponder Schema

Source: https://ponder.sh/docs/0.10/schema/tables

Demonstrates creating database indexes using the `index()` function. This example shows B-tree indexes on `persons.name` for search queries and `dogs.ownerId` for relational queries. The `index()` function supports multiple columns, ordering, and custom index types.

```typescript
import { onchainTable, relations, index } from "ponder";

export const persons = onchainTable(
  "persons",
  (t) => ({
    id: t.text().primaryKey(),
    name: t.text(),
  }),
  (table) => ({
    nameIdx: index().on(table.name),
  })
);

export const personsRelations = relations(persons, ({ many }) => ({
  dogs: many(dogs),
}));

export const dogs = onchainTable(
  "dogs",
  (t) => ({
    id: t.text().primaryKey(),
    ownerId: t.text().notNull(),
  }),
  (table) => ({
    ownerIdx: index().on(table.ownerId),
  })
);

export const dogsRelations = relations(dogs, ({ one }) => ({
  owner: one(persons, { fields: [dogs.ownerId], references: [persons.id] }),
}));
```

--------------------------------

### Initialize Drizzle with Single Schema File (TypeScript)

Source: https://orm.drizzle.team/docs/rqb

Initializes the Drizzle ORM client using a single schema file. This is the basic setup for using Drizzle's query builder with your defined database schema.

```typescript
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/...';

const db = drizzle({
  schema
});
```

--------------------------------

### Drizzle ORM: Select with Raw SQL and Parameterization

Source: https://orm.drizzle.team/docs/select

Illustrates how Drizzle ORM translates programmatic queries into parameterized raw SQL. This example shows a simple equality check.

```sql
select "id", "name", "age" from "users" where "id" = $1; -- params: [42]
```

--------------------------------

### Read Contract using Specific Account Override with `readContract`

Source: https://viem.sh/docs/contract/readContract

This example demonstrates reading contract data while overriding the default account with a specified sender address. It requires the contract address, ABI, function name, and the account to use for the call.

```typescript
const data = await publicClient.readContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'totalSupply',
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
})
```

--------------------------------

### Experimental and Client Identity Configuration

Source: https://viem.sh/docs/clients/public

Configure experimental features like default block tags and client-specific identifiers such as key and name.

```APIDOC
### experimental_blockTag (optional)

*   **Type:** `BlockTag`
*   **Default:** `'latest'`

The default block tag to use for Actions. This applies to actions like `call`, `estimateGas`, `getBalance`, `getBlock`, `simulateBlocks`, `waitForTransactionReceipt`, and `watchBlocks`. If the chain has `experimental_preconfirmationTime` set, the default will be `'pending'`.

```javascript
import { createPublicClient, http }
from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  experimental_blockTag: 'pending', // Example: Default to pending block
  chain: mainnet,
  transport: http(),
})
```

### key (optional)

*   **Type:** `string`
*   **Default:** `"public"`

A unique key to identify this client instance.

```javascript
import { createPublicClient, http }
from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  chain: mainnet,
  key: 'myCustomKey', // Example: Set a custom key
  transport: http(),
})
```

### name (optional)

*   **Type:** `string`
*   **Default:** `"Public Client"`

A human-readable name for this client instance.

```javascript
import { createPublicClient, http }
from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  chain: mainnet,
  name: 'My Public Client', // Example: Set a custom name
  transport: http(),
})
```
```

--------------------------------

### Get Account Balance in Wei (TypeScript)

Source: https://viem.sh/docs/actions/public/getBalance

This snippet demonstrates how to use the `publicClient.getBalance` function from the viem library to retrieve an Ethereum address's balance in wei. It requires a `publicClient` instance and the target address as input.

```typescript
import { publicClient } from './client'

const balance = await publicClient.getBalance({
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})
```

--------------------------------

### Deploy and Verify Counter Contract on Sepolia

Source: https://book.getfoundry.sh/guides/scripting-with-solidity

This snippet demonstrates the command to deploy and verify the Counter contract on the Sepolia testnet. It utilizes forge script with broadcast options and saves transaction details to specified JSON files.

```bash
forge script script/Counter.s.sol:CounterScript --broadcast --verify
```

--------------------------------

### Basic React Query Usage with useQuery

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-functions

Demonstrates the fundamental use of the `useQuery` hook in React for fetching data. It requires the `QueryClient` and `QueryClientProvider` to be set up. This hook automatically handles fetching, caching, and background updates for the given query.

```jsx
import { useQuery } from '@tanstack/react-query';

function MyComponent() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos');
      return response.json();
    },
  });

  if (isLoading) return 'Loading...';
  if (error) return 'An error has occurred: ' + error.message;

  return (
    <div>
      {data.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

--------------------------------

### Implementing Bi-directional Infinite Lists (TypeScript)

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

This example shows how to configure `useInfiniteQuery` for bi-directional scrolling. It includes `getNextPageParam` for forward pagination and `getPreviousPageParam` for backward pagination, along with initial parameters.

```tsx
useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, pages) => firstPage.prevCursor,
})
```

--------------------------------

### GET /getTransaction

Source: https://viem.sh/docs/actions/public/getTransaction

Retrieves information about a Transaction given a hash or block identifier.

```APIDOC
## GET /getTransaction

### Description
Returns information about a Transaction given a hash or block identifier.

### Method
GET

### Endpoint
/getTransaction

### Parameters
#### Query Parameters
- **hash** (string) - Optional - Get information about a transaction given a transaction hash.
- **blockHash** (string) - Optional - Get information about a transaction given a block hash (and index).
- **blockNumber** (bigint) - Optional - Get information about a transaction given a block number (and index).
- **blockTag** ('latest' | 'earliest' | 'pending' | 'safe' | 'finalized') - Optional - Get information about a transaction given a block tag (and index).
- **index** (number) - Optional - An index to be used with a block identifier (number, hash or tag).

### Request Example
```json
{
  "hash": "0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d"
}
```

### Response
#### Success Response (200)
- **Transaction** (object) - The transaction information.

#### Response Example
```json
{
  "blockHash": "0xaf1dadb8a98f1282e8f7b42cc3da8847bfa2cf4e227b8220403ae642e1173088",
  "blockNumber": 15132008n,
  "from": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
}
```

### JSON-RPC Method
`eth_getTransactionByHash`
```

--------------------------------

### Solidity Custom Error Encoding

Source: https://docs.soliditylang.org/en/v0.8.17/abi-spec.html

Demonstrates how custom errors in Solidity are encoded, similar to function calls. The example shows an 'InsufficientBalance' error with its arguments being ABI-encoded.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

contract TestToken {
    error InsufficientBalance(uint256 available, uint256 required);

    function transfer(address /*to*/, uint amount) public pure {
        revert InsufficientBalance(0, amount);
    }
}
```

```text
Example return data for InsufficientBalance(0, amount):
0xcf479181 (selector), uint256(0), uint256(amount)
```

--------------------------------

### Create a PostgreSQL Schema

Source: https://www.postgresql.org/docs/current/ddl-schemas.html

This snippet demonstrates how to create a new schema in PostgreSQL. You can specify a schema name and optionally an owner. Schema names starting with 'pg_' are reserved.

```sql
CREATE SCHEMA myschema;
CREATE SCHEMA myschema AUTHORIZATION user_name;
```

--------------------------------

### Optimistic Updates Example (React)

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

Illustrates the concept of optimistic updates in TanStack Query. This pattern involves updating the UI immediately with the expected result of a mutation before the server confirms the operation, providing a smoother user experience. It requires careful handling of rollback scenarios.

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function TodoList() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newTodo) => {
      // Simulate server response
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...newTodo, id: Date.now() };
    },
    onMutate: async (newTodo) => {
      // Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData(['todos']);
      // Optimistically update to the new value
      queryClient.setQueryData(['todos'], (old) => [...(old || []), { ...newTodo, id: Date.now() }]);
      // Return a context with the previous value
      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const handleAddTodo = (title) => {
    mutation.mutate({ title });
  };

  // ... rest of the component to display todos and the add button
  return (
    <div>
      <button onClick={() => handleAddTodo('New Task')}>Add Task</button>
      {/* Display todos here */}
    </div>
  );
}

```

--------------------------------

### Fetch Balance using Viem Public Client

Source: https://ponder.sh/docs/0.10/query/api-endpoints

This example demonstrates making an RPC request to fetch an account's balance using the `publicClients` object from `ponder:api`. It utilizes a Viem Public Client instance for a specific network (chainId 8453). Ensure the network is defined in `ponder.config.ts`.

```typescript
import { publicClients } from "ponder:api";
import { Hono } from "hono";

const app = new Hono();

app.get("/balance/:address", async (c) => {
  const address = c.req.param("address");
  // Ensure 8453 is a defined chain ID in ponder.config.ts
  const balance = await publicClients[8453].getBalance({ address });
  return c.json({ address, balance });
});

export default app;
```

--------------------------------

### Read Contract using Block Tag with `readContract`

Source: https://viem.sh/docs/contract/readContract

This example demonstrates reading contract data using a block tag. It allows specifying tags like 'latest', 'safe', or 'finalized' to query the contract state at a particular point in the chain's history.

```typescript
const data = await publicClient.readContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'totalSupply',
  blockTag: 'safe',
})
```

--------------------------------

### Drizzle ORM: SQLite DEFAULT Constraints for Integer

Source: https://orm.drizzle.team/docs/indexes-constraints

Illustrates how to set a default value for an integer column in SQLite using Drizzle ORM. This example shows a basic integer default.

```typescript
import { sql } from "drizzle-orm";
import { int, tim
```

--------------------------------

### Configure Chain Settings in Ponder

Source: https://ponder.sh/docs/api-reference/ponder/config

Demonstrates how to configure chain-specific settings using the `ChainConfig` type. This example sets up the 'mainnet' chain with its ID, RPC URL, and WebSocket URL, which are essential for Ponder to interact with the blockchain.

```typescript
import { createConfig, type ChainConfig } from "ponder";

const mainnet = {
  id: 1,
  rpc: process.env.PONDER_RPC_URL_1,
  ws: process.env.PONDER_WS_URL_1,
} as const satisfies ChainConfig;

export default createConfig({
  chains: {
    mainnet,
  }
  // ...
});
```

--------------------------------

### Set up PonderProvider for React

Source: https://ponder.sh/docs/0.10/query/sql-client

Wraps the React application with PonderProvider to make the Ponder client instance available to all child components. This is a prerequisite for using @ponder/react hooks.

```typescript
import { PonderProvider } from "@ponder/react";
import { client } from "../lib/ponder";

function App() {
  return (
    <PonderProvider client={client}>
      {/***** ... your app components ... *****/}
    </PonderProvider>
  );
}
```

--------------------------------

### Solidity Contract Inheritance Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Demonstrates Solidity's inheritance mechanism, including multiple inheritance, virtual functions, overriding, and internal function calls to base contracts. It shows how to derive contracts and access members of base contracts.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Owned {
    address payable owner;

    constructor() {
        owner = payable(msg.sender);
    }
}

// Use `is` to derive from another contract. Derived
// contracts can access all non-private members including
// internal functions and state variables. These cannot be
// accessed externally via `this`, though.
contract Emittable is Owned {
    event Emitted();

    // The keyword `virtual` means that the function can change
    // its behavior in derived classes ("overriding").
    function emitEvent() virtual public {
        if (msg.sender == owner)
            emit Emitted();
    }
}

// These abstract contracts are only provided to make the
// interface known to the compiler. Note the function
// without body. If a contract does not implement all
// functions it can only be used as an interface.
abstract contract Config {
    function lookup(uint id) public virtual returns (address adr);
}

abstract contract NameReg {
    function register(bytes32 name) public virtual;
    function unregister() public virtual;
}

// Multiple inheritance is possible. Note that `Owned` is
// also a base class of `Emittable`, yet there is only a single
// instance of `Owned` (as for virtual inheritance in C++).
contract Named is Owned, Emittable {
    constructor(bytes32 name) {
        Config config = Config(0xD5f9D8D94886E70b06E474c3fB14Fd43E2f23970);
        NameReg(config.lookup(1)).register(name);
    }

    // Functions can be overridden by another function with the same name and
    // the same number/types of inputs. If the overriding function has different
    // types of output parameters, that causes an error.
    // Both local and message-based function calls take these overrides
    // into account.
    // If you want the function to override, you need to use the
    // `override` keyword. You need to specify the `virtual` keyword again
    // if you want this function to be overridden again.
    function emitEvent() public virtual override {
        if (msg.sender == owner) {
            Config config = Config(0xD5f9D8D94886E70b06E474c3fB14Fd43E2f23970);
            NameReg(config.lookup(1)).unregister();
            // It is still possible to call a specific
            // overridden function.
            Emittable.emitEvent();
        }
    }
}

// If a constructor takes an argument, it needs to be
// provided in the header or modifier-invocation-style at
// the constructor of the derived contract (see below).
contract PriceFeed is Owned, Emittable, Named("GoldFeed") {
    uint info;

    function updateInfo(uint newInfo) public {
        if (msg.sender == owner)
            info = newInfo;
    }

    // Here, we only specify `override` and not `virtual`.
    // This means that contracts deriving from `PriceFeed`
    // cannot change the behavior of `emitEvent` anymore.
    function emitEvent() public override(Emittable, Named) {
        Named.emitEvent();
    }

    function get() public view returns(uint r) {
        return info;
    }
}

```

--------------------------------

### Solidity Tuple Types in ABI

Source: https://docs.soliditylang.org/en/v0.8.17/abi-spec.html

This example illustrates how complex nested tuple types within a Solidity contract are represented in the ABI. It shows the recursive structure for defining components within tuples.

```json
[ { "name": "f", "type": "function", "inputs": [ { "name": "s", "type": "tuple", "components": [ { "name": "a", "type": "uint256" }, { "name": "b", "type": "uint256[]" }, { "name": "c", "type": "tuple[]", "components": [ { "name": "x", "type": "uint256" }, { "name": "y", "type": "uint256" } ] } ] }, { "name": "t", "type": "tuple", "components": [ { "name": "x", "type": "uint256" }, { "name": "y", "type": "uint256" } ] }, { "name": "a", "type": "uint256" } ], "outputs": [] } ]
```

--------------------------------

### Configure Ponder Contracts and Chains (TypeScript)

Source: https://github.com/ponder-sh/ponder

This TypeScript code snippet illustrates how to configure Ponder to fetch event logs for specified contracts and chains. It defines the network details (like RPC URL) and contract specifics (ABI, chain, address, startBlock). This configuration is crucial for Ponder to process events and populate the indexing functions.

```typescript
import { createConfig } from "ponder";
import { BaseRegistrarAbi } from "./abis/BaseRegistrar";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: "https://eth-mainnet.g.alchemy.com/v2/...",
    },
  },
  contracts: {
    BaseRegistrar: {
      abi: BaseRegistrarAbi,
      chain: "mainnet",
      address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
      startBlock: 9380410,
    },
  },
});
```

--------------------------------

### Define Ponder Configuration with createConfig

Source: https://ponder.sh/docs/0.10/api-reference/ponder/config

The `ponder.config.ts` file must default export the object returned by `createConfig`. This function is used to define your project's networks, contracts, and database configuration. It's the entry point for Ponder's setup.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";

export default createConfig({
  networks: {
    /* ... */
  },
  contracts: {
    /* ... */
  },
});

```

--------------------------------

### Estimate Gas with Specific Account Address in TypeScript

Source: https://viem.sh/docs/actions/public/estimateGas

This example shows how to estimate gas when providing a specific account address instead of a configured `Account` object. The `estimateGas` function accepts a string address for the `account` parameter.

```typescript
import { parseEther } from 'viem'

const gas = await publicClient.estimateGas({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: parseEther('1')
})
```

--------------------------------

### Set up PonderProvider in React App (TypeScript)

Source: https://ponder.sh/docs/query/sql-over-http

This React code snippet shows how to wrap your application with PonderProvider, making the @ponder/client instance available to all child components. It requires importing PonderProvider and your client instance.

```typescript
import { PonderProvider } from "@ponder/react";
import { client } from "../lib/ponder";

function App() {
  return (
    <PonderProvider client={client}>
      {/***** ... *****/}
    </PonderProvider>
  );
}

```

--------------------------------

### Encode Function Call with Dynamic Types (Solidity Example)

Source: https://docs.soliditylang.org/en/v0.8.17/abi-spec.html

Demonstrates the encoding of a function call with mixed static and dynamic types. It shows how the function signature hash is used, and how arguments like uint256, uint32[], bytes10, and bytes are padded and offset for encoding. This is crucial for inter-contract communication and transaction data formatting.

```text
0x8be65246
0000000000000000000000000000000000000000000000000000000000000123
0000000000000000000000000000000000000000000000000000000000000080
3132333435363738393000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000e0
0000000000000000000000000000000000000000000000000000000000000002
0000000000000000000000000000000000000000000000000000000000000456
0000000000000000000000000000000000000000000000000000000000000789
000000000000000000000000000000000000000000000000000000000000000d
48656c6c6f2c20776f726c642100000000000000000000000000000000000000
```

--------------------------------

### Configure HTTP Transport with onFetchRequest Callback (JavaScript)

Source: https://viem.sh/docs/clients/transports/http

Shows how to use the `onFetchRequest` callback to intercept and process outgoing HTTP requests. This is valuable for logging request details or performing pre-request modifications.

```javascript
const transport = http('https://1.rpc.thirdweb.com/...', {
  onFetchRequest(request) {
    console.log(request);
  },
});
```

--------------------------------

### Simulate Contract Write with Arguments (TypeScript)

Source: https://viem.sh/docs/contract/simulateContract

This example shows how to pass arguments to a contract write function using `simulateContract`. The `args` attribute accepts an array of values, and TypeScript infers their types from the function signature and ABI, ensuring type safety. The `mint` function here requires a `tokenId` argument.

```typescript
import { account, publicClient } from './config'
import { wagmiAbi } from './abi'

const { result } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  args: [69420],
  account,
})

```

--------------------------------

### Create Table with Default Values using SQL

Source: https://orm.drizzle.team/docs/column-types/pg

Provides the SQL equivalent for creating a table with various default value configurations, corresponding to the Drizzle ORM TypeScript examples.

```sql
CREATE TABLE IF NOT EXISTS "table" (
  "integer1" integer DEFAULT 42,
  "integer2" integer DEFAULT '42'::integer,
  "uuid1" uuid DEFAULT gen_random_uuid(),
  "uuid2" uuid DEFAULT gen_random_uuid()
);
```

--------------------------------

### Simulate Contract with State Overrides in TypeScript

Source: https://viem.sh/docs/contract/simulateContract

Simulates a `transferFrom` contract interaction with state overrides to pre-set an allowance. This example modifies the token contract's state to grant maximum allowance before the simulation.

```typescript
import { account, publicClient } from './config'
import { abi, address } from './contract'
import { numberToHex, maxUint256 } from 'viem'

// Allowance slot: A 32 bytes hex string representing the allowance slot of the sender.
const allowanceSlot = '0x....'
// Max allowance: A 32 bytes hex string representing the maximum allowance (2^256 - 1)
const maxAllowance = numberToHex(maxUint256)

const { result } = await publicClient.simulateContract({
  abi,
  address,
  account,
  functionName: 'transferFrom',
  args: [
    '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    account.address,
    69420n,
  ],
  stateOverride: [
    {
      // modifying the state of the token contract
      address,
      stateDiff: [
        {
          slot: allowanceSlot,
          value: maxAllowance,
        },
      ],
    },
  ],
})

console.log(result)
```

--------------------------------

### Solidity Multiple Inheritance Diamond Problem

Source: https://docs.soliditylang.org/en/latest/contracts.html

Illustrates a scenario in Solidity where multiple inheritance leads to an impossible linearization due to conflicting inheritance paths. This example will not compile.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

contract X {}
contract A is X {}

// This will not compile
contract C is A, X {}
```

--------------------------------

### Drizzle ORM MySQL Table with Indexes

Source: https://orm.drizzle.team/docs/indexes-constraints

Example of defining a MySQL table using Drizzle ORM, including the creation of a standard index and a unique index. This demonstrates how to integrate index definitions directly within the table schema.

```typescript
import { int, text, index, uniqueIndex, mysqlTable } from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name"),
  email: text("email"),
}, (table) => [
  index("name_idx").on(table.name),
  uniqueIndex("email_idx").on(table.email),
]);
```

--------------------------------

### Deployless Contract Call via Bytecode with viem

Source: https://viem.sh/docs/contract/readContract

Illustrates performing a 'deployless' call using bytecode. This allows calling a function on a contract that may not yet be deployed. It requires the ABI, function name, and the contract's bytecode. The `code` parameter takes the contract's bytecode.

```typescript
import { parseAbi } from 'viem'
import { publicClient } from './config'

const data = await publicClient.readContract({
  abi: parseAbi(['function name() view returns (string)']),
  code: '0x...', // Accessible here: https://etherscan.io/address/0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2#code
  functionName: 'name'
})
```

--------------------------------

### Offset Pagination (Specific Page)

Source: https://ponder.sh/docs/query/graphql

This GraphQL query shows how to jump to a specific page using offset pagination. The `offset` is calculated as `(pageNumber - 1) * limit`. This example fetches page 2 with a limit of 2.

```graphql
query {
  persons(orderBy: "age", orderDirection: "asc", limit: 2, offset: 2 # Page 2: (2 - 1) * 2 = 2
  ) {
    items {
      name
      age
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
    }
    totalCount
  }
}
```

--------------------------------

### Execute Contract Call with Account and Data (JavaScript)

Source: https://viem.sh/docs/actions/public/call

This snippet demonstrates how to execute a contract call using a specified account and transaction data. It requires `publicClient` to be initialized. The input is the contract call parameters, and the output is the result of the call.

```javascript
const data = await publicClient.call({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

--------------------------------

### Configure Block Indexing Settings in Ponder

Source: https://ponder.sh/docs/0.10/api-reference/ponder/config

Defines specific block indexing configurations for contracts within Ponder. Allows setting the network, start block, and indexing interval for a particular contract.

```typescript
import { createConfig, type BlockConfig } from "ponder";

const ChainlinkPriceOracle = {
  network: "mainnet",
  startBlock: 19_750_000,
  interval: 5,
} as const satisfies BlockConfig;

export default createConfig({
  blocks: {
    ChainlinkPriceOracle,
  },
  // ...
});
```

--------------------------------

### Configure AaveToken Contract with Ponder

Source: https://ponder.sh/docs/indexing/read-contracts

This configuration sets up the AaveToken contract for use with Ponder, specifying its chain, ABI, address, and starting block for indexing. It's a foundational step for interacting with the contract within the Ponder framework.

```typescript
import { AaveTokenAbi } from "./abis/AaveToken";

export default createConfig({
  contracts: {
    AaveToken: {
      chain: "mainnet",
      abi: AaveTokenAbi,
      address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
      startBlock: 10926829,
    },
  },
});
```

--------------------------------

### GraphQL Query for Pools and Token Information

Source: https://github.com/marktoda/v4-ponder

Example GraphQL query to retrieve a list of pools along with their associated token information (address, name, symbol, decimals). It limits the results to the first 10 pools.

```graphql
query {
  pools(first: 10) {
    poolId
    chainId
    fee
    token0 {
      address
      name
      symbol
      decimals
    }
    token1 {
      address
      name
      symbol
      decimals
    }
  }
}
```

--------------------------------

### BigInt Coercion Example

Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt

Illustrates how different JavaScript types are coerced into BigInt values using the BigInt() function. Note that Numbers are converted if they are integers, unlike in some built-in operations.

```javascript
console.log(BigInt(true));   // 1n
console.log(BigInt(false));  // 0n
console.log(BigInt('123'));  // 123n
console.log(BigInt(123));    // 123n (integer number)
console.log(BigInt(123.45)); // 123n (truncated)

// Error cases:
// console.log(BigInt(null));    // TypeError
// console.log(BigInt(undefined)); // TypeError
// console.log(BigInt('abc'));   // SyntaxError
// console.log(BigInt(Symbol('a')))); // TypeError
```

--------------------------------

### `client.live` - Live Database Subscriptions

Source: https://ponder.sh/docs/0.10/api-reference/ponder-client

Subscribe to real-time database updates using Server-Sent Events (SSE).

```APIDOC
## `client.live`

### Description

Subscribe to live updates from the database using server-sent events (SSE).

### Method

N/A (Method Call on Client Object)

### Endpoint

N/A

### Parameters

#### Request Body

- **queryFn** (`(db: ClientDb) => Promise`) - Required - A query builder callback using the `db` argument.
- **onData** (`(result: Result) => void`) - Required - Callback that receives each new query result.
- **onError** (`(error: Error) => void`) - Optional - Callback that handles any errors that occur.

#### Response

#### Success Response (200)

- **Object with `unsubscribe` method** - Returns an object with an `unsubscribe` method that can be called to stop receiving updates.

### Request Example

```typescript
import { client, schema } from "../lib/ponder";

const { unsubscribe } = client.live(
  (db) => db.select().from(schema.account),
  (result) => {
    console.log("Updated accounts:", result);
  },
  (error) => {
    console.error("Subscription error:", error);
  }
);

// Later, to stop receiving updates:
unsubscribe();
```

### Implementation Notes

- Each `createClient` instance multiplexes all live queries over a single SSE connection.
- The server notifies the client whenever a new block gets indexed. If a query result is no longer valid, the client immediately refetches it to receive the latest result.
```

--------------------------------

### Define Contract Configuration in Ponder

Source: https://ponder.sh/docs/api-reference/ponder/config

Provides an example of configuring a contract using `ContractConfig`. This snippet sets up an ERC20 contract with its chain, ABI, and address. This is fundamental for Ponder to track and process events from specific smart contracts.

```typescript
import { createConfig, type ContractConfig } from "ponder";
import { Erc20Abi } from "./abis/Erc20Abi.ts";

const Erc20 = {
  chain: "mainnet",
  abi: Erc20Abi,
  address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
} as const satisfies ContractConfig;

export default createConfig({
  contracts: {
    Erc20,
  },
  // ...
});
```

--------------------------------

### Read Contract with State Overrides using `readContract`

Source: https://viem.sh/docs/contract/readContract

This example demonstrates reading contract data with ephemeral state overrides. It allows specifying changes to the state of certain addresses, like modifying balances or storage slots, before executing the read operation.

```typescript
const data = await publicClient.readContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'totalSupply',
  stateOverride: [
    {
      address: '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
      balance: parseEther('1'),
      stateDiff: [
        {
          slot: '0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0',
          value: '0x00000000000000000000000000000000000000000000000000000000000001a4',
        },
      ],
    },
  ],
})
```

--------------------------------

### Get Block Transaction Count by Number - viem

Source: https://viem.sh/docs/actions/public/getBlockTransactionCount

Fetches the transaction count for a block specified by its block number. Input is a bigint representing the block number, and the output is a number.

```typescript
const count = await publicClient.getBlockTransactionCount({
  blockNumber: 42069n
})
console.log(count)
```

--------------------------------

### Apply Editor Themes to GraphiQL

Source: https://github.com/graphql/graphiql/tree/main/packages/graphiql

Shows how to apply a CodeMirror editor theme to the GraphiQL interface. This involves linking the theme's CSS file in the document's head and passing the theme name to the 'editorTheme' prop when rendering GraphiQL.

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.23.0/theme/solarized.css" />
```

--------------------------------

### Eligible Factory Event Signatures

Source: https://ponder.sh/docs/0.10/guides/factory

Examples of event signatures that are eligible for use with the Ponder factory pattern. Eligibility is based on the event having a named 'address' parameter for the child contract.

```solidity
// ✅ Eligible. The parameter "child" has type "address" and is non-indexed.
events ChildContractCreated(address child);

// ✅ Eligible. The parameter "pool" has type "address" and is indexed.
events PoolCreated(address indexed deployer, address indexed pool, uint256 fee);
```

--------------------------------

### Implementing a Limited Infinite Query (TypeScript)

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

This example configures `useInfiniteQuery` with the `maxPages` option to limit the number of pages stored in the cache. This helps manage memory and network usage, especially for queries with many pages.

```tsx
useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => lage.nextCursor,
  getPreviousPageParam: (firstPage, pages) => firstPage.prevCursor,
  maxPages: 3,
})
```

--------------------------------

### Solidity Function Type Declaration Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Demonstrates how to declare a variable whose type is a function type in Solidity. This syntax defines a variable that can hold a reference to a function with a specific signature.

```solidity
function(address) external returns (address) foo;
```

--------------------------------

### PostgreSQL: Create Table with Mixed Column and Table Constraints

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

This example demonstrates defining a 'products' table with a mix of column constraints and table constraints. It includes individual CHECK constraints for 'price' and 'discounted_price', and a separate table constraint to enforce the relationship between them.

```sql
CREATE TABLE products (
  product_no integer,
  name text,
  price numeric,
  CHECK (price > 0),
  discounted_price numeric,
  CHECK (discounted_price > 0),
  CHECK (price > discounted_price)
);
```

--------------------------------

### Displaying Resource Usage Metrics

Source: https://railway.app/

This snippet represents the visualization of various resource usage metrics over time, including CPU, memory, disk, and network egress. These graphs help users monitor application performance and identify potential bottlenecks.

```chart
CPU Usage
2.5 vCPU
2.0 vCPU
1.5 vCPU
1.0 vCPU
0.5 vCPU
0 vCPU
Sep 4
Sep 7
Sep 10
Sep 13

Memory Usage
25 GB
20 GB
15 GB
10 GB
5 GB
0 B
Sep 4
Sep 7
Sep 10
Sep 13

Disk Usage
25 GB
20 GB
15 GB
10 GB
5 GB
0 B
Sep 4
Sep 7
Sep 10
Sep 13

Network Egress
25 GB
20 GB
15 GB
10 GB
5 GB
0 B
Sep 4
Sep 7
Sep 10
Sep 13

Frontend hit/error
25 K
20 K
15 K
10 K
5 K
0 K
Sep 4
Sep 7
Sep 10
Sep 13

5XX Errors
2.5 K
2 K
1.5 K
1 K
0.5 K
0 K
Sep 4
Sep 7
Sep 10
Sep 13
```

--------------------------------

### PostgreSQL Combined Constraints Example

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

Shows how to define multiple constraints, including NOT NULL and CHECK, on columns within a single table definition in PostgreSQL. The order of constraints does not dictate the order of checking.

```sql
CREATE TABLE products (
 product_no integer NOT NULL,
 name text NOT NULL,
 price numeric NOT NULL CHECK (price > 0)
);
```

--------------------------------

### React Hooks: useQuery

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

Documentation for the `useQuery` hook, which is the primary hook for fetching and managing server state in React components using TanStack Query.

```APIDOC
## React Hooks: useQuery

### Description
The `useQuery` hook allows you to declaratively fetch, cache, and update server state in your React components. It handles loading states, error states, and background refetching automatically.

### Usage
```jsx
import { useQuery } from '@tanstack/react-query';

function TodosComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
  });

  if (isLoading) return 'Loading...';
  if (error) return 'An error has occurred: ' + error.message;

  return (
    <ul>
      {data.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

### Parameters

- **`queryKey`** (QueryKey): A unique key for the query. Can be a string or an array.
- **`queryFn`** (QueryFunction<TData, TQueryKey>): An asynchronous function that fetches the data.
- **`options`** (UseQueryOptions):
  - **`enabled`** (boolean) - Optional. If `false`, the query will not run.
  - **`staleTime`** (number) - Optional. The time in milliseconds after data is considered stale.
  - **`cacheTime`** (number) - Optional. The time in milliseconds after inactive data is garbage collected.
  - **`refetchOnWindowFocus`** (boolean | 'always') - Optional. Configure refetching on window focus.
  - **`retry`** (number | boolean) - Optional. Configure the number of retry attempts on failure.

### Return Value

The `useQuery` hook returns an object with the following properties:

- **`data`** (TData | undefined): The fetched data.
- **`isLoading`** (boolean): True if the query is currently fetching and has no data.
- **`isError`** (boolean): True if the query has encountered an error.
- **`error`** (Error | null): The error object if `isError` is true.
- **`isFetching`** (boolean): True if the query is currently fetching (including background refetches).
- **`status`** ('loading' | 'error' | 'success'): The current status of the query.

### Response Example (Success)
```json
{
  "data": [
    {
      "id": 1,
      "title": "Learn TanStack Query",
      "completed": false
    }
  ],
  "isLoading": false,
  "isError": false,
  "error": null,
  "isFetching": false,
  "status": "success"
}
```
```

--------------------------------

### Get Transaction Confirmations by Receipt

Source: https://viem.sh/docs/actions/public/getTransactionConfirmations

Fetches the number of confirmations for a transaction using its receipt object. This requires a pre-existing transaction receipt. The function returns the number of blocks passed since the transaction was processed.

```typescript
import { publicClient } from './client'

const transactionReceipt = await publicClient.getTransactionReceipt({
  hash: '...'
})

const confirmations = await publicClient.getTransactionConfirmations({
  transactionReceipt: transactionReceipt
})
```

--------------------------------

### Drizzle ORM SQLite Table with Indexes

Source: https://orm.drizzle.team/docs/indexes-constraints

Example of defining a SQLite table using Drizzle ORM, including the creation of a standard index and a unique index. This showcases the Drizzle ORM syntax for SQLite-specific table and index definitions.

```typescript
import { integer, text, index, uniqueIndex, sqliteTable } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  email: text("email"),
}, (table) => [
  index("name_idx").on(table.name),
  uniqueIndex("email_idx").on(table.email),
]);
```

--------------------------------

### Get Block Transaction Count by Hash - viem

Source: https://viem.sh/docs/actions/public/getBlockTransactionCount

Retrieves the transaction count for a specific block identified by its hash. This requires a valid block hash as input and returns a number.

```typescript
const count = await publicClient.getBlockTransactionCount({
  blockHash: '0x89644bbd5c8d682a2e9611170e6c1f02573d866d286f006cbf517eec7254ec2d'
})
console.log(count)
```

--------------------------------

### Batch Contract Calls with viem multicall (TypeScript)

Source: https://viem.sh/docs/contract/multicall

This example demonstrates how to use the viem `multicall` function to batch multiple contract read operations into a single RPC call. It imports necessary components like `publicClient` and contract ABI. The function returns an array of results, each with a status indicating success or failure, or an error if `allowFailure` is false.

```typescript
import { publicClient } from './client'
import { wagmiAbi } from './abi'

const wagmiContract = {
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi
} as const

const results = await publicClient.multicall({
  contracts: [
    {
      ...wagmiContract,
      functionName: 'totalSupply',
    },
    {
      ...wagmiContract,
      functionName: 'ownerOf',
      args: [69420n]
    },
    {
      ...wagmiContract,
      functionName: 'mint'
    }
  ]
})

/**
 * [
 *   { result: 424122n, status: 'success' },
 *   { result: '0xc961145a54C96E3aE9bAA048c4F4D6b04C13916b', status: 'success' },
 *   { error: [ContractFunctionExecutionError: ...], status: 'failure' }
 * ]
 */
```

--------------------------------

### Viem Transports: loadBalance and rateLimit Usage (TypeScript)

Source: https://ponder.sh/docs/0.10/api-reference/ponder-utils

Demonstrates how to use `loadBalance` and `rateLimit` transports from `@ponder/utils` with Viem's `createPublicClient`. `loadBalance` distributes requests across multiple transports, while `rateLimit` controls the request rate to a single transport. Requires importing necessary functions from `viem` and chain definitions.

```typescript
import { loadBalance } from "@ponder/utils";
import { createPublicClient, fallback, http, webSocket } from "viem";
import { mainnet } from "viem/chains";

const transport = loadBalance([
  http("https://cloudflare-eth.com"),
  webSocket("wss://ethereum-rpc.publicnode.com"),
  rateLimit(http("https://rpc.ankr.com/eth"), { requestsPerSecond: 5 }),
]),

const client = createPublicClient({
  chain: mainnet,
  transport,
});
```

--------------------------------

### Use Mutation Hook Example (React)

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

Shows how to use the `useMutation` hook for performing data mutations (e.g., POST, PUT, DELETE requests). It allows for handling mutation states like loading, success, and error, and can be configured with callbacks for various lifecycle events.

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddTodo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newTodo) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(newTodo),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <form onSubmit={e => {
      e.preventDefault();
      mutation.mutate({ title: e.target.elements.title.value });
    }}>
      <input type="text" name="title" />
      <button type="submit">Add Todo</button>
    </form>
  );
}

```

--------------------------------

### Estimate Gas with EIP-1559 Max Priority Fee Per Gas in TypeScript

Source: https://viem.sh/docs/actions/public/estimateGas

This example shows how to estimate gas for an EIP-1559 transaction by setting both `maxFeePerGas` and `maxPriorityFeePerGas`. The `maxPriorityFeePerGas` specifies the maximum priority fee per gas in wei.

```typescript
import { parseEther, parseGwei } from 'viem'

const gas = await publicClient.estimateGas({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  maxFeePerGas: parseGwei('20'),
  maxPriorityFeePerGas: parseGwei('2'),
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: parseEther('1')
})
```

--------------------------------

### Connect to SQL over HTTP Server (TypeScript)

Source: https://ponder.sh/docs/query/sql-over-http

This code demonstrates how to create a client instance to connect to the Ponder SQL over HTTP server. It uses the createClient function from @ponder/client and specifies the server's URL.

```typescript
import { createClient } from "@ponder/client";

const client = createClient("http://localhost:42069/sql");

```

--------------------------------

### Infinite Query with Page Parameter as Cursor (TypeScript)

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

Provides an example of using `useInfiniteQuery` when the API does not return a cursor. It leverages the `pageParam` to calculate the next and previous page parameters, incrementing or decrementing by one.

```tsx
return useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage, allPages, lastPageParam) => {
    if (lastPage.length === 0) {
      return undefined
    }
    return lastPageParam + 1
  },
  getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
    if (firstPageParam <= 1) {
      return undefined
    }
    return firstPageParam - 1
  },
})
```

--------------------------------

### Configure Fallback Transport with Retry Count (JavaScript)

Source: https://viem.sh/docs/clients/transports/fallback

This example shows how to set a custom maximum number of retries for the fallback transport when a request fails. The fallback will exhaust all provided transports before initiating retries.

```javascript
const transport = fallback([
  thirdweb,
  infura
], {
  retryCount: 5,
});
```

--------------------------------

### Cursor Based Pagination Query Example (PostgreSQL)

Source: https://akashrajpurohit.com/blog/navigating-your-database-efficiently-cursor-based-pagination-vs-offset-based

This snippet illustrates cursor-based pagination using PostgreSQL's 'LIMIT' and 'FETCH NEXT' clauses. It shows how this method leverages index scans for better performance by efficiently retrieving specific rows based on an ordering criterion, making it more scalable for large datasets.

```sql
EXPLAIN SELECT * FROM users ORDER BY id LIMIT 2 FETCH NEXT 2 ROWS ONLY;
```

--------------------------------

### Ponder API RPC Request Example (TypeScript)

Source: https://ponder.sh/docs/query/api-endpoints

Illustrates making an RPC request to a blockchain using Viem clients within a Ponder API endpoint. It fetches the balance of a given address on the 'base' chain using `publicClients` from `ponder:api`. Assumes the 'base' chain is configured in `ponder.config.ts`.

```typescript
import { publicClients } from "ponder:api";
import { Hono } from "hono";

const app = new Hono();

app.get("/balance/:address", async (c) => {
  const address = c.req.param("address");
  const balance = await publicClients["base"].getBalance({ address });
  return c.json({ address, balance });
});

export default app;

```

--------------------------------

### Get Block Transaction Count by Tag - viem

Source: https://viem.sh/docs/actions/public/getBlockTransactionCount

Obtains the transaction count for a block using a predefined tag (e.g., 'latest', 'safe'). The default tag is 'latest'. Returns a number.

```typescript
const count = await publicClient.getBlockTransactionCount({
  blockTag: 'safe'
})
console.log(count)
```

--------------------------------

### Cache and CCIP Read Configuration

Source: https://viem.sh/docs/clients/public

Configure client-side caching and CCIP read behavior for efficient data retrieval and offchain lookups.

```APIDOC
### cacheTime (optional)

*   **Type:** `number`
*   **Default:** `client.pollingInterval`

Time (in milliseconds) that cached data will remain in memory before being considered stale.

```javascript
import { createPublicClient, http }
from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  cacheTime: 10000, // Example: Cache data for 10 seconds
  chain: mainnet,
  transport: http(),
})
```

### ccipRead (optional)

*   **Type:** `(parameters: CcipRequestParameters) => Promise | false`
*   **Default:** `true`

Controls whether CCIP Read functionality is enabled. If set to `false`, the client will not support offchain CCIP lookups.

```javascript
import { createPublicClient, http }
from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  ccipRead: false, // Example: Disable CCIP Read
  chain: mainnet,
  transport: http(),
})
```

### ccipRead.request (optional)

*   **Type:** `(parameters: CcipRequestParameters) => Promise`

A function that will be called to make the offchain CCIP lookup request. This allows for custom handling of CCIP read requests.

```javascript
import { createPublicClient, http }
from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  ccipRead: {
    async request({ data, sender, urls }) {
      // Custom logic to handle CCIP read requests
      // ...
      return '0x'; // Example return value
    },
  },
  chain: mainnet,
  transport: http(),
})
```
```

--------------------------------

### Get Block Transaction Count - viem

Source: https://viem.sh/docs/actions/public/getBlockTransactionCount

Fetches the count of transactions in the latest block. This function requires an initialized viem public client. It returns a number representing the transaction count.

```typescript
import { publicClient } from './client'

const count = await publicClient.getBlockTransactionCount()
console.log(count)
```

--------------------------------

### Server Rendering & Hydration

Source: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery

Guidance on implementing server-side rendering and hydration with TanStack Query.

```APIDOC
## Server Rendering & Hydration

TanStack Query provides robust support for server-side rendering (SSR) and client-side hydration, allowing you to render your application on the server and then seamlessly hydrate the client.

### Key Concepts

*   **`QueryClient.getDehydratedState()`**: Used on the server to get a serializable snapshot of the query cache.
*   **`QueryClient.hydrate(dehydratedState)`**: Used on the client to hydrate the cache with the state from the server.

### Advanced Server Rendering

This section covers more advanced techniques for SSR, potentially including streaming and prefetching strategies tailored for server environments.

### Hydration

This covers the process of re-initializing the client-side application with server-rendered state, ensuring a smooth user experience and avoiding unnecessary fetches.

### Request Example (Server-side)
```javascript
// Example using a framework like Next.js (conceptual)
import { QueryClient } from '@tanstack/react-query';

export async function getServerSideProps(context) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(['todos'], fetchTodos);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
}
```

### Request Example (Client-side)
```javascript
// Example using a framework like Next.js (conceptual)
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';

function MyApp({ Component, pageProps }) {
  const queryClient = new QueryClient();

  return (
    <HydrationBoundary state={pageProps.dehydratedState}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </HydrationBoundary>
  );
}
```
```

--------------------------------

### Configure Network with Alchemy HTTP Transport

Source: https://ponder.sh/docs/0.10/config/networks

This example shows how to configure the 'mainnet' network using Viem's `http` transport, specifically connecting to an Alchemy RPC endpoint. It's important to note that most Ponder applications will require a paid RPC provider plan to avoid rate limiting issues.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http("https://eth-mainnet.g.alchemy.com/v2/..."),
    },
  },
  contracts: {
    /* ... */
  },
});
```

--------------------------------

### GraphQL Introspection for Connection Type

Source: https://relay.dev/graphql/connections.htm

An example GraphQL introspection query to retrieve information about a connection type, specifically 'ExampleConnection'. This query demonstrates how a server conforming to the spec would expose fields like 'pageInfo' and 'edges'.

```graphql
{
  __type(name: "ExampleConnection") {
    fields {
      name
      type {
        name
        kind
        ofType {
          name
          kind
        }
      }
    }
  }
}
```

--------------------------------

### Drizzle ORM: Find Users with Posts (Parameterized)

Source: https://orm.drizzle.team/docs/rqb

This example shows how to find users along with their posts using Drizzle ORM. It utilizes parameterized placeholders for dynamic query construction, allowing for flexible filtering and pagination of both users and their associated posts.

```typescript
const prepared = db.query.users.findMany({
  limit: placeholder('uLimit'),
  offset: placeholder('uOffset'),
  where: ((users, { eq, or }) => or(eq(users.id, placeholder('id')), eq(users.id, 3))),
  with: {
    posts: {
      where: ((users, { eq }) => eq(users.id, placeholder('pid'))),
      limit: placeholder('pLimit'),
    },
  },
}).prepare('query_name');

const usersWithPosts = await prepared.execute({
  pLimit: 1,
  uLimit: 3,
  uOffset: 1,
  id: 2,
  pid: 6
});
```

--------------------------------

### PostgreSQL Exclusion Constraint Example

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

Illustrates the creation of an exclusion constraint using the GiST index type. This constraint ensures that no two rows in the 'circles' table will have overlapping circles, as defined by the '&&' operator.

```sql
CREATE TABLE circles (
  c circle,
  EXCLUDE USING gist (c WITH &&)
);
```

--------------------------------

### PostgreSQL Schema and Table Creation SQL

Source: https://orm.drizzle.team/docs/schemas

The SQL commands to create the 'my_schema', the 'colors' enum type, and the 'users' table in PostgreSQL as defined by the Drizzle ORM TypeScript example. This provides the direct database implementation.

```sql
CREATE SCHEMA "my_schema";

CREATE TYPE "my_schema"."colors" AS ENUM ('red', 'green', 'blue');

CREATE TABLE "my_schema"."users" (
  "id" serial PRIMARY KEY,
  "name" text,
  "color" "my_schema"."colors" DEFAULT 'red'
);
```

--------------------------------

### Configure HTTP Transport with onFetchResponse Callback (JavaScript)

Source: https://viem.sh/docs/clients/transports/http

Illustrates the use of the `onFetchResponse` callback to handle incoming HTTP responses. This functionality is essential for logging response data, validating responses, or performing post-response processing.

```javascript
const transport = http('https://1.rpc.thirdweb.com/...', {
  onFetchResponse(response) {
    console.log(response);
  },
});
```

--------------------------------

### Pass Arguments to Contract Read Function with viem

Source: https://viem.sh/docs/contract/readContract

Shows how to call a read-only contract function that requires arguments, like `balanceOf`. Arguments are passed via the `args` array, and viem infers TypeScript types from the ABI to ensure type safety. The example passes an address string.

```typescript
import { publicClient } from './client'
import { wagmiAbi } from './abi'

const data = await publicClient.readContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'balanceOf',
  args: ['0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC']
})
```

--------------------------------

### Drizzle ORM: Aggregations with Having

Source: https://orm.drizzle.team/docs/select

Shows how to filter aggregated results using the .having() clause in Drizzle ORM. This example selects age groups where the user count is greater than 1.

```typescript
await db.select({
  age: users.age,
  count: sql`cast(count(${users.id}) as int)`,
})
.from(users)
.groupBy(users.age)
.having(({ count }) => gt(count, 1));
```

--------------------------------

### Configure Multiple Chains Contract Indexing in Ponder

Source: https://ponder.sh/docs/config/contracts

Enables indexing for a contract deployed on multiple chains, allowing chain-specific address and start block overrides. Ensures all specified contracts share the same ABI.

```typescript
import { createConfig } from "ponder";
import { UniswapV3FactoryAbi } from "./abis/UniswapV3Factory";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1,
    },
    base: {
      id: 8453,
      rpc: process.env.PONDER_RPC_URL_8453,
    },
  },
  contracts: {
    UniswapV3Factory: {
      abi: UniswapV3FactoryAbi,
      chain: {
        mainnet: {
          address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
          startBlock: 12369621,
        },
        base: {
          address: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
          startBlock: 1371680,
        },
      },
    },
  },
});
```

--------------------------------

### Complex Filtering with Nested Relations (Drizzle ORM)

Source: https://orm.drizzle.team/docs/rqb

Shows an example of applying filters to both the main query and a nested relation. This query finds posts with id=1 and comments created before a specific date.

```typescript
await db.query.posts.findMany({
  where: (posts, { eq }) => (eq(posts.id, 1)),
  with: {
    comments: {
      where: (comments, { lt }) => lt(comments.createdAt, new Date()),
    },
  },
});
```

--------------------------------

### Get Account Balance at Specific Block Tag (TypeScript)

Source: https://viem.sh/docs/actions/public/getBalance

This snippet illustrates fetching an Ethereum address's balance at a particular block tag (e.g., 'latest', 'safe'). The `publicClient.getBalance` function is used with the address and a `blockTag` parameter.

```typescript
const balance = await publicClient.getBalance({
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  blockTag: 'safe'
})
```

--------------------------------

### GraphQL Query for Nested Relationships

Source: https://ponder.sh/docs/0.10/schema/relations

An example GraphQL query demonstrating how to fetch a 'person' and their associated 'dogs' (a one-to-many relationship). Ponder automatically generates these GraphQL endpoints based on the defined schema relationships.

```graphql
query {
  person(id: "Bob") {
    id
    dogs {
      id
    }
  }
}
```

--------------------------------

### Configure Ponder Accounts

Source: https://ponder.sh/docs/0.10/api-reference/ponder/config

Sets up account configurations for Ponder to index transactions or native transfers. This includes specifying the network, address, and the block range to start syncing events from. Supports indexing multiple addresses or factory contracts.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  accounts: {
    coinbasePrime: {
      network: "mainnet",
      address: "0xCD531Ae9EFCCE479654c4926dec5F6209531Ca7b",
      startBlock: 12111233,
    },
  },
  // ...
});
```

--------------------------------

### Get Transaction Count (TypeScript)

Source: https://viem.sh/docs/actions/public/getTransactionCount

This snippet demonstrates how to use the `getTransactionCount` function from the viem library to retrieve the number of transactions sent by a specific Ethereum address. It utilizes a pre-configured public client.

```typescript
import { publicClient } from './client'

const transactionCount = await publicClient.getTransactionCount({
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})

// Expected output: > 420
```

--------------------------------

### Create and Query PostgreSQL View

Source: https://www.postgresql.org/docs/current/tutorial-views.html

Demonstrates how to create a view named 'myview' that combines data from 'weather' and 'cities' tables, and then how to query this view as if it were a regular table. Views are useful for encapsulating complex queries and simplifying data access.

```sql
CREATE VIEW myview AS
SELECT name, temp_lo, temp_hi, prcp, date, location
FROM weather, cities
WHERE city = name;

SELECT * FROM myview;
```

--------------------------------

### Sinatra Application Logging Context

Source: https://brandur.org/logfmt

This Ruby code defines a Sinatra application with before, after, and error filters to add contextual information to log messages. It demonstrates how to authenticate users, find applications, and log request start, finish, and error events with relevant details like user ID, application name, and error messages.

```ruby
def authenticate!
  @user = User.authenticate!(env["HTTP_AUTHORIZATION"]) || throw(401)
  log_context.merge! user: @user.email, user_id: @user.id
end

def find_app!
  @app = App.find!(params[:id])
  log_context.merge! app: @app.name, app_id: @app.id
end

before do
  log "Starting request", tag: "request_start"
end

get "/:id" do
  authenticate!
  find_app!
end

after do
  log "Finished request", tag: "request_finish", status: response.status
end

error do
  e = env["sinatra.error"]
  log "Request errored", tag: "request_error", error_class: e.class.name, error_message: e.message
end
```

--------------------------------

### PostgreSQL: Create Table with Named Table Constraint

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

This example shows how to create a 'products' table and assign a specific name ('valid_discount') to a table-level CHECK constraint. This constraint ensures that the regular 'price' is greater than the 'discounted_price'.

```sql
CREATE TABLE products (
  product_no integer,
  name text,
  price numeric,
  CHECK (price > 0),
  discounted_price numeric,
  CHECK (discounted_price > 0),
  CONSTRAINT valid_discount CHECK (price > discounted_price)
);
```

--------------------------------

### Query Database with @ponder/client and Drizzle

Source: https://ponder.sh/docs/0.10/api-reference/ponder-client

Demonstrates how to build and execute SQL queries using the Drizzle ORM via the @ponder/client. It shows basic selection and filtering using Drizzle's query builder and utility functions like 'eq'.

```typescript
import { client, schema } from "../lib/ponder";
import { eq } from "@ponder/client";

const result = await client.db.select().from(schema.account).limit(10);
const filteredResults = await client.db
  .select()
  .from(schema.account)
  .where(eq(schema.account.id, "0x123..."));
```

--------------------------------

### Plugins

Source: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery

Information about available plugins that extend TanStack Query functionality.

```APIDOC
## TanStack Query Plugins

Plugins extend the functionality of TanStack Query, offering features like persistence, broadcasting, and custom storage.

### `persistQueryClient`

**Description**: A plugin that persists your query cache to storage, allowing it to survive page reloads and keep data fresh.

### `createSyncStoragePersister`

**Description**: Creates a persister function that uses synchronous storage APIs (like `localStorage`).

### `createAsyncStoragePersister`

**Description**: Creates a persister function that uses asynchronous storage APIs (like `AsyncStorage` on React Native).

### `broadcastQueryClient` (Experimental)

**Description**: An experimental plugin for broadcasting query cache updates between different tabs or windows of your application.

### `createPersister` (Experimental)

**Description**: An experimental utility for creating custom persister functions.
```

--------------------------------

### Define PRIMARY KEY Constraints with Drizzle ORM (SQLite)

Source: https://orm.drizzle.team/docs/indexes-constraints

This snippet shows how to define PRIMARY KEY constraints in Drizzle ORM for SQLite. It includes examples for integer primary keys, including one that auto-increments.

```typescript
import { integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: integer("id").primaryKey(),
})

export const pet = sqliteTable("pet", {
  id: integer("id").primaryKey(),
})
```

--------------------------------

### Foreign Key ON DELETE Actions

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

Details foreign key constraints with specific ON DELETE actions to manage referential integrity when referenced rows are deleted. Includes RESTRICT, CASCADE, and SET NULL examples.

```sql
CREATE TABLE products (
  product_no integer PRIMARY KEY,
  name text,
  price numeric
);
CREATE TABLE orders (
  order_id integer PRIMARY KEY,
  shipping_address text
);
CREATE TABLE order_items (
  product_no integer REFERENCES products ON DELETE RESTRICT,
  order_id integer REFERENCES orders ON DELETE CASCADE,
  quantity integer,
  PRIMARY KEY (product_no, order_id)
);
```

```sql
-- Example with SET NULL (assuming parent_id can be NULL)
CREATE TABLE employees (
  employee_id integer PRIMARY KEY,
  manager_id integer REFERENCES employees ON DELETE SET NULL,
  name text
);
```

--------------------------------

### Multicall Optimization for eth_call

Source: https://viem.sh/docs/clients/public

Explains how to enable and configure `eth_call` aggregation using multicall for improved performance with the Public Client.

```APIDOC
## eth_call Aggregation (via Multicall)

The Public Client supports the aggregation of `eth_call` requests into a single multicall (`aggregate3`) request. This can dramatically improve network performance. The Public Client schedules the aggregation of `eth_call` requests over a given time period. By default, it executes the batch request at the end of the current JavaScript message queue (a zero delay), however, consumers can specify a custom `wait` period (in ms).

You can enable `eth_call` aggregation by setting the `batch.multicall` flag to `true`:

```typescript
const publicClient = createPublicClient({
  batch: {
    multicall: true,
  },
  chain: mainnet,
  transport: http(),
})
```

### Parameters

#### batch (optional)
Flags for batch settings.

##### batch.multicall (optional)
*   **Type:** `boolean | MulticallBatchOptions`
*   **Default:** `false`
    Toggle to enable `eth_call` multicall aggregation.
    ```typescript
    const publicClient = createPublicClient({
      batch: {
        multicall: true,
      },
      chain: mainnet,
      transport: http(),
    })
    ```

### Request Example (using readContract)

When `batch.multicall` is enabled, `readContract` actions will be batched.

```typescript
import { getContract } from 'viem'
import { abi } from './abi'
import { publicClient } from './client'

const contract = getContract({
  address,
  abi,
  client: publicClient
})

// The below will send a single request to the RPC Provider.
const [name, totalSupply, symbol, balance] = await Promise.all([
  contract.read.name(),
  contract.read.totalSupply(),
  contract.read.symbol(),
  contract.read.balanceOf([address]),
])
```
```

--------------------------------

### TanStack Query - Array Keys with Variables Example

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

Illustrates how to use array keys with variables when a query requires more information to uniquely identify its data. This is useful for hierarchical resources, where an ID or index can be passed, or for queries with additional parameters passed as an object.

```typescript
// An individual todo
useQuery({
  queryKey: ['todos', todoId],
  ...
})

// Something else, whatever!
useQuery({
  queryKey: ['something', 'special', { page: 1 }],
  ...
})
```

--------------------------------

### createClient

Source: https://ponder.sh/docs/api-reference/ponder-client

Creates a client object connected to a Ponder server, enabling database queries.

```APIDOC
## `createClient`

### Description
Create a client object connected to a Ponder server.

### Method
`createClient`

### Parameters
#### Options
- **baseUrl** (`string`) - Required - Ponder server URL where the `client` middleware is running
- **options.schema** (`Schema | undefined`) - Optional - The schema exported by `ponder.schema.ts`

### Request Example
```javascript
import { createClient } from "@ponder/client";
import * as schema from "../../ponder/ponder.schema";

const client = createClient("https://.../sql", { schema });

export { client, schema };
```

### Response
Returns a `Client` object with methods for querying the database.
```

--------------------------------

### Configure Blitmap Contract for Indexing (TypeScript)

Source: https://ponder.sh/docs/config/contracts

This configuration sets up the Ponder indexing engine to monitor the Blitmap NFT contract on the mainnet. It specifies the contract's ABI, chain, address, and the starting block for indexing. This enables the engine to fetch event logs emitted by the contract.

```typescript
import { createConfig } from "ponder";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1
    },
  },
  contracts: {
    Blitmap: {
      abi: BlitmapAbi,
      chain: "mainnet",
      address: "0x8d04a8c79cEB0889Bdd12acdF3Fa9D207eD3Ff63",
      startBlock: 12439123,
    },
  },
});
```

--------------------------------

### PostgreSQL NOT NULL Constraint Syntax Examples

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

Demonstrates various ways to define a NOT NULL constraint for columns in PostgreSQL tables. It covers column constraints, explicit constraint naming, and table constraints (though the latter is noted as non-standard).

```sql
CREATE TABLE products (
 product_no integer **NOT NULL**,
 name text **NOT NULL**,
 price numeric
);
```

```sql
CREATE TABLE products (
 product_no integer NOT NULL,
 name text **CONSTRAINT products_name_not_null** NOT NULL,
 price numeric
);
```

```sql
CREATE TABLE products (
 product_no integer,
 name text,
 price numeric,
 **NOT NULL product_no**,
 **NOT NULL name**
);
```

```sql
CREATE TABLE products (
 product_no integer NULL,
 name text NULL,
 price numeric NULL
);
```

--------------------------------

### Get Transaction by Hash - viem TypeScript

Source: https://viem.sh/docs/actions/public/getTransaction

Fetches transaction details using the transaction's hash. Requires a `publicClient` instance and the transaction hash as input. Returns a `Transaction` object containing transaction information.

```typescript
import { publicClient } from './client'

const transaction = await publicClient.getTransaction({
  hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d'
})

// Example of returned transaction object:
// {
//   blockHash: '0xaf1dadb8a98f1282e8f7b42cc3da8847bfa2cf4e227b8220403ae642e1173088',
//   blockNumber: 15132008n,
//   from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
//   // ... other transaction properties
// }
```

--------------------------------

### Solidity abi.encodePacked() Example

Source: https://docs.soliditylang.org/en/v0.8.17/abi-spec.html

Demonstrates the non-standard packed encoding behavior of abi.encodePacked() in Solidity. It shows how different data types are concatenated directly without padding, and how dynamic types and arrays are handled. Structs and nested arrays are not supported. Padding can be explicitely applied using type conversions.

```solidity
uint16(-1), bytes1(0x42), uint16(0x03), string("Hello, world!")
// Results in: 0xffff42000348656c6c6f2c20776f726c6421

// Explicit padding example:
abi.encodePacked(uint16(0x12)) == hex"0012"
```

--------------------------------

### `createClient` Function

Source: https://ponder.sh/docs/0.10/api-reference/ponder-client

Creates a client object connected to a Ponder server, enabling database querying.

```APIDOC
## `createClient`

### Description

Create a client object connected to a Ponder server.

### Method

N/A (Function Call)

### Endpoint

N/A

### Parameters

#### Request Body

- **baseUrl** (string) - Required - Ponder server URL where the `client` middleware is running
- **options.schema** (Schema) - Required - The schema exported by `ponder.schema.ts`

#### Response

#### Success Response (200)

- **Client object** - Returns a `Client` object with methods for querying the database.

### Request Example

```typescript
import { createClient } from "@ponder/client";
import * as schema from "../../ponder/ponder.schema";

const client = createClient("https://.../sql", { schema });

export { client, schema };
```
```

--------------------------------

### Automate Address Management with Foundry Broadcast Files

Source: https://ponder.sh/docs/0.10/guides/foundry

This snippet demonstrates how to import Foundry broadcast files into Ponder's configuration to automate contract address management and specify the deployment block number. It extracts the contract address and start block from the latest broadcast run for the 'Counter.sol' contract.

```typescript
import { createConfig } from "ponder";
import { http, getAddress, hexToNumber } from "viem";
import { counterABI } from "../abis/CounterAbi";
import CounterDeploy from "../foundry/broadcast/Deploy.s.sol/31337/run-latest.json";

const address = getAddress(CounterDeploy.transactions[0]!.contractAddress);
const startBlock = hexToNumber(CounterDeploy.receipts[0]!.blockNumber);

export default createConfig({
  networks: {
    anvil: {
      chainId: 31337,
      transport: http("http://127.0.0.1:8545"),
      disableCache: true,
    },
  },
  contracts: {
    Counter: {
      network: "anvil"

```

--------------------------------

### HTTP GET /status

Source: https://ponder.sh/docs/0.10/advanced/observability

This endpoint provides the current indexing status for each network configured in your Ponder application. It returns a JSON object indicating whether historical indexing is complete and the latest indexed block details.

```APIDOC
## GET /status

### Description
Retrieves the indexing status for each network, indicating completion and the latest indexed block.

### Method
GET

### Endpoint
`/status`

### Parameters
None

### Request Example
```
curl http://localhost:42069/status
```

### Response
#### Success Response (200)
- **network_name** (object) - An object containing the status for a specific network.
  - **ready** (boolean) - `true` if historical indexing is complete, `false` otherwise.
  - **block** (object | null) - The most recently indexed block, or `null` if historical indexing is not complete.
    - **number** (number) - The block number.
    - **timestamp** (number) - The block timestamp.

#### Response Example
```json
{
  "mainnet": {
    "ready": true,
    "block": {
      "number": 20293450,
      "timestamp": 1720823759
    }
  },
  "base": {
    "ready": true,
    "block": {
      "number": 17017206,
      "timestamp": 1720823759
    }
  }
}
```
```

--------------------------------

### Create Ponder Client with TypeScript

Source: https://ponder.sh/docs/0.10/api-reference/ponder-client

Creates a typed SQL client instance connected to a Ponder server. It requires the server's base URL and the project's schema defined in ponder.schema.ts.

```typescript
import { createClient } from "@ponder/client";
import * as schema from "../../ponder/ponder.schema";

const client = createClient("https://.../sql", { schema });

export { client, schema };
```

--------------------------------

### TypeScript Namespace and Enum Merging Example

Source: https://www.typescriptlang.org/docs/handbook/declaration-merging.html

Demonstrates merging a namespace with an enum in TypeScript. It shows how to define an enum and then extend its namespace with utility functions. This allows for organizing related functionality within the enum's scope.

```typescript
enum Color {
  red = 1,
  green = 2,
  blue = 4,
}

namespace Color {
  export function mixColor(colorName: string) {
    if (colorName == "yellow") {
      return Color.red + Color.green;
    } else if (colorName == "white") {
      return Color.red + Color.green + Color.blue;
    } else if (colorName == "magenta") {
      return Color.red + Color.blue;
    } else if (colorName == "cyan") {
      return Color.green + Color.blue;
    }
  }
}
```

--------------------------------

### Simulate Contract Mint with dataSuffix | JavaScript

Source: https://viem.sh/docs/contract/simulateContract

Simulates a 'mint' function call on a contract, including custom data to append to the calldata. This is useful for adding domain tags.

```javascript
const { result } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  args: [69420],
  dataSuffix: '0xdeadbeef'
})
```

--------------------------------

### Configure Ponder with Network and Contract | TypeScript

Source: https://ponder.sh/docs/0.10/indexing/read-contracts

This snippet demonstrates how to configure Ponder by defining networks, including RPC transport URLs, and specifying contract details like ABI, address, and starting block. It is essential for Ponder to know where to connect and which contracts to monitor.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1),
    },
  },
  contracts: {
    Blitmap: {
      network: "mainnet",
      abi: BlitmapAbi,
      address: "0x8d04...D3Ff63",
      startBlock: 12439123,
    },
  },
});
```

--------------------------------

### GraphQL API Response for Nested Relationships

Source: https://ponder.sh/docs/0.10/schema/relations

The JSON response from the example GraphQL query, showing the 'person' with their nested 'dogs' array. This illustrates how Ponder exposes the defined schema relationships through its generated GraphQL API.

```json
{
  "person": {
    "id": "Bob",
    "dogs": [
      {
        "id": "Chip"
      },
      {
        "id": "Spike"
      }
    ]
  }
}
```

--------------------------------

### Get ENS Resolver with Custom Universal Resolver - TypeScript

Source: https://viem.sh/docs/ens/actions/getEnsResolver

Illustrates using a custom address for the ENS Universal Resolver Contract when calling `getEnsResolver` in viem. This is useful for interacting with non-standard or upgraded resolver contracts.

```typescript
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const ensName = await publicClient.getEnsResolver({
  name: normalize('wevm.eth'),
  universalResolverAddress: '0x74E20Bd2A1fE0cdbe45b9A1d89cb7e0a45b36376',
})
```

--------------------------------

### Configure Network Overrides for Contract (TypeScript)

Source: https://ponder.sh/docs/0.10/config/contracts

This configuration demonstrates network-specific overrides for a contract ('UniswapV3Factory'). Default settings are applied unless overridden for a specific network. This example shows overriding the 'address' for 'base' and setting 'startBlock' for 'mainnet' and 'optimism'.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";
import { UniswapV3FactoryAbi } from "./abis/EntryPoint";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1)
    },
    optimism: {
      chainId: 10,
      transport: http(process.env.PONDER_RPC_URL_10)
    },
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453)
    },
  },
  contracts: {
    UniswapV3Factory: {
      abi: UniswapV3FactoryAbi,
      address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      network: {
        mainnet: {
          startBlock: 12369621
        },
        optimism: {
          startBlock: 0
        },
        base: {
          address: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
          startBlock: 1371680,
        },
      },
    },
  },
});
```

--------------------------------

### Project Development Directory Structure

Source: https://github.com/marktoda/v4-ponder

Illustrates the directory structure of the v4-ponder project. Key directories include 'abis' for smart contract ABIs, 'src' for indexer and API code, and configuration files.

```tree
├── abis/
│ ├── ERC20Abi.ts # ERC20 token ABI
│ └── PoolManager.ts # Uniswap v4 PoolManager ABI
├── src/
│ ├── index.ts # Event handlers
│ └── api/
│ └── index.ts # GraphQL API configuration
├── ponder.config.ts # Network and contract configurations
├── ponder.schema.ts # Database schema definition
└── .env # Environment variables
```

--------------------------------

### PostgreSQL: Create Table with Basic Check Constraint

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

This example demonstrates how to create a 'products' table with a CHECK constraint to ensure that the 'price' cfter the column's data type.

```sql
CREATE TABLE products (
  product_no integer,
  name text,
  price numeric
  CHECK (price > 0)
);
```

--------------------------------

### Nested Partial Field Selection (Drizzle ORM)

Source: https://orm.drizzle.team/docs/rqb

Shows how to apply partial field selection to nested relations, allowing you to include or exclude columns for related entities. This example excludes 'authorId' from comments.

```typescript
const posts = await db.query.posts.findMany({
  columns: {
    id: true,
    content: true,
  },
  with: {
    comments: {
      columns: {
        authorId: false,
      },
    },
  },
});
```

--------------------------------

### Get Fee History in TypeScript with viem

Source: https://viem.sh/docs/actions/public/getFeeHistory

This snippet demonstrates how to use the `getFeeHistory` function from the viem library to retrieve historical gas price information. It requires an initialized `publicClient` and specifies the number of blocks and reward percentiles to fetch. The function returns a `FeeHistory` object.

```typescript
import { publicClient } from './client'

const feeHistory = await publicClient.getFeeHistory({
  blockCount: 4,
  rewardPercentiles: [25, 75]
})
```

```typescript
const feeHistory = await publicClient.getFeeHistory({
  blockCount: 4,
  blockNumber: 1551231n,
  rewardPercentiles: [25, 75]
})
```

```typescript
const feeHistory = await publicClient.getFeeHistory({
  blockCount: 4,
  blockTag: 'safe',
  rewardPercentiles: [25, 75]
})
```

--------------------------------

### Query Ponder GraphQL API (GraphQL)

Source: https://github.com/ponder-sh/ponder

This GraphQL query demonstrates how to retrieve data from the Ponder-generated GraphQL API. It fetches a list of 'ensNames', limiting the results to two items and requesting specific fields (`name`, `owner`, `registeredAt`) for each item. This showcases how data inserted via indexing functions can be queried.

```graphql
{
  ensNames(limit: 2) {
    items {
      name
      owner
      registeredAt
    }
  }
}
```

--------------------------------

### Fetch Transaction Receipts Ad-hoc in Ponder

Source: https://ponder.sh/docs/guides/receipts

This example shows how to dynamically fetch a transaction receipt using `context.client.getTransactionReceipt` within an indexing function. This method is useful for specific cases or when the `logs` array is required, as it is not automatically included with `includeTransactionReceipts`.

```typescript
import { ponder } from "ponder:registry";

ponder.on("Blitmap:Mint", async ({ event }) => {
  const receipt = await context.client.getTransactionReceipt({
    hash: event.transaction.hash,
  });
  console.log(receipt);
  // ...
});
```

--------------------------------

### Viem Transport: rateLimit for RPC Limiting (TypeScript)

Source: https://ponder.sh/docs/0.10/api-reference/ponder-utils

Illustrates using the `rateLimit` transport from `@ponder/utils` with Viem's `createPublicClient`. This example sets up a client that limits requests to a specific Alchemy RPC endpoint to a maximum of 25 requests per second. It takes the inner transport and rate limiting options as arguments.

```typescript
import { rateLimit } from "@ponder/utils";
import { createPublicClient, fallback, http } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: rateLimit(http("https://eth-mainnet.g.alchemy.com/v2/..."), {
    requestsPerSecond: 25,
  }),
});
```

--------------------------------

### Pagination Arguments

Source: https://relay.dev/graphql/connections.htm

Explains the arguments used for forward and backward pagination, including 'first', 'after', 'last', and 'before'.

```APIDOC
## Pagination Arguments

A field that returns a _Connection Type_ must include forward pagination arguments, backward pagination arguments, or both. These pagination arguments allow the client to slice the set of edges before it is returned.

### Forward Pagination Arguments

To enable forward pagination, two arguments are required:

*   `first` (Int) - Non-negative integer. Specifies the maximum number of edges to return.
*   `after` (String) - Opaque cursor string. Specifies the cursor of the last edge from the previous page. The server returns edges after this cursor.

### Backward Pagination Arguments

To enable backward pagination, two arguments are required:

*   `last` (Int) - Non-negative integer. Specifies the maximum number of edges to return.
*   `before` (String) - Opaque cursor string. Specifies the cursor of the first edge from the next page. The server returns edges before this cursor.

### Edge Order

The ordering of edges must be consistent across pagination methods. The ordering should be the same when using `first`/`after` as when using `last`/`before`, assuming all other arguments are equal.

*   When `before: cursor` is used, the edge closest to `cursor` must come **last** in the result `edges`.
*   When `after: cursor` is used, the edge closest to `cursor` must come **first** in the result `edges`.
```

--------------------------------

### Specify Custom Multicall Contract Address

Source: https://viem.sh/docs/contract/multicall

This example demonstrates how to configure a custom `multicallAddress` for the `publicClient.multicall` function. This is useful if you are using a different deployment of the Multicall contract or a contract with similar functionality. The default address used is `client.chain.contracts.multicall3.address`.

```javascript
const results = await publicClient.multicall({
  contracts: [
    {
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi: wagmiAbi,
      functionName: 'totalSupply',
    },
    // ... other contracts
  ],
  multicallAddress: '0xca11bde05977b3631167028862be2a173976ca11'
})
```

--------------------------------

### Configure Block Intervals with Ponder

Source: https://ponder.sh/docs/api-reference/ponder/config

Defines how to set up block intervals for indexing events in Ponder. You can specify the chain, start and end blocks, and the interval between indexed blocks. This configuration is crucial for managing the scope and frequency of data synchronization.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  blocks: {
    ChainlinkPriceOracle: {
      chain: "mainnet",
      startBlock: 19_750_000,
      interval: 5, // every minute
    },
  },
  // ...
});
```

--------------------------------

### Check Indexing Status via HTTP

Source: https://ponder.sh/docs/0.10/advanced/observability

This snippet shows how to query the indexing status of your Ponder application using an HTTP GET request to the /status endpoint. The response indicates whether each network is ready and provides the latest indexed block number and timestamp.

```bash
curl http://localhost:42069/status
```

--------------------------------

### Get ENS Resolver with Block Number - TypeScript

Source: https://viem.sh/docs/ens/actions/getEnsResolver

Demonstrates how to fetch the ENS resolver address at a specific block number using viem. The `blockNumber` parameter ensures the ENS record is queried at a historical state.

```typescript
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const ensName = await publicClient.getEnsResolver({
  name: normalize('wevm.eth'),
  blockNumber: 15121123n,
})
```

--------------------------------

### Render GraphiQL in a React Application

Source: https://github.com/graphql/graphiql/tree/main/packages/graphiql

Demonstrates how to render the GraphiQL component in a React application. It utilizes 'createGraphiQLFetcher' from '@graphiql/toolkit' to handle GraphQL requests and 'createRoot' from 'react-dom/client' for rendering.

```javascript
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import { createRoot } from 'react-dom/client';
import 'graphiql/style.css';

const fetcher = createGraphiQLFetcher({
  url: 'https://my.backend/graphql'
});

const root = createRoot(document.getElementById('root'));
root.render(<GraphiQL fetcher={fetcher} />);
```

--------------------------------

### GraphQL Query for Swaps in a Specific Pool

Source: https://github.com/marktoda/v4-ponder

Example GraphQL query to retrieve swap details for a particular pool identified by its ID and chain ID. It includes information such as sender, amounts swapped, price, liquidity, and the symbols of the pool's tokens.

```graphql
query {
  swaps(where: {poolId: "0x....", chainId: 1}) {
    id
    sender
    amount0
    amount1
    sqrtPriceX96
    liquidity
    tick
    pool {
      token0 {
        symbol
      }
      token1 {
        symbol
      }
    }
  }
}
```

--------------------------------

### Get ENS Resolver with Block Tag - TypeScript

Source: https://viem.sh/docs/ens/actions/getEnsResolver

Shows how to specify a block tag (e.g., 'safe') when retrieving the ENS resolver address with viem. This allows querying ENS records based on predefined block states.

```typescript
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const ensName = await publicClient.getEnsResolver({
  name: normalize('wevm.eth'),
  blockTag: 'safe',
})
```

--------------------------------

### Generating Database Migrations with Drizzle ORM (SQL)

Source: https://orm.drizzle.team/docs/overview

Provides an example of SQL statements generated for database migrations using Drizzle ORM. It includes CREATE TABLE statements for 'countries' and 'cities', along with an ALTER TABLE statement to establish a foreign key constraint.

```sql
-- generate migrations
CREATE TABLE IF NOT EXISTS "countries" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(256)
);
CREATE TABLE IF NOT EXISTS "cities" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(256),
  "country_id" integer
);
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE no action ON UPDATE no action;
```

--------------------------------

### Solidity Modifier with Arguments Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Illustrates a modifier named 'costs' that accepts an argument 'price'. It checks if the Ether sent with the transaction meets the required price before executing the function body indicated by '_'.

```solidity
contract priced {
    modifier costs(uint price) {
        if (msg.value >= price) {
            _;
        }
    }
}
```

--------------------------------

### Drizzle Configuration for Schema Path (TypeScript)

Source: https://orm.drizzle.team/docs/sql-schema-declaration

This configuration example shows how to specify the path to your schema file in `drizzle.config.ts`. Drizzle-Kit uses this path to read the schema definitions for generating database migrations. Ensure this path correctly points to your schema file (e.g., `schema.ts`).

```typescript
// Example drizzle.config.ts
// import type { Config } from 'drizzle-kit';

// export default {
//   schema: './src/db/schema.ts',
//   // ... other config options
// } satisfies Config;
```

--------------------------------

### Server-Side Rendering (SSR) with TanStack Query in React

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-functions

Provides an example of integrating TanStack Query with Server-Side Rendering (SSR) in a React application, likely using a framework like Next.js. It demonstrates how to prefetch data on the server and hydrate it on the client to ensure a seamless user experience.

```jsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({ queryKey: ['todos'], queryFn: fetchTodos });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};

function MyPage({ dehydratedState }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <Todos />
    </HydrationBoundary>
  );
}

function Todos() {
  const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
  // ... render todos
}

async function fetchTodos() {
  // Fetch data on the server
  const res = await fetch('...');
  return res.json();
}
```

--------------------------------

### Define PRIMARY KEY Constraints with Drizzle ORM (PostgreSQL)

Source: https://orm.drizzle.team/docs/indexes-constraints

This snippet shows how to define PRIMARY KEY constraints in Drizzle ORM for PostgreSQL. It includes examples for auto-incrementing serial IDs and text-based CUIDs as primary keys.

```typescript
import { serial, text, pgTable } from "drizzle-orm/pg-core";

const user = pgTable('user', {
  id: serial('id').primaryKey(),
});

const table = pgTable('table', {
  id: text('cuid').primaryKey(),
});
```

--------------------------------

### Create Public Client with WebSocket Transport in Viem

Source: https://viem.sh/docs/clients/transports/websocket

Shows how to create a public client using the `webSocket` transport. It requires importing `createPublicClient` and `webSocket` from 'viem', and a chain like `mainnet` from 'viem/chains'. The `webSocket` transport is configured with a WebSocket URL.

```typescript
import { createPublicClient, webSocket } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: webSocket('wss://1.rpc.thirdweb.com/...'),
})
```

--------------------------------

### Configure Contracts with Multiple Chains in Ponder

Source: https://ponder.sh/docs/indexing/read-contracts

Define contracts with addresses and start blocks for multiple chains within `ponder.config.ts`. Ponder automatically selects the correct contract address based on the chain of the current event.

```typescript
import { createConfig } from "ponder";
import { UniswapV3FactoryAbi } from "./abis/UniswapV3Factory";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1
    },
    base: {
      id: 8453,
      rpc: process.env.PONDER_RPC_URL_8453
    },
  },
  contracts: {
    UniswapV3Factory: {
      abi: UniswapV3FactoryAbi,
      chain: {
        mainnet: {
          address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
          startBlock: 12369621,
        },
        base: {
          address: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
          startBlock: 1371680,
        },
      },
    },
  },
});
```

--------------------------------

### Create Database Views for Latest Deployment (CLI)

Source: https://ponder.sh/docs/production/self-hosting

Demonstrates using the 'ponder db create-views' CLI command to create or update database views. This command points views in a target schema to a specific deployment's tables, ensuring queries target the latest data without manual updates after each deployment.

```bash
pnpm db create-views --schema=deployment-123 --views-schema=project-name
```

--------------------------------

### Set Editor Theme Prop for GraphiQL

Source: https://github.com/graphql/graphiql/tree/main/packages/graphiql

Illustrates passing the 'editorTheme' prop to the GraphiQL component to specify the desired editor theme. The CSS for the theme must be loaded separately for this to take effect.

```javascript
<GraphiQL editorTheme="solarized light" />
```

--------------------------------

### Defining Database Schema with Drizzle ORM (JavaScript/TypeScript)

Source: https://orm.drizzle.team/docs/overview

Illustrates how to define database schemas using Drizzle ORM. It includes examples for creating 'countries' and 'cities' tables with primary keys, string fields, and foreign key constraints, showcasing Drizzle's schema management capabilities.

```javascript
export const countries = pgTable('countries', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }),
});

export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }),
  countryId: integer('country_id').references(() => countries.id),
});
```

--------------------------------

### Define PostgreSQL Integer Column

Source: https://orm.drizzle.team/docs/column-types/pg

Defines a standard 4-byte signed integer column in a PostgreSQL table using Drizzle ORM. This example shows the basic declaration of an 'int' column.

```typescript
import { integer, pgTable } from "drizzle-orm/pg-core";

export const table = pgTable('table', {
  int: integer()
});
```

--------------------------------

### Execute Batched Actions with HTTP Transport - viem

Source: https://viem.sh/docs/clients/transports/http

Demonstrates how to execute multiple viem actions concurrently using `Promise.all` when the `http` transport is configured with batching enabled. The transport automatically consolidates these into a single Batch JSON-RPC HTTP request.

```typescript
// The below will send a single Batch JSON-RPC HTTP request to the RPC Provider.
const [blockNumber, balance, ensName] = await Promise.all([
  client.getBlockNumber(),
  client.getBalance({ address: '0xd2135CfB216b74109775236E36d4b433F1DF507B' }),
  client.getEnsName({ address: '0xd2135CfB216b74109775236E36d4b433F1DF507B' }),
])
```

--------------------------------

### Ponder `dev` Command for Development

Source: https://ponder.sh/docs/0.10/api-reference/ponder/cli

Starts the Ponder application in development mode. This command enables hot reloading, automatically restarting the app when project files change. It also provides an auto-updating terminal UI for monitoring application status. Options include specifying the schema, port, and hostname for the web server, and disabling the UI.

```bash
Usage: ponder dev [options]

Start the development server with hot reloading

Options:
  --schema Database schema
  -p, --port Port for the web server (default: 42069)
  -H, --hostname Hostname for the web server (default: "0.0.0.0" or "::")
  --disable-ui Disable the terminal UI
  -h, --help display help for command
```

--------------------------------

### Solidity Fallback Function Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Demonstrates a basic fallback function in Solidity. This function is executed for all messages sent to the contract if no other function matches. Sending Ether to this contract will cause an exception because the fallback function is not marked as payable.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.6.2 <0.9.0;

contract Test {
  uint x;

  // This function is called for all messages sent to
  // this contract (there is no other function).
  // Sending Ether to this contract will cause an exception,
  // because the fallback function does not have the `payable`
  // modifier.
  fallback() external {
    x = 1;
  }
}
```

--------------------------------

### Get Account and Storage Proofs with viem

Source: https://viem.sh/docs/actions/public/getProof

Demonstrates how to use the `getProof` function from viem's public client to retrieve Merkle-proofs for an Ethereum account's storage keys. This function is essential for verifying data integrity on the blockchain. It requires the account address and an array of storage keys. Optional parameters like `blockNumber` or `blockTag` can specify the block for which the proof is generated.

```typescript
import { publicClient } from './client'

const proof = await publicClient.getProof({
  address: '0x4200000000000000000000000000000000000016',
  storageKeys: [
    '0x4a932049252365b3eedbc5190e18949f2ec11f39d3bef2d259764799a1b27d99',
  ],
})
```

```typescript
const proof = await publicClient.getProof({
  address: '0x4200000000000000000000000000000000000016',
  storageKeys: [
    '0x4a932049252365b3eedbc5190e18949f2ec11f39d3bef2d259764799a1b27d99',
  ],
  blockNumber: 42069n
})
```

```typescript
const proof = await publicClient.getProof({
  address: '0x4200000000000000000000000000000000000016',
  storageKeys: [
    '0x4a932049252365b3eedbc5190e18949f2ec11f39d3bef2d259764799a1b27d99',
  ],
  blockTag: 'latest'
})
```

--------------------------------

### PostgreSQL: Create Table with Named Check Constraint

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

This example shows how to create a 'products' table and explicitly name the CHECK constraint. Assigning a name (e.g., 'positive_price') helps in identifying the constraint in error messages and for future modifications.

```sql
CREATE TABLE products (
  product_no integer,
  name text,
  price numeric
  CONSTRAINT positive_price CHECK (price > 0)
);
```

--------------------------------

### Direct SQL Query with Manual Schema

Source: https://ponder.sh/docs/0.10/query/direct-sql

This example demonstrates how to query Ponder tables directly in PostgreSQL by manually specifying the database schema in the SQL query. It selects all columns from the 'accounts' table within 'my_ponder_project' schema, ordered by creation time and limited to 100 results.

```sql
SELECT * FROM my_ponder_project.accounts -- Database schema specified
ORDER BY created_at ASC
LIMIT 100;
```

--------------------------------

### Simulate Contract with Access List in TypeScript

Source: https://viem.sh/docs/contract/simulateContract

Simulates a contract function call (`mint` in this case) while providing an `accessList`. The `accessList` specifies addresses and their storage keys that the transaction will interact with.

```typescript
const { result } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  args: [69420],
  accessList: [{
    address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    storageKeys: ['0x1'],
  }],
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
})
```

--------------------------------

### Start Building SQL from Empty with sql.empty()

Source: https://orm.drizzle.team/docs/sql

The `sql.empty()` function initializes an empty SQL object, allowing you to dynamically append SQL chunks as needed. This is useful for constructing complex queries incrementally based on variable conditions and logic, leveraging all SQL template features.

```typescript
const finalSql = sql.empty();
// some logic
finalSql.append(sql`select * from users`);
// some logic
finalSql.append(sql` where `);
// some logic
for (let i = 0; i < 5; i++) {
  finalSql.append(sql`id = ${i}`);
  if (i === 4) continue;
  finalSql.append(sql` or `);
}
```

--------------------------------

### Scan SQL Query into Tokens (C)

Source: https://github.com/pganalyze/libpg_query

Illustrates how to use the PostgreSQL scanner/lexer via libpg_query to break down a SQL query string into its constituent tokens. This is useful for tasks like syntax highlighting, and the example shows how to unpack and print token details including type and keyword kind.

```c
#include <stdio.h>
#include <stdlib.h>
#include "libpg_query.h"
#include "protobuf/pg_query.pb-c.h"

int main() {
    PgQueryScanResult result;
    PgQuery__ScanResult *scan_result;
    PgQuery__ScanToken *scan_token;
    const ProtobufCEnumValue *token_kind;
    const ProtobufCEnumValue *keyword_kind;
    const char *input = "SELECT update AS left /* comment */ FROM between";
    result = pg_query_scan(input);
    scan_result = pg_query__scan_result__unpack(NULL, result.pbuf.len, (void *) result.pbuf.data);
    printf(" version: %d, tokens: %ld, size: %d\n", scan_result->version, scan_result->n_tokens, result.pbuf.len);
    for (size_t j = 0; j < scan_result->n_tokens; j++) {
        scan_token = scan_result->tokens[j];
        token_kind = protobuf_c_enum_descriptor_get_value(&pg_query__token__descriptor, scan_token->token);
        keyword_kind = protobuf_c_enum_descriptor_get_value(&pg_query__keyword_kind__descriptor, scan_token->keyword_kind);
        printf(" \"%.*s\" = [ %d, %d, %s, %s ]\n", scan_token->end - scan_token->start, &(input[scan_token->start]), scan_token->start, scan_token->end, token_kind->name, keyword_kind->name);
    }
    pg_query__scan_result__free_unpacked(scan_result, NULL);
    pg_query_free_scan_result(result);
    return 0;
}
```

--------------------------------

### Drizzle ORM Type Checking using `is()` function

Source: https://orm.drizzle.team/docs/goodies

Provides an example of using the `is()` function in Drizzle ORM as an alternative to `instanceof` for checking if an object is of a specific Drizzle type, like `Column`. This helps in type narrowing.

```typescript
import { Column, is } from 'drizzle-orm';
if (is(value, Column)) {
  // value's type is narrowed to Column
}
```

--------------------------------

### Deployless Contract Call via Deploy Factory with viem

Source: https://viem.sh/docs/contract/readContract

Demonstrates a 'deployless' call using a deploy factory. This method 'temporarily deploys' a contract using a provided factory and then calls the function. It's useful for contract interactions where the contract isn't deployed but a factory exists to deploy it.

```typescript
import { encodeFunctionData, parseAbi } from 'viem'
import { account, publicClient } from './config'

const data = await publicClient.readContract({
  // Address of the Smart Account deploye
```

--------------------------------

### Get Function Selector in Solidity

Source: https://docs.soliditylang.org/en/latest/contracts.html

Demonstrates how to obtain the first four bytes of the Keccak256 hash of a function's signature, which serves as its selector. This is achieved using the '.selector' member available on function types in Solidity.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.5.14 <0.9.0;

library L {
    function f(uint256) external {}
}

contract C {
    function g() public pure returns (bytes4) {
        return L.f.selector;
    }
}
```

--------------------------------

### Paginate Persons with Limit and Get Page Info

Source: https://ponder.sh/docs/query/graphql

Retrieves the first 2 'person' records sorted by 'age' in ascending order, along with pagination information (cursors, previous/next page status) and the total count of matching records.

```graphql
query {
  persons(orderBy: "age", orderDirection: "asc", limit: 2) {
    items {
      name
      age
    }
    pageInfo {
      startCursor
      endCursor
      hasPreviousPage
      hasNextPage
    }
    totalCount
  }
}
```

--------------------------------

### Configure Fallback Transport with Custom Throw Condition (JavaScript)

Source: https://viem.sh/docs/clients/transports/fallback

This example demonstrates how to provide a custom function to the fallback transport to determine if an error should be immediately thrown or if the transport should continue to the next provider. The function receives the error as input and should return a boolean.

```javascript
const transport = fallback([
  thirdweb,
  infura
], {
  shouldThrow: (err) => {
    return err.message.includes('sad times');
  },
});
```

--------------------------------

### Ponder API Database Query Example (TypeScript)

Source: https://ponder.sh/docs/query/api-endpoints

Shows how to query the Ponder database within a custom API endpoint. It uses the `db` object from `ponder:api` and Drizzle ORM to fetch account data by address. This requires the `accounts` schema to be defined and imported.

```typescript
import { db } from "ponder:api";
import { accounts } from "ponder:schema";
import { Hono } from "hono";
import { eq } from "ponder";

const app = new Hono();

app.get("/account/:address", async (c) => {
  const address = c.req.param("address");
  const account = await db
    .select()
    .from(accounts)
    .where(eq(accounts.address, address));
  return c.json(account);
});

export default app;

```

--------------------------------

### Define UNIQUE Constraints with Drizzle ORM

Source: https://orm.drizzle.team/docs/indexes-constraints

This snippet demonstrates how to define unique constraints on columns and composite unique constraints using Drizzle ORM for SingleStore. It includes examples for single columns and multiple columns, specifying custom names for the constraints.

```typescript
import { int, varchar, unique, singlestoreTable } from "drizzle-orm/singlestore-core";

export const user = singlestoreTable('user', {
  id: int('id').unique(),
});

export const table = singlestoreTable('table', {
  id: int('id').unique('custom_name'),
});

export const composite = singlestoreTable('composite_example', {
  id: int('id'),
  name: varchar('name', { length: 256 }),
}, (t) => [
  unique().on(t.id, t.name),
  unique('custom_name').on(t.id, t.name)
]);
```

--------------------------------

### Batch Multicall Configuration

Source: https://viem.sh/docs/clients/public

Configure how multicall requests are batched for efficiency. Options include batch size, deployless mode, and wait time between batches.

```APIDOC
## Batch Multicall Configuration

### batch.multicall.batchSize (optional)

*   **Type:** `number`
*   **Default:** `1024`

The maximum size (in bytes) for each multicall (`aggregate3`) calldata chunk. This is useful for managing RPC provider limits on calldata size.

```javascript
import { createPublicClient, http }
from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  batch: {
    multicall: {
      batchSize: 512, // Example: Set batch size to 512 bytes
    },
  },
  chain: mainnet,
  transport: http(),
})
```

### batch.multicall.deployless (optional)

*   **Type:** `boolean`
*   **Default:** `false`

Enable or disable deployless multicall functionality.

```javascript
import { createPublicClient, http }
from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  batch: {
    multicall: {
      deployless: true, // Example: Enable deployless multicall
    },
  },
  chain: mainnet,
  transport: http(),
})
```

### batch.multicall.wait (optional)

*   **Type:** `number`
*   **Default:** `0` (zero delay)

The maximum number of milliseconds to wait before sending a batch of multicall requests.

```javascript
import { createPublicClient, http }
from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  batch: {
    multicall: {
      wait: 16, // Example: Wait up to 16ms before sending a batch
    },
  },
  chain: mainnet,
  transport: http(),
})
```
```

--------------------------------

### Advanced Query with Joins and Aggregations - Drizzle ORM

Source: https://orm.drizzle.team/docs/select

An advanced Drizzle ORM query example that joins the 'orders' and 'order_detail' tables. It calculates the count of products, sum of quantities, and total price per order, then groups and orders the results.

```typescript
const orders = sqliteTable('order', {
  id: integer('id').primaryKey(),
  orderDate: integer('order_date', { mode: 'timestamp' }).notNull(),
  requiredDate: integer('required_date', { mode: 'timestamp' }).notNull(),
  shippedDate: integer('shipped_date', { mode: 'timestamp' }),
  shipVia: integer('ship_via').notNull(),
  freight: numeric('freight').notNull(),
  shipName: text('ship_name').notNull(),
  shipCity: text('ship_city').notNull(),
  shipRegion: text('ship_region'),
  shipPostalCode: text('ship_postal_code'),
  shipCountry: text('ship_country').notNull(),
  customerId: text('customer_id').notNull(),
  employeeId: integer('employee_id').notNull(),
});

const details = sqliteTable('order_detail', {
  unitPrice: numeric('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  discount: numeric('discount').notNull(),
  orderId: integer('order_id').notNull(),
  productId: integer('product_id').notNull(),
});

db
  .select({
    id: orders.id,
    shippedDate: orders.shippedDate,
    shipName: orders.shipName,
    shipCity: orders.shipCity,
    shipCountry: orders.shipCountry,
    productsCount: sql`cast(count(${details.productId}) as int)`,
    quantitySum: sql`sum(${details.quantity})`,
    totalPrice: sql`sum(${details.quantity} * ${details.unitPrice})`,
  })
  .from(orders)
  .leftJoin(details, eq(orders.id, details.orderId))
  .groupBy(orders.id)
  .orderBy(asc(orders.id))
  .all();
```

--------------------------------

### Direct SQL with Drizzle and setDatabaseSchema

Source: https://ponder.sh/docs/0.10/query/direct-sql

This example illustrates querying Ponder data using Drizzle ORM in a Node.js application. It utilizes the `setDatabaseSchema` utility to target a specific database schema ('target_schema') for all subsequent queries built with the provided Drizzle schema.

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema_ from "../../ponder/ponder.schema";

// Assume setDatabaseSchema is imported or defined elsewhere
const schema = setDatabaseSchema(schema_, "target_schema");

const db = drizzle(process.env.DATABASE_URL, {
  schema,
  casing: "snake_case",
});

const oldAccounts = await db
  .select()
  .from(schema.accounts)
  .orderBy(asc(schema.accounts.createdAt))
  .limit(100);
```

--------------------------------

### TanStack Query Core Concepts

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

This section outlines the fundamental concepts of TanStack Query, including Queries, Query Keys, Query Functions, and Mutations, which are essential for understanding how to use the library effectively.

```APIDOC
## TanStack Query Core Concepts

### Overview
TanStack Query is a data-fetching and state management library for React that simplifies the process of managing server state in your applications. It provides tools for fetching, caching, synchronizing, and updating server data.

### Key Concepts

#### Queries
Queries are the primary way to fetch data in TanStack Query. They are defined by a unique query key and a query function that fetches the data.

- **Query Key**: A unique identifier for a query. It can be a string or an array of strings/values.
- **Query Function**: An asynchronous function that fetches your data. It should return a Promise that resolves with your data or throws an error.

#### Mutations
Mutations are used to create, update, or delete data on the server. They are similar to queries but are typically used for side effects.

- **Mutation Key**: A unique identifier for a mutation.
- **Mutation Function**: An asynchronous function that performs the mutation operation.

#### Caching
TanStack Query automatically caches query data, preventing unnecessary network requests and improving performance. The cache is managed by the `QueryClient`.

#### DevTools
TanStack Query DevTools provide a powerful way to inspect and debug your queries and mutations, offering insights into the cache, query states, and more.
```

--------------------------------

### Configure Postgres Database in ponder.config.ts

Source: https://ponder.sh/docs/0.10/api-reference/ponder/config

This example demonstrates configuring Ponder to use a PostgreSQL database. You set the database kind to 'postgres' and provide a connection string. Optional `poolConfig` can be supplied to customize the node-postgres pool settings, such as connection limits and SSL.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: "postgresql://user:password@localhost:5432/dbname",
    poolConfig: {
      max: 100,
      ssl: true,
    },
  },
  // ...
});

```

--------------------------------

### Next.js Static Page with getStaticProps

Source: https://vercel.com/blog/framework-defined-infrastructure

This snippet shows a Next.js page that fetches data at build time using `getStaticProps`. This means the page can be pre-rendered into static HTML, eliminating the need for a serverless function for rendering. The infrastructure is optimized for serving static files, leading to lower costs.

```tsx
export default function BlogPosts({ posts }) {
  return posts.map(post => (
    <div key={post.id}>{post.title}</div>
  ));
}

export async function getStaticProps() {
  const posts = await getBlogPosts();
  return {
    props: { posts }
  };
}
```

--------------------------------

### Define a 'cats' table with an array column

Source: https://ponder.sh/docs/0.10/schema/tables

This example demonstrates how to define an array column named 'vaccinations' of type text within the 'cats' table. The `.array()` modifier is used for this purpose, suitable for small, one-dimensional collections.

```typescript
import { onchainTable } from "ponder";

export const cats = onchainTable("cats", (t) => ({
  name: t.text().primaryKey(),
  vaccinations: t.text().array(), // ["rabies", "distemper", "parvo"]
}));
```

--------------------------------

### Set Search Path for Direct SQL

Source: https://ponder.sh/docs/0.10/query/direct-sql

This example shows how to set the PostgreSQL search path to include a specific Ponder database schema. By setting the search path, unqualified table names can be used in SQL queries, simplifying them as the database will automatically look in the specified schemas.

```sql
SET search_path TO my_ponder_project, "$user", public;
```

--------------------------------

### Configure Block Intervals in Ponder

Source: https://ponder.sh/docs/0.10/api-reference/ponder/config

Defines block intervals for syncing events with Ponder. Allows specifying network, start and end blocks, and indexing interval. Useful for indexing specific contract event ranges or historical data.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  blocks: {
    ChainlinkPriceOracle: {
      network: "mainnet",
      startBlock: 19_750_000,
      interval: 5, // every minute
    },
  },
  // ...
});
```

--------------------------------

### Solidity Receive Ether Function Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Illustrates a 'Sink' contract in Solidity designed to receive Ether using the receive() function. This contract keeps all Ether sent to it, demonstrating a contract that accumulates Ether without an immediate way to retrieve it.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.6.0 <0.9.0;

// This contract keeps all Ether sent to it with no way
// to get it back.
contract Sink {
    receive() external payable {
        // Ether is received, but not stored or forwarded.
    }
}
```

--------------------------------

### Solidity onlyOwner Modifier Example

Source: https://docs.soliditylang.org/en/latest/contracts.html

Demonstrates a custom 'onlyOwner' modifier that restricts function access to the contract owner. It uses a 'require' statement to check the sender's address and the '_' placeholder to insert the function body.

```solidity
contract owned {
    address owner;
    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }
}
```

--------------------------------

### Ponder Configuration with Multiple Networks (TypeScript)

Source: https://ponder.sh/docs/0.10/indexing/read-contracts

This configuration file sets up Ponder to index contracts across multiple networks (mainnet and base). It defines the RPC URLs for each network and specifies contract details, including ABI, address, and start block for each network. This allows Ponder to manage indexing for contracts deployed on different chains.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";
import { UniswapV3FactoryAbi } from "./abis/UniswapV3Factory";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1)
    },
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453)
    },
  },
  contracts: {
    UniswapV3Factory: {
      abi: UniswapV3FactoryAbi,
      network: {
        mainnet: {
          address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
          startBlock: 12369621,
        },
        base: {
          address: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
          startBlock: 1371680,
        },
      },
    },
  },
});
```

--------------------------------

### GraphQL Schema Definition and Resolver Functions (JavaScript)

Source: https://graphql.org/learn

Defines a simple GraphQL schema with Query and User types, including resolver functions for fetching user data. This demonstrates how to structure a GraphQL API and implement data retrieval logic.

```graphql
type Query {
  me: User
}

type User {
  name: String
}
```

```javascript
// Resolver for the `me` field on the `Query` type
function resolveQueryMe(_parent, _args, context, _info) {
  return context.request.auth.user;
}

// Resolver for the `name` field on the `User` type
function resolveUserName(user, _args, context, _info) {
  return context.db.getUserFullName(user.id);
}
```

--------------------------------

### Get Transaction by Block Number - viem TypeScript

Source: https://viem.sh/docs/actions/public/getTransaction

Fetches transaction details using the block number and the transaction's index within that block. Requires a `publicClient` instance, the block number, and the transaction index. Returns a `Transaction` object.

```typescript
const transaction = await publicClient.getTransaction({
  blockNumber: 69420n,
  index: 0
})
```

--------------------------------

### SQL CREATE TABLE with FOREIGN KEY Constraint

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

Provides examples of creating tables with FOREIGN KEY constraints to enforce referential integrity. It shows how to link a column in one table to the PRIMARY KEY of another table, ensuring that related data remains consistent.

```sql
CREATE TABLE products (
  product_no integer PRIMARY KEY,
  name text,
  price numeric
);

CREATE TABLE orders (
  order_id integer PRIMARY KEY,
  product_no integer REFERENCES products (product_no),
  quantity integer
);

CREATE TABLE orders (
  order_id integer PRIMARY KEY,
  product_no integer REFERENCES products,
  quantity integer
);
```

--------------------------------

### PostgreSQL: Create Table with Multiple Column Check Constraints

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

This example illustrates creating a 'products' table with multiple CHECK constraints. It includes constraints for individual columns ('price' and 'discounted_price' being positive) and a table-level constraint ensuring the 'price' is greater than the 'discounted_price'.

```sql
CREATE TABLE products (
  product_no integer,
  name text,
  price numeric CHECK (price > 0),
  discounted_price numeric CHECK (discounted_price > 0),
  CHECK (price > discounted_price)
);
```

--------------------------------

### GraphQL Introspection Query for Connection Type

Source: https://relay.dev/graphql/connections.htm

An example introspection query to retrieve details about a connection type, specifically focusing on its fields like 'node' and 'cursor'. This helps understand the schema and the structure of data returned by paginated fields.

```graphql
{
  __type(name: "ExampleEdge") {
    fields {
      name
      type {
        name
        kind
        ofType {
          name
          kind
        }
      }
    }
  }
}
```

--------------------------------

### JavaScript Real-time Database Operations with Queuing

Source: https://github.com/ponder-sh/ponder/pull/1522

Illustrates the implementation of real-time database operations in JavaScript, using a queue to manage operations and prevent race conditions. This ensures that queries are executed in the correct order for consistent data handling.

```javascript
database: Database;
}
): IndexingStore => {
  // Operation queue to make sure all queries are run in order, circumventing race conditions
  const queue = createQueue Promise>({
```

--------------------------------

### GraphQL Query for Tokens and Associated Pools

Source: https://github.com/marktoda/v4-ponder

Example GraphQL query to find tokens whose symbol contains 'ETH' and retrieve their associated pools as either token0 or token1. This helps in understanding token liquidity across different pools.

```graphql
query {
  tokens(where: {symbol: {contains: "ETH"}}) {
    address
    name
    symbol
    decimals
    chainId
    poolsAsToken0 {
      poolId
    }
    poolsAsToken1 {
      poolId
    }
  }
}
```

--------------------------------

### Map TypeScript Key to Database Column Name (PostgreSQL)

Source: https://orm.drizzle.team/docs/sql-schema-declaration

Example of defining a PostgreSQL table schema where the TypeScript property `firstName` is mapped to the database column `first_name`. This uses column aliasing within `pgTable`. Requires `drizzle-orm/pg-core`.

```typescript
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: integer(),
  firstName: varchar('first_name')
})
```

--------------------------------

### Environment Variable Configuration for RPC URLs

Source: https://github.com/marktoda/v4-ponder

Configuration snippet for setting up environment variables in a .env.local file. This is crucial for the indexer to connect to specified blockchain networks using their RPC URLs.

```dotenv
PONDER_RPC_URL_1=
PONDER_RPC_URL_42161=
PONDER_RPC_URL_10=
PONDER_RPC_URL_8453=
PONDER_RPC_URL_137=
PONDER_RPC_URL_130=
PONDER_RPC_URL_480=
PONDER_RPC_URL_81457=
PONDER_RPC_URL_11155111=
PONDER_RPC_URL_1301=
PONDER_RPC_URL_84532=
PONDER_RPC_URL_421614=
```

--------------------------------

### Get Transaction Count at Block Tag (TypeScript)

Source: https://viem.sh/docs/actions/public/getTransactionCount

This snippet illustrates fetching the transaction count for an address using a block tag (e.g., 'latest', 'safe'). This method allows for retrieving the count based on predefined block states.

```typescript
const transactionCount = await publicClient.getTransactionCount({
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  blockTag: 'safe'
})
```

--------------------------------

### Core API Reference

Source: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery

Reference for the core components of TanStack Query, including QueryClient, QueryCache, MutationCache, and various observers.

```APIDOC
## TanStack Query Core API Reference

This section details the core components of TanStack Query, which are essential for managing data fetching and state synchronization in your applications.

### Core Components

*   **QueryClient**: The central hub for managing all queries and mutations. It holds the state and provides methods for interacting with the cache.
*   **QueryCache**: Manages the cache for all queries. It tracks active queries, their states, and handles invalidation and updates.
*   **MutationCache**: Manages the cache for all mutations. It tracks active mutations, their states, and handles success and error callbacks.
*   **QueryObserver**: Observes a single query and subscribes to its state changes. It's used internally by hooks like `useQuery`.
*   **InfiniteQueryObserver**: Observes infinite queries and subscribes to their state changes.
*   **QueriesObserver**: Observes multiple queries and subscribes to their state changes.
*   **streamedQuery**: Handles streaming updates for queries.
*   **focusManager**: Manages window focus events for refetching.
*   **onlineManager**: Manages online/offline status for refetching.
*   **notifyManager**: Manages notification of state changes to observers.
*   **timeoutManager**: Manages timeouts for various operations.
```

--------------------------------

### Get Transaction by Block Hash - viem TypeScript

Source: https://viem.sh/docs/actions/public/getTransaction

Fetches transaction details using the block's hash and the transaction's index within that block. Requires a `publicClient` instance, the block hash, and the transaction index. Returns a `Transaction` object.

```typescript
const transaction = await publicClient.getTransaction({
  blockHash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
  index: 0
})
```

--------------------------------

### Drizzle Relation Disambiguation with `relationName` (TypeScript)

Source: https://orm.drizzle.team/docs/relations

Demonstrates how to disambiguate multiple relations between the same two tables in Drizzle ORM. This example shows a `users` table having both an 'author' and a 'reviewer' relation to the `posts` table by using the `relationName` option.

```typescript
import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
});

export const usersRelations = relations(users, ({ many }) => ({
  author: many(posts, { relationName: 'author' }),
  reviewer: many(posts, { relationName: 'reviewer' }),
}));

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  content: text('content'),
  authorId: integer('author_id'),
  reviewerId: integer('reviewer_id'),
});
```

--------------------------------

### Define MySQL Tables with Drizzle ORM

Source: https://orm.drizzle.team/docs/sql-schema-declaration

Example of defining MySQL tables using Drizzle ORM, including primary keys, autoincrement, foreign keys, enums, unique constraints, and indexes. It also incorporates the reusable `timestamps` helper.

```typescript
import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { AnyMySqlColumn } from "drizzle-orm/mysql-core";

export const users = mysqlTable(
  "users",
  {
    id: t.int().primaryKey().autoincrement(),
    firstName: t.varchar("first_name", { length: 256 }),
    lastName: t.varchar("last_name", { length: 256 }),
    email: t.varchar({ length: 256 }).notNull(),
    invitee: t.int().references((): AnyMySqlColumn => users.id),
    role: t.mysqlEnum(["guest", "user", "admin"]).default("guest"),
  },
  (table) => [
    t.uniqueIndex("email_idx").on(table.email)
  ]
);

export const posts = mysqlTable(
  "posts",
  {
    id: t.int().primaryKey().autoincrement(),
    slug: t.varchar({ length: 256 }).$default(() => generateUniqueString(16)),
    title: t.varchar({ length: 256 }),
    ownerId: t.int("owner_id").references(() => users.id),
  },
  (table) => [
    t.uniqueIndex("slug_idx").on(table.slug),
    t.index("title_idx").on(table.title),
  ]
);

// Assuming generateUniqueString is defined elsewhere, e.g.:
// function generateUniqueString(length: number): string { /* ... implementation ... */ }
```

--------------------------------

### API Reference: QueryClient

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

Documentation for the `QueryClient` class, which is the central hub for managing queries, mutations, and cache operations in TanStack Query.

```APIDOC
## API Reference: QueryClient

### Description
The `QueryClient` is the core of TanStack Query. It manages the cache, facilitates query and mutation operations, and provides methods for interacting with the TanStack Query ecosystem.

### Methods

- **`getQueryCache()`**: Returns the `QueryCache` instance.
- **`getMutationCache()`**: Returns the `MutationCache` instance.
- **`getQueryData(queryKey, options)`**: Retrieves query data from the cache.
  - **`queryKey`** (string | Array<string | number | boolean | null | undefined>): The key of the query.
  - **`options`** (QueryClientOptions): Optional configuration.
- **`setQueryData(queryKey, updater, options)`**: Updates query data in the cache.
  - **`queryKey`** (string | Array<string | number | boolean | null | undefined>): The key of the query.
  - **`updater`** (TData | ((old: TData | undefined) => TData | undefined)): The new data or an updater function.
  - **`options`** (QueryClientOptions): Optional configuration.
- **`invalidateQueries(queryKey, options)`**: Invalidates queries, causing them to refetch.
  - **`queryKey`** (string | Array<string | number | boolean | null | undefined>): The key of the query to invalidate.
  - **`options`** (QueryClientOptions): Optional configuration.
- **`fetchQuery(queryKey, queryFn, options)`**: Fetches a query, populating the cache.
  - **`queryKey`** (string | Array<string | number | boolean | null | undefined>): The key of the query.
  - **`queryFn`** (QueryFunction<TData, TQueryKey>): The function to fetch data.
  - **`options`** (QueryFunctionOptions): Optional configuration.

### Request Example
```javascript
import { QueryClient } from '@tanstack/query-core';

const queryClient = new QueryClient();

// Fetch and set query data
const data = await queryClient.fetchQuery(['todos'], async () => {
  const response = await fetch('/api/todos');
  return response.json();
});

console.log(data);

// Invalidate queries
queryClient.invalidateQueries(['todos']);
```

### Response Example (Success)
Query data retrieved or updated in the cache.
```

--------------------------------

### Mock Drizzle ORM with Schema (TypeScript)

Source: https://orm.drizzle.team/docs/goodies

This snippet shows how to initialize a mocked Drizzle ORM database instance in TypeScript. It imports the `drizzle` function and a local `schema` object. The `drizzle.mock` function is used to create a mock database, leveraging the provided schema for type definitions, which helps in catching type errors during development. No external dependencies beyond Drizzle ORM itself are required for this specific mocking setup.

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema"

const db = drizzle.mock({ schema });
```

--------------------------------

### Raw SQL Update with Drizzle Query Builder in Ponder

Source: https://ponder.sh/docs/0.10/indexing/write

Executes a raw SQL UPDATE statement using Drizzle ORM's query builder. This example adds 100 points to accounts that have recent trades, demonstrating complex filtering involving a subquery.

```typescript
import { accounts, tradeEvents } from "ponder:schema";
import { eq, and, gte, inArray, sql } from "drizzle-orm";

// Add 100 points to accounts with recent trades
await db.sql
  .update(accounts)
  .set({ points: sql`${accounts.points} + 100` })
  .where(
    inArray(
      accounts.address,
      db.sql
        .select({ address: tradeEvents.from })
        .from(tradeEvents)
        .where(
          gte(tradeEvents.timestamp, event.block.timestamp - 24 * 60 * 60)
        )
    )
  );
```

--------------------------------

### Configure Fetch Options for HTTP Transport - viem

Source: https://viem.sh/docs/clients/transports/http

Shows how to pass custom `fetchOptions` to the internal `fetch` function used by the `http` transport. This is useful for setting headers, such as authorization tokens, or configuring cache behavior.

```typescript
const transport = http('https://1.rpc.thirdweb.com/...', {
  fetchOptions: {
    headers: {
      'Authorization': 'Bearer ...'
    }
  }
})
```

--------------------------------

### Define Contract Name in Ponder Configuration (TypeScript)

Source: https://ponder.sh/docs/config/contracts

This example demonstrates how to assign a unique name, 'Blitmap', to a contract within the Ponder configuration. Contract names must be unique across contracts, accounts, and block intervals in the configuration file.

```typescript
import { createConfig } from "ponder";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  chains: {
    /* ... */
  },
  contracts: {
    Blitmap: {
      abi: BlitmapAbi,
      chain: "mainnet",
      address: "0x8d04a8c79cEB0889Bdd12acdF3Fa9D207eD3Ff63",
    },
  },
});
```

--------------------------------

### Perform Multicall Reads at a Specific Block Number

Source: https://viem.sh/docs/contract/multicall

This example shows how to specify a `blockNumber` when using `publicClient.multicall`. This allows you to fetch contract data as it existed at a particular block in the blockchain history. The `blockNumber` parameter accepts a `bigint` value representing the desired block.

```javascript
const results = await publicClient.multicall({
  contracts: [
    {
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi: wagmiAbi,
      functionName: 'totalSupply',
    },
    // ... other contracts
  ],
  blockNumber: 15121123n,
})
```

--------------------------------

### Configure Block Intervals in ponder.config.ts

Source: https://ponder.sh/docs/0.10/config/block-intervals

This configuration sets up a block interval named 'ChainlinkOracleUpdate' to run every 10 blocks starting from block 1000 on the 'mainnet' network. It specifies the network transport using an environment variable for the RPC URL.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1)
    },
  },
  blocks: {
    ChainlinkOracleUpdate: {
      network: "mainnet",
      interval: 10, // Every 10 blocks
      startBlock: 1000,
    },
  },
});
```

--------------------------------

### Define PostgreSQL Tables with Drizzle ORM

Source: https://orm.drizzle.team/docs/sql-schema-declaration

Example of defining PostgreSQL tables using Drizzle ORM, including primary keys, generated identities, foreign keys, enums, unique constraints, and indexes. It also incorporates the reusable `timestamps` helper.

```typescript
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { pgEnum, pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["guest", "user", "admin"]);

export const users = table(
  "users",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    firstName: t.varchar("first_name", { length: 256 }),
    lastName: t.varchar("last_name", { length: 256 }),
    email: t.varchar().notNull(),
    invitee: t.integer().references((): AnyPgColumn => users.id),
    role: rolesEnum().default("guest"),
  },
  (table) => [
    t.uniqueIndex("email_idx").on(table.email)
  ]
);

export const posts = table(
  "posts",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    slug: t.varchar().$default(() => generateUniqueString(16)),
    title: t.varchar({ length: 256 }),
    ownerId: t.integer("owner_id").references(() => users.id),
  },
  (table) => [
    t.uniqueIndex("slug_idx").on(table.slug),
    t.index("title_idx").on(table.title),
  ]
);

export const comments = table("comments", {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  text: t.varchar({ length: 256 }),
  postId: t.integer("post_id").references(() => posts.id),
  ownerId: t.integer("owner_id").references(() => users.id),
});

// Assuming generateUniqueString is defined elsewhere, e.g.:
// function generateUniqueString(length: number): string { /* ... implementation ... */ }
```

--------------------------------

### PostgreSQL COPY Command Options

Source: https://www.postgresql.org/docs/current/sql-copy.html

Details the various options available for the PostgreSQL COPY command, such as format, delimiter, null string, header, quoting, and error handling.

```sql
FORMAT _format_name_
FREEZE [_boolean_]
DELIMITER '_delimiter_character_'
NULL '_null_string_'
DEFAULT '_default_string_'
HEADER [_boolean_ | MATCH]
QUOTE '_quote_character_'
ESCAPE '_escape_character_'
FORCE_QUOTE { ( _column_name_ [, ...] ) | * }
FORCE_NOT_NULL { ( _column_name_ [, ...] ) | * }
FORCE_NULL { ( _column_name_ [, ...] ) | * }
ON_ERROR _error_action_
REJECT_LIMIT _maxerror_
ENCODING '_encoding_name_'
LOG_VERBOSITY _verbosity_
```

--------------------------------

### Getting Query Fingerprint with libpg_query (C)

Source: https://github.com/pganalyze/libpg_query

This C code snippet demonstrates how to obtain a normalized fingerprint of an SQL query using libpg_query. The fingerprint helps in identifying queries regardless of minor variations like whitespace or comments. It's useful for query analysis and optimization.

```c
#include <stdio.h>
#include <stdlib.h>
#include "pg_query.h"

int main() {
    const char *sql = "SELECT * FROM users WHERE id = 1; -- A comment";
    pg_query_parse_result *result = pg_query_parse(sql);

    if (result->error_message) {
        fprintf(stderr, "Error parsing SQL: %s\n", result->error_message);
        pg_query_free_parse_result(result);
        return 1;
    }

    char *fingerprint = pg_query_fingerprint(result->parse_tree);
    if (fingerprint) {
        printf("Query Fingerprint: %s\n", fingerprint);
        free(fingerprint);
    } else {
        fprintf(stderr, "Error generating fingerprint.\n");
    }

    pg_query_free_parse_result(result);
    return 0;
}
```

--------------------------------

### Drizzle ORM Index Creation with .on() and .onOnly()

Source: https://orm.drizzle.team/docs/indexes-constraints

Demonstrates the new index API in Drizzle ORM for creating indexes using the `.on()` and `.onOnly()` methods. This API allows specifying multiple columns, sort orders, and null handling for index creation. It also supports concurrent index creation and WHERE clauses.

```typescript
// First example, with `.on()`
index('name')
  .on(table.column1.asc(), table.column2.nullsFirst(), ...)
or .onOnly(table.column1.desc().nullsLast(), table.column2, ...)
  .concurrently()
  .where(sql``)
  .with({ fillfactor: '70' })
```

```typescript
// Second Example, with `.using()`
index('name')
  .using('btree', table.column1.asc(), sql`lower(${table.column2})`, table.column1.op('text_ops'))
  .where(sql``)
  .with({ fillfactor: '70' })
```

--------------------------------

### Compile Contracts with Forge

Source: https://book.getfoundry.sh/guides/scripting-with-solidity

Compiles all the smart contracts within the Foundry project. This command is typically run after initializing a project or making changes to contract code to ensure everything is up-to-date and to check for compilation errors.

```bash
forge build
```

--------------------------------

### Fetch Transaction Receipts Ad-Hoc with Ponder Client

Source: https://ponder.sh/docs/0.10/guides/receipts

This example shows how to dynamically fetch a transaction receipt using `context.client.getTransactionReceipt` within an indexing function. This method is useful for specific cases or when the `logs` array is required, as it is not included when `includeTransactionReceipts` is set to true.

```typescript
import { ponder } from "ponder:registry";

ponder.on("Blitmap:Mint", async ({ event }) => {
  const receipt = await context.client.getTransactionReceipt(event.transactionHash);
  console.log(receipt);
  // ...
});
```

--------------------------------

### Enable Call Traces in Ponder Configuration

Source: https://ponder.sh/docs/guides/call-traces

This snippet shows how to enable call trace indexing for a specific contract by setting the `includeCallTraces` option to `true` in the `ponder.config.ts` file. This configuration allows Ponder to capture function calls in addition to event logs.

```typescript
import { createConfig } from "ponder";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  contracts: {
    Blitmap: {
      abi: BlitmapAbi,
      chain: "mainnet",
      address: "0x8d04a8c79cEB0889Bdd12acdF3Fa9D207eD3Ff63",
      startBlock: 12439123,
      includeCallTraces: true,
    },
  },
  // ...
});
```

--------------------------------

### Extend Built-in Type with Library Functions using 'using for' in Solidity

Source: https://docs.soliditylang.org/en/latest/contracts.html

This example shows how to extend a built-in type, specifically a dynamic array of uints ('uint[]'), with custom functions from a library ('Search') using the 'using for' directive. This allows for cleaner syntax when calling library functions on array instances. The 'indexOf' function is demonstrated.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

library Search {
    function indexOf(uint[] storage self, uint value) public view returns (uint) {
        for (uint i = 0; i < self.length; i++)
            if (self[i] == value)
                return i;
        return type(uint).max;
    }
}

using Search for uint[];

contract C {
    uint[] data;

    function append(uint value) public {
        data.push(value);
    }

    function replace(uint from, uint to) public {
        // This performs the library function call
        uint index = data.indexOf(from);
        if (index == type(uint).max)
            data.push(to);
        else
            data[index] = to;
    }
}
```

--------------------------------

### Project Configuration with TypeScript

Source: https://github.com/ponder-sh/ponder/tree/main/examples/feature-multichain

A TypeScript configuration file for a Ponder project. It specifies compiler options, module resolution, and output settings for building the Ponder application. This is essential for any TypeScript-based Ponder project.

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "target": "es2020",
    "module": "es2020",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}

```

--------------------------------

### useQuery Hook Usage in React (TypeScript)

Source: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery

Demonstrates the basic usage of the useQuery hook to fetch data. It outlines the expected parameters for configuration and the shape of the returned state object, including data, loading, error states, and refetching capabilities.

```tsx
const { data, dataUpdatedAt, error, errorUpdatedAt, failureCount, failureReason, fetchStatus, isError, isFetched, isFetchedAfterMount, isFetching, isInitialLoading, isLoading, isLoadingError, isPaused, isPending, isPlaceholderData, isRefetchError, isRefetching, isStale, isSuccess, isEnabled, promise, refetch, status, } = useQuery( {
  queryKey,
  queryFn,
  gcTime,
  enabled,
  networkMode,
  initialData,
  initialDataUpdatedAt,
  meta,
  notifyOnChangeProps,
  placeholderData,
  queryKeyHashFn,
  refetchInterval,
  refetchIntervalInBackground,
  refetchOnMount,
  refetchOnReconnect,
  refetchOnWindowFocus,
  retry,
  retryOnMount,
  retryDelay,
  select,
  staleTime,
  structuralSharing,
  subscribed,
  throwOnError,
},
queryClient,
)
```

--------------------------------

### Define CHECK Constraints with Drizzle ORM (SQLite)

Source: https://orm.drizzle.team/docs/indexes-constraints

This example demonstrates defining a CHECK constraint named 'age_check1' in Drizzle ORM for SQLite, ensuring the 'age' column is greater than 21. It includes definitions for primary key, text, and integer columns.

```typescript
import { sql } from "drizzle-orm";
import { check, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: int().primaryKey(),
    username: text().notNull(),
    age: int(),
  },
  (table) => [
    check("age_check1", sql`${table.age} > 21`)
  ]
);
```

--------------------------------

### POST /simulateContract

Source: https://viem.sh/docs/contract/simulateContract

Simulates a contract interaction to retrieve return data or revert reasons without altering blockchain state. It internally uses a Public Client to call the 'call' action with ABI-encoded data.

```APIDOC
## POST /simulateContract

### Description
Simulates and validates a contract interaction. This is useful for retrieving return data and revert reasons of contract write functions. This function does not require gas to execute and does not change the state of the blockchain. It is almost identical to `readContract`, but also supports contract write functions. Internally, `simulateContract` uses a Public Client to call the `call` action with ABI-encoded `data`.

### Method
POST

### Endpoint
/simulateContract

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
- **address** (Address) - Required - The contract address to interact with.
- **abi** (Abi) - Required - The ABI of the contract.
- **functionName** (string) - Required - The name of the function to simulate.
- **account** (Account) - Required - The account to simulate the transaction from.
- **accessList** (AccessList | null) - Optional - Access list for the transaction.
- **authorizationList** (AuthorizationList | null) - Optional - Authorization list for the transaction.
- **args** (readonly unknown[] | undefined) - Optional - Arguments to pass to the function.
- **blockNumber** (bigint | null) - Optional - The block number to simulate the transaction at.
- **blockTag** (BlockTag | null) - Optional - The block tag to simulate the transaction at.
- **dataSuffix** (Hex | null) - Optional - A suffix to append to the data.
- **gas** (bigint | null) - Optional - The gas limit for the simulation.
- **gasPrice** (bigint | null) - Optional - The gas price for the simulation.
- **maxFeePerGas** (bigint | null) - Optional - The maximum fee per gas for the simulation.
- **maxPriorityFeePerGas** (bigint | null) - Optional - The maximum priority fee per gas for the simulation.
- **nonce** (number | null) - Optional - The nonce for the simulation.
- **stateOverride** (StateOverride | null) - Optional - State overrides for the simulation.
- **value** (bigint | null) - Optional - The value to send with the transaction.

### Request Example
```json
{
  "address": "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
  "abi": wagmiAbi,
  "functionName": "mint",
  "account": account,
  "args": [69420]
}
```

### Response
#### Success Response (200)
- **result** (unknown) - The return value of the simulated function.
- **request** (SimulateContractRequest) - The request object used for the simulation.

#### Response Example
```json
{
  "result": "0x...",
  "request": {
    "address": "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
    "abi": wagmiAbi,
    "functionName": "mint",
    "account": account,
    "args": [69420]
  }
}
```

### Error Handling
- **BaseError**: A base class for all viem errors.
- **ContractFunctionRevertedError**: Thrown when a contract function reverts.
  - **data** (Hex) - The revert data, including the custom error signature and arguments.

### Example Usage
```typescript
import { account, publicClient } from './config'
import { wagmiAbi } from './abi'

const { result } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  account,
  args: [69420]
})
```

### Pairing with `writeContract`
```typescript
import { account, walletClient, publicClient } from './config'
import { wagmiAbi } from './abi'

const { request } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  account,
})

const hash = await walletClient.writeContract(request)
```

### Handling Custom Errors
```typescript
import { BaseError, ContractFunctionRevertedError } from 'viem';
import { account, walletClient, publicClient } from './config'
import { wagmiAbi } from './abi'

try {
  await publicClient.simulateContract({
    // ... other options
  });
} catch (error) {
  if (error instanceof BaseError) {
    const revertError = error.cause as ContractFunctionRevertedError;
    console.error(revertError.data);
  }
}
```
```

--------------------------------

### Get Transaction by Block Tag - viem TypeScript

Source: https://viem.sh/docs/actions/public/getTransaction

Fetches transaction details using a block tag (e.g., 'latest', 'safe') and the transaction's index within that block. Requires a `publicClient` instance, the block tag, and the transaction index. Returns a `Transaction` object.

```typescript
const transaction = await publicClient.getTransaction({
  blockTag: 'safe',
  index: 0
})
```

--------------------------------

### Configure Account Indexing in ponder.config.ts

Source: https://ponder.sh/docs/0.10/config/accounts

This configuration sets up Ponder to monitor transactions originating from a specific address ('BeaverBuild'). It defines the network, the target address, and the starting block for indexing. The `transport` uses an environment variable for the RPC URL.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1)
    },
  },
  accounts: {
    BeaverBuild: {
      network: "mainnet",
      address: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
      startBlock: 20000000,
    },
  },
});
```

--------------------------------

### Ponder `serve` Command for Server-Only Mode

Source: https://ponder.sh/docs/0.10/api-reference/ponder/cli

Runs the Ponder application in a server-only mode, suitable for horizontally scaling the HTTP server in production environments. This mode requires Postgres, builds project files once on startup, ignores file changes, and disables indexing. It serves data from the connected database via the HTTP server. Options include schema, port, and hostname configuration.

```bash
Usage: ponder serve [options]

Start the production HTTP server without the indexer

Options:
  --schema Database schema
  -p, --port Port for the web server (default: 42069)
  -H, --hostname Hostname for the web server (default: "0.0.0.0" or "::")
  -h, --help display help for command
```

--------------------------------

### Get Transaction Receipt with Viem

Source: https://viem.sh/docs/actions/public/getTransactionReceipt

Fetches the transaction receipt using the provided transaction hash. Requires a Viem public client and the transaction hash as input. Returns a TransactionReceipt object containing details like block hash, block number, and transaction status.

```typescript
import { publicClient } from './client'

const transaction = await publicClient.getTransactionReceipt({
  hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d'
})

// Example return value:
// {
//   blockHash: '0xaf1dadb8a98f1282e8f7b42cc3da8847bfa2cf4e227b8220403ae642e1173088',
//   blockNumber: 15132008n,
//   from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
//   // ... other properties
//   status: 'success',
// }
```

--------------------------------

### Define an 'accounts' table with hex and bigint types

Source: https://ponder.sh/docs/0.10/schema/tables

This example shows how to define an 'accounts' table using Ponder's EVM-specific column types. 'address' is defined as a hex primary key, and 'balance' is a non-nullable bigint, suitable for storing large EVM integer values.

```typescript
import { onchainTable } from "ponder";

export const accounts = onchainTable("accounts", (t) => ({
  address: t.hex().primaryKey(),
  balance: t.bigint().notNull(),
}));
```

--------------------------------

### GraphiQL Custom Storage Namespace (React/TypeScript)

Source: https://github.com/graphql/graphiql/tree/main/packages/graphiql

This snippet shows how to create a custom `storage` object that wraps the browser's `localStorage`. It prefixes all `getItem`, `setItem`, and `removeItem` operations with a defined `NAMESPACE`, ensuring that the state managed by this GraphiQL instance does not conflict with other potential instances or applications using `localStorage`. This requires `react` and `@graphiql/toolkit` dependencies.

```tsx
import type { FC } from 'react';
import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const fetcher = createGraphiQLFetcher({
  url: 'https://my.backend/graphql'
});

const NAMESPACE = 'my-namespace';

const storage: typeof localStorage = {
  ...localStorage,
  getItem(key) {
    return localStorage.getItem(`${NAMESPACE}:${key}`);
  },
  setItem(key, value) {
    return localStorage.setItem(`${NAMESPACE}:${key}`, value);
  },
  removeItem(key) {
    return localStorage.removeItem(`${NAMESPACE}:${key}`);
  }
};

export const App: FC = () => {
  return <GraphiQL fetcher={fetcher} storage={storage} />;
};
```

--------------------------------

### TypeScript Module Augmentation for Prototype Extension

Source: https://www.typescriptlang.org/docs/handbook/declaration-merging.html

Illustrates how to use module augmentation in TypeScript to add methods to existing classes. This example shows patching the `map` method onto an `Observable` class prototype after its initial declaration, which the compiler is unaware of by default.

```typescript
// observable.ts
export class Observable {
  // ... implementation left as an exercise for the reader ...
}

// map.ts
import { Observable } from "./observable";
declare module "./observable" {
  interface Observable<T, U> {
    map(f: (x: T) => U): Observable<U, undefined>;
  }
}

Observable.prototype.map = function <T, U>(f: (x: T) => U): Observable<U, undefined> {
  // ... another exercise for the reader
  return undefined as any;
};

// consumer.ts
import { Observable } from "./observable";
import "./map";

let o: Observable<number, undefined>;
o.map((x) => x.toFixed());
```

--------------------------------

### Ineligible Factory Event Signatures

Source: https://ponder.sh/docs/0.10/guides/factory

Examples of event signatures that are not eligible for use with the Ponder factory pattern. This is typically due to unsupported parameter types like arrays or structs, or if child contracts are batched within a single event.

```solidity
// ❌ Not eligible. The parameter "contracts" is an array type, which is not supported.
// Always emit a separate event for each child contract, even if they are created in a batch.
events ContractsCreated(address[] contracts)
// ❌ Not eligible. The parameter "child" is a struct/tuple, which is not supported.
struct ChildContract {
  address addr;
}
event ChildCreated(ChildContract child);
```

--------------------------------

### Handle Failures in viem multicall with allowFailure (TypeScript)

Source: https://viem.sh/docs/contract/multicall

This example demonstrates the `allowFailure` option in viem's `multicall` function. When set to `false`, the `multicall` will throw an error if any individual call within the batch reverts, preventing silent failures. By default (`true`), reverted calls are logged in the results array.

```typescript
const results = await publicClient.multicall({
  contracts: [
    {
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi: wagmiAbi,
      functionName: 'totalSupply',
    },
    ...
  ],
  allowFailure: false
})
```

--------------------------------

### Enable Batch JSON-RPC with HTTP Transport - viem

Source: https://viem.sh/docs/clnts/transports/http

Illustrates how to enable Batch JSON-RPC for the `http` transport by setting the `batch` option to `true`. This allows multiple JSON-RPC requests to be sent in a single HTTP request, improving efficiency.

```typescript
const transport = http('https://1.rpc.thirdweb.com/...', {
  batch: true
})
```

--------------------------------

### Filter Event Logs by Indexed Parameter Value

Source: https://ponder.sh/docs/0.10/config/contracts

This snippet demonstrates how to filter event logs based on specific indexed parameter values. It shows an example of filtering `Transfer` events from the USDC contract where the `from` argument matches a particular address.

```typescript
import { createConfig } from "ponder";
import { ERC20Abi } from "./abis/ERC20";

export default createConfig({
  networks: { /* ... */ },
  contracts: {
    USDC: {
      abi: ERC20Abi,
      network: "mainnet",
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      filter: {
        event: "Transfer",
        args: {
          from: "0x28c6c06298d514db089934071355e5743bf21d60", // Binance 14
        },
      },
    },
  },
});
```

--------------------------------

### Solidity Custom Errors for Transaction Reverts

Source: https://docs.soliditylang.org/en/latest/contracts.html

Shows how to define and utilize custom errors in Solidity for handling specific failure conditions. This example defines an `InsufficientBalance` error and uses it with both `revert` and `require` statements to provide detailed error information when a transfer fails.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

/// Insufficient balance for transfer. Needed `required` but only
/// `available` available.
/// @param available balance available.
/// @param required requested amount to transfer.
error InsufficientBalance(uint256 available, uint256 required);

contract TestToken {
    mapping(address => uint) balance;

    function transferWithRevertError(address to, uint256 amount) public {
        if (amount > balance[msg.sender])
            revert InsufficientBalance({
                available: balance[msg.sender],
                required: amount
            });
        balance[msg.sender] -= amount;
        balance[to] += amount;
    }

    function transferWithRequireError(address to, uint256 amount) public {
        require(amount <= balance[msg.sender], InsufficientBalance(balance[msg.sender], amount));
        balance[msg.sender] -= amount;
        balance[to] += amount;
    }

    // ...
}
```

--------------------------------

### Configure Blitmap NFT Contract Indexing

Source: https://ponder.sh/docs/0.10/config/contracts

This configuration sets up Ponder to index event logs from the Blitmap NFT contract on the Ethereum mainnet. It specifies the contract's ABI, network, address, and the starting block for indexing. The corresponding indexing function in `src/index.ts` handles inserting or updating token data based on 'MetadataChanged' events.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1)
    },
  },
  contracts: {
    Blitmap: {
      abi: BlitmapAbi,
      network: "mainnet",
      address: "0x8d04a8c79cEB0889Bdd12acdF3Fa9D207eD3Ff63",
      startBlock: 12439123,
    },
  },
});
```

```typescript
import { ponder } from "ponder:registry";
import { tokens } from "ponder:schema";

ponder.on("Blitmap:MetadataChanged", async ({ event, context }) => {
  await context.db
    .insert(tokens)
    .values({
      id: event.args.tokenId,
      metadata: event.args.newMetadata,
    })
    .onConflictDoUpdate({
      metadata: event.args.newMetadata,
    });
});
```

--------------------------------

### POST /readContract

Source: https://viem.sh/docs/contract/readContract

This endpoint allows you to read data from a smart contract by specifying the contract address, ABI, function name, and optional arguments.

```APIDOC
## POST /readContract

### Description
Reads data from a smart contract by calling a specified function.

### Method
POST

### Endpoint
/readContract

### Parameters
#### Request Body
- **address** (Address) - Required - The contract address.
- **abi** (Abi) - Required - The contract's ABI.
- **functionName** (string) - Required - The name of the function to call on the contract.
- **args** (Inferred from ABI) - Optional - Arguments to pass to the function call.
- **account** (Account | Address) - Optional - Optional Account sender override. Accepts a JSON-RPC Account or Local Account (Private Key, etc).
- **blockNumber** (number) - Optional - The block number to perform the read against.
- **blockTag** (string) - Optional - The block tag to perform the read against. Default: 'latest'. Options: 'latest', 'earliest', 'pending', 'safe', 'finalized'.
- **factory** (string) - Optional - Contract deployment factory address (ie. Create2 factory, Smart Account factory, etc).
- **factoryData** (string) - Optional - Calldata to execute on the factory to deploy the contract.
- **stateOverride** (StateOverride) - Optional - An optional address-to-state mapping, where each entry specifies some state to be ephemerally overridden prior to executing the call.

### Request Example
```json
{
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "abi": [
    {
      "type": "function",
      "name": "balanceOf",
      "inputs": [
        {
          "name": "owner",
          "type": "address"
        }
      ],
      "outputs": [
        {
          "type": "uint256"
        }
      ]
    }
  ],
  "functionName": "balanceOf",
  "args": ["0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC"]
}
```

### Response
#### Success Response (200)
- **data** (any) - The return value from the contract function call. Type is inferred.

#### Response Example
```json
{
  "data": "1000000000000000000"
}
```
```

--------------------------------

### React Query: QueryClientProvider

Source: https://tanstack.com/query/latest/docs/framework/react/quick-start

The `QueryClientProvider` is a React Context Provider that makes a `QueryClient` instance available to all descendant components. It's essential for setting up TanStack Query in your application. You typically wrap your root component with this provider.

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'

// Create a client
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
)
```

--------------------------------

### Drizzle ORM Relational Query Example

Source: https://orm.drizzle.team/docs/rqb

This snippet demonstrates how to perform a relational query using Drizzle ORM to fetch a user and their associated posts. It utilizes the `findMany` method with the `with` option to include related data, avoiding manual joins. This approach enhances developer experience and performance by simplifying nested data retrieval.

```typescript
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/node-postgres'; // Or your specific database driver

const db = drizzle({ schema });

const result = await db.query.users.findMany({
  with: {
    posts: true,
  },
});

// Expected result format:
// [
//   {
//     id: 10,
//     name: "Dan",
//     posts: [
//       {
//         id: 1,
//         content: "SQL is awesome",
//         authorId: 10,
//       },
//       {
//         id: 2,
//         content: "But check relational queries",
//         authorId: 10,
//       }
//     ]
//   }
// ]
```

--------------------------------

### Index Factory Contract and Child Contracts - TypeScript

Source: https://ponder.sh/docs/0.10/guides/factory

This configuration shows how to index both the factory contract itself and the child contracts it deploys. An entry for the factory contract is added to `contracts` with its specific address, allowing for indexing of the factory's events. The child contracts are configured using the `factory()` function as shown in the basic usage example.

```typescript
import { createConfig, factory } from "ponder";
import { parseAbiItem } from "viem";
import { SudoswapPoolAbi } from "./abis/SudoswapPool";
import { SudoswapFactoryAbi } from "./abis/SudoswapFactory";

export default createConfig({
  networks: {
    /* ... */
  },
  contracts: {
    SudoswapFactory: {
      abi: SudoswapFactoryAbi,
      network: "mainnet",
      address: "0xb16c1342E617A5B6E4b631EB114483FDB289c0A4",
      startBlock: 14645816,
    },
    SudoswapPool: {
      abi: SudoswapPoolAbi,
      network: "mainnet",
      address: factory({
        address: "0xb16c1342E617A5B6E4b631EB114483FDB289c0A4",
        event: parseAbiItem("event NewPair(address poolAddress)"),
        parameter: "poolAddress",
      }),
      startBlock: 14645816,
    },
  },
});
```

--------------------------------

### Read Contract with Factory Deployment Data using `readContract`

Source: https://viem.sh/docs/contract/readContract

This snippet shows how to read contract data by specifying a factory address and its corresponding data. This is useful for interacting with contracts deployed through factory patterns, like Create2 or Smart Account factories.

```typescript
const data = await publicClient.readContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'totalSupply',
  factory: '0x0000000000ffe8b47b3e2130213b802212439497',
  factoryData: '0xdeadbeef',
})
```

--------------------------------

### Get Storage Slot Value (TypeScript)

Source: https://viem.sh/docs/contract/getStorageAt

Demonstrates how to use the `getStorageAt` function from the Viem library to read a storage slot's value from a smart contract. It requires a public client instance and takes the contract address and slot (as a hex value) as parameters. Optional parameters include `blockNumber` or `blockTag` for historical reads.

```typescript
import { toHex } from 'viem'
import { wagmiAbi } from './abi'
import { publicClient } from './client'

const data = await publicClient.getStorageAt({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  slot: toHex(0)
})
```

```typescript
const data = await publicClient.getStorageAt({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  slot: toHex(0)
})
```

```typescript
const data = await publicClient.getStorageAt({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  slot: toHex(0)
})
```

```typescript
const bytecode = await publicClient.getStorageAt({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  slot: toHex(0),
  blockNumber: 15121123n,
})
```

```typescript
const bytecode = await publicClient.getStorageAt({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  slot: toHex(0),
  blockTag: 'safe',
})
```

--------------------------------

### Set up TanStack Query Provider with PonderProvider

Source: https://ponder.sh/docs/0.10/query/sql-client

Integrates TanStack Query's QueryClientProvider within the PonderProvider to manage asynchronous state and enable live query updates in React applications. This step is necessary if TanStack Query is not already configured.

```typescript
import { PonderProvider } from "@ponder/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { client } from "../lib/ponder";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PonderProvider client={client}>
        {/***** ... your app components ... *****/}
      </PonderProvider>
    </QueryClientProvider>
  );
}
```

--------------------------------

### psql \copy Command for Client-Side File Operations

Source: https://www.postgresql.org/docs/current/sql-copy.html

Demonstrates the usage of the psql meta-command \copy, which differs from the SQL COPY command by handling file operations on the client side rather than the server side.

```sql
-- Example for copying data from a client-side file into a table
\copy table_name FROM 'client_file.csv' WITH (FORMAT CSV, HEADER)

-- Example for copying data from a table to a client-side file
\copy table_name TO 'output_file.csv' WITH (FORMAT CSV, HEADER)
```

--------------------------------

### Manually Removing the First Page of an Infinite Query (TypeScript)

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

This example demonstrates how to manually update the `queryClient`'s cache to remove the first page from an infinite query's data. This is achieved using `setQueryData` and slicing the `pages` and `pageParams` arrays.

```tsx
queryClient.setQueryData(['projects'], (data) => ({
  pages: data.pages.slice(1),
  pageParams: data.pageParams.slice(1),
}))
```

--------------------------------

### Configure local TypeScript path in VS Code workspace settings

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

Updates VS Code's workspace settings to use a project-local TypeScript version. This ensures that VS Code uses the version installed in the project's `node_modules` for that specific project.

```json
"typescript.tsdk": "./node_modules/typescript/lib"
```

--------------------------------

### Connect to Ponder SQL server

Source: https://ponder.sh/docs/0.10/query/sql-client

Establishes a connection to the Ponder SQL server using the createClient function from @ponder/client. It requires the server endpoint URL and the project's schema definition.

```typescript
import { createClient } from "@ponder/client";
import * as schema from "../../ponder/ponder.schema";

const client = createClient("http://localhost:42069/sql", { schema });

export { client, schema };
```

--------------------------------

### React: Use Query Hook for Data Fetching

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

Demonstrates the basic usage of the `useQuery` hook in React for fetching data. It requires a query key and a query function. The hook manages loading, error, and data states, returning them for UI rendering. This is a fundamental building block for data management with TanStack Query.

```javascript
import { useQuery } from '@tanstack/react-query'

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/todos')
      return response.json()
    },
  })

  if (isLoading) return 'Loading...'
  if (error) return 'An error has occurred: ' + error.message

  return (
    <div>
      {data.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  )
}
```

--------------------------------

### React Query: Including Variables in Query Keys

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

Demonstrates the practice of including variables used in the query function within the query key. This ensures that the query is refetched automatically when these variables change, maintaining data consistency. The example shows a `useQuery` hook where `todoId` is part of the query key and the query function.

```typescript
function Todos({ todoId }) {
  const result = useQuery({
    queryKey: ['todos', todoId],
    queryFn: () => fetchTodoById(todoId),
  })
}
```

--------------------------------

### Configure Public Client Batching - batch.multicall.deployless

Source: https://viem.sh/docs/clients/public

Enables or disables deployless multicall functionality. This affects how contract deployment data is handled in batch requests.

```javascript
const publicClient = createPublicClient({
  batch: {
    multicall: {
      deployless: true,
    },
  },
  chain: mainnet,
  transport: http(),
})
```

--------------------------------

### client.db

Source: https://ponder.sh/docs/api-reference/ponder-client

Builds and executes a SQL query using Drizzle over HTTP.

```APIDOC
## `client.db`

### Description
Build a SQL query using Drizzle and execute it over HTTP.

### Method
`client.db.querybuilder`

### Parameters
This method utilizes Drizzle's query builder. See Drizzle ORM documentation for detailed parameter usage.

### Request Example
```javascript
import { client, schema } from "../lib/ponder";
import { eq } from "@ponder/client";

// Select all accounts and limit to 10
const result = await client.db.select().from(schema.account).limit(10);

// Select accounts filtered by ID
const filteredResults = await client.db
  .select()
  .from(schema.account)
  .where(eq(schema.account.id, "0x123..."));
```

### Response
Returns an array of objects according to the query.
```

--------------------------------

### Ponder `db list` Command for Deployments

Source: https://ponder.sh/docs/0.10/api-reference/ponder/cli

Lists all Ponder deployments that have previously run in the connected database. This command helps in managing and understanding the history of Ponder instances. The output provides details such as the schema name, active status, last active time, and table count for each deployment.

```bash
Usage: ponder db list [options]

List all Ponder deployments

Options:
  -h, --help display help for command
```

--------------------------------

### Read External Contract Data with Manual Configuration (TypeScript)

Source: https://ponder.sh/docs/0.10/indexing/read-contracts

This configuration demonstrates how to read data from an external contract (AaveToken) that is not explicitly indexed by Ponder. It involves importing the contract's ABI directly and providing its address and start block manually within the `createConfig` function. These ad-hoc requests are still cached.

```typescript
import { createConfig } from "ponder";
import { AaveTokenAbi } from "./abis/AaveToken";

export default createConfig({
  contracts: {
    AaveToken: {
      network: "mainnet",
      abi: AaveTokenAbi,
      address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
      startBlock: 10926829,
    },
  },
});
```

--------------------------------

### Set TypeScript SDK Path in VS Code

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

This JSON configuration snippet demonstrates how to set the 'typescript.tsdk' user or workspace setting in Visual Studio Code. This setting tells VS Code the directory where the TypeScript language server ('tsserver.js') can be found, allowing it to use a specific installed version of TypeScript for IntelliSense and other language features.

```json
{
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

--------------------------------

### Customize Column Data Types with Drizzle ORM

Source: https://orm.drizzle.team/docs/column-types/pg

Demonstrates how to customize column data types in Drizzle ORM using the `.$type()` method. This is particularly useful for branded types or when dealing with unknown types, as shown with a `UserId` example.

```typescript
import { pgTable, serial, json } from "drizzle-orm/pg-core";

type UserId = number & { __brand: 'user_id' };
type Data = {
  foo: string;
  bar: number;
};

const users = pgTable('users', {
  id: serial().$type().primaryKey(),
  jsonField: json().$type()
});
```

--------------------------------

### Merge Multiple ABIs using mergeAbis Utility (TypeScript)

Source: https://ponder.sh/docs/config/contracts

This Ponder configuration example uses the `mergeAbis` utility function to combine multiple contract ABIs into a single, type-safe ABI. This is particularly useful for handling proxy contracts where the implementation ABI might change over time, ensuring all relevant functions are recognized.

```typescript
import { createConfig, mergeAbis } from "ponder";
import { ERC1967ProxyAbi } from "./abis/ERC1967Proxy";
import { NameRegistryAbi } from "./abis/NameRegistry";
import { NameRegistry2Abi } from "./abis/NameRegistry2";

export default createConfig({
  chains: {
    /* ... */
  },
  contracts: {
    FarcasterNameRegistry: {
      abi: mergeAbis([
        ERC1967ProxyAbi
      ])
    },
  },
});
```

--------------------------------

### client.live

Source: https://ponder.sh/docs/api-reference/ponder-client

Subscribes to live updates from the database using Server-Sent Events (SSE).

```APIDOC
## `client.live`

### Description
Subscribe to live updates from the database using server-sent events (SSE).

### Method
`client.live`

### Parameters
#### Parameters
- **queryFn** (`(db: ClientDb) => Promise`) - Required - A query builder callback using the `db` argument
- **onData** (`(result: Result) => void`) - Required - Callback that receives each new query result
- **onError** (`(error: Error) => void`) - Optional - Callback that handles any errors that occur

### Request Example
```javascript
import { client, schema } from "../lib/ponder";

const { unsubscribe } = client.live(
  (db) => db.select().from(schema.account),
  (result) => {
    console.log("Updated accounts:", result);
  },
  (error) => {
    console.error("Subscription error:", error);
  }
);

// Later, to stop receiving updates:
unsubscribe();
```

### Response
Returns an object with an `unsubscribe` method that can be called to stop receiving updates.

### Implementation Notes
- Each `createClient` instance multiplexes all live queries over a single SSE connection.
- The server notifies the client whenever a new block gets indexed. If a query result is no longer valid, the client immediately refetches it to receive the latest result.
```

--------------------------------

### Get ENS Address with viem (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAddress

This snippet shows how to use the `getEnsAddress` function from the viem library to resolve an ENS name to its associated address. It requires importing `normalize` from `viem/ens` and a `publicClient` instance. The function returns the address as a string or null if the name does not resolve.

```typescript
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const ensAddress = await publicClient.getEnsAddress({
  name: normalize('wevm.eth'),
})

// '0xd2135CfB216b74109775236E36d4b433F1DF507B'
```

--------------------------------

### Initialize node-postgres Pool with Configuration

Source: https://node-postgres.com/apis/pool

Demonstrates how to create a new pg.Pool instance with custom configuration options. The configuration object allows for setting parameters such as connection timeouts, idle timeouts, maximum clients, and client lifetime.

```javascript
import { Pool } from 'pg'
const pool = new Pool({
  host: 'localhost',
  user: 'database-user',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxLifetimeSeconds: 60
})
```

--------------------------------

### Solidity Function Returning Multiple Values by Assignment

Source: https://docs.soliditylang.org/en/latest/contracts.html

This example shows a Solidity function that declares two return variables ('sum' and 'product') and calculates them within the function body, assigning the results to these variables before the function implicitly returns them. It highlights the declaration and assignment to named return variables.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract Simple {
  function arithmetic(uint a, uint b) public pure returns (uint sum, uint product) {
    sum = a + b;
    product = a * b;
  }
}
```

--------------------------------

### Drizzle ORM Mock Driver

Source: https://orm.drizzle.team/docs/goodies

Demonstrates the usage of the `drizzle.mock()` function to create a mock database driver instance. This is a successor to older internal mocking methods and is now a recommended API for testing purposes.

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
const db = drizzle.mock()
```

--------------------------------

### Configure Network-Specific Block Intervals

Source: https://ponder.sh/docs/0.10/config/block-intervals

This configuration shows how to define a block interval named 'PointsAggregation' with network-specific settings. For the 'mainnet' network, it sets a start block and an interval calculated for every 60 minutes, assuming a 12-second block time. It also includes a placeholder for 'optimistic' network settings.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  networks: {
    /* ... */
  },
  blocks: {
    PointsAggregation: {
      network: {
        mainnet: {
          startBlock: 19783636,
          interval: (60 * 60) / 12, // Every 60 minutes (12s block time)
        },
        optimistic: {
          // Configuration for optimistic network
        }
      },
    },
  },
});
```

--------------------------------

### Define Custom Operators for User-Defined Type with 'using for global' in Solidity

Source: https://docs.soliditylang.org/en/latest/contracts.html

This example illustrates how to define custom operators ('+' for add, '/' for div) for a user-defined type 'UFixed16x2' using the 'using for global' directive. This allows these operators to be used universally wherever the 'UFixed16x2' type is available. It demonstrates type wrapping and unwrapping for arithmetic operations.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

type UFixed16x2 is uint16;

using { add as +, div as / } for UFixed16x2 global;

uint32 constant SCALE = 100;

function add(UFixed16x2 a, UFixed16x2 b) pure returns (UFixed16x2) {
    return UFixed16x2.wrap(UFixed16x2.unwrap(a) + UFixed16x2.unwrap(b));
}

function div(UFixed16x2 a, UFixed16x2 b) pure returns (UFixed16x2) {
    uint32 a32 = UFixed16x2.unwrap(a);
    uint32 b32 = UFixed16x2.unwrap(b);
    uint32 result32 = a32 * SCALE / b32;
    require(result32 <= type(uint16).max, "Divide overflow");
    return UFixed16x2.wrap(uint16(a32 * SCALE / b32));
}

contract Math {
    function avg(UFixed16x2 a, UFixed16x2 b) public pure returns (UFixed16x2) {
        return (a + b) / UFixed16x2.wrap(200);
    }
}
```

--------------------------------

### Drizzle with setDatabaseSchema for Direct SQL

Source: https://ponder.sh/docs/query/direct-sql

This TypeScript example utilizes Drizzle ORM with Ponder's `setDatabaseSchema` utility to target a specific database schema for direct SQL queries. It first imports necessary Drizzle functions and Ponder utilities, then configures the Drizzle schema to point to 'target_schema'. Finally, it executes a query to fetch old accounts, ordered by creation date and limited to 100 results.

```typescript
import { drizzle, asc } from "drizzle-orm/node-postgres";
import { setDatabaseSchema } from "@ponder/client";
import * as schema from "../../ponder/ponder.schema";

setDatabaseSchema(schema, "target_schema");

const db = drizzle(process.env.DATABASE_URL, {
  schema,
  casing: "snake_case",
});

const oldAccounts = await db
  .select()
  .from(schema.accounts)
  .orderBy(asc(schema.accounts.createdAt))
  .limit(100);

console.log(oldAccounts);
```

--------------------------------

### Get ENS Address with Custom Universal Resolver Address in viem (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAddress

This code snippet illustrates how to specify a custom address for the ENS Universal Resolver Contract when using `getEnsAddress` in viem. This is useful if you need to interact with a non-default instance of the resolver contract.

```typescript
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const ensAddress = await publicClient.getEnsAddress({
  name: normalize('wevm.eth'),
  universalResolverAddress: '0x74E20Bd2'
})
```

--------------------------------

### Drizzle ORM Schema Definition Example

Source: https://orm.drizzle.team/docs/rqb

This code defines a basic schema for Drizzle ORM using PostgreSQL specific types. It includes the `users` table with an auto-incrementing `id`, a non-null `name` field, and demonstrates the use of `pgTable` for PostgreSQL. This schema serves as the foundation for building queries and managing database structure within Drizzle.

```typescript
import { integer, serial, text, pgTable } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

// Placeholder for relation definition if needed
// export const posts = pgTable('posts', { ... });
// export const userRelations = relations(users, ({ many }) => ({
//   posts: many(posts),
// }));
```

--------------------------------

### Simulate Contract Mint with gasPrice | JavaScript

Source: https://viem.sh/docs/contract/simulateContract

Simulates a 'mint' function call using a specific gas price, suitable for legacy transactions. This allows control over the per-gas cost.

```javascript
const { result } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  args: [69420],
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  gasPrice: parseGwei('20')
})
```

--------------------------------

### Manually Keeping Only the First Page of an Infinite Query (TypeScript)

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

This example demonstrates how to manually update the `queryClient`'s cache to retain only the first page of an infinite query. It uses `setQueryData` and slices the `pages` and `pageParams` arrays to keep only the element at index 0.

```tsx
queryClient.setQueryData(['projects'], (data) => ({
  pages: data.pages.slice(0, 1),
  pageParams: data.pageParams.slice(0, 1),
}))
```

--------------------------------

### Traditional Log vs. Logfmt Comparison

Source: https://brandur.org/logfmt

Compares a traditional log line with its equivalent in logfmt, demonstrating how logfmt simplifies data addition and analysis.

```plaintext
INFO [ConsumerFetcherManager-1382721708341] Stopping all fetchers (kafka.consumer.ConsumerFetcherManager)
```

```logfmt
level=info tag=stopping_fetchers id=ConsumerFetcherManager-1382721708341 module=kafka.consumer.ConsumerFetcherManager
```

--------------------------------

### Get ENS Name with Gateway URLs (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsName

This snippet shows how to specify custom gateway URLs for resolving CCIP-Read requests made through the ENS Universal Resolver Contract. By providing `gatewayUrls`, you can direct the resolution process to specific or alternative gateway endpoints.

```typescript
const ensName = await publicClient.getEnsName({
  address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
  gatewayUrls: ["https://ccip.ens.xyz"],
})
```

--------------------------------

### Best Practice: Composite Primary Key - Ponder Schema

Source: https://ponder.sh/docs/0.10/schema/tables

Highlights the best practice of using composite primary keys instead of concatenating strings for unique identifiers. This example contrasts an incorrect approach with the recommended composite primary key definition for the 'allowances' table.

```typescript
import { onchainTable, primaryKey } from "ponder";

// ❌ Don't concatenate strings to form a primary key
export const allowances = onchainTable("allowances", (t) => ({
  id: t.string().primaryKey(), // `${owner}_${spender}`
  owner: t.hex(),
  spender: t.hex(),
  amount: t.bigint(),
}));

// ✅ Use a composite primary key
export const allowances = onchainTable(
  "allowances",
  (t) => ({
    owner: t.hex(),
    spender: t.hex(),
    amount: t.bigint(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.owner, table.spender] })
  })
);
```

--------------------------------

### Read Factory Contract Using Event Log Address (TypeScript)

Source: https://ponder.sh/docs/0.10/indexing/read-contracts

This snippet demonstrates how to read data from a factory contract when the contract itself is not explicitly indexed in `ponder.config.ts`. It uses `event.log.address` to get the address of the contract that emi the event (in this case, a SudoswapPool) and then calls the 'totalSupply' function.

```typescript
import { ponder } from "ponder:registry";

ponder.on("SudoswapPool:Transfer", async ({ event, context }) => {
  const { SudoswapPool } = context.contracts;
  // ^? { abi: [...]} 
  const totalSupply = await context.client.readContract({
    abi: SudoswapPool.abi,
    address: event.log.address,
    functionName: "totalSupply",
  });
});
```

--------------------------------

### Insert and Query Data with Relations (TypeScript)

Source: https://ponder.sh/docs/schema/relations

Demonstrates inserting data into 'users', 'teams', and 'userTeams' tables and then querying a user to retrieve their associated teams, including nested relation data. This example uses Ponder's DB API and SQL query builder.

```typescript
import { users, teams, userTeams } from "ponder:schema";

await db.insert(users).values([
  { id: "ron" },
  { id: "harry" },
  { id: "hermione" }
]);

await db.insert(teams).values([
  { id: "muggle", mascot: "dudley" },
  { id: "wizard", mascot: "hagrid" },
]);

await db.insert(userTeams).values([
  { userId: "ron", teamId: "wizard" },
  { userId: "harry", teamId: "wizard" },
  { userId: "hermione", teamId: "muggle" },
  { userId: "hermione", teamId: "wizard" },
]);

const hermione = await db.sql.query.users.findFirst({
  where: eq(users.id, "hermione"),
  with: {
    userTeams: {
      with: {
        team: true
      }
    }
  },
});

console.log(hermione.userTeams);
```

--------------------------------

### Merge Multiple ABIs using `mergeAbis` Utility

Source: https://ponder.sh/docs/0.10/config/contracts

This example shows how to use the `mergeAbis` utility function in `ponder.config.ts` to combine multiple contract ABIs into a single, type-safe ABI. This is particularly useful for handling proxy contracts where the implementation ABI may change over time, ensuring all relevant functions and events are indexed correctly.

```typescript
import { createConfig, mergeAbis } from "ponder";
import { ERC1967ProxyAbi } from "./abis/ERC1967Proxy";
import { NameRegistryAbi } from "./abis/NameRegistry";
import {
```

--------------------------------

### `client.db` - SQL Query Execution

Source: https://ponder.sh/docs/0.10/api-reference/ponder-client

Build and execute SQL queries using Drizzle ORM over HTTP.

```APIDOC
## `client.db`

### Description

Build a SQL query using Drizzle and execute it over HTTP.

### Method

N/A (Method Call on Client Object)

### Endpoint

N/A

### Parameters

#### Request Body

- **Query Builder** - Uses Drizzle syntax to construct SQL queries.

#### Response

#### Success Response (200)

- **Array of objects** - Returns an array of objects matching the executed query.

### Request Example

```typescript
import { client, schema } from "../lib/ponder";
import { eq } from "@ponder/client";

// Example 1: Select all accounts and limit to 10
const result = await client.db.select().from(schema.account).limit(10);

// Example 2: Filter accounts by ID
const filteredResults = await client.db
  .select()
  .from(schema.account)
  .where(eq(schema.account.id, "0x123..."));
```
```

--------------------------------

### Get ENS Avatar with custom Universal Resolver address (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAvatar

Allows specifying a custom address for the ENS Universal Resolver Contract. This is typically used in scenarios where you are interacting with a fork or a custom deployment of the ENS resolver system. The `universalResolverAddress` parameter takes the contract address as a string.

```typescript
import { normalize } from 'viem/ens';
import { publicClient } from './client';

const ensText = await publicClient.getEnsAvatar({
  name: normalize('wevm.eth'),
  universalResolverAddress: '0x74E26Bd2A1fE0cdbe45b9A1d89cb7e0a45b36376',
});
```

--------------------------------

### Account Configuration: Unique Name Example

Source: https://ponder.sh/docs/0.10/config/accounts

This TypeScript snippet illustrates the requirement for unique account names within the Ponder configuration. The 'BeaverBuild' account is given a specific name, which must be unique across all accounts, contracts, and block intervals defined in `ponder.config.ts`.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";

export default createConfig({
  networks: {
    /* ... */
  },
  accounts: {
    BeaverBuild: {
      network: "mainnet",
      address: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
      startBlock: 12439123,
    },
  },
});
```

--------------------------------

### Import WebSocket Transport in Viem

Source: https://viem.sh/docs/clients/transports/websocket

Demonstrates how to import the `webSocket` function from the 'viem' library, which is essential for creating a WebSocket transport instance.

```typescript
import { webSocket } from 'viem'
```

--------------------------------

### Get Primary ENS Name for Address (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsName

This snippet demonstrates the basic usage of `getEnsName` to fetch the primary ENS name associated with an Ethereum address. It requires an initialized viem `publicClient`. The function returns the ENS name as a string or `null` if no primary name is assigned.

```typescript
import { publicClient } from './client'

const ensName = await publicClient.getEnsName({
  address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
})

// 'wevm.eth'
```

--------------------------------

### Write Ponder Indexing Function for Contract Events (TypeScript)

Source: https://github.com/ponder-sh/ponder

This TypeScript snippet demonstrates how to write an indexing function in Ponder to process contract events. The `ponder.on` function listens for a specific event (`BaseRegistrar:NameRegistered`) and, upon detection, inserts data into the defined database schema using `context.db.insert`. It extracts event parameters and block timestamps to populate the `ensName` table.

```typescript
import { ponder } from "ponder:registry";
import schema from "ponder:schema";

ponder.on("BaseRegistrar:NameRegistered", async ({ event, context }) => {
  const { name, owner } = event.params;
  await context.db.insert(schema.ensName).values({
    name: name,
    owner: owner,
    registeredAt: event.block.timestamp,
  });
});
```

--------------------------------

### QueryClientProvider

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

Provides the `QueryClient` instance to your React application, making it accessible to all hooks.

```APIDOC
## QueryClientProvider

### Description
Wraps your application to provide the `QueryClient` instance.

### Method
N/A (Component)

### Endpoint
N/A (Component)

### Parameters
#### Path Parameters
N/A

#### Query Parameters
N/A

#### Request Body
N/A

### Request Example
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

// Create a client
const queryClient = new QueryClient()

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
```

### Response
N/A (Component renders children)

#### Response Example
N/A
```

--------------------------------

### Drizzle ORM Select with Left Join

Source: https://orm.drizzle.team/docs/relations

This code example shows how to use Drizzle ORM's select API to perform a left join between the 'users' and 'posts' tables. It demonstrates chaining `.select()`, `.from()`, `.leftJoin()`, and `.orderBy()` methods to construct the query. The result is then mapped, although the mapping logic is not fully provided.

```typescript
import { drizzle } from 'drizzle-orm/…';
imrt { eq } from 'drizzle-orm';
import { posts, users } from './schema';

const db = drizzle(client);

const res = await db.select()
  .from(users)
  .leftJoin(posts, eq(posts.authorId, users.id))
  .orderBy(users.id)

const mappedResult = ```
```

--------------------------------

### Solidity Free Function for Summation

Source: https://docs.soliditylang.org/en/latest/contracts.html

Illustrates a free function 'sum' defined outside a contract, which has implicit internal visibility. The compiler incorporates its code into any contract that calls it. This example shows its use within a contract's function to sum elements of an array.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.1 <0.9.0;

function sum(uint[] memory arr) pure returns (uint s) {
  for (uint i = 0; i < arr.length; i++)
    s += arr[i];
}

contract ArrayExample {
  bool found;
  function f(uint[] memory arr) public {
    // This calls the free function internally.
    // The compiler will add its code to the contract.
    uint s = sum(arr);
    require(s >= 10);
    found = true;
  }
}
```

--------------------------------

### Configure HTTP Transport URL - viem

Source: https://viem.sh/docs/clients/transports/http

Shows how to explicitly provide the URL for the JSON-RPC API when creating an `http` transport. If no URL is provided, it defaults to the chain's default RPC URL.

```typescript
const transport = http('https://1.rpc.thirdweb.com/...')
```

--------------------------------

### Handle Custom Contract Errors (TypeScript)

Source: https://viem.sh/docs/contract/simulateContract

This example demonstrates how to handle custom errors thrown by `simulateContract`. It involves wrapping the simulation call in a try-catch block and checking for `BaseError` and `ContractFunctionRevertedError`. The custom error data can be accessed via the error's `data` attribute, provided the custom error is included in the contract ABI.

```typescript
import { BaseError, ContractFunctionRevertedError } from 'viem';
import { account, walletClient, publicClient } from './config'
import { wagmiAbi } from './abi'

try {
  await publicClie
```

--------------------------------

### Get ENS Avatar with custom gateway (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAvatar

Demonstrates how to fetch an ENS avatar using a specific IPFS gateway URL. This is useful when the default gateways are unavailable or when you need to use a custom gateway for resolving IPFS assets. The `assetGatewayUrls` parameter allows specifying custom gateways for IPFS and Arweave.

```typescript
import { normalize } from 'viem/ens';
import { publicClient } from './client';

const ensText = await publicClient.getEnsAvatar({
  name: normalize('wevm.eth'),
  assetGatewayUrls: {
    ipfs: 'https://cloudflare-ipfs.com',
  },
});
```

--------------------------------

### Specify Contract ABI in Ponder Configuration (TypeScript)

Source: https://ponder.sh/docs/config/contracts

This configuration snippet shows how to include a contract's ABI in the Ponder setup. The ABI is crucial for the indexing engine to validate inputs and correctly encode/decode contract data. It's recommended to save ABIs in separate `.ts` files with `as const` for type safety.

```typescript
import { createConfig } from "ponder";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1
    },
  },
  contracts: {
    Blitmap: {
      abi: BlitmapAbi,
      chain: "mainnet",
      address: "0x8d04a8c79cEB0889Bdd12acdF3Fa9D207eD3Ff63",
      startBlock: 
    },
  },
});
```

--------------------------------

### Solidity Contract with Custom Storage Layout

Source: https://docs.soliditylang.org/en/latest/contracts.html

Demonstrates how to define a custom storage layout for a Solidity contract using the 'layout at' specifier. This affects the starting slot for state variables within the contract and its inheritance hierarchy. The base slot expression must be a compile-time evaluable integer literal.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.29;

contract C layout at 0xAAAA + 0x11 {
  uint[3] x; // Occupies slots 0xAABB..0xAABD
}
```

--------------------------------

### Cursor-based Pagination (Backward)

Source: https://ponder.sh/docs/query/graphql

This GraphQL query demonstrates how to paginate backwards using the `before` argument, which takes the `startCursor` from a previous response. It fetches a limited number of items and includes page information for further navigation.

```graphql
query {
  persons(orderBy: "age", orderDirection: "asc", limit: 2, before: "MxhcdoP9CVBhY") {
    items {
      name
      age
    }
    pageInfo {
      startCursor
      endCursor
      hasPreviousPage
      hasNextPage
    }
    totalCount
  }
}
```

--------------------------------

### Chain-Specific ENS Name Resolution (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsName

This example shows how to perform chain-specific ENS name resolution using `getEnsName` by providing a `coinType`. This requires the viem client to be configured with a mainnet-compatible chain and the `toCoinType` helper function to convert chain IDs. It allows resolving ENS names for different blockchain networks.

```typescript
import { createPublicClient, http, toCoinType } from 'viem'
import { mainnet, base } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

const ensName = await publicClient.getEnsName({
  address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
  coinType: toCoinType(base.id),
})

// 'wevm.eth'
```

--------------------------------

### Drizzle ORM bigint with SQL Defaults

Source: https://orm.drizzle.team/docs/column-types/pg

Illustrates the implementation of a bigint column using Drizzle ORM, showcasing the use of `mode: 'number'` for handling JavaScript numbers within the 2^53 range. It includes examples with both direct default values and SQL-derived defaults.

```typescript
import { sql } from "drizzle-orm";
import { bigint, pgTable } from "drizzle-orm/pg-core";

export const table = pgTable('table', {
  bigint1: bigint().default(10),
  bigint2: bigint().default(sql`'10'::bigint`)
});
```

```sql
CREATE TABLE IF NOT EXISTS "table" (
  "bigint1" bigint DEFAULT 10,
  "bigint2" bigint DEFAULT '10'::bigint
);
```

--------------------------------

### Configure Sudoswap Pool Factory with Start/End Blocks

Source: https://ponder.sh/docs/guides/factory

This configuration demonstrates using the factory pattern with specific 'startBlock' and 'endBlock' options for Sudoswap pools. This allows Ponder to collect factory children from a specific block range, optimizing indexing time. It utilizes the 'NewPair' event to identify new pool addresses.

```typescript
import { createConfig, factory } from "ponder";
import { parseAbiItem } from "viem";
import { SudoswapPoolAbi } from "./abis/SudoswapPool";

export default createConfig({
  chains: {
    /* ... */
  },
  contracts: {
    SudoswapPool: {
      abi: SudoswapPoolAbi,
      chain: "mainnet",
      address: factory({
        address: "0xb16c1342E617A5B6E4b631EB114483FDB289c0A4",
        event: parseAbiItem("event NewPair(address poolAddress)"),
        parameter: "poolAddress",
        startBlock: 14645816,
      }),
      startBlock: "latest",
    },
  },
});
```

--------------------------------

### Attach Functions to User-Defined Type with 'using for' in Solidity

Source: https://docs.soliditylang.org/en/latest/contracts.html

This example demonstrates how to attach functions (insert, remove, contains) to a custom struct 'Data' using the 'using for' directive in Solidity. This makes the functions directly callable on instances of the 'Data' type within the specified scope. It shows how to define the functions and then use them within a contract.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

struct Data {
    mapping(uint => bool) flags;
}

// Now we attach functions to the type.
// The attached functions can be used throughout the rest of the module.
// If you import the module, you have to
// repeat the using directive there, for example as
// import "flags.sol" as Flags;
// using {Flags.insert, Flags.remove, Flags.contains}
// for Flags.Data;

using {insert, remove, contains} for Data;

function insert(Data storage self, uint value) returns (bool) {
    if (self.flags[value]) return false; // already there
    self.flags[value] = true;
    return true;
}

function remove(Data storage self, uint value) returns (bool) {
    if (!self.flags[value]) return false; // not there
    self.flags[value] = false;
    return true;
}

function contains(Data storage self, uint value) view returns (bool) {
    return self.flags[value];
}

contract C {
    Data knownValues;

    function register(uint value) public {
        // Here, all variables of type Data have
        // corresponding member functions.
        // The following function call is identical to
        // `Set.insert(knownValues, value)`
        require(knownValues.insert(value));
    }
}
```

--------------------------------

### Define CHECK Constraints with Drizzle ORM (PostgreSQL)

Source: https://orm.drizzle.team/docs/indexes-constraints

This example shows how to define a CHECK constraint in Drizzle ORM for PostgreSQL. The constraint 'age_check1' ensures that the 'age' column value is greater than 21. It also includes definitions for UUID primary key, text, and integer columns.

```typescript
import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey(),
    username: text().notNull(),
    age: integer(),
  },
  (table) => [
    check("age_check1", sql`${table.age} > 21`)
  ]
);
```

--------------------------------

### Get ENS Resolver Address - TypeScript

Source: https://viem.sh/docs/ens/actions/getEnsResolver

Retrieves the resolver address for a given ENS name using viem's `getEnsResolver` function. It requires normalizing the ENS name first and utilizes a public client for the operation. The function returns the resolver's address.

```typescript
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const resolverAddress = await publicClient.getEnsResolver({
  name: normalize('wevm.eth'),
})
// '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41'
```

--------------------------------

### Mark a Column as Not Null in Ponder Schema

Source: https://ponder.sh/docs/schema/tables

Illustrates the use of the `.notNull()` modifier to enforce that a column must have a value. If a row is inserted without a value for a `NOT NULL` column, the database will raise an error. This example applies it to the 'age' column in the 'cats' table.

```typescript
import { onchainTable } from "ponder";

export const cats = onchainTable("cats", (t) => ({
  name: t.text().primaryKey(),
  age: t.integer().notNull(),
}));
```

--------------------------------

### Enable SQL over HTTP on the Server

Source: https://ponder.sh/docs/query/sql-over-http

Use the `client` Hono middleware to enable SQL over HTTP queries on your Ponder server.

```APIDOC
## POST /sql/*

### Description
This endpoint enables SQL over HTTP queries by using the `client` Hono middleware.

### Method
POST

### Endpoint
/sql/*

### Parameters
#### Path Parameters
- None

#### Query Parameters
- None

#### Request Body
- None (The middleware handles incoming SQL queries)

### Request Example
None

### Response
#### Success Response (200)
- The response will contain the results of the SQL query executed.

#### Response Example
```json
{
  "data": [
    {
      "column1": "value1",
      "column2": 123
    }
  ]
}
```

### Server Setup Example (src/api/index.ts)
```typescript
import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client } from "ponder";

const app = new Hono();

app.use("/sql/*", client({ db, schema }));

export default app;
```
```

--------------------------------

### Define PostgreSQL Enum Type with Drizzle ORM

Source: https://orm.drizzle.team/docs/column-types/pg

Defines an enumerated type (enum) in PostgreSQL using Drizzle ORM. Enums are static, ordered sets of values. This example shows how to create a 'mood' enum and use it in a table definition.

```typescript
import { pgEnum, pgTable } from "drizzle-orm/pg-core";

export const moodEnum = pgEnum('mood', ['sad', 'ok', 'happy']);

export const table = pgTable('table', {
  mood: moodEnum()
});
```

--------------------------------

### Set up TanStack Query Provider with PonderProvider (TypeScript)

Source: https://ponder.sh/docs/query/sql-over-http

This React snippet demonstrates integrating TanStack Query with PonderProvider. It wraps the application with QueryClientProvider inside PonderProvider, which is necessary if you are not already using TanStack Query.

```typescript
import { PonderProvider } from "@ponder/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { client } from "../lib/ponder";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PonderProvider client={client}>
        {/***** ... *****/}
      </PonderProvider>
    </QueryClientProvider>
  );
}

```

--------------------------------

### Get ENS Name with Custom Universal Resolver Address (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsName

This code snippet demonstrates how to specify a custom address for the ENS Universal Resolver Contract. By overriding the default address with `universalResolverAddress`, you can interact with a specific instance of the resolver, which might be necessary for testing or custom deployments.

```typescript
const ensName = await publicClient.getEnsName({
  address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
  universalResolverAddress: '0x74E20Bd2A1fE0cdbe45b9A1d89cb7e0a45b36376',
})
```

--------------------------------

### Generate New Wallet with Cast

Source: https://book.getfoundry.sh/guides/scripting-with-solidity

Generates a new cryptographic keypair for managing blockchain accounts. The output includes the public address and the corresponding private key, which should be handled with extreme care.

```bash
cast wallet new
```

--------------------------------

### Node.js/React: Live Queries with Ponder Client

Source: https://ponder.sh/docs/query/sql-over-http

Shows how to set up live queries using the Ponder client. This feature automatically streams updates to the client whenever new data changes, typically after a new block is processed. It involves defining a query, a success handler, and an error handler.

```typescript
import { desc } from "@ponder/client";
import * as schema from "../../ponder/schema";

await client.live(
  (db) => db.select().from(schema.account).orderBy(desc(schema.account.balance)),
  (result) => {
    // ... handle result
  },
  (error) => {
    // ... handle error
  },
);
```

--------------------------------

### Eligible Factory Event Signatures

Source: https://ponder.sh/docs/guides/factory

Examples of eligible event signatures for Ponder's factory pattern. The event must emit the child contract address as a named parameter of type 'address'. Eligible events can have indexed or non-indexed parameters, while array or struct types are not supported.

```solidity
// ✅ Eligible. The parameter "child" has type "address" and is non-indexed.
 event ChildContractCreated(address child);

// ✅ Eligible. The parameter "pool" has type "address" and is indexed.
 event PoolCreated(address indexed deployer, address indexed pool, uint256 fee);

// ❌ Not eligible. The parameter "contracts" is an array type, which is not supported.
// Always emit a separate event for each child contract, even if they are created in a batch.
 event ContractsCreated(address[] contracts);

// ❌ Not eligible. The parameter "child" is a struct/tuple, which is not supported.
 struct ChildContract {
  address addr;
 }
 event ChildCreated(ChildContract child);
```

--------------------------------

### MySQL Type Generation with Drizzle ORM

Source: https://orm.drizzle.team/docs/goodies

This snippet demonstrates how to generate TypeScript types for MySQL tables using Drizzle ORM. It uses `mysqlTable` to define the schema and `$inferSelectrInsert` or `InferSelectModel`/`InferInsertModel` for type inference. Ensure Drizzle ORM is installed for this functionality.

```typescript
import { int, text, mysqlTable } from 'drizzle-orm/mysql-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm'

const users = mysqlTable('users', {
  id: int('id').primaryKey(),
  name: text('name').notNull(),
});

type SelectUser = typeof users.$inferSelect;
type InsertUser = typeof users.$inferInsert;

// or
type SelectUser = typeof users._.$inferSelect;
type InsertUser = typeof users._.$inferInsert;

// or
type SelectUser = InferSelectModel;
type InsertUser = InferInsertModel;
```

--------------------------------

### GraphQL Query: Get Account Token Ownership

Source: https://github.com/ponder-sh/ponder/tree/main/examples/reference-erc721

This GraphQL query retrieves all tokens currently owned by a specific account. It requires the account's ID as input and returns a list of token IDs owned by that account. No external dependencies are needed beyond a running GraphQL endpoint for the ERC721 contract.

```graphql
{
  account(id: "0x2B8E4729672613D69e5006a97dD56A455389FB2b") {
    id
    tokens {
      id
    }
  }
}
```

--------------------------------

### Import and use envPaths in JavaScript

Source: https://github.com/sindresorhus/env-paths

This snippet demonstrates how to import and use the envPaths function from the env-paths package in a JavaScript project. It shows the basic usage for obtaining OS-specific paths for data, config, and cache.

```javascript
import envPaths from 'env-paths'

const paths = envPaths('MyApp', { suffix: 'cdot' })

console.log(paths.data)
console.log(paths.config)
console.log(paths.cache)
console.log(paths.log)
console.log(paths.temp)
```

--------------------------------

### Enable eth_call Aggregation - viem

Source: https://viem.sh/docs/clients/public

Demonstrates how to enable and configure 'eth_call' aggregation for a Public Client. By setting 'batch.multicall' to true, multiple 'eth_call' requests can be batched into a single multicall request for optimization.

```typescript
const publicClient = createPublicClient({
  batch: {
    multicall: true,
  },
  chain: mainnet,
  transport: http(),
})
```

--------------------------------

### Read Contract Data Using Ponder Client | TypeScript

Source: https://ponder.sh/docs/0.10/indexing/read-contracts

This example shows how to read data from a contract within a Ponder event handler. It utilizes `context.client.readContract()` to call a contract's `tokenUri` function, passing the ABI, address, method name, and arguments. This pattern is crucial for fetching specific on-chain data needed for application logic.

```typescript
import { ponder } from "ponder:registry";

ponder.on("Blitmap:Mint", async ({ event, context }) => {
  const tokenUri = await context.client.readContract({
    abi: context.contracts.Blitmap.abi,
    address: context.contracts.Blitmap.address,
    method: "tokenUri",
    args: [event.args.tokenId],
  });
});
```

--------------------------------

### Configure Contract Indexing with Specific Block Range in TypeScript

Source: https://ponder.sh/docs/config/contracts

Configures Ponder to index a specific contract within a defined block range. This is useful for historical analysis or to limit the scope of indexing during development. It includes the contract's ABI, chain, address, and the start and end block numbers for indexing.

```typescript
import { createConfig } from "ponder";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  chains: {
    /* ... */
  },
  contracts: {
    Blitmap: {
      abi: BlitmapAbi,
      chain: "mainnet",
      address: "0x8d04a8c79cEB0889Bdd12acdF3Fa9D207eD3Ff63",
      startBlock: 16500000,
      endBlock: 16501000,
    },
  },
});
```

--------------------------------

### Get ENS Name with Block Number (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsName

This code snippet illustrates how to query for an ENS name at a specific historical block number. By providing the `blockNumber` parameter, you can retrieve the ENS name as it was resolved at that particular point in the blockchain history. This is useful for historical data analysis.

```typescript
const ensName = await publicClient.getEnsName({
  address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
  blockNumber: 15121123n,
})
```

--------------------------------

### `client.getStatus` - Indexing Progress

Source: https://ponder.sh/docs/0.10/api-reference/ponder-client

Fetches the indexing progress status for each network.

```APIDOC
## `client.getStatus`

### Description

Fetch the indexing progress of each chain.

### Method

N/A (Method Call on Client Object)

### Endpoint

N/A

### Parameters

N/A

### Request Example

```typescript
import { client, schema } from "../lib/ponder";

const status = await client.getStatus();
console.log("Mainnet indexing status:", status.mainnet);
```

### Response

#### Success Response (200)

- **Status object** - Returns a Promise that resolves to an object containing the indexing status of each network. 
  ```typescript
  type Status = {
    [network: string]: {
      block: { number: number; timestamp: number } | null;
      ready: boolean;
    };
  };
  ```
```

--------------------------------

### SQLite Schema Declaration with Drizzle ORM

Source: https://orm.drizzle.team/docs/schemas

Shows a Drizzle ORM schema declaration for SQLite, creating a 'users' table with an integer ID and text name. This example highlights that SQLite does not support the concept of schemas, so declarations are directly mapped to tables within the default database.

```typescript
import { int, text, sqliteSchema } from "drizzle-orm/sqlite-core";

export const mySchema = sqliteSchema("my_schema")
export const mySchemaUsers = mySchema.table("users", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name"),
});
```

--------------------------------

### Configure Multiple Factories for Same Child Contract - TypeScript

Source: https://ponder.sh/docs/guides/factory

This `ponder.config.ts` example illustrates how to handle scenarios where multiple factory contracts emit events with the same signature and create the same type of child contract. The `factory()` function accepts a list of factory contract addresses. Ponder will then merge the discovered child addresses from all specified factories into a single list for indexing.

```typescript
import { createConfig } from "ponder";
import { parseAbiItem } from "viem";
import { SudoswapPoolAbi } from "./abis/SudoswapPool";

export default createConfig({
  chains: {
    /* ... */
  },
  contracts: {
    SudoswapPool: {
      abi: SudoswapPoolAbi,
      chain: "mainnet",
      address: factory({
        // A list of factory contract addresses that all create SudoswapPool contracts.
        address: [
          "0xb16c1342E617A5B6E4b631EB114483FDB289c0A4",
          "0xb16c1342E617A5B6E4b631EB114483FDB289c0A4",
        ],
        event: parseAbiItem("event NewPair(address poolAddress)"),
        parameter: "poolAddress",
      }),
    },
  },
});
```

--------------------------------

### Simulate Contract Mint with Value | JavaScript

Source: https://viem.sh/docs/contract/simulateContract

Simulates a 'mint' function call, including a specific value in wei to be sent with the transaction. This is used for payable functions.

```javascript
const { result } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  args: [69420],
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  value: parseEther('1')
})
```

--------------------------------

### Find Row by Primary Key using Ponder Store API (TypeScript)

Source: https://ponder.sh/docs/indexing/write

Shows how to retrieve a single row from a Ponder database table using its primary key. This method returns the row object if found, or null otherwise. Examples cover both single and composite primary keys.

```typescript
import { accounts } from "ponder:schema";

const row = await db.find(accounts, { address: "0x7Df1" });

```

```typescript
import { allowances } from "ponder:schema";

const row = await db.find(allowances, { owner: "0x7Df1", spender: "0x7Df2" });

```

--------------------------------

### PostgreSQL Foreign Key ON DELETE SET NULL Example

Source: https://www.postgresql.org/docs/current/ddl-constraints.html

Demonstrates how to use ON DELETE SET NULL for a foreign key constraint, specifically targeting the 'author_id' column. This action sets the specified column to NULL when the referenced row is deleted, and requires explicit column specification for clarity when primary keys are involved.

```sql
CREATE TABLE tenants (
  tenant_id integer PRIMARY KEY
);
CREATE TABLE users (
  tenant_id integer REFERENCES tenants ON DELETE CASCADE,
  user_id integer NOT NULL,
  PRIMARY KEY (tenant_id, user_id)
);
CREATE TABLE posts (
  tenant_id integer REFERENCES tenants ON DELETE CASCADE,
  post_id integer NOT NULL,
  author_id integer,
  PRIMARY KEY (tenant_id, post_id),
  FOREIGN KEY (tenant_id, author_id) REFERENCES users ON DELETE SET NULL (author_id)
);
```

--------------------------------

### Advanced Full-Text Search with SQL WHERE

Source: https://orm.drizzle.team/docs/sql

Provides an example of using the `sql` template tag for advanced filtering, specifically implementing full-text search within the `where` clause of a Drizzle ORM query. This showcases how to embed database-specific functions like `to_tsvector` and `to_tsquery` for powerful text searching capabilities.

```typescript
import { sql } from 'drizzle-orm'
import { usersTable } from 'schema'

const searchParam = "Ale";
await db.select()
  .from(usersTable)
  .where(sql`to_tsvector('simple', ${usersTable.name}) @@ to_tsquery('simple', ${searchParam})`);
```

--------------------------------

### Handle Blitmap:Mint Event with Specific Block Number (TypeScript)

Source: https://ponder.sh/docs/0.10/indexing/read-contracts

This example shows how to handle the 'Blitmap:Mint' event and read the 'totalSupply' function from the Blitmap contract at a specific block height (15439123n). Ponder caches these requests, ensuring efficiency even with specific block number reads.

```typescript
import { ponder } from "ponder:registry";

ponder.on("Blitmap:Mint", async ({ event, context }) => {
  const totalSupply = await context.client.readContract({
    abi: context.contracts.Blitmap.abi,
    address: context.contracts.Blitmap.address,
    functionName: "totalSupply",
    blockNumber: 15439123n,
  });
});
```

--------------------------------

### Get ENS Address with Block Tag in viem (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAddress

This code snippet illustrates how to fetch an ENS address at a specific block tag using the `getEnsAddress` function in viem. By setting the `blockTag` parameter to values like 'latest', 'safe', or 'finalized', you can query the ENS resolution state at a particular point in the blockchain's history.

```typescript
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const ensAddress = await publicClient.getEnsAddress({
  name: normalize('wevm.eth'),
  blockTag: 'safe',
})
```

--------------------------------

### Simulate Contract Mint with maxPriorityFeePerGas | JavaScript

Source: https://viem.sh/docs/contract/simulateContract

Simulates a 'mint' function call with defined maximum priority fee per gas for EIP-1559 transactions. This controls the tip paid to miners.

```javascript
const { result } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  args: [69420],
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  maxFeePerGas: parseGwei('20'),
  maxPriorityFeePerGas: parseGwei('2')
})
```

--------------------------------

### Simulate Contract Write (TypeScript)

Source: https://viem.sh/docs/contract/simulateContract

This snippet demonstrates the basic usage of `simulateContract` to simulate a write function on a contract without arguments. It requires a public client, contract ABI, function name, and account details. The function returns the result of the simulation.

```typescript
import { account, publicClient } from './config'
import { wagmiAbi } from './abi'

const { result } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  account,
})

```

--------------------------------

### Get ENS Avatar at a specific block tag (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAvatar

Demonstrates fetching an ENS avatar using a block tag like 'safe' or 'finalized'. This allows for more predictable reads by targeting blocks that have reached a certain confirmation level, rather than potentially unstable 'latest' blocks. Other valid tags include 'earliest', 'pending', and 'finalized'.

```typescript
import { normalize } from 'viem/ens';
import { publicClient } from './client';

const ensText = await publicClient.getEnsAvatar({
  name: normalize('wevm.eth'),
  blockTag: 'safe',
});
```

--------------------------------

### Acquire and Use a Client from a PostgreSQL Pool (JavaScript)

Source: https://node-postgres.com/apis/pool

Demonstrates how to acquire a client from a connection pool, execute a query, and release the client back to the pool. It highlights the asynchronous nature of acquiring clients and the necessity of releasing them.

```javascript
import { Pool } from 'pg'
const pool = new Pool()
const client = await pool.connect()
await client.query('SELECT NOW()')
client.release()
```

--------------------------------

### Parsing SQL with libpg_query (C)

Source: https://github.com/pganalyze/libpg_query

This C code snippet demonstrates how to parse an SQL query using the libpg_query library. It takes a SQL string as input and returns a structured representation of the query. Dependencies include the libpg_query library itself. This is useful for analyzing SQL syntax and structure.

```c
#include <stdio.h>
#include <stdlib.h>
#include "pg_query.h"

int main() {
    const char *sql = "SELECT * FROM users WHERE id = 1;";
    pg_query_parse_result *result = pg_query_parse(sql);

    if (result->error_message) {
        fprintf(stderr, "Error parsing SQL: %s\n", result->error_message);
        pg_query_free_parse_result(result);
        return 1;
    }

    // Process the parsed query structure (result->parse_tree)
    printf("SQL parsed successfully.\n");

    pg_query_free_parse_result(result);
    return 0;
}
```

--------------------------------

### Call Factory Contract Child from Different Contract Event (TypeScript)

Source: https://ponder.sh/docs/0.10/indexing/read-contracts

This example shows how to call a child contract of a factory contract when the event originates from a different contract. It retrieves the child contract's address from `event.args.pool` and then uses `context.contracts.SudoswapPool.abi` to call the 'totalSupply' function on that specific child contract.

```typescript
import { ponder } from "ponder:registry";

ponder.on("LendingProtocol:RegisterPool", async ({ event, context }) => {
  const totalSupply = await context.client.readContract({
    abi: context.contracts.SudoswapPool.abi,
    address: event.args.pool,
    functionName: "totalSupply",
  });
});
```

--------------------------------

### Get ENS Address with Gateway URLs in viem (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAddress

This snippet demonstrates how to specify custom gateway URLs for resolving CCIP-Read requests when using `getEnsAddress` in viem. By providing an array of gateway URLs, you can direct the ENS Universal Resolver Contract to use specific endpoints for name resolution.

```typescript
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const ensAddress = await publicClient.getEnsAddress({
  name: normalize('wevm.eth'),
  gatewayUrls: ["https://ccip.ens.xyz"],
})
```

--------------------------------

### Solidity Visibility: External vs. Internal Access

Source: https://docs.soliditylang.org/en/latest/contracts.html

Illustrates how 'public' and 'internal' visibility specifiers control contract interactions. External calls can access public functions, while internal functions are only callable by derived contracts. This example shows attempted calls that would fail due to visibility restrictions.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract C {
  uint private data;

  function f(uint a) private pure returns(uint b) {
    return a + 1;
  }

  function setData(uint a) public {
    data = a;
  }

  function getData() public view returns(uint) {
    return data;
  }

  function compute(uint a, uint b) internal pure returns (uint) {
    return a + b;
  }
}

// This will not compile
contract D {
  function readData() public {
    C c = new C();
    uint local = c.f(7); // error: member `f` is not visible
    c.setData(3);
    local = c.getData();
    local = c.compute(3, 5); // error: member `compute` is not visible
  }
}

contract E is C {
  function g() public {
    C c = new C();
    uint val = compute(3, 5); // access to internal member (from derived to parent contract)
  }
}
```

--------------------------------

### Read Contract Balance of using `readContract` with Arguments

Source: https://viem.sh/docs/contract/readContract

This snippet illustrates reading the `balanceOf` function from a contract. It includes specifying the contract address, ABI, function name, and the required arguments for the function call.

```typescript
const data = await publicClient.readContract({
  address: '0x1dfe7ca09e99d10835bf73044a23b73fc20623df',
  abi: wagmiAbi,
  functionName: 'balanceOf',
  args: ['0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC']
})
```

--------------------------------

### Register SQL client middleware (Hono)

Source: https://ponder.sh/docs/0.10/query/sql-client

Enables SQL client queries by using the 'client' Hono middleware. This middleware requires the database connection and schema definitions. It is typically set up in the API's entry point file.

```typescript
import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client } from "ponder";

const app = new Hono();
app.use("/sql/*", client({ db, schema }));

export default app;
```

--------------------------------

### Set Public Client Key

Source: https://viem.sh/docs/clients/public

Assigns a unique string key to the client instance. Useful for managing multiple clients.

```javascript
const publicClient = createPublicClient({
  chain: mainnet,
  key: 'public',
  transport: http(),
})
```

--------------------------------

### Define Ponder Database Schema (TypeScript)

Source: https://github.com/ponder-sh/ponder

This TypeScript code defines the database schema for Ponder using the `onchainTable` function. It specifies the table name (`ens_name`) and the structure of the data to be stored, including primary keys and non-null constraints for fields like `name`, `owner`, and `registeredAt`. This schema dictates the shape of data available through the GraphQL API.

```typescript
import { onchainTable } from "ponder";

export const ensName = onchainTable("ens_name", (t) => ({
  name: p.text().primaryKey(),
  owner: p.text().notNull(),
  registeredAt: p.integer().notNull(),
}));
```

--------------------------------

### Get ENS Avatar in strict mode (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAvatar

Enables strict error propagation when fetching an ENS avatar. When `strict` is set to `true`, any errors encountered during the resolution process by the ENS Universal Resolver Contract will be strictly propagated, providing more detailed feedback for debugging. The default value is `false`.

```typescript
import { normalize } from 'viem/ens';
import { publicClient } from './client';

const ensText = await publicClient.getEnsAvatar({
  name: normalize('wevm.eth'),
  strict: true,
});
```

--------------------------------

### Polling and RPC Schema Configuration

Source: https://viem.sh/docs/clients/public

Configure the polling interval for actions and define a custom RPC schema for typed JSON-RPC requests.

```APIDOC
### pollingInterval (optional)

*   **Type:** `number`
*   **Default:** `4000`

Frequency (in milliseconds) at which polling-enabled actions will check for updates.

```javascript
import { createPublicClient, http }
from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  chain: mainnet,
  pollingInterval: 10000, // Example: Poll every 10 seconds
  transport: http(),
})
```

### rpcSchema (optional)

*   **Type:** `RpcSchema`
*   **Default:** `PublicRpcSchema`

Defines the typed JSON-RPC schema for the client. Allows for custom RPC methods and their parameters/return types.

```javascript
import { createPublicClient, http, rpcSchema }
from 'viem'
import { mainnet } from 'viem/chains'

// Define a custom RPC schema
type CustomRpcSchema = [
  {
    Method: 'eth_wagmi',
    Parameters: [string]
    ReturnType: string
  }
]

const publicClient = createPublicClient({
  chain: mainnet,
  rpcSchema: rpcSchema() as unknown as CustomRpcSchema, // Use custom schema
  transport: http(),
})

// Example of using the custom RPC method
const result = await publicClient.request({
  method: 'eth_wagmi',
  params: ['hello'],
})

console.log(result) // Should log the result of 'eth_wagmi'
```
```

--------------------------------

### Define One-to-One Relation (User to ProfileInfo) with Drizzle ORM

Source: https://orm.drizzle.team/docs/relations

Illustrates a one-to-one relation where a user has associated profile information stored in a separate table. This example shows how to define the relation when the foreign key is in the 'profile_info' table, making 'user.profileInfo' potentially null. It includes the definition of both 'users' and 'profileInfo' tables and their respective relations.

```typescript
import { pgTable, serial, text, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
});

export const usersRelations = relations(users, ({ one }) => ({
  profileInfo: one(profileInfo),
}));

export const profileInfo = pgTable('profile_info', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  metadata: jsonb('metadata'),
});

export const profileInfoRelations = relations(profileInfo, ({ one }) => ({
  user: one(users, {
    fields: [profileInfo.userId],
    references: [users.id]
  }),
}));

// Example usage inferred from context:
// const user = await queryUserWithProfileInfo();
// type { id: number, profileInfo: { ... } | null }
```

--------------------------------

### Get ENS Avatar using Universal Resolver gateways (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAvatar

Retrieves an ENS avatar by specifying a list of Universal Resolver gateways. This is crucial for resolving CCIP-Read requests, allowing the ENS Universal Resolver Contract to fetch data from various external sources. The `gatewayUrls` parameter takes an array of gateway URLs.

```typescript
import { normalize } from 'viem/ens';
import { publicClient } from './client';

const ensText = await publicClient.getEnsAvatar({
  name: normalize('wevm.eth'),
  gatewayUrls: ["https://ccip.ens.xyz"],
});
```

--------------------------------

### Enable SQL over HTTP Server Middleware (TypeScript)

Source: https://ponder.sh/docs/query/sql-over-http

This snippet shows how to enable SQL over HTTP queries on the server using the client Hono middleware. It requires importing 'db' and 'schema' from 'ponder:api' and 'ponder:schema' respectively, and the Hono framework.

```typescript
import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client } from "ponder";

const app = new Hono();
app.use("/sql/*", client({ db, schema }));

export default app;

```

--------------------------------

### GraphQL Query: Get Token Owner and Transfer Events

Source: https://github.com/ponder-sh/ponder/tree/main/examples/reference-erc721

This GraphQL query fetches details for a specific token, including its current owner and all associated transfer events. It requires the token's ID as input and returns the owner's ID and a list of transfer events with their from, to, and timestamp details. This query is useful for tracking the history of a particular NFT.

```graphql
{
  token(id: "7777") {
    owner {
      id
    }
    transferEvents {
      from
      to
      timestamp
    }
  }
}
```

--------------------------------

### Troubleshoot 'tsc' not recognized error in VS Code

Source: https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it

This command snippet represents a batch file command that might be renamed to resolve the 'tsc' not recognized error in VS Code. Renaming 'tsc1.cmd' back to 'tsc.cmd' can fix issues with VS Code recognizing the globally installed TypeScript compiler.

```batch
tsc.cmd
```

--------------------------------

### Define One-to-Many Relation (Post to Comments) with Drizzle ORM

Source: https://orm.drizzle.team/docs/relations

Extends the previous example to include comments on posts, demonstrating a one-to-many relationship. It adds the 'comments' table and updates the 'postsRelations' to include a 'comments: many(comments)' definition. The 'commentsRelations' then defines a 'one' relation back to the 'posts' table for each comment.

```typescript
import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Assuming 'users' and 'usersRelations' are defined as in the previous example

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  content: text('content'),
  authorId: integer('author_id'),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  // author: one(users, { fields: [posts.authorId], references: [users.id] }), // Assuming this is defined elsewhere
  comments: many(comments)
}));

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  text: text('text'),
  authorId: integer('author_id'),
  postId: integer('post_id'),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));
```

--------------------------------

### Get ENS Text Record with viem

Source: https://viem.sh/docs/ens/actions/getEnsText

Retrieves a specific text record for a given ENS name using the viem public client. It requires normalizing the ENS name and specifying the desired key. The function returns the text record as a string or null if no record is found. Optional parameters allow for specifying block details, gateway URLs, strict error propagation, and the Universal Resolver contract address.

```typescript
import { normalize } from 'viem/ens'
import { publicClient } from './client'

const ensText = await publicClient.getEnsText({
  name: normalize('wevm.eth'),
  key: 'com.twitter',
})
```

```typescript
const ensText = await publicClient.getEnsText({
  name: normalize('wevm.eth'),
  key: 'com.twitter',
  blockNumber: 15121123n,
})
```

```typescript
const ensText = await publicClient.getEnsText({
  name: normalize('wevm.eth'),
  key: 'com.twitter',
  blockTag: 'safe',
})
```

```typescript
const ensText = await publicClient.getEnsText({
  name: normalize('wevm.eth'),
  key: 'com.twitter',
  gatewayUrls: ["https://ccip.ens.xyz"],
})
```

```typescript
const ensText = await publicClient.getEnsText({
  name: normalize('wevm.eth'),
  key: 'com.twitter',
  strict: true,
})
```

```typescript
const ensText = await publicClient.getEnsText({
  name: normalize('wevm.eth'),
  key: 'com.twitter',
  universalResolverAddress: '0x74E20Bd2A1fE0cdbe45b9A1d89cb7e0a45b36376',
})
```

--------------------------------

### Drizzle Schema with Explicit Foreign Key Constraint and Actions (TypeScript)

Source: https://orm.drizzle.team/docs/relations

An alternative method for defining foreign key actions in Drizzle ORM using the `foreignKey` operator. This example explicitly defines a foreign key constraint named 'author_fk' on the 'posts' table, specifying both ON DELETE and ON UPDATE cascade actions.

```typescript
import { foreignKey, pgTable, serial, text, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  name: text('name'),
  author: integer('author').notNull(),
}, (table) => [
  foreignKey({
    name: "author_fk",
    columns: [table.author],
    foreignColumns: [users.id],
  })
  .onDelete('cascade')
  .onUpdate('cascade')
]);
```

--------------------------------

### PostgreSQL COPY Command Syntax

Source: https://www.postgresql.org/docs/current/sql-copy.html

This snippet outlines the general syntax for the PostgreSQL COPY command, which supports copying data between tables and files or program execution.

```sql
COPY _table_name_ [ (_column_name_ [, ...]) ] FROM { '_filename_' | PROGRAM '_command_' | STDIN } [ [ WITH ] ( _option_ [, ...] ) ] [ WHERE _condition_ ]
COPY { _table_name_ [ (_column_name_ [, ...]) ] | (_query_) } TO { '_filename_' | PROGRAM '_command_' | STDOUT } [ [ WITH ] ( _option_ [, ...] ) ]
```

--------------------------------

### Configure Event Filtering by Indexed Parameter in TypeScript

Source: https://ponder.sh/docs/config/contracts

Sets up Ponder to index events from a contract while filtering for specific indexed parameter values. This example configures the USDC contract to only index 'Transfer' events where the 'from' address matches a specific value (e.g., Binance 14 exchange address). This reduces the amount of data indexed by focusing on relevant events.

```typescript
import { createConfig } from "ponder";
import { ERC20Abi } from "./abis/ERC20";

export default createConfig({
  chains: {
    /* ... */
  },
  contracts: {
    USDC: {
      abi: ERC20Abi,
      chain: "mainnet",
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      // USDC
      filter: {
        event: "Transfer",
        args: {
          from: "0x28c6c06298d514db089934071355e5743bf21d60", // Binance 14
        },
      },
    },
  },
});
```

--------------------------------

### Configure Ponder Factory Contract - TypeScript

Source: https://ponder.sh/docs/guides/factory

This snippet demonstrates how to configure a factory contract in Ponder using `ponder.config.ts`. It specifies the ABI, chain, the factory contract's address, the event that emits child addresses, and the parameter name for the child address. It also sets the `startBlock` for indexing. This configuration allows Ponder to dynamically discover and index child contracts created by the factory.

```typescript
import { createConfig, factory } from "ponder";
import { parseAbiItem } from "viem";
import { SudoswapPoolAbi } from "./abis/SudoswapPool";

export default createConfig({
  chains: {
    /* ... */
  },
  contracts: {
    SudoswapPool: {
      abi: SudoswapPoolAbi,
      chain: "mainnet",
      address: factory({
        // Address of the factory contract.
        address: "0xb16c1342E617A5B6E4b631EB114483FDB289c0A4",
        // Event from the factory contract ABI which contains the child address.
        event: parseAbiItem("event NewPair(address poolAddress)"),
        // Name of the event parameter containing the child address.
        parameter: "poolAddress",
      }),
      startBlock: 14645816,
    },
  },
});
```

--------------------------------

### React Query: Array Key Order Sensitivity

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

Highlights that the order of items in an array query key matters. Unlike object keys, different array orders will result in distinct query keys, leading to separate cache entries. This example shows query keys that are not considered equal due to differing array item order.

```typescript
useQuery({ queryKey: ['todos', status, page], ... })
useQuery({ queryKey: ['todos', page, status], ...})
useQuery({ queryKey: ['todos', undefined, page, status], ...})
```

--------------------------------

### Get ENS Avatar at a specific block number (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAvatar

Shows how to retrieve an ENS avatar as it existed at a particular block number. This is useful for historical lookups or when interacting with smart contracts that depend on state at a specific point in the blockchain history. The `blockNumber` parameter accepts a bigint representing the block number.

```typescript
import { normalize } from 'viem/ens';
import { publicClient } from './client';

const ensText = await publicClient.getEnsAvatar({
  name: normalize('wevm.eth'),
  blockNumber: 15121123n,
});
```

--------------------------------

### Solidity Internal vs. External Access to Public State Variables

Source: https://docs.soliditylang.org/en/latest/contracts.html

Explains the distinction between internal and external access to public state variables in Solidity. Internal access (without 'this.') refers to the state variable directly, while external access (with 'this.') calls the auto-generated getter function. This example demonstrates this behavior.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

contract C {
  uint public data;

  function x() public returns (uint) {
    data = 3; // internal access
    return this.data(); // external access
  }
}
```

--------------------------------

### Pretty Log Format (Ponder CLI)

Source: https://ponder.sh/docs/0.10/advanced/observability

Enable the default 'pretty' log format for Ponder's output using the '--log-format' CLI option. This format provides human-readable logs in the terminal.

```bash
ponder start --log-format pretty
```

--------------------------------

### Deployless Call via Bytecode with viem

Source: https://viem.sh/docs/actions/public/call

Performs a deployless call using contract bytecode to interact with a contract that has not yet been deployed. This is useful for calling functions on contracts like ERC-4337 Smart Accounts before deployment. It requires encoding the function data using `encodeFunctionData` and parsing the ABI using `parseAbi`.

```typescript
import { encodeFunctionData, parseAbi } from 'viem'
import { publicClient } from './config'

const data = await publicClient.call({
  // Bytecode of the contract. Accessible here: https://etherscan.io/address/0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2#code
  code: '0x...', 
  // Function to call on the contract.
  data: encodeFunctionData({
    abi: parseAbi(['function name() view returns (string)']),
    functionName: 'name',
  }),
})
```

--------------------------------

### Update Row by Primary Key using Ponder Store API (TypeScript)

Source: https://ponder.sh/docs/indexing/write

Demonstrates updating a row in a Ponder database table based on its primary key. It covers updating with static values and dynamically updating based on the existing row's data. An example of an error scenario where the target row is not found is also included.

```typescript
import { accounts } from "ponder:schema";

const row = await db
  .update(accounts, { address: "0x7Df1" })
  .set({ balance: 100n });

```

```typescript
import { accounts } from "ponder:schema";

const row = await db
  .update(accounts, { address: "0x7Df1" })
  .set((row) => ({ balance: row.balance + 100n }));

```

```typescript
import { tokens } from "ponder:schema";

const row = await db
  .update(tokens, { id: "0xabc" })
  .set({ name: "New Token Name" });
// Error: Row with primary key "0xabc" not found.

```

--------------------------------

### Configure Ponder with Foundry Deployment Artifacts (TypeScript)

Source: https://ponder.sh/docs/guides/foundry

This TypeScript code snippet shows how to create a Ponder configuration. It imports deployment artifacts from a Foundry broadcast file, enabling Ponder to index contract data deployed using Foundry. The configuration is initialized using `createConfig`.

```typescript
import { createConfig } from "ponder";
import CounterDeploy from "../foundry/broadcast/Deploy.s.sol/31337/run-latest.json";

// The development server detects changes to this file and triggers a hot reload.
export default createConfig({
  // ...
});
```

--------------------------------

### Solidity Transient Storage for Multiplier Calculation

Source: https://docs.soliditylang.org/en/latest/contracts.html

This example illustrates a potential composability issue when using transient storage. The `MulService` contract uses a transient `multiplier` variable. If calls to `setMultiplier` and `multiply` are not within the same transaction, the `multiply` function will not use the updated multiplier, highlighting the difference in state persistence compared to memory or storage.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

contract MulService {
    uint transient multiplier;

    function setMultiplier(uint mul) external {
        multiplier = mul;
    }

    function multiply(uint value) external view returns (uint) {
        return value * multiplier;
    }
}
```

--------------------------------

### Execute Contract Call with Nonce (JavaScript)

Source: https://viem.sh/docs/actions/public/call

This snippet demonstrates specifying a transaction nonce, which must be unique for each transaction sent from an account. This prevents replay attacks. Requires `publicClient` and a `nonce` as a bigint.

```javascript
const data = await publicClient.call({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  nonce: 420,
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

--------------------------------

### Import HTTP Transport Function - viem

Source: https://viem.sh/docs/clients/transports/http

Demonstrates how to import the `http` function from the 'viem' library, which is essential for creating an HTTP transport for a viem client.

```typescript
import { http } from 'viem'
```

--------------------------------

### JavaScript Cache Key Generation and Handling

Source: https://github.com/ponder-sh/ponder/pull/1522

Demonstrates functions for generating cache keys and checking cache status in JavaScript. It handles cases where the cache might be incomplete and utilizes a Map for caching. This code is relevant for optimizing data retrieval and storage.

```javascript
// { backslash: "\00" },
// { backslash: "\x00" }
```

```javascript
has({ table, key }) {
  if (isCacheComplete) return true;
  const ck = getCacheKey(table, key, primaryKeyCache);
```

```javascript
key: object,
  cache?: Map,
): string => {
  if (cache) {
```

--------------------------------

### Enable GraphQL API with Hono Middleware - TypeScript

Source: https://ponder.sh/docs/query/graphql

This snippet shows how to enable the Ponder GraphQL API by registering the `graphql` Hono middleware in your Hono application. It imports necessary components from Ponder and Hono, sets up the application, and registers the middleware at the `/graphql` endpoint. Visiting this endpoint in a browser provides a GraphiQL interface for schema exploration and query testing.

```typescript
import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { graphql } from "ponder";

const app = new Hono();

app.use("/graphql", graphql({ db, schema }));

export default app;

```

--------------------------------

### React Integration with @ponder/react

Source: https://ponder.sh/docs/query/sql-over-http

Utilize the `@ponder/react` package to integrate Ponder database querying into your React application using hooks, powered by TanStack Query.

```APIDOC
## React Integration with `@ponder/react`

### Description
This guide explains how to integrate Ponder's SQL over HTTP querying into your React application using the `@ponder/react` package, which leverages TanStack Query for state management.

### Setup
1.  **Set up `@ponder/client`**: Follow the client setup instructions above.
2.  **Install dependencies**:
    ```bash
    pnpm add @ponder/react @ponder/client @tanstack/react-query
    ```
3.  **Set up `PonderProvider`**:
    Wrap your application with `PonderProvider` and provide your `@ponder/client` instance.
    ```typescript
    import { PonderProvider } from "@ponder/react";
    import { client } from "../lib/ponder"; // Your Ponder client instance

    function App() {
      return (
        <PonderProvider client={client}>
          {/* Your app components */}
        </PonderProvider>
      );
    }
    ```
4.  **Set up TanStack Query**:
    If you are not already using TanStack Query, wrap your `PonderProvider` with `QueryClientProvider`.
    ```typescript
    import { PonderProvider } from "@ponder/react";
    import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
    import { client } from "../lib/ponder"; // Your Ponder client instance

    const queryClient = new QueryClient();

    function App() {
      return (
        <QueryClientProvider client={queryClient}>
          <PonderProvider client={client}>
            {/* Your app components */}
          </PonderProvider>
        </QueryClientProvider>
      );
    }
    ```

### Querying
Use the provided hooks and the client instance to query your Ponder database. Refer to the Ponder documentation for specific querying patterns like live queries, untyped queries, pagination, and the relational query builder.
```

--------------------------------

### QueryClientProvider

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-functions

Provides the QueryClient instance to the React component tree.

```APIDOC
## QueryClientProvider

### Description
Provides the `QueryClient` instance to your React component tree. This allows all components within the tree to access and use the query client.

### Method
N/A (React Component)

### Endpoint
N/A (React Component)

### Parameters
- **client** (QueryClient) - Required - The QueryClient instance to provide.

### Request Example
```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MyComponent />
    </QueryClientProvider>
  );
}
```

### Response
N/A
```

--------------------------------

### Get ENS Avatar using viem (TypeScript)

Source: https://viem.sh/docs/ens/actions/getEnsAvatar

Retrieves the avatar URI for a given ENS name using the viem library's public client. This function internally calls `getEnsText` with the key set to 'avatar'. Normalizing ENS names with UTS-46 is recommended before use. It returns the avatar URI as a string or null if not found.

```typescript
import { normalize } from 'viem/ens';
import { publicClient } from './client';

const ensText = await publicClient.getEnsAvatar({
  name: normalize('wevm.eth'),
});
// 'https://ipfs.io/ipfs/Qma8mnp6xV3J2cRNf3mTth5C8nV11CAnceVinc3y8jSbio'
```

--------------------------------

### ESLint Plugin Query: Recommended Rules

Source: https://tanstack.com/query/latest/docs/framework/react/quick-start

The ESLint Plugin Query provides rules to enforce best practices when using TanStack Query. The recommended configuration enables a set of rules to help catch common errors and improve code quality related to query keys, dependencies, and more.

```javascript
// .eslintrc.js or .eslintrc.json
module.exports = {
  // ... other configurations
  plugins: [
    '@tanstack/query',
    // ... other plugins
  ],
  extends: [
    // ... other extends
    'plugin:@tanstack/query/recommended',
  ],
  // ... other configurations
}
```

--------------------------------

### Viewing Error Logs in Railway

Source: https://railway.app/

This snippet illustrates how error logs are presented within the Railway platform. It shows specific error messages, the service they originated from, timestamps, and stack traces, aiding in debugging.

```text
Error logs
Error: No route matches URL "/contact/"
frontendSep 12 14:56:49 at getInternalRouterError (/app/node_modules/.pnpm/@remix-run+router@1.16.1/node_modules/@remix-run/router/router.ts:4843:5) frontendSep 12 14:56:49 at Object.query (/app/node_modules/.pnpm/@remix-run+router@1.16.1/node_modules/@remix-run/router/router.ts:3037:19) frontendSep 12 14:56:49 at /app/node_modules/.pnpm/@remix-run+express@2.9.2_express@4.19.2_typescript@5.1.6/node_modules/@remix-run/express/dist/server.js:41:2frontendSep 12 14:56:49Error: No route matches URL "//test/wp-includes/wlwmanifest.xml"
cmsSep 13 11:48:32 at getInternalRouterError (/app/node_modules/.pnpm/@remix-run+router@1.16.1/node_modules/@remix-run/router/router.ts:4843:5)cmsSep 13 11:48:32 at Object.query (/app/node_modules/.pnpm/@remix-run+router@1.16.1/node_modules/@remix-run/router/router.ts:3037:19)cmsSep 13 11:48:32 at handleDocumentRequest (/app/node_modules/.pnpm/@remix-run+server-runtime@2.9.2_typescript@5.1.6/node_modules/@remix-run/server-runticmsSep 13 11:48:32 at requestHandler (/app/node_modules/.pnpm/@remix-run+server-runtime@2.9.2_typescript@5.1.6/node_modules/@remix-run/server-runtime/distcmsSep 13 11:48:32Date (GMT-6)ServiceMessageArchitectureObservabilityLogsSettingsSharebackyard-rocketshipproductionAdd ItemName this item...+ Add DescriptionCPU UsageError Logs2.5 vCPU2.0 vCPU1.5 vCPU1.0 vCPU0.5 vCPU0 vCPUSep 4Sep 7Sep 10Sep 13upstream image response failed for https://prod-files-secure.s3.us-west-2.amahugoSep 13 11:48:32upstream image response failed for https://prod-files-secure.s3.us-west-2.amahugoSep 13 11:48:32https://prod-files-secure.s3.us-west-2.amazoupstream image response failed for docsSep 12 13:39:21https://prod-files-secure.s3.us-west-2.amazoupstream image response failed for docsSep 12 13:39:29Error: No route matches URL "/contact/"
frontendSep 12 14:56:49 at getInternalRouterError (/app/node_modules/.pnpm/@remix-run+router@1.16.1frontendSep 12 14:56:49 at Object.query (/app/node_modules/.pnpm/@remix-run+router@1.16.1/node_modufrontendSep 12 14:56:49 at /app/node_modules/.pnpm/@remix-run+express@2.9.2_express@4.19.2_typescrifrontendSep 12 14:56:49Error: No route matches URL "//test/wp-includes/wlwmanifest.xml"
cmsSep 13 11:48:32 at getInternalRouterError (/app/node_modules/.pnpm/@remix-run+router@1.16.1cmsSep 13 11:48:32 at Object.query (/app/node_modules/.pnpm/@remix-run+router@1.16.1/node_moducmsSep 13 11:48:32 at handleDocumentRequest (/app/node_modules/.pnpm/@remix-run+server-runtimecmsSep 13 11:48:32 at requestHandler (/app/node_modules/.pnpm/@remix-run+server-runtime@2.9.2_cmsSep 13 11:48:32Date (GMT -6)ServiceMessageCPULogsall@service:error@level:New ItemCPUMemoryNetworkDiskLogsProject Stats
```

--------------------------------

### Fetch Whale Balances from Ponder Database

Source: https://ponder.sh/docs/api-reference/ponder-utils

This snippet demonstrates fetching 'whale balances' (ETH and DOGE) for a given address from the Ponder database. It uses Ponder's ORM to select specific columns and applies a utility function to replace BigInt values with their hexadecimal representations. Dependencies include '@ponder/utils' for data transformation and 'viem' for number conversion.

```typescript
import { ponder } from "ponder:core";
import { accounts } from "ponder:schema";
import { replaceBigInts } from "@ponder/utils";
import { numberToHex } from "viem";

ponder.get("/whale-balances", async (c) => {
  const rows = await c.db
    .select({
      address: accounts.address,
      ethBalance: accounts.ethBalance,
      dogeBalance: accounts.dogeBalance,
    })
    .from(accounts)
    .where(eq(accounts.address, address));

  const result = replaceBigInts(rows, (v) => numberToHex(v));
  return c.json(result);
});
```

--------------------------------

### Logfmt with Tags for Machine Searchability

Source: https://brandur.org/logfmt

Shows how to use the 'tag' field in logfmt to make log lines easily searchable by machines.

```logfmt
info | Stopping all fetchers tag=stopping_fetchers module=kafka.consumer.ConsumerFetcherManager
```

```logfmt
info | Performing log compaction tag=log_compaction module=kafka.compacter.LogCompactionManager
```

```logfmt
info | Performing garbage collection tag=garbage_collection module=kafka.cleaner.GarbageCollectionManager
```

```logfmt
info | Starting all fetchers tag=starting_fetchers module=kafka.consumer.ConsumerFetcherManager
```

--------------------------------

### Simulate Contract Mint with Nonce | JavaScript

Source: https://viem.sh/docs/contract/simulateContract

Simulates a 'mint' function call, specifying a particular nonce for the transaction. This is crucial for ensuring transaction ordering and preventing replays.

```javascript
const { result } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  args: [69420],
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  nonce: 69
})
```

--------------------------------

### Prepared Statement with 'limit' Placeholder (MySQL/SQLite)

Source: https://orm.drizzle.team/docs/rqb

Shows how to create a prepared statement for fetching users and their posts, using a placeholder named 'limit' to control the number of posts returned. This is suitable for MySQL and SQLite.

```typescript
const prepared = db.query.users.findMany({
  with: {
    posts: {
      limit: placeholder('limit'),
    },
  },
}).prepare();

const usersWithPosts = await prepared.execute({ limit: 1 });
```

--------------------------------

### Configure Polling Interval in Ponder (TypeScript)

Source: https://ponder.sh/docs/config/chains

The `pollingInterval` option in Ponder's `createConfig` function determines how often the indexing engine checks for new blocks in milliseconds. The default is 1000ms (1 second). Setting this value higher than the chain's block time does not reduce RPC usage. This example demonstrates setting the polling interval to 2000ms for the `mainnet` chain.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1,
      pollingInterval: 2_000, // 2 seconds
    },
  },
});
```

--------------------------------

### Advanced Querying with Drizzle Utilities

Source: https://ponder.sh/docs/0.10/api-reference/ponder-client

Illustrates advanced database querying using a combination of Drizzle utility functions exported by @ponder/client, including 'and', 'gte', 'eq', and 'desc' for complex filtering and ordering.

```typescript
import { client, schema } from "../lib/ponder";
import { eq, gte, and, desc } from "@ponder/client";

const result = await client.db
  .select()
  .from(schema.transfers)
  .where(
    and(
      gte(schema.transfers.value, 1000000n),
      eq(schema.transfers.from, "0x123...")
    )
  )
  .orderBy(desc(schema.transfers.blockNumber));
```

--------------------------------

### Add ETag and Logger Middleware - Hono (TypeScript)

Source: https://hono.dev/docs

This snippet demonstrates how to add ETag and request logging middleware to a Hono application using TypeScript. It requires the 'hono/etag' and 'hono/logger' packages. The code initializes a Hono app and applies these middleware functions globally.

```typescript
import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { logger } from 'hono/logger'

const app = new Hono()

app.use(etag(), logger())

```

--------------------------------

### React Query Hook: useInfiniteQuery

Source: https://tanstack.com/query/latest/docs/framework/react/quick-start

The `useInfiniteQuery` hook is designed for fetching paginated data. It manages fetching subsequent pages, loading states for each page, and provides functions to fetch more data. It's ideal for infinite scroll or load-more patterns.

```javascript
import { useInfiniteQuery } from '@tanstack/react-query'

function InfiniteTodos() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['todos', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/todos?cursor=${pageParam}`)
      return response.json()
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Logic to determine the next page parameter
      // For example, if lastPage contains a 'nextCursor' property:
      // return lastPage.nextCursor ?? undefined
      return lastPage.length === 0 ? undefined : lastPage[lastPage.length - 1].id // Example: use last item's ID as cursor
    },
  })

  if (isLoading) return 'Loading...' // Initial loading
  if (error) return 'An error has occurred: ' + error.message

  return (
    <div>
      {data.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.map(todo => (
            <p key={todo.id}>{todo.title}</p>
          ))}
        </React.Fragment>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'Nothing more to load'}
      </button>
    </div>
  )
}
```

--------------------------------

### Configure Chains in Ponder

Source: https://ponder.sh/docs/api-reference/ponder/config

Sets up blockchain network configurations, including RPC and WebSocket endpoints, and polling intervals. Requires a paid RPC provider for high-volume indexing to avoid rate limits.

```typescript
import { createConfig } from "ponder";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1,
      ws: process.env.PONDER_WS_URL_1,
    },
  },
  // ...
});
```

--------------------------------

### Define `ponder.config.ts` with `createConfig`

Source: https://ponder.sh/docs/api-reference/ponder/config

The `ponder.config.ts` file must default export the object returned by `createConfig`. This is the main entry point for Ponder's configuration, where you define your project's settings for chains, contracts, and other aspects.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  chains: { /* ... */ },
  contracts: { /* ... */ },
});
```

--------------------------------

### Disable RPC Caching in Ponder (TypeScript)

Source: https://ponder.sh/docs/config/chains

The `disableCache` option in Ponder's `createConfig` function can be set to `true` to disable caching for RPC responses. This is particularly useful when indexing development nodes like Anvil, where the chain state or history might change frequently. The default value for `disableCache` is `false`. This example shows how to disable caching for the `anvil` chain.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  chains: {
    anvil: {
      id: 31337,
      rpc: "http://127.0.0.1:8545",
      disableCache: true,
    },
  },
});
```

--------------------------------

### client.getStatus

Source: https://ponder.sh/docs/api-reference/ponder-client

Fetches the indexing progress of each chain.

```APIDOC
## `client.getStatus`

### Description
Fetch the indexing progress of each chain.

### Method
`client.getStatus`

### Parameters
None

### Request Example
```javascript
import { client, schema } from "../lib/ponder";

const status = await client.getStatus();
console.log("Mainnet indexing status:", status.mainnet);
```

### Response
Returns a Promise that resolves to an object containing the indexing status of each chain.

```json
type Status = {
  [chain: string]: {
    id: number;
    block: { number: number; timestamp: number } | null;
  };
};
```
```

--------------------------------

### Configure Public Client CCIP Read

Source: https://viem.sh/docs/clients/public

Controls the enablement of CCIP Read functionality for offchain lookups. Setting to `false` disables this feature.

```javascript
const publicClient = createPublicClient({
  ccipRead: false,
  chain: mainnet,
  transport: http(),
})
```

--------------------------------

### Configure Contract Details in Ponder

Source: https://ponder.sh/docs/0.10/api-reference/ponder/config

Sets up contract configurations in Ponder, specifying the network, ABI, and address. Enables Ponder to index events and interact with the contract.

```typescript
import { createConfig, type ContractConfig } from "ponder";
import { Erc20Abi } from "./abis/Erc20Abi.ts";

const Erc20 = {
  network: "mainnet",
  abi: Erc20Abi,
  address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
} as const satisfies ContractConfig;

export default createConfig({
  contracts: {
    Erc20,
  },
  // ...
});
```

--------------------------------

### PostgreSQL COPY Command Syntax and Clauses

Source: https://www.postgresql.org/docs/current/sql-copy.html

Illustrates the general syntax of the PostgreSQL COPY command and its various clauses used for data import and export. This includes options for error handling, encoding, verbosity, and filtering data.

```sql
COPY table_name [ ( column_name [, ...] ) ]
FROM { 'filename' | PROGRAM 'command' | STDIN }
[ [ WITH ] ( option [, ...] ) ]

COPY { table_name | ( query ) } [ ( column_name [, ...] ) ]
TO { 'filename' | PROGRAM 'command' | STDOUT }
[ [ WITH ] ( option [, ...] ) ]

-- Common Options:
-- ON_ERROR = 'skip' | 'use_default' | 'ignore'
-- REJECT_LIMIT = bigint
-- ENCODING = 'encoding_name'
-- LOG_VERBOSITY = 'default' | 'verbose' | 'silent'
-- WHERE condition
```

--------------------------------

### Next.js Dynamic Page with getServerSideProps

Source: https://vercel.com/blog/framework-defined-infrastructure

This snippet demonstrates a Next.js page that fetches data dynamically on each request using `getServerSideProps`. This implies the need for a compute service, like a serverless function, to handle the data fetching and rendering. The infrastructure is automatically provisioned to support this dynamic behavior.

```tsx
export default function BlogPosts({ posts }) {
  return posts.map(post => (
    <div key={post.id}>{post.title}</div>
  ));
}

export async function getServerSideProps() {
  const posts = await getBlogPosts();
  return {
    props: { posts }
  };
}
```

--------------------------------

### Solidity Event Encoding and Topics

Source: https://docs.soliditylang.org/en/v0.8.17/abi-spec.html

Explains how Solidity events are converted into log entries, detailing the structure of topics and data. Indexed parameters are hashed for efficient searching, while non-indexed parameters are ABI-encoded directly.

```text
Topics:
- topics[0]: keccak(EVENT_NAME+"("+EVENT_ARGS.map(canonical_type_of).join(",")+ ")") (if not anonymous)
- topics[n]: abi_encode(EVENT_INDEXED_ARGS[n - 1]) (if not anonymous) or abi_encode(EVENT_INDEXED_ARGS[n]) (if anonymous)
Data:
- abi_encode(EVENT_NON_INDEXED_ARGS)
```

--------------------------------

### Summarizing Query with libpg_query (C)

Source: https://github.com/pganalyze/libpg_query

This C code snippet shows how to generate a summary of a parsed SQL query using libpg_query. The summary includes information like the query's fingerprint, normalized SQL, and a list of involved tables. This is valuable for understanding query patterns and performance.

```c
#include <stdio.h>
#include <stdlib.h>
#include "pg_query.h"

int main() {
    const char *sql = "SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id WHERE u.active = true;";
    pg_query_parse_result *result = pg_query_parse(sql);

    if (result->error_message) {
        fprintf(stderr, "Error parsing SQL: %s\n", result->error_message);
        pg_query_free_parse_result(result);
        return 1;
    }

    pg_query_outgoing_nodes *summary = pg_query_nodes_new();
    pg_query_raw_parse_nodes(result->parse_tree, summary);

    printf("Query Summary:\n");
    printf("  Fingerprint: %s\n", summary->fingerprint);
    printf("  Normalized SQL: %s\n", summary->normalized_sql);
    printf("  Tables:");
    for (int i = 0; i < summary->n_tables; i++) {
        printf(" %s", summary->tables[i]);
    }
    printf("\n");

    pg_query_nodes_free(summary);
    pg_query_free_parse_result(result);
    return 0;
}
```

--------------------------------

### Execute Contract Call with Gas Limit (JavaScript)

Source: https://viem.sh/docs/actions/public/call

This snippet demonstrates how to specify the maximum amount of gas to be used for a contract call. This prevents excessive gas consumption. It requires `publicClient` and the `gas` value as a bigint.

```javascript
const data = await publicClient.call({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  gas: 1_000_000n,
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

--------------------------------

### EVM CREATE2 Opcode: Predictable Account Creation

Source: https://www.evm.codes/

The CREATE2 opcode creates a new account at a predictable address derived from the deployment salt, constructor code, and the sender's address. It requires an initial value and gas. It returns the address of the newly created account.

```evm
f5| CREATE2| 32000| value offset size salt| address| Create a new account with associated code at a predictable address
```

--------------------------------

### PostgreSQL Binary File Format - Header and Tuples

Source: https://www.postgresql.org/docs/current/sql-copy.html

Illustrates the binary format of PostgreSQL data, showing the header information (flags, extension length) and tuple structure (field count, field length, field data). NULL values are represented by -1.

```hex
0000000 P G C O P Y \n 377 \r \n \0 \0 \0 \0 \0 \0 0000020 \0 \0 \0 \0 003 \0 \0 \0 002 A F \0 \0 \0 013 A 
0000040 F G H A N I S T A N 377 377 377 377 \0 003 0000060 \0 \0 \0 002 A L \0 \0 \0 007 A L B A N I 
0000100 A 377 377 377 377 \0 003 \0 \0 \0 002 D Z \0 \0 \0 0000120 007 A L G E R I A 377 377 377 377 \0 003 \0 \0 
0000140 \0 002 Z M \0 \0 \0 006 Z A M B I A 377 377 0000160 377 377 \0 003 \0 \0 \0 002 Z W \0 \0 \0 \b Z I 0000200 M B A B W E 377 377 377 377 377 377 

```

--------------------------------

### Configure WebSocket Transport with Custom Key in Viem

Source: https://viem.sh/docs/clients/transports/websocket

Demonstrates setting a custom `key` for the WebSocket transport. This is useful for identifying specific transport instances, such as one provided by Alchemy.

```typescript
const transport = webSocket('wss://1.rpc.thirdweb.com/...', {
  key: 'alchemy',
})
```

--------------------------------

### Simulate Contract Mint with Gas Limit | JavaScript

Source: https://viem.sh/docs/contract/simulateContract

Simulates a 'mint' function call on a contract, specifying a custom gas limit for the transaction. This helps in estimating or setting transaction cost.

```javascript
await walletClient.writeContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  args: [69420],
  gas: 69420n
})
```

--------------------------------

### PostgreSQL COPY Command - Pre-7.3 Syntax

Source: https://www.postgresql.org/docs/current/sql-copy.html

This snippet illustrates the older syntax for the PostgreSQL COPY command, which is still supported. It offers basic options for binary transfer, delimiters, and specifying the NULL string representation for copying data to or from tables.

```sql
COPY [ BINARY ] _table_name_ FROM { '_filename_' | STDIN } [ [USING] DELIMITERS '_delimiter_character_' ] [ WITH NULL AS '_null_string_' ]
```

```sql
COPY [ BINARY ] _table_name_ TO { '_filename_' | STDOUT } [ [USING] DELIMITERS '_delimiter_character_' ] [ WITH NULL AS '_null_string_' ]
```

--------------------------------

### Set Public Client Name

Source: https://viem.sh/docs/clients/public

Assigns a human-readable name to the client instance. Helpful for debugging and identification.

```javascript
const publicClient = createPublicClient({
  chain: mainnet,
  name: 'Public Client',
  transport: http(),
})
```

--------------------------------

### getProof

Source: https://viem.sh/docs/actions/public/getProof

Retrieves the account and storage values of the specified account, including the Merkle-proof. This corresponds to the JSON-RPC method `eth_getProof`.

```APIDOC
## GET /proof

### Description
Retrieves the account and storage values of the specified account, including the Merkle-proof.

### Method
GET

### Endpoint
/proof

### Parameters
#### Query Parameters
- **address** (string) - Required - The account address for which to get the proof.
- **storageKeys** (string[]) - Required - An array of storage keys for which to get proof.
- **blockNumber** (bigint) - Optional - The block number at which to get the proof.
- **blockTag** (string) - Optional - The block tag at which to get the proof. Allowed values: 'latest', 'earliest', 'pending', 'safe', 'finalized'. Defaults to 'latest'.

### Request Example
```json
{
  "address": "0x4200000000000000000000000000000000000016",
  "storageKeys": [
    "0x4a932049252365b3eedbc5190e18949f2ec11f39d3bef2d259764799a1b27d99"
  ],
  "blockNumber": 42069
}
```

### Response
#### Success Response (200)
- **proof** (object) - The Merkle proof data.

#### Response Example
```json
{
  "proof": {
    "accountProof": "0x...",
    "storageProof": [
      {
        "key": "0x...",
        "value": "0x...",
        "proof": "0x..."
      }
    ]
  }
}
```

### JSON-RPC Method
Calls `eth_getProof`.
```

--------------------------------

### Fingerprint SQL Query using C

Source: https://github.com/pganalyze/libpg_query

This C code snippet demonstrates how to fingerprint a SQL query using the pg_query library. It takes a SQL string as input and outputs a fingerprint string. Ensure you include the necessary headers and link against the pg_query library.

```c
#include <stdio.h>
#include "pg_query.h"

int main() {
    PgQueryFingerprintResult result;
    result = pg_query_fingerprint("SELECT 1");
    printf("%s\n", result.fingerprint_str);
    pg_query_free_fingerprint_result(result);
}
```

--------------------------------

### Configure Ponder Networks

Source: https://ponder.sh/docs/0.10/api-reference/ponder/config

Sets up network configurations for Ponder, including chain IDs and RPC transport. It's recommended to use a paid RPC provider to avoid rate limits. Ensure the PONDER_RPC_URL environment variable is set.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1),
    },
  },
  // ...
});
```

--------------------------------

### React Hooks

Source: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery

Reference for the hooks provided by TanStack Query for use within React components.

```APIDOC
## TanStack Query React Hooks

These hooks are designed to be used within React components to easily fetch, cache, and manage server state.

### `useQuery`

**Description**: Hook for fetching and caching asynchronous data.

**Method**: N/A (Hook)

**Endpoint**: N/A

**Parameters**:

*   **queryKey** (string | Array<string | number | object | boolean | null | undefined>) - Required - A unique key for the query.
*   **queryFn** (QueryFunction) - Optional - The function that fetches your data.
*   **options** (QueryObserverOptions) - Optional - Configuration options for the query.

**Request Example**:
```javascript
import { useQuery } from '@tanstack/react-query';

function MyComponent() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/todos');
      return response.json();
    },
  });

  if (isLoading) return 'Loading...';
  if (error) return 'An error has occurred: ' + error.message;

  return (
    <ul>
      {data.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

**Response Example**:
```json
{
  "data": [
    { "id": 1, "title": "Learn TanStack Query", "status": "done" },
    { "id": 2, "title": "Build a project", "status": "inProgress" }
  ],
  "error": null,
  "isLoading": false
}
```

### `useQueries`

**Description**: Hook for fetching multiple queries in parallel.

**Parameters**:

*   **queries** (Array<UseQueryOptions>) - Required - An array of query options objects.

### `useInfiniteQuery`

**Description**: Hook for fetching data that is paginated or loaded infinitely.

**Parameters**:

*   **queryKey** (string | Array<string | number | object | boolean | null | undefined>) - Required - A unique key for the query.
*   **queryFn** (QueryFunction) - Optional - The function that fetches your data, receiving `pageParam`.
*   **options** (QueryObserverOptions) - Optional - Configuration options for the infinite query.

### `useMutation`

**Description**: Hook for performing asynchronous mutations (e.g., POST, PUT, DELETE).

**Parameters**:

*   **options** (MutationObserverOptions) - Required - Configuration options for the mutation.

### `useIsFetching`

**Description**: Hook that returns the number of active fetches.

### `useIsMutating`

**Description**: Hook that returns the number of active mutations.

### `useMutationState`

**Description**: Hook for observing the state of mutations.

### `useSuspenseQuery`

**Description**: Suspense-enabled version of `useQuery`.

### `useSuspenseInfiniteQuery`

**Description**: Suspense-enabled version of `useInfiniteQuery`.

### `useSuspenseQueries`

**Description**: Suspense-enabled version of `useQueries`.

### `useQueryClient`

**Description**: Hook to access the `QueryClient` instance.

### `useQueryErrorResetBoundary`

**Description**: Hook to interact with the `QueryErrorResetBoundary` component.

### `queryOptions`

**Description**: Utility function to create query options.

### `infiniteQueryOptions`

**Description**: Utility function to create infinite query options.

### `mutationOptions`

**Description**: Utility function to create mutation options.

### `usePrefetchQuery`

**Description**: Hook for prefetching query data.

### `usePrefetchInfiniteQuery`

**Description**: Hook for prefetching infinite query data.
```

--------------------------------

### React: Infinite Query Hook for Pagination

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

Demonstrates the `useInfiniteQuery` hook for implementing paginated data fetching, often used for "load more" or infinite scroll features. It requires a page parameter in the query function and returns functions to fetch more data. This simplifies managing lists where data is loaded incrementally.

```javascript
import { useInfiniteQuery } from '@tanstack/react-query'

function InfinitePosts() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/posts?cursor=${pageParam}`)
      return response.json()
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Logic to determine the next page parameter based on the last page's data
      return lastPage.nextCursor
    },
  })

  return (
    <div>
      {data.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.posts.map(post => (
            <div key={post.id}>{post.title}</div>
          ))}
        </React.Fragment>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'Nothing more to load'}
      </button>
    </div>
  )
}
```

--------------------------------

### Create a Table in a Specific Schema

Source: https://www.postgresql.org/docs/current/ddl-schemas.html

This code shows how to create a table within a specific schema using a qualified name. The syntax follows the pattern `schema_name.table_name`.

```sql
CREATE TABLE myschema.mytable (
  ... 
);
```

--------------------------------

### Insert Rows using Ponder Store API (TypeScript)

Source: https://ponder.sh/docs/indexing/write

Demonstrates how to insert single or multiple rows into a Ponder database table using the `insert` method. It shows basic insertion and how the API returns inserted rows, including default values. It also illustrates error handling for missing required columns or duplicate unique constraints.

```typescript
import { accounts } from "ponder:schema";

// Insert a single row
const row = await db.insert(accounts).values({ address: "0x7Df1", balance: 0n });

// Insert multiple rows
const rows = await db.insert(accounts).values([
  { address: "0x7Df2", balance: -50n },
  { address: "0x7Df3", balance: 100n },
]);

```

```typescript
import { accounts } from "ponder:schema";

const row = await db.insert(accounts).values({ address: "0x7Df1" });
// Error: Column "balance" is required but not present in the values object.

```

```typescript
import { accounts } from "ponder:schema";

const row = await db.insert(accounts).values({ address: "0x7Df1" });
// Error: Column "balance" is required but not present in the values object.

```

--------------------------------

### Assembling LLM Input Data Structure

Source: https://docs.soliditylang.org/en/v0.8.17/abi-spec.html

This snippet shows the final assembly of data for LLM input, combining encoded dynamic arrays with their respective counts and offsets. It includes the function signature and the byte-level representation of complex data structures.

```text
0x2289b18c - function signature
0 - f - offset of [[1, 2], [3]]
1 - g - offset of ["one", "two", "three"]
2 - 0000000000000000000000000000000000000000000000000000000000000002 - count for [[1, 2], [3]]
3 - 0000000000000000000000000000000000000000000000000000000000000040 - offset of [1, 2]
4 - 00000000000000000000000000000000000000000000000000000000000000a0 - offset of [3]
5 - 0000000000000000000000000000000000000000000000000000000000000002 - count for [1, 2]
6 - 0000000000000000000000000000000000000000000000000000000000000001 - encoding of 1
7 - 0000000000000000000000000000000000000000000000000000000000000002 - encoding of 2
8 - 0000000000000000000000000000000000000000000000000000000000000001 - count for [3]
9 - 0000000000000000000000000000000000000000000000000000000000000003 - encoding of 3
10 - 0000000000000000000000000000000000000000000000000000000000000003 - count for ["one", "two", "three"]
11 - 0000000000000000000000000000000000000000000000000000000000000060 - offset for "one"
12 - 00000000000000000000000000000000000000000000000000000000000000a0 - offset for "two"
13 - 00000000000000000000000000000000000000000000000000000000000000e0 - offset for "three"
14 - 0000000000000000000000000000000000000000000000000000000000000003 - count for "one"
15 - 6f6e650000000000000000000000000000000000000000000000000000000000 - encoding of "one"
16 - 0000000000000000000000000000000000000000000000000000000000000003 - count for "two"
17 - 74776f0000000000000000000000000000000000000000000000000000000000 - encoding of "two"
18 - 0000000000000000000000000000000000000000000000000000000000000005 - count for "three"
19 - 7468726565000000000000000000000000000000000000000000000000000000 - encoding of "three"
```

--------------------------------

### QueryClient Core API

Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-functions

Provides core functionalities for managing queries and mutations within TanStack Query.

```APIDOC
## QueryClient Core API

### Description
Core components for TanStack Query, including QueryCache, MutationCache, and QueryClient.

### Method
N/A (Core Components)

### Endpoint
N/A (Core Components)

### Parameters
N/A

### Request Example
N/A

### Response
N/A
```

--------------------------------

### Configure PGlite Database in `ponder.config.ts`

Source: https://ponder.sh/docs/api-reference/ponder/config

Configure Ponder to use PGlite for its database. This includes specifying the `kind` as 'pglite' and optionally setting a `directory` for database files. PGlite is a lightweight, in-browser SQL database.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  database: {
    kind: "pglite",
    directory: "./.ponder/pglite",
  },
  // ...
});
```

--------------------------------

### Infinite Query with Cursor-Based Pagination (TypeScript)

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

Demonstrates how to configure useInfiniteQuery for APIs that return a cursor for pagination. It includes settings for queryKey, queryFn, initialPageParam, getNextPageParam, and getPreviousPageParam.

```tsx
return useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, pages) => firstPage.prevCursor,
  maxPages: 3,
})
```

--------------------------------

### Simulate Contract with Authorization List in TypeScript

Source: https://viem.sh/docs/contract/simulateContract

Simulates a contract interaction using an `authorizationList`, which is a signed EIP-7702 authorization. This allows simulating contract calls with delegated authority.

```typescript
const authorization = await walletClient.signAuthorization({
  contractAddress: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
})
const { result } = await publicClient.simulateContract({
  address: account.address,
  abi: wagmiAbi,
  functionName: 'mint',
  args: [69420],
  authorizationList: [authorization],
})
```

--------------------------------

### Configure Public Client Batching - batch.multicall.batchSize

Source: https://viem.sh/docs/clients/public

Sets the maximum calldata chunk size for multicall requests. Adjust this based on RPC provider limits to avoid request failures.

```javascript
const publicClient = createPublicClient({
  batch: {
    multicall: {
      batchSize: 512,
    },
  },
  chain: mainnet,
  transport: http(),
})
```

--------------------------------

### pg.Pool - New Pool

Source: https://node-postgres.com/apis/pool

Constructs a new pool instance. The pool is initially created empty and will create new clients lazily as they are needed. All fields of the config object are optional.

```APIDOC
## POST /new Pool

### Description
Constructs a new pool instance. The pool is initially created empty and will create new clients lazily as they are needed. Every field of the `config` object is entirely optional. The config passed to the pool is also passed to every client instance within the pool when the pool creates that client.

### Method
POST

### Endpoint
/new Pool

### Parameters
#### Request Body
- **connectionTimeoutMillis** (number) - Optional - Number of milliseconds to wait before timing out when connecting a new client. By default this is 0 which means no timeout.
- **idleTimeoutMillis** (number) - Optional - Number of milliseconds a client must sit idle in the pool and not be checked out before it is disconnected from the backend and discarded. Default is 10000 (10 seconds). Set to 0 to disable auto-disconnection of idle clients.
- **max** (number) - Optional - Maximum number of clients the pool should contain. Default is 10.
- **min** (number) - Optional - Minimum number of clients the pool should hold on to and not destroy with the idleTimeoutMillis. Default is 0.
- **allowExitOnIdle** (boolean) - Optional - Allows the node event loop to exit as soon as all clients in the pool are idle, even if their socket is still open to the postgres server.
- **maxLifetimeSeconds** (number) - Optional - Sets a max overall life for the connection. Default is disabled (value of zero).

### Request Example
```json
{
  "connectionTimeoutMillis": 2000,
  "idleTimeoutMillis": 30000,
  "max": 20,
  "maxLifetimeSeconds": 60
}
```

### Response
#### Success Response (200)
- **pool** (object) - The newly created pool instance.

#### Response Example
```json
{
  "pool": "<pool_instance>"
}
```
```

--------------------------------

### Configure Single Network and Contract (TypeScript)

Source: https://ponder.sh/docs/0.10/config/contracts

This configuration sets up indexing for a single contract ('Blitmap') on a specific network ('mainnet'). It requires the contract's ABI and its address on that network. The transport is configured using an environment variable for the RPC URL.

```typescript
import { createConfig } from "ponder";
import { http } from "viem";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1)
    },
  },
  contracts: {
    Blitmap: {
      abi: BlitmapAbi,
      network: "mainnet",
      address: "0x8d04a8c79cEB0889Bdd12acdF3Fa9D207eD3Ff63",
    },
  },
});
```

--------------------------------

### useQuery Hook

Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

The `useQuery` hook is the primary hook for fetching, caching, and synchronizing server state in React.

```APIDOC
## useQuery Hook

### Description
Fetches, caches, and synchronizes server state.

### Method
N/A (Hook)

### Endpoint
N/A (Hook)

### Parameters
#### Query Parameters
- **queryKey** (QueryKey) - Required - Unique key for the query.
- **queryFn** (QueryFunction) - Optional - Function that fetches the data.
- **options** (QueryObserverOptions) - Optional - Configuration options for the query.

### Request Example
```javascript
import { useQuery } from '@tanstack/react-query'

function ExampleComponent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos')
      return response.json()
    },
  })

  if (isLoading) return 'Loading...'
  if (isError) return 'Error'

  return (
    <ul>
      {data.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

### Response
#### Success Response (200)
- **data** (any) - The fetched data.
- **isLoading** (boolean) - True if the query is currently fetching.
- **isError** (boolean) - True if the query resulted in an error.

#### Response Example
```json
{
  "data": [
    {
      "id": 1,
      "title": "Learn TanStack Query"
    }
  ],
  "isLoading": false,
  "isError": false
}
```
```

--------------------------------

### Configure HTTP Transport with Custom Name (JavaScript)

Source: https://viem.sh/docs/clients/transports/http

Demonstrates how to set a custom name for the HTTP transport. This is useful for identifying different transport instances, especially when multiple connections are managed.

```javascript
const transport = http('https://1.rpc.thirdweb.com/...', {
  name: 'Alchemy HTTP Provider',
});
```

--------------------------------

### Simulate Contract Mint with State Override | JavaScript

Source: https://viem.sh/docs/contract/simulateContract

Simulates a 'mint' function call with ephemeral state overrides for specific contract addresses and storage slots. This is primarily for testing purposes.

```javascript
const data = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  stateOverride: [
    {
      address: '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
      balance: parseEther('1'),
      stateDiff: [
        {
          slot: '0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0',
          value: '0x00000000000000000000000000000000000000000000000000000000000001a4',
        },
      ],
    },
  ],
})
```

--------------------------------

### Configure Multiple Addresses for Same ABI in Ponder

Source: https://ponder.sh/docs/config/contracts

Allows indexing multiple contracts that share the same ABI, such as ERC20 or ERC721 tokens, by providing a list of addresses. It's recommended to set `startBlock` to the earliest deployment block among them.

```typescript
import { createConfig } from "ponder";
import { ERC721Abi } from "./abis/ERC721";

export default createConfig({
  chains: {
    /* ... */
  },
  contracts: {
    NiceJpegs: {
      abi: ERC721Abi,
      chain: "mainnet",
      address: [
        "0x4E1f41613c9084FdB9E34E11fAE9412427480e56", // Terraforms
        "0xBC4C
```

--------------------------------

### Configure Postgres Database in `ponder.config.ts`

Source: https://ponder.sh/docs/api-reference/ponder/config

Configure Ponder to use a Postgres database. Specify `kind` as 'postgres' and provide a `connectionString`. You can also set a `poolConfig` for the database connection pool. If `connectionString` is omitted, Ponder uses the `DATABASE_URL` environment variable.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: "postgresql://user:password@localhost:5432/dbname",
    poolConfig: {
      max: 100,
      ssl: true,
    },
  },
  // ...
});
```

--------------------------------

### Deployless Call via Deploy Factory with viem

Source: https://viem.sh/docs/actions/public/call

Executes a deployless call using a deploy factory to interact with a contract that has not yet been deployed. This method 'temporarily deploys' a contract using a provided factory and then calls a function on the deployed contract. It requires encoding both the factory data and the contract data.

```typescript
import { encodeFunctionData, parseAbi } from 'viem'
import { owner, publicClient } from './config'

const data = await publicClient.call({
  // Address of the contract deployer (e.g. Smart Account Factory).
  factory: '0xE8Df82fA4E10e6A12a9Dab552bceA2acd26De9bb',
  // Function to execute on the factory to deploy the contract.
  factoryData: encodeFunctionData({
    abi: parseAbi(['function createAccount(address owner, uint256 salt)']),
    functionName: 'createAccount',
    args: [owner, 0n],
  }),
  // Function to call on the contract (e.g. Smart Account contract).
  data: encodeFunctionData({
    abi: parseAbi(['function entryPoint() view returns (address)']),
    functionName: 'entryPoint',
  }),
  // Address of the contract.
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

--------------------------------

### Drizzle Utility Functions

Source: https://ponder.sh/docs/api-reference/ponder-client

The @ponder/client package exports all relevant Drizzle utility functions.

```APIDOC
## Drizzle utility functions

### Description
The `@ponder/client` package exports all relevant Drizzle utility functions. You shouldn't need to install `drizzle-orm` separately.

### Usage
```javascript
import { client, schema } from "../lib/ponder";
import { eq, gte, and, desc } from "@ponder/client";

const result = await client.db
  .select()
  .from(schema.transfers)
  .where(
    and(
      gte(schema.transfers.value, 1000000n),
      eq(schema.transfers.from, "0x123...")
    )
  )
  .orderBy(desc(schema.transfers.blockNumber));
```
```

--------------------------------

### simulateContract API

Source: https://viem.sh/docs/contract/simulateContract

Simulates a contract interaction and returns the result. This method is useful for testing contract calls before sending them to the network. It also supports state overrides to simulate specific contract states.

```APIDOC
## POST /simulateContract

### Description
Simulates a contract interaction without sending a transaction to the blockchain. This is useful for testing contract calls and estimating gas. It can also simulate specific contract states using `stateOverride`.

### Method
POST

### Endpoint
`/simulateContract`

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
- **address** (Address) - Required - The contract address.
- **abi** (Abi) - Required - The contract's ABI.
- **functionName** (string) - Required - The name of the function to simulate.
- **account** (Account | Address | null) - Required - The account to simulate the contract method from. If `null`, the transport handles the sender.
- **args** (Inferred from ABI) - Optional - Arguments to pass to the function call.
- **accessList** (AccessList) - Optional - The access list for the transaction.
- **authorizationList** (AuthorizationList) - Optional - Signed EIP-7702 Authorization list.
- **blockNumber** (number) - Optional - The block number to perform the simulation against.
- **blockTag** ('latest' | 'earliest' | 'pending' | 'safe' | 'finalized') - Optional - The block tag to perform the simulation against. Defaults to 'latest'.
- **stateOverride** (Array<StateOverride>) - Optional - An array of state overrides to apply before simulating the contract interaction.

### Request Example
```json
{
  "address": "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
  "abi": wagmiAbi,
  "functionName": "mint",
  "account": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "args": [69420n],
  "stateOverride": [
    {
      "address": "0x...",
      "stateDiff": [
        {
          "slot": "0x....",
          "value": "0x..."
        }
      ]
    }
  ]
}
```

### Response
#### Success Response (200)
- **result** (any) - The simulation result and write request. Type is inferred from the ABI.

#### Response Example
```json
{
  "result": true 
}
```

### Error Handling
- **BaseError**: Catches errors during simulation.
- **ContractFunctionRevertedError**: Specifically handles errors where the contract function reverts, providing access to the error name.
```
```

--------------------------------

### Node.js: Select Accounts Ordered by Balance

Source: https://ponder.sh/docs/query/sql-over-http

Demonstrates selecting all accounts from the database and ordering them in descending order based on their balance using the Ponder client. It utilizes the `desc` utility function re-exported from Drizzle ORM.

```typescript
import { desc } from "@ponder/client";
import * as schema from "../../ponder/ponder.schema";

const result = await client.db.select().from(schema.account).orderBy(desc(schema.account.balance));
```

--------------------------------

### Execute Raw SQL Query in SingleStore with Drizzle ORM

Source: https://orm.drizzle.team/docs/goodies

Demonstrates executing a raw parameterized SQL query in SingleStore using Drizzle ORM's `sql` template literal and `db.execute` method. Includes the specific result type for SingleStore.

```typescript
import { sql } from 'drizzle-orm';
import { ..., SingleStoreQueryResult } from "drizzle-orm/singlestore"; // Assuming SingleStore driver

const statement = sql`select * from ${users} where ${users.id} = ${userId}`;
const res: SingleStoreQueryResult = await db.execute(statement);
```

--------------------------------

### Simulate Contract at Block Tag in TypeScript

Source: https://viem.sh/docs/contract/simulateContract

Simulates a contract interaction using a `blockTag`. This parameter allows specifying whether to use the 'latest', 'earliest', 'pending', 'safe', or 'finalized' block for the simulation.

```typescript
const { result } = await publicClient.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'mint',
  blockTag: 'latest',
})
```

--------------------------------

### Configure Ponder with Contracts

Source: https://ponder.sh/docs/indexing/read-contracts

Sets up the Ponder configuration, defining chains and contract details like ABI and address. This is essential for Ponder to interact with specific contracts.

```typescript
import { createConfig } from "ponder";
import { BlitmapAbi } from "./abis/Blitmap";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1
    },
  },
  contracts: {
    Blitmap: {
      chain: "mainnet",
      abi: BlitmapAbi,
      address: "0x8d04...D3Ff63",
      startBlock: 12439123,
    },
  },
});
```

--------------------------------

### Watching Solidity Events with JavaScript API

Source: https://docs.soliditylang.org/en/latest/contracts.html

Demonstrates how to use the web3.js library to interact with Solidity events. It shows how to set up a listener for a 'Deposit' event emitted by a contract, logging the event details when changes occur. This requires the contract's ABI and address.

```javascript
var abi = /* abi as generated by the compiler */;
var ClientReceipt = web3.eth.contract(abi);
var clientReceipt = ClientReceipt.at("0x1234...ab67" /* address */);

var depositEvent = clientReceipt.Deposit(); // watch for changes
depositEvent.watch(function(error, result){
  // result contains non-indexed arguments and topics
  // given to the `Deposit` call.
  if (!error) console.log(result);
});

// Or pass a callback to start watching immediately
var depositEvent = clientReceipt.Deposit(function(error, result) {
  if (!error) console.log(result);
});
```

--------------------------------

### Cursor-based Pagination (Forward)

Source: https://ponder.sh/docs/query/graphql

This GraphQL query illustrates forward pagination using the `after` argument, which accepts the `endCursor` from a previous request. It retrieves a specified number of items and provides page navigation details.

```graphql
query {
  persons(orderBy: "age", orderDirection: "asc", limit: 2, after: "Mxhc3NDb3JlLTA=") {
    items {
      name
      age
    }
    pageInfo {
      startCursor
      endCursor
      hasPreviousPage
      hasNextPage
    }
    totalCount
  }
}
```

--------------------------------

### Print SQL Query with Drizzle ORM Instance

Source: https://orm.drizzle.team/docs/goodies

Shows how to generate and inspect the SQL query for a Drizzle ORM select statement using the `.toSQL()` method. This helps in understanding the generated SQL.

```typescript
const query = db
  .select({ id: users.id, name: users.name })
  .from(users)
  .groupBy(users.id)
  .toSQL();

// query: { sql: 'select 'id', 'name' from 'users' group by 'users'.'id'', params: [], }
```

--------------------------------

### GraphQL Pagination Algorithm Logic

Source: https://relay.dev/graphql/connections.htm

Pseudocode representing the core logic for paginating edges in a GraphQL connection. It details how 'before', 'after', 'first', and 'last' arguments are applied to filter and slice the edge list.

```pseudocode
EdgesToReturn(allEdges, before, after, first, last)
1. Let edges be the result of calling ApplyCursorsToEdges(allEdges, before, after).
2. If first is set:
1. If first is less than 0:
1. Throw an error.
2. If edges has length greater than than first:
1. Slice edges to be of length first by removing edges from the end of edges.
3. If last is set:
1. If last is less than 0:
1. Throw an error.
2. If edges has length greater than than last:
1. Slice edges to be of length last by removing edges from the start of edges.
4. Return edges.

ApplyCursorsToEdges(allEdges, before, after)
1. Initialize edges to be allEdges.
2. If after is set:
1. Let afterEdge be the edge in edges whose cursor is equal to the after argument.
2. If afterEdge exists:
1. Remove all elements of edges before and including afterEdge.
3. If before is set:
1. Let beforeEdge be the edge in edges whose cursor is equal to the before argument.
2. If beforeEdge exists:
1. Remove all elements of edges after and including beforeEdge.
4. Return edges.
```

--------------------------------

### Query ERC20 Account Balance and Approvals

Source: https://github.com/ponder-sh/ponder/tree/main/examples/reference-erc20

This GraphQL query retrieves the current balance and all approvals for a specified Ethereum account. It requires the account's Ethereum address as input. The output includes the account's balance and a list of approvals, each with a spender address and amount.

```graphql
{
  account(id: "0x1337f7970E8399ccbc625647FCE58a9dADA5aA66") {
    balance
    approvals {
      spender
      amount
    }
  }
}
```

--------------------------------

### Call Simple Read-Only Contract Function with viem

Source: https://viem.sh/docs/contract/readContract

Demonstrates a basic usage of `readContract` to call a function that takes no arguments, such as `totalSupply`. It requires a public client, contract address, ABI, and the function name. The response is directly returned.

```typescript
import { publicClient } from './client'
import { wagmiAbi } from './abi'

const data = await publicClient.readContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  functionName: 'totalSupply',
})

// 69420n
```

--------------------------------

### Import Foundry Plugin for Wagmi CLI

Source: https://wagmi.sh/cli/api/plugins/foundry

Demonstrates how to import the foundry plugin from the '@wagmi/cli/plugins' package. This is the initial step before configuring the plugin within the Wagmi CLI.

```typescript
import { foundry } from '@wagmi/cli/plugins'
```

--------------------------------

### Create Fallback Transport with Viem

Source: https://viem.sh/docs/clients/transports/fallback

Demonstrates how to create a Fallback Transport using viem's `fallback` function. This transport takes an array of HTTP transport configurations for different RPC endpoints. If one RPC endpoint fails, viem will automatically try the next one in the list.

```typescript
import { createPublicClient, fallback, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http('https://1.rpc.thirdweb.com/...'),
    http('https://mainnet.infura.io/v3/...')
  ])
})
```

--------------------------------

### Configure Accounts in Ponder

Source: https://ponder.sh/docs/api-reference/ponder/config

Sets up account configurations for indexing transactions or native transfers. Specifies the chain, address, and the block range for syncing events.

```typescript
import { createConfig } from "ponder";

export default createConfig({
  accounts: {
    coinbasePrime: {
      chain: "mainnet",
      address: "0xCD531Ae9EFCCE479654c4926dec5F6209531Ca7b",
      startBlock: 12111233,
    },
  },
  // ...
});
```

--------------------------------

### Execute Contract Call at Specific Block Number (JavaScript)

Source: https://viem.sh/docs/actions/public/call

This snippet demonstrates making a contract call against a specific block number. This is useful for querying contract state at a historical point in time. It requires `publicClient` and a valid `blockNumber` as a bigint.

```javascript
const data = await publicClient.call({
  blockNumber: 15121123n,
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

--------------------------------

### Fetch and Display Latest Deposits with Ponder React

Source: https://ponder.sh/docs/0.10/query/sql-client

Fetches the 10 most recent deposit events ordered by timestamp using `usePonderQuery` from `@ponder/react`. Handles loading and error states before displaying the data. Requires the `schema` object from `../lib/ponder`.

```javascript
import { usePonderQuery } from "@ponder/react";
import { schema } from "../lib/ponder";

export function Deposits() {
  const { data, isError, isPending } = usePonderQuery({
    queryFn: (db) => db.select()
      .from(schema.depositEvent)
      .orderBy(schema.depositEvent.timestamp)
      .limit(10),
  });

  if (isPending) return <div>Loading deposits</div>;
  if (isError) return <div>Error fetching deposits</div>;

  return (
    <div>
      Deposits: {JSON.stringify(data)}
    </div>
  );
}
```

--------------------------------

### BigInt Constructor and Static Methods

Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt

Shows the usage of the BigInt() constructor and its static methods like asIntN and asUintN for clamping BigInt values. The constructor throws an error when called with 'new'.

```javascript
// Constructor usage:
const bigIntVal = BigInt(12345678901234567890n);
console.log(bigIntVal);

// BigInt() throws error when called with new:
// const errorBigInt = new BigInt(10n);

// Static method asIntN:
const valueToIntN = 100n;
const clampedToInt = BigInt.asIntN(8, valueToIntN); // Clamp to 8-bit signed integer
console.log(clampedToInt); // -128n (wraps around)

// Static method asUintN:
const valueToUintN = 300n;
const clampedToUint = BigInt.asUintN(8, valueToUintN); // Clamp to 8-bit unsigned integer
console.log(clampedToUint); // 44n (wraps around)
```

--------------------------------

### Execute EIP-1559 Transaction Call with Max Fee Per Gas (JavaScript)

Source: https://viem.sh/docs/actions/public/call

This snippet demonstrates setting the `maxFeePerGas` for an EIP-1559 transaction. This is the total fee per gas, including the priority fee. It requires `publicClient` and `parseGwei`.

```javascript
import { parseGwei } from 'viem'
const data = await publicClient.call({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  maxFeePerGas: parseGwei('20'),
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

--------------------------------

### Assign a Key to HTTP Transport - viem

Source: https://viem.sh/docs/clients/transports/http

Demonstrates how to assign a custom `key` to the `http` transport. This key can be used to identify or differentiate transports, especially when multiple transports are configured.

```typescript
const transport = http('https://1.rpc.thirdweb.com/...', {
  key: 'alchemy',
})
```

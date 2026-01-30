# Phase 0: Foundation & Project Scaffolding

## Objective

Set up the monorepo structure, Foundry project, and shared infrastructure for Oikonomos - an ENS-native Agent Registry for Uniswap v4 Automation.

## Context

Read these files before starting:
- `/EED.md` - Engineering Execution Document (full architecture)
- `/ENS-native Agent Registry for Uniswap v4 Automation.md` - PRD
- `/.env` - Environment configuration (already configured)
- `/context/foundry.md` - Foundry best practices
- `/context/uniswap-v4.md` - Uniswap v4 hook development

## Deliverables

### 1. Monorepo Structure

Create the following directory structure:

```
oikonomos/
├── packages/
│   ├── contracts/           # Foundry project
│   │   ├── foundry.toml
│   │   ├── remappings.txt
│   │   ├── src/
│   │   │   ├── core/
│   │   │   ├── identity/
│   │   │   ├── policy/
│   │   │   └── libraries/
│   │   ├── script/
│   │   └── test/
│   │       └── mocks/
│   │
│   ├── sdk/                 # TypeScript SDK
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │
│   ├── indexer/             # Ponder indexer
│   │   ├── package.json
│   │   ├── ponder.config.ts
│   │   └── src/
│   │
│   └── shared/              # Shared types & constants
│       ├── package.json
│       └── src/
│           ├── types.ts
│           ├── constants.ts
│           └── abis.ts
│
├── agents/
│   ├── treasury-agent/
│   ├── strategy-agent/
│   └── router-agent/
│
├── apps/
│   └── dashboard/           # Next.js frontend
│
├── package.json             # Root package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### 2. Foundry Project Setup

Initialize Foundry with Uniswap v4 dependencies:

```toml
# packages/contracts/foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.26"
optimizer = true
optimizer_runs = 200
via_ir = true
ffi = true

[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

Install dependencies:
- `forge install uniswap/v4-core`
- `forge install uniswap/v4-periphery`
- `forge install OpenZeppelin/openzeppelin-contracts`
- `forge install safe-global/safe-smart-account`
- `forge install gnosis/zodiac`

### 3. Remappings

```
# packages/contracts/remappings.txt
@uniswap/v4-core/=lib/v4-core/
@uniswap/v4-periphery/=lib/v4-periphery/
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
@safe-global/=lib/safe-smart-account/contracts/
@gnosis.pm/zodiac/=lib/zodiac/contracts/
forge-std/=lib/forge-std/src/
```

### 4. Shared Package

Create shared types and constants used across all packages:

```typescript
// packages/shared/src/types.ts
export interface AgentRecord {
  type: 'treasury' | 'router' | 'lp' | 'vault' | 'netting' | 'receipts';
  mode: 'intent-only' | 'safe-roles';
  version: string;
  chainId: number;
  entrypoint: `0x${string}`;
  a2a?: string;
  x402?: string;
  safe?: `0x${string}`;
  rolesModifier?: `0x${string}`;
  erc8004?: string;
}

export interface ExecutionReceipt {
  strategyId: `0x${string}`;
  quoteId: `0x${string}`;
  sender: `0x${string}`;
  amount0: bigint;
  amount1: bigint;
  actualSlippage: bigint;
  policyCompliant: boolean;
  timestamp: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface Intent {
  user: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: bigint;
  maxSlippage: bigint;
  deadline: bigint;
  strategyId: `0x${string}`;
}
```

```typescript
// packages/shared/src/constants.ts
export const CHAIN_ID = 11155111; // Sepolia

export const ADDRESSES = {
  // Uniswap v4
  POOL_MANAGER: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
  UNIVERSAL_ROUTER: '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b',
  POSITION_MANAGER: '0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4',
  QUOTER: '0x61b3f2011a92d183c7dbadbda940a7555ccf9227',

  // Gnosis Safe
  SAFE_SINGLETON: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
  SAFE_FACTORY: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',

  // Zodiac
  ROLES_MODIFIER: '0x9646fDAD06d3e24444381f44362a3B0eB343D337',

  // Tokens
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',

  // ENS
  ENS_REGISTRY: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  ENS_RESOLVER: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
} as const;

export const ENS_RECORDS = {
  TYPE: 'agent:type',
  MODE: 'agent:mode',
  VERSION: 'agent:version',
  CHAIN_ID: 'agent:chainId',
  ENTRYPOINT: 'agent:entrypoint',
  A2A: 'agent:a2a',
  X402: 'agent:x402',
  SAFE: 'agent:safe',
  ROLES_MODIFIER: 'agent:rolesModifier',
  ERC8004: 'agent:erc8004',
} as const;
```

### 5. Root Package Configuration

```json
// package.json (root)
{
  "name": "oikonomos",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "contracts:build": "cd packages/contracts && forge build",
    "contracts:test": "cd packages/contracts && forge test",
    "contracts:deploy": "cd packages/contracts && forge script"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "agents/*"
  - "apps/*"
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "out/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
```

### 6. Interface Stubs

Create interface files for all contracts (to be implemented in Phase 1):

```solidity
// packages/contracts/src/core/interfaces/IReceiptHook.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IReceiptHook {
    event ExecutionReceipt(
        bytes32 indexed strategyId,
        bytes32 indexed quoteId,
        address indexed sender,
        int128 amount0,
        int128 amount1,
        uint256 actualSlippage,
        bool policyCompliant,
        uint256 timestamp
    );
}
```

```solidity
// packages/contracts/src/identity/interfaces/IIdentityRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IIdentityRegistry {
    struct Agent {
        string agentURI;
        address agentWallet;
        uint256 registeredAt;
    }

    function register(string calldata agentURI, bytes calldata metadata) external returns (uint256 agentId);
    function agents(uint256 agentId) external view returns (Agent memory);
    function updateAgentWallet(uint256 agentId, address newWallet, bytes calldata signature) external;
}
```

```solidity
// packages/contracts/src/policy/interfaces/IIntentRouter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IIntentRouter {
    struct Intent {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 maxSlippage;
        uint256 deadline;
        bytes32 strategyId;
    }

    function executeIntent(
        Intent calldata intent,
        bytes calldata signature,
        bytes calldata strategyData
    ) external;
}
```

## Acceptance Criteria

- [ ] Monorepo structure created with all directories
- [ ] Foundry project initializes and compiles
- [ ] All Uniswap v4 and external dependencies installed
- [ ] Remappings configured correctly
- [ ] Shared package with types and constants
- [ ] Root package.json with workspace scripts
- [ ] turbo.json configured for build pipeline
- [ ] Interface stubs for all contracts
- [ ] `pnpm install` succeeds at root
- [ ] `forge build` succeeds in packages/contracts

## Commands to Run

```bash
# After scaffolding, verify:
cd packages/contracts && forge build
cd ../.. && pnpm install
pnpm run contracts:build
```

## Notes

- Do NOT implement contract logic yet - only interfaces and stubs
- Ensure .gitignore includes: `node_modules/`, `out/`, `cache/`, `.env`
- The existing `.env` file has all API keys configured
- Use Solidity 0.8.26 for v4 compatibility

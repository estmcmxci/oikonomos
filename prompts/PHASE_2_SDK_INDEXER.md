# Phase 2: TypeScript SDK & Ponder Indexer

## Objective

Build the TypeScript SDK for interacting with Oikonomos contracts and the Ponder indexer for tracking ExecutionReceipt events and computing strategy metrics.

## Prerequisites

- Phase 0 completed (monorepo structure)
- Phase 1 completed (contracts deployed to Sepolia)
- `.env` updated with deployed contract addresses

## Context Files

Read these before starting:
- `/EED.md` - Section on Phase 3 (SDK + Indexer specs)
- `/context/viem.md` - Viem TypeScript library
- `/context/wagmi.md` - Wagmi React hooks
- `/context/ens.md` - ENS resolution

## Deliverables

### 1. SDK Package Structure

```
packages/sdk/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── contracts/
│   │   ├── receiptHook.ts
│   │   ├── identityRegistry.ts
│   │   └── intentRouter.ts
│   ├── ens/
│   │   ├── resolver.ts
│   │   ├── records.ts
│   │   └── types.ts
│   ├── intents/
│   │   ├── builder.ts
│   │   ├── signer.ts
│   │   └── types.ts
│   ├── receipts/
│   │   ├── decoder.ts
│   │   ├── verifier.ts
│   │   └── types.ts
│   └── types.ts
└── test/
    └── sdk.test.ts
```

### 2. SDK Package Configuration

```json
// packages/sdk/package.json
{
  "name": "@oikonomos/sdk",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "viem": "^2.21.0",
    "@oikonomos/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

```json
// packages/sdk/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. Contract ABIs and Typed Wrappers

```typescript
// packages/sdk/src/contracts/receiptHook.ts
import { Abi, Address, PublicClient, decodeEventLog, Log } from 'viem';
import { ExecutionReceipt } from '@oikonomos/shared';

export const ReceiptHookABI = [
  {
    type: 'event',
    name: 'ExecutionReceipt',
    inputs: [
      { name: 'strategyId', type: 'bytes32', indexed: true },
      { name: 'quoteId', type: 'bytes32', indexed: true },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'amount0', type: 'int128', indexed: false },
      { name: 'amount1', type: 'int128', indexed: false },
      { name: 'actualSlippage', type: 'uint256', indexed: false },
      { name: 'policyCompliant', type: 'bool', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

export function decodeReceiptLog(log: Log): ExecutionReceipt {
  const decoded = decodeEventLog({
    abi: ReceiptHookABI,
    data: log.data,
    topics: log.topics,
  });

  return {
    strategyId: decoded.args.strategyId,
    quoteId: decoded.args.quoteId,
    sender: decoded.args.sender,
    amount0: decoded.args.amount0,
    amount1: decoded.args.amount1,
    actualSlippage: decoded.args.actualSlippage,
    policyCompliant: decoded.args.policyCompliant,
    timestamp: decoded.args.timestamp,
    blockNumber: log.blockNumber!,
    transactionHash: log.transactionHash!,
  };
}

export async function getReceipts(
  client: PublicClient,
  hookAddress: Address,
  fromBlock: bigint,
  toBlock?: bigint
): Promise<ExecutionReceipt[]> {
  const logs = await client.getLogs({
    address: hookAddress,
    event: ReceiptHookABI[0],
    fromBlock,
    toBlock: toBlock ?? 'latest',
  });

  return logs.map(decodeReceiptLog);
}

export async function getReceiptsByStrategy(
  client: PublicClient,
  hookAddress: Address,
  strategyId: `0x${string}`,
  fromBlock: bigint
): Promise<ExecutionReceipt[]> {
  const logs = await client.getLogs({
    address: hookAddress,
    event: ReceiptHookABI[0],
    args: { strategyId },
    fromBlock,
  });

  return logs.map(decodeReceiptLog);
}
```

```typescript
// packages/sdk/src/contracts/identityRegistry.ts
import { Address, PublicClient, WalletClient, encodeFunctionData } from 'viem';
import { AgentRecord } from '@oikonomos/shared';

export const IdentityRegistryABI = [
  {
    type: 'function',
    name: 'register',
    inputs: [
      { name: 'agentURI', type: 'string' },
      { name: 'metadata', type: 'bytes' },
    ],
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAgent',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'agentURI', type: 'string' },
          { name: 'agentWallet', type: 'address' },
          { name: 'registeredAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'updateAgentWallet',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newWallet', type: 'address' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'AgentRegistered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'agentURI', type: 'string', indexed: false },
    ],
  },
] as const;

export async function registerAgent(
  walletClient: WalletClient,
  registryAddress: Address,
  agentURI: string,
  metadata: `0x${string}` = '0x'
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: registryAddress,
    abi: IdentityRegistryABI,
    functionName: 'register',
    args: [agentURI, metadata],
  });

  return hash;
}

export async function getAgent(
  client: PublicClient,
  registryAddress: Address,
  agentId: bigint
): Promise<{ agentURI: string; agentWallet: Address; registeredAt: bigint }> {
  const result = await client.readContract({
    address: registryAddress,
    abi: IdentityRegistryABI,
    functionName: 'getAgent',
    args: [agentId],
  });

  return result;
}
```

```typescript
// packages/sdk/src/contracts/intentRouter.ts
import {
  Address,
  PublicClient,
  WalletClient,
  encodePacked,
  keccak256,
  toBytes,
} from 'viem';
import { Intent } from '@oikonomos/shared';

export const IntentRouterABI = [
  {
    type: 'function',
    name: 'executeIntent',
    inputs: [
      {
        name: 'intent',
        type: 'tuple',
        components: [
          { name: 'user', type: 'address' },
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'maxSlippage', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'strategyId', type: 'bytes32' },
          { name: 'nonce', type: 'uint256' },
        ],
      },
      { name: 'signature', type: 'bytes' },
      {
        name: 'poolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
      },
      { name: 'strategyData', type: 'bytes' },
    ],
    outputs: [{ name: 'amountOut', type: 'int256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getNonce',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'DOMAIN_SEPARATOR',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
] as const;

export async function getNonce(
  client: PublicClient,
  routerAddress: Address,
  user: Address
): Promise<bigint> {
  return await client.readContract({
    address: routerAddress,
    abi: IntentRouterABI,
    functionName: 'getNonce',
    args: [user],
  });
}

export async function getDomainSeparator(
  client: PublicClient,
  routerAddress: Address
): Promise<`0x${string}`> {
  return await client.readContract({
    address: routerAddress,
    abi: IntentRouterABI,
    functionName: 'DOMAIN_SEPARATOR',
  });
}
```

### 4. ENS Resolution

```typescript
// packages/sdk/src/ens/resolver.ts
import { PublicClient, namehash, Address } from 'viem';
import { normalize } from 'viem/ens';
import { AgentRecord, ENS_RECORDS } from '@oikonomos/shared';

export async function resolveAgent(
  client: PublicClient,
  ensName: string
): Promise<AgentRecord | null> {
  const normalizedName = normalize(ensName);

  try {
    const records = await Promise.all([
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.TYPE }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.MODE }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.VERSION }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.CHAIN_ID }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.ENTRYPOINT }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.A2A }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.X402 }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.SAFE }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.ROLES_MODIFIER }),
      client.getEnsText({ name: normalizedName, key: ENS_RECORDS.ERC8004 }),
    ]);

    const [type, mode, version, chainId, entrypoint, a2a, x402, safe, rolesModifier, erc8004] = records;

    if (!type || !entrypoint) {
      return null;
    }

    return {
      type: type as AgentRecord['type'],
      mode: (mode || 'intent-only') as AgentRecord['mode'],
      version: version || '0.1.0',
      chainId: chainId ? parseInt(chainId) : 11155111,
      entrypoint: entrypoint as Address,
      a2a: a2a || undefined,
      x402: x402 || undefined,
      safe: safe as Address | undefined,
      rolesModifier: rolesModifier as Address | undefined,
      erc8004: erc8004 || undefined,
    };
  } catch (error) {
    console.error('Failed to resolve ENS agent:', error);
    return null;
  }
}

export function ensNameToStrategyId(ensName: string): `0x${string}` {
  return keccak256(toBytes(ensName));
}

export function getNamehash(ensName: string): `0x${string}` {
  return namehash(normalize(ensName));
}
```

### 5. Intent Builder & Signer

```typescript
// packages/sdk/src/intents/builder.ts
import { Address, keccak256, toBytes } from 'viem';
import { Intent } from '@oikonomos/shared';

export interface BuildIntentParams {
  user: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  maxSlippageBps: number; // basis points (100 = 1%)
  ttlSeconds: number;
  strategyEns: string;
  nonce: bigint;
}

export function buildIntent(params: BuildIntentParams): Intent {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + params.ttlSeconds);
  const strategyId = keccak256(toBytes(params.strategyEns));

  return {
    user: params.user,
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    maxSlippage: BigInt(params.maxSlippageBps),
    deadline,
    strategyId,
    nonce: params.nonce,
  };
}
```

```typescript
// packages/sdk/src/intents/signer.ts
import { WalletClient, Address } from 'viem';
import { Intent } from '@oikonomos/shared';

const INTENT_TYPEHASH = 'Intent(address user,address tokenIn,address tokenOut,uint256 amountIn,uint256 maxSlippage,uint256 deadline,bytes32 strategyId,uint256 nonce)';

export async function signIntent(
  walletClient: WalletClient,
  routerAddress: Address,
  chainId: number,
  intent: Intent
): Promise<`0x${string}`> {
  const signature = await walletClient.signTypedData({
    domain: {
      name: 'OikonomosIntentRouter',
      version: '1',
      chainId,
      verifyingContract: routerAddress,
    },
    types: {
      Intent: [
        { name: 'user', type: 'address' },
        { name: 'tokenIn', type: 'address' },
        { name: 'tokenOut', type: 'address' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'maxSlippage', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'strategyId', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
      ],
    },
    primaryType: 'Intent',
    message: {
      user: intent.user,
      tokenIn: intent.tokenIn,
      tokenOut: intent.tokenOut,
      amountIn: intent.amountIn,
      maxSlippage: intent.maxSlippage,
      deadline: intent.deadline,
      strategyId: intent.strategyId,
      nonce: intent.nonce,
    },
  });

  return signature;
}
```

### 6. SDK Index Export

```typescript
// packages/sdk/src/index.ts
// Contracts
export { ReceiptHookABI, decodeReceiptLog, getReceipts, getReceiptsByStrategy } from './contracts/receiptHook';
export { IdentityRegistryABI, registerAgent, getAgent } from './contracts/identityRegistry';
export { IntentRouterABI, getNonce, getDomainSeparator } from './contracts/intentRouter';

// ENS
export { resolveAgent, ensNameToStrategyId, getNamehash } from './ens/resolver';

// Intents
export { buildIntent, type BuildIntentParams } from './intents/builder';
export { signIntent } from './intents/signer';

// Re-export shared types
export type { AgentRecord, ExecutionReceipt, Intent } from '@oikonomos/shared';
```

---

## Ponder Indexer

### 7. Indexer Package Structure

```
packages/indexer/
├── package.json
├── ponder.config.ts
├── ponder.schema.ts
├── src/
│   ├── handlers/
│   │   ├── receiptHook.ts
│   │   └── identityRegistry.ts
│   ├── aggregations/
│   │   └── strategyMetrics.ts
│   └── api/
│       ├── index.ts
│       ├── receipts.ts
│       └── strategies.ts
└── abis/
    ├── ReceiptHook.json
    └── IdentityRegistry.json
```

### 8. Ponder Configuration

```typescript
// packages/indexer/ponder.config.ts
import { createConfig } from '@ponder/core';
import { http } from 'viem';

export default createConfig({
  networks: {
    sepolia: {
      chainId: 11155111,
      transport: http(process.env.PONDER_RPC_URL_11155111),
    },
  },
  contracts: {
    ReceiptHook: {
      network: 'sepolia',
      abi: './abis/ReceiptHook.json',
      address: process.env.RECEIPT_HOOK_ADDRESS as `0x${string}`,
      startBlock: Number(process.env.RECEIPT_HOOK_START_BLOCK || 0),
    },
    IdentityRegistry: {
      network: 'sepolia',
      abi: './abis/IdentityRegistry.json',
      address: process.env.IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
      startBlock: Number(process.env.IDENTITY_REGISTRY_START_BLOCK || 0),
    },
  },
});
```

### 9. Ponder Schema

```typescript
// packages/indexer/ponder.schema.ts
import { createSchema } from '@ponder/core';

export default createSchema((p) => ({
  // Execution receipts from ReceiptHook
  ExecutionReceipt: p.createTable({
    id: p.string(),
    strategyId: p.hex(),
    quoteId: p.hex(),
    sender: p.hex(),
    amount0: p.bigint(),
    amount1: p.bigint(),
    actualSlippage: p.bigint(),
    policyCompliant: p.boolean(),
    timestamp: p.bigint(),
    blockNumber: p.bigint(),
    transactionHash: p.hex(),
  }),

  // Strategy metrics (aggregated from receipts)
  StrategyMetrics: p.createTable({
    id: p.string(), // strategyId as hex string
    totalExecutions: p.bigint(),
    totalVolume: p.bigint(),
    avgSlippage: p.bigint(), // basis points
    successRate: p.bigint(), // basis points (10000 = 100%)
    complianceRate: p.bigint(), // basis points
    lastExecutionAt: p.bigint(),
  }),

  // Registered agents from IdentityRegistry
  Agent: p.createTable({
    id: p.string(), // agentId as string
    owner: p.hex(),
    agentURI: p.string(),
    agentWallet: p.hex(),
    registeredAt: p.bigint(),
  }),
}));
```

### 10. Event Handlers

```typescript
// packages/indexer/src/handlers/receiptHook.ts
import { ponder } from '@/generated';

ponder.on('ReceiptHook:ExecutionReceipt', async ({ event, context }) => {
  const receiptId = `${event.transaction.hash}-${event.log.logIndex}`;

  // Store the receipt
  await context.db.ExecutionReceipt.create({
    id: receiptId,
    data: {
      strategyId: event.args.strategyId,
      quoteId: event.args.quoteId,
      sender: event.args.sender,
      amount0: event.args.amount0,
      amount1: event.args.amount1,
      actualSlippage: event.args.actualSlippage,
      policyCompliant: event.args.policyCompliant,
      timestamp: event.args.timestamp,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    },
  });

  // Update strategy metrics
  const strategyId = event.args.strategyId;
  const existingMetrics = await context.db.StrategyMetrics.findUnique({
    id: strategyId,
  });

  const volume = event.args.amount0 > 0n ? event.args.amount0 : -event.args.amount0;

  if (existingMetrics) {
    const newTotalExecutions = existingMetrics.totalExecutions + 1n;
    const newTotalVolume = existingMetrics.totalVolume + volume;

    // Running average for slippage
    const newAvgSlippage =
      (existingMetrics.avgSlippage * existingMetrics.totalExecutions +
        event.args.actualSlippage) /
      newTotalExecutions;

    // Running average for compliance rate
    const complianceIncrement = event.args.policyCompliant ? 10000n : 0n;
    const newComplianceRate =
      (existingMetrics.complianceRate * existingMetrics.totalExecutions +
        complianceIncrement) /
      newTotalExecutions;

    await context.db.StrategyMetrics.update({
      id: strategyId,
      data: {
        totalExecutions: newTotalExecutions,
        totalVolume: newTotalVolume,
        avgSlippage: newAvgSlippage,
        complianceRate: newComplianceRate,
        lastExecutionAt: event.args.timestamp,
      },
    });
  } else {
    await context.db.StrategyMetrics.create({
      id: strategyId,
      data: {
        totalExecutions: 1n,
        totalVolume: volume,
        avgSlippage: event.args.actualSlippage,
        successRate: 10000n, // 100% initially
        complianceRate: event.args.policyCompliant ? 10000n : 0n,
        lastExecutionAt: event.args.timestamp,
      },
    });
  }
});
```

```typescript
// packages/indexer/src/handlers/identityRegistry.ts
import { ponder } from '@/generated';

ponder.on('IdentityRegistry:AgentRegistered', async ({ event, context }) => {
  await context.db.Agent.create({
    id: event.args.agentId.toString(),
    data: {
      owner: event.args.owner,
      agentURI: event.args.agentURI,
      agentWallet: event.args.owner, // Initially same as owner
      registeredAt: event.block.timestamp,
    },
  });
});

ponder.on('IdentityRegistry:AgentWalletUpdated', async ({ event, context }) => {
  await context.db.Agent.update({
    id: event.args.agentId.toString(),
    data: {
      agentWallet: event.args.newWallet,
    },
  });
});
```

### 11. API Endpoints

```typescript
// packages/indexer/src/api/index.ts
import { ponder } from '@/generated';

// Get receipts for a strategy
ponder.get('/receipts/:strategyId', async (c) => {
  const strategyId = c.req.param('strategyId');

  const receipts = await c.db.ExecutionReceipt.findMany({
    where: { strategyId: strategyId as `0x${string}` },
    orderBy: { timestamp: 'desc' },
    limit: 100,
  });

  return c.json(receipts);
});

// Get strategy metrics
ponder.get('/strategies/:strategyId', async (c) => {
  const strategyId = c.req.param('strategyId');

  const metrics = await c.db.StrategyMetrics.findUnique({
    id: strategyId,
  });

  if (!metrics) {
    return c.json({ error: 'Strategy not found' }, 404);
  }

  return c.json(metrics);
});

// Get leaderboard
ponder.get('/leaderboard', async (c) => {
  const strategies = await c.db.StrategyMetrics.findMany({
    orderBy: { totalVolume: 'desc' },
    limit: 50,
  });

  return c.json(strategies);
});

// Get agent by ID
ponder.get('/agents/:agentId', async (c) => {
  const agentId = c.req.param('agentId');

  const agent = await c.db.Agent.findUnique({
    id: agentId,
  });

  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  return c.json(agent);
});
```

### 12. Indexer Package.json

```json
// packages/indexer/package.json
{
  "name": "@oikonomos/indexer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "ponder dev",
    "start": "ponder start",
    "codegen": "ponder codegen"
  },
  "dependencies": {
    "@ponder/core": "^0.6.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

## Acceptance Criteria

### SDK
- [ ] All contract ABIs typed correctly
- [ ] ENS resolution returns AgentRecord
- [ ] Intent builder creates valid Intent struct
- [ ] Intent signer produces valid EIP-712 signature
- [ ] Receipt decoder parses ExecutionReceipt events
- [ ] `pnpm build` succeeds in packages/sdk

### Indexer
- [ ] Ponder config connects to Sepolia RPC
- [ ] ExecutionReceipt events indexed correctly
- [ ] StrategyMetrics computed and updated
- [ ] API endpoints return correct data
- [ ] `pnpm dev` starts indexer successfully

## Commands

```bash
# Build SDK
cd packages/sdk
pnpm build

# Start Indexer (dev mode)
cd packages/indexer
pnpm dev

# Indexer will be available at http://localhost:42069
```

## Post-Phase Tasks

After this phase:
1. Update `.env` with `PONDER_URL=http://localhost:42069`
2. Test SDK by resolving `treasury.oikonomos.eth`
3. Verify indexer catches test ExecutionReceipt events

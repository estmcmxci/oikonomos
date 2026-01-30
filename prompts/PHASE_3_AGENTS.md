# Phase 3: Agent Services (Cloudflare Workers)

## Objective

Build and deploy the treasury-agent and strategy-agent as Cloudflare Workers implementing the A2A (Agent-to-Agent) protocol. These agents automate Uniswap v4 interactions under user-defined policies.

## Prerequisites

- Phase 0-2 completed
- Contracts deployed to Sepolia
- SDK and Indexer functional
- Cloudflare account configured (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN in .env)

## Context Files

Read these before starting:
- `/EED.md` - Section on Phase 5 (Agent Services)
- `/ENS-native Agent Registry for Uniswap v4 Automation.md` - User journeys, A2A protocol
- `/context/eip-712.md` - Typed data signing

## Deliverables

### 1. Agent Directory Structure

```
agents/
├── strategy-agent/
│   ├── package.json
│   ├── wrangler.toml
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── a2a/
│       │   ├── agent-card.ts
│       │   ├── quote.ts
│       │   └── execute.ts
│       ├── strategy/
│       │   ├── router.ts
│       │   └── optimizer.ts
│       ├── x402/
│       │   └── pricing.ts
│       └── utils/
│           ├── hookData.ts
│           └── quoteId.ts
│
├── treasury-agent/
│   ├── package.json
│   ├── wrangler.toml
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── policy/
│       │   ├── parser.ts
│       │   ├── validator.ts
│       │   └── templates.ts
│       ├── triggers/
│       │   ├── drift.ts
│       │   ├── periodic.ts
│       │   └── threshold.ts
│       ├── rebalance/
│       │   ├── calculator.ts
│       │   ├── tranches.ts
│       │   └── executor.ts
│       └── modes/
│           ├── intentMode.ts
│           └── safeMode.ts
│
└── shared/
    ├── package.json
    └── src/
        ├── a2a-types.ts
        ├── viem-client.ts
        └── env.ts
```

### 2. Strategy Agent

#### Wrangler Configuration

```toml
# agents/strategy-agent/wrangler.toml
name = "oikonomos-strategy-agent"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
CHAIN_ID = "11155111"
POOL_MANAGER = "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543"
QUOTER = "0x61b3f2011a92d183c7dbadbda940a7555ccf9227"

# Secrets (set via wrangler secret put)
# PRIVATE_KEY - Agent executor private key
# RPC_URL - Sepolia RPC URL
```

#### Main Entry Point

```typescript
// agents/strategy-agent/src/index.ts
import { handleAgentCard } from './a2a/agent-card';
import { handleQuote } from './a2a/quote';
import { handleExecute } from './a2a/execute';
import { handlePricing } from './x402/pricing';

export interface Env {
  CHAIN_ID: string;
  POOL_MANAGER: string;
  QUOTER: string;
  PRIVATE_KEY: string;
  RPC_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // A2A Protocol Endpoints
      if (url.pathname === '/.well-known/agent-card.json' || url.pathname === '/a2a') {
        return handleAgentCard(env, corsHeaders);
      }

      if (url.pathname === '/quote' && request.method === 'POST') {
        return handleQuote(request, env, corsHeaders);
      }

      if (url.pathname === '/execute' && request.method === 'POST') {
        return handleExecute(request, env, corsHeaders);
      }

      // x402 Endpoints
      if (url.pathname === '/pricing') {
        return handlePricing(env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
```

#### A2A Agent Card

```typescript
// agents/strategy-agent/src/a2a/agent-card.ts
import { Env } from '../index';

export function handleAgentCard(env: Env, corsHeaders: Record<string, string>): Response {
  const agentCard = {
    name: 'Oikonomos Routing Strategy',
    description: 'Optimized swap routing for Uniswap v4 with MEV protection',
    version: '0.1.0',
    chainId: parseInt(env.CHAIN_ID),

    capabilities: ['swap', 'quote', 'route-optimization'],

    endpoints: {
      quote: '/quote',
      execute: '/execute',
      pricing: '/pricing',
    },

    supportedTokens: [
      '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
      '0x0000000000000000000000000000000000000000', // ETH
    ],

    constraints: {
      maxSlippageBps: 100, // 1% max
      minAmountUsd: 10,
      maxAmountUsd: 1000000,
    },

    pricing: {
      model: 'per-quote',
      feesBps: 0, // Free for MVP
    },

    contact: {
      ens: 'strategy.router.oikonomos.eth',
    },
  };

  return new Response(JSON.stringify(agentCard, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

#### Quote Handler

```typescript
// agents/strategy-agent/src/a2a/quote.ts
import { Env } from '../index';
import { findOptimalRoute } from '../strategy/router';
import { generateQuoteId } from '../utils/quoteId';

interface QuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  maxSlippageBps?: number;
  sender?: string;
}

interface QuoteResponse {
  quoteId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  estimatedSlippageBps: number;
  route: RouteStep[];
  hookData: string;
  expiresAt: number;
}

interface RouteStep {
  pool: string;
  tokenIn: string;
  tokenOut: string;
  fee: number;
}

export async function handleQuote(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const body: QuoteRequest = await request.json();

  // Validate request
  if (!body.tokenIn || !body.tokenOut || !body.amountIn) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: tokenIn, tokenOut, amountIn' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const maxSlippage = body.maxSlippageBps || 50; // Default 0.5%

  // Find optimal route
  const route = await findOptimalRoute(
    env,
    body.tokenIn,
    body.tokenOut,
    BigInt(body.amountIn)
  );

  // Generate quote ID for attribution
  const quoteId = generateQuoteId();

  // Build hookData for ReceiptHook
  const strategyId = '0x' + Buffer.from('strategy.router.oikonomos.eth').toString('hex').padEnd(64, '0');
  const hookData = encodeHookData(strategyId, quoteId, maxSlippage);

  const response: QuoteResponse = {
    quoteId,
    tokenIn: body.tokenIn,
    tokenOut: body.tokenOut,
    amountIn: body.amountIn,
    expectedAmountOut: route.expectedAmountOut.toString(),
    estimatedSlippageBps: route.estimatedSlippageBps,
    route: route.steps,
    hookData,
    expiresAt: Date.now() + 60000, // 1 minute expiry
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function encodeHookData(strategyId: string, quoteId: string, maxSlippage: number): string {
  // ABI encode (bytes32 strategyId, bytes32 quoteId, uint256 maxSlippage)
  const strategyIdPadded = strategyId.slice(2).padStart(64, '0');
  const quoteIdPadded = quoteId.slice(2).padStart(64, '0');
  const slippageHex = maxSlippage.toString(16).padStart(64, '0');

  return '0x' + strategyIdPadded + quoteIdPadded + slippageHex;
}
```

#### Route Optimizer

```typescript
// agents/strategy-agent/src/strategy/router.ts
import { createPublicClient, http, parseAbi, Address } from 'viem';
import { sepolia } from 'viem/chains';
import { Env } from '../index';

interface RouteResult {
  expectedAmountOut: bigint;
  estimatedSlippageBps: number;
  steps: RouteStep[];
}

interface RouteStep {
  pool: string;
  tokenIn: string;
  tokenOut: string;
  fee: number;
}

export async function findOptimalRoute(
  env: Env,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint
): Promise<RouteResult> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  // For MVP: Direct swap route
  // In production: Multi-hop optimization, liquidity analysis

  // Simplified quote using Quoter contract
  try {
    // Direct pool route
    const directRoute: RouteStep = {
      pool: `${tokenIn}-${tokenOut}-3000`, // 0.3% fee pool
      tokenIn,
      tokenOut,
      fee: 3000,
    };

    // Estimate output (simplified - production would use Quoter)
    const estimatedOutput = amountIn * 9950n / 10000n; // Assume 0.5% slippage

    return {
      expectedAmountOut: estimatedOutput,
      estimatedSlippageBps: 50,
      steps: [directRoute],
    };
  } catch (error) {
    console.error('Route finding error:', error);
    throw new Error('Failed to find route');
  }
}
```

#### Quote ID Generator

```typescript
// agents/strategy-agent/src/utils/quoteId.ts
import { keccak256, toBytes, concat } from 'viem';

export function generateQuoteId(): `0x${string}` {
  const timestamp = Date.now().toString();
  const random = Math.random().toString();
  return keccak256(toBytes(timestamp + random));
}
```

### 3. Treasury Agent

#### Wrangler Configuration

```toml
# agents/treasury-agent/wrangler.toml
name = "oikonomos-treasury-agent"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
CHAIN_ID = "11155111"
INTENT_ROUTER = ""  # Set after Phase 1 deployment
STRATEGY_AGENT_URL = "https://oikonomos-strategy-agent.workers.dev"

# Secrets (set via wrangler secret put)
# PRIVATE_KEY - Agent executor private key
# RPC_URL - Sepolia RPC URL
```

#### Main Entry Point

```typescript
// agents/treasury-agent/src/index.ts
import { handleAgentCard } from './a2a/agent-card';
import { handleConfigure } from './policy/parser';
import { handleTriggerCheck } from './triggers/drift';
import { handleRebalance } from './rebalance/executor';

export interface Env {
  CHAIN_ID: string;
  INTENT_ROUTER: string;
  STRATEGY_AGENT_URL: string;
  PRIVATE_KEY: string;
  RPC_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // A2A Endpoints
      if (url.pathname === '/.well-known/agent-card.json' || url.pathname === '/a2a') {
        return handleAgentCard(env, corsHeaders);
      }

      // Policy Configuration
      if (url.pathname === '/configure' && request.method === 'POST') {
        return handleConfigure(request, env, corsHeaders);
      }

      // Trigger Check (called by scheduler or manually)
      if (url.pathname === '/check-triggers' && request.method === 'POST') {
        return handleTriggerCheck(request, env, corsHeaders);
      }

      // Execute Rebalance
      if (url.pathname === '/rebalance' && request.method === 'POST') {
        return handleRebalance(request, env, corsHeaders);
      }

      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },

  // Scheduled trigger (Cloudflare Cron)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Check for drift every hour
    ctx.waitUntil(checkAndRebalance(env));
  },
};

async function checkAndRebalance(env: Env) {
  // Implementation for scheduled drift checks
  console.log('Scheduled drift check running...');
}
```

#### Treasury Agent Card

```typescript
// agents/treasury-agent/src/a2a/agent-card.ts
import { Env } from '../index';

export function handleAgentCard(env: Env, corsHeaders: Record<string, string>): Response {
  const agentCard = {
    name: 'Oikonomos Treasury Agent',
    description: 'Automated stablecoin treasury rebalancing with policy enforcement',
    version: '0.1.0',
    chainId: parseInt(env.CHAIN_ID),
    mode: 'intent-only', // or 'safe-roles' for DAO mode

    capabilities: [
      'rebalance',
      'drift-detection',
      'policy-enforcement',
      'multi-token',
    ],

    endpoints: {
      configure: '/configure',
      checkTriggers: '/check-triggers',
      rebalance: '/rebalance',
      health: '/health',
    },

    supportedTokens: [
      '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
    ],

    policyTemplates: [
      {
        name: 'stablecoin-rebalance',
        description: 'Maintain target allocation across stablecoins',
        params: ['targetAllocations', 'driftThreshold', 'maxSlippage', 'maxDaily'],
      },
    ],

    contact: {
      ens: 'treasury.oikonomos.eth',
    },
  };

  return new Response(JSON.stringify(agentCard, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

#### Drift Detection

```typescript
// agents/treasury-agent/src/triggers/drift.ts
import { createPublicClient, http, erc20Abi, Address, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { Env } from '../index';

interface Allocation {
  token: Address;
  symbol: string;
  balance: bigint;
  percentage: number;
  targetPercentage: number;
}

interface DriftResult {
  hasDrift: boolean;
  drifts: {
    token: Address;
    symbol: string;
    currentPercentage: number;
    targetPercentage: number;
    drift: number;
    action: 'buy' | 'sell';
    amount: bigint;
  }[];
}

export async function handleTriggerCheck(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const body = await request.json();
  const { userAddress, policy } = body;

  if (!userAddress || !policy) {
    return new Response(
      JSON.stringify({ error: 'Missing userAddress or policy' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const result = await checkDrift(env, userAddress, policy);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function checkDrift(
  env: Env,
  userAddress: Address,
  policy: {
    tokens: { address: Address; symbol: string; targetPercentage: number }[];
    driftThreshold: number;
  }
): Promise<DriftResult> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(env.RPC_URL),
  });

  // Get current balances
  const balances = await Promise.all(
    policy.tokens.map(async (token) => {
      const balance = await client.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [userAddress],
      });
      return { ...token, balance };
    })
  );

  // Calculate total value (simplified - assumes all tokens have same decimals)
  const totalBalance = balances.reduce((sum, t) => sum + t.balance, 0n);

  if (totalBalance === 0n) {
    return { hasDrift: false, drifts: [] };
  }

  // Calculate current allocations and drifts
  const allocations: Allocation[] = balances.map((token) => ({
    token: token.address,
    symbol: token.symbol,
    balance: token.balance,
    percentage: Number((token.balance * 10000n) / totalBalance) / 100,
    targetPercentage: token.targetPercentage,
  }));

  const drifts = allocations
    .map((alloc) => {
      const drift = Math.abs(alloc.percentage - alloc.targetPercentage);
      const action = alloc.percentage > alloc.targetPercentage ? 'sell' : 'buy';

      // Calculate amount to trade
      const targetBalance = (totalBalance * BigInt(Math.floor(alloc.targetPercentage * 100))) / 10000n;
      const amountDiff = alloc.balance > targetBalance
        ? alloc.balance - targetBalance
        : targetBalance - alloc.balance;

      return {
        token: alloc.token,
        symbol: alloc.symbol,
        currentPercentage: alloc.percentage,
        targetPercentage: alloc.targetPercentage,
        drift,
        action: action as 'buy' | 'sell',
        amount: amountDiff,
      };
    })
    .filter((d) => d.drift > policy.driftThreshold);

  return {
    hasDrift: drifts.length > 0,
    drifts,
  };
}
```

#### Rebalance Executor

```typescript
// agents/treasury-agent/src/rebalance/executor.ts
import { createWalletClient, createPublicClient, http, Address, parseUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { Env } from '../index';

interface RebalanceRequest {
  userAddress: Address;
  policy: {
    tokens: { address: Address; symbol: string; targetPercentage: number }[];
    driftThreshold: number;
    maxSlippageBps: number;
    maxDailyUsd: number;
  };
  signature: string; // User's signed intent authorization
}

interface RebalanceResult {
  success: boolean;
  trades: {
    tokenIn: Address;
    tokenOut: Address;
    amountIn: string;
    expectedAmountOut: string;
    quoteId: string;
    txHash?: string;
  }[];
  receipts: string[];
}

export async function handleRebalance(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const body: RebalanceRequest = await request.json();

  if (!body.userAddress || !body.policy || !body.signature) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = await executeRebalance(env, body);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Rebalance error:', error);
    return new Response(
      JSON.stringify({ error: 'Rebalance failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function executeRebalance(env: Env, request: RebalanceRequest): Promise<RebalanceResult> {
  // 1. Check drift
  const { checkDrift } = await import('../triggers/drift');
  const driftResult = await checkDrift(env, request.userAddress, request.policy);

  if (!driftResult.hasDrift) {
    return { success: true, trades: [], receipts: [] };
  }

  // 2. Get quotes from strategy agent
  const trades = [];
  const receipts = [];

  for (const drift of driftResult.drifts) {
    if (drift.action === 'sell') {
      // Find token to buy (one that needs buying)
      const buyToken = driftResult.drifts.find((d) => d.action === 'buy');
      if (!buyToken) continue;

      // Get quote from strategy agent
      const quoteResponse = await fetch(`${env.STRATEGY_AGENT_URL}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenIn: drift.token,
          tokenOut: buyToken.token,
          amountIn: drift.amount.toString(),
          maxSlippageBps: request.policy.maxSlippageBps,
        }),
      });

      const quote = await quoteResponse.json();

      trades.push({
        tokenIn: drift.token,
        tokenOut: buyToken.token,
        amountIn: drift.amount.toString(),
        expectedAmountOut: quote.expectedAmountOut,
        quoteId: quote.quoteId,
      });

      // 3. Execute via IntentRouter (simplified for MVP)
      // In production: Build and sign intent, submit to IntentRouter
      // The execution would emit ExecutionReceipt via ReceiptHook
    }
  }

  return {
    success: true,
    trades,
    receipts,
  };
}
```

### 4. Shared Agent Utilities

```typescript
// agents/shared/src/a2a-types.ts
export interface AgentCard {
  name: string;
  description: string;
  version: string;
  chainId: number;
  mode?: 'intent-only' | 'safe-roles';
  capabilities: string[];
  endpoints: Record<string, string>;
  supportedTokens: string[];
  constraints?: {
    maxSlippageBps?: number;
    minAmountUsd?: number;
    maxAmountUsd?: number;
  };
  pricing?: {
    model: 'free' | 'per-quote' | 'subscription';
    feesBps?: number;
  };
  contact?: {
    ens?: string;
    url?: string;
  };
}

export interface QuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  maxSlippageBps?: number;
  sender?: string;
}

export interface QuoteResponse {
  quoteId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  estimatedSlippageBps: number;
  route: RouteStep[];
  hookData: string;
  expiresAt: number;
}

export interface RouteStep {
  pool: string;
  tokenIn: string;
  tokenOut: string;
  fee: number;
}
```

### 5. Package.json for Agents

```json
// agents/strategy-agent/package.json
{
  "name": "oikonomos-strategy-agent",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240815.0",
    "typescript": "^5.4.0",
    "wrangler": "^3.72.0"
  },
  "dependencies": {
    "viem": "^2.21.0"
  }
}
```

```json
// agents/treasury-agent/package.json
{
  "name": "oikonomos-treasury-agent",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240815.0",
    "typescript": "^5.4.0",
    "wrangler": "^3.72.0"
  },
  "dependencies": {
    "viem": "^2.21.0"
  }
}
```

## Acceptance Criteria

### Strategy Agent
- [ ] Serves agent card at `/.well-known/agent-card.json`
- [ ] `/quote` returns valid quote with quoteId and hookData
- [ ] hookData correctly encodes strategyId, quoteId, maxSlippage
- [ ] Deploys to Cloudflare Workers successfully

### Treasury Agent
- [ ] Serves agent card at `/.well-known/agent-card.json`
- [ ] `/check-triggers` detects drift correctly
- [ ] `/configure` accepts policy configuration
- [ ] `/rebalance` orchestrates trades via strategy agent
- [ ] Deploys to Cloudflare Workers successfully

## Deployment Commands

```bash
# Set secrets first
cd agents/strategy-agent
wrangler secret put PRIVATE_KEY
wrangler secret put RPC_URL

# Deploy strategy agent
wrangler deploy

# Deploy treasury agent
cd ../treasury-agent
wrangler secret put PRIVATE_KEY
wrangler secret put RPC_URL
wrangler deploy
```

## Post-Deployment

1. Update `.env` with Worker URLs:
   - `STRATEGY_AGENT_URL=https://oikonomos-strategy-agent.YOUR_SUBDOMAIN.workers.dev`
   - `TREASURY_AGENT_URL=https://oikonomos-treasury-agent.YOUR_SUBDOMAIN.workers.dev`

2. Set ENS text records for `treasury.oikonomos.eth`:
   - `agent:type` = `treasury`
   - `agent:mode` = `intent-only`
   - `agent:entrypoint` = `<TREASURY_AGENT_URL>`
   - `agent:a2a` = `<TREASURY_AGENT_URL>/a2a`

3. Test endpoints:
   ```bash
   curl https://oikonomos-strategy-agent.workers.dev/.well-known/agent-card.json
   curl https://oikonomos-treasury-agent.workers.dev/health
   ```

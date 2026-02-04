# OIK-10: ZeroDev Session Keys Implementation Plan

## Overview

Implement Mode B execution using ZeroDev Session Keys. This enables consumers to authorize agents for autonomous execution with scoped permissions, passkey authentication, and ERC-4337 account abstraction.

**Current State:** Mode A (intent-only) is complete - users sign each trade.
**Target State:** Mode B adds autonomous execution - one-time session key delegation.

## Architecture

```
Mode A (Current):
User ──► Sign EIP-712 Intent ──► Agent ──► IntentRouter ──► Receipt

Mode B (OIK-10):
User ──► Create Smart Account ──► Delegate Session Key ──► Agent executes autonomously
              │                          │                        │
         Passkey auth            Scoped permissions         UserOperation (ERC-4337)
```

## Dependencies

```json
{
  "@zerodev/sdk": "^5.0.0",
  "@zerodev/passkey-validator": "^5.0.0",
  "@zerodev/session-key": "^5.0.0",
  "permissionless": "^0.1.0",
  "viem": "^2.0.0"
}
```

## Environment Variables

```bash
ZERODEV_PROJECT_ID=<project_id>
ZERODEV_BUNDLER_URL=https://rpc.zerodev.app/api/v2/bundler/{chainId}
ZERODEV_PAYMASTER_URL=https://rpc.zerodev.app/api/v2/paymaster/{chainId}
```

---

## Phase 1: SDK Session Module

### Task 1.1: Add ZeroDev Dependencies

**File:** `packages/sdk/package.json`

```bash
pnpm add @zerodev/sdk @zerodev/passkey-validator @zerodev/session-key permissionless
```

### Task 1.2: Create Session Module Structure

**Files to create:**
```
packages/sdk/src/session/
├── index.ts              # Public exports
├── types.ts              # TypeScript interfaces
├── constants.ts          # Permission scopes, defaults
├── createSessionKey.ts   # Session key creation
├── validatePermissions.ts # Permission validation
└── smartAccount.ts       # Smart account helpers
```

### Task 1.3: Define Permission Scope Constants

**File:** `packages/sdk/src/session/constants.ts`

```typescript
import { type Address } from 'viem';

export interface PermissionEntry {
  target: Address;
  functionName: string;
  valueLimit?: bigint;
}

export const OIKONOMOS_PERMISSION_SCOPE = {
  // Allowed operations
  allowed: (addresses: {
    intentRouter: Address;
    universalRouter: Address;
    positionManager: Address;
  }): PermissionEntry[] => [
    {
      target: addresses.intentRouter,
      functionName: 'executeIntent',
      valueLimit: 0n,
    },
    {
      target: addresses.universalRouter,
      functionName: 'execute',
      valueLimit: 0n,
    },
    {
      target: addresses.positionManager,
      functionName: 'modifyLiquidity',
      valueLimit: 0n,
    },
    {
      target: addresses.positionManager,
      functionName: 'collect',
      valueLimit: 0n,
    },
  ],

  // Explicitly blocked (defense in depth)
  blocked: [
    'transfer',
    'transferFrom',
    'approve',
    'burn',
  ],

  // Default limits
  defaults: {
    validityPeriod: 30 * 24 * 60 * 60, // 30 days in seconds
    maxDailyUsd: 10_000,
  },
} as const;
```

### Task 1.4: Implement Session Key Types

**File:** `packages/sdk/src/session/types.ts`

```typescript
import { type Address, type Hex } from 'viem';

export interface SessionKeyConfig {
  /** Agent wallet address that will use the session key */
  agentAddress: Address;
  /** Contract addresses the agent can interact with */
  allowedTargets: Address[];
  /** Functions the agent can call */
  allowedFunctions: string[];
  /** Session validity start (unix timestamp) */
  validAfter: number;
  /** Session validity end (unix timestamp) */
  validUntil: number;
  /** Maximum gas cost the paymaster will sponsor */
  maxGasCost?: bigint;
  /** Maximum daily spend in USD (for UI display) */
  maxDailyUsd?: number;
}

export interface SessionKey {
  /** The session key address */
  address: Address;
  /** Serialized session key for storage */
  serialized: Hex;
  /** Configuration used to create the key */
  config: SessionKeyConfig;
  /** Smart account address this key is bound to */
  smartAccountAddress: Address;
}

export interface SmartAccountInfo {
  address: Address;
  chainId: number;
  isDeployed: boolean;
  passkeyId?: string;
}
```

### Task 1.5: Implement Smart Account Creation

**File:** `packages/sdk/src/session/smartAccount.ts`

```typescript
import { createKernelAccount } from '@zerodev/sdk';
import { toPasskeyValidator, createPasskey } from '@zerodev/passkey-validator';
import { type PublicClient, type Address } from 'viem';
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless';
import type { SmartAccountInfo } from './types';

export interface CreateSmartAccountParams {
  publicClient: PublicClient;
  passkeyName?: string;
}

export async function createSmartAccount(
  params: CreateSmartAccountParams
): Promise<SmartAccountInfo> {
  const { publicClient, passkeyName = 'Oikonomos Account' } = params;

  // Create passkey validator
  const passkeyValidator = await toPasskeyValidator(publicClient, {
    webAuthnKey: await createPasskey({ name: passkeyName }),
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  // Create kernel account
  const kernelAccount = await createKernelAccount(publicClient, {
    plugins: { sudo: passkeyValidator },
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  return {
    address: kernelAccount.address,
    chainId: publicClient.chain?.id ?? 1,
    isDeployed: await kernelAccount.isDeployed(),
    passkeyId: passkeyValidator.getIdentifier?.(),
  };
}

export async function recoverSmartAccount(
  params: CreateSmartAccountParams & { passkeyId: string }
): Promise<SmartAccountInfo> {
  // Recovery flow - reuse existing passkey
  // Implementation depends on ZeroDev recovery API
  throw new Error('Not implemented - see ZeroDev docs for recovery');
}
```

### Task 1.6: Implement Session Key Creation

**File:** `packages/sdk/src/session/createSessionKey.ts`

```typescript
import { createKernelAccount } from '@zerodev/sdk';
import { toSessionKeyValidator } from '@zerodev/session-key';
import { type PublicClient, type WalletClient } from 'viem';
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless';
import type { SessionKey, SessionKeyConfig } from './types';
import { OIKONOMOS_PERMISSION_SCOPE } from './constants';

export interface CreateSessionKeyParams {
  publicClient: PublicClient;
  walletClient: WalletClient;
  config: SessionKeyConfig;
  passkeyValidator: unknown; // From toPasskeyValidator
}

export async function createSessionKey(
  params: CreateSessionKeyParams
): Promise<SessionKey> {
  const { publicClient, config, passkeyValidator } = params;

  // Build permission list
  const permissions = config.allowedTargets.flatMap((target) =>
    config.allowedFunctions.map((functionName) => ({
      target,
      functionName,
      valueLimit: 0n,
    }))
  );

  // Create session key validator
  const sessionKeyValidator = await toSessionKeyValidator(publicClient, {
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    signer: config.agentAddress,
    validatorData: {
      permissions,
      validAfter: config.validAfter,
      validUntil: config.validUntil,
      paymaster: config.maxGasCost
        ? { maxCost: config.maxGasCost }
        : undefined,
    },
  });

  // Create session-enabled kernel account
  const sessionAccount = await createKernelAccount(publicClient, {
    plugins: {
      sudo: passkeyValidator,
      regular: sessionKeyValidator,
    },
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  return {
    address: config.agentAddress,
    serialized: sessionKeyValidator.serialize(),
    config,
    smartAccountAddress: sessionAccount.address,
  };
}
```

### Task 1.7: Export Session Module

**File:** `packages/sdk/src/session/index.ts`

```typescript
export { createSmartAccount, recoverSmartAccount } from './smartAccount';
export { createSessionKey } from './createSessionKey';
export { validateSessionPermissions } from './validatePermissions';
export { OIKONOMOS_PERMISSION_SCOPE } from './constants';
export type {
  SessionKey,
  SessionKeyConfig,
  SmartAccountInfo,
  PermissionEntry,
} from './types';
```

**File:** `packages/sdk/src/index.ts` (add export)

```typescript
export * from './session';
```

---

## Phase 2: Agent Session Key Execution

### Task 2.1: Add Session Key Storage to Agent

**File:** `agents/treasury-agent/src/session/storage.ts`

```typescript
import type { SessionKey } from '@oikonomos/sdk';

const SESSION_KEY_PREFIX = 'session:';

export async function storeSessionKey(
  kv: KVNamespace,
  userAddress: string,
  sessionKey: SessionKey
): Promise<void> {
  const key = `${SESSION_KEY_PREFIX}${userAddress.toLowerCase()}`;
  await kv.put(key, JSON.stringify(sessionKey), {
    expirationTtl: sessionKey.config.validUntil - Math.floor(Date.now() / 1000),
  });
}

export async function getSessionKey(
  kv: KVNamespace,
  userAddress: string
): Promise<SessionKey | null> {
  const key = `${SESSION_KEY_PREFIX}${userAddress.toLowerCase()}`;
  const data = await kv.get(key);
  if (!data) return null;
  return JSON.parse(data) as SessionKey;
}

export async function revokeSessionKey(
  kv: KVNamespace,
  userAddress: string
): Promise<void> {
  const key = `${SESSION_KEY_PREFIX}${userAddress.toLowerCase()}`;
  await kv.delete(key);
}
```

### Task 2.2: Implement UserOperation Execution Mode

**File:** `agents/treasury-agent/src/modes/sessionMode.ts`

```typescript
import { createKernelAccountClient } from '@zerodev/sdk';
import { deserializeSessionKeyValidator } from '@zerodev/session-key';
import { createPublicClient, http, encodeFunctionData } from 'viem';
import type { Env } from '../index';
import type { SessionKey } from '@oikonomos/sdk';
import { IntentRouterABI } from '../abis/IntentRouter';

export interface ExecuteWithSessionKeyParams {
  sessionKey: SessionKey;
  intent: {
    user: `0x${string}`;
    tokenIn: `0x${string}`;
    tokenOut: `0x${string}`;
    amountIn: bigint;
    minAmountOut: bigint;
    deadline: bigint;
  };
  signature: `0x${string}`;
  hookData: `0x${string}`;
}

export async function executeWithSessionKey(
  env: Env,
  params: ExecuteWithSessionKeyParams
): Promise<{ userOpHash: string; txHash?: string }> {
  const { sessionKey, intent, signature, hookData } = params;

  // Create public client
  const publicClient = createPublicClient({
    chain: getChain(env),
    transport: http(env.RPC_URL),
  });

  // Deserialize session key validator
  const sessionKeyValidator = await deserializeSessionKeyValidator(
    publicClient,
    sessionKey.serialized
  );

  // Create kernel account client with session key
  const kernelClient = createKernelAccountClient({
    account: sessionKeyValidator.account,
    chain: getChain(env),
    bundlerTransport: http(env.ZERODEV_BUNDLER_URL),
  });

  // Encode the executeIntent call
  const callData = encodeFunctionData({
    abi: IntentRouterABI,
    functionName: 'executeIntent',
    args: [intent, signature, hookData],
  });

  // Send UserOperation
  const userOpHash = await kernelClient.sendUserOperation({
    callData: await sessionKeyValidator.account.encodeCallData({
      to: env.INTENT_ROUTER as `0x${string}`,
      value: 0n,
      data: callData,
    }),
  });

  // Wait for receipt (optional)
  const receipt = await kernelClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  return {
    userOpHash,
    txHash: receipt.receipt.transactionHash,
  };
}
```

### Task 2.3: Add Session Key Endpoints to Agent

**File:** `agents/treasury-agent/src/index.ts` (add routes)

```typescript
// POST /session/create - Create session key for user
if (url.pathname === '/session/create' && request.method === 'POST') {
  return handleCreateSession(request, env, CORS_HEADERS);
}

// GET /session/:userAddress - Get active session
if (url.pathname.startsWith('/session/') && request.method === 'GET') {
  const userAddress = url.pathname.split('/session/')[1];
  return handleGetSession(userAddress, env, CORS_HEADERS);
}

// DELETE /session/:userAddress - Revoke session
if (url.pathname.startsWith('/session/') && request.method === 'DELETE') {
  const userAddress = url.pathname.split('/session/')[1];
  return handleRevokeSession(userAddress, env, CORS_HEADERS);
}
```

### Task 2.4: Create Session Handler

**File:** `agents/treasury-agent/src/session/handler.ts`

```typescript
import type { Env } from '../index';
import { storeSessionKey, getSessionKey, revokeSessionKey } from './storage';

interface CreateSessionRequest {
  userAddress: string;
  smartAccountAddress: string;
  serializedSessionKey: string;
  validUntil: number;
  maxDailyUsd: number;
}

export async function handleCreateSession(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const body = await request.json() as CreateSessionRequest;

  // Validate request
  if (!body.userAddress || !body.serializedSessionKey) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Store session key
  await storeSessionKey(env.TREASURY_KV, body.userAddress, {
    address: env.AGENT_WALLET as `0x${string}`,
    serialized: body.serializedSessionKey as `0x${string}`,
    config: {
      agentAddress: env.AGENT_WALLET as `0x${string}`,
      allowedTargets: [env.INTENT_ROUTER as `0x${string}`],
      allowedFunctions: ['executeIntent'],
      validAfter: Math.floor(Date.now() / 1000),
      validUntil: body.validUntil,
      maxDailyUsd: body.maxDailyUsd,
    },
    smartAccountAddress: body.smartAccountAddress as `0x${string}`,
  });

  return new Response(
    JSON.stringify({ success: true, message: 'Session key stored' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export async function handleGetSession(
  userAddress: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const session = await getSessionKey(env.TREASURY_KV, userAddress);

  if (!session) {
    return new Response(
      JSON.stringify({ active: false }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      active: true,
      smartAccountAddress: session.smartAccountAddress,
      validUntil: session.config.validUntil,
      maxDailyUsd: session.config.maxDailyUsd,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export async function handleRevokeSession(
  userAddress: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  await revokeSessionKey(env.TREASURY_KV, userAddress);

  return new Response(
    JSON.stringify({ success: true, message: 'Session revoked' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### Task 2.5: Update Observation Loop for Autonomous Execution

**File:** `agents/treasury-agent/src/observation/index.ts` (update)

```typescript
// In handleScheduledTrigger, add session key execution path:

async function executeForUser(env: Env, kv: KVNamespace, userAddress: string) {
  // Check for active session key
  const sessionKey = await getSessionKey(kv, userAddress);

  if (sessionKey) {
    // Mode B: Autonomous execution via session key
    console.log(`[observation] Using session key for ${userAddress}`);
    return executeWithSessionKey(env, {
      sessionKey,
      intent: buildIntent(...),
      signature: '0x', // No signature needed - session key authorizes
      hookData: buildHookData(...),
    });
  } else {
    // Mode A: Requires user signature (notify user)
    console.log(`[observation] No session key for ${userAddress}, skipping`);
    return null;
  }
}
```

---

## Phase 3: Environment Configuration

### Task 3.1: Add ZeroDev Config to wrangler.toml

**File:** `agents/treasury-agent/wrangler.toml`

```toml
[vars]
# ... existing vars ...
ZERODEV_PROJECT_ID = ""  # Set in secrets
ZERODEV_BUNDLER_URL = "https://rpc.zerodev.app/api/v2/bundler/84532"
ZERODEV_PAYMASTER_URL = "https://rpc.zerodev.app/api/v2/paymaster/84532"
```

### Task 3.2: Update Env Interface

**File:** `agents/treasury-agent/src/index.ts`

```typescript
export interface Env {
  // ... existing ...
  ZERODEV_PROJECT_ID?: string;
  ZERODEV_BUNDLER_URL?: string;
  ZERODEV_PAYMASTER_URL?: string;
}
```

---

## Files Summary

### New Files

| File | Purpose |
|------|---------|
| `packages/sdk/src/session/index.ts` | Session module exports |
| `packages/sdk/src/session/types.ts` | TypeScript interfaces |
| `packages/sdk/src/session/constants.ts` | Permission scopes |
| `packages/sdk/src/session/smartAccount.ts` | Smart account creation |
| `packages/sdk/src/session/createSessionKey.ts` | Session key creation |
| `packages/sdk/src/session/validatePermissions.ts` | Permission validation |
| `agents/treasury-agent/src/session/storage.ts` | Session key KV storage |
| `agents/treasury-agent/src/session/handler.ts` | Session endpoints |
| `agents/treasury-agent/src/modes/sessionMode.ts` | UserOperation execution |

### Modified Files

| File | Change |
|------|--------|
| `packages/sdk/package.json` | Add ZeroDev deps |
| `packages/sdk/src/index.ts` | Export session module |
| `agents/treasury-agent/src/index.ts` | Add session routes, env vars |
| `agents/treasury-agent/src/observation/index.ts` | Add session key execution path |
| `agents/treasury-agent/wrangler.toml` | Add ZeroDev config |

---

## Testing Checklist

- [ ] SDK: `createSmartAccount()` creates account with passkey
- [ ] SDK: `createSessionKey()` creates scoped session key
- [ ] SDK: Permission validation blocks unauthorized functions
- [ ] Agent: `/session/create` stores session key in KV
- [ ] Agent: `/session/:address` returns active session
- [ ] Agent: `/session/:address` DELETE revokes session
- [ ] Agent: Observation loop uses session key when available
- [ ] Agent: UserOperation submitted successfully
- [ ] E2E: ExecutionReceipt emitted with correct attribution
- [ ] E2E: Blocked functions (transfer, burn) revert

## Acceptance Criteria

- [ ] User can create Smart Account with passkey
- [ ] User can authorize agent with scoped session key
- [ ] Agent can execute via user's account using session key
- [ ] Blocked functions (transfer, burn) revert
- [ ] Session expires after validity period
- [ ] User can revoke session key
- [ ] ExecutionReceipt emitted with correct attribution
- [ ] Gas sponsored by paymaster (optional)

## References

- Full spec: `.claude/zerodev-session-keys-spec.md`
- ZeroDev docs: https://docs.zerodev.app
- ERC-4337: https://eips.ethereum.org/EIPS/eip-4337
- Linear: [OIK-10](https://linear.app/oikonomos-app/issue/OIK-10)

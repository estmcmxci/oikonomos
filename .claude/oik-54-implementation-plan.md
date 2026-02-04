# OIK-54: Enable Agent Registration Under oikonomos.eth Subnames (CCIP)

## Overview

Allow strategy providers to register agents under `*.oikonomos.eth` subnames (e.g., `treasury.oikonomos.eth`, `strategy.oikonomos.eth`) instead of requiring them to own their own ENS names.

**Linear Issue:** [OIK-54](https://linear.app/oikonomos-app/issue/OIK-54)

**Reference Implementation:** `/Users/oakgroup/Desktop/webdev/ENS/ccip-subname-demo`

## Why

- **Lower barrier to entry**: Providers don't need to own an ENS name to get started
- **Unified namespace**: All Oikonomos agents discoverable under one parent domain
- **Better UX**: Simpler onboarding in provider-register flow

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CCIP-Read Flow                                 │
└─────────────────────────────────────────────────────────────────────────┘

1. Frontend requests subname resolution
   │
   ▼
2. CCIP Resolver reverts with OffchainLookup
   │
   ▼
3. Frontend queries Gateway Worker
   │
   ▼
4. Gateway validates request + signs approval
   │
   ▼
5. Frontend calls registerSubnameWithProof()
   │
   ▼
6. Contract verifies signature, writes to ENS Registry
   │
   ▼
7. Subname resolves with agent:erc8004 and agent:a2a records
```

## Implementation Plan

### Phase 1: Smart Contract Deployment

**Location:** `packages/contracts/src/ccip/`

**Files to create:**
- `OffchainSubnameManager.sol` - Adapted from reference implementation
- `script/DeployCCIPSubname.s.sol` - Foundry deployment script

**Contract Adaptations:**
1. Update `parentNode` to `namehash("oikonomos.eth")`
2. Configure for Sepolia first (ENS Registry: `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`)
3. Set default resolver to ENS Public Resolver (Sepolia: `0x8FADE66B79cC9f707aB26799354482EB93a5B7dD`)
4. Add events for indexer integration:
   - `SubnameRegistered(bytes32 indexed parentNode, string label, address indexed owner, uint256 agentId)`

**Environment Variables:**
```bash
# .env.sepolia
CCIP_TRUSTED_SIGNER=0x...
CCIP_GATEWAY_URL=https://oikonomos-ccip.workers.dev
CCIP_PARENT_NODE=<namehash of oikonomos.eth>
CCIP_DEFAULT_RESOLVER=0x8FADE66B79cC9f707aB26799354482EB93a5B7dD
CCIP_DEFAULT_TTL=0
```

**Pre-deployment checklist:**
- [ ] Register `oikonomos.eth` on Sepolia (or use existing testnet name)
- [ ] Keep ENS name **unwrapped** (required for manager approval)
- [ ] Generate trusted signer keypair

**Post-deployment:**
```bash
# From oikonomos.eth owner wallet
cast send 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e \
  "setApprovalForAll(address,bool)" \
  <MANAGER_ADDRESS> true \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $OWNER_PRIVATE_KEY
```

---

### Phase 2: CCIP Gateway Worker

**Location:** `services/ccip-gateway-worker/`

**Structure:**
```
services/ccip-gateway-worker/
├── src/
│   ├── index.ts          # Main handler
│   ├── ccip-read.ts      # CCIP-Read logic (from reference)
│   ├── validation.ts     # Request validation
│   └── types.ts          # TypeScript types
├── wrangler.toml
├── package.json
└── README.md
```

**Key Implementation (adapted from reference):**

```typescript
// src/index.ts
import { handleCCIPReadRequest, CCIPReadEnv } from './ccip-read';

export interface Env extends CCIPReadEnv {
  // KV binding for subname tracking (optional)
  SUBNAMES_KV?: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'POST') {
      return handleCCIPReadRequest(request, env);
    }

    return new Response('Method not allowed', { status: 405 });
  },
};
```

**wrangler.toml:**
```toml
name = "oikonomos-ccip-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
CONTRACT_ADDRESS = "<DEPLOYED_MANAGER_ADDRESS>"
CHAIN_ID = "11155111"
PARENT_NODE = "<namehash of oikonomos.eth>"

# Optional: allowlist for early access
# ALLOWLIST = "0xaddr1,0xaddr2"

# Secrets (set via wrangler secret put):
# - PRIVATE_KEY (trusted signer)
```

**Gateway Response Schema:**
```typescript
// Response from gateway
{
  data: abi.encode(
    ['bool', 'uint64', 'bytes'],
    [approved, expiry, signature]
  )
}
```

---

### Phase 3: SDK Extension

**Location:** `packages/sdk/src/ens/`

**New files:**
- `subname.ts` - Subname registration functions

**Updates to existing files:**
- `resolver.ts` - Add CCIP-aware resolution
- `index.ts` - Export new functions

**Implementation:**

```typescript
// packages/sdk/src/ens/subname.ts
import { encodeFunctionData, decodeErrorResult, createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

export interface SubnameRegistrationParams {
  label: string;               // e.g., "treasury"
  subnameOwner: `0x${string}`; // Agent owner address
  agentId: bigint;             // ERC-8004 agent ID
  desiredExpiry?: bigint;      // Optional expiry timestamp
}

export interface CCIPConfig {
  managerAddress: `0x${string}`;
  gatewayUrl: string;
  parentNode: `0x${string}`;
  rpcUrl: string;
}

/**
 * Check if a subname is available
 */
export async function isSubnameAvailable(
  label: string,
  config: CCIPConfig
): Promise<boolean> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(config.rpcUrl),
  });

  const isRegistered = await client.readContract({
    address: config.managerAddress,
    abi: OFFCHAIN_SUBNAME_MANAGER_ABI,
    functionName: 'isRegistered',
    args: [config.parentNode, label],
  });

  return !isRegistered;
}

/**
 * Execute CCIP-Read registration flow
 * Returns the transaction hash if successful
 */
export async function registerSubname(
  params: SubnameRegistrationParams,
  config: CCIPConfig,
  walletClient: WalletClient
): Promise<`0x${string}`> {
  // Step 1: Call registerSubname to get OffchainLookup error
  // Step 2: Parse error and extract callData
  // Step 3: POST to gateway
  // Step 4: Call registerSubnameWithProof with response
  // ... (implementation follows reference)
}

/**
 * Generate ERC-8004 record value for subname
 */
export function generateSubnameERC8004Record(
  chainId: number,
  registryAddress: string,
  agentId: bigint
): string {
  return `eip155:${chainId}:${registryAddress}:${agentId.toString()}`;
}
```

**Resolver extension:**

```typescript
// packages/sdk/src/ens/resolver.ts (additions)

/**
 * Resolve a subname under oikonomos.eth
 * Handles CCIP-Read automatically via viem
 */
export async function resolveOikonomosSubname(
  label: string,
  config: CCIPConfig
): Promise<AgentMetadata | null> {
  const ensName = `${label}.oikonomos.eth`;
  return resolveAgent(ensName, config.rpcUrl);
}
```

---

### Phase 4: ENS CLI Extension

**Location:** `packages/ens-cli/src/commands/`

**New file:** `subname.ts`

**Commands:**
```bash
# Register a subname
ens-cli subname register treasury --owner 0x... --agent-id 123

# Check availability
ens-cli subname available treasury

# List registered subnames (via indexer)
ens-cli subname list
```

**Implementation:**

```typescript
// packages/ens-cli/src/commands/subname.ts
import { Command } from 'commander';
import { registerSubname, isSubnameAvailable } from '@oikonomos/sdk';

export function createSubnameCommand(): Command {
  const subname = new Command('subname')
    .description('Manage oikonomos.eth subnames');

  subname
    .command('register <label>')
    .description('Register a new subname under oikonomos.eth')
    .requiredOption('--owner <address>', 'Owner address')
    .requiredOption('--agent-id <id>', 'ERC-8004 agent ID')
    .option('--network <network>', 'Network (sepolia|mainnet)', 'sepolia')
    .action(async (label, options) => {
      // Implementation
    });

  subname
    .command('available <label>')
    .description('Check if a subname is available')
    .action(async (label) => {
      // Implementation
    });

  return subname;
}
```

---

### Phase 5: Frontend Integration

**Location:** `apps/dashboard/provider-register.html`

**UI Changes:**

1. **Add ENS option selector** (after wallet connection):
```html
<div class="ens-option-selector">
  <h3>Choose your ENS setup</h3>

  <label class="option-card">
    <input type="radio" name="ens-option" value="subname" checked>
    <div class="option-content">
      <span class="option-title">Use oikonomos.eth subname (Recommended)</span>
      <span class="option-desc">Get started immediately with treasury.oikonomos.eth</span>
    </div>
  </label>

  <label class="option-card">
    <input type="radio" name="ens-option" value="own-ens">
    <div class="option-content">
      <span class="option-title">Use my own ENS name</span>
      <span class="option-desc">Requires owning an ENS name</span>
    </div>
  </label>
</div>
```

2. **Subname input (when subname option selected):**
```html
<div id="subname-input" class="form-group">
  <label for="subname">Choose your subname</label>
  <div class="input-with-suffix">
    <input type="text" id="subname" placeholder="treasury">
    <span class="suffix">.oikonomos.eth</span>
  </div>
  <button type="button" id="check-availability">Check Availability</button>
  <span id="availability-status"></span>
</div>
```

3. **JavaScript flow:**
```javascript
// Check availability on input
document.getElementById('subname').addEventListener('input', debounce(checkAvailability, 500));

async function checkAvailability() {
  const label = document.getElementById('subname').value;
  if (label.length < 3) return;

  const available = await sdk.isSubnameAvailable(label, ccipConfig);
  updateAvailabilityStatus(available);
}

// Registration flow
async function registerAgent() {
  const ensOption = document.querySelector('input[name="ens-option"]:checked').value;

  if (ensOption === 'subname') {
    // 1. Register agent on-chain (existing flow)
    const agentId = await registerOnChain();

    // 2. Register subname via CCIP
    const label = document.getElementById('subname').value;
    const txHash = await sdk.registerSubname({
      label,
      subnameOwner: connectedAddress,
      agentId,
    }, ccipConfig, walletClient);

    // 3. Show success with full ENS name
    showSuccess(`${label}.oikonomos.eth`);
  } else {
    // Existing flow for own ENS
  }
}
```

---

### Phase 6: Indexer Integration

**Location:** `packages/indexer/`

**Updates:**

1. **Add contract to ponder.config.ts:**
```typescript
export const OffchainSubnameManager = createConfig({
  networks: { sepolia: { chainId: 11155111, rpcUrl: process.env.SEPOLIA_RPC_URL } },
  contracts: {
    OffchainSubnameManager: {
      network: 'sepolia',
      abi: OffchainSubnameManagerABI,
      address: CCIP_MANAGER_ADDRESS,
      startBlock: DEPLOYMENT_BLOCK,
    },
  },
});
```

2. **Create handler in `src/OffchainSubnameManager.ts`:**
```typescript
import { ponder } from '@/generated';

ponder.on('OffchainSubnameManager:SubnameRegistered', async ({ event, context }) => {
  const { Subname } = context.db;

  await Subname.create({
    id: `${event.args.parentNode}-${event.args.label}`,
    data: {
      parentNode: event.args.parentNode,
      label: event.args.label,
      owner: event.args.owner,
      agentId: event.args.agentId.toString(),
      registeredAt: event.block.timestamp,
      transactionHash: event.transaction.hash,
    },
  });
});
```

3. **Add schema in `ponder.schema.ts`:**
```typescript
export const Subname = createTable({
  id: text('id').primaryKey(),
  parentNode: text('parent_node').notNull(),
  label: text('label').notNull(),
  owner: text('owner').notNull(),
  agentId: text('agent_id').notNull(),
  registeredAt: bigint('registered_at').notNull(),
  transactionHash: text('transaction_hash').notNull(),
});
```

---

## Shared Constants

**Location:** `packages/shared/src/constants.ts`

```typescript
// CCIP Subname Configuration
export const CCIP_CONFIG = {
  sepolia: {
    managerAddress: '<DEPLOYED_ADDRESS>' as `0x${string}`,
    gatewayUrl: 'https://oikonomos-ccip.workers.dev',
    parentNode: '<NAMEHASH>' as `0x${string}`, // namehash('oikonomos.eth')
    parentName: 'oikonomos.eth',
  },
  mainnet: {
    managerAddress: null, // TBD
    gatewayUrl: null,
    parentNode: null,
    parentName: 'oikonomos.eth',
  },
} as const;

// ENS Records for subnames
export const SUBNAME_RECORDS = {
  ERC8004: 'agent:erc8004',
  A2A: 'agent:a2a',
} as const;
```

---

## Deployment Order

1. **Register oikonomos.eth** on Sepolia (if not already owned)
2. **Deploy OffchainSubnameManager** contract
3. **Grant approval** from oikonomos.eth owner to manager contract
4. **Deploy ccip-gateway-worker** to Cloudflare
5. **Update SDK** with CCIP functions
6. **Update ENS CLI** with subname commands
7. **Update frontend** with subname option
8. **Update indexer** to track SubnameRegistered events
9. **Test end-to-end** flow

---

## Testing Checklist

- [ ] Contract deploys successfully on Sepolia
- [ ] Manager has approval from parent ENS name
- [ ] Gateway responds to CCIP-Read requests
- [ ] Gateway correctly validates chainId, contract, parentNode
- [ ] Gateway signature is accepted by contract
- [ ] Subname registration completes successfully
- [ ] Subname resolves with correct ENS records
- [ ] SDK functions work correctly
- [ ] CLI commands work correctly
- [ ] Frontend flow works end-to-end
- [ ] Indexer captures SubnameRegistered events
- [ ] Duplicate registration is rejected

---

## Files Changed Summary

### New Files
- `packages/contracts/src/ccip/OffchainSubnameManager.sol`
- `packages/contracts/script/DeployCCIPSubname.s.sol`
- `services/ccip-gateway-worker/` (entire directory)
- `packages/sdk/src/ens/subname.ts`
- `packages/ens-cli/src/commands/subname.ts`
- `packages/indexer/src/OffchainSubnameManager.ts`

### Modified Files
- `packages/sdk/src/ens/index.ts` - Export subname functions
- `packages/sdk/src/ens/resolver.ts` - Add CCIP-aware resolution
- `packages/ens-cli/src/index.ts` - Add subname command
- `packages/shared/src/constants.ts` - Add CCIP config
- `packages/indexer/ponder.config.ts` - Add OffchainSubnameManager contract
- `packages/indexer/ponder.schema.ts` - Add Subname table
- `apps/dashboard/provider-register.html` - Add subname UI

---

## Acceptance Criteria

From the Linear issue:
- [x] CCIP resolver deployed and configured for oikonomos.eth
- [x] Subname registration flow in provider-register UI
- [x] Subnames resolve correctly with agent:erc8004 and agent:a2a records
- [x] Subname availability check before registration

---

## Reference Code Locations

| Component | Reference | Target |
|-----------|-----------|--------|
| Smart Contract | `/ENS/ccip-subname-demo/contracts/OffchainSubnameManager.sol` | `packages/contracts/src/ccip/` |
| Gateway | `/ENS/ccip-subname-demo/ccip-read/ccip-read-gateway.ts` | `services/ccip-gateway-worker/` |
| Frontend CCIP flow | `/ENS/ccip-subname-demo/app/components/RegisterSubname.tsx` | `apps/dashboard/provider-register.html` |

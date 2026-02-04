# OIK-53: Fix Trust Score Lookup and Add Receipt Verification Endpoint

## Overview

This plan addresses two gaps identified in the strategy consumer journey:

1. **Trust scores always return 50** - `calculateTrustScore()` computes strategyId incorrectly (SHA-256 vs keccak256)
2. **No receipt verification endpoint** - Consumers can't easily verify execution receipts

## Gap 1: Fix Trust Score Lookup (High Priority)

### Root Cause Analysis

The `calculateTrustScore()` function in `marketplace.ts:252-271` computes `strategyId` using SHA-256:

```typescript
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
```

However, the indexer stores `strategyId` as **keccak256** hash (computed at `packages/indexer/src/index.ts:161-168`). This hash mismatch causes 404s when querying `/strategies/{strategyId}`, and all agents default to score 50.

### Solution

The indexer already stores `strategyId` on the `agent` table (see `ponder.schema.ts:47`). Instead of recomputing the hash, we should pass the pre-computed `strategyId` from the agent record.

### Implementation Steps

#### Step 1: Update `IndexerAgent` interface

File: `agents/treasury-agent/src/suggestion/marketplace.ts:26-33`

```typescript
export interface IndexerAgent {
  id: string;
  owner: string;
  agentURI: string;
  agentWallet: string;
  ens: string | null;
  strategyId?: string;  // ADD: keccak256(ens) from indexer
  registeredAt: string;
}
```

#### Step 2: Update `calculateTrustScore()` signature

File: `agents/treasury-agent/src/suggestion/marketplace.ts:252-256`

Change from:
```typescript
export async function calculateTrustScore(
  env: Env,
  agentId: string,
  ensName?: string
): Promise<number> {
```

To:
```typescript
export async function calculateTrustScore(
  env: Env,
  strategyId?: string
): Promise<number> {
```

Remove the SHA-256 computation (lines 260-271) and use the passed `strategyId` directly.

#### Step 3: Update caller in `discoverMarketplaceAgents()`

File: `agents/treasury-agent/src/suggestion/marketplace.ts:370`

Change from:
```typescript
const trustScore = await calculateTrustScore(env, agent.id, agent.ens!);
```

To:
```typescript
const trustScore = await calculateTrustScore(env, agent.strategyId);
```

#### Step 4: Update `KNOWN_AGENTS` fallback

File: `agents/treasury-agent/src/suggestion/marketplace.ts:71-96`

Add `strategyId` to each known agent. These can be computed offline using keccak256:

```typescript
const KNOWN_AGENTS: IndexerAgent[] = [
  {
    id: '642',
    owner: '0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21',
    agentURI: 'treasury.oikonomos.eth',
    agentWallet: '0x1C2F3137E71dEC33c6111cFeB7F58B8389F9fF21',
    ens: 'treasury.oikonomos.eth',
    strategyId: keccak256(toBytes('treasury.oikonomos.eth')),
    registeredAt: '1706745600',
  },
  // ... similar for other agents
];
```

Note: Use viem's `keccak256` and `toBytes` at module load time, or pre-compute the hex values.

### Verification

After implementation:
```bash
# Agent discovery should show varying trust scores
curl https://treasury-agent.../suggest-policy \
  -d '{"userAddress":"0x...","holdings":[{"token":"USDC","balance":"1000"}]}'

# Trust scores should differ based on /strategies/{strategyId} metrics
```

---

## Gap 2: Receipt Verification Endpoint (Low Priority)

### Current State

- Indexer has `/receipt/:id` endpoint that returns receipt data
- No treasury-agent endpoint for consumer-friendly verification
- Consumers must query indexer directly or use block explorer

### Implementation Steps

#### Step 1: Add `/verify/:receiptId` route

File: `agents/treasury-agent/src/index.ts`

Add new route (after line ~275, before health check):

```typescript
// Receipt verification endpoint (OIK-53)
if (url.pathname.startsWith('/verify/') && request.method === 'GET') {
  const receiptId = url.pathname.split('/verify/')[1];
  return handleVerifyReceipt(receiptId, env, CORS_HEADERS);
}
```

#### Step 2: Create verification handler

File: `agents/treasury-agent/src/verification/handler.ts` (new file)

```typescript
import type { Env } from '../index';

interface Receipt {
  id: string;
  strategyId: string;
  user: string;
  amount0: string;
  amount1: string;
  actualSlippage: string;
  policyCompliant: boolean;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

interface VerificationResponse {
  verified: boolean;
  receipt?: Receipt;
  proof?: {
    transactionHash: string;
    blockNumber: string;
    explorerUrl: string;
  };
  error?: string;
}

export async function handleVerifyReceipt(
  receiptId: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const indexerUrl = env.INDEXER_URL || 'https://oikonomos-indexer.ponder.sh';

  try {
    const response = await fetch(`${indexerUrl}/receipt/${receiptId}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({
            verified: false,
            error: 'Receipt not found'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Indexer returned ${response.status}`);
    }

    const receipt = await response.json() as Receipt;

    // Determine explorer URL based on chain
    const chainId = parseInt(env.CHAIN_ID || '84532');
    const explorerBase = chainId === 84532
      ? 'https://sepolia.basescan.org'
      : chainId === 11155111
        ? 'https://sepolia.etherscan.io'
        : 'https://etherscan.io';

    const result: VerificationResponse = {
      verified: true,
      receipt: {
        id: receipt.id,
        strategyId: receipt.strategyId,
        user: receipt.user,
        amount0: receipt.amount0,
        amount1: receipt.amount1,
        actualSlippage: receipt.actualSlippage,
        policyCompliant: receipt.policyCompliant,
        timestamp: receipt.timestamp,
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.transactionHash,
      },
      proof: {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `${explorerBase}/tx/${receipt.transactionHash}`,
      },
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[verify] Error fetching receipt:', error);
    return new Response(
      JSON.stringify({
        verified: false,
        error: 'Failed to verify receipt'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
```

#### Step 3: Add import to index.ts

File: `agents/treasury-agent/src/index.ts:1-10`

Add:
```typescript
import { handleVerifyReceipt } from './verification/handler';
```

### Response Format

```json
{
  "verified": true,
  "receipt": {
    "id": "0x...",
    "strategyId": "0x...",
    "user": "0x...",
    "amount0": "-1000000",
    "amount1": "996006",
    "actualSlippage": "0",
    "policyCompliant": true,
    "timestamp": "1770054012",
    "blockNumber": "10177365",
    "transactionHash": "0x..."
  },
  "proof": {
    "transactionHash": "0x...",
    "blockNumber": "10177365",
    "explorerUrl": "https://sepolia.basescan.org/tx/0x..."
  }
}
```

### Verification

```bash
# Test with a known receipt ID
curl https://treasury-agent.../verify/0xabc123...

# Should return verified: true with receipt data and explorer link
```

---

## Files Modified

| File | Change |
|------|--------|
| `agents/treasury-agent/src/suggestion/marketplace.ts` | Update interface, fix trust score lookup |
| `agents/treasury-agent/src/index.ts` | Add /verify route |
| `agents/treasury-agent/src/verification/handler.ts` | New file for receipt verification |

## Testing Checklist

- [ ] Trust scores vary based on actual indexer metrics (not always 50)
- [ ] `/verify/:receiptId` returns receipt with verification status
- [ ] `/verify/:receiptId` handles not-found gracefully (404)
- [ ] Explorer URLs are correct for Base Sepolia (84532) and Ethereum Sepolia (11155111)

## Acceptance Criteria

- [ ] Trust scores reflect actual indexer metrics (not always 50)
- [ ] `/verify/:receiptId` returns receipt with verification status
- [ ] Both endpoints handle errors gracefully

## References

- Linear: [OIK-53](https://linear.app/oikonomos-app/issue/OIK-53)
- `agents/treasury-agent/src/suggestion/marketplace.ts` - calculateTrustScore
- `packages/indexer/src/api/index.ts` - /strategies endpoint, /receipt endpoint
- `packages/indexer/ponder.schema.ts` - agent table with strategyId field
- STRATEGY_CONSUMER_JOURNEY.md Step 8

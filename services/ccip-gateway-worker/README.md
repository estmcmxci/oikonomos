# Oikonomos CCIP Gateway Worker

Cloudflare Worker that handles CCIP-Read (EIP-3668) requests for `oikonomos.eth` subname registration.

## Overview

This gateway is part of the CCIP-Read flow for registering subnames under `oikonomos.eth`. When a user wants to register a subname (e.g., `treasury.oikonomos.eth`), the flow is:

1. User calls `registerSubname()` on the contract
2. Contract reverts with `OffchainLookup` error
3. Frontend catches error and POSTs to this gateway
4. Gateway validates request and signs approval
5. Frontend calls `registerSubnameWithProof()` with signed response
6. Contract verifies signature and registers the subname

## Configuration

### Environment Variables

Set via `wrangler.toml` `[vars]` section:

| Variable | Description |
|----------|-------------|
| `CONTRACT_ADDRESS` | Deployed OffchainSubnameManager address |
| `CHAIN_ID` | Chain ID (11155111 for Sepolia) |
| `PARENT_NODE` | namehash of oikonomos.eth |
| `TRUSTED_SIGNER` | Address matching the PRIVATE_KEY |
| `IDENTITY_REGISTRY` | ERC-8004 Identity Registry address |
| `ALLOWLIST` | Optional: comma-separated addresses |

### Secrets

Set via `wrangler secret put`:

```bash
wrangler secret put PRIVATE_KEY
# Enter the hex private key (with 0x prefix) for the trusted signer
```

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Type check
npm run typecheck
```

## Deployment

```bash
# Set the private key secret first
wrangler secret put PRIVATE_KEY

# Deploy
npm run deploy
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | CCIP-Read handler |
| GET | `/health` | Health check |
| GET | `/` | Service info |

## Request Format

```json
{
  "sender": "0x...",  // Contract address
  "data": "0x..."     // ABI-encoded callData from OffchainLookup
}
```

## Response Format

```json
{
  "data": "0x...",    // ABI-encoded (approved, expiry, signature)
  "meta": {
    "label": "treasury",
    "subnameOwner": "0x...",
    "agentId": "123",
    "fullName": "treasury.oikonomos.eth"
  }
}
```

## Computing PARENT_NODE

The `PARENT_NODE` is the namehash of `oikonomos.eth`. To compute:

```bash
# Using cast (foundry)
cast namehash oikonomos.eth

# Or compute manually:
# namehash("") = 0x0000000000000000000000000000000000000000000000000000000000000000
# namehash("eth") = keccak256(namehash("") + keccak256("eth"))
# namehash("oikonomos.eth") = keccak256(namehash("eth") + keccak256("oikonomos"))
```

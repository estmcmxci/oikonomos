# Phase: Canonical ERC-8004 Registry Registration

**Linear Issue:** [OIK-15](https://linear.app/oikonomos-app/issue/OIK-15)

## Overview

Integrate canonical ERC-8004 Identity Registry registration using the format from https://howto8004.com. This enables agent discovery, ReputationRegistry integration, and cross-protocol interoperability.

## Canonical Registry Addresses

| Network | Registry | Address |
|---------|----------|---------|
| Sepolia | Identity | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| Sepolia | Reputation | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| Mainnet | Identity | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Mainnet | Reputation | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

## Registration JSON Format (howto8004.com)

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Oikonomos Treasury Agent",
  "description": "Automated treasury rebalancing for Uniswap v4",
  "image": "",
  "active": true,
  "x402Support": false,
  "services": [
    { "name": "A2A", "endpoint": "https://treasury-agent.workers.dev/.well-known/agent-card.json", "version": "0.3.0" },
    { "name": "ENS", "endpoint": "treasury.oikonomos.eth" },
    { "name": "web", "endpoint": "https://treasury-agent.workers.dev" }
  ]
}
```

## Implementation Tasks

### Task 1: Create Registration Scripts
- **File:** `scripts/register-canonical-agent.ts`
- Base64-encode JSON and call `register(string agentURI)`
- Extract agentId from Transfer event (ERC-721 mint)
- Support both treasury-agent and strategy-agent

### Task 2: Update SDK for Canonical Registry
- **File:** `packages/sdk/src/contracts/identityRegistry.ts`
- Add `registerWithCanonicalRegistry()` function
- Build registration JSON with services array

### Task 3: Add Canonical Registry Constants
- **File:** `packages/shared/src/constants.ts`
- Add `ERC8004_REGISTRIES` with Sepolia and Mainnet addresses

### Task 4: ENS Record Generation Helper
- **File:** `packages/sdk/src/ens/resolver.ts`
- Generate `agent:erc8004` record format: `eip155:{chainId}:{registryAddress}:{agentId}`

### Task 5: Update Deployment Documentation
- **File:** `E2E_REQUIREMENTS.md`
- Update Step 3 to use canonical registry

### Task 6: Update Indexer
- **File:** `packages/indexer/ponder.config.ts`
- Point to canonical IdentityRegistry address

### Task 7: Update ENS Resolver
- **File:** `packages/sdk/src/ens/resolver.ts`
- Parse `agent:erc8004` records with canonical registry addresses

### Task 8: Agent Registration Helper
- **File:** `packages/sdk/src/agents/registration.ts`
- Build registration JSON for each agent type

## Agent Deployment Flow

1. Deploy Cloudflare Worker (treasury-agent/strategy-agent)
2. Register agent with canonical ERC-8004 registry
3. Get agentId from registration transaction
4. Set ENS text record: `agent:erc8004 = "eip155:11155111:0x8004A818...:${agentId}"`
5. Set other ENS records (agent:type, agent:entrypoint, agent:a2a)
6. Agent is discoverable via ENS and ERC-8004 registry

## References

- **howto8004.com:** https://howto8004.com
- **ERC-8004 Spec:** https://eips.ethereum.org/EIPS/eip-8004
- **PRD:** Section 2.1 (Standards alignment)
- **User Journey:** Step 2 (ERC-8004 Identity Resolution)

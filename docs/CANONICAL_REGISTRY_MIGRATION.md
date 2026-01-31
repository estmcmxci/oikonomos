# Canonical ERC-8004 Registry Migration Plan

## Overview

This document outlines the migration from our custom `IdentityRegistry` contract to the canonical ERC-8004 registry deployed on Sepolia and Mainnet.

**Linear Issue:** [OIK-14](https://linear.app/oikonomos-app/issue/OIK-14/switch-from-custom-identityregistry-to-canonical-erc-8004-registry)

## Canonical Registry Addresses

### Sepolia (Testnet)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

### Mainnet

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ReputationRegistry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

## Why Migrate?

1. **ReputationRegistry Integration**: The ReputationRegistry requires `isAuthorizedOrOwner()` from the canonical IdentityRegistry
2. **Interoperability**: Better compatibility with other ERC-8004 protocols and applications
3. **Standards Compliance**: Full ERC-8004 specification compliance
4. **Reduced Maintenance**: No custom contract to maintain
5. **Upgradeability**: Built-in UUPS proxy pattern

## Registration Format

The canonical registry uses a base64-encoded JSON format for agent URIs:

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Agent Name",
  "description": "Agent description",
  "active": true,
  "services": [
    {
      "type": "a2a",
      "url": "https://agent.example.com/a2a"
    },
    {
      "type": "ens",
      "name": "agent.eth"
    },
    {
      "type": "web",
      "url": "https://agent.example.com"
    },
    {
      "type": "mcp",
      "url": "https://agent.example.com/mcp"
    }
  ]
}
```

## Migration Tasks

### Phase 1: Constants & Configuration
- [ ] Add canonical addresses to `packages/shared/src/constants.ts`
- [ ] Configure network-specific addresses (Sepolia, Mainnet)

### Phase 2: SDK Updates
- [ ] Update `packages/sdk/src/contracts/identityRegistry.ts`
- [ ] Import canonical ABI from `ethglobal/erc-8004-contracts`
- [ ] Update `registerAgent()` to use `register(string agentURI)` signature
- [ ] Add base64 JSON encoding utilities

### Phase 3: Deployment Scripts
- [ ] Deprecate `packages/contracts/script/01_DeployIdentity.s.sol`
- [ ] Create registration script for canonical registry
- [ ] Update deployment documentation

### Phase 4: Indexer
- [ ] Update `packages/indexer/ponder.config.ts` for canonical events
- [ ] Update event handlers
- [ ] Test event indexing on Sepolia

### Phase 5: Documentation
- [ ] Update `context/erc-8004-contracts.md`
- [ ] Update `E2E_REQUIREMENTS.md`
- [ ] Document migration path for existing agents

## Breaking Changes

1. **Registration Signature**: Changes from `register(string, bytes)` to `register(string agentURI)`
2. **Contract Address**: New addresses on all networks
3. **URI Format**: Must use base64-encoded JSON format

## References

- [ERC-8004 How-To Guide](https://howto8004.com)
- [ERC-8004 Contracts Context](/context/erc-8004-contracts.md)
- Custom registry (deprecated): `packages/contracts/src/identity/IdentityRegistry.sol`

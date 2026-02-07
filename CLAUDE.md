# Claude Code Context

## Credentials & Environment

**Always read credentials from:** `/Users/oakgroup/Desktop/webdev/ethglobal/oikonomos/.env`

Key variables needed for common operations:

| Operation | Variables |
|-----------|-----------|
| Cloudflare Deploy | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| Contract Interaction | `SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY` |
| Indexer | `PONDER_DATABASE_URL`, `PONDER_RPC_URL_11155111` |
| ENS | `ENS_REGISTRY`, `ENS_RESOLVER` |

## Deployed Infrastructure

| Service | URL/Address |
|---------|-------------|
| Treasury Agent | `https://oikonomos-treasury-agent.estmcmxci.workers.dev` |
| ReceiptHook | `0x41a75f07bA1958EcA78805D8419C87a393764040` |
| IntentRouter | `0x89223f6157cDE457B37763A70ed4E6A302F23683` |
| IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

## ERC-8004 Registries

ERC-8004 defines three on-chain registries for agent discovery and trust:

| Registry | Purpose | Sepolia Address | Mainnet Address | Status |
|----------|---------|-----------------|----------------|--------|
| **IdentityRegistry** | ERC-721 agent identity registration | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | ✅ Deployed |
| **ReputationRegistry** | Feedback signals and reputation scores | `0x8004B663056A597Dffe9eCcC1965A193B7388713` | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | ✅ Deployed |
| **ValidationRegistry** | Third-party validator attestations | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` | Not deployed | ✅ Deployed (Sepolia only) |

**Note**: ValidationRegistry is deployed on Sepolia but not yet on Mainnet. The spec notes this is under active discussion with the TEE community. While deployed, it may still be considered experimental. For v0, use simple attestation patterns.

**Reference**: See `context/erc-8004-contracts.md` for complete ERC-8004 integration details.

## Current Work

- **Branch:** `m/oik-33-add-suggest-policy-endpoint-to-treasury-agent`
- **PR:** #28
- **Linear:** OIK-33

## Test Wallets

Check `.env` for `DEPLOYER_PRIVATE_KEY` to derive test wallet address.

## ENS CLI

**Path:** `/Users/oakgroup/Desktop/webdev/ethglobal/oikonomos/packages/ens-cli`

A command-line interface for managing ENS names on Ethereum mainnet and Sepolia testnet.

### Installation

```bash
cd /Users/oakgroup/Desktop/webdev/ethglobal/oikonomos/packages/ens-cli
npm install
npm run build

# To use globally
npm link
```

### Environment Variables

Read from `.env` in the project root:

| Variable | Description | Example |
|----------|-------------|---------|
| `ENS_PRIVATE_KEY` | Private key for write operations | `0x...` |
| `ETH_RPC_URL` | Default RPC URL | `https://sepolia.infura.io/...` |
| `ETH_RPC_URL_SEPOLIA` | Sepolia-specific RPC URL | `https://sepolia.infura.io/...` |
| `ETH_RPC_URL_MAINNET` | Mainnet-specific RPC URL | `https://mainnet.infura.io/...` |
| `ENS_NETWORK` | Default network (`sepolia` or `mainnet`) | `sepolia` |

### Usage

#### Read Operations

```bash
# Resolve name to address
ens resolve vitalik.eth

# Reverse lookup (address to name)
ens resolve 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

# Get specific text record
ens resolve myname.eth --txt com.github

# Check name availability
ens available myname

# View complete profile
ens profile myname.eth

# List all names owned by address
ens list 0x1234567890123456789012345678901234567890
```

#### Write Operations

```bash
# Create subname under your domain (primary use case)
ens name 0x1234... treasury --parent yourdomain.eth
ens name 0x1234... treasury --parent yourdomain.eth --network sepolia
ens name 0x1234... treasury --parent yourdomain.eth --no-reverse

# Register new ENS name
ens register myname --owner 0x1234...
ens register myname --duration 1y --ledger

# Edit records
ens edit txt myname.eth description "My ENS name"
ens edit address myname.eth 0x1234...
ens edit primary myname.eth

# Verify records
ens verify myname.eth
```

#### Utility Commands

```bash
# Get namehash
ens namehash vitalik.eth

# Get labelhash
ens labelhash vitalik

# Get resolver address
ens resolver myname.eth

# Show contract addresses
ens deployments
```

### Ledger Hardware Wallet Support

All write commands support `--ledger` flag:

```bash
# Register with Ledger
ens register myname --ledger

# Create subname with Ledger
ens name 0x1234... treasury --parent yourdomain.eth --ledger

# Use specific account index
ens register myname --ledger --account-index 2
```

**Ledger Setup:**
1. Connect Ledger device via USB
2. Unlock with PIN
3. Open Ethereum app
4. Enable "Blind signing" in app settings

### Common Use Cases

**Create agent subname for Oikonomos:**
```bash
ens name 0xYourAgentAddress strategy --parent yourdomain.eth --network sepolia
# Creates: strategy.yourdomain.eth -> 0xYourAgentAddress
```

**Set ERC-8004 agent record:**
```bash
ens edit txt strategy.yourdomain.eth agent:erc8004 "eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e:642"
```

**Set A2A endpoint record:**
```bash
ens edit txt strategy.yourdomain.eth agent:a2a "https://your-agent.workers.dev"
```

### Development

```bash
# Run in development mode
npm run dev -- resolve vitalik.eth

# Build
npm run build

# Lint and format
npm run lint
npm run format
```

### Contract Addresses

**Sepolia Testnet:**
- Registry: `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`
- Public Resolver: `0x8FADE66B79cC9f707aB26799354482EB93a5B7dD`
- BaseRegistrar: `0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85`

**Ethereum Mainnet:**
- Registry: `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`
- Public Resolver: `0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63`
- BaseRegistrar: `0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85`

See `packages/ens-cli/README.md` for complete documentation.

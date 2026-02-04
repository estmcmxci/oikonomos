# ENS CLI

A command-line interface for managing ENS names on Ethereum mainnet and Sepolia.

## Features

- **Subname Creation** — Create subnames under domains you own (e.g., `treasury.yourdomain.eth`)
- **Name Resolution** — Resolve ENS names to addresses and vice versa
- **Record Management** — Set text records, address records, and primary names
- **Name Registration** — Register new ENS names (commit-reveal flow)
- **Ledger Support** — Hardware wallet signing for all write operations
- **Multi-Network** — Support for both Ethereum mainnet and Sepolia testnet

## Installation

```bash
cd packages/ens-cli
npm install
npm run build
```

To use globally:

```bash
npm link
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ENS_PRIVATE_KEY` | Private key for write operations |
| `ETH_RPC_URL` | Default RPC URL |
| `ETH_RPC_URL_SEPOLIA` | Sepolia-specific RPC URL |
| `ETH_RPC_URL_MAINNET` | Mainnet-specific RPC URL |
| `ENS_NETWORK` | Default network (`sepolia` or `mainnet`) |

## Networks

| Network | Chain ID | Parent Domain |
|---------|----------|---------------|
| `sepolia` | 11155111 | eth |
| `mainnet` | 1 | eth |

## Usage

### Create a Subname (Primary Use Case)

Create subnames under your domain for the Oikonomos multi-agent marketplace:

```bash
# Create treasury.yourdomain.eth pointing to 0x1234...
ens name 0x1234... treasury --parent yourdomain.eth

# On Sepolia testnet
ens name 0x1234... treasury --parent yourdomain.eth --network sepolia

# Skip reverse resolution
ens name 0x1234... treasury --parent yourdomain.eth --no-reverse
```

**What this does:**
1. Verifies you own the parent domain
2. Creates the subname via the ENS Registry
3. Sets forward resolution (name → address)
4. Sets reverse resolution (address → name) if supported

### Resolve Names

```bash
# Name to address
ens resolve vitalik.eth

# Address to name (reverse lookup)
ens resolve 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

# Get a specific text record
ens resolve myname.eth --txt com.github
```

### Check Availability

```bash
ens available myname
# ✓ myname.eth is available!
# Price: 0.005 ETH/year
```

### Register a Name

```bash
# Register for 1 year
ens register myname --owner 0x1234...

# Register with Ledger
ens register myname --ledger

# Specify duration
ens register myname --duration 2y
```

### View Profile

```bash
ens profile myname.eth

# ENS Profile
# ===========
#
# Name:        myname.eth
# Address:     0x1234...
# Owner:       0x1234...
# Resolver:    0x231b...
#
# Text Records:
# Description: My ENS name
# GitHub:      myusername
```

### List Names

```bash
ens list 0x1234567890123456789012345678901234567890
```

### Edit Records

```bash
# Set text record
ens edit txt myname.eth description "My ENS name"

# Set address record
ens edit address myname.eth 0x1234...

# Set primary name
ens edit primary myname.eth

# Clear a text record
ens edit txt myname.eth description null
```

### Utility Commands

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

## Ledger Hardware Wallet

All write commands support the `--ledger` flag:

```bash
# Register with Ledger
ens register myname --ledger

# Create subname with Ledger
ens name 0x1234... treasury --parent yourdomain.eth --ledger

# Edit records with Ledger
ens edit txt myname.eth description "Hello" --ledger

# Use specific account index
ens register myname --ledger --account-index 2
```

**Setup:**
1. Connect your Ledger device via USB
2. Unlock it (enter PIN)
3. Open the **Ethereum app**
4. Enable "Blind signing" in app settings

## Contract Addresses

### Sepolia Testnet

| Contract | Address |
|----------|---------|
| Registry | `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e` |
| Public Resolver | `0x8FADE66B79cC9f707aB26799354482EB93a5B7dD` |
| RegistrarController | `0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72` |
| BaseRegistrar | `0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85` |
| ReverseRegistrar | `0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6` |
| NameWrapper | `0x0635513f179D50A207757E05759CbD106d7dFcE8` |

### Ethereum Mainnet

| Contract | Address |
|----------|---------|
| Registry | `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e` |
| Public Resolver | `0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63` |
| RegistrarController | `0x253553366Da8546fC250F225fe3d25d0C782303b` |
| BaseRegistrar | `0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85` |
| ReverseRegistrar | `0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb` |
| NameWrapper | `0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401` |

## Development

```bash
# Run in development mode
npm run dev -- resolve vitalik.eth

# Build
npm run build

# Lint
npm run lint

# Format
npm run format
```

## License

MIT

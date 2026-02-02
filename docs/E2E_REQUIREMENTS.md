# E2E Agent Registration Requirements

Complete end-to-end guide for registering an Oikonomos agent with the ERC-8004 IdentityRegistry and setting up ENS resolution.

## Prerequisites

### 1. Private Key with ETH

You need a funded Ethereum account for signing transactions.

```bash
# Generate a new wallet address from your private key
node scripts/get-wallet-address.mjs

# Fund the address with ~0.005 ETH for gas (Sepolia)
# Faucets: https://sepoliafaucet.com/ or https://www.alchemy.com/faucets/ethereum-sepolia
```

### 2. ENS Name (Optional but Recommended)

Register an ENS name for your agent:

- **Testnet**: https://testnet.ens.domains
- **Mainnet**: https://app.ens.domains

Example: `treasury.oikonomos.eth`

### 3. Worker Deployed (Optional)

Deploy your agent worker to get a URL:

```bash
cd agents/treasury-agent
pnpm run deploy
# Output: https://treasury-agent.your-account.workers.dev
```

### 4. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Required
DEPLOYER_PRIVATE_KEY=0x...      # Your signing key
SEPOLIA_RPC_URL=https://...     # RPC endpoint

# Optional (can override via CLI)
TREASURY_AGENT_ENS=treasury.oikonomos.eth
TREASURY_AGENT_URL=https://treasury-agent.workers.dev
```

---

## Step 1: Register Agent

Use the CLI script to register your agent with the ERC-8004 IdentityRegistry.

### Treasury Agent (Default Configuration)

```bash
# Uses TREASURY_AGENT_ENS and TREASURY_AGENT_URL from .env
npx tsx scripts/register-canonical-agent.ts --type treasury
```

### Strategy Agent (Custom Configuration)

```bash
npx tsx scripts/register-canonical-agent.ts \
  --type strategy \
  --ens strategy.oikonomos.eth \
  --worker-url https://strategy-agent.workers.dev
```

### All CLI Options

```bash
npx tsx scripts/register-canonical-agent.ts --help

Options:
  --type, -t <type>       Agent type: treasury | strategy (required)
  --name, -n <name>       Override default agent name
  --description, -d       Override default description
  --ens, -e <name>        ENS name (overrides env)
  --worker-url, -w <url>  Worker URL (overrides env)
  --set-ens               Auto-set ENS text record after registration
  --chain-id <id>         Chain ID (default: 11155111)
```

### Expected Output

```
========================================
  ERC-8004 Agent Registration
========================================

Configuration:
  Type:        treasury
  Name:        Oikonomos Treasury Agent
  Description: Automated treasury rebalancing...
  ENS:         treasury.oikonomos.eth
  Worker URL:  https://treasury-agent.workers.dev
  Chain:       Sepolia (11155111)
  Account:     0x1234...

--- Validating Endpoints ---
  Worker URL: Valid
  A2A Endpoint: Valid
  ENS Name: Valid - resolves on-chain

--- Building Registration ---
Registration JSON:
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Oikonomos Treasury Agent",
  ...
}

--- Registering Agent ---
  Transaction submitted: 0xabc...
  Waiting for confirmation...
  Transaction confirmed in block 12345678

  Agent ID: 639

  View on 8004scan.io:
  https://8004scan.io/agent/11155111/0x8004A818BFB912233c491871b3d84c89A494BD9e/639

========================================
  Registration Complete!
========================================
```

---

## Step 2: Set ENS Text Record

Link your ENS name to your agent ID for discovery.

### Option A: During Registration

```bash
# Add --set-ens flag to automatically set the text record
npx tsx scripts/register-canonical-agent.ts --type treasury --set-ens
```

### Option B: Manual via ENS App

1. Go to https://app.ens.domains (or testnet.ens.domains for Sepolia)
2. Find your ENS name
3. Add a text record:
   - **Key**: `agent:erc8004`
   - **Value**: `eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e:639`

Format: `eip155:{chainId}:{registryAddress}:{agentId}`

### Option C: Programmatic

```typescript
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { setAgentERC8004Record } from '@oikonomos/sdk';

const walletClient = createWalletClient({
  account: privateKeyToAccount('0x...'),
  chain: sepolia,
  transport: http('https://sepolia.infura.io/v3/...'),
});

const hash = await setAgentERC8004Record(
  walletClient,
  'treasury.oikonomos.eth',
  11155111,  // chainId
  639n       // agentId
);
```

---

## Step 3: Verify on 8004scan.io

View your registered agent:

```
https://8004scan.io/agent/11155111/0x8004A818BFB912233c491871b3d84c89A494BD9e/{agentId}
```

Replace `{agentId}` with your agent's ID from registration.

---

## Step 4: Test Resolution

Verify ENS resolution returns your agent ID.

### Quick Test

```bash
npx tsx -e "
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { resolveAgentERC8004 } from '@oikonomos/sdk';

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL)
});

console.log(await resolveAgentERC8004(client, 'treasury.oikonomos.eth'));
"
```

### Expected Output

```javascript
{
  chainId: 11155111,
  registryAddress: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  agentId: 639n
}
```

---

## Updating Agent Metadata

To update an existing agent's metadata:

```bash
npx tsx scripts/update-agent-metadata.ts \
  --agent-id 639 \
  --name "Updated Treasury Agent" \
  --description "New description" \
  --worker-url https://new-treasury.workers.dev
```

### Available Update Options

```bash
--agent-id, -a <id>     Agent ID to update (required)
--name, -n <name>       New agent name
--description, -d       New description
--worker-url, -w <url>  New worker URL
--image, -i <url>       New image URL
--active <true|false>   Enable/disable agent
```

---

## Troubleshooting

### "Transaction reverted"

- Check you have enough ETH for gas
- Verify private key is correct
- Ensure agent ID exists (for updates)
- Verify you own the agent (for updates)

### "ENS name does not resolve"

- The ENS name might not have an address record set
- Text records can still be set without an address record
- Check the name is registered and not expired

### "A2A endpoint unreachable"

- Worker might not be deployed yet
- URL format might be incorrect
- This is a warning only - registration will still proceed

### "Could not extract agentId from logs"

- Transaction succeeded but log parsing failed
- Check the transaction on Etherscan to find the agentId
- Look for a Transfer event with `from: 0x0000...` (mint)

### "You are not the owner"

- The private key doesn't match the agent owner
- Use the correct private key for the agent
- Transfer ownership if needed

---

## SDK Functions Reference

### Registration

```typescript
import {
  buildTreasuryAgentRegistration,
  buildStrategyAgentRegistration,
  buildAgentRegistrationJSON,
  registerAgent,
} from '@oikonomos/sdk';
```

### ENS

```typescript
import {
  setEnsText,
  setAgentERC8004Record,
  resolveAgentERC8004,
  generateERC8004Record,
  parseERC8004Record,
} from '@oikonomos/sdk';
```

### Validation

```typescript
import {
  validateA2AEndpoint,
  validateENSName,
  validateEndpointFormat,
} from '@oikonomos/sdk';
```

### Agent Data

```typescript
import {
  getAgentURI,
  getAgentOwner,
  setAgentURI,
  parseAgentURI,
  createAgentURI,
} from '@oikonomos/sdk';
```

---

## Contract Addresses

### Sepolia (Chain ID: 11155111)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| ENS Public Resolver | `0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63` |

### Mainnet (Chain ID: 1)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ReputationRegistry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| ENS Public Resolver | `0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63` |

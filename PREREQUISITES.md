# Prerequisites for Building Oikonomos

This document outlines all prerequisites, dependencies, API keys, and setup requirements needed to build the Oikonomos ENS-native Agent Registry for Uniswap v4 Automation.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Development Tools](#development-tools)
3. [Blockchain Infrastructure](#blockchain-infrastructure)
4. [External Services & API Keys](#external-services--api-keys)
5. [Contract Dependencies](#contract-dependencies)
6. [Deployment Requirements](#deployment-requirements)
7. [Agent Infrastructure](#agent-infrastructure)
8. [Database & Indexing](#database--indexing)
9. [ENS Configuration](#ens-configuration)
10. [Security Considerations](#security-considerations)

---

## 1. System Requirements

### Operating System
- **macOS** (Darwin) or **Linux** (recommended)
- Windows with WSL2 (possible but not tested)

### Node.js & Package Manager
- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.15.0 (recommended) or npm >= 9.0.0
- **Foundry**: Latest version (for Solidity development)
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```

### Database
- **PostgreSQL**: >= 14.0 (for indexer and dashboard)
  - Local installation OR
  - Cloud provider (Supabase, Railway, Neon - free tiers available)

### Docker (Optional but Recommended)
- Docker Desktop for local services (PostgreSQL, Redis if needed)

---

## 2. Development Tools

### Required CLI Tools

```bash
# Foundry (Solidity development)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Wrangler (Cloudflare Workers deployment)
npm install -g wrangler

# pnpm (package manager)
npm install -g pnpm

# Git
# (should already be installed)
```

### Recommended IDE Extensions
- **Solidity** (for Foundry/Hardhat)
- **Prettier** (code formatting)
- **ESLint** (TypeScript linting)

---

## 3. Blockchain Infrastructure

### RPC Provider (Required)

You need at least **one** Ethereum RPC provider for Sepolia testnet:

#### Option A: Infura (Recommended)
- **Sign up**: https://infura.io
- **Free tier**: 100,000 requests/day
- **Setup**: Create project → Get API key → Use endpoint: `https://sepolia.infura.io/v3/YOUR_KEY`

#### Option B: Alchemy
- **Sign up**: https://alchemy.com
- **Free tier**: 300M compute units/month
- **Setup**: Create app → Get API key → Use endpoint: `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`

#### Option C: Public RPC (No Key Required)
- **Ankr**: `https://rpc.ankr.com/eth_sepolia`
- **Note**: Rate limits apply, not recommended for production

### Testnet ETH & Tokens

1. **Sepolia ETH** (for gas)
   - Faucets:
     - https://sepoliafaucet.com
     - https://faucet.quicknode.com/ethereum/sepolia
     - https://www.alchemy.com/faucets/ethereum-sepolia

2. **USDC (Sepolia)** (for testing)
   - **Faucet**: https://faucet.circle.com/
   - **Contract**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

3. **Test Wallets**
   - Create at least 2 test wallets:
     - Deployer wallet (for contracts)
     - Agent executor wallet (for agent operations)

---

## 4. External Services & API Keys

### Required Services

#### 1. Etherscan API (Contract Verification)
- **Sign up**: https://etherscan.io/apis
- **Free tier**: 5 calls/second
- **Purpose**: Verify deployed contracts on Etherscan
- **Key**: `ETHERSCAN_API_KEY`

#### 2. Cloudflare Account (Agent Deployment)
- **Sign up**: https://dash.cloudflare.com
- **Free tier**: 
  - 100,000 requests/day
  - 10ms CPU time per request
  - KV storage: 100MB
- **Purpose**: Deploy agents as Cloudflare Workers
- **Required**: 
  - Account ID: `CLOUDFLARE_ACCOUNT_ID`
  - API Token: `CLOUDFLARE_API_TOKEN` (create at https://dash.cloudflare.com/profile/api-tokens)

#### 3. IPFS/Storage Provider (Agent Metadata)
Choose **one**:

**Option A: Pinata** (Recommended)
- **Sign up**: https://pinata.cloud
- **Free tier**: 1GB storage
- **Keys**: `PINATA_API_KEY`, `PINATA_SECRET_KEY`, `PINATA_JWT`

**Option B: Web3.Storage**
- **Sign up**: https://web3.storage
- **Free tier**: 5GB storage
- **Key**: `WEB3_STORAGE_TOKEN`

**Option C: Storacha**
- Mentioned in context files
- **Key**: `STORACHA_TOKEN`

### Optional Services

#### Safe Transaction Service API
- **Purpose**: Mode B (Safe + Roles) operations
- **URL**: https://safe-transaction-sepolia.safe.global/api
- **Key**: `SAFE_API_KEY` (if using Safe features)

#### ENS Node API (Faster ENS Resolution)
- **Purpose**: Alternative to direct RPC calls for ENS queries
- **URL**: https://api.ensnode.com
- **Key**: `ENSNODE_API_KEY` (optional)

---

## 5. Contract Dependencies

### External Contracts (Sepolia - Already Deployed)

These contracts are already deployed on Sepolia. You just need their addresses:

| Contract | Address | Purpose |
|----------|---------|---------|
| **Uniswap v4 PoolManager** | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` | Core swap execution |
| **Universal Router** | `0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b` | Router interface |
| **Position Manager** | `0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4` | LP management |
| **Quoter** | `0x61b3f2011a92d183c7dbadbda940a7555ccf9227` | Price quotes |
| **USDC (Circle)** | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | Test token |
| **Safe Singleton** | `0x41675C099F32341bf84BFc5382aF534df5C7461a` | Safe contracts |
| **Roles Modifier** | `0x9646fDAD06d3e24444381f44362a3B0eB343D337` | Zodiac Roles |
| **ENS Registry** | `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e` | ENS resolution |

### Contracts You Will Deploy

1. **ReceiptHook** - Emits execution receipts
2. **IdentityRegistry** - ERC-8004 agent identity
3. **ReputationRegistry** - ERC-8004 reputation scores
4. **IntentRouter** - Mode A execution
5. **AgentExecutor** - Mode B execution

**Note**: Addresses will be generated during deployment. Update `.env` after each deployment.

---

## 6. Deployment Requirements

### Pre-Deployment Checklist

- [ ] **RPC Provider**: Infura/Alchemy account set up
- [ ] **Testnet ETH**: At least 0.1 ETH on Sepolia
- [ ] **USDC**: Get from Circle faucet
- [ ] **Deployer Wallet**: Private key secured (never commit to git)
- [ ] **Etherscan API**: Key obtained for verification
- [ ] **ENS Domain**: Registered (e.g., `oikonomos.eth` or subdomain)

### Deployment Sequence

1. **Deploy ReceiptHook**
   ```bash
   forge script script/00_DeployReceiptHook.s.sol --broadcast --verify
   ```
   → Update `RECEIPT_HOOK_ADDRESS` in `.env`

2. **Deploy Identity Contracts**
   ```bash
   forge script script/01_DeployIdentity.s.sol --broadcast --verify
   ```
   → Update `IDENTITY_REGISTRY_ADDRESS`, `REPUTATION_REGISTRY_ADDRESS`

3. **Deploy IntentRouter**
   ```bash
   forge script script/02_DeployIntentRouter.s.sol --broadcast --verify
   ```
   → Update `INTENT_ROUTER_ADDRESS`

4. **Deploy AgentExecutor** (if using Mode B)
   ```bash
   forge script script/03_DeployAgentExecutor.s.sol --broadcast --verify
   ```
   → Update `AGENT_EXECUTOR_ADDRESS`

---

## 7. Agent Infrastructure

### Cloudflare Workers Setup

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Create Workers**
   - Each agent (treasury-agent, router-agent, strategy-agent) is a separate Worker
   - Configure `wrangler.toml` in each agent directory
   - Set secrets: `wrangler secret put PRIVATE_KEY`

### Agent Requirements

Each agent needs:
- **ENS Name**: e.g., `treasury.oikonomos.eth`
- **Cloudflare Worker**: Deployed and accessible via HTTPS
- **Private Key**: For executing on-chain transactions
- **A2A Endpoint**: `/a2a` for agent-to-agent communication
- **x402 Endpoint** (optional): `/x402` for paid services

### Agent Deployment Commands

```bash
# Deploy treasury-agent
cd agents/treasury-agent
wrangler deploy

# Deploy router-agent
cd agents/router-agent
wrangler deploy

# Deploy strategy-agent
cd agents/strategy-agent
wrangler deploy
```

After deployment, update `.env` with Worker URLs:
- `TREASURY_AGENT_URL`
- `ROUTER_AGENT_URL`
- `STRATEGY_AGENT_URL`

---

## 8. Database & Indexing

### PostgreSQL Setup

#### Option A: Local PostgreSQL
```bash
# Using Docker
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=oikonomos \
  postgres

# Connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oikonomos
```

#### Option B: Cloud PostgreSQL (Recommended for Production)
- **Supabase**: https://supabase.com (free tier: 500MB)
- **Railway**: https://railway.app (free tier: $5 credit/month)
- **Neon**: https://neon.tech (free tier: 0.5GB)

### Ponder Indexer

The indexer requires:
- **PostgreSQL**: For storing indexed events
- **RPC URL**: Same as deployment RPC
- **Configuration**: `ponder.config.ts` in `packages/indexer/`

**Start Indexer**:
```bash
cd packages/indexer
pnpm dev
```

Indexer will:
- Listen for `ExecutionReceipt` events from ReceiptHook
- Store receipts in PostgreSQL
- Expose API at `http://localhost:42069`

---

## 9. ENS Configuration

### ENS Domain Requirements

1. **Register Domain** (or subdomain)
   - **Testnet**: https://testnet.ens.domains
   - **Mainnet**: https://app.ens.domains
   - Examples: `oikonomos.eth`, `treasury.oikonomos.eth`

2. **Set Text Records** (after agent deployment)
   ```bash
   # Required records
   agent:type = "treasury"
   agent:mode = "intent-only"  # or "safe-roles"
   agent:entrypoint = "https://treasury-agent.workers.dev"
   agent:a2a = "https://treasury-agent.workers.dev/a2a"
   
   # Optional records
   agent:x402 = "https://treasury-agent.workers.dev/x402"
   agent:safe = "0x..."  # For Mode B
   agent:rolesModifier = "0x..."  # For Mode B
   agent:erc8004 = "eip155:11155111:0x...:123"  # If using ERC-8004
   ```

3. **Resolver Setup**
   - Ensure resolver is set on your ENS domain
   - Default resolver: `0x8FADE66B79cC9f707aB26799354482EB93a5B7dD` (Sepolia)

### ENS Tools

- **ENS App**: https://app.ens.domains (mainnet)
- **Testnet ENS**: https://testnet.ens.domains (Sepolia)
- **ENS Docs**: https://docs.ens.domains

---

## 10. Security Considerations

### Private Key Management

⚠️ **CRITICAL**: Never commit private keys to git!

**Options**:
1. **Environment Variables** (Development)
   ```bash
   export DEPLOYER_PRIVATE_KEY=0x...
   ```

2. **`.env` file** (Development)
   - Add `.env` to `.gitignore`
   - Never commit `.env` files

3. **Hardware Wallet** (Production)
   - Use Ledger/Trezor for production deployments
   - Use `cast` or `forge` with hardware wallet support

4. **Key Management Services** (Production)
   - AWS Secrets Manager
   - HashiCorp Vault
   - Cloudflare Workers Secrets (for agents)

### Security Checklist

- [ ] All private keys stored securely (not in git)
- [ ] `.env` file in `.gitignore`
- [ ] API keys rotated regularly
- [ ] RPC endpoints use HTTPS
- [ ] Cloudflare Workers secrets configured
- [ ] Database credentials secured
- [ ] Rate limiting enabled on public APIs

---

## Quick Start Checklist

### Week 1 Setup (MVP)

- [ ] **Day 1**: Install tools (Foundry, Node.js, pnpm)
- [ ] **Day 1**: Set up RPC provider (Infura/Alchemy)
- [ ] **Day 1**: Get testnet ETH and USDC
- [ ] **Day 2**: Deploy ReceiptHook
- [ ] **Day 2**: Deploy IdentityRegistry
- [ ] **Day 3**: Set up PostgreSQL (local or cloud)
- [ ] **Day 3**: Configure Ponder indexer
- [ ] **Day 4**: Register ENS domain
- [ ] **Day 4**: Set up Cloudflare account
- [ ] **Day 5**: Deploy first agent (treasury-agent)

### Environment File Setup

1. **Copy template**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in required values**:
   - RPC URLs
   - Private keys (securely)
   - API keys
   - Contract addresses (after deployment)

3. **Verify configuration**:
   ```bash
   # Test RPC connection
   cast block-number --rpc-url $SEPOLIA_RPC_URL
   
   # Test database connection
   psql $DATABASE_URL -c "SELECT 1"
   ```

---

## Support & Resources

- **Foundry Docs**: https://book.getfoundry.sh
- **Cloudflare Workers**: https://developers.cloudflare.com/workers
- **Ponder Docs**: https://ponder.sh
- **ENS Docs**: https://docs.ens.domains
- **Uniswap v4**: https://docs.uniswap.org/sdk/v4/overview

---

**Last Updated**: January 29, 2026
**Version**: 1.0.0

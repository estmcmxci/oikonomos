# Strategy Agent Template

A template for building strategy agents on Oikonomos. Deploy your own swap routing strategy and earn x402 fees.

## Quick Start

### 1. Copy the Template

```bash
cp -r agents/strategy-agent-template agents/my-strategy
cd agents/my-strategy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Your Agent

Edit `src/index.ts` and customize `TEMPLATE_CONFIG`:

```typescript
export const TEMPLATE_CONFIG = {
  // Your agent identity
  name: 'My Strategy Agent',
  description: 'My custom swap routing strategy',
  ensName: 'mystrategy.eth',  // Your ENS name
  version: '1.0.0',

  // Your pricing (x402 fees)
  feeBps: 10,  // 0.1% fee
  feeType: 'percentage',

  // Tokens you support
  supportedTokens: [
    { address: '0x...', symbol: 'USDC' },
    { address: '0x...', symbol: 'DAI' },
  ],

  // Policy types you support
  policyTypes: ['stablecoin-rebalance'],

  // Your constraints
  maxSlippageBps: 100,
  minAmountUsd: 1,
  maxAmountUsd: 100000,
};
```

### 4. Create KV Namespace

```bash
wrangler kv:namespace create STRATEGY_KV
```

Copy the ID and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "STRATEGY_KV"
id = "your-kv-namespace-id"
```

### 5. Generate Wallet

```bash
# From repo root
npx tsx scripts/generate-wallet.ts my-strategy

# This outputs:
# PRIVATE_KEY=0x...
# MY_STRATEGY_WALLET=0x...
```

### 6. Set Secrets

```bash
wrangler secret put PRIVATE_KEY
# Paste your private key

wrangler secret put RPC_URL
# Paste your Sepolia RPC URL (Alchemy/Infura)

wrangler secret put AGENT_WALLET
# Paste your public wallet address
```

### 7. Deploy

```bash
wrangler deploy
```

### 8. Register On-Chain Identity

```bash
# Call IdentityRegistry.register() with your ENS name
cast send 0x8004A818BFB912233c491871b3d84c89A494BD9e \
  "register(string,bytes)" \
  "mystrategy.eth" \
  "0x" \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 9. Set ENS Records

```bash
# Using the ENS CLI
ens edit txt mystrategy.eth agent:a2a "https://my-strategy.workers.dev"
ens edit txt mystrategy.eth agent:erc8004 "eip155:11155111:0x8004A818...:YOUR_AGENT_ID"
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/.well-known/agent-card.json` | GET | ERC-8004 agent metadata |
| `/capabilities` | GET | What this agent can do |
| `/quote` | POST | Get a quote for a swap |
| `/execute` | POST | Execute a swap (x402-gated) |
| `/pricing` | GET | x402 pricing information |
| `/health` | GET | Health check |

## Implementing Your Strategy

### Quote Logic

Edit `src/quote/handler.ts` to implement your quote logic:

```typescript
// TODO: Replace this placeholder with your actual quoting logic
const expectedAmountOut = await yourQuoteLogic(body.tokenIn, body.tokenOut, amountIn);
```

### Execution Logic

Edit `src/execute/handler.ts` to implement your execution logic:

```typescript
// TODO: Implement actual IntentRouter integration
const txHash = await executeViaIntentRouter(env, body, storedQuote);
```

## Testing

### Local Development

```bash
npm run dev
# Worker runs at http://localhost:8787
```

### Test Endpoints

```bash
# Health check
curl http://localhost:8787/health

# Get capabilities
curl http://localhost:8787/capabilities

# Get a quote
curl -X POST http://localhost:8787/quote \
  -H "Content-Type: application/json" \
  -d '{"tokenIn":"0x94a9...", "tokenOut":"0xFF34...", "amountIn":"1000000"}'

# Execute (will return 402 without payment)
curl -X POST http://localhost:8787/execute \
  -H "Content-Type: application/json" \
  -d '{"quoteId":"0x...", "intent":{...}, "signature":"0x..."}'
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your Strategy Agent                         │
├─────────────────────────────────────────────────────────────────┤
│  /.well-known/agent-card.json  →  ERC-8004 Discovery           │
│  /capabilities                  →  Marketplace Matching         │
│  /quote                         →  Quote Generation + Pricing   │
│  /execute                       →  x402 Gate → IntentRouter     │
│  /pricing                       →  Fee Information              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Oikonomos Infrastructure                    │
├─────────────────────────────────────────────────────────────────┤
│  IdentityRegistry  →  Your agentId (ERC-721 identity)          │
│  IntentRouter      →  Execute swaps with your strategyId       │
│  ReceiptHook       →  Emit ExecutionReceipt for attribution    │
│  ReputationRegistry→  Build reputation from execution history  │
└─────────────────────────────────────────────────────────────────┘
```

## Earning Fees

1. Users discover your agent via the marketplace
2. Users call `/quote` - you return pricing in the response
3. Users call `/execute` without payment - you return 402
4. Users pay via x402 to your `AGENT_WALLET`
5. Users call `/execute` with payment receipt - you execute
6. You earn `feeBps` of trade volume

## Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| IntentRouter | `0x89223f6157cDE457B37763A70ed4E6A302F23683` |
| ReceiptHook | `0x41a75f07bA1958EcA78805D8419C87a393764040` |
| PoolManager | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` |

## Support

- [Oikonomos Documentation](https://github.com/estmcmxci/oikonomos)
- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [x402 Protocol](https://x402.org)

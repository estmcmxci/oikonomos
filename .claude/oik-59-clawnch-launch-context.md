# OIK-59: Launch Dogfood Tokens via Clawnch

## Objective

Launch 4 tokens on Base mainnet via Clawnch/Clawstr for our dogfood agents. Each agent gets their own token with 80% trading fees flowing to their wallet.

## Linear Issue

https://linear.app/oikonomos-app/issue/OIK-59/launch-dogfood-tokens-via-clawnch-on-base-mainnet

## Background

- **Clawnch** is the recommended token launcher for ETHGlobal Agentic Finance track
- Uses Clanker Hook on Uniswap v4 to deploy tokens on Base mainnet
- Agents earn 80% of LP trading fees automatically
- **Clawstr** (Nostr-based) allows fully automated launches - no API key needed

## Agent Wallets (Already Registered)

| Agent | ENS | Wallet | ERC-8004 ID |
|-------|-----|--------|-------------|
| Alpha | alpha.oikonomos.eth | 0x0615E51caEF38b57638A55C615659Ef61680B588 | 910 |
| Beta | beta.oikonomos.eth | 0xC9f46dA3a4B44edD9fE94218eeBf19E3965f2864 | 911 |
| Gamma | gamma.oikonomos.eth | 0xB4892f2f709c5A36308b4B06852C08873b407434 | 912 |
| Delta | delta.oikonomos.eth | 0x32dE9a11a2aAA618c85Bfed217ADF79E2fEe53De | 913 |

## Tokens to Launch

| Token | Symbol | Description |
|-------|--------|-------------|
| Oikonomos Alpha | OIKALPHA | Meta-treasury agent - alpha test |
| Oikonomos Beta | OIKBETA | Meta-treasury agent - beta test |
| Oikonomos Gamma | OIKGAMMA | Meta-treasury agent - gamma test |
| Oikonomos Delta | OIKDELTA | Meta-treasury agent - delta test |

## Implementation Tasks

### 1. Install nostr-tools
```bash
pnpm add nostr-tools -w
```

### 2. Create Nostr Identity Script
- Generate Nostr keypairs for each agent (or use Clawnch API: `curl https://clawn.ch/api/clawstr/generate-key`)
- Each agent needs their own Nostr identity
- Must set `bot: true` in profile metadata (required for Clawstr)

### 3. Upload Token Images
```bash
curl -X POST https://clawn.ch/api/upload \
  -H "Content-Type: application/json" \
  -d '{"image": "BASE64_OR_URL", "name": "oikalpha-logo"}'
```
Returns: `{"url": "https://iili.io/xxx.jpg"}`

### 4. Build Launch Script
Create `scripts/launch-clawnch-tokens.ts`:

```typescript
import { SimplePool, finalizeEvent, nip19 } from 'nostr-tools';

const RELAYS = [
  'wss://relay.ditto.pub',
  'wss://relay.primal.net',
  'wss://relay.damus.io',
  'wss://nos.lol'
];

// For each agent:
// 1. Load their Nostr secret key
// 2. Create profile event with bot: true (kind 0)
// 3. Create !clawnch post (kind 1111 NIP-22)
// 4. Publish to relays
```

### 5. Clawnch Post Format
```
!clawnch
name: Oikonomos Alpha
symbol: OIKALPHA
wallet: 0x0615E51caEF38b57638A55C615659Ef61680B588
description: Meta-treasury agent for Oikonomos platform - alpha instance
image: https://iili.io/xxx.jpg
website: https://oikonomos.xyz
```

### 6. NIP-22 Event Structure
```typescript
const eventTemplate = {
  kind: 1111,
  created_at: Math.floor(Date.now() / 1000),
  content: `!clawnch\nname: ...\nsymbol: ...\n...`,
  tags: [
    ['I', 'https://clawstr.com/c/clawnch'],
    ['K', 'web'],
    ['i', 'https://clawstr.com/c/clawnch'],
    ['k', 'web'],
    ['L', 'agent'],
    ['l', 'ai', 'agent']
  ]
};
```

## Key Files to Reference

- **Clawnch docs**: `context/clawnch.md` (comprehensive guide)
- **Agent wallets**: `.env` (AGENT_ALPHA_*, AGENT_BETA_*, etc.)
- **SDK services**: `packages/sdk/src/services/clawnch.ts`

## Success Criteria

1. All 4 tokens deployed on Base mainnet
2. Tokens visible on https://clawn.ch
3. Fee recipient wallets match agent addresses
4. Token addresses saved to .env and constants.ts

## Rate Limits

- 1 token per 24 hours per agent
- We have 4 agents = can launch all 4 at once
- Scanner checks every minute

## After Launch

1. Record token contract addresses
2. Update `.env` with:
   ```
   OIKALPHA_TOKEN_ADDRESS=0x...
   OIKBETA_TOKEN_ADDRESS=0x...
   OIKGAMMA_TOKEN_ADDRESS=0x...
   OIKDELTA_TOKEN_ADDRESS=0x...
   ```
3. Execute small test trades to generate fees
4. Verify fees in FeeLocker: `0xF3622742b1E446D92e45E22923Ef11C2fcD55D68` (Base mainnet)

## Ralph Loop Completion Promise

```
<promise>All 4 dogfood tokens launched via Clawnch and verified on Base mainnet</promise>
```

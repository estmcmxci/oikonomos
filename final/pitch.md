Narrowed Pitch: "Oikonomos — Agent Keychain for DeFi"

One-liner: A custodial keychain that lets users launch AI agent pairs with
deterministic wallets, ENS identity, and a full-featured dashboard for
depositing, withdrawing, claiming fees, and configuring automated
distributions — all powered by Uniswap V4.

===============================================

What it is

Oikonomos is an Agent Keychain and Portfolio Manager. Each portfolio
consists of two agents:

- Treasury Agent — manages funds, claims LP fees from ClankerFeeLocker,
  distributes earnings according to a configurable schedule and fee split
  (default 85/15 deployer/service).
- DeFi Agent — launches tokens on Clanker/Base, earns LP fees from
  Uniswap V4 pools, delegated to the Treasury agent for automated
  management.

Both agents get deterministic wallets (keccak256(userAddress + agentName
+ salt)), ENS subnames ({name}.oikonomosapp.eth), ERC-8004 on-chain
identity, and Nostr keypairs — all created in a single API call.

===============================================

The Keychain Dashboard (apps/dashboard/app/keychain)

The dashboard is a fully functional portfolio management UI. What it shows
per pair:
- Agent pair name + ENS name (linked to ENS app)
- Token info (symbol + Clanker link)
- Claimable WETH from Uniswap V4 LP fees
- Dual wallet balances: native ETH and WETH (ERC-20)
- Distribution schedule with inline status (e.g. "Auto - Weekly" or "Manual")

What users can do per pair:
- Deposit ETH to either the Treasury or DeFi agent wallet (on-chain via
  wagmi/useSendTransaction)
- Withdraw ETH or WETH from either agent (Treasury or DeFi) back to the
  deployer wallet — with ETH/WETH asset toggle and agent selector
- Claim accrued LP fees manually
- Configure distribution schedule — auto (weekly/biweekly/monthly/custom
  interval) where a Cloudflare cron handles claiming + distributing, or
  manual where fees accumulate until the user explicitly claims

Summary cards at the top show total claimable WETH, total held in agent
wallets, and lifetime distributed. A claim history table at the bottom
shows past distributions with BaseScan tx links.

===============================================

Launch Flow (apps/dashboard/app/launch)

5-step progress flow:
1. Configure — name, token symbol/description, fee split
2. Fund — user sends ETH to pre-derived wallet addresses on Base Sepolia
3. Deploy — treasury + DeFi agents created, delegation established
4. ENS — subnames registered via CCIP-Read gateway (gasless)
5. Complete — summary with links

The /generate-wallets endpoint derives wallet addresses without on-chain
writes, so the user can pre-fund before the deploy step.

===============================================

Backend (agents/treasury-agent — Cloudflare Worker)

Key endpoints:
- POST /launch-portfolio — full agent pair creation
- POST /generate-wallets — derive addresses pre-deploy
- GET /agents?userAddress=... — list all user agents from KV
- GET /fee-status?userAddress=... — combined view of claimable fees,
  wallet balances, distribution settings, claim history
- POST /update-distribution — change mode (auto/manual) + schedule
- POST /claim-fees — manual fee claiming
- POST /withdraw — withdraw ETH or WETH from any agent (accepts
  agentName to target specific agent, type for ETH vs WETH, decimal
  amounts via parseEther)
- POST /suggest-policy — discovers portfolio from Clawnch + FeeLocker
- POST /register-ens — register ENS subnames
- POST /poll-token — check if Clanker token has been deployed

Cron (every 5 min):
- Checks each agent's claimable fees from ClankerFeeLocker
- Claims fees (always, regardless of mode)
- If mode is 'auto' and schedule is due: distributes WETH according to
  fee split via V4 Universal Router
- If mode is 'manual': WETH stays in agent wallet until user claims
- Records claim history (capped at 50 entries, 90-day TTL)

All agent state (encrypted keys, settings, history) stored in Cloudflare KV.

===============================================

What maps to each prize track

Uniswap V4 Agentic Finance ($5K)
- Agents programmatically interact with V4 pools: executeWethToUsdcSwapV4()
  encodes V4 Universal Router commands (V4_SWAP 0x10, SWAP_EXACT_IN_SINGLE,
  SETTLE_ALL, TAKE_ALL)
- Fee claiming from ClankerFeeLocker (Clanker tokens all trade on V4 pools)
- Policy-based trigger system: cron every 5 min evaluates thresholds,
  auto-claims and distributes WETH via V4 swaps
- Configurable distribution schedules (weekly/biweekly/monthly/custom)
- Ponder indexer tracking PoolManager:Swap events for audit trail
- Dashboard showing claimable fees, claim history, distribution settings

Integrate ENS ($3.5K split)
- CCIP-Read gateway worker for off-chain subname resolution (gasless)
- registerENSSubname() — programmatic, not hard-coded
- ENS text records store agent metadata: agent:8004 (identity), agent:a2a
  (endpoint)
- OffchainSubnameManager.sol deployed on Sepolia
- Live: testagent8.oikonomosapp.eth, scott.oikonomosapp.eth

Most creative use of ENS for DeFi ($1.5K)
- ENS subnames are the keychain namespace — each agent is
  {name}.oikonomosapp.eth
- Text records make agents discoverable: resolve the name, get the A2A
  endpoint, interact with the agent
- CCIP gateway means subnames are gas-free to register but still
  resolvable on-chain
- ENS is the glue between the keychain, the identity registry (ERC-8004),
  and the marketplace

===============================================

Transaction Proof

Description: IntentRouter swap execution
TxHash: 0x101961a836079a13d8e63c058e88fd33b1b7f41d0f7c749ae416ee43c6d361b6
Chain: Sepolia

Description: V4 swap test (USDC to DAI)
TxHash: 0x38571649950be26283a5c967ce7f74eb50914de8556d8c170c4efd34966771be
Chain: Sepolia

Description: testagent8 ERC-8004 registration
ID: Agent ID 168
Chain: Sepolia

Description: TAGENT8 token deployment
Address: 0x5BD2F0FAaD04F34b7c0ec7290910AdAfE15fC189
Chain: Base mainnet

Description: ENS approval for SubnameManager
TxHash: 0x81c932750370e9e4e02f7a340e445caacbba5a950ec84d9c0c5d6a6816201ec8
Chain: Sepolia

Description: ENS subname test
TxHash: 0xa46621b09b578e4907663148f4acd7997d510a07834ed539870a5cac715d8df4
Chain: Sepolia

Description: ETH withdrawal from DeFi agent (scott) to deployer
TxHash: 0xd21f6698899c2f59d64602a603fe70e6a5a258757aae2cc467fea61c87b4732f
Chain: Base Sepolia

===============================================

Contracts & Deployments

CCIP SubnameManager (Sepolia): 0xCebDf1E4AeBcbd562aB13aCbB179E950D246C669
IdentityRegistry (Sepolia): 0x8004A818BFB912233c491871b3d84c89A494BD9e
ReputationRegistry (Sepolia): 0x8004B663056A597Dffe9eCcC1965A193B7388713
IntentRouter (Sepolia): 0x89223f6157cDE457B37763A70ed4E6A302F23683
ReceiptHook (Sepolia): 0x41a75f07bA1958EcA78805D8419C87a393764040

Live endpoints:
- Treasury Agent: https://oikonomos-treasury-agent.estmcmxci.workers.dev
- CCIP Gateway: https://oikonomos-ccip-gateway.estmcmxci.workers.dev
- Indexer: https://indexer-production-323e.up.railway.app

===============================================

Critical files

agents/treasury-agent/src/launch/handler.ts — Agent pair launch flow
agents/treasury-agent/src/launch/keychain.ts — Deterministic wallet derivation + agent storage
agents/treasury-agent/src/launch/registration.ts — ERC-8004 + ENS registration
agents/treasury-agent/src/launch/delegation.ts — DeFi to Treasury delegation
agents/treasury-agent/src/execute/wethDistribution.ts — V4 Universal Router swap encoding + ETH/WETH withdrawal
agents/treasury-agent/src/execute/feeClaim.ts — ClankerFeeLocker claiming
agents/treasury-agent/src/execute/feeStatus.ts — Fee status + distribution settings endpoints
agents/treasury-agent/src/execute/claimHistory.ts — Claim history tracker (KV-backed)
agents/treasury-agent/src/observation/cron.ts — Autonomous trigger loop (schedule-aware)
agents/treasury-agent/src/triggers/unified.ts — Policy-driven trigger evaluation
agents/treasury-agent/src/suggestion/handler.ts — Portfolio discovery from Clawnch
services/ccip-gateway-worker/src/ccip-read.ts — CCIP-Read gateway
packages/contracts/src/ccip/OffchainSubnameManager.sol — ENS subname contract
packages/indexer/src/index.ts — Event indexing (Swap, FeesClaimed)
apps/dashboard/app/keychain/page.tsx — Keychain dashboard (table, deposit, withdraw, schedule)
apps/dashboard/app/launch/page.tsx — 5-step launch wizard
apps/dashboard/lib/api.ts — Frontend API client for all backend endpoints
apps/dashboard/components/fees/ — Fee management sub-components

===============================================

Known Issues / Future Work

- OIK-73: Distribution schedule is global per user, not per-agent pair
  (updating one pair's schedule updates all pairs)
- Clawnch API wallet filter does not work — returns all 50 recent launches
  regardless of wallet param; discoverAgentTokens() works around this
- No WETH fees to claim yet (no trading activity on agent tokens)
- LP compounding stubbed (not needed for hackathon, set compound: 0)
- Deployer wallet (0xeb0ABB...) Sepolia ETH nearly depleted
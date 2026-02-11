# Oikonomos Demo Script (~3-4 min)

## [0:00 – 0:30] INTRO

Oikonomos is an agent keychain and portfolio manager. You deploy a pair of AI agents — treasury and DeFi — each gets a deterministic wallet, an ERC-8004 on-chain identity, and an ENS subname under oikonomosapp.eth. The DeFi agent launches a token on Base through Clawnch with a Uniswap V4 pool, and delegates its fee earnings back to the treasury agent for distribution. Everything is discoverable on-chain through ENS text records. Let me show you how it works.

---

## DEMO

### [0:30 – 0:50] Configure agent

> *Fill out the launch form*

I'll name my agent, give it a token symbol and description, and set the fee split — this is the percentage of WETH trading fees that flow back to the deployer. Hit deploy.

### [0:50 – 1:15] Fund wallets

> *Show the funding step, send two txs on Base Sepolia*

The app derived two deterministic wallets — same inputs always produce the same addresses. I send 0.01 Base Sepolia ETH to each for on-chain registration. Once both are funded, deployment kicks off automatically.

### [1:15 – 1:50] Deployment

> *Show step-by-step progress ticking through*

The backend is a Cloudflare Worker running through the pipeline. It registers both agents as ERC-8004 NFTs on Base Sepolia — that's their on-chain identity. Then it creates a Nostr profile and posts a `!clawnch` command. Clawnch's scanner will pick that up and deploy an ERC-20 with a V4 liquidity pool on Base. Finally it signs the fee delegation from the DeFi agent to the treasury. About 20 seconds total.

### [1:50 – 2:20] Discover token

> *Show polling screen, token appears*

Now we poll Clawnch for the token. Their scanner runs every 60 seconds or so — there it is. Token deployed on Base with a Uniswap V4 pool. We can see the contract address and links to Clanker and DexScreener.

### [2:20 – 2:50] Register ENS

> *Switch to Sepolia, fund agent, click Register*

Now I switch to Sepolia to register the ENS subnames. This writes all the agent metadata as text records through our CCIP gateway — token address, token symbol, delegation info, A2A endpoint, ERC-8004 reference. I fund the agent with a small amount of Sepolia ETH for the text record transactions and hit Register.

### [2:50 – 3:10] Deployment complete → Keychain

> *Show result page, click View Keychain*

Done. Both agents are live — wallets, ERC-8004 IDs, ENS names, token trading on Base. Let me go to the keychain.

### [3:10 – 3:30] Keychain dashboard

> *Show keychain page, click through features*

This is the keychain — all my agent pairs in one view. Addresses, ENS names, token info, delegation status, fee balances. From here I can update the distribution schedule, withdraw earned fees, or deposit ETH to the agents.

### [3:30 – 3:50] Verify on-chain

> *Show ENS app records, then Clanker page*

And everything is verifiable. Here's the ENS name — token records, delegation, A2A endpoint all set as text records. And here's the token live on Clanker with its V4 pool.

---

## [3:50 – 4:00] CLOSE

That's Oikonomos — deploy agent pairs with deterministic wallets, on-chain identity, ENS-discoverable metadata, and autonomous fee management, all from a single flow.

# Oikonomos Demo Guide

## Connect Wallet
Visit [oikonomos.vercel.app](https://oikonomos.vercel.app) and connect your web3 wallet via **RainbowKit** + **wagmi**. The dashboard is a **Next.js 14** app on **Vercel** with ENS reverse resolution on Sepolia.

## Configure Agent Pair
Create a Treasury Agent + DeFi Agent. Choose agent name, token symbol, description, and fee split. The form generates two **deterministic wallets** derived from your inputs.

## Fund Deterministic Wallets
Send a small amount of ETH to both wallets on **Base Sepolia** to cover on-chain registration costs.

## Automatic Deployment
A **Cloudflare Worker** backend pipeline runs the full deployment:
- Registers each agent as an **ERC-8004** on-chain identity (ERC-721 NFT on Base Sepolia)
- Creates **ENS subnames** under `oikonomosapp.eth` via **CCIP-Read** (EIP-3668) gateway
- Publishes a **Nostr** profile (NIP-0) and `!clawnch` command (NIP-22, kind 1111)
- **Clawnch** picks up the Nostr event and deploys an **ERC-20** token with a **Uniswap V4** liquidity pool on **Base**
- Signs **EIP-712** fee delegation from the DeFi agent back to the Treasury agent
- Agent state is stored in **Cloudflare KV**

## Discover Token
Wait ~20–60s for **Clawnch's** indexer to deploy the token. View contract address, Uniswap V4 pool, and DexScreener links. A **Ponder** indexer on **Railway** tracks on-chain events across Sepolia, Base Sepolia, and Base Mainnet.

## Write ENS Records
Register text records on **Ethereum Sepolia** through the CCIP gateway — token address, token symbol, delegation info, A2A endpoint, and ERC-8004 reference. All records are resolvable via standard ENS lookups.

## Manage in Keychain
See all agent pairs, wallet balances, ENS names, delegation status, and token info. Update distribution schedule, deposit/withdraw ETH, and verify on-chain records. The dashboard reads agent data from the Treasury Agent API (`GET /agents?userAddress=...`).

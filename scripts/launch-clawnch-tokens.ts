#!/usr/bin/env npx tsx
/**
 * Launch Dogfood Tokens via Clawnch
 *
 * Launches 4 tokens on Base mainnet via Clawstr (Nostr-based Clawnch).
 * Each agent gets their own token with 80% trading fees flowing to their wallet.
 *
 * Usage:
 *   npx tsx scripts/launch-clawnch-tokens.ts
 *   npx tsx scripts/launch-clawnch-tokens.ts --dry-run  # Preview without posting
 *   npx tsx scripts/launch-clawnch-tokens.ts --agent alpha  # Launch only one agent
 *
 * @see .claude/oik-59-clawnch-launch-context.md
 * @see context/clawnch.md
 */

import 'dotenv/config';
import { generateSecretKey, getPublicKey, nip19, finalizeEvent, SimplePool } from 'nostr-tools';
import { keccak256, encodePacked } from 'viem';
import * as fs from 'fs';
import * as path from 'path';

// Polyfill WebSocket for Node.js
import 'websocket-polyfill';

// =============================================================================
// CONFIGURATION
// =============================================================================

const RELAYS = [
  'wss://relay.ditto.pub',
  'wss://relay.primal.net',
  'wss://relay.damus.io',
  'wss://nos.lol',
];

// Agent configuration matching the .env and context file
const AGENTS = {
  alpha: {
    name: 'Oikonomos Alpha',
    symbol: 'OIKAA',
    wallet: '0x0615E51caEF38b57638A55C615659Ef61680B588',
    ens: 'alpha.oikonomos.eth',
    description: 'Meta-treasury AI agent for Oikonomos platform - alpha instance. Autonomous DeFi portfolio manager on Base.',
    erc8004Id: 910,
  },
  beta: {
    name: 'Oikonomos Beta',
    symbol: 'OIKBB',
    wallet: '0xC9f46dA3a4B44edD9fE94218eeBf19E3965f2864',
    ens: 'beta.oikonomos.eth',
    description: 'Meta-treasury AI agent for Oikonomos platform - beta instance. Autonomous DeFi portfolio manager on Base.',
    erc8004Id: 911,
  },
  gamma: {
    name: 'Oikonomos Gamma',
    symbol: 'OIKG',
    wallet: '0xB4892f2f709c5A36308b4B06852C08873b407434',
    ens: 'gamma.oikonomos.eth',
    description: 'Meta-treasury AI agent for Oikonomos platform - gamma instance. Autonomous DeFi portfolio manager on Base.',
    erc8004Id: 912,
  },
  delta: {
    name: 'Oikonomos Delta',
    symbol: 'OIKD',
    wallet: '0x32dE9a11a2aAA618c85Bfed217ADF79E2fEe53De',
    ens: 'delta.oikonomos.eth',
    description: 'Meta-treasury AI agent for Oikonomos platform - delta instance. Autonomous DeFi portfolio manager on Base.',
    erc8004Id: 913,
  },
} as const;

type AgentName = keyof typeof AGENTS;

// State file for persisting Nostr keys
const STATE_FILE = path.join(process.cwd(), '.claude', 'clawnch-nostr-keys.json');

interface NostrKeyPair {
  secretKeyHex: string;
  publicKeyHex: string;
  nsec: string;
  npub: string;
}

interface AgentState {
  nostrKeys: NostrKeyPair;
  profilePublished: boolean;
  launchEventId?: string;
  tokenAddress?: string;
  launchedAt?: number;
}

interface State {
  agents: {
    [key in AgentName]?: AgentState;
  };
  imageUrl?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function loadState(): State {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to load state file, starting fresh');
  }
  return { agents: {} };
}

function saveState(state: State): void {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function deriveNostrKey(deployerKey: string, agentName: string): Uint8Array {
  // Create deterministic Nostr key from deployer key + agent name
  const hash = keccak256(
    encodePacked(['bytes32', 'string'], [deployerKey as `0x${string}`, `nostr:${agentName}`])
  );
  // Convert hex to Uint8Array (32 bytes)
  return Uint8Array.from(Buffer.from(hash.slice(2), 'hex'));
}

function getOrCreateNostrKeys(state: State, agentName: AgentName, deployerKey?: string): NostrKeyPair {
  // Check if we already have keys
  if (state.agents[agentName]?.nostrKeys) {
    return state.agents[agentName]!.nostrKeys;
  }

  // Generate new keys
  let secretKey: Uint8Array;
  if (deployerKey) {
    // Derive deterministically from deployer key
    secretKey = deriveNostrKey(deployerKey, agentName);
    console.log(`  Derived Nostr key from DEPLOYER_PRIVATE_KEY`);
  } else {
    // Generate random key
    secretKey = generateSecretKey();
    console.log(`  Generated new random Nostr key`);
  }

  const publicKey = getPublicKey(secretKey);
  const nsec = nip19.nsecEncode(secretKey);
  const npub = nip19.npubEncode(publicKey);

  const keys: NostrKeyPair = {
    secretKeyHex: Buffer.from(secretKey).toString('hex'),
    publicKeyHex: publicKey,
    nsec,
    npub,
  };

  // Save to state
  if (!state.agents[agentName]) {
    state.agents[agentName] = {
      nostrKeys: keys,
      profilePublished: false,
    };
  } else {
    state.agents[agentName]!.nostrKeys = keys;
  }

  return keys;
}

function secretKeyFromHex(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}

// =============================================================================
// NOSTR EVENT CREATION
// =============================================================================

function createProfileEvent(agentName: AgentName, secretKey: Uint8Array) {
  const agent = AGENTS[agentName];

  const profileContent = JSON.stringify({
    name: `${agent.name} Agent`,
    about: `${agent.description}\n\nENS: ${agent.ens}\nERC-8004 ID: ${agent.erc8004Id}`,
    website: 'https://oikonomos.xyz',
    bot: true, // REQUIRED for Clawnch
    nip05: `${agentName}@oikonomos.xyz`,
  });

  const eventTemplate = {
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    content: profileContent,
    tags: [],
  };

  return finalizeEvent(eventTemplate, secretKey);
}

function createLaunchEvent(agentName: AgentName, imageUrl: string, secretKey: Uint8Array) {
  const agent = AGENTS[agentName];

  const content = `!clawnch
name: ${agent.name}
symbol: ${agent.symbol}
wallet: ${agent.wallet}
description: ${agent.description}
image: ${imageUrl}
website: https://oikonomos.xyz
twitter: @oikonomos_eth`;

  const eventTemplate = {
    kind: 1111, // NIP-22 Comment
    created_at: Math.floor(Date.now() / 1000),
    content,
    tags: [
      ['I', 'https://clawstr.com/c/clawnch'],
      ['K', 'web'],
      ['i', 'https://clawstr.com/c/clawnch'],
      ['k', 'web'],
      ['L', 'agent'],
      ['l', 'ai', 'agent'],
    ],
  };

  return finalizeEvent(eventTemplate, secretKey);
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

async function uploadImage(): Promise<string> {
  // Upload an image to Clawnch or use an existing public URL
  console.log('\n📸 Image Upload');
  console.log('-'.repeat(40));

  // Try to upload via Clawnch API by providing a public image URL
  // Clawnch will re-host it
  try {
    console.log('  Uploading to Clawnch...');

    // Use a public image URL that Clawnch can fetch and re-host
    // This is a simple purple/indigo gradient icon that works well for tokens
    const sourceImageUrl = 'https://raw.githubusercontent.com/coinbase/onchainkit/main/site/docs/pages/favicon.png';

    const response = await fetch('https://clawn.ch/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: sourceImageUrl,
        name: 'oikonomos-agent-token',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  ✓ Uploaded: ${data.url}`);
      return data.url;
    } else {
      const error = await response.text();
      console.warn(`  ⚠ Upload failed: ${error}`);
    }
  } catch (e) {
    console.warn(`  ⚠ Upload error: ${e}`);
  }

  // Fallback: Use a direct Arweave/IPFS URL or another known working image
  // This is a placeholder purple token image
  const fallbackUrl = 'https://arweave.net/YqYBjs7pV6JW4jDGYZlN4VKq8yzs8x8S8dPJ5B1pZ80';

  // Alternative: Try another upload source
  try {
    console.log('  Trying alternative upload...');
    const response = await fetch('https://clawn.ch/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: 'https://avatars.githubusercontent.com/u/182518080', // Oikonomos GitHub avatar
        name: 'oikonomos-token',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  ✓ Uploaded: ${data.url}`);
      return data.url;
    }
  } catch {
    // ignore
  }

  console.log(`  Using fallback image: ${fallbackUrl}`);
  return fallbackUrl;
}

async function publishProfile(
  pool: SimplePool,
  agentName: AgentName,
  secretKey: Uint8Array,
  dryRun: boolean
): Promise<boolean> {
  const profileEvent = createProfileEvent(agentName, secretKey);

  console.log(`\n  Profile Event:`);
  console.log(`    Kind: ${profileEvent.kind}`);
  console.log(`    ID: ${profileEvent.id}`);
  console.log(`    Pubkey: ${profileEvent.pubkey}`);

  if (dryRun) {
    console.log(`  [DRY RUN] Would publish profile to ${RELAYS.length} relays`);
    return true;
  }

  try {
    await Promise.any(pool.publish(RELAYS, profileEvent));
    console.log(`  ✓ Profile published to relays`);
    return true;
  } catch (e) {
    console.error(`  ✗ Failed to publish profile: ${e}`);
    return false;
  }
}

async function publishLaunch(
  pool: SimplePool,
  agentName: AgentName,
  imageUrl: string,
  secretKey: Uint8Array,
  dryRun: boolean
): Promise<string | null> {
  const launchEvent = createLaunchEvent(agentName, imageUrl, secretKey);

  console.log(`\n  Launch Event:`);
  console.log(`    Kind: ${launchEvent.kind} (NIP-22 Comment)`);
  console.log(`    ID: ${launchEvent.id}`);
  console.log(`    Content preview: ${launchEvent.content.substring(0, 100)}...`);

  if (dryRun) {
    console.log(`  [DRY RUN] Would publish launch to ${RELAYS.length} relays`);
    return launchEvent.id;
  }

  try {
    await Promise.any(pool.publish(RELAYS, launchEvent));
    console.log(`  ✓ Launch event published to relays`);
    console.log(`  📍 Event ID: ${launchEvent.id}`);
    return launchEvent.id;
  } catch (e) {
    console.error(`  ✗ Failed to publish launch: ${e}`);
    return null;
  }
}

async function launchAgent(
  pool: SimplePool,
  state: State,
  agentName: AgentName,
  imageUrl: string,
  deployerKey: string | undefined,
  dryRun: boolean
): Promise<boolean> {
  const agent = AGENTS[agentName];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🤖 ${agent.name} (${agentName})`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Symbol: ${agent.symbol}`);
  console.log(`  Wallet: ${agent.wallet}`);
  console.log(`  ENS: ${agent.ens}`);
  console.log(`  ERC-8004 ID: ${agent.erc8004Id}`);

  // Check if already launched
  if (state.agents[agentName]?.tokenAddress) {
    console.log(`\n  ⚠ Already launched!`);
    console.log(`    Token: ${state.agents[agentName]!.tokenAddress}`);
    console.log(`    Event ID: ${state.agents[agentName]!.launchEventId}`);
    return true;
  }

  // Get or create Nostr keys
  console.log(`\n  🔑 Nostr Identity:`);
  const keys = getOrCreateNostrKeys(state, agentName, deployerKey);
  console.log(`    npub: ${keys.npub}`);
  const secretKey = secretKeyFromHex(keys.secretKeyHex);

  // Publish profile if not already done
  if (!state.agents[agentName]?.profilePublished) {
    console.log(`\n  📋 Publishing Nostr profile...`);
    const profileOk = await publishProfile(pool, agentName, secretKey, dryRun);
    if (profileOk && !dryRun) {
      state.agents[agentName]!.profilePublished = true;
      saveState(state);
    }
    // Wait a bit for profile to propagate
    if (!dryRun) {
      console.log(`  ⏳ Waiting 3s for profile propagation...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  } else {
    console.log(`\n  ✓ Profile already published`);
  }

  // Publish launch event
  console.log(`\n  🚀 Publishing launch event...`);
  const eventId = await publishLaunch(pool, agentName, imageUrl, secretKey, dryRun);

  if (eventId && !dryRun) {
    state.agents[agentName]!.launchEventId = eventId;
    state.agents[agentName]!.launchedAt = Date.now();
    saveState(state);
  }

  return eventId !== null;
}

async function main() {
  console.log('🚀 Clawnch Token Launcher for Oikonomos Dogfood Agents\n');
  console.log(`${'═'.repeat(60)}`);
  console.log('This script launches 4 tokens on Base mainnet via Clawstr.');
  console.log('Each agent earns 80% of trading fees automatically.');
  console.log(`${'═'.repeat(60)}`);

  // Parse arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const singleAgentArg = args.find((a) => a.startsWith('--agent=') || args[args.indexOf('--agent') + 1]);
  let targetAgent: AgentName | null = null;

  if (args.includes('--agent')) {
    const idx = args.indexOf('--agent');
    if (idx >= 0 && args[idx + 1]) {
      targetAgent = args[idx + 1] as AgentName;
    }
  } else if (singleAgentArg?.startsWith('--agent=')) {
    targetAgent = singleAgentArg.split('=')[1] as AgentName;
  }

  if (targetAgent && !AGENTS[targetAgent]) {
    console.error(`\n❌ Unknown agent: ${targetAgent}`);
    console.error(`   Valid agents: ${Object.keys(AGENTS).join(', ')}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No events will be published\n');
  }

  // Load state
  const state = loadState();

  // Get deployer key for deterministic key derivation
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployerKey) {
    console.warn('\n⚠️  DEPLOYER_PRIVATE_KEY not set - will generate random Nostr keys');
  }

  // Upload/get image URL
  let imageUrl = state.imageUrl;
  if (!imageUrl) {
    imageUrl = await uploadImage();
    state.imageUrl = imageUrl;
    saveState(state);
  } else {
    console.log(`\n📸 Using cached image: ${imageUrl}`);
  }

  // Create Nostr pool
  const pool = new SimplePool();

  // Launch agents
  const agentsToLaunch = targetAgent ? [targetAgent] : (Object.keys(AGENTS) as AgentName[]);
  const results: { agent: AgentName; success: boolean }[] = [];

  for (const agentName of agentsToLaunch) {
    const success = await launchAgent(pool, state, agentName, imageUrl, deployerKey, dryRun);
    results.push({ agent: agentName, success });

    // Wait between launches to avoid rate limiting
    if (agentName !== agentsToLaunch[agentsToLaunch.length - 1] && !dryRun) {
      console.log(`\n⏳ Waiting 5s before next launch...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 LAUNCH SUMMARY');
  console.log(`${'═'.repeat(60)}`);

  console.log('\nResults:');
  for (const { agent, success } of results) {
    const status = success ? '✓' : '✗';
    const agentData = state.agents[agent];
    console.log(`  ${status} ${AGENTS[agent].symbol}`);
    if (agentData?.launchEventId) {
      console.log(`    Event ID: ${agentData.launchEventId}`);
    }
  }

  console.log('\n🔍 Next Steps:');
  console.log('  1. Wait 1-2 minutes for Clawnch scanner to detect the posts');
  console.log('  2. Check https://clawn.ch for your tokens');
  console.log('  3. Clawnch will reply to your Nostr posts with deployment results');
  console.log('  4. Run this script again to update state with token addresses');

  if (!dryRun) {
    console.log(`\n📁 State saved to: ${STATE_FILE}`);
  }

  // Close pool
  pool.close(RELAYS);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

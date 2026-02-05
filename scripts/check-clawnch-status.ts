#!/usr/bin/env npx tsx
/**
 * Check Clawnch Token Launch Status
 *
 * Checks the status of launched tokens on Clawnch and updates the local state.
 *
 * Usage:
 *   npx tsx scripts/check-clawnch-status.ts
 *   npx tsx scripts/check-clawnch-status.ts --watch  # Poll until all tokens are deployed
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// CONFIGURATION
// =============================================================================

const STATE_FILE = path.join(process.cwd(), '.claude', 'clawnch-nostr-keys.json');

const AGENT_WALLETS = {
  alpha: '0x0615E51caEF38b57638A55C615659Ef61680B588',
  beta: '0xC9f46dA3a4B44edD9fE94218eeBf19E3965f2864',
  gamma: '0xB4892f2f709c5A36308b4B06852C08873b407434',
  delta: '0x32dE9a11a2aAA618c85Bfed217ADF79E2fEe53De',
} as const;

const EXPECTED_SYMBOLS = {
  alpha: 'OIKALPHA',
  beta: 'OIKBETA',
  gamma: 'OIKGAMMA',
  delta: 'OIKDELTA',
} as const;

type AgentName = keyof typeof AGENT_WALLETS;

interface ClawnchLaunch {
  contractAddress: string;
  name: string;
  symbol: string;
  description: string;
  agentWallet: string;
  source: string;
  launchedAt: number;
  txHash?: string;
  poolId?: string;
}

interface AgentState {
  nostrKeys: {
    secretKeyHex: string;
    publicKeyHex: string;
    nsec: string;
    npub: string;
  };
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
    console.warn('Failed to load state file');
  }
  return { agents: {} };
}

function saveState(state: State): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function fetchLaunchesForWallet(wallet: string): Promise<ClawnchLaunch[]> {
  try {
    const response = await fetch(`https://clawn.ch/api/launches?wallet=${wallet}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`  API returned ${response.status} for wallet ${wallet}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.launches || [];
  } catch (e) {
    console.warn(`  Error fetching launches for ${wallet}: ${e}`);
    return [];
  }
}

async function fetchLaunchesBySymbol(symbol: string): Promise<ClawnchLaunch[]> {
  try {
    const response = await fetch(`https://clawn.ch/api/launches?symbol=${symbol}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.launches || [];
  } catch {
    return [];
  }
}

async function fetchRecentLaunches(): Promise<ClawnchLaunch[]> {
  try {
    const response = await fetch('https://clawn.ch/api/launches?limit=20&source=clawstr', {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.launches || [];
  } catch {
    return [];
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function checkStatus(watch: boolean): Promise<boolean> {
  const state = loadState();

  console.log('🔍 Checking Clawnch Token Launch Status\n');
  console.log('═'.repeat(60));

  const results: { agent: AgentName; found: boolean; address?: string }[] = [];

  for (const [agent, wallet] of Object.entries(AGENT_WALLETS)) {
    const agentName = agent as AgentName;
    const expectedSymbol = EXPECTED_SYMBOLS[agentName];

    console.log(`\n🤖 ${agentName.toUpperCase()} (${expectedSymbol})`);
    console.log(`   Wallet: ${wallet}`);

    // Check if we already have the token address
    if (state.agents[agentName]?.tokenAddress) {
      console.log(`   ✓ Already found: ${state.agents[agentName]!.tokenAddress}`);
      results.push({ agent: agentName, found: true, address: state.agents[agentName]!.tokenAddress });
      continue;
    }

    // Search by wallet
    console.log(`   Searching by wallet...`);
    let launches = await fetchLaunchesForWallet(wallet);
    let matchingLaunch = launches.find(
      (l) => l.symbol === expectedSymbol || l.symbol === `$${expectedSymbol}`
    );

    // If not found, search by symbol
    if (!matchingLaunch) {
      console.log(`   Searching by symbol...`);
      launches = await fetchLaunchesBySymbol(expectedSymbol);
      matchingLaunch = launches.find(
        (l) => l.agentWallet?.toLowerCase() === wallet.toLowerCase()
      );
    }

    // Check recent launches
    if (!matchingLaunch) {
      console.log(`   Checking recent Clawstr launches...`);
      const recentLaunches = await fetchRecentLaunches();
      matchingLaunch = recentLaunches.find(
        (l) =>
          (l.symbol === expectedSymbol || l.symbol === `$${expectedSymbol}`) &&
          l.agentWallet?.toLowerCase() === wallet.toLowerCase()
      );
    }

    if (matchingLaunch) {
      console.log(`   ✓ FOUND: ${matchingLaunch.contractAddress}`);
      console.log(`     Symbol: ${matchingLaunch.symbol}`);
      console.log(`     Source: ${matchingLaunch.source}`);

      // Update state
      if (state.agents[agentName]) {
        state.agents[agentName]!.tokenAddress = matchingLaunch.contractAddress;
      }
      results.push({ agent: agentName, found: true, address: matchingLaunch.contractAddress });
    } else {
      console.log(`   ⏳ Not yet deployed (scanner runs every minute)`);
      results.push({ agent: agentName, found: false });
    }
  }

  // Save state
  saveState(state);

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 STATUS SUMMARY');
  console.log('═'.repeat(60));

  const foundCount = results.filter((r) => r.found).length;
  const totalCount = results.length;

  console.log(`\n  Deployed: ${foundCount}/${totalCount}`);

  for (const result of results) {
    const status = result.found ? '✓' : '⏳';
    const address = result.address ? `→ ${result.address}` : 'pending...';
    console.log(`  ${status} ${EXPECTED_SYMBOLS[result.agent]}: ${address}`);
  }

  if (foundCount === totalCount) {
    console.log('\n🎉 ALL TOKENS DEPLOYED!');

    // Print .env format
    console.log('\n📝 Add to .env:');
    console.log('# Clawnch Dogfood Tokens (Base mainnet)');
    for (const result of results) {
      if (result.address) {
        console.log(`${EXPECTED_SYMBOLS[result.agent]}_TOKEN_ADDRESS=${result.address}`);
      }
    }

    // Print Clanker URLs
    console.log('\n🔗 Clanker URLs:');
    for (const result of results) {
      if (result.address) {
        console.log(`  ${EXPECTED_SYMBOLS[result.agent]}: https://clanker.world/clanker/${result.address}`);
      }
    }

    // Print Basescan URLs
    console.log('\n🔗 Basescan URLs:');
    for (const result of results) {
      if (result.address) {
        console.log(`  ${EXPECTED_SYMBOLS[result.agent]}: https://basescan.org/token/${result.address}`);
      }
    }

    return true;
  }

  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch');

  if (watch) {
    console.log('👀 Watch mode enabled - will poll every 30 seconds\n');

    let attempt = 0;
    const maxAttempts = 20; // 10 minutes max

    while (attempt < maxAttempts) {
      const allDeployed = await checkStatus(false);

      if (allDeployed) {
        console.log('\n✅ Watch complete - all tokens deployed!');
        process.exit(0);
      }

      attempt++;
      console.log(`\n⏳ Waiting 30s before next check (attempt ${attempt}/${maxAttempts})...\n`);
      await new Promise((r) => setTimeout(r, 30000));
    }

    console.log('\n⚠️ Max attempts reached. Some tokens may still be pending.');
    process.exit(1);
  } else {
    await checkStatus(false);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

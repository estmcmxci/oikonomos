#!/usr/bin/env npx tsx
/**
 * Generate dedicated wallets for agent services
 *
 * Usage:
 *   npx tsx scripts/generate-wallet.ts [service-name]
 *
 * Examples:
 *   npx tsx scripts/generate-wallet.ts treasury-agent
 *   npx tsx scripts/generate-wallet.ts reputation-worker
 *   npx tsx scripts/generate-wallet.ts                    # Generate all
 *
 * Output:
 *   Prints private key and address. Add to .env and configure in wrangler secrets.
 */

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const SERVICES = [
  {
    name: 'treasury-agent',
    envVar: 'TREASURY_AGENT_PRIVATE_KEY',
    walletVar: 'AGENT_WALLET',
    purpose: 'Execute rebalances + receive x402 fees',
  },
  {
    name: 'reputation-worker',
    envVar: 'REPUTATION_WORKER_PRIVATE_KEY',
    walletVar: 'REPUTATION_WORKER_WALLET',
    purpose: 'Submit feedback to ReputationRegistry',
  },
  {
    name: 'strategy-agent',
    envVar: 'STRATEGY_AGENT_PRIVATE_KEY',
    walletVar: 'STRATEGY_AGENT_WALLET',
    purpose: 'Execute strategy quotes (future)',
  },
] as const;

function generateWallet(serviceName: string) {
  const service = SERVICES.find((s) => s.name === serviceName);
  if (!service) {
    console.error(`Unknown service: ${serviceName}`);
    console.error(`Available services: ${SERVICES.map((s) => s.name).join(', ')}`);
    process.exit(1);
  }

  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  console.log('\n' + '='.repeat(70));
  console.log(`Service: ${service.name}`);
  console.log(`Purpose: ${service.purpose}`);
  console.log('='.repeat(70));
  console.log(`\nPrivate Key: ${privateKey}`);
  console.log(`Address:     ${account.address}`);
  console.log('\n# Add to .env:');
  console.log(`${service.envVar}=${privateKey}`);
  if (service.walletVar) {
    console.log(`${service.walletVar}=${account.address}`);
  }
  console.log('\n# Configure Cloudflare Worker secret:');
  console.log(`cd agents/${service.name} && wrangler secret put PRIVATE_KEY`);
  if (service.walletVar) {
    console.log(`# Then paste the private key when prompted`);
    console.log(`# Also set the public wallet address:`);
    console.log(`wrangler secret put ${service.walletVar}`);
    console.log(`# Then paste: ${account.address}`);
  }
  console.log('\n# Fund with Sepolia ETH (~0.1 ETH):');
  console.log(`# https://sepolia-faucet.pk910.de/ or https://sepoliafaucet.com/`);
  console.log(`# Send to: ${account.address}`);

  return { privateKey, address: account.address, service };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Generate all wallets
    console.log('Generating wallets for all services...\n');
    const wallets = SERVICES.map((s) => generateWallet(s.name));

    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY - Add all to .env:');
    console.log('='.repeat(70));
    for (const w of wallets) {
      console.log(`\n# ${w.service.name} (${w.service.purpose})`);
      console.log(`${w.service.envVar}=${w.privateKey}`);
      if (w.service.walletVar) {
        console.log(`${w.service.walletVar}=${w.address}`);
      }
    }
    console.log('\n');
  } else {
    // Generate single wallet
    generateWallet(args[0]);
    console.log('\n');
  }
}

main();

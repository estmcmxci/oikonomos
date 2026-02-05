#!/usr/bin/env node
/**
 * Get wallet address from private key
 * Usage: node scripts/get-wallet-address.mjs <PRIVATE_KEY>
 * Or set AGENT_EXECUTOR_PRIVATE_KEY in .env and run: node scripts/get-wallet-address.mjs
 */

import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Get private key from command line or .env file
let privateKey = process.argv[2];

if (!privateKey) {
  // Try to read from .env file
  try {
    const envPath = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/AGENT_EXECUTOR_PRIVATE_KEY=(.+)/);
    if (match && match[1]) {
      privateKey = match[1].trim();
    }
  } catch (error) {
    console.error('Could not read .env file');
  }
}

if (!privateKey || privateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
  console.error('❌ Please provide a private key:');
  console.error('   node scripts/get-wallet-address.mjs <PRIVATE_KEY>');
  console.error('   Or set AGENT_EXECUTOR_PRIVATE_KEY in .env');
  process.exit(1);
}

try {
  const account = privateKeyToAccount(privateKey);
  console.log('\n✅ Wallet Address:', account.address);
  console.log('\n📝 To use this wallet:');
  console.log(`   1. Set AGENT_EXECUTOR_PRIVATE_KEY=${privateKey} in .env`);
  console.log(`   2. Fund ${account.address} with ~0.005 ETH for gas`);
  console.log(`   3. Use this address when registering on ERC-8004\n`);
} catch (error) {
  console.error('❌ Invalid private key:', error.message);
  process.exit(1);
}

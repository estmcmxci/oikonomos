#!/usr/bin/env npx tsx
/**
 * Fund dedicated agent wallets from DEPLOYER
 */

import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const DEPLOYER_KEY = '0x5bac2a365ad5db99a387f07c3f352032d13063fdc5277cf7fe3385a02f14ae3a';
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/MIpa-idKGvSRwUYBT9gAr';

const WALLETS = [
  { name: 'treasury-agent', address: '0xB037d8161eFc69dE19D5bD76B6BaeaC5dE5C8761' },
  { name: 'strategy-agent', address: '0x168E50A2812Fb380c64a2B1C523DA4fb00923691' },
  { name: 'reputation-worker', address: '0x326C5A8E71584Af2fCcd1608207Af9A4924274Ce' },
];

const AMOUNT = parseEther('0.01');

async function main() {
  const account = privateKeyToAccount(DEPLOYER_KEY);
  const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
  const walletClient = createWalletClient({ account, chain: sepolia, transport: http(RPC_URL) });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Deployer:', account.address);
  console.log('Balance:', formatEther(balance), 'ETH\n');

  for (const wallet of WALLETS) {
    console.log('Sending 0.01 ETH to', wallet.name, '(' + wallet.address + ')...');
    const hash = await walletClient.sendTransaction({
      to: wallet.address as `0x${string}`,
      value: AMOUNT,
    });
    console.log('  TX:', hash);
  }

  console.log('\nDone!');
}

main().catch(console.error);

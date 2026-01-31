#!/usr/bin/env npx ts-node

/**
 * ERC-8004 Agent Registration Script
 *
 * Registers an agent with the canonical ERC-8004 IdentityRegistry
 * Uses base64-encoded JSON format per howto8004.com
 *
 * Usage:
 *   npx ts-node packages/sdk/src/scripts/registerAgent.ts
 *
 * Environment variables:
 *   PRIVATE_KEY - Deployer private key
 *   RPC_URL - Sepolia RPC URL (defaults to public endpoint)
 */

import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import {
  registerAgent,
  createAgentURI,
  extractAgentIdFromTransferLog,
  type ERC8004Registration,
} from '../contracts/identityRegistry';
import { getERC8004Addresses } from '@oikonomos/shared';

async function main() {
  // Configuration
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: PRIVATE_KEY environment variable required');
    process.exit(1);
  }

  const rpcUrl = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

  // Setup clients
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // Agent registration data
  const registration: ERC8004Registration = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'Oikonomos Treasury Agent',
    description: 'Autonomous treasury management agent for DeFi portfolios',
    active: true,
    x402Support: false,
    services: [
      {
        name: 'A2A',
        endpoint: 'https://treasury.oikonomos.eth.limo/.well-known/agent-card.json',
        version: '0.3.0',
      },
      {
        name: 'ENS',
        endpoint: 'treasury.oikonomos.eth',
      },
    ],
  };

  console.log('=== ERC-8004 Agent Registration ===\n');
  console.log('Network: Sepolia');
  console.log('Registry:', getERC8004Addresses(sepolia.id).IDENTITY_REGISTRY);
  console.log('Account:', account.address);
  console.log('\nAgent Details:');
  console.log('  Name:', registration.name);
  console.log('  Description:', registration.description);
  console.log('  Services:', registration.services?.map(s => s.name).join(', '));
  console.log('\nAgent URI (base64):');
  console.log('  ', createAgentURI(registration).slice(0, 80) + '...');
  console.log('');

  try {
    console.log('Submitting registration transaction...');
    const { hash, agentURI } = await registerAgent(walletClient, registration);
    console.log('Transaction hash:', hash);

    console.log('\nWaiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Status:', receipt.status === 'success' ? 'Success ✓' : 'Failed ✗');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());

    // Extract agentId from Transfer event
    let agentId: bigint | null = null;
    for (const log of receipt.logs) {
      agentId = extractAgentIdFromTransferLog(log);
      if (agentId !== null) break;
    }

    if (agentId !== null) {
      console.log('\n=== Registration Complete ===');
      console.log('Agent ID:', agentId.toString());
      console.log('View on 8004scan: https://www.8004scan.io/agent/' + agentId);
      console.log('\nENS text record to set:');
      console.log(`  agent:erc8004 = "eip155:${sepolia.id}:${getERC8004Addresses(sepolia.id).IDENTITY_REGISTRY}:${agentId}"`);
    } else {
      console.log('\nWarning: Could not extract agentId from logs');
      console.log('Check transaction on Etherscan:', `https://sepolia.etherscan.io/tx/${hash}`);
    }
  } catch (error) {
    console.error('Registration failed:', error);
    process.exit(1);
  }
}

main();

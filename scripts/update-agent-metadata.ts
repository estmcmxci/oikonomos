#!/usr/bin/env npx tsx
/**
 * Update Agent Metadata CLI
 *
 * Updates the metadata (agentURI) for an existing ERC-8004 registered agent.
 *
 * Usage:
 *   npx tsx scripts/update-agent-metadata.ts --agent-id 639 --name "New Name"
 *   npx tsx scripts/update-agent-metadata.ts --agent-id 639 --description "New description" --worker-url https://new.workers.dev
 *
 * Environment Variables (from .env):
 *   DEPLOYER_PRIVATE_KEY  - Must be the owner of the agent
 *   SEPOLIA_RPC_URL       - RPC endpoint
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { parseArgs } from 'util';
import { createPublicClient, createWalletClient, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, mainnet } from 'viem/chains';
import {
  getAgentURI,
  getAgentOwner,
  setAgentURI,
  parseAgentURI,
  createAgentURI,
  type ERC8004Registration,
} from '@oikonomos/sdk';

// Load .env from project root
config({ path: resolve(process.cwd(), '.env') });

// CLI argument parsing
const { values: args } = parseArgs({
  options: {
    'agent-id': {
      type: 'string',
      short: 'a',
    },
    name: {
      type: 'string',
      short: 'n',
    },
    description: {
      type: 'string',
      short: 'd',
    },
    'worker-url': {
      type: 'string',
      short: 'w',
    },
    image: {
      type: 'string',
      short: 'i',
    },
    active: {
      type: 'string', // "true" or "false"
    },
    'chain-id': {
      type: 'string',
      default: '11155111',
    },
    help: {
      type: 'boolean',
      short: 'h',
    },
  },
  allowPositionals: false,
});

function printHelp(): void {
  console.log(`
Update Agent Metadata - ERC-8004 Metadata Update CLI

Usage:
  npx tsx scripts/update-agent-metadata.ts --agent-id <id> [options]

Required:
  --agent-id, -a <id>     Agent ID to update (required)

Options:
  --name, -n <name>       New agent name
  --description, -d <desc> New agent description
  --worker-url, -w <url>  New worker URL (updates A2A and web endpoints)
  --image, -i <url>       New image URL
  --active <true|false>   Set active status
  --chain-id <id>         Chain ID (default: 11155111 Sepolia)
  --help, -h              Show this help message

Environment Variables (.env):
  DEPLOYER_PRIVATE_KEY    Signing key (must be agent owner)
  SEPOLIA_RPC_URL         RPC endpoint

Examples:
  # Update just the name
  npx tsx scripts/update-agent-metadata.ts --agent-id 639 --name "Updated Treasury Agent"

  # Update multiple fields
  npx tsx scripts/update-agent-metadata.ts \\
    --agent-id 639 \\
    --name "New Name" \\
    --description "New description" \\
    --worker-url https://new-treasury.workers.dev

  # Deactivate an agent
  npx tsx scripts/update-agent-metadata.ts --agent-id 639 --active false
`);
}

// Get chain configuration
function getChain(chainId: number) {
  switch (chainId) {
    case 1:
      return mainnet;
    case 11155111:
    default:
      return sepolia;
  }
}

async function main(): Promise<void> {
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Validate required arguments
  const agentIdStr = args['agent-id'];
  if (!agentIdStr) {
    console.error('Error: --agent-id is required');
    console.error('Run with --help for usage information.');
    process.exit(1);
  }

  const agentId = BigInt(agentIdStr);

  // Load environment variables
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const rpcUrl = process.env.SEPOLIA_RPC_URL;

  if (!privateKey || privateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.error('Error: DEPLOYER_PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  if (!rpcUrl) {
    console.error('Error: SEPOLIA_RPC_URL not set in .env');
    process.exit(1);
  }

  const chainId = parseInt(args['chain-id'] || '11155111', 10);

  // Set up clients
  const chain = getChain(chainId);
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  console.log('\n========================================');
  console.log('  ERC-8004 Agent Metadata Update');
  console.log('========================================\n');

  console.log('Configuration:');
  console.log(`  Agent ID:  ${agentId}`);
  console.log(`  Chain:     ${chain.name} (${chainId})`);
  console.log(`  Account:   ${account.address}`);

  // Verify ownership
  console.log('\n--- Verifying Ownership ---\n');

  let currentOwner: Address;
  try {
    currentOwner = await getAgentOwner(publicClient, agentId);
    console.log(`  Agent Owner: ${currentOwner}`);
  } catch (err) {
    console.error(`  Error: Agent ${agentId} not found or invalid`);
    process.exit(1);
  }

  if (currentOwner.toLowerCase() !== account.address.toLowerCase()) {
    console.error(`\n  Error: You are not the owner of agent ${agentId}`);
    console.error(`  Your address: ${account.address}`);
    console.error(`  Owner address: ${currentOwner}`);
    process.exit(1);
  }

  console.log(`  Ownership verified`);

  // Fetch current metadata
  console.log('\n--- Current Metadata ---\n');

  let currentURI: string;
  let currentRegistration: ERC8004Registration | null;

  try {
    currentURI = await getAgentURI(publicClient, agentId);
    currentRegistration = parseAgentURI(currentURI);

    if (currentRegistration) {
      console.log(JSON.stringify(currentRegistration, null, 2));
    } else {
      console.log(`  URI: ${currentURI}`);
      console.log(`  Warning: Could not parse as ERC-8004 registration JSON`);
      // Create a basic registration object to update
      currentRegistration = {
        type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
        name: 'Unknown Agent',
        description: '',
        active: true,
      };
    }
  } catch (err) {
    console.error(`  Error fetching current URI: ${(err as Error).message}`);
    process.exit(1);
  }

  // Build updated registration
  console.log('\n--- Building Updated Metadata ---\n');

  const updatedRegistration: ERC8004Registration = {
    ...currentRegistration,
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
  };

  // Apply updates
  if (args.name) {
    console.log(`  Name: "${currentRegistration.name}" -> "${args.name}"`);
    updatedRegistration.name = args.name;
  }

  if (args.description) {
    console.log(`  Description: Updated`);
    updatedRegistration.description = args.description;
  }

  if (args.image) {
    console.log(`  Image: "${currentRegistration.image || ''}" -> "${args.image}"`);
    updatedRegistration.image = args.image;
  }

  if (args.active !== undefined) {
    const newActive = args.active === 'true';
    console.log(`  Active: ${currentRegistration.active} -> ${newActive}`);
    updatedRegistration.active = newActive;
  }

  if (args['worker-url']) {
    const newWorkerUrl = args['worker-url'];
    console.log(`  Worker URL: ${newWorkerUrl}`);

    // Update services array
    const services = updatedRegistration.services || [];
    const updatedServices = services.map((service) => {
      if (service.name === 'A2A') {
        return {
          ...service,
          endpoint: `${newWorkerUrl}/.well-known/agent-card.json`,
        };
      }
      if (service.name === 'web') {
        return { ...service, endpoint: newWorkerUrl };
      }
      return service;
    });

    // Add services if they don't exist
    if (!updatedServices.find((s) => s.name === 'A2A')) {
      updatedServices.push({
        name: 'A2A',
        endpoint: `${newWorkerUrl}/.well-known/agent-card.json`,
        version: '0.3.0',
      });
    }
    if (!updatedServices.find((s) => s.name === 'web')) {
      updatedServices.push({ name: 'web', endpoint: newWorkerUrl });
    }

    updatedRegistration.services = updatedServices;
  }

  console.log('\n--- New Metadata ---\n');
  console.log(JSON.stringify(updatedRegistration, null, 2));

  // Create new URI
  const newURI = createAgentURI(updatedRegistration);

  // Submit update
  console.log('\n--- Updating Agent ---\n');

  try {
    const hash = await setAgentURI(walletClient, agentId, newURI);
    console.log(`  Transaction submitted: ${hash}`);
    console.log(`  Waiting for confirmation...`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'reverted') {
      console.error('\n  Transaction reverted!');
      process.exit(1);
    }

    console.log(`  Transaction confirmed in block ${receipt.blockNumber}`);

    console.log('\n========================================');
    console.log('  Update Complete!');
    console.log('========================================\n');
  } catch (err) {
    const error = err as Error;
    console.error(`\nUpdate failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * Register Canonical Agent CLI
 *
 * Registers an agent with the ERC-8004 IdentityRegistry.
 * Loads configuration from .env and accepts CLI overrides.
 *
 * Usage:
 *   npx tsx scripts/register-canonical-agent.ts --type treasury
 *   npx tsx scripts/register-canonical-agent.ts --type strategy --ens strategy.oikonomos.eth --worker-url https://strategy.workers.dev --set-ens
 *
 * Environment Variables (from .env):
 *   DEPLOYER_PRIVATE_KEY  - Signing key for registration
 *   SEPOLIA_RPC_URL       - RPC endpoint
 *   TREASURY_AGENT_ENS    - Default ENS for treasury agent
 *   TREASURY_AGENT_URL    - Default worker URL for treasury agent
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { parseArgs } from 'util';
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type PublicClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, mainnet } from 'viem/chains';
import {
  buildTreasuryAgentRegistration,
  buildStrategyAgentRegistration,
  buildAgentRegistrationJSON,
  registerAgent,
  extractAgentIdFromTransferLog,
  setAgentERC8004Record,
  validateA2AEndpoint,
  validateENSName,
  validateEndpointFormat,
  getERC8004Addresses,
  type ERC8004Registration,
} from '@oikonomos/sdk';

// Load .env from project root
config({ path: resolve(process.cwd(), '.env') });

// CLI argument parsing
const { values: args } = parseArgs({
  options: {
    type: {
      type: 'string',
      short: 't',
    },
    name: {
      type: 'string',
      short: 'n',
    },
    description: {
      type: 'string',
      short: 'd',
    },
    ens: {
      type: 'string',
      short: 'e',
    },
    'worker-url': {
      type: 'string',
      short: 'w',
    },
    'set-ens': {
      type: 'boolean',
      default: false,
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
Register Canonical Agent - ERC-8004 Registration CLI

Usage:
  npx tsx scripts/register-canonical-agent.ts --type <type> [options]

Required:
  --type, -t <type>       Agent type: treasury | strategy

Options:
  --name, -n <name>       Agent name (overrides default)
  --description, -d <desc> Agent description (overrides default)
  --ens, -e <name>        ENS name (overrides env: TREASURY_AGENT_ENS)
  --worker-url, -w <url>  Worker URL (overrides env: TREASURY_AGENT_URL)
  --set-ens               Set ENS text record after registration
  --chain-id <id>         Chain ID (default: 11155111 Sepolia)
  --help, -h              Show this help message

Environment Variables (.env):
  DEPLOYER_PRIVATE_KEY    Signing key for registration (required)
  SEPOLIA_RPC_URL         RPC endpoint (required)
  TREASURY_AGENT_ENS      Default ENS for treasury agent
  TREASURY_AGENT_URL      Default worker URL for treasury agent

Examples:
  # Register treasury agent with defaults from .env
  npx tsx scripts/register-canonical-agent.ts --type treasury

  # Register strategy agent with custom values and set ENS
  npx tsx scripts/register-canonical-agent.ts \\
    --type strategy \\
    --ens strategy.oikonomos.eth \\
    --worker-url https://strategy.workers.dev \\
    --set-ens

  # Register with custom name and description
  npx tsx scripts/register-canonical-agent.ts \\
    --type treasury \\
    --name "My Treasury Agent" \\
    --description "Custom treasury management"
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

// Default agent configurations
const AGENT_DEFAULTS = {
  treasury: {
    name: 'Oikonomos Treasury Agent',
    description:
      'Automated treasury rebalancing for Uniswap v4 with policy-compliant execution',
    ensEnvKey: 'TREASURY_AGENT_ENS',
    urlEnvKey: 'TREASURY_AGENT_URL',
  },
  strategy: {
    name: 'Oikonomos Strategy Agent',
    description: 'DeFi strategy execution with reputation-tracked performance',
    ensEnvKey: 'STRATEGY_AGENT_ENS',
    urlEnvKey: 'STRATEGY_AGENT_URL',
  },
} as const;

type AgentType = keyof typeof AGENT_DEFAULTS;

async function validateEndpoints(
  client: PublicClient,
  workerUrl: string,
  ensName: string
): Promise<void> {
  console.log('\n--- Validating Endpoints ---\n');

  // Validate worker URL format
  const urlResult = validateEndpointFormat(workerUrl);
  if (!urlResult.valid) {
    console.log(`  Worker URL: ${urlResult.error}`);
  } else if (urlResult.warning) {
    console.log(`  Worker URL: ${urlResult.warning}`);
  } else {
    console.log(`  Worker URL: Valid`);
  }

  // Validate A2A endpoint
  const a2aUrl = `${workerUrl}/.well-known/agent-card.json`;
  console.log(`  A2A Endpoint: Checking ${a2aUrl}...`);
  const a2aResult = await validateA2AEndpoint(workerUrl);
  if (!a2aResult.valid && a2aResult.error) {
    console.log(`    ${a2aResult.error}`);
  } else if (a2aResult.warning) {
    console.log(`    Warning: ${a2aResult.warning}`);
  } else {
    console.log(`    Valid`);
  }

  // Validate ENS name
  console.log(`  ENS Name: Checking ${ensName}...`);
  const ensResult = await validateENSName(client, ensName);
  if (!ensResult.valid && ensResult.error) {
    console.log(`    ${ensResult.error}`);
  } else if (ensResult.warning) {
    console.log(`    Warning: ${ensResult.warning}`);
  } else {
    console.log(`    Valid - resolves on-chain`);
  }

  console.log('\n  Note: Validation warnings are non-blocking.');
  console.log('  Endpoints can be set up after registration.\n');
}

async function main(): Promise<void> {
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Validate required arguments
  const agentType = args.type as AgentType | undefined;
  if (!agentType || !['treasury', 'strategy'].includes(agentType)) {
    console.error('Error: --type is required. Must be "treasury" or "strategy".');
    console.error('Run with --help for usage information.');
    process.exit(1);
  }

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

  // Get agent configuration
  const defaults = AGENT_DEFAULTS[agentType];
  const ensName = args.ens || process.env[defaults.ensEnvKey];
  const workerUrl = args['worker-url'] || process.env[defaults.urlEnvKey];
  const agentName = args.name || defaults.name;
  const agentDescription = args.description || defaults.description;
  const chainId = parseInt(args['chain-id'] || '11155111', 10);
  const setEns = args['set-ens'] || false;

  if (!ensName) {
    console.error(`Error: ENS name required. Use --ens or set ${defaults.ensEnvKey} in .env`);
    process.exit(1);
  }

  if (!workerUrl) {
    console.error(`Error: Worker URL required. Use --worker-url or set ${defaults.urlEnvKey} in .env`);
    process.exit(1);
  }

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
  console.log('  ERC-8004 Agent Registration');
  console.log('========================================\n');

  console.log('Configuration:');
  console.log(`  Type:        ${agentType}`);
  console.log(`  Name:        ${agentName}`);
  console.log(`  Description: ${agentDescription}`);
  console.log(`  ENS:         ${ensName}`);
  console.log(`  Worker URL:  ${workerUrl}`);
  console.log(`  Chain:       ${chain.name} (${chainId})`);
  console.log(`  Account:     ${account.address}`);
  console.log(`  Set ENS:     ${setEns ? 'Yes' : 'No'}`);

  // Validate endpoints
  await validateEndpoints(publicClient, workerUrl, ensName);

  // Build registration
  console.log('--- Building Registration ---\n');

  let agentURI: string;
  if (agentType === 'treasury') {
    agentURI = buildTreasuryAgentRegistration(ensName, workerUrl);
  } else {
    agentURI = buildStrategyAgentRegistration(ensName, workerUrl);
  }

  // Parse and display the registration JSON
  const base64 = agentURI.replace('data:application/json;base64,', '');
  const registrationJson = JSON.parse(atob(base64)) as ERC8004Registration;

  console.log('Registration JSON:');
  console.log(JSON.stringify(registrationJson, null, 2));

  // Register agent
  console.log('\n--- Registering Agent ---\n');

  try {
    const { hash } = await registerAgent(walletClient, registrationJson);
    console.log(`  Transaction submitted: ${hash}`);
    console.log(`  Waiting for confirmation...`);

    // Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'reverted') {
      console.error('\n  Transaction reverted!');
      process.exit(1);
    }

    console.log(`  Transaction confirmed in block ${receipt.blockNumber}`);

    // Extract agentId from logs
    let agentId: bigint | null = null;
    for (const log of receipt.logs) {
      agentId = extractAgentIdFromTransferLog(log);
      if (agentId !== null) break;
    }

    if (agentId === null) {
      console.error('\n  Warning: Could not extract agentId from logs');
    } else {
      console.log(`\n  Agent ID: ${agentId}`);

      const { identity } = getERC8004Addresses(chainId);
      const scanUrl = `https://8004scan.io/agent/${chainId}/${identity}/${agentId}`;
      console.log(`\n  View on 8004scan.io:`);
      console.log(`  ${scanUrl}`);

      // Set ENS text record if requested
      if (setEns && agentId !== null) {
        console.log('\n--- Setting ENS Text Record ---\n');
        console.log(`  Setting agent:erc8004 for ${ensName}...`);

        try {
          const ensHash = await setAgentERC8004Record(
            walletClient,
            ensName,
            chainId,
            agentId
          );

          console.log(`  Transaction submitted: ${ensHash}`);
          console.log(`  Waiting for confirmation...`);

          const ensReceipt = await publicClient.waitForTransactionReceipt({
            hash: ensHash,
          });

          if (ensReceipt.status === 'reverted') {
            console.error('\n  ENS transaction reverted!');
          } else {
            console.log(`  ENS text record set successfully!`);
          }
        } catch (err) {
          const error = err as Error;
          console.error(`\n  Failed to set ENS record: ${error.message}`);
          console.log('  You may need to set the ENS text record manually.');
          console.log(`  Key: agent:erc8004`);
          console.log(`  Value: eip155:${chainId}:${identity}:${agentId}`);
        }
      }
    }

    console.log('\n========================================');
    console.log('  Registration Complete!');
    console.log('========================================\n');
  } catch (err) {
    const error = err as Error;
    console.error(`\nRegistration failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

/**
 * Register agents on the ERC-8004 Identity Registry
 *
 * Usage:
 *   npx tsx scripts/register-erc8004.ts treasury
 *   npx tsx scripts/register-erc8004.ts strategy
 *   npx tsx scripts/register-erc8004.ts --check <tokenId>
 */
import { createPublicClient, createWalletClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
  ERC8004_REGISTRY,
  ERC8004_REGISTRY_ABI,
  buildAgentMetadata,
  encodeAgentURI,
  decodeAgentURI,
} from '../src/a2a/erc8004';

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';

if (!PRIVATE_KEY) {
  console.error('Error: PRIVATE_KEY environment variable required');
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
console.log('Registrar wallet:', account.address);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(RPC_URL),
});

// Agent configurations
const AGENTS = {
  treasury: {
    name: 'Oikonomos Treasury Agent',
    description: 'Automated stablecoin treasury rebalancing with policy enforcement',
    a2aUrl: 'https://treasury-agent.estmcmxci.workers.dev/.well-known/agent-card.json',
    ens: 'treasury.oikonomos.eth',
    webUrl: 'https://oikonomos.app',
  },
  strategy: {
    name: 'Oikonomos Routing Strategy',
    description: 'Optimized swap routing for Uniswap v4 with MEV protection',
    a2aUrl: 'https://strategy-agent.estmcmxci.workers.dev/.well-known/agent-card.json',
    ens: 'strategy.oikonomos.eth',
    webUrl: 'https://oikonomos.app',
  },
};

async function registerAgent(agentType: 'treasury' | 'strategy') {
  const config = AGENTS[agentType];
  console.log(`\nRegistering ${agentType} agent...`);
  console.log('Name:', config.name);

  // Build ERC-8004 metadata
  const metadata = buildAgentMetadata({
    name: config.name,
    description: config.description,
    a2aUrl: config.a2aUrl,
    ens: config.ens,
    webUrl: config.webUrl,
    active: true,
    x402Support: false,
  });

  console.log('\nMetadata:', JSON.stringify(metadata, null, 2));

  // Encode as data URI
  const agentURI = encodeAgentURI(metadata);
  console.log('\nAgent URI length:', agentURI.length, 'bytes');

  // Simulate the registration first
  console.log('\nSimulating registration...');
  try {
    const { result } = await publicClient.simulateContract({
      address: ERC8004_REGISTRY,
      abi: ERC8004_REGISTRY_ABI,
      functionName: 'register',
      args: [agentURI],
      account: account.address,
    });
    console.log('Simulation successful, expected tokenId:', result.toString());
  } catch (error) {
    console.error('Simulation failed:', error);
    throw error;
  }

  // Execute the registration
  console.log('\nSubmitting registration transaction...');
  const hash = await walletClient.writeContract({
    address: ERC8004_REGISTRY,
    abi: ERC8004_REGISTRY_ABI,
    functionName: 'register',
    args: [agentURI],
  });

  console.log('Transaction hash:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Confirmed in block:', receipt.blockNumber);
  console.log('Gas used:', receipt.gasUsed.toString());

  // Parse logs to find tokenId
  // The Transfer event from ERC-721 will have the tokenId
  console.log('\nRegistration complete!');
  console.log(`View on registry: https://sepolia.etherscan.io/tx/${hash}`);

  return hash;
}

async function checkRegistration(tokenId: bigint) {
  console.log(`\nChecking registration for tokenId: ${tokenId}`);

  try {
    // Get owner
    const owner = await publicClient.readContract({
      address: ERC8004_REGISTRY,
      abi: ERC8004_REGISTRY_ABI,
      functionName: 'ownerOf',
      args: [tokenId],
    }) as Address;
    console.log('Owner:', owner);

    // Get tokenURI
    const tokenURI = await publicClient.readContract({
      address: ERC8004_REGISTRY,
      abi: ERC8004_REGISTRY_ABI,
      functionName: 'tokenURI',
      args: [tokenId],
    }) as string;
    console.log('Token URI length:', tokenURI.length);

    // Decode metadata
    const metadata = decodeAgentURI(tokenURI);
    if (metadata) {
      console.log('\nDecoded metadata:');
      console.log(JSON.stringify(metadata, null, 2));
    } else {
      console.log('Token URI:', tokenURI.substring(0, 100) + '...');
    }
  } catch (error) {
    console.error('Error checking registration:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npx tsx scripts/register-erc8004.ts treasury');
    console.log('  npx tsx scripts/register-erc8004.ts strategy');
    console.log('  npx tsx scripts/register-erc8004.ts --check <tokenId>');
    process.exit(1);
  }

  if (args[0] === '--check' && args[1]) {
    await checkRegistration(BigInt(args[1]));
  } else if (args[0] === 'treasury' || args[0] === 'strategy') {
    await registerAgent(args[0]);
  } else {
    console.error('Unknown command:', args[0]);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

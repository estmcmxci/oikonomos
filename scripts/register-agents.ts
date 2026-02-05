/**
 * Register Dogfood Agents in ERC-8004
 *
 * Registers the 4 dogfood agents (alpha, beta, gamma, delta) in the
 * ERC-8004 IdentityRegistry on Sepolia using viem.
 *
 * Usage:
 *   npx tsx scripts/register-agents.ts
 *
 * Required Environment Variables:
 *   DEPLOYER_PRIVATE_KEY - Private key for registration
 *   SEPOLIA_RPC_URL - RPC URL for Sepolia
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  decodeEventLog,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import 'dotenv/config';

// ERC-8004 IdentityRegistry on Sepolia
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const;

// Minimal ABI for registration
const IdentityRegistryABI = [
  {
    type: 'function',
    name: 'register',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
] as const;

// Agent configuration
const AGENTS = [
  {
    name: 'Alpha',
    label: 'alpha',
    platform: 'moltbook',
    addressKey: 'AGENT_ALPHA_ADDRESS',
    privateKey: 'AGENT_ALPHA_PRIVATE_KEY',
  },
  {
    name: 'Beta',
    label: 'beta',
    platform: '4claw',
    addressKey: 'AGENT_BETA_ADDRESS',
    privateKey: 'AGENT_BETA_PRIVATE_KEY',
  },
  {
    name: 'Gamma',
    label: 'gamma',
    platform: 'clawstr',
    addressKey: 'AGENT_GAMMA_ADDRESS',
    privateKey: 'AGENT_GAMMA_PRIVATE_KEY',
  },
  {
    name: 'Delta',
    label: 'delta',
    platform: 'moltx',
    addressKey: 'AGENT_DELTA_ADDRESS',
    privateKey: 'AGENT_DELTA_PRIVATE_KEY',
  },
] as const;

async function main() {
  console.log('🚀 Registering Dogfood Agents in ERC-8004\n');
  console.log('═'.repeat(60));

  const rpcUrl = process.env.SEPOLIA_RPC_URL;

  if (!rpcUrl) {
    console.error('❌ SEPOLIA_RPC_URL environment variable required');
    process.exit(1);
  }

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  console.log('\n📦 Registering agents...\n');

  const results: { name: string; agentId: string; wallet: string }[] = [];

  for (const agent of AGENTS) {
    const wallet = process.env[agent.addressKey] as Address;
    const privateKey = process.env[agent.privateKey];

    if (!wallet || !privateKey) {
      console.error(`❌ ${agent.addressKey} or ${agent.privateKey} not found`);
      continue;
    }

    console.log(`\n📦 ${agent.name} Agent (${agent.label}.oikonomos.eth)`);
    console.log('-'.repeat(40));
    console.log(`   Wallet: ${wallet}`);
    console.log(`   Platform: ${agent.platform}`);

    try {
      // Create wallet client for this agent
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(rpcUrl),
      });

      // Create a simple agent URI (data URI with JSON)
      const agentData = {
        name: `${agent.name} Strategy Agent`,
        description: `Oikonomos meta-treasury strategy agent for ${agent.platform}. Manages fee claiming and policy execution for Clawnch-launched tokens.`,
        a2a: `https://meta-treasury-provider.estmcmxci.workers.dev/agents/${agent.label}`,
      };
      const agentURI = `data:application/json,${encodeURIComponent(JSON.stringify(agentData))}`;

      // Register the agent
      console.log('   Registering in ERC-8004...');
      const hash = await walletClient.writeContract({
        address: IDENTITY_REGISTRY,
        abi: IdentityRegistryABI,
        functionName: 'register',
        args: [agentURI],
      });

      console.log(`   ✓ TX: ${hash}`);

      // Wait for receipt and extract agent ID
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Find Transfer event to get the agent ID (tokenId)
      let agentId: string | undefined;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: IdentityRegistryABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'Transfer') {
            agentId = (decoded.args as { tokenId: bigint }).tokenId.toString();
            break;
          }
        } catch {
          // Not this event
        }
      }

      if (agentId) {
        console.log(`   ✓ Agent ID: ${agentId}`);
        results.push({ name: agent.name, agentId, wallet });
      } else {
        console.log('   ⚠ Could not extract agent ID from receipt');
      }
    } catch (error) {
      console.error(`   ❌ Failed: ${(error as Error).message}`);
    }
  }

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 REGISTRATION SUMMARY\n');

  if (results.length > 0) {
    console.log('Registered Agents:');
    for (const r of results) {
      console.log(`  ${r.name}: Agent ID ${r.agentId} (${r.wallet.slice(0, 10)}...)`);
    }

    console.log('\n📝 Add to .env:');
    for (const r of results) {
      console.log(`AGENT_${r.name.toUpperCase()}_ID=${r.agentId}`);
    }
  }

  console.log('\n═'.repeat(60));
  console.log('📋 NEXT STEPS\n');
  console.log('1. Add agent IDs to .env file');
  console.log('2. Register ENS subnames with:');
  console.log('   npx tsx packages/ens-cli/src/index.ts subname register <label> \\');
  console.log('     --owner <wallet> --agent-id <id> --a2a-url <url>');
  console.log('\n✨ Agent registration complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

/**
 * Dogfood Setup Script
 *
 * Sets up test agents for demonstrating the meta-treasury manager platform.
 * Creates 4 agent wallets, funds them, and prepares for token launching.
 *
 * Usage:
 *   npx tsx scripts/dogfood-setup.ts
 *
 * Required Environment Variables:
 *   DEPLOYER_KEY - Private key of the deployer wallet (must have ETH)
 *   BASE_SEPOLIA_RPC_URL - RPC URL for Base Sepolia
 *
 * @see PIVOT_SUMMARY.md - Dogfooding Plan section
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  type Address,
  type PrivateKeyAccount,
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { keccak256, toBytes, encodePacked } from 'viem';

// Agent configuration
const AGENTS = [
  { name: 'alpha', platform: 'moltbook', index: 0 },
  { name: 'beta', platform: '4claw', index: 1 },
  { name: 'gamma', platform: 'clawstr', index: 2 },
  { name: 'delta', platform: 'moltx', index: 3 },
] as const;

// Funding amount per agent (0.05 ETH)
const FUNDING_AMOUNT = parseEther('0.05');

// Derive deterministic wallet from deployer key and index
function deriveWallet(deployerKey: string, index: number): PrivateKeyAccount {
  // Create a deterministic private key by hashing deployer key + index
  const derivedKey = keccak256(
    encodePacked(['bytes32', 'uint256'], [deployerKey as `0x${string}`, BigInt(index)])
  );
  return privateKeyToAccount(derivedKey);
}

interface AgentSetupResult {
  name: string;
  platform: string;
  wallet: Address;
  privateKey: string;
  ens: string;
  funded: boolean;
  balance: string;
}

async function main() {
  console.log('🚀 Oikonomos Dogfood Setup\n');
  console.log('═'.repeat(60));

  // Load environment variables
  const deployerKey = process.env.DEPLOYER_KEY;
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;

  if (!deployerKey) {
    console.error('❌ DEPLOYER_KEY environment variable required');
    process.exit(1);
  }

  if (!rpcUrl) {
    console.error('❌ BASE_SEPOLIA_RPC_URL environment variable required');
    process.exit(1);
  }

  // Setup clients
  const deployer = privateKeyToAccount(deployerKey as `0x${string}`);
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    account: deployer,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  console.log(`\n📦 Deployer: ${deployer.address}`);

  // Check deployer balance
  const deployerBalance = await publicClient.getBalance({
    address: deployer.address,
  });
  console.log(`💰 Deployer Balance: ${formatEther(deployerBalance)} ETH\n`);

  const requiredBalance = FUNDING_AMOUNT * BigInt(AGENTS.length);
  if (deployerBalance < requiredBalance) {
    console.error(
      `❌ Insufficient balance. Need ${formatEther(requiredBalance)} ETH to fund all agents.`
    );
    process.exit(1);
  }

  console.log('═'.repeat(60));
  console.log('Setting up agents...\n');

  const results: AgentSetupResult[] = [];

  for (const agent of AGENTS) {
    console.log(`\n📦 ${agent.name}.agents.oikonomos.eth`);
    console.log('-'.repeat(40));

    // Derive wallet
    const agentAccount = deriveWallet(deployerKey, agent.index);
    console.log(`   Wallet: ${agentAccount.address}`);

    // Check current balance
    const currentBalance = await publicClient.getBalance({
      address: agentAccount.address,
    });

    let funded = false;
    if (currentBalance >= FUNDING_AMOUNT) {
      console.log(`   ✓ Already funded: ${formatEther(currentBalance)} ETH`);
      funded = true;
    } else {
      // Fund the wallet
      console.log(`   💰 Funding wallet with ${formatEther(FUNDING_AMOUNT)} ETH...`);
      try {
        const hash = await walletClient.sendTransaction({
          to: agentAccount.address,
          value: FUNDING_AMOUNT,
        });
        console.log(`   ✓ Tx: ${hash}`);

        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash });
        funded = true;
      } catch (error) {
        console.error(`   ❌ Failed to fund: ${error}`);
      }
    }

    // Get final balance
    const finalBalance = await publicClient.getBalance({
      address: agentAccount.address,
    });

    results.push({
      name: agent.name,
      platform: agent.platform,
      wallet: agentAccount.address,
      privateKey: deriveWallet(deployerKey, agent.index).address, // Don't log actual key
      ens: `${agent.name}.agents.oikonomos.eth`,
      funded,
      balance: formatEther(finalBalance),
    });
  }

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY\n');

  console.log('Agents:');
  console.log('┌' + '─'.repeat(58) + '┐');
  console.log(
    '│ ' +
      'Name'.padEnd(8) +
      '│ ' +
      'Platform'.padEnd(10) +
      '│ ' +
      'Wallet'.padEnd(22) +
      '│ ' +
      'Balance'.padEnd(12) +
      '│'
  );
  console.log('├' + '─'.repeat(58) + '┤');

  for (const result of results) {
    const walletShort = `${result.wallet.slice(0, 8)}...${result.wallet.slice(-6)}`;
    const status = result.funded ? '✓' : '✗';
    console.log(
      '│ ' +
        result.name.padEnd(8) +
        '│ ' +
        result.platform.padEnd(10) +
        '│ ' +
        walletShort.padEnd(22) +
        '│ ' +
        `${result.balance} ETH`.padEnd(12) +
        '│'
    );
  }
  console.log('└' + '─'.repeat(58) + '┘');

  // Output for environment file
  console.log('\n' + '═'.repeat(60));
  console.log('📝 AGENT WALLETS (for .env)\n');

  for (const agent of AGENTS) {
    const agentAccount = deriveWallet(deployerKey, agent.index);
    console.log(`# ${agent.name}.agents.oikonomos.eth`);
    console.log(`AGENT_${agent.name.toUpperCase()}_ADDRESS=${agentAccount.address}`);
    console.log('');
  }

  // Next steps
  console.log('═'.repeat(60));
  console.log('📋 NEXT STEPS\n');
  console.log('1. Register ENS subnames for each agent:');
  console.log('   - alpha.agents.oikonomos.eth');
  console.log('   - beta.agents.oikonomos.eth');
  console.log('   - gamma.agents.oikonomos.eth');
  console.log('   - delta.agents.oikonomos.eth');
  console.log('');
  console.log('2. Launch tokens via Clawnch (requires Moltbook API key):');
  console.log('   - $ALPHA on Moltbook');
  console.log('   - $BETA on 4claw');
  console.log('   - $GAMMA on Clawstr');
  console.log('   - $DELTA on Moltx');
  console.log('');
  console.log('3. Execute test trades to generate fees');
  console.log('');
  console.log('4. Open dashboard to see aggregate portfolio');
  console.log('');
  console.log('✨ Dogfood setup complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

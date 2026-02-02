/**
 * Configure a test policy for the treasury agent
 *
 * Usage:
 *   npx tsx scripts/configure-policy.ts
 *   npx tsx scripts/configure-policy.ts --check
 */
import type { Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Policy, TokenAllocation } from '../src/policy/templates';

// Configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const TREASURY_AGENT_URL = process.env.TREASURY_AGENT_URL || 'https://oikonomos-treasury-agent.estmcmxci.workers.dev';

if (!PRIVATE_KEY) {
  console.error('Error: PRIVATE_KEY environment variable required');
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
console.log('Wallet:', account.address);
console.log('Treasury Agent:', TREASURY_AGENT_URL);

// Sepolia token addresses (Aave test tokens)
const TOKENS = {
  USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as Address,
  DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357' as Address,
  WETH: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c' as Address,
};

// Test Policy: 50/50 USDC/DAI stablecoin rebalance
const TEST_POLICY: Policy = {
  type: 'stablecoin-rebalance',
  tokens: [
    {
      address: TOKENS.USDC,
      symbol: 'USDC',
      targetPercentage: 50,
      decimals: 6,
    },
    {
      address: TOKENS.DAI,
      symbol: 'DAI',
      targetPercentage: 50,
      decimals: 18,
    },
  ],
  driftThreshold: 5,      // 5% drift triggers rebalance
  maxSlippageBps: 100,    // 1% max slippage
  maxDailyUsd: 10000,     // $10k daily limit
};

async function configurePolicy() {
  console.log('\n=== Configuring Test Policy ===\n');

  console.log('Policy:');
  console.log('  Type:', TEST_POLICY.type);
  console.log('  Tokens:');
  for (const token of TEST_POLICY.tokens) {
    console.log(`    - ${token.symbol}: ${token.targetPercentage}% target`);
  }
  console.log('  Drift Threshold:', TEST_POLICY.driftThreshold + '%');
  console.log('  Max Slippage:', TEST_POLICY.maxSlippageBps / 100 + '%');
  console.log('  Max Daily USD:', '$' + TEST_POLICY.maxDailyUsd?.toLocaleString());

  console.log('\nSubmitting policy to treasury agent...');

  const response = await fetch(`${TREASURY_AGENT_URL}/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress: account.address,
      policy: TEST_POLICY,
    }),
  });

  const result = await response.json() as {
    success: boolean;
    policyId?: string;
    error?: string;
    validationErrors?: string[];
  };

  if (response.ok && result.success) {
    console.log('\n✅ Policy configured successfully!');
    console.log('  Policy ID:', result.policyId);
    console.log('\nThe treasury agent will now:');
    console.log('  1. Check your portfolio every 5 minutes');
    console.log('  2. Compare against 50/50 USDC/DAI target');
    console.log('  3. If drift > 5%, attempt auto-rebalance');
  } else {
    console.error('\n❌ Policy configuration failed:', result.error);
    if (result.validationErrors) {
      console.error('Validation errors:', result.validationErrors);
    }
    process.exit(1);
  }
}

async function checkPortfolioVsPolicy() {
  console.log('\n=== Checking Portfolio vs Policy ===\n');

  // Fetch current portfolio
  const portfolioResponse = await fetch(`${TREASURY_AGENT_URL}/portfolio?address=${account.address}`);
  const portfolio = await portfolioResponse.json() as {
    tokens: Array<{
      symbol: string;
      balance: string;
      percentage: number;
    }>;
  };

  console.log('Current Portfolio:');
  for (const token of portfolio.tokens) {
    const target = TEST_POLICY.tokens.find(t => t.symbol === token.symbol);
    const drift = target ? Math.abs(token.percentage - target.targetPercentage) : 0;
    const driftStatus = drift > TEST_POLICY.driftThreshold ? '⚠️ DRIFT' : '✓';

    console.log(`  ${token.symbol}:`);
    console.log(`    Current: ${token.percentage.toFixed(2)}%`);
    if (target) {
      console.log(`    Target:  ${target.targetPercentage}%`);
      console.log(`    Drift:   ${drift.toFixed(2)}% ${driftStatus}`);
    }
  }

  // Calculate overall drift
  let totalDrift = 0;
  for (const policyToken of TEST_POLICY.tokens) {
    const portfolioToken = portfolio.tokens.find(t => t.symbol === policyToken.symbol);
    if (portfolioToken) {
      totalDrift += Math.abs(portfolioToken.percentage - policyToken.targetPercentage);
    }
  }

  console.log('\nSummary:');
  console.log(`  Total drift: ${(totalDrift / 2).toFixed(2)}%`);
  console.log(`  Threshold:   ${TEST_POLICY.driftThreshold}%`);

  if (totalDrift / 2 > TEST_POLICY.driftThreshold) {
    console.log('\n⚠️  Portfolio is OUT OF BALANCE');
    console.log('   Agent should trigger rebalance on next cron cycle');
  } else {
    console.log('\n✅ Portfolio is within acceptable drift');
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--check')) {
    await checkPortfolioVsPolicy();
  } else {
    await configurePolicy();
    console.log('\n--- Checking portfolio against new policy ---');
    await checkPortfolioVsPolicy();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

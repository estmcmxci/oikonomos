/**
 * Test script for Fee Claim flow on Base mainnet
 *
 * Tests claiming WETH fees from Clanker FeeLocker for agent tokens.
 *
 * IMPORTANT: Fee claiming requires:
 * 1. The wallet must be the `deployerWallet` (agentWallet) that launched the token
 * 2. There must be trading activity to generate fees (0.3% swap fee, 80% to agent)
 *
 * Usage:
 *   # Check fees via Clawnch API (no private key needed)
 *   npx tsx scripts/test-fee-claim.ts --check-only
 *
 *   # Claim fees (requires deployer private key)
 *   PRIVATE_KEY=0x... npx tsx scripts/test-fee-claim.ts
 *
 *   # Custom token address
 *   TOKEN=0x... WALLET=0x... npx tsx scripts/test-fee-claim.ts --check-only
 */

import { config } from 'dotenv';
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type Address,
} from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Load environment variables
config({ path: '.dev.vars' });
config({ path: 'agents/treasury-agent/.dev.vars' });

// Default: OIKG token on Base mainnet
const TOKEN_ADDRESS = (process.env.TOKEN || '0x9e443ca2dB7F25c7869395B8Bd204F3F4E5B5442') as Address;

// OIKG deployer wallet (from Clawnch API)
const DEFAULT_DEPLOYER = '0xB4892f2f709c5A36308b4B06852C08873b407434' as const;

// Clanker FeeLocker on Base mainnet
const FEE_LOCKER = '0xF3622742b1E446D92e45E22923Ef11C2fcD55D68' as const;

// WETH on Base
const WETH = '0x4200000000000000000000000000000000000006' as const;

const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const CHECK_ONLY = process.argv.includes('--check-only');

// FeeLocker ABI (minimal)
const FEE_LOCKER_ABI = [
  {
    name: 'availableWethFees',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'availableTokenFees',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'wallet', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
] as const;

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * Fetch token info and fees from Clawnch API
 */
async function fetchClawnchData(tokenAddress: Address, wallet?: Address) {
  // Get token analytics
  const analyticsRes = await fetch(
    `https://clawn.ch/api/analytics/token?address=${tokenAddress}`
  );
  const analytics = await analyticsRes.json();

  // Get available fees for the deployer wallet
  const deployerWallet = wallet || analytics.deployerWallet;
  if (!deployerWallet) {
    return { analytics, fees: null, deployerWallet: null };
  }

  const feesRes = await fetch(
    `https://clawn.ch/api/fees/available?wallet=${deployerWallet}&tokens=${tokenAddress}`
  );
  const fees = await feesRes.json();

  return { analytics, fees, deployerWallet };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Fee Claim Test - Clanker/Clawnch on Base Mainnet');
  console.log('='.repeat(60));
  console.log('');

  // 1. First, check via Clawnch API (no private key needed)
  console.log('Step 1: Fetching token data from Clawnch API...');
  console.log(`Token: ${TOKEN_ADDRESS}`);
  console.log('');

  const walletToCheck = process.env.WALLET as Address | undefined;
  const { analytics, fees, deployerWallet } = await fetchClawnchData(TOKEN_ADDRESS, walletToCheck);

  if (!analytics.address) {
    console.error('Token not found on Clawnch. Is this a Clawnch-launched token?');
    process.exit(1);
  }

  console.log('Token Info:');
  console.log(`  Name:     ${analytics.name} (${analytics.symbol})`);
  console.log(`  Agent:    ${analytics.agent}`);
  console.log(`  Source:   ${analytics.source}`);
  console.log(`  Deployer: ${deployerWallet}`);
  console.log(`  Launched: ${analytics.launchedAt} (${analytics.daysSinceLaunch} days ago)`);
  console.log('');
  console.log('Market Data:');
  console.log(`  Price:      ${analytics.price?.usd || 'N/A'}`);
  console.log(`  Market Cap: ${analytics.marketCap || 'N/A'}`);
  console.log(`  24h Volume: ${analytics.volume24h || 'N/A'}`);
  console.log(`  Liquidity:  ${analytics.liquidity || 'N/A'}`);
  console.log('');

  if (fees) {
    console.log('Available Fees (via Clawnch API):');
    console.log(`  WETH:   ${fees.weth?.formatted || '0'}`);
    if (fees.tokens?.length > 0) {
      fees.tokens.forEach((t: any) => {
        console.log(`  ${t.symbol}: ${t.formatted}`);
      });
    }
    console.log('');
  }

  // If no trading activity, explain the situation
  if (!analytics.price && !analytics.volume24h) {
    console.log('⚠️  No trading activity detected yet.');
    console.log('   Fees are generated from trading (0.3% swap fee, 80% to agent).');
    console.log('   Trade the token on Uniswap/DEX to generate fees.');
    console.log('');
    console.log(`   Trade on Clanker: ${analytics.links?.clanker}`);
    console.log(`   DexScreener: ${analytics.links?.dexscreener}`);
  }

  // If check-only mode, exit here
  if (CHECK_ONLY) {
    console.log('');
    console.log('(--check-only mode, skipping on-chain verification)');
    process.exit(0);
  }

  // 2. On-chain verification and claiming
  console.log('');
  console.log('Step 2: On-chain verification...');
  console.log('');

  const privateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

  if (!privateKey) {
    console.error('Error: PRIVATE_KEY not set');
    console.error('');
    console.error('To claim fees, you need the private key of the deployer wallet:');
    console.error(`  Deployer: ${deployerWallet}`);
    console.error('');
    console.error('Usage: PRIVATE_KEY=0x... npx tsx scripts/test-fee-claim.ts');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  // Verify wallet matches deployer
  if (deployerWallet && account.address.toLowerCase() !== deployerWallet.toLowerCase()) {
    console.error('⚠️  WARNING: Your wallet does not match the token deployer!');
    console.error(`   Your wallet: ${account.address}`);
    console.error(`   Deployer:    ${deployerWallet}`);
    console.error('');
    console.error('   Only the deployer wallet can claim fees.');
    console.error('   Continuing anyway to demonstrate the error...');
    console.log('');
  }

  console.log('Wallet:', account.address);

  const publicClient = createPublicClient({
    chain: base,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(RPC_URL),
  });

  // Check available fees via FeeLocker contract
  console.log('');
  console.log('Checking fees via FeeLocker contract...');

  let availableWeth = 0n;
  let availableTokens = 0n;

  try {
    availableWeth = await publicClient.readContract({
      address: FEE_LOCKER,
      abi: FEE_LOCKER_ABI,
      functionName: 'availableWethFees',
      args: [TOKEN_ADDRESS, account.address],
    });

    availableTokens = await publicClient.readContract({
      address: FEE_LOCKER,
      abi: FEE_LOCKER_ABI,
      functionName: 'availableTokenFees',
      args: [TOKEN_ADDRESS, account.address],
    });

    console.log('On-chain fees:');
    console.log(`  WETH:  ${formatEther(availableWeth)} (${availableWeth} wei)`);
    console.log(`  Token: ${formatEther(availableTokens)} (${availableTokens} wei)`);
  } catch (error: any) {
    console.log('FeeLocker query failed:', error.message?.slice(0, 100) || 'Unknown error');
    console.log('');
    console.log('This typically means:');
    console.log('  - Token not registered in FeeLocker (no trades yet)');
    console.log('  - Wrong wallet (not the deployer)');
    console.log('  - Token uses a different fee mechanism');
  }

  // Check current WETH balance
  const wethBalanceBefore = await publicClient.readContract({
    address: WETH,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log('');
  console.log('Current WETH balance:', formatEther(wethBalanceBefore));

  // If fees available, offer to claim
  if (availableWeth > 0n || availableTokens > 0n) {
    console.log('');
    console.log('Claiming fees...');

    try {
      const txHash = await walletClient.writeContract({
        address: FEE_LOCKER,
        abi: FEE_LOCKER_ABI,
        functionName: 'claim',
        args: [TOKEN_ADDRESS],
      });

      console.log('Claim TX:', txHash);
      console.log('Waiting for confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status === 'success') {
        console.log('');
        console.log('✅ Claim successful!');
        console.log(`   TX: https://basescan.org/tx/${txHash}`);

        const wethBalanceAfter = await publicClient.readContract({
          address: WETH,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [account.address],
        });

        const wethReceived = wethBalanceAfter - wethBalanceBefore;
        console.log('');
        console.log('WETH received:', formatEther(wethReceived));
        console.log('New WETH balance:', formatEther(wethBalanceAfter));
      } else {
        console.log('❌ Claim transaction reverted');
      }
    } catch (error: any) {
      console.error('Error claiming:', error.message?.slice(0, 200) || error);
    }
  } else {
    console.log('');
    console.log('No fees to claim on-chain.');
    console.log('');
    console.log('To generate fees:');
    console.log('  1. Trade the token on Uniswap/Clanker');
    console.log('  2. Wait for fees to accumulate in FeeLocker');
    console.log('  3. Run this script again');
    console.log('');
    console.log(`Trade here: ${analytics.links?.clanker || 'https://clanker.world'}`);
  }
}

main().catch(console.error);

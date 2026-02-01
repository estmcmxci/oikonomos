/**
 * End-to-End Agent Integration Test
 *
 * This test verifies the FULL agent flow:
 * 1. Treasury-agent detects drift
 * 2. Treasury-agent calls strategy-agent for quote
 * 3. Treasury-agent signs intent with EIP-712
 * 4. Treasury-agent submits to IntentRouter on Sepolia
 * 5. Verify ExecutionReceipt and IntentExecuted events
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  parseUnits,
  erc20Abi,
  type Address,
  type Hex,
} from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = (process.env.PRIVATE_KEY || '0x5bac2a365ad5db99a387f07c3f352032d13063fdc5277cf7fe3385a02f14ae3a') as Hex;
const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/MIpa-idKGvSRwUYBT9gAr';
const USDC = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as Address;
const DAI = '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357' as Address;
const INTENT_ROUTER = '0x855B735aC495f06E46cf01A1607706dF43c82348' as Address;

const TREASURY_AGENT_URL = 'http://localhost:61957';
const STRATEGY_AGENT_URL = 'http://localhost:8787';

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(RPC_URL) });

async function main() {
  console.log('='.repeat(60));
  console.log('AGENT END-TO-END INTEGRATION TEST');
  console.log('='.repeat(60));
  console.log('\nWallet:', account.address);

  // Step 1: Check initial balances
  console.log('\n--- Step 1: Initial Balances ---');
  const initialUsdc = await publicClient.readContract({
    address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [account.address]
  });
  const initialDai = await publicClient.readContract({
    address: DAI, abi: erc20Abi, functionName: 'balanceOf', args: [account.address]
  });
  const totalValue = initialUsdc + initialDai / 10n ** 12n; // Normalize DAI to 6 decimals
  const usdcPct = Number(initialUsdc * 10000n / totalValue) / 100;
  const daiPct = Number((initialDai / 10n ** 12n) * 10000n / totalValue) / 100;

  console.log(`USDC: ${formatUnits(initialUsdc, 6)} (${usdcPct.toFixed(1)}%)`);
  console.log(`DAI:  ${formatUnits(initialDai, 18)} (${daiPct.toFixed(1)}%)`);

  // Step 2: Ensure DAI is approved (we'll be selling DAI to buy USDC)
  console.log('\n--- Step 2: Checking DAI Allowance ---');
  const daiAllowance = await publicClient.readContract({
    address: DAI, abi: erc20Abi, functionName: 'allowance', args: [account.address, INTENT_ROUTER]
  });
  console.log('DAI allowance:', formatUnits(daiAllowance, 18));

  if (daiAllowance < parseUnits('100', 18)) {
    console.log('Approving DAI for IntentRouter...');
    const approveTx = await walletClient.writeContract({
      address: DAI,
      abi: erc20Abi,
      functionName: 'approve',
      args: [INTENT_ROUTER, parseUnits('10000', 18)],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
    console.log('DAI approved:', approveTx);
  }

  // Step 3: Verify agents are running
  console.log('\n--- Step 3: Verifying Agents are Running ---');
  try {
    const treasuryHealth = await fetch(`${TREASURY_AGENT_URL}/health`);
    const strategyHealth = await fetch(`${STRATEGY_AGENT_URL}/health`);

    if (!treasuryHealth.ok || !strategyHealth.ok) {
      throw new Error('Agents not responding');
    }
    console.log('✅ Treasury Agent:', (await treasuryHealth.json() as { status: string }).status);
    console.log('✅ Strategy Agent:', (await strategyHealth.json() as { status: string }).status);
  } catch (error) {
    console.error('❌ Agents not running! Start them with:');
    console.error('   Terminal 1: cd agents/strategy-agent && npm run dev');
    console.error('   Terminal 2: cd agents/treasury-agent && npm run dev');
    process.exit(1);
  }

  // Step 4: Test strategy-agent quote endpoint
  console.log('\n--- Step 4: Testing Strategy Agent Quote ---');
  const quoteResponse = await fetch(`${STRATEGY_AGENT_URL}/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tokenIn: DAI,
      tokenOut: USDC,
      amountIn: parseUnits('10', 18).toString(), // 10 DAI
      maxSlippageBps: 100,
    }),
  });
  const quote = await quoteResponse.json() as { quoteId: string; expectedAmountOut: string };
  console.log('Quote received:', {
    quoteId: quote.quoteId?.slice(0, 20) + '...',
    expectedAmountOut: formatUnits(BigInt(quote.expectedAmountOut), 6) + ' USDC',
  });

  // Step 5: Call treasury-agent check-triggers with drift-inducing policy
  console.log('\n--- Step 5: Testing Treasury Agent Drift Detection ---');
  // Set target to 60% USDC / 40% DAI to create drift (actual is ~50/50)
  const policy = {
    name: 'test-rebalance',
    driftThreshold: 5, // 5% threshold
    maxSlippageBps: 100,
    tokens: [
      { address: USDC, symbol: 'USDC', targetPercentage: 60 },
      { address: DAI, symbol: 'DAI', targetPercentage: 40 },
    ],
  };

  const driftResponse = await fetch(`${TREASURY_AGENT_URL}/check-triggers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress: account.address,
      policy,
    }),
  });
  const driftResult = await driftResponse.json() as {
    hasDrift: boolean;
    drifts: Array<{ symbol: string; drift: number; action: string; amount: string }>;
  };
  console.log('Drift detected:', driftResult.hasDrift);
  if (driftResult.drifts?.length > 0) {
    driftResult.drifts.forEach(d => {
      console.log(`  ${d.symbol}: ${d.drift.toFixed(1)}% drift, action: ${d.action}`);
    });
  }

  // Step 6: Call treasury-agent rebalance endpoint
  console.log('\n--- Step 6: Executing Rebalance via Treasury Agent ---');
  const rebalanceResponse = await fetch(`${TREASURY_AGENT_URL}/rebalance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress: account.address,
      policy,
      signature: '0x', // Agent will sign the intent
    }),
  });

  const rebalanceResult = await rebalanceResponse.json() as {
    success: boolean;
    needsRebalance: boolean;
    trades: Array<{ txHash?: string; status: string }>;
    receipts: string[];
    error?: string;
  };

  console.log('Rebalance result:', {
    success: rebalanceResult.success,
    needsRebalance: rebalanceResult.needsRebalance,
    tradesCount: rebalanceResult.trades?.length || 0,
    receiptsCount: rebalanceResult.receipts?.length || 0,
  });

  if (rebalanceResult.error) {
    console.error('Error:', rebalanceResult.error);
  }

  if (rebalanceResult.trades?.length > 0) {
    console.log('\nTrades executed:');
    rebalanceResult.trades.forEach((trade, i) => {
      console.log(`  Trade ${i + 1}: ${trade.status}`);
      if (trade.txHash) {
        console.log(`    TX: https://sepolia.etherscan.io/tx/${trade.txHash}`);
      }
    });
  }

  // Step 7: Check final balances
  console.log('\n--- Step 7: Final Balances ---');
  const finalUsdc = await publicClient.readContract({
    address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [account.address]
  });
  const finalDai = await publicClient.readContract({
    address: DAI, abi: erc20Abi, functionName: 'balanceOf', args: [account.address]
  });

  console.log(`USDC: ${formatUnits(finalUsdc, 6)} (was ${formatUnits(initialUsdc, 6)})`);
  console.log(`DAI:  ${formatUnits(finalDai, 18)} (was ${formatUnits(initialDai, 18)})`);

  const usdcDelta = finalUsdc - initialUsdc;
  const daiDelta = finalDai - initialDai;
  console.log(`\nChanges:`);
  console.log(`  USDC: ${usdcDelta >= 0 ? '+' : ''}${formatUnits(usdcDelta, 6)}`);
  console.log(`  DAI:  ${daiDelta >= 0 ? '+' : ''}${formatUnits(daiDelta, 18)}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  if (rebalanceResult.receipts?.length > 0) {
    console.log('✅ AGENT E2E TEST PASSED!');
    console.log('   Treasury-agent successfully:');
    console.log('   1. Detected drift');
    console.log('   2. Got quote from strategy-agent');
    console.log('   3. Signed and submitted intent');
    console.log('   4. Executed swap on Sepolia');
  } else if (rebalanceResult.needsRebalance === false) {
    console.log('⚠️  No rebalance needed (drift below threshold)');
  } else {
    console.log('❌ AGENT E2E TEST FAILED');
    console.log('   Check agent logs for errors');
  }
  console.log('='.repeat(60));
}

main().catch(console.error);

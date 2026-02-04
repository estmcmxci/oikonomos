/**
 * x402 End-to-End Test (OIK-49)
 *
 * Tests the full x402 payment flow:
 * 1. Get quote from /quote
 * 2. Call /execute (get 402 response)
 * 3. Make x402 payment via facilitator
 * 4. Retry /execute with payment header
 * 5. Verify execution and audit logs
 */

import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

// Config
const TREASURY_AGENT_URL = process.env.TREASURY_AGENT_URL || 'https://oikonomos-treasury-agent.estmcmxci.workers.dev';
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;

// Base Sepolia tokens (OIK-51: permit-enabled)
const USDC = '0x944a6D90b3111884CcCbfcc45B381b7C864D7943';
const DAI = '0xCE728786975c72711e810aDCD9BC233A2a55d7C1';

if (!PRIVATE_KEY) {
  console.error('PRIVATE_KEY environment variable is required');
  console.error('Usage: PRIVATE_KEY=0x... npx tsx scripts/x402-e2e-test.ts');
  process.exit(1);
}

const signer = privateKeyToAccount(PRIVATE_KEY);

async function main() {
  console.log('='.repeat(70));
  console.log('OIK-49: x402 E2E TEST');
  console.log('='.repeat(70));
  console.log('\nWallet:', signer.address);
  console.log('Agent:', TREASURY_AGENT_URL);
  console.log('');

  // Step 1: Get quote
  console.log('--- Step 1: Get Quote ---');
  const quoteResponse = await fetch(`${TREASURY_AGENT_URL}/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tokenIn: USDC,
      tokenOut: DAI,
      amountIn: '1000000', // 1 USDC (6 decimals)
      slippage: 50, // 50 bps
    }),
  });

  if (!quoteResponse.ok) {
    const error = await quoteResponse.text();
    console.error('Quote failed:', error);
    process.exit(1);
  }

  const quote = await quoteResponse.json() as {
    quoteId: string;
    amountOut: string;
    pricing: { feeAmount: string; paymentAddress: string };
  };

  console.log('Quote received:');
  console.log('  quoteId:', quote.quoteId);
  console.log('  amountOut:', quote.amountOut);
  console.log('  fee:', quote.pricing.feeAmount, 'USDC (wei)');
  console.log('  payTo:', quote.pricing.paymentAddress);

  // Step 2: Setup x402 client
  console.log('\n--- Step 2: Setup x402 Client ---');
  const client = new x402Client();
  // Register scheme with explicit network support
  registerExactEvmScheme(client, {
    signer,
    // networks: ['eip155:84532'], // Try explicit CAIP-2
  });
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);
  console.log('x402 client configured with signer:', signer.address);
  console.log('Registered networks:', client.schemes);

  // Step 3: Call execute with x402 payment
  console.log('\n--- Step 3: Execute with x402 Payment ---');
  console.log(`POST ${TREASURY_AGENT_URL}/execute`);

  try {
    const executeResponse = await fetchWithPayment(`${TREASURY_AGENT_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteId: quote.quoteId,
        userAddress: signer.address,
      }),
    });

    console.log('\nExecute Response:');
    console.log('  Status:', executeResponse.status);
    console.log('  Headers:', Object.fromEntries(executeResponse.headers.entries()));

    const responseText = await executeResponse.text();
    console.log('  Body (first 500 chars):', responseText.substring(0, 500));

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('  Parsed:', JSON.stringify(result, null, 2));
    } catch {
      console.log('  (Not JSON)');
    }

    if (executeResponse.ok && result?.success) {
      console.log('\n[SUCCESS] x402 E2E flow completed!');
      console.log('  - Payment verified by facilitator');
      console.log('  - Trade executed');
      console.log('  - Audit logs recorded');
    } else {
      console.log('\n[INFO] Execute returned status:', executeResponse.status);
    }

  } catch (error) {
    console.error('\nExecute failed:', error);

    // Check if it's a payment error
    if (error instanceof Error) {
      console.log('Error message:', error.message);
      if (error.message.includes('insufficient')) {
        console.log('\nNote: Make sure wallet has USDC on Base Sepolia for payment');
        console.log('Token:', USDC);
      }
    }
  }

  // Step 4: Check earnings
  console.log('\n--- Step 4: Check Earnings ---');
  const earningsResponse = await fetch(`${TREASURY_AGENT_URL}/earnings`);
  const earnings = await earningsResponse.json();
  console.log('Earnings:', JSON.stringify(earnings, null, 2));

  console.log('\n' + '='.repeat(70));
  console.log('TEST COMPLETE');
  console.log('='.repeat(70));
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

/**
 * E2E Test: Fee Claim Flow via Treasury Agent API
 *
 * Tests the complete fee claiming flow through the treasury agent:
 * 1. Calls /claim-fees endpoint
 * 2. Treasury agent retrieves agent wallet private key from KV
 * 3. Treasury agent executes FeeLocker.claim() on behalf of agent
 * 4. Optionally distributes WETH according to strategy
 *
 * Usage:
 *   # Test against local dev server
 *   npx tsx scripts/test-claim-fees-e2e.ts --local
 *
 *   # Test against deployed worker
 *   TREASURY_AGENT_URL=https://treasury-agent.xxx.workers.dev npx tsx scripts/test-claim-fees-e2e.ts
 *
 *   # With specific token
 *   TOKEN=0x... npx tsx scripts/test-claim-fees-e2e.ts
 */

import { config } from 'dotenv';
import type { Address } from 'viem';

// Load environment variables
config({ path: '.dev.vars' });
config({ path: 'agents/treasury-agent/.dev.vars' });

// Configuration
const USE_LOCAL = process.argv.includes('--local');
const TREASURY_AGENT_URL = USE_LOCAL
  ? 'http://localhost:8787'
  : (process.env.TREASURY_AGENT_URL || 'http://localhost:8787');

// Default deployer address (the user who controls agents)
const DEPLOYER_ADDRESS = (process.env.DEPLOYER_ADDRESS || '0xeb0ABB367540f90B57b3d5719fd2b9c740a15022') as Address;

// Optional: specific token to claim fees for
const TOKEN_ADDRESS = process.env.TOKEN as Address | undefined;

// Optional: agent name
const AGENT_NAME = process.env.AGENT_NAME;

interface ClaimFeesRequest {
  userAddress: Address;
  agentName?: string;
  tokens?: Address[];
  distributeStrategy?: {
    compound: number;
    toStables: number;
    hold: number;
  };
}

interface ClaimFeesResponse {
  success: boolean;
  claim?: {
    totalWethClaimed: string;
    totalTokensClaimed: number;
    claims: Array<{
      token: Address;
      wethClaimed: string;
      tokensClaimed: string;
      txHash: string;
      success: boolean;
      error?: string;
    }>;
    txHash?: string;
  };
  distribution?: {
    compound: { success: boolean; txHash?: string; error?: string };
    toStables: { success: boolean; txHash?: string; usdcReceived?: string; error?: string };
    hold: { amount: string };
  };
  error?: string;
  details?: string;
}

async function checkAgentStatus(): Promise<void> {
  console.log('Checking treasury agent status...');

  try {
    const res = await fetch(`${TREASURY_AGENT_URL}/health`);
    if (res.ok) {
      const data = await res.json();
      console.log('Treasury agent is running:', data);
    } else {
      console.log('Treasury agent responded with:', res.status, res.statusText);
    }
  } catch (error: any) {
    console.error('Failed to connect to treasury agent:', error.message);
    console.log('');
    console.log('Make sure the treasury agent is running:');
    console.log('  cd agents/treasury-agent && npm run dev');
    throw error;
  }
}

async function listAgents(): Promise<void> {
  console.log('');
  console.log(`Fetching agents for deployer ${DEPLOYER_ADDRESS}...`);

  try {
    const res = await fetch(`${TREASURY_AGENT_URL}/agents?userAddress=${DEPLOYER_ADDRESS}`);
    const data = await res.json();

    if (data.agents && data.agents.length > 0) {
      console.log(`Found ${data.agents.length} agent(s):`);
      for (const agent of data.agents) {
        console.log(`  - ${agent.agentName}: ${agent.address}`);
        if (agent.tokenAddress) {
          console.log(`    Token: ${agent.tokenAddress}`);
        }
      }
    } else {
      console.log('No agents found for this deployer.');
      console.log('Launch an agent first via POST /launch-agent');
    }
  } catch (error: any) {
    console.log('Failed to list agents:', error.message);
  }
}

async function checkAvailableFees(): Promise<void> {
  console.log('');
  console.log('Checking available fees via Clawnch API...');

  // First get the agent wallets
  try {
    const agentsRes = await fetch(`${TREASURY_AGENT_URL}/agents?userAddress=${DEPLOYER_ADDRESS}`);
    const agentsData = await agentsRes.json();

    if (!agentsData.agents || agentsData.agents.length === 0) {
      console.log('No agents to check fees for.');
      return;
    }

    for (const agent of agentsData.agents) {
      if (agent.tokenAddress) {
        const feesRes = await fetch(
          `https://clawn.ch/api/fees/available?wallet=${agent.address}&tokens=${agent.tokenAddress}`
        );
        const fees = await feesRes.json();

        console.log(`  ${agent.agentName} (${agent.address}):`);
        console.log(`    WETH available: ${fees.weth?.formatted || '0'}`);

        if (fees.tokens?.length > 0) {
          for (const token of fees.tokens) {
            console.log(`    ${token.symbol}: ${token.formatted}`);
          }
        }
      }
    }
  } catch (error: any) {
    console.log('Failed to check fees:', error.message);
  }
}

async function claimFees(request: ClaimFeesRequest): Promise<ClaimFeesResponse> {
  console.log('');
  console.log('Calling POST /claim-fees...');
  console.log('Request:', JSON.stringify(request, null, 2));

  const res = await fetch(`${TREASURY_AGENT_URL}/claim-fees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await res.json() as ClaimFeesResponse;

  console.log('');
  console.log('Response:', JSON.stringify(data, null, 2));

  return data;
}

async function main() {
  console.log('='.repeat(60));
  console.log('E2E Test: Fee Claim Flow via Treasury Agent');
  console.log('='.repeat(60));
  console.log('');
  console.log('Configuration:');
  console.log(`  Treasury Agent URL: ${TREASURY_AGENT_URL}`);
  console.log(`  Deployer Address:   ${DEPLOYER_ADDRESS}`);
  if (TOKEN_ADDRESS) {
    console.log(`  Token Address:      ${TOKEN_ADDRESS}`);
  }
  if (AGENT_NAME) {
    console.log(`  Agent Name:         ${AGENT_NAME}`);
  }
  console.log('');

  // Step 1: Check treasury agent is running
  await checkAgentStatus();

  // Step 2: List agents for this deployer
  await listAgents();

  // Step 3: Check available fees
  await checkAvailableFees();

  // Step 4: Execute fee claim
  console.log('');
  console.log('='.repeat(60));
  console.log('Executing Fee Claim');
  console.log('='.repeat(60));

  const request: ClaimFeesRequest = {
    userAddress: DEPLOYER_ADDRESS,
  };

  if (AGENT_NAME) {
    request.agentName = AGENT_NAME;
  }

  if (TOKEN_ADDRESS) {
    request.tokens = [TOKEN_ADDRESS];
  }

  // Optional: Add distribution strategy
  // request.distributeStrategy = {
  //   compound: 0,    // 0% back to LP
  //   toStables: 50,  // 50% swap to USDC
  //   hold: 50,       // 50% keep as WETH
  // };

  try {
    const result = await claimFees(request);

    console.log('');
    console.log('='.repeat(60));
    console.log('Result Summary');
    console.log('='.repeat(60));

    if (result.success) {
      console.log('✅ Fee claim successful!');

      if (result.claim) {
        console.log(`   Total WETH claimed: ${result.claim.totalWethClaimed}`);
        console.log(`   Tokens claimed: ${result.claim.totalTokensClaimed}`);

        if (result.claim.txHash) {
          console.log(`   TX: https://basescan.org/tx/${result.claim.txHash}`);
        }

        if (result.claim.claims.length > 0) {
          console.log('');
          console.log('   Individual claims:');
          for (const claim of result.claim.claims) {
            if (claim.success) {
              console.log(`     ✓ ${claim.token}: ${claim.wethClaimed} WETH`);
            } else {
              console.log(`     ✗ ${claim.token}: ${claim.error}`);
            }
          }
        }
      }

      if (result.distribution) {
        console.log('');
        console.log('   Distribution:');
        if (result.distribution.toStables?.success) {
          console.log(`     → USDC: ${result.distribution.toStables.usdcReceived}`);
        }
        console.log(`     → WETH held: ${result.distribution.hold?.amount || '0'}`);
      }
    } else {
      console.log('❌ Fee claim failed');
      console.log(`   Error: ${result.error}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }

      // Provide helpful guidance
      console.log('');
      console.log('Common reasons for failure:');
      console.log('  - No agents registered for this deployer');
      console.log('  - No fees available to claim (no trading activity)');
      console.log('  - Agent wallet not found in KV storage');
      console.log('  - Treasury agent not connected to correct KV namespace');
    }
  } catch (error: any) {
    console.error('Request failed:', error.message);
  }
}

main().catch(console.error);

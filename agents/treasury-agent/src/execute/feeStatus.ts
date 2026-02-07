// Fee Status & Distribution Settings Endpoints
// GET /fee-status — combined view of claimable fees, wallet balances, and distribution settings
// POST /update-distribution — change distribution mode/schedule for all user agents

import {
  createPublicClient,
  http,
  formatEther,
  type Address,
} from 'viem';
import { base } from 'viem/chains';
import type { Env } from '../index';
import {
  listUserAgentDetails,
  updateStoredAgent,
  computeNextDistributionTime,
  type StoredAgent,
  type DistributionSchedule,
} from '../launch/keychain';
import { getClaimHistory, type ClaimHistoryEntry } from './claimHistory';

// FeeLocker on Base
const FEE_LOCKER_ADDRESS = '0xF3622742b1E446D92e45E22923Ef11C2fcD55D68' as const;

const FeeLockerABI = [
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

const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as Address;

// ── Response types ──────────────────────────────────────────────────

interface AgentFeeInfo {
  agentName: string;
  agentType: string;
  agentAddress: Address;
  tokenSymbol?: string;
  tokenAddress?: Address;
  claimableWeth: string;
  walletWethBalance: string;
  distributionMode: 'auto' | 'manual';
  distributionSchedule?: DistributionSchedule;
  feeSplit: number;
  lastDistributionTime?: number;
  nextDistributionTime?: number;
}

interface FeeStatusResponse {
  agents: AgentFeeInfo[];
  totalClaimableWeth: string;
  totalWalletWeth: string;
  totalDistributed: string;
  recentClaims: ClaimHistoryEntry[];
  depositAddress?: Address;
  depositChainId: number;
}

// ── GET /fee-status ─────────────────────────────────────────────────

export async function handleFeeStatus(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const userAddress = url.searchParams.get('userAddress') as Address | null;

  if (!userAddress) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing userAddress query parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const agents = await listUserAgentDetails(env.TREASURY_KV, userAddress);

    if (agents.length === 0) {
      return new Response(
        JSON.stringify({
          agents: [],
          totalClaimableWeth: '0',
          totalWalletWeth: '0',
          totalDistributed: '0',
          recentClaims: [],
          depositChainId: parseInt(env.CHAIN_ID || '8453'),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const publicClient = createPublicClient({
      chain: base,
      transport: http(env.RPC_URL?.includes('base') ? env.RPC_URL : 'https://mainnet.base.org'),
    });

    let totalClaimableWei = 0n;
    let totalWalletWei = 0n;
    const agentInfos: AgentFeeInfo[] = [];

    // Find treasury agent for deposit address
    const treasuryAgent = agents.find(a => a.agentType === 'treasury');

    for (const agent of agents) {
      let claimableWeth = 0n;
      let walletWeth = 0n;

      // Read claimable WETH from FeeLocker for DeFi agents with tokens
      if (agent.tokenAddress) {
        try {
          claimableWeth = await publicClient.readContract({
            address: FEE_LOCKER_ADDRESS,
            abi: FeeLockerABI,
            functionName: 'availableWethFees',
            args: [agent.tokenAddress, agent.address],
          });
        } catch {
          // FeeLocker reverts for untraded tokens — treat as 0
        }
      }

      // Read WETH balance in agent wallet
      try {
        walletWeth = await publicClient.readContract({
          address: WETH_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [agent.address],
        });
      } catch {
        // Ignore read errors
      }

      totalClaimableWei += claimableWeth;
      totalWalletWei += walletWeth;

      agentInfos.push({
        agentName: agent.agentName,
        agentType: agent.agentType || 'unknown',
        agentAddress: agent.address,
        tokenSymbol: agent.tokenSymbol,
        tokenAddress: agent.tokenAddress,
        claimableWeth: formatEther(claimableWeth),
        walletWethBalance: formatEther(walletWeth),
        distributionMode: agent.distributionMode ?? 'auto',
        distributionSchedule: agent.distributionSchedule,
        feeSplit: agent.feeSplit ?? 85,
        lastDistributionTime: agent.lastDistributionTime,
        nextDistributionTime: agent.nextDistributionTime,
      });
    }

    // Load claim history to compute total distributed
    const recentClaims = await getClaimHistory(env.TREASURY_KV, userAddress, 10);
    const totalDistributed = recentClaims.reduce((sum, c) => {
      const val = parseFloat(c.deployerAmount || '0');
      return sum + val;
    }, 0);

    const response: FeeStatusResponse = {
      agents: agentInfos,
      totalClaimableWeth: formatEther(totalClaimableWei),
      totalWalletWeth: formatEther(totalWalletWei),
      totalDistributed: totalDistributed.toFixed(18),
      recentClaims,
      depositAddress: treasuryAgent?.address,
      depositChainId: parseInt(env.CHAIN_ID || '8453'),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[feeStatus] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// ── POST /update-distribution ───────────────────────────────────────

interface UpdateDistributionRequest {
  userAddress: Address;
  distributionMode: 'auto' | 'manual';
  distributionSchedule?: DistributionSchedule;
}

export async function handleUpdateDistribution(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: UpdateDistributionRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!body.userAddress || !body.distributionMode) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing userAddress or distributionMode' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!['auto', 'manual'].includes(body.distributionMode)) {
    return new Response(
      JSON.stringify({ success: false, error: 'distributionMode must be "auto" or "manual"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const agents = await listUserAgentDetails(env.TREASURY_KV, body.userAddress);

    if (agents.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No agents found for this user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = Date.now();
    let updatedCount = 0;

    for (const agent of agents) {
      const updates: Partial<StoredAgent> = {
        distributionMode: body.distributionMode,
      };

      if (body.distributionSchedule) {
        updates.distributionSchedule = body.distributionSchedule;
        // Compute next distribution time from now
        updates.nextDistributionTime = computeNextDistributionTime(
          agent.lastDistributionTime ?? now,
          body.distributionSchedule
        );
      }

      const ok = await updateStoredAgent(
        env.TREASURY_KV,
        body.userAddress,
        agent.agentName,
        updates
      );
      if (ok) updatedCount++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatedAgents: updatedCount,
        distributionMode: body.distributionMode,
        distributionSchedule: body.distributionSchedule,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[updateDistribution] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

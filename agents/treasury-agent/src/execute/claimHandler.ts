// Phase 3: Fee Claim Handler
// Orchestrates fee claiming and optional WETH distribution

import { parseEther, type Address } from 'viem';
import type { Env } from '../index';
import { executeClaimAll, getAgentPrivateKey, type ClaimAllResult } from './feeClaim';
import { distributeWeth, type DistributionResult } from './wethDistribution';
import { getAgentWallets, discoverAgentTokens } from '../suggestion/clawnch';
import type { UnifiedPolicy } from '../policy/templates';
import { saveLastClaimTime } from '../triggers/unified';
import { recordClaim } from './claimHistory';
import { listUserAgentDetails, updateStoredAgent, computeNextDistributionTime } from '../launch/keychain';

/**
 * Request body for /claim-fees endpoint
 */
export interface ClaimFeesRequest {
  /** User's wallet address */
  userAddress: Address;
  /** Name of the agent to claim fees for (optional - claims for all agents if not specified) */
  agentName?: string;
  /** Specific tokens to claim fees for (optional - discovers all if not specified) */
  tokens?: Address[];
  /** Distribution strategy after claiming (optional) */
  distributeStrategy?: {
    compound: number;
    toStables: number;
    hold: number;
  };
}

/**
 * Response from /claim-fees endpoint
 */
export interface ClaimFeesResponse {
  success: boolean;
  claim?: ClaimAllResult;
  distribution?: DistributionResult;
  error?: string;
}

/**
 * Handle POST /claim-fees requests
 *
 * Orchestrates the complete fee claiming flow:
 * 1. Get agent private key from KV
 * 2. Discover claimable tokens if not specified
 * 3. Execute batch claim from FeeLocker
 * 4. Optionally distribute claimed WETH according to strategy
 */
export async function handleClaimFees(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: ClaimFeesRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate required fields
  if (!body.userAddress) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required field: userAddress' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate distribution strategy if provided
  if (body.distributeStrategy) {
    const { compound, toStables, hold } = body.distributeStrategy;
    if (compound + toStables + hold !== 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Distribution strategy must sum to 100 (compound + toStables + hold)',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    const result = await executeClaimFeesFlow(env, body);

    // Record last claim time
    if (result.success && result.claim) {
      await saveLastClaimTime(env.TREASURY_KV, body.userAddress, Date.now());
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[claimHandler] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to execute fee claim',
        details: String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Execute the complete fee claiming flow
 */
async function executeClaimFeesFlow(
  env: Env,
  request: ClaimFeesRequest
): Promise<ClaimFeesResponse> {
  const { userAddress, agentName, tokens, distributeStrategy } = request;

  // 1. Get agent wallets
  const agentWallets = await getAgentWallets(env.TREASURY_KV, userAddress);

  if (agentWallets.length === 0) {
    return {
      success: false,
      error: 'No agent wallets found for user. Launch an agent first via /launch-agent.',
    };
  }

  // 2. Get agent private key
  // If agentName is specified, get that specific agent's key
  // Otherwise, use the first agent (primary agent)
  const targetAgentName = agentName || 'primary';
  const agentKey = await getAgentPrivateKey(env.TREASURY_KV, userAddress, targetAgentName);

  if (!agentKey) {
    // Try to get the key from the first registered agent
    const firstAgentKey = await getAgentPrivateKeyByWallet(env.TREASURY_KV, userAddress, agentWallets[0]);

    if (!firstAgentKey) {
      return {
        success: false,
        error: `No private key found for agent '${targetAgentName}'. Ensure the agent was properly created.`,
      };
    }

    // Use the first agent's key
    return await executeClaimWithKey(env, userAddress, firstAgentKey, agentWallets, tokens, distributeStrategy);
  }

  return await executeClaimWithKey(env, userAddress, agentKey, agentWallets, tokens, distributeStrategy);
}

/**
 * Execute claim with a specific agent key
 */
async function executeClaimWithKey(
  env: Env,
  userAddress: Address,
  agentKey: `0x${string}`,
  agentWallets: Address[],
  specifiedTokens?: Address[],
  distributeStrategy?: ClaimFeesRequest['distributeStrategy']
): Promise<ClaimFeesResponse> {
  // 1. Discover tokens to claim if not specified
  let tokensToCllaim: Address[];

  if (specifiedTokens && specifiedTokens.length > 0) {
    tokensToCllaim = specifiedTokens;
  } else {
    // Discover agent tokens from Clawnch
    const discoveredTokens = await discoverAgentTokens(env, userAddress, agentWallets);
    tokensToCllaim = discoveredTokens
      .filter(t => parseFloat(t.unclaimedWethFees) > 0)
      .map(t => t.address);

    if (tokensToCllaim.length === 0) {
      return {
        success: true,
        claim: {
          totalWethClaimed: '0',
          totalTokensClaimed: 0,
          claims: [],
        },
        error: 'No tokens with claimable fees found',
      };
    }
  }

  console.log(`[claimHandler] Claiming fees for ${tokensToCllaim.length} tokens`);

  // 2. Execute batch claim
  const claimResult = await executeClaimAll(env, agentKey, tokensToCllaim);

  // 3. Distribute WETH if strategy is specified and there's WETH to distribute
  let distributionResult: DistributionResult | undefined;

  if (distributeStrategy && claimResult.totalWethClaimed !== '0') {
    const wethWei = parseEther(claimResult.totalWethClaimed);

    console.log(`[claimHandler] Distributing ${claimResult.totalWethClaimed} WETH according to strategy`);

    distributionResult = await distributeWeth(env, agentKey, wethWei, distributeStrategy);
  }

  // Determine overall success
  const claimSuccess = claimResult.claims.some(c => c.success);
  const distributionSuccess = !distributionResult || distributionResult.toStables.success;

  // Record claim history
  if (claimSuccess && claimResult.totalWethClaimed !== '0') {
    const now = Date.now();
    for (const claim of claimResult.claims.filter(c => c.success && c.wethClaimed !== '0')) {
      await recordClaim(env.TREASURY_KV, userAddress, {
        agentName: 'manual',
        tokenAddress: claim.token,
        wethClaimed: claim.wethClaimed,
        deployerAmount: distributionResult?.totalDistributed ?? '0',
        serviceFee: '0',
        claimTxHash: claim.txHash !== ('0x0' as `0x${string}`) ? claim.txHash : undefined,
        distributionTxHash: distributionResult?.toStables.txHash,
        timestamp: now,
        mode: 'manual',
      });
    }
  }

  return {
    success: claimSuccess,
    claim: claimResult,
    distribution: distributionResult,
    error: !claimSuccess ? 'All claims failed' : undefined,
  };
}

/**
 * Get agent private key by wallet address (alternative lookup)
 */
async function getAgentPrivateKeyByWallet(
  kv: KVNamespace,
  userAddress: Address,
  agentWallet: Address
): Promise<`0x${string}` | null> {
  const key = `agentByWallet:${userAddress.toLowerCase()}:${agentWallet.toLowerCase()}`;
  const data = await kv.get(key);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data) as { encryptedKey?: string };
    return parsed.encryptedKey as `0x${string}` | undefined ?? null;
  } catch {
    return null;
  }
}

import { type Address, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Env } from '../index';
import { evaluate, listPolicyUsers, loadPolicy, type EvaluationResult } from './loop';
import { checkAllTriggers, type TriggerAction, type TriggerResult } from '../triggers/unified';
import { isUnifiedPolicy, type UnifiedPolicy, type Policy } from '../policy/templates';
import { executeClaimAll, getAgentPrivateKey, executeManagementOnChain } from '../execute/feeClaim';
import { distributeWeth, distributeToDeployer } from '../execute/wethDistribution';
import { getAgentWallets } from '../suggestion/clawnch';
import { getDelegationIndex, getStoredAgent, getAllTreasuryAgents, updateStoredAgent, isDueForDistribution, computeNextDistributionTime } from '../launch/keychain';
import { pollClawnchForToken } from '../launch/handler';
import { signAndSubmitDelegation } from '../launch/delegation';
import { recordClaim } from '../execute/claimHistory';

export interface DelegatedClaimResult {
  userAddress: string;
  agentName: string;
  agentAddress?: string;
  tokenAddress?: string;
  wethClaimed: string;
  deployerAmount?: string;
  serviceFee?: string;
  claimTxHash?: string;
  distributionTxHash?: string;
  managementTxHash?: string;
  success: boolean;
  error?: string;
}

export interface CronResult {
  timestamp: string;
  usersProcessed: number;
  delegatedClaims?: DelegatedClaimResult[];
  results: Array<{
    userAddress: string;
    result: EvaluationResult | UnifiedEvaluationResult;
  }>;
}

export interface UnifiedEvaluationResult {
  evaluated: boolean;
  skipped: boolean;
  skipReason?: string;
  triggerResult?: TriggerResult;
  executionResults?: Array<{
    action: TriggerAction['type'];
    success: boolean;
    details?: unknown;
    error?: string;
  }>;
}

/**
 * Handle scheduled cron trigger
 * Iterates through all users with active policies and evaluates each
 *
 * For unified policies, uses checkAllTriggers and executeTriggeredAction
 * For legacy policies, uses the existing evaluate function
 */
export async function handleScheduledTrigger(
  env: Env,
  kv: KVNamespace
): Promise<CronResult> {
  const timestamp = new Date().toISOString();
  console.log(`[cron] Scheduled trigger running at: ${timestamp}`);

  // Phase 0: Delegated fee claims (runs every cron tick, independent of policies)
  let delegatedClaims: DelegatedClaimResult[] = [];
  try {
    delegatedClaims = await handleDelegatedFeeClaims(env, kv);
    if (delegatedClaims.length > 0) {
      const successful = delegatedClaims.filter(c => c.success && c.wethClaimed !== '0');
      console.log(`[cron] Delegated claims: ${delegatedClaims.length} agents processed, ${successful.length} with fees`);
    }
  } catch (error) {
    console.error('[cron] Error in delegated fee claims:', error);
  }

  // Get all users with active policies
  const users = await listPolicyUsers(kv);
  console.log(`[cron] Found ${users.length} users with active policies`);

  const results: CronResult['results'] = [];

  // Evaluate each user
  for (const userAddress of users) {
    try {
      // Load the user's policy to determine handling approach
      const policy = await loadPolicy(kv, userAddress);

      if (!policy) {
        results.push({
          userAddress,
          result: {
            evaluated: false,
            skipped: true,
            skipReason: 'no_policy',
          },
        });
        continue;
      }

      // Handle unified policies with the new trigger system
      if (isUnifiedPolicy(policy)) {
        const result = await evaluateUnifiedPolicy(env, kv, userAddress, policy);
        results.push({ userAddress, result });

        if (result.triggerResult?.triggered) {
          console.log(`[cron] Triggers fired for ${userAddress}:`, result.triggerResult.reason);
        }
      } else {
        // Legacy policy handling
        const result = await evaluate(env, kv, userAddress, {
          trigger: 'cron',
        });

        results.push({ userAddress, result });

        if (result.evaluated && result.hasDrift) {
          console.log(`[cron] Drift detected for ${userAddress}`);
        }
      }
    } catch (error) {
      console.error(`[cron] Error evaluating ${userAddress}:`, error);
      results.push({
        userAddress,
        result: {
          evaluated: false,
          skipped: true,
          skipReason: 'error',
        } as UnifiedEvaluationResult,
      });
    }
  }

  console.log(`[cron] Completed processing ${users.length} users`);

  return {
    timestamp,
    usersProcessed: users.length,
    delegatedClaims: delegatedClaims.length > 0 ? delegatedClaims : undefined,
    results,
  };
}

/**
 * Evaluate a unified policy using the new trigger system
 */
async function evaluateUnifiedPolicy(
  env: Env,
  kv: KVNamespace,
  userAddress: Address,
  policy: UnifiedPolicy
): Promise<UnifiedEvaluationResult> {
  // Check all triggers
  const triggerResult = await checkAllTriggers(env, userAddress, policy);

  if (!triggerResult.triggered) {
    return {
      evaluated: true,
      skipped: false,
      triggerResult,
    };
  }

  // Execute triggered actions
  const executionResults: UnifiedEvaluationResult['executionResults'] = [];

  for (const action of triggerResult.actions) {
    try {
      const result = await executeTriggeredAction(env, kv, userAddress, action, policy);
      executionResults.push({
        action: action.type,
        success: result.success,
        details: result.details,
        error: result.error,
      });
    } catch (error) {
      console.error(`[cron] Error executing ${action.type} for ${userAddress}:`, error);
      executionResults.push({
        action: action.type,
        success: false,
        error: String(error),
      });
    }
  }

  return {
    evaluated: true,
    skipped: false,
    triggerResult,
    executionResults,
  };
}

/**
 * Execute a triggered action based on its type
 */
async function executeTriggeredAction(
  env: Env,
  kv: KVNamespace,
  userAddress: Address,
  action: TriggerAction,
  policy: UnifiedPolicy
): Promise<{ success: boolean; details?: unknown; error?: string }> {
  console.log(`[cron] Executing ${action.type} for ${userAddress}`);

  switch (action.type) {
    case 'claim-fees':
      return await executeClaimFeesAction(env, kv, userAddress, action, policy);

    case 'rebalance':
      // Rebalancing is handled by the existing drift system
      // For unified policies, we just log that it would trigger
      console.log(`[cron] Rebalance triggered for ${userAddress}:`, action.params);
      return {
        success: true,
        details: {
          message: 'Rebalance triggered - requires user action or session key',
          drifts: action.params.drifts,
        },
      };

    case 'exit-token':
      // Token exit is logged for now - requires further implementation
      console.log(`[cron] Exit trigger for ${userAddress}:`, action.params);
      return {
        success: true,
        details: {
          message: 'Exit trigger detected - requires user action',
          tokens: action.params.tokens,
        },
      };

    case 'compound':
      // Compounding requires LP position management
      console.log(`[cron] Compound trigger for ${userAddress}:`, action.params);
      return {
        success: true,
        details: {
          message: 'Compound trigger detected - LP compounding not yet implemented',
        },
      };

    default:
      return {
        success: false,
        error: `Unknown action type: ${action.type}`,
      };
  }
}

/**
 * Execute fee claiming action
 */
async function executeClaimFeesAction(
  env: Env,
  kv: KVNamespace,
  userAddress: Address,
  action: TriggerAction,
  policy: UnifiedPolicy
): Promise<{ success: boolean; details?: unknown; error?: string }> {
  const tokens = action.params.tokens as Address[];

  // Get agent wallets
  const agentWallets = await getAgentWallets(kv, userAddress);
  if (agentWallets.length === 0) {
    return {
      success: false,
      error: 'No agent wallets found for user',
    };
  }

  // Get agent private key
  const agentKey = await getAgentPrivateKey(kv, userAddress, 'primary');
  if (!agentKey) {
    return {
      success: false,
      error: 'No agent key found - autonomous claiming requires agent setup',
    };
  }

  // Execute claim
  const claimResult = await executeClaimAll(env, agentKey, tokens);

  // Distribute WETH if strategy is configured
  let distributionResult;
  if (policy.wethStrategy && claimResult.totalWethClaimed !== '0') {
    const wethWei = parseEther(claimResult.totalWethClaimed);
    distributionResult = await distributeWeth(env, agentKey, wethWei, policy.wethStrategy);
  }

  return {
    success: claimResult.claims.some(c => c.success),
    details: {
      claim: claimResult,
      distribution: distributionResult,
    },
  };
}

/**
 * Process delegated fee claims for a single treasury address.
 *
 * For each delegated DeFi agent:
 * 1. Best-effort executeManagement() on DelegationRouter (audit trail)
 * 2. Claim WETH fees from ClankerFeeLocker using agent's key
 * 3. Split claimed WETH using the agent's feeSplit (default 85/15)
 */
async function processClaimsForTreasury(
  env: Env,
  kv: KVNamespace,
  treasuryAddress: Address,
  treasuryKey: `0x${string}`,
  delegations: { userAddress: string; agentName: string }[]
): Promise<DelegatedClaimResult[]> {
  const results: DelegatedClaimResult[] = [];

  for (const { userAddress, agentName } of delegations) {
    try {
      // Load agent details
      const agent = await getStoredAgent(kv, userAddress as Address, agentName);
      if (!agent) {
        results.push({
          userAddress,
          agentName,
          wethClaimed: '0',
          success: false,
          error: 'Agent not found in KV',
        });
        continue;
      }

      if (!agent.tokenAddress) {
        // Late token discovery: if we have a tokenSymbol, poll Clawnch once (non-blocking)
        if (agent.tokenSymbol) {
          console.log(`[cron:delegated] ${agentName}: no token yet, polling Clawnch for ${agent.tokenSymbol}`);
          const discovered = await pollClawnchForToken(agent.tokenSymbol, agent.address, 1, 0);
          if (discovered) {
            console.log(`[cron:delegated] ${agentName}: discovered token ${discovered}`);
            await updateStoredAgent(kv, userAddress as Address, agentName, { tokenAddress: discovered });
            agent.tokenAddress = discovered;

            // Sign delegation if not yet done
            if (!agent.delegationTxHash && agent.delegatedTo && env.DELEGATION_ROUTER) {
              const delResult = await signAndSubmitDelegation(env, {
                agentPrivateKey: agent.encryptedKey as `0x${string}`,
                agentAddress: agent.address,
                providerAddress: agent.delegatedTo,
                tokens: [discovered],
              });
              if (delResult.success) {
                await updateStoredAgent(kv, userAddress as Address, agentName, { delegationTxHash: delResult.txHash });
                console.log(`[cron:delegated] ${agentName}: delegation signed, tx=${delResult.txHash}`);
              } else {
                console.warn(`[cron:delegated] ${agentName}: delegation failed: ${delResult.error}`);
              }
            }
          } else {
            // Token not yet deployed — skip, will retry next cron tick
            results.push({
              userAddress,
              agentName,
              agentAddress: agent.address,
              wethClaimed: '0',
              success: true,
              error: `Token ${agent.tokenSymbol} not yet deployed — will retry`,
            });
            continue;
          }
        } else {
          results.push({
            userAddress,
            agentName,
            agentAddress: agent.address,
            wethClaimed: '0',
            success: true,
            error: 'No token address or symbol — skipping',
          });
          continue;
        }
      }

      // Step 1: Best-effort executeManagement for audit trail
      let managementTxHash: string | undefined;
      const mgmtResult = await executeManagementOnChain(
        env,
        treasuryKey,
        agent.address
      );
      if (mgmtResult.success) {
        managementTxHash = mgmtResult.txHash;
      } else {
        console.log(`[cron:delegated] executeManagement skipped for ${agentName}: ${mgmtResult.error}`);
      }

      // Step 2: Claim fees using agent's own key
      const agentKey = agent.encryptedKey as `0x${string}`;
      const claimResult = await executeClaimAll(env, agentKey, [agent.tokenAddress]);

      if (claimResult.totalWethClaimed === '0') {
        results.push({
          userAddress,
          agentName,
          agentAddress: agent.address,
          tokenAddress: agent.tokenAddress,
          wethClaimed: '0',
          managementTxHash,
          success: true,
          error: 'No fees to claim',
        });
        continue;
      }

      // Step 3: Check distribution mode and schedule
      const distMode = agent.distributionMode ?? 'auto';
      const shouldDistribute =
        distMode === 'auto' &&
        isDueForDistribution(agent.lastDistributionTime, agent.distributionSchedule);

      if (!shouldDistribute) {
        // Fees claimed but not distributed — WETH stays in agent wallet
        const reason = distMode === 'manual'
          ? 'Manual mode — WETH held in agent wallet'
          : 'Auto mode — not yet due per schedule';

        console.log(`[cron:delegated] ${agentName}: claimed ${claimResult.totalWethClaimed} WETH, skipping distribution (${reason})`);

        // Record claim (no distribution)
        await recordClaim(kv, userAddress, {
          agentName,
          tokenAddress: agent.tokenAddress!,
          wethClaimed: claimResult.totalWethClaimed,
          deployerAmount: '0',
          serviceFee: '0',
          claimTxHash: claimResult.txHash,
          timestamp: Date.now(),
          mode: distMode,
        });

        results.push({
          userAddress,
          agentName,
          agentAddress: agent.address,
          tokenAddress: agent.tokenAddress,
          wethClaimed: claimResult.totalWethClaimed,
          managementTxHash,
          success: true,
          error: reason,
        });
        continue;
      }

      // Step 4: Distribute WETH using agent's feeSplit (default 85%)
      const feeSplitPct = agent.feeSplit ?? 85;
      const wethWei = parseEther(claimResult.totalWethClaimed);
      const distResult = await distributeToDeployer(
        env,
        agentKey,
        wethWei,
        userAddress as Address,
        treasuryAddress,
        feeSplitPct
      );

      // Update distribution timestamps on agent
      const now = Date.now();
      const nextTime = agent.distributionSchedule
        ? computeNextDistributionTime(now, agent.distributionSchedule)
        : undefined;
      await updateStoredAgent(kv, userAddress as Address, agentName, {
        lastDistributionTime: now,
        nextDistributionTime: nextTime,
      });

      // Record claim with distribution
      await recordClaim(kv, userAddress, {
        agentName,
        tokenAddress: agent.tokenAddress!,
        wethClaimed: claimResult.totalWethClaimed,
        deployerAmount: distResult.deployerAmount,
        serviceFee: distResult.serviceFee,
        claimTxHash: claimResult.txHash,
        distributionTxHash: distResult.txHash,
        timestamp: now,
        mode: 'auto',
      });

      results.push({
        userAddress,
        agentName,
        agentAddress: agent.address,
        tokenAddress: agent.tokenAddress,
        wethClaimed: claimResult.totalWethClaimed,
        deployerAmount: distResult.deployerAmount,
        serviceFee: distResult.serviceFee,
        claimTxHash: claimResult.txHash,
        distributionTxHash: distResult.txHash,
        managementTxHash,
        success: distResult.success,
        error: distResult.error,
      });

      console.log(`[cron:delegated] ${agentName}: claimed ${claimResult.totalWethClaimed} WETH, deployer gets ${distResult.deployerAmount} (${feeSplitPct}%), fee ${distResult.serviceFee}`);
    } catch (error) {
      console.error(`[cron:delegated] Error processing ${agentName}:`, error);
      results.push({
        userAddress,
        agentName,
        wethClaimed: '0',
        success: false,
        error: String(error),
      });
    }
  }

  return results;
}

/**
 * Handle delegated fee claims for all treasury agents.
 *
 * 1. Process env.PRIVATE_KEY treasury (backward compat)
 * 2. Iterate all registered portfolio treasuries from treasuryAgents:all
 */
async function handleDelegatedFeeClaims(
  env: Env,
  kv: KVNamespace
): Promise<DelegatedClaimResult[]> {
  const allResults: DelegatedClaimResult[] = [];

  // 1. Process env.PRIVATE_KEY treasury (backward compat)
  let envTreasuryAddress: Address | null = null;
  if (env.PRIVATE_KEY) {
    const treasuryAccount = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);
    envTreasuryAddress = treasuryAccount.address;

    const delegations = await getDelegationIndex(kv, envTreasuryAddress);
    if (delegations.length > 0) {
      console.log(`[cron:delegated] Found ${delegations.length} delegated agents for env treasury ${envTreasuryAddress}`);
      const results = await processClaimsForTreasury(
        env, kv, envTreasuryAddress, env.PRIVATE_KEY as `0x${string}`, delegations
      );
      allResults.push(...results);
    }
  }

  // 2. Process all registered portfolio treasuries
  const treasuryAgents = await getAllTreasuryAgents(kv);
  if (treasuryAgents.length > 0) {
    console.log(`[cron:delegated] Found ${treasuryAgents.length} registered portfolio treasuries`);
  }

  for (const entry of treasuryAgents) {
    // Skip if same as env.PRIVATE_KEY treasury (already processed)
    if (envTreasuryAddress && entry.treasuryAddress.toLowerCase() === envTreasuryAddress.toLowerCase()) {
      continue;
    }

    // Load the treasury agent to get its private key
    const treasuryAgent = await getStoredAgent(kv, entry.userAddress, entry.agentName);
    if (!treasuryAgent) {
      console.warn(`[cron:delegated] Treasury agent ${entry.agentName} not found in KV, skipping`);
      continue;
    }

    const treasuryKey = treasuryAgent.encryptedKey as `0x${string}`;
    const delegations = await getDelegationIndex(kv, entry.treasuryAddress);
    if (delegations.length === 0) {
      continue;
    }

    console.log(`[cron:delegated] Found ${delegations.length} delegated agents for portfolio treasury ${entry.treasuryAddress}`);
    const results = await processClaimsForTreasury(
      env, kv, entry.treasuryAddress, treasuryKey, delegations
    );
    allResults.push(...results);
  }

  return allResults;
}

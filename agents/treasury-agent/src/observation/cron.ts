import type { Env } from '../index';
import { evaluate, listPolicyUsers, type EvaluationResult } from './loop';

export interface CronResult {
  timestamp: string;
  usersProcessed: number;
  results: Array<{
    userAddress: string;
    result: EvaluationResult;
  }>;
}

/**
 * Handle scheduled cron trigger
 * Iterates through all users with active policies and evaluates each
 */
export async function handleScheduledTrigger(
  env: Env,
  kv: KVNamespace
): Promise<CronResult> {
  const timestamp = new Date().toISOString();
  console.log(`[cron] Scheduled trigger running at: ${timestamp}`);

  // Get all users with active policies
  const users = await listPolicyUsers(kv);
  console.log(`[cron] Found ${users.length} users with active policies`);

  const results: CronResult['results'] = [];

  // Evaluate each user
  for (const userAddress of users) {
    try {
      const result = await evaluate(env, kv, userAddress, {
        trigger: 'cron',
      });

      results.push({ userAddress, result });

      if (result.evaluated && result.hasDrift) {
        console.log(`[cron] Drift detected for ${userAddress}`);
      }
    } catch (error) {
      console.error(`[cron] Error evaluating ${userAddress}:`, error);
      results.push({
        userAddress,
        result: {
          evaluated: false,
          skipped: true,
          skipReason: 'no_policy', // Treat errors as skip
        },
      });
    }
  }

  console.log(`[cron] Completed processing ${users.length} users`);

  return {
    timestamp,
    usersProcessed: users.length,
    results,
  };
}

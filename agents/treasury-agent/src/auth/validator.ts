/**
 * Authorization validation for rebalance execution
 * OIK-42: Authorization validation during rebalance execution
 */

import type { Address } from 'viem';
import { loadAuthorization, type UserAuthorization } from '../observation/loop';
import { getDailySpent } from './spending';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  authorization?: UserAuthorization;
}

/**
 * Validate that a user is authorized to execute a rebalance
 *
 * Checks:
 * 1. Authorization exists
 * 2. Authorization has not expired
 * 3. Daily USD limit has not been exceeded
 * 4. Tokens are in the allowed list (if allowedTokens is specified)
 */
export async function validateAuthorization(
  kv: KVNamespace,
  userAddress: Address,
  tokenIn: Address,
  tokenOut: Address,
  amountUsd: number
): Promise<ValidationResult> {
  // 1. Check authorization exists
  const auth = await loadAuthorization(kv, userAddress);

  if (!auth) {
    return {
      valid: false,
      error: 'No authorization found for this address',
    };
  }

  // 2. Check expiry
  if (auth.expiry <= Date.now()) {
    return {
      valid: false,
      error: 'Authorization has expired',
      authorization: auth,
    };
  }

  // 3. Check daily limit
  const dailySpent = await getDailySpent(kv, userAddress);
  if (dailySpent + amountUsd > auth.maxDailyUsd) {
    return {
      valid: false,
      error: `Daily limit exceeded. Spent: $${dailySpent.toFixed(2)}, Limit: $${auth.maxDailyUsd}, Requested: $${amountUsd.toFixed(2)}`,
      authorization: auth,
    };
  }

  // 4. Check allowed tokens (if specified)
  if (auth.allowedTokens && auth.allowedTokens.length > 0) {
    const allowedLower = auth.allowedTokens.map((t) => t.toLowerCase());
    const tokenInAllowed = allowedLower.includes(tokenIn.toLowerCase());
    const tokenOutAllowed = allowedLower.includes(tokenOut.toLowerCase());

    if (!tokenInAllowed) {
      return {
        valid: false,
        error: `Token ${tokenIn} is not in the allowed tokens list`,
        authorization: auth,
      };
    }

    if (!tokenOutAllowed) {
      return {
        valid: false,
        error: `Token ${tokenOut} is not in the allowed tokens list`,
        authorization: auth,
      };
    }
  }

  // All checks passed
  return {
    valid: true,
    authorization: auth,
  };
}

/**
 * Quick check if authorization exists and is not expired
 * (without checking limits or tokens)
 */
export async function hasValidAuthorization(
  kv: KVNamespace,
  userAddress: Address
): Promise<boolean> {
  const auth = await loadAuthorization(kv, userAddress);
  return auth !== null && auth.expiry > Date.now();
}

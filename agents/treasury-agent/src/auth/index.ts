/**
 * Authorization module
 * OIK-42: Authorization validation during rebalance execution
 */

export { validateAuthorization, hasValidAuthorization, type ValidationResult } from './validator';
export { getDailySpent, trackSpending, canSpend } from './spending';

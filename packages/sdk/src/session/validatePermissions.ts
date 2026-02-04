import type { SessionKeyConfig, PermissionEntry } from './types';
import { OIKONOMOS_PERMISSION_SCOPE } from './constants';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that a session key configuration only allows safe operations
 */
export function validateSessionPermissions(
  config: SessionKeyConfig
): ValidationResult {
  const errors: string[] = [];

  // Check for blocked functions
  for (const fn of config.allowedFunctions) {
    if (OIKONOMOS_PERMISSION_SCOPE.blocked.includes(fn as typeof OIKONOMOS_PERMISSION_SCOPE.blocked[number])) {
      errors.push(`Blocked function not allowed: ${fn}`);
    }
  }

  // Validate time bounds
  const now = Math.floor(Date.now() / 1000);
  if (config.validAfter > config.validUntil) {
    errors.push('validAfter must be before validUntil');
  }
  if (config.validUntil < now) {
    errors.push('Session has already expired');
  }

  // Validate max validity period (defense in depth)
  const maxValidity = 365 * 24 * 60 * 60; // 1 year max
  if (config.validUntil - config.validAfter > maxValidity) {
    errors.push('Session validity period exceeds maximum (1 year)');
  }

  // Validate targets are provided
  if (config.allowedTargets.length === 0) {
    errors.push('At least one target address must be specified');
  }

  // Validate functions are provided
  if (config.allowedFunctions.length === 0) {
    errors.push('At least one function must be specified');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a specific operation is allowed by the session config
 */
export function isOperationAllowed(
  config: SessionKeyConfig,
  target: `0x${string}`,
  functionName: string
): boolean {
  // Check if target is in allowed list
  const targetAllowed = config.allowedTargets.some(
    (t) => t.toLowerCase() === target.toLowerCase()
  );
  if (!targetAllowed) return false;

  // Check if function is in allowed list
  const functionAllowed = config.allowedFunctions.includes(functionName);
  if (!functionAllowed) return false;

  // Check blocked list (defense in depth)
  if (OIKONOMOS_PERMISSION_SCOPE.blocked.includes(functionName as typeof OIKONOMOS_PERMISSION_SCOPE.blocked[number])) {
    return false;
  }

  return true;
}

/**
 * Creates a default session config for Oikonomos operations
 */
export function createDefaultSessionConfig(
  agentAddress: `0x${string}`,
  addresses: {
    intentRouter: `0x${string}`;
    universalRouter?: `0x${string}`;
    positionManager?: `0x${string}`;
  },
  options?: {
    validityDays?: number;
    maxDailyUsd?: number;
  }
): SessionKeyConfig {
  const now = Math.floor(Date.now() / 1000);
  const validitySeconds = (options?.validityDays ?? 30) * 24 * 60 * 60;

  const allowedTargets: `0x${string}`[] = [addresses.intentRouter];
  if (addresses.universalRouter) allowedTargets.push(addresses.universalRouter);
  if (addresses.positionManager) allowedTargets.push(addresses.positionManager);

  const allowedFunctions: string[] = ['executeIntent'];
  if (addresses.universalRouter) allowedFunctions.push('execute');
  if (addresses.positionManager) {
    allowedFunctions.push('modifyLiquidity', 'collect');
  }

  return {
    agentAddress,
    allowedTargets,
    allowedFunctions,
    validAfter: now,
    validUntil: now + validitySeconds,
    maxDailyUsd: options?.maxDailyUsd ?? OIKONOMOS_PERMISSION_SCOPE.defaults.maxDailyUsd,
  };
}

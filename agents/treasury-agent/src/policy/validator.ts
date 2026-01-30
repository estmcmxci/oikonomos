import type { Policy, TokenAllocation } from './templates';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePolicy(policy: Policy): ValidationResult {
  const errors: string[] = [];

  // Check policy type
  if (!policy.type) {
    errors.push('Policy type is required');
  }

  // Validate tokens
  if (!policy.tokens || !Array.isArray(policy.tokens)) {
    errors.push('Tokens array is required');
  } else {
    // Check each token
    policy.tokens.forEach((token, index) => {
      if (!token.address) {
        errors.push(`Token ${index}: address is required`);
      } else if (!isValidAddress(token.address)) {
        errors.push(`Token ${index}: invalid address format`);
      }

      if (token.targetPercentage === undefined) {
        errors.push(`Token ${index}: targetPercentage is required`);
      } else if (token.targetPercentage < 0 || token.targetPercentage > 100) {
        errors.push(`Token ${index}: targetPercentage must be between 0 and 100`);
      }
    });

    // Check that allocations sum to 100%
    const totalAllocation = policy.tokens.reduce(
      (sum, token) => sum + (token.targetPercentage || 0),
      0
    );
    if (Math.abs(totalAllocation - 100) > 0.01) {
      errors.push(`Token allocations must sum to 100%, got ${totalAllocation}%`);
    }
  }

  // Validate drift threshold
  if (policy.driftThreshold !== undefined) {
    if (policy.driftThreshold < 0.1 || policy.driftThreshold > 50) {
      errors.push('driftThreshold must be between 0.1 and 50 percent');
    }
  }

  // Validate max slippage
  if (policy.maxSlippageBps !== undefined) {
    if (policy.maxSlippageBps < 1 || policy.maxSlippageBps > 1000) {
      errors.push('maxSlippageBps must be between 1 and 1000 (0.01% to 10%)');
    }
  }

  // Validate max daily
  if (policy.maxDailyUsd !== undefined) {
    if (policy.maxDailyUsd < 0) {
      errors.push('maxDailyUsd must be non-negative');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validateTokenAllocation(allocation: TokenAllocation): string[] {
  const errors: string[] = [];

  if (!allocation.address) {
    errors.push('Token address is required');
  }

  if (allocation.targetPercentage < 0 || allocation.targetPercentage > 100) {
    errors.push('Target percentage must be between 0 and 100');
  }

  return errors;
}

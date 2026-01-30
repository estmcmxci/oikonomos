import type { Address } from 'viem';
import type { Policy, TokenAllocation } from '../policy/templates';

interface ThresholdResult {
  exceeded: boolean;
  violations: ThresholdViolation[];
}

interface ThresholdViolation {
  token: Address;
  symbol: string;
  currentPercentage: number;
  threshold: number;
  direction: 'above' | 'below';
}

interface TokenBalance {
  address: Address;
  symbol: string;
  balance: bigint;
  targetPercentage: number;
}

export function checkThresholds(
  balances: TokenBalance[],
  thresholds: { min: number; max: number }
): ThresholdResult {
  const totalBalance = balances.reduce((sum, t) => sum + t.balance, 0n);

  if (totalBalance === 0n) {
    return { exceeded: false, violations: [] };
  }

  const violations: ThresholdViolation[] = [];

  for (const token of balances) {
    const percentage = Number((token.balance * 10000n) / totalBalance) / 100;

    if (percentage > thresholds.max) {
      violations.push({
        token: token.address,
        symbol: token.symbol,
        currentPercentage: percentage,
        threshold: thresholds.max,
        direction: 'above',
      });
    } else if (percentage < thresholds.min) {
      violations.push({
        token: token.address,
        symbol: token.symbol,
        currentPercentage: percentage,
        threshold: thresholds.min,
        direction: 'below',
      });
    }
  }

  return {
    exceeded: violations.length > 0,
    violations,
  };
}

export function calculateThresholds(
  targetPercentage: number,
  driftThreshold: number
): { min: number; max: number } {
  return {
    min: Math.max(0, targetPercentage - driftThreshold),
    max: Math.min(100, targetPercentage + driftThreshold),
  };
}

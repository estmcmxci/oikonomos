import type { Policy } from '../policy/templates';

interface PeriodicTriggerResult {
  shouldTrigger: boolean;
  lastRebalance: number;
  nextRebalance: number;
  intervalSeconds: number;
}

export function checkPeriodicTrigger(
  policy: Policy,
  lastRebalanceTimestamp: number
): PeriodicTriggerResult {
  const interval = policy.rebalanceInterval || 86400; // Default: 24 hours
  const now = Math.floor(Date.now() / 1000);
  const nextRebalance = lastRebalanceTimestamp + interval;
  const shouldTrigger = now >= nextRebalance;

  return {
    shouldTrigger,
    lastRebalance: lastRebalanceTimestamp,
    nextRebalance,
    intervalSeconds: interval,
  };
}

export function getNextScheduledTime(
  lastRebalanceTimestamp: number,
  intervalSeconds: number
): Date {
  const nextTimestamp = lastRebalanceTimestamp + intervalSeconds;
  return new Date(nextTimestamp * 1000);
}

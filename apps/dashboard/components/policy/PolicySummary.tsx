'use client';

import { type PolicyConfig } from '@/hooks/usePolicy';
import { Card, CardLabel } from '@/components/ui/Card';

interface PolicySummaryProps {
  config: PolicyConfig;
}

export function PolicySummary({ config }: PolicySummaryProps) {
  return (
    <Card variant="highlight" padding="md">
      <CardLabel className="mb-3 block">Policy Summary</CardLabel>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">Target Allocations</span>
          <span className="text-[var(--color-text-primary)] font-mono">
            {config.allocations.map((a) => `${a.symbol}: ${a.percentage}%`).join(', ')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">Drift Threshold</span>
          <span className="text-[var(--color-text-primary)] font-mono tabular-nums">{config.driftThreshold}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">Max Slippage</span>
          <span className="text-[var(--color-text-primary)] font-mono tabular-nums">{config.maxSlippageBps} bps</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">Daily Limit</span>
          <span className="text-[var(--color-text-primary)] font-mono tabular-nums">${config.maxDailyUsd.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">Trigger</span>
          <span className="text-[var(--color-text-primary)] capitalize">{config.triggerType}</span>
        </div>
      </div>
    </Card>
  );
}

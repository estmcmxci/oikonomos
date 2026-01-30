'use client';

import { usePolicy } from '@/hooks/usePolicy';
import { AllocationSlider } from './AllocationSlider';
import { PolicySummary } from './PolicySummary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CardTitle, CardLabel } from '@/components/ui/Card';

interface PolicyConfiguratorProps {
  agentUrl?: string;
  onSuccess?: () => void;
}

export function PolicyConfigurator({ agentUrl, onSuccess }: PolicyConfiguratorProps) {
  const {
    config,
    updateAllocation,
    updateConstraint,
    submitPolicy,
    isSubmitting,
    isConnected,
    error,
  } = usePolicy(agentUrl);

  const handleSubmit = async () => {
    try {
      await submitPolicy();
      onSuccess?.();
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-8">
      {/* Allocation Section */}
      <section>
        <CardTitle size="lg" className="mb-4">Target Allocation</CardTitle>
        {config.allocations.map((alloc, i) => (
          <AllocationSlider
            key={alloc.token}
            symbol={alloc.symbol}
            percentage={alloc.percentage}
            onChange={(value) => updateAllocation(i, value)}
          />
        ))}
      </section>

      {/* Constraints Section */}
      <section>
        <CardTitle size="lg" className="mb-4">Constraints</CardTitle>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Drift Threshold (%)"
            type="number"
            value={config.driftThreshold}
            onChange={(e) => updateConstraint('driftThreshold', Number(e.target.value))}
          />
          <Input
            label="Max Slippage (bps)"
            type="number"
            value={config.maxSlippageBps}
            onChange={(e) => updateConstraint('maxSlippageBps', Number(e.target.value))}
          />
          <Input
            label="Max Daily (USD)"
            type="number"
            value={config.maxDailyUsd}
            onChange={(e) => updateConstraint('maxDailyUsd', Number(e.target.value))}
          />
          <div>
            <CardLabel className="mb-2 block">Trigger Type</CardLabel>
            <select
              value={config.triggerType}
              onChange={(e) => updateConstraint('triggerType', e.target.value as 'drift' | 'periodic')}
              className="w-full h-10 px-3 bg-[var(--color-bg-raised)] rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-strong)] focus:ring-2 focus:ring-[var(--color-interactive)]/20 transition-colors"
            >
              <option value="drift">Drift-based</option>
              <option value="periodic">Periodic</option>
            </select>
          </div>
        </div>
      </section>

      {/* Summary */}
      <PolicySummary config={config} />

      {/* Error */}
      {error && (
        <div className="p-3 bg-[var(--color-danger-muted)] border border-[var(--color-danger)]/30 rounded-lg text-[var(--color-danger)] text-sm">
          {error.message}
        </div>
      )}

      {/* Submit */}
      <Button
        variant="default"
        className="w-full"
        onClick={handleSubmit}
        disabled={!isConnected || isSubmitting}
      >
        {!isConnected
          ? 'Connect Wallet'
          : isSubmitting
            ? 'Configuring...'
            : 'Configure Policy'}
      </Button>
    </div>
  );
}

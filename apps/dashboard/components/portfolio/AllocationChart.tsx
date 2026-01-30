'use client';

import { type PortfolioPosition } from '@/hooks/usePortfolio';
import { CardLabel } from '@/components/ui/Card';

interface AllocationChartProps {
  positions: PortfolioPosition[];
}

// Brand-aligned colors
const COLORS = [
  'var(--color-brand-blue)',
  'var(--color-brand-purple)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-info)',
];

export function AllocationChart({ positions }: AllocationChartProps) {
  const total = positions.reduce((sum, p) => sum + p.valueUsd, 0);

  return (
    <div className="space-y-4">
      {/* Simple bar chart */}
      <div className="h-3 flex rounded-full overflow-hidden bg-[var(--color-bg-base)]">
        {positions.map((position, i) => (
          <div
            key={position.token}
            className="h-full transition-all"
            style={{
              width: `${position.currentPercentage}%`,
              backgroundColor: COLORS[i % COLORS.length],
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {positions.map((position, i) => (
          <div key={position.token} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-sm text-[var(--color-text-primary)]">
              {position.symbol}
            </span>
            <span className="text-sm font-mono tabular-nums text-[var(--color-text-secondary)]">
              {position.currentPercentage.toFixed(1)}%
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">
              (${position.valueUsd.toLocaleString()})
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border-subtle)]">
        <CardLabel>Total Value</CardLabel>
        <span className="text-lg font-semibold text-[var(--color-text-primary)] tabular-nums">
          ${total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

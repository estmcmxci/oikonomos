'use client';

import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';

interface DriftIndicatorProps {
  drift: number;
  threshold?: number;
}

export function DriftIndicator({ drift, threshold = 5 }: DriftIndicatorProps) {
  const isOverThreshold = Math.abs(drift) > threshold;
  const isPositive = drift > 0;

  return (
    <div className="flex items-center gap-2">
      <span
        className={clsx(
          'font-mono text-sm tabular-nums',
          isOverThreshold
            ? 'text-[var(--color-danger)]'
            : isPositive
              ? 'text-[var(--color-success)]'
              : 'text-[var(--color-text-tertiary)]'
        )}
      >
        {drift > 0 ? '+' : ''}{drift.toFixed(2)}%
      </span>
      {isOverThreshold && (
        <Badge variant="danger" size="sm">
          Rebalance needed
        </Badge>
      )}
    </div>
  );
}

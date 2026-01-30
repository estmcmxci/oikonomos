'use client';

import { CardLabel } from '@/components/ui/Card';

interface TrustScoreProps {
  erc8004?: string;
}

export function TrustScore({ erc8004 }: TrustScoreProps) {
  if (!erc8004) {
    return (
      <div className="p-4 bg-[var(--color-bg-overlay)] rounded-lg">
        <p className="text-sm text-[var(--color-text-tertiary)]">No ERC-8004 attestation found</p>
      </div>
    );
  }

  // Parse ERC-8004 attestation (simplified)
  const score = 85; // Would parse from erc8004 data
  const scoreColor = score >= 80 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div className="p-4 bg-[var(--color-bg-overlay)] rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <CardLabel>Trust Score</CardLabel>
        <span className="text-lg font-semibold" style={{ color: scoreColor }}>
          {score}/100
        </span>
      </div>
      <div className="w-full bg-[var(--color-bg-base)] rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${score}%`,
            backgroundColor: scoreColor,
          }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-muted)] truncate font-mono">
        ERC-8004: {erc8004}
      </p>
    </div>
  );
}

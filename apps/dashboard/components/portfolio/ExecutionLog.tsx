'use client';

import Link from 'next/link';
import { type ExecutionReceipt } from '@oikonomos/shared';
import { Badge } from '@/components/ui/Badge';
import { formatUnits } from 'viem';

interface ExecutionLogProps {
  receipts: ExecutionReceipt[];
}

export function ExecutionLog({ receipts }: ExecutionLogProps) {
  if (receipts.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-tertiary)]">
        No executions yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {receipts.map((receipt) => (
        <Link
          key={receipt.transactionHash}
          href={`/receipt/${receipt.transactionHash}`}
          className="block p-4 bg-[var(--color-bg-raised)] rounded-lg border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-default)] transition-colors"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-[var(--color-text-tertiary)]">
              {new Date(Number(receipt.timestamp) * 1000).toLocaleString()}
            </span>
            <Badge variant={receipt.policyCompliant ? 'success' : 'danger'} dot>
              {receipt.policyCompliant ? 'Compliant' : 'Violation'}
            </Badge>
          </div>
          <div className="flex gap-4 text-sm font-mono tabular-nums">
            <span className="text-[var(--color-text-secondary)]">
              Token 0: {formatUnits(receipt.amount0 < 0n ? -receipt.amount0 : receipt.amount0, 6)}
            </span>
            <span className="text-[var(--color-text-secondary)]">
              Token 1: {formatUnits(receipt.amount1 < 0n ? -receipt.amount1 : receipt.amount1, 6)}
            </span>
            <span className="text-[var(--color-text-muted)]">
              Slippage: {receipt.actualSlippage.toString()} bps
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

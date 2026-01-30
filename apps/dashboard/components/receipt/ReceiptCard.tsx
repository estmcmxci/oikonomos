'use client';

import { type ExecutionReceipt } from '@oikonomos/shared';
import { Badge } from '@/components/ui/Badge';
import { Card, CardTitle, CardLabel } from '@/components/ui/Card';
import { ComplianceCheck } from './ComplianceCheck';
import { ProofLinks } from './ProofLinks';
import { formatUnits } from 'viem';

interface ReceiptCardProps {
  receipt: ExecutionReceipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const formatAmount = (amount: bigint, decimals = 6) => {
    const isNegative = amount < 0n;
    const abs = isNegative ? -amount : amount;
    const sign = isNegative ? '-' : '+';
    return `${sign}${formatUnits(abs, decimals)}`;
  };

  return (
    <Card variant="elevated">
      <div className="flex justify-between items-start mb-4">
        <CardTitle size="lg">Execution Receipt</CardTitle>
        <Badge variant={receipt.policyCompliant ? 'success' : 'danger'} dot>
          {receipt.policyCompliant ? 'Compliant' : 'Violation'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <CardLabel>Input (Token 0)</CardLabel>
          <p className="font-mono text-[var(--color-text-primary)] mt-1 tabular-nums">
            {formatAmount(receipt.amount0)}
          </p>
        </div>
        <div>
          <CardLabel>Output (Token 1)</CardLabel>
          <p className="font-mono text-[var(--color-text-primary)] mt-1 tabular-nums">
            {formatAmount(receipt.amount1)}
          </p>
        </div>
        <div>
          <CardLabel>Slippage</CardLabel>
          <p className="font-mono text-[var(--color-text-primary)] mt-1 tabular-nums">
            {receipt.actualSlippage.toString()} bps
          </p>
        </div>
        <div>
          <CardLabel>Timestamp</CardLabel>
          <p className="font-mono text-[var(--color-text-primary)] mt-1">
            {new Date(Number(receipt.timestamp) * 1000).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <CardLabel className="mb-2 block">Strategy ID</CardLabel>
        <p className="font-mono text-xs break-all bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)] p-3 rounded-lg">
          {receipt.strategyId}
        </p>
      </div>

      <div className="mb-6">
        <CardLabel className="mb-2 block">Quote ID</CardLabel>
        <p className="font-mono text-xs break-all bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)] p-3 rounded-lg">
          {receipt.quoteId}
        </p>
      </div>

      <ComplianceCheck receipt={receipt} />

      <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
        <ProofLinks txHash={receipt.transactionHash} blockNumber={receipt.blockNumber} />
      </div>
    </Card>
  );
}

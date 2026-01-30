'use client';

import { type ExecutionReceipt } from '@oikonomos/shared';
import { Badge } from '@/components/ui/Badge';
import { CardLabel } from '@/components/ui/Card';

interface ComplianceCheckProps {
  receipt: ExecutionReceipt;
}

export function ComplianceCheck({ receipt }: ComplianceCheckProps) {
  const checks = [
    {
      label: 'Slippage within limits',
      passed: receipt.actualSlippage <= 25n,
      value: `${receipt.actualSlippage.toString()} bps`,
    },
    {
      label: 'Policy compliant',
      passed: receipt.policyCompliant,
      value: receipt.policyCompliant ? 'Yes' : 'No',
    },
  ];

  return (
    <div className="space-y-2">
      <CardLabel className="mb-2 block">Compliance Checks</CardLabel>
      {checks.map((check) => (
        <div
          key={check.label}
          className="flex justify-between items-center text-sm p-2 bg-[var(--color-bg-overlay)] rounded-lg"
        >
          <span className="text-[var(--color-text-secondary)]">{check.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text-tertiary)] font-mono tabular-nums">{check.value}</span>
            <Badge variant={check.passed ? 'success' : 'danger'} size="sm">
              {check.passed ? 'Pass' : 'Fail'}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { use } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useReceipt } from '@/hooks/useReceipts';
import { ReceiptCard } from '@/components/receipt/ReceiptCard';

interface Props {
  params: Promise<{ txHash: string }>;
}

export default function ReceiptPage({ params }: Props) {
  const { txHash } = use(params);
  const { receipt, isLoading, error } = useReceipt(txHash);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-[var(--color-text-tertiary)]">Loading receipt...</div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <Link
              href="/portfolio"
              className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] text-sm mb-2 inline-block"
            >
              &larr; Back to portfolio
            </Link>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Receipt Not Found</h1>
          </div>
          <ConnectButton />
        </header>

        <div className="text-[var(--color-danger)]">
          {error?.message || 'No receipt found for this transaction'}
        </div>
        <p className="mt-4 text-[var(--color-text-tertiary)] font-mono text-sm break-all">
          Transaction: {txHash}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <Link
            href="/portfolio"
            className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] text-sm mb-2 inline-block"
          >
            &larr; Back to portfolio
          </Link>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Execution Receipt</h1>
          <p className="text-[var(--color-text-tertiary)] font-mono text-sm">
            {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </p>
        </div>
        <ConnectButton />
      </header>

      {/* Receipt card */}
      <ReceiptCard receipt={receipt} />
    </div>
  );
}

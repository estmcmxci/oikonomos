'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useReceipts } from '@/hooks/useReceipts';
import { Card, CardTitle } from '@/components/ui/Card';
import { ExecutionLog } from '@/components/portfolio/ExecutionLog';

export default function ExecutionHistoryPage() {
  const { isConnected } = useAccount();
  const { receipts, isLoading } = useReceipts();

  if (!isConnected) {
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
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Execution History</h1>
          </div>
          <ConnectButton />
        </header>

        <Card variant="elevated">
          <div className="text-center py-12">
            <p className="text-[var(--color-text-tertiary)] mb-4">
              Connect your wallet to view execution history
            </p>
            <ConnectButton />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <Link
            href="/portfolio"
            className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] text-sm mb-2 inline-block"
          >
            &larr; Back to portfolio
          </Link>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Execution History</h1>
          <p className="text-[var(--color-text-tertiary)]">All your agent executions</p>
        </div>
        <ConnectButton />
      </header>

      {/* Execution history */}
      <Card variant="elevated">
        {isLoading ? (
          <div className="text-[var(--color-text-tertiary)] py-8 text-center">Loading executions...</div>
        ) : (
          <ExecutionLog receipts={receipts} />
        )}
      </Card>
    </div>
  );
}

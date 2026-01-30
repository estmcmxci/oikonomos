'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useReceipts } from '@/hooks/useReceipts';
import { Card, CardTitle, CardLabel, CardValue } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AllocationChart } from '@/components/portfolio/AllocationChart';
import { DriftIndicator } from '@/components/portfolio/DriftIndicator';
import { ExecutionLog } from '@/components/portfolio/ExecutionLog';

export default function PortfolioPage() {
  const { isConnected } = useAccount();
  const { portfolio, isLoading } = usePortfolio();
  const { receipts } = useReceipts();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <Link
              href="/"
              className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] text-sm mb-2 inline-block"
            >
              &larr; Back to home
            </Link>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Portfolio</h1>
          </div>
          <ConnectButton />
        </header>

        <Card variant="elevated">
          <div className="text-center py-12">
            <p className="text-[var(--color-text-tertiary)] mb-4">
              Connect your wallet to view your portfolio
            </p>
            <ConnectButton />
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-[var(--color-text-tertiary)]">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <Link
            href="/"
            className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] text-sm mb-2 inline-block"
          >
            &larr; Back to home
          </Link>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Portfolio</h1>
          <p className="text-[var(--color-text-tertiary)]">Your managed positions</p>
        </div>
        <ConnectButton />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Allocation chart */}
          <Card variant="elevated">
            <CardTitle size="lg" className="mb-6">Current Allocation</CardTitle>
            {portfolio?.positions && (
              <AllocationChart positions={portfolio.positions} />
            )}
          </Card>

          {/* Positions table */}
          <Card variant="elevated">
            <CardTitle size="lg" className="mb-4">Positions</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[var(--color-border-subtle)]">
                    <th className="pb-3 text-[var(--color-text-tertiary)] font-medium text-[11px] tracking-wider uppercase">Token</th>
                    <th className="pb-3 text-[var(--color-text-tertiary)] font-medium text-[11px] tracking-wider uppercase">Value</th>
                    <th className="pb-3 text-[var(--color-text-tertiary)] font-medium text-[11px] tracking-wider uppercase">Target</th>
                    <th className="pb-3 text-[var(--color-text-tertiary)] font-medium text-[11px] tracking-wider uppercase">Current</th>
                    <th className="pb-3 text-[var(--color-text-tertiary)] font-medium text-[11px] tracking-wider uppercase">Drift</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio?.positions.map((position) => (
                    <tr key={position.token} className="border-b border-[var(--color-border-subtle)]">
                      <td className="py-3 font-medium text-[var(--color-text-primary)]">{position.symbol}</td>
                      <td className="py-3 text-[var(--color-text-secondary)] font-mono tabular-nums">${position.valueUsd.toLocaleString()}</td>
                      <td className="py-3 text-[var(--color-text-secondary)] font-mono tabular-nums">{position.targetPercentage}%</td>
                      <td className="py-3 text-[var(--color-text-secondary)] font-mono tabular-nums">{position.currentPercentage.toFixed(1)}%</td>
                      <td className="py-3">
                        <DriftIndicator drift={position.drift} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Execution history */}
          <Card variant="elevated">
            <div className="flex justify-between items-center mb-4">
              <CardTitle size="lg">Recent Executions</CardTitle>
              <Link
                href="/portfolio/history"
                className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] text-sm"
              >
                View all &rarr;
              </Link>
            </div>
            <ExecutionLog receipts={receipts.slice(0, 5)} />
          </Card>
        </div>

        {/* Right column - Summary */}
        <div className="space-y-6">
          {/* Portfolio summary */}
          <Card variant="highlight">
            <CardTitle className="mb-4">Summary</CardTitle>
            <div className="space-y-4">
              <div>
                <CardLabel>Total Value</CardLabel>
                <CardValue size="lg">
                  ${portfolio?.totalValueUsd.toLocaleString() || '0'}
                </CardValue>
              </div>
              <div>
                <CardLabel>Positions</CardLabel>
                <CardValue size="md">
                  {portfolio?.positions.length || 0}
                </CardValue>
              </div>
              {portfolio?.lastRebalance && (
                <div>
                  <CardLabel>Last Rebalance</CardLabel>
                  <p className="text-lg text-[var(--color-text-primary)]">
                    {portfolio.lastRebalance.toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick actions */}
          <Card variant="elevated">
            <CardTitle className="mb-4">Quick Actions</CardTitle>
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button variant="default" className="w-full">
                  Find New Agents
                </Button>
              </Link>
              <Link href="/portfolio/history" className="block">
                <Button variant="secondary" className="w-full">
                  View Full History
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

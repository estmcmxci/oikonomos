'use client';

import { use } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAgent } from '@/hooks/useAgent';
import { useReceipts } from '@/hooks/useReceipts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle, CardLabel } from '@/components/ui/Card';
import { TrustScore } from '@/components/agent/TrustScore';
import { ExecutionLog } from '@/components/portfolio/ExecutionLog';
import { getEtherscanAddressUrl } from '@/lib/api';
import { ensNameToStrategyId } from '@oikonomos/sdk';

interface Props {
  params: Promise<{ ensName: string }>;
}

export default function AgentProfilePage({ params }: Props) {
  const { ensName: encodedName } = use(params);
  const ensName = decodeURIComponent(encodedName);
  const { agent, isLoading, error } = useAgent(ensName);

  // Get strategyId for receipts
  const strategyId = ensNameToStrategyId(ensName);
  const { receipts } = useReceipts(strategyId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-[var(--color-text-tertiary)]">Loading agent profile...</div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-[var(--color-danger)]">
          Failed to load agent: {error?.message || 'Agent not found'}
        </div>
        <Link
          href="/"
          className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] mt-4 inline-block"
        >
          &larr; Back to home
        </Link>
      </div>
    );
  }

  const chainName = agent.chainId === 1 ? 'Mainnet' : 'Sepolia';

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
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">{ensName}</h1>
          <p className="text-[var(--color-text-tertiary)]">
            {agent.type} agent &bull; v{agent.version}
          </p>
        </div>
        <ConnectButton />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Agent details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status card */}
          <Card variant="elevated">
            <div className="flex justify-between items-start mb-6">
              <CardTitle size="lg">Agent Details</CardTitle>
              <Badge variant={agent.mode === 'intent-only' ? 'info' : 'brand'}>
                {agent.mode === 'intent-only' ? 'Intent Mode' : 'Safe + Roles'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <CardLabel>Chain</CardLabel>
                <p className="font-mono text-[var(--color-text-primary)] mt-1">
                  {chainName} ({agent.chainId})
                </p>
              </div>
              <div>
                <CardLabel>Type</CardLabel>
                <p className="capitalize text-[var(--color-text-primary)] mt-1">{agent.type}</p>
              </div>
              <div className="col-span-2">
                <CardLabel>Entrypoint</CardLabel>
                <a
                  href={getEtherscanAddressUrl(agent.entrypoint, agent.chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] break-all mt-1 block"
                >
                  {agent.entrypoint}
                </a>
              </div>
              {agent.safe && (
                <div className="col-span-2">
                  <CardLabel>Safe</CardLabel>
                  <a
                    href={getEtherscanAddressUrl(agent.safe, agent.chainId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] break-all mt-1 block"
                  >
                    {agent.safe}
                  </a>
                </div>
              )}
              {agent.a2a && (
                <div className="col-span-2">
                  <CardLabel>A2A Endpoint</CardLabel>
                  <p className="font-mono text-sm break-all text-[var(--color-text-secondary)] mt-1">
                    {agent.a2a}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Execution history */}
          <Card variant="elevated">
            <CardTitle size="lg" className="mb-4">Execution History</CardTitle>
            <ExecutionLog receipts={receipts} />
          </Card>
        </div>

        {/* Right column - Actions and trust */}
        <div className="space-y-6">
          {/* Trust score */}
          {agent.erc8004 && (
            <Card variant="elevated">
              <CardTitle className="mb-4">Trust Score</CardTitle>
              <TrustScore erc8004={agent.erc8004} />
            </Card>
          )}

          {/* Actions */}
          <Card variant="elevated">
            <CardTitle className="mb-4">Actions</CardTitle>
            <div className="space-y-3">
              <Link href={`/agent/${encodeURIComponent(ensName)}/configure`} className="block">
                <Button variant="default" className="w-full">
                  Configure Policy
                </Button>
              </Link>
              <Link href="/portfolio" className="block">
                <Button variant="secondary" className="w-full">
                  View Portfolio
                </Button>
              </Link>
            </div>
          </Card>

          {/* Strategy ID */}
          <Card variant="elevated">
            <CardTitle className="mb-4">Strategy ID</CardTitle>
            <p className="font-mono text-xs break-all bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)] p-3 rounded-lg">
              {strategyId}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

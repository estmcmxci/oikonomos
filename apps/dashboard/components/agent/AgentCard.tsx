'use client';

import Link from 'next/link';
import { type AgentRecord } from '@oikonomos/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardLabel } from '@/components/ui/Card';
import { TrustScore } from './TrustScore';
import { getEtherscanAddressUrl } from '@/lib/api';

interface AgentCardProps {
  agent: AgentRecord;
  ensName: string;
}

export function AgentCard({ agent, ensName }: AgentCardProps) {
  const chainName = agent.chainId === 1 ? 'Mainnet' : 'Sepolia';

  return (
    <Card variant="elevated">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{ensName}</h3>
          <p className="text-[var(--color-text-tertiary)] text-sm">
            {agent.type} agent &bull; v{agent.version}
          </p>
        </div>
        <Badge variant={agent.mode === 'intent-only' ? 'info' : 'brand'}>
          {agent.mode === 'intent-only' ? 'Intent Mode' : 'Safe + Roles'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <CardLabel>Chain</CardLabel>
          <p className="font-mono text-[var(--color-text-primary)] mt-1">
            {chainName} ({agent.chainId})
          </p>
        </div>
        <div>
          <CardLabel>Entrypoint</CardLabel>
          <a
            href={getEtherscanAddressUrl(agent.entrypoint, agent.chainId)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm truncate block text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] mt-1"
          >
            {agent.entrypoint.slice(0, 10)}...{agent.entrypoint.slice(-8)}
          </a>
        </div>
        {agent.safe && (
          <div>
            <CardLabel>Safe</CardLabel>
            <a
              href={getEtherscanAddressUrl(agent.safe, agent.chainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm truncate block text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] mt-1"
            >
              {agent.safe.slice(0, 10)}...{agent.safe.slice(-8)}
            </a>
          </div>
        )}
        {agent.a2a && (
          <div>
            <CardLabel>A2A Endpoint</CardLabel>
            <p className="font-mono text-sm truncate text-[var(--color-text-secondary)] mt-1">{agent.a2a}</p>
          </div>
        )}
      </div>

      {agent.erc8004 && (
        <div className="mb-6">
          <TrustScore erc8004={agent.erc8004} />
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/agent/${encodeURIComponent(ensName)}/configure`} className="flex-1">
          <Button variant="default" className="w-full">
            Configure Policy
          </Button>
        </Link>
        <Link href={`/agent/${encodeURIComponent(ensName)}`} className="flex-1">
          <Button variant="secondary" className="w-full">
            View Details
          </Button>
        </Link>
      </div>
    </Card>
  );
}

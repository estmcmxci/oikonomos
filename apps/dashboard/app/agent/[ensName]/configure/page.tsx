'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAgent } from '@/hooks/useAgent';
import { Card, CardTitle } from '@/components/ui/Card';
import { PolicyConfigurator } from '@/components/policy/PolicyConfigurator';

interface Props {
  params: Promise<{ ensName: string }>;
}

export default function ConfigurePolicyPage({ params }: Props) {
  const { ensName: encodedName } = use(params);
  const ensName = decodeURIComponent(encodedName);
  const router = useRouter();
  const { agent, isLoading, error } = useAgent(ensName);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-[var(--color-text-tertiary)]">Loading agent...</div>
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

  const handleSuccess = () => {
    router.push(`/agent/${encodeURIComponent(ensName)}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <Link
            href={`/agent/${encodeURIComponent(ensName)}`}
            className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)] text-sm mb-2 inline-block"
          >
            &larr; Back to {ensName}
          </Link>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Configure Policy</h1>
          <p className="text-[var(--color-text-tertiary)]">Set your allocation targets and constraints</p>
        </div>
        <ConnectButton />
      </header>

      {/* Configuration form */}
      <Card variant="elevated">
        <PolicyConfigurator
          agentUrl={agent.a2a}
          onSuccess={handleSuccess}
        />
      </Card>
    </div>
  );
}

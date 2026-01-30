'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgentCard } from '@/components/agent/AgentCard';
import { useAgent } from '@/hooks/useAgent';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardTitle, CardLabel, CardValue } from '@/components/ui/Card';

export default function HomePage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('treasury.oikonomos.eth');
  const [ensName, setEnsName] = useState('');
  const { agent, isLoading, error } = useAgent(ensName || undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setEnsName(inputValue.trim());
    }
  };

  const handleViewAgent = () => {
    if (ensName) {
      router.push(`/agent/${encodeURIComponent(ensName)}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-brand-gradient">
          ENS-native Agent Registry
        </h1>
        <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto">
          Discover autonomous agents for Uniswap v4 treasury management.
          Configure policies, verify executions, and maintain full control.
        </p>
      </section>

      {/* Agent Discovery */}
      <section className="mb-12 max-w-2xl mx-auto">
        <Card variant="elevated">
          <CardTitle size="lg" className="mb-4">Discover Agents</CardTitle>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="treasury.oikonomos.eth"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {isLoading && (
            <div className="mt-4 text-[var(--color-text-tertiary)]">
              Resolving {ensName}...
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-[var(--color-danger-muted)] border border-[var(--color-danger)]/30 rounded-lg">
              <p className="text-[var(--color-danger)]">
                Failed to resolve agent: {error.message}
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm mt-2">
                Make sure the ENS name has agent records configured.
              </p>
            </div>
          )}

          {agent && (
            <div className="mt-6">
              <AgentCard agent={agent} ensName={ensName} />
              <div className="mt-4 flex gap-3">
                <Button onClick={handleViewAgent} className="flex-1">
                  View Full Profile
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/agent/${encodeURIComponent(ensName)}/configure`)}
                  className="flex-1"
                >
                  Configure Policy
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <FeatureCard
          title="Policy-Driven"
          description="Define constraints like slippage caps, token allowlists, and daily limits. The agent executes within your rules."
        />
        <FeatureCard
          title="Verifiable Receipts"
          description="Every execution produces an on-chain receipt proving what happened and why."
        />
        <FeatureCard
          title="ENS Discovery"
          description="Find agents via human-readable names like treasury.oikonomos.eth"
        />
      </section>

      {/* Quick Links */}
      <section className="text-center">
        <CardLabel className="mb-4 block">Quick Links</CardLabel>
        <div className="flex justify-center gap-4">
          <Button variant="secondary" onClick={() => router.push('/portfolio')}>
            View Portfolio
          </Button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card variant="interactive">
      <CardTitle size="md" className="mb-2">{title}</CardTitle>
      <p className="text-[var(--color-text-tertiary)] text-sm">{description}</p>
    </Card>
  );
}
